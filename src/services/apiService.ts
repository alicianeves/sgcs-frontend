const API_URL = "http://localhost:8080/api";

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
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  if (!resposta.ok) {
    if (resposta.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioAtual");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("sgcs:unauthorized"));
      throw new Error("Sua sessão expirou. Entre novamente no sistema.");
    }
    if (resposta.status === 403) {
      throw new Error("Você não tem permissão para realizar esta operação.");
    }
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem = erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string"
      ? erro.message
      : "Não foi possível concluir a operação. Tente novamente.";
    throw new Error(mensagem);
  }

  return resposta;
}
