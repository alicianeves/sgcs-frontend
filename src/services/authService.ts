export type LoginRequest = {
  usuario: string;
  senha: string;
};

export type LoginResponse = {
  token: string;
};

export function perfilDoToken(token: string | null): string {
  if (!token) return "Conta do sistema";
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (caractere) => caractere.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!claims || typeof claims !== "object" || !("roles" in claims) || !Array.isArray(claims.roles)) {
      return "Conta do sistema";
    }
    const perfil = claims.roles.find((role): role is string => typeof role === "string");
    const nomes: Record<string, string> = {
      ROLE_ADMINISTRADOR: "Administrador",
      ROLE_ATENDIMENTO_GESTAO: "Atendimento/Gestão",
      ROLE_COLABORADOR: "Colaborador",
      ROLE_PROFESSOR_INSTRUTOR: "Professor/Instrutor",
    };
    return perfil ? nomes[perfil] ?? "Conta do sistema" : "Conta do sistema";
  } catch {
    return "Conta do sistema";
  }
}

export async function login(
  dados: LoginRequest
): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Usuário ou senha inválidos.");
    const erro: unknown = await response.json().catch(() => null);
    const mensagem = erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string"
      ? erro.message
      : "Não foi possível entrar no sistema. Tente novamente.";
    throw new Error(mensagem);
  }

  return response.json();
}
