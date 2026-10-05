import { requisitarApi } from "@/services/apiService";
import { montarPessoaRequest, type DadosPessoa } from "@/services/pessoaService";

export type ContextoAssistencial = "FAMILIA" | "IDOSA";
export type TipoRenda = "TRABALHO" | "APOSENTADORIA_PENSAO" | "TRANSFERENCIA_RENDA" | "BENEFICIO_MUNICIPAL" | "BPC_IDOSO" | "BPC_PESSOA_DEFICIENCIA" | "BOLSA_FAMILIA";
export type AvaliacaoFamilia = "APROVADA" | "REPROVADA" | null;
export type VinculoFamiliar = "FILHO_A" | "ESPOSO_A" | "MAE" | "PAI" | "IRMAO_A" | "NETO_A" | "OUTRO";

export type FonteRenda = { id: string; tipo: TipoRenda; nome: string; ativa: boolean; valor: string };
export type MembroFamilia = {
  id: string; pessoaId: string; nome: string; cpf: string; rg: string; nis: string;
  dataNascimento: string; idade: string; vinculo: string;
};
export type RespostaQuestionario = { resposta: "SIM" | "NAO" | ""; observacao: string };

export type DadosContextuais = {
  nomeMae: string; sexo: string; estadoCivil: string; rg: string; nis: string;
  residencia: string; valorAluguel: string; escolaridade: string; ocupacao: string; contato2: string;
  rendas: FonteRenda[]; membros: MembroFamilia[]; relatos: string; vinculos: string[];
  questionario: RespostaQuestionario[]; encaminhamentos: string; avaliacao: "Aprovada" | "Reprovada" | "";
};

export type FamiliaResumo = { id: string; nome: string; quantidadeIntegrantes: number; avaliacao: AvaliacaoFamilia; status: boolean };
export type Familia = FamiliaResumo & { rendas: FonteRenda[]; membros: MembroFamilia[]; relatos: string; dataInativacao: string | null };
export type DadosFamilia = {
  nome: string;
  rendas: FonteRenda[];
  integrantes: Array<{ pessoaId: string; vinculo: VinculoFamiliar | "" }>;
  relatos: string;
  avaliacao: AvaliacaoFamilia;
};

export const opcoesRenda: ReadonlyArray<{ tipo: TipoRenda; nome: string }> = [
  { tipo: "TRABALHO", nome: "Trabalho" },
  { tipo: "APOSENTADORIA_PENSAO", nome: "Aposentadoria/Pensão" },
  { tipo: "TRANSFERENCIA_RENDA", nome: "Benefício de transferência de renda" },
  { tipo: "BENEFICIO_MUNICIPAL", nome: "Benefício municipal eventual" },
  { tipo: "BPC_IDOSO", nome: "BPC Idoso" },
  { tipo: "BPC_PESSOA_DEFICIENCIA", nome: "BPC Pessoa com deficiência" },
  { tipo: "BOLSA_FAMILIA", nome: "Bolsa Família" },
];
export const nomesFontesRenda = opcoesRenda.map((item) => item.nome);
export const opcoesVinculo: ReadonlyArray<{ valor: VinculoFamiliar; nome: string }> = [
  { valor: "FILHO_A", nome: "Filho(a)" }, { valor: "ESPOSO_A", nome: "Esposo(a)" },
  { valor: "MAE", nome: "Mãe" }, { valor: "PAI", nome: "Pai" },
  { valor: "IRMAO_A", nome: "Irmão(ã)" }, { valor: "NETO_A", nome: "Neto(a)" },
  { valor: "OUTRO", nome: "Outro" },
];
export const perguntasIdosa = [
  "Você se sente satisfeita com a sua vida?", "Sente-se frequentemente aborrecida?", "Tem pensamentos negativos?",
  "Você tem liberdade de tomar suas próprias decisões?", "Sente-se feliz na maior parte do tempo?",
  "Você abandonou muitas coisas que fazia ou gostaria de fazer?", "Sente vontade de chorar com frequência?",
  "A sua memória tem funcionado bem?", "Sente-se angustiada sem causa específica?", "Tem dormido bem?",
  "Faz uso de alguma medicação?", "Tem alguma doença?",
] as const;

