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
  const response = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error("Usuário ou senha inválidos.");
  }

  return response.json();
}