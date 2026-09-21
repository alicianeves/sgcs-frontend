export type ContextoAssistencial = "FAMILIA" | "IDOSA";
export type FonteRenda = { id: string; nome: string; ativa: boolean; valor: string };
export type MembroFamilia = { id: string; pessoaId: string; nome: string; dataNascimento: string; vinculo: string };
export type RespostaQuestionario = { resposta: "SIM" | "NAO" | ""; observacao: string };

export type DadosContextuais = {
  nomeMae: string; sexo: string; estadoCivil: string; rg: string; nis: string;
  residencia: string; valorAluguel: string; escolaridade: string; ocupacao: string; contato2: string;
  rendas: FonteRenda[]; membros: MembroFamilia[]; relatos: string; vinculos: string[];
  questionario: RespostaQuestionario[]; encaminhamentos: string;
};

export type Familia = DadosContextuais & {
  id: string; responsavelId: string; atendimentoId?: string; contexto: ContextoAssistencial;
  nome: string; cpf: string; dataNascimento: string; email: string; telefone: string;
  cep: string; logradouro: string; numero: string; bairro: string; cidade: string; estado: string;
  status: boolean; dataCriacao: string; dataInativacao: string | null;
};

const API_URL = "http://localhost:8080/api";

export const nomesFontesRenda = [
  "Trabalhador(a)", "Aposentado/Pensionista", "Benefício de transferência de renda",
  "Benefício municipal eventual", "BPC Idoso", "BPC Pessoa com deficiência",
  "Transferência de renda federal / Bolsa Família",
] as const;
export const perguntasIdosa = [
  "Você se sente satisfeita com a sua vida?", "Sente-se frequentemente aborrecida?",
  "Tem pensamentos negativos?", "Você tem liberdade de tomar suas próprias decisões?",
  "Sente-se feliz na maior parte do tempo?", "Você abandonou muitas coisas que fazia ou gostaria de fazer?",
  "Sente vontade de chorar com frequência?", "A sua memória tem funcionado bem?",
  "Sente-se angustiada sem causa específica?", "Tem dormido bem?",
  "Faz uso de alguma medicação?", "Tem alguma doença?",
] as const;

const tiposRenda = ["TRABALHO", "APOSENTADORIA_PENSAO", "TRANSFERENCIA_RENDA", "BENEFICIO_MUNICIPAL", "BPC_IDOSO", "BPC_PESSOA_DEFICIENCIA", "BOLSA_FAMILIA"] as const;
const moradiaApi: Record<string, string> = { "Própria": "PROPRIA", Cedida: "CEDIDA", Alugada: "ALUGADA" };
const moradiaTela: Record<string, string> = { PROPRIA: "Própria", CEDIDA: "Cedida", ALUGADA: "Alugada" };
const sexoTela: Record<string, string> = { FEMININO: "Feminino", MASCULINO: "Masculino", OUTRO: "Outro", PREFERE_NAO_INFORMAR: "Prefere não informar" };
const estadoCivilTela: Record<string, string> = { SOLTEIRO_A: "Solteiro(a)", CASADO_A: "Casado(a)", DIVORCIADO_A: "Divorciado(a)", VIUVO_A: "Viúvo(a)", UNIAO_ESTAVEL: "União estável" };
const escolaridadeTela: Record<string, string> = { NAO_ALFABETIZADO_A: "Não alfabetizado(a)", ENSINO_FUNDAMENTAL: "Ensino fundamental", ENSINO_MEDIO: "Ensino médio", ENSINO_SUPERIOR: "Ensino superior", POS_GRADUACAO: "Pós-graduação" };
const vinculoTela: Record<string, string> = { FILHO_A: "Filho(a)", ESPOSO_A: "Esposo(a)", MAE: "Mãe", PAI: "Pai", IRMAO_A: "Irmão(ã)", NETO_A: "Neto(a)", OUTRO: "Outro" };
export const vinculoApi: Record<string, string> = Object.fromEntries(Object.entries(vinculoTela).map(([api, tela]) => [tela, api]));

