const API_URL = "http://localhost:8080/api";

export class ErroApi extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErroApi";
    this.status = status;
  }
}

export class ErroConexaoApi extends Error {
  constructor() {
    super("Não foi possível conectar ao servidor. Tente novamente.");
    this.name = "ErroConexaoApi";
  }
}

function mensagemPadrao(status: number) {
  if (status === 400 || status === 422) return "Os dados enviados são inválidos. Revise o formulário.";
  if (status === 404) return "O registro solicitado não foi encontrado.";
  if (status === 409) return "A operação conflita com os dados já cadastrados.";
  if (status >= 500) return "O servidor encontrou um erro interno. Tente novamente mais tarde.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function requisitarApi(caminho: string, opcoes: RequestInit = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("sgcs:unauthorized"));
    throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    throw new ErroConexaoApi();
  }

  if (!resposta.ok) {
    if (resposta.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioAtual");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("sgcs:unauthorized"));
      throw new ErroApi("Sua sessão expirou. Entre novamente no sistema.", resposta.status);
    }
    if (resposta.status === 403) {
      throw new ErroApi("Você não tem permissão para realizar esta operação.", resposta.status);
    }
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem = erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string"
      ? erro.message
      : mensagemPadrao(resposta.status);
    throw new ErroApi(mensagem, resposta.status);
  }

  return resposta;
}