const vinculoTela = Object.fromEntries(opcoesVinculo.map((item) => [item.valor, item.nome])) as Record<VinculoFamiliar, string>;
export const vinculoApi: Record<string, VinculoFamiliar> = Object.fromEntries(opcoesVinculo.map((item) => [item.nome, item.valor]));

type FamiliaResumoApi = { id: number; nome: string; quantidadeIntegrantes: number; avaliacao: AvaliacaoFamilia; status: boolean };
type FamiliaApi = FamiliaResumoApi & {
  rendas: Array<{ tipo: TipoRenda; ativa: boolean; valor: number | null }>;
  integrantes: Array<{ pessoaId: number; nome: string; cpf: string | null; rg: string | null; nis: string | null; dataNascimento: string | null; idade: number | null; vinculo: VinculoFamiliar }>;
  relatos: string | null; dataInativacao: string | null;
};

export function dadosContextuaisVazios(): DadosContextuais {
  return {
    nomeMae: "", sexo: "", estadoCivil: "", rg: "", nis: "", residencia: "", valorAluguel: "",
    escolaridade: "", ocupacao: "", contato2: "",
    rendas: opcoesRenda.map((item) => ({ id: item.tipo, ...item, ativa: false, valor: "" })), membros: [], relatos: "", vinculos: [],
    questionario: perguntasIdosa.map(() => ({ resposta: "", observacao: "" })), encaminhamentos: "", avaliacao: "",
  };
}

export function dadosFamiliaVazios(): DadosFamilia {
  return { nome: "", rendas: opcoesRenda.map((item) => ({ id: item.tipo, ...item, ativa: false, valor: "" })), integrantes: [], relatos: "", avaliacao: null };
}