type PessoaApi = {
  id: number; nome: string; cpf: string; dataNascimento: string; email: string | null; telefone: string;
  cep: string; logradouro: string; numero: string; bairro: string; cidade: string; estado: string;
  nomeMae: string | null; sexo: string | null; estadoCivil: string | null; rg: string | null;
  nis: string | null; escolaridade: string | null; ocupacao: string | null; contato2: string | null;
};
type FamiliaApi = {
  id: number; responsavel: PessoaApi; dataCadastro: string; situacaoMoradia: string; valorAluguel: number | null;
  rendas: Array<{ tipo: string; ativa: boolean; valor: number | null }>;
  integrantes: Array<{ pessoaId: number; nome: string; dataNascimento: string; vinculo: string }>;
  relatos: string | null; status: boolean; dataInativacao: string | null;
};
type AtendimentoApi = {
  id: number; fisicaId: number; bolsaFamilia: boolean; crasNochete: boolean; ubsEsfGuanabara: boolean;
  questionario: Array<{ numero: number; resposta: "SIM" | "NAO"; observacao: string | null }>;
  encaminhamentos: string | null; relatos: string | null; status: boolean;
};

export function dadosContextuaisVazios(): DadosContextuais {
  return {
    nomeMae: "", sexo: "", estadoCivil: "", rg: "", nis: "", residencia: "", valorAluguel: "",
    escolaridade: "", ocupacao: "", contato2: "",
    rendas: nomesFontesRenda.map((nome, indice) => ({ id: String(indice), nome, ativa: false, valor: "" })),
    membros: [], relatos: "", vinculos: [],
    questionario: perguntasIdosa.map(() => ({ resposta: "", observacao: "" })), encaminhamentos: "",
  };
}

async function requisitar(caminho: string, opcoes: RequestInit = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers: { Authorization: `Bearer ${token}`, ...(opcoes.body ? { "Content-Type": "application/json" } : {}) } });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  if (!resposta.ok) {
    if (resposta.status === 401) throw new Error("Sua sessão expirou. Entre novamente no sistema.");
    if (resposta.status === 403) throw new Error("Você não tem permissão para realizar esta operação.");
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem = erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string" ? erro.message : "Não foi possível concluir a operação. Tente novamente.";
    throw new Error(mensagem);
  }
  return resposta;
}

