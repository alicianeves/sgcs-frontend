export const perfis = [
  "Administrador",
  "Atendimento/Gestão",
  "Colaborador",
  "Professor/Instrutor",
] as const;

export type Perfil = (typeof perfis)[number];
export type TipoPessoa = "FISICA" | "JURIDICA";

type PessoaBase = {
  id: string;
  tipo: TipoPessoa;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: boolean;
  dataCriacao: string;
  dataInativacao: string | null;
};

export type Pessoa =
  | (PessoaBase & {
      tipo: "FISICA";
      nome: string;
      cpf: string;
      dataNascimento: string;
      email: string;
      usuario: string;
      perfil: Perfil | "";
      nomeMae?: string;
      sexo?: string;
      estadoCivil?: string;
      rg?: string;
      nis?: string;
      escolaridade?: string;
      ocupacao?: string;
      contato2?: string;
      familiaId?: string;
    })
  | (PessoaBase & {
      tipo: "JURIDICA";
      razaoSocial: string;
      cnpj: string;
    });

const API_URL = "http://localhost:8080/api/pessoas";

const perfisApi = {
  Administrador: "ADMINISTRADOR",
  "Atendimento/Gestão": "ATENDIMENTO_GESTAO",
  Colaborador: "COLABORADOR",
  "Professor/Instrutor": "PROFESSOR_INSTRUTOR",
} as const;
const sexoApi: Record<string, string> = { Feminino: "FEMININO", Masculino: "MASCULINO", Outro: "OUTRO", "Prefere não informar": "PREFERE_NAO_INFORMAR" };
const estadoCivilApi: Record<string, string> = { "Solteiro(a)": "SOLTEIRO_A", "Casado(a)": "CASADO_A", "Divorciado(a)": "DIVORCIADO_A", "Viúvo(a)": "VIUVO_A", "União estável": "UNIAO_ESTAVEL" };
const escolaridadeApi: Record<string, string> = { "Não alfabetizado(a)": "NAO_ALFABETIZADO_A", "Ensino fundamental": "ENSINO_FUNDAMENTAL", "Ensino médio": "ENSINO_MEDIO", "Ensino superior": "ENSINO_SUPERIOR", "Pós-graduação": "POS_GRADUACAO" };

type PessoaApi = Omit<PessoaBase, "id"> & {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  usuario: string | null;
  perfil: string | null;
  razaoSocial: string;
  cnpj: string;
  nomeMae: string | null;
  sexo: string | null;
  estadoCivil: string | null;
  rg: string | null;
  nis: string | null;
  escolaridade: string | null;
  ocupacao: string | null;
  contato2: string | null;
  familiaId: number | null;
};

export type DadosPessoa = Omit<PessoaBase, "id" | "status" | "dataCriacao" | "dataInativacao"> & {
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  email?: string;
  usuario?: string;
  perfil?: Perfil | "";
  senha?: string;
  razaoSocial?: string;
  cnpj?: string;
  nomeMae?: string;
  sexo?: string;
  estadoCivil?: string;
  rg?: string;
  nis?: string;
  escolaridade?: string;
  ocupacao?: string;
  contato2?: string;
};

function converterPessoa(dados: PessoaApi): Pessoa {
  const base = { ...dados, id: String(dados.id) };
  if (dados.tipo === "JURIDICA") return { ...base, tipo: "JURIDICA" };
  return {
    ...base,
    tipo: "FISICA",
    usuario: dados.usuario ?? "",
    perfil: perfis.find((perfil) => perfisApi[perfil] === dados.perfil) ?? "",
    nomeMae: dados.nomeMae ?? "",
    sexo: Object.entries(sexoApi).find(([, api]) => api === dados.sexo)?.[0] ?? "",
    estadoCivil: Object.entries(estadoCivilApi).find(([, api]) => api === dados.estadoCivil)?.[0] ?? "",
    rg: dados.rg ?? "",
    nis: dados.nis ?? "",
    escolaridade: Object.entries(escolaridadeApi).find(([, api]) => api === dados.escolaridade)?.[0] ?? "",
    ocupacao: dados.ocupacao ?? "",
    contato2: dados.contato2 ?? "",
    familiaId: dados.familiaId == null ? undefined : String(dados.familiaId),
  };
}

