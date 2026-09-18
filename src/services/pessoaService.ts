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
    })
  | (PessoaBase & {
      tipo: "JURIDICA";
      razaoSocial: string;
      cnpj: string;
    });

const STORAGE_KEY = "sgcs-pessoas";

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

export function listarPessoas(): Pessoa[] {
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    const pessoas: unknown = valor ? JSON.parse(valor) : [];
    return Array.isArray(pessoas) ? (pessoas as Pessoa[]) : [];
  } catch {
    return [];
  }
}

export function salvarPessoas(pessoas: Pessoa[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pessoas));
}