function numero(valor: string) {
  if (!valor.trim()) return null;
  const convertido = Number(valor.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}

async function converterFamilia(familia: FamiliaApi, signal?: AbortSignal): Promise<Familia> {
  const [pessoaResposta, atendimentosResposta] = await Promise.all([
    requisitar(`/pessoas/${familia.responsavel.id}`, { signal }),
    requisitar(`/atendimentos?fisicaId=${familia.responsavel.id}`, { signal }),
  ]);
  const pessoa: PessoaApi = await pessoaResposta.json();
  const atendimentos: AtendimentoApi[] = await atendimentosResposta.json();
  const atendimento = atendimentos.find((item) => item.status);
  return {
    id: String(familia.id), responsavelId: String(pessoa.id), atendimentoId: atendimento ? String(atendimento.id) : undefined,
    contexto: atendimento ? "IDOSA" : "FAMILIA", nome: pessoa.nome, cpf: pessoa.cpf,
    dataNascimento: pessoa.dataNascimento, email: pessoa.email ?? "", telefone: pessoa.telefone,
    cep: pessoa.cep, logradouro: pessoa.logradouro, numero: pessoa.numero, bairro: pessoa.bairro,
    cidade: pessoa.cidade, estado: pessoa.estado, status: familia.status,
    dataCriacao: `${familia.dataCadastro}T00:00:00`, dataInativacao: familia.dataInativacao,
    nomeMae: pessoa.nomeMae ?? "", sexo: sexoTela[pessoa.sexo ?? ""] ?? "",
    estadoCivil: estadoCivilTela[pessoa.estadoCivil ?? ""] ?? "", rg: pessoa.rg ?? "", nis: pessoa.nis ?? "",
    residencia: moradiaTela[familia.situacaoMoradia] ?? "", valorAluguel: familia.valorAluguel == null ? "" : String(familia.valorAluguel),
    escolaridade: escolaridadeTela[pessoa.escolaridade ?? ""] ?? "", ocupacao: pessoa.ocupacao ?? "", contato2: pessoa.contato2 ?? "",
    rendas: nomesFontesRenda.map((nome, indice) => { const renda = familia.rendas.find((item) => item.tipo === tiposRenda[indice]); return { id: String(indice), nome, ativa: renda?.ativa ?? false, valor: renda?.valor == null ? "" : String(renda.valor) }; }),
    membros: familia.integrantes.map((membro) => ({ id: String(membro.pessoaId), pessoaId: String(membro.pessoaId), nome: membro.nome, dataNascimento: membro.dataNascimento, vinculo: vinculoTela[membro.vinculo] ?? "Outro" })),
    relatos: atendimento?.relatos ?? familia.relatos ?? "",
    vinculos: atendimento ? [atendimento.bolsaFamilia && "Bolsa Família", atendimento.crasNochete && "CRAS Nochete", atendimento.ubsEsfGuanabara && "UBS/ESF Guanabara"].filter((item): item is string => Boolean(item)) : [],
    questionario: atendimento ? perguntasIdosa.map((_, indice) => { const resposta = atendimento.questionario.find((item) => item.numero === indice + 1); return { resposta: resposta?.resposta ?? "", observacao: resposta?.observacao ?? "" }; }) : dadosContextuaisVazios().questionario,
    encaminhamentos: atendimento?.encaminhamentos ?? "",
  };
}

export async function listarFamilias(signal?: AbortSignal): Promise<Familia[]> {
  const resposta = await requisitar("/familias", { signal });
  const resumos: Array<{ id: number }> = await resposta.json();
  return Promise.all(resumos.map((item) => buscarFamilia(String(item.id), signal)));
}

export async function buscarFamilia(id: string, signal?: AbortSignal): Promise<Familia> {
  const resposta = await requisitar(`/familias/${encodeURIComponent(id)}`, { signal });
  return converterFamilia(await resposta.json(), signal);
}

export async function salvarFamilia(dados: DadosContextuais & { responsavelId: string }, id?: string): Promise<string> {
  const resposta = await requisitar(`/familias${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({
      responsavelId: Number(dados.responsavelId), situacaoMoradia: moradiaApi[dados.residencia],
      valorAluguel: dados.residencia === "Alugada" ? numero(dados.valorAluguel) : null,
      rendas: dados.rendas.map((renda, indice) => ({ tipo: tiposRenda[indice], ativa: renda.ativa, valor: renda.ativa ? numero(renda.valor) : null })),
      integrantes: dados.membros.map((membro) => ({ pessoaId: Number(membro.pessoaId), vinculo: vinculoApi[membro.vinculo] })),
      relatos: dados.relatos || null, avaliacao: null,
    }),
  });
  const familia: FamiliaApi = await resposta.json();
  return String(familia.id);
}

export async function salvarAtendimento(dados: DadosContextuais & { fisicaId: string }, id?: string): Promise<string> {
  const resposta = await requisitar(`/atendimentos${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({
      fisicaId: Number(dados.fisicaId), bolsaFamilia: dados.vinculos.includes("Bolsa Família"),
      crasNochete: dados.vinculos.includes("CRAS Nochete"), ubsEsfGuanabara: dados.vinculos.includes("UBS/ESF Guanabara"),
      questionario: dados.questionario.map((item, indice) => ({ numero: indice + 1, resposta: item.resposta, observacao: item.observacao || null })),
      encaminhamentos: dados.encaminhamentos || null, relatos: dados.relatos || null,
    }),
  });
  const atendimento: AtendimentoApi = await resposta.json();
  return String(atendimento.id);
}

export async function alternarStatusFamilia(id: string, ativa: boolean): Promise<void> {
  await requisitar(`/familias/${encodeURIComponent(id)}/${ativa ? "inativar" : "reativar"}`, { method: "PATCH" });
}

export async function inativarAtendimento(id: string): Promise<void> {
  await requisitar(`/atendimentos/${encodeURIComponent(id)}/inativar`, { method: "PATCH" });
}