async function requisitar(caminho = "", opcoes: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  if (!resposta.ok) {
    if (resposta.status === 401) throw new Error("Sua sessão expirou. Entre novamente no sistema.");
    if (resposta.status === 403) throw new Error("Você não tem permissão para realizar esta operação.");
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem = erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string"
      ? erro.message : "Não foi possível concluir a operação. Tente novamente.";
    throw new Error(mensagem);
  }
  return resposta;
}

export function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function formatarCnpj(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 14);
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/\/(\d{4})(\d)/, "/$1-$2");
}

export function formatarCep(valor: string) {
  return apenasNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatarTelefone(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 11);
  if (numeros.length <= 2) return numeros ? `(${numeros}` : "";
  const ddd = numeros.slice(0, 2);
  const restante = numeros.slice(2);
  const tamanhoPrefixo = numeros.length > 10 ? 5 : 4;
  const prefixo = restante.slice(0, tamanhoPrefixo);
  const sufixo = restante.slice(tamanhoPrefixo);
  return `(${ddd}) ${prefixo}${sufixo ? `-${sufixo}` : ""}`;
}

function digitoVerificador(numeros: number[], pesos: number[]) {
  const soma = pesos.reduce((total, peso, indice) => total + numeros[indice] * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(valor: string) {
  const cpf = apenasNumeros(valor);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const numeros = [...cpf].map(Number);
  return (
    numeros[9] === digitoVerificador(numeros, [10, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    numeros[10] === digitoVerificador(numeros, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

export function cnpjValido(valor: string) {
  const cnpj = apenasNumeros(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const numeros = [...cnpj].map(Number);
  return (
    numeros[12] === digitoVerificador(numeros, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    numeros[13] === digitoVerificador(numeros, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

export function nomePessoa(pessoa: Pessoa) {
  return pessoa.tipo === "FISICA" ? pessoa.nome : pessoa.razaoSocial;
}

export function documentoPessoa(pessoa: Pessoa) {
  return pessoa.tipo === "FISICA" ? pessoa.cpf : pessoa.cnpj;
}

export function documentoFormatado(pessoa: Pessoa) {
  return pessoa.tipo === "FISICA" ? formatarCpf(pessoa.cpf) : formatarCnpj(pessoa.cnpj);
}

export async function listarPessoas(signal?: AbortSignal): Promise<Pessoa[]> {
  const resposta = await requisitar("", { signal });
  const pessoas: PessoaApi[] = await resposta.json();
  return pessoas.map(converterPessoa);
}

export async function salvarPessoa(dados: DadosPessoa, id?: string): Promise<Pessoa> {
  const { tipo, perfil, senha, sexo, estadoCivil, escolaridade, ...campos } = dados;
  const caminho = tipo === "FISICA" ? "/fisicas" : "/juridicas";
  const resposta = await requisitar(`${caminho}${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({
      ...campos,
      ...(tipo === "FISICA" ? {
        perfil: perfil ? perfisApi[perfil] : null,
        ...(sexo !== undefined ? { sexo: sexo ? sexoApi[sexo] : null } : {}),
        ...(estadoCivil !== undefined ? { estadoCivil: estadoCivil ? estadoCivilApi[estadoCivil] : null } : {}),
        ...(escolaridade !== undefined ? { escolaridade: escolaridade ? escolaridadeApi[escolaridade] : null } : {}),
        ...(senha ? { senha } : {}),
      } : {}),
    }),
  });
  return converterPessoa(await resposta.json());
}

export async function inativarPessoa(id: string): Promise<void> {
  await requisitar(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}
