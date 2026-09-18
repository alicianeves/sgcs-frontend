export type LoginRequest = {
  usuario: string;
  senha: string;
};

export type LoginResponse = {
  token: string;
};

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
    throw new Error(response.status === 401
      ? "Usuário ou senha inválidos."
      : "Não foi possível entrar no sistema. Tente novamente.");
  }

  return response.json();
}