function numero(valor: string) {
  if (!valor.trim()) return null;
  const convertido = Number(valor.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}
export const valorMonetario = numero;

export function formatarMoeda(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";
  const convertido = typeof valor === "number" ? valor : numero(valor);
  return convertido === null ? "" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(convertido);
}
export function nomeAvaliacao(avaliacao: AvaliacaoFamilia) {
  return avaliacao === "APROVADA" ? "Aprovada" : avaliacao === "REPROVADA" ? "Reprovada" : "Não avaliada";
}
export function nomeVinculo(vinculo: string) { return vinculo ? vinculoTela[vinculo as VinculoFamiliar] ?? vinculo : "Não informado"; }

function converterResumo(dados: FamiliaResumoApi): FamiliaResumo { return { ...dados, id: String(dados.id) }; }
function converterFamilia(dados: FamiliaApi): Familia {
  return {
    ...converterResumo(dados),
    rendas: opcoesRenda.map((opcao) => {
      const renda = dados.rendas.find((item) => item.tipo === opcao.tipo);
      return { id: opcao.tipo, ...opcao, ativa: renda?.ativa ?? false, valor: renda?.valor == null ? "" : String(renda.valor) };
    }),
    membros: dados.integrantes.map((membro) => ({
      id: String(membro.pessoaId), pessoaId: String(membro.pessoaId), nome: membro.nome, cpf: membro.cpf ?? "", rg: membro.rg ?? "", nis: membro.nis ?? "",
      dataNascimento: membro.dataNascimento ?? "", idade: membro.idade == null ? "" : String(membro.idade), vinculo: membro.vinculo,
    })),
    relatos: dados.relatos ?? "", dataInativacao: dados.dataInativacao,
  };
}

export async function listarFamilias(signal?: AbortSignal, filtros: { busca?: string; status?: boolean } = {}): Promise<FamiliaResumo[]> {
  const parametros = new URLSearchParams();
  if (filtros.busca?.trim()) parametros.set("busca", filtros.busca.trim());
  if (filtros.status !== undefined) parametros.set("status", String(filtros.status));
  const resposta = await requisitarApi(`/familias${parametros.size ? `?${parametros}` : ""}`, { signal });
  return ((await resposta.json()) as FamiliaResumoApi[]).map(converterResumo);
}
export async function buscarFamilia(id: string, signal?: AbortSignal): Promise<Familia> {
  const resposta = await requisitarApi(`/familias/${encodeURIComponent(id)}`, { signal });
  return converterFamilia(await resposta.json());
}

function montarPayloadFamilia(dados: DadosFamilia) {
  return {
    nome: dados.nome.trim(),
    rendas: dados.rendas.map((renda) => ({ tipo: renda.tipo, ativa: renda.ativa, valor: renda.ativa ? numero(renda.valor) : null })),
    integrantes: dados.integrantes.map((membro) => ({ pessoaId: Number(membro.pessoaId), vinculo: membro.vinculo })),
    relatos: dados.relatos.trim() || null, avaliacao: dados.avaliacao,
  };
}
export async function salvarFamilia(dados: DadosFamilia, id?: string): Promise<Familia> {
  const resposta = await requisitarApi(`/familias${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST", body: JSON.stringify(montarPayloadFamilia(dados)),
  });
  return converterFamilia(await resposta.json());
}
export async function alternarStatusFamilia(id: string, ativa: boolean): Promise<void> {
  await requisitarApi(`/familias/${encodeURIComponent(id)}/${ativa ? "inativar" : "reativar"}`, { method: "PATCH" });
}

export function montarFamiliaRequest(dados: DadosContextuais, nome: string) {
  return montarPayloadFamilia({
    nome, rendas: dados.rendas,
    integrantes: dados.membros.map((membro) => ({ pessoaId: membro.pessoaId, vinculo: (vinculoApi[membro.vinculo] ?? membro.vinculo) as VinculoFamiliar | "" })),
    relatos: dados.relatos,
    avaliacao: dados.avaliacao === "Aprovada" ? "APROVADA" : dados.avaliacao === "Reprovada" ? "REPROVADA" : null,
  });
}
export function montarAtendimentoRequest(dados: DadosContextuais) {
  const hoje = new Date();
  const dataAtendimento = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  return {
    dataAtendimento, bolsaFamilia: dados.vinculos.some((vinculo) => vinculo.startsWith("Bolsa ")),
    crasNochete: dados.vinculos.includes("CRAS Nochete"), ubsEsfGuanabara: dados.vinculos.includes("UBS/ESF Guanabara"),
    questionario: dados.questionario.map((item, indice) => ({ numero: indice + 1, resposta: item.resposta, observacao: item.observacao || null })),
    encaminhamentos: dados.encaminhamentos || null, relatos: dados.relatos || null,
  };
}
export type ResultadoCadastroContextual = { pessoaId: number; familiaId: number; atendimentoId: number | null };
export async function salvarCadastroContextual(contexto: ContextoAssistencial, pessoa: DadosPessoa, dados: DadosContextuais, atual?: { pessoaId: string; familiaId: string; atendimentoId?: string }): Promise<ResultadoCadastroContextual> {
  const nomePessoa = pessoa.nome?.trim() || "Sem identificação";
  const resposta = await requisitarApi(`/cadastros/contextuais${atual ? `/${encodeURIComponent(atual.pessoaId)}` : ""}`, {
    method: atual ? "PUT" : "POST",
    body: JSON.stringify({ contexto, pessoa: montarPessoaRequest(pessoa), familiaId: atual ? Number(atual.familiaId) : null,
      familia: montarFamiliaRequest(dados, `Família de ${nomePessoa}`), atendimentoId: atual?.atendimentoId ? Number(atual.atendimentoId) : null,
      atendimento: contexto === "IDOSA" ? montarAtendimentoRequest(dados) : null }),
  });
  return resposta.json();
}
export async function salvarAtendimento(dados: DadosContextuais & { fisicaId: string }, id?: string): Promise<string> {
  const resposta = await requisitarApi(`/atendimentos${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST", body: JSON.stringify({ fisicaId: Number(dados.fisicaId), ...montarAtendimentoRequest(dados) }),
  });
  return String(((await resposta.json()) as { id: number }).id);
}
export async function inativarAtendimento(id: string): Promise<void> {
  await requisitarApi(`/atendimentos/${encodeURIComponent(id)}/inativar`, { method: "PATCH" });
}
