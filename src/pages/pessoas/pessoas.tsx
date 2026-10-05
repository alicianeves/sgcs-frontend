import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpDown,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DadosAssistenciais, { CamposIdentificacaoComplementar, type ErrosContextuais } from "@/components/pessoas/DadosAssistenciais";
import {
  dadosContextuaisVazios,
  salvarCadastroContextual,
  type DadosContextuais,
} from "@/services/familiaService";
import {
  apenasNumeros,
  cnpjValido,
  cpfValido,
  documentoFormatado,
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarTelefone,
  buscarPessoa,
  listarPessoas,
  nomePessoa,
  perfis,
  salvarPessoa,
  inativarPessoa,
  reativarPessoa,
  removerAcessoPessoa,
  type DadosPessoa,
  type Perfil,
  type Pessoa,
  type TipoPessoa,
} from "@/services/pessoaService";

type Draft = {
  tipo: TipoPessoa;
  nome: string;
  cpf: string;
  dataNascimento: string;
  idade: string;
  email: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  concederAcesso: boolean;
  usuario: string;
  senha: string;
  confirmarSenha: string;
  perfil: Perfil | "";
};

type CampoTexto = Exclude<keyof Draft, "tipo" | "concederAcesso">;
type ErrosCampos = Partial<Record<CampoTexto | "concederAcesso", string>>;

const draftVazio: Draft = {
  tipo: "FISICA",
  nome: "",
  cpf: "",
  dataNascimento: "",
  idade: "",
  email: "",
  razaoSocial: "",
  cnpj: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  concederAcesso: false,
  usuario: "",
  senha: "",
  confirmarSenha: "",
  perfil: "",
};

const cardClass = "rounded-2xl border border-[#d9e1ea] bg-white p-5 shadow-sm sm:p-6";
const inputClass =
  "h-10 rounded-lg border-[#d9e1ea] bg-white px-3 text-[15px] shadow-sm md:text-[15px]";
const formInputClass =
  "h-11 rounded-lg border border-[#d5dbe2] bg-[#FBFDFD] px-4 text-base shadow-sm md:text-base";
const labelClass = "mb-2 text-base font-medium text-[#273440]";
const helperTextClass = "mt-2 text-sm leading-5";
const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
const estadosBrasileiros = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

function FieldMessage({ id, children, tone = "muted" }: {
  id: string;
  children: string;
  tone?: "error" | "muted";
}) {
  return (
    <p id={id} className={`${helperTextClass} flex items-start gap-1.5 ${tone === "error" ? "text-red-700" : "text-[#606b79]"}`}>
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function hojeLocal() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataParaExibicao(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

function valorMonetarioValido(valor: string) {
  if (!valor.trim()) return false;
  const numero = Number(valor.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(numero) && numero >= 0;
}

function draftDePessoa(pessoa: Pessoa): Draft {
  return {
    ...draftVazio,
    tipo: pessoa.tipo,
    telefone: formatarTelefone(pessoa.telefone),
    cep: formatarCep(pessoa.cep),
    logradouro: pessoa.logradouro,
    numero: pessoa.numero,
    bairro: pessoa.bairro,
    cidade: pessoa.cidade,
    estado: pessoa.estado,
    ...(pessoa.tipo === "FISICA"
      ? {
          nome: pessoa.nome,
          cpf: formatarCpf(pessoa.cpf),
          dataNascimento: pessoa.dataNascimento,
          idade: pessoa.dataNascimento ? "" : pessoa.idade == null ? "" : String(pessoa.idade),
          email: pessoa.email,
          usuario: pessoa.usuario,
          perfil: pessoa.perfil,
          concederAcesso: Boolean(pessoa.usuario),
        }
      : { razaoSocial: pessoa.razaoSocial, cnpj: formatarCnpj(pessoa.cnpj) }),
  };
}

function DateField({ id, label, value, onChange, required, max, error }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  max?: string;
  error?: string;
}) {
  const dataSelecionada = value ? new Date(`${value}T12:00:00`) : null;
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(() => dataParaExibicao(value));
  const [mesVisivel, setMesVisivel] = useState(() => dataSelecionada ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fecharFora(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setAberto(false);
    }
    function fecharEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, [aberto]);

  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const anoMinimo = Math.min(1900, dataSelecionada?.getFullYear() ?? 1900);
  const anoMaximo = max ? Number(max.slice(0, 4)) : new Date().getFullYear();
  const anosDisponiveis = Array.from(
    { length: anoMaximo - anoMinimo + 1 },
    (_, indice) => anoMaximo - indice,
  );
  const chaveMesAtual = ano * 12 + mes;
  const chaveMesMinimo = anoMinimo * 12;
  const dataMaxima = max ? new Date(`${max}T12:00:00`) : null;
  const chaveMesMaximo = dataMaxima
    ? dataMaxima.getFullYear() * 12 + dataMaxima.getMonth()
    : anoMaximo * 12 + 11;
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dias = Array.from({ length: primeiroDia + totalDias }, (_, indice) =>
    indice < primeiroDia ? null : indice - primeiroDia + 1,
  );

  function selecionar(dia: number) {
    const data = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    onChange(data);
    setTexto(dataParaExibicao(data));
    setAberto(false);
  }

  function digitarData(entrada: string) {
    const numeros = entrada.replace(/\D/g, "").slice(0, 8);
    const formatada = numeros.length <= 2
      ? numeros
      : numeros.length <= 4
        ? `${numeros.slice(0, 2)}/${numeros.slice(2)}`
        : `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
    setTexto(formatada);
    if (numeros.length !== 8) {
      onChange("");
      return;
    }
    const dia = Number(numeros.slice(0, 2));
    const mes = Number(numeros.slice(2, 4));
    const ano = Number(numeros.slice(4));
    const data = new Date(ano, mes - 1, dia);
    const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
    if (valida && (!max || iso <= max)) {
      onChange(iso);
      setMesVisivel(data);
    } else {
      onChange("");
    }
  }

  function alterarAno(novoAno: number) {
    const ultimoMesPermitido = dataMaxima && novoAno === anoMaximo
      ? dataMaxima.getMonth()
      : 11;
    setMesVisivel(new Date(novoAno, Math.min(mes, ultimoMesPermitido), 1));
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <Label htmlFor={id} className={labelClass}>
        {label}{required && <span aria-label="obrigatório" className="text-red-700"> *</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={texto}
          onChange={(event) => digitarData(event.target.value)}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-erro` : undefined}
          className={`${formInputClass} pr-11 ${error ? "border-red-500 focus-visible:border-red-500" : ""}`}
        />
        <button type="button" onClick={() => setAberto((anterior) => !anterior)} aria-label="Abrir calendário" aria-expanded={aberto} aria-haspopup="dialog" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#657384] hover:text-[#0d5d86]">
          <CalendarDays className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
      {aberto && (
        <div role="dialog" aria-label="Escolher data de nascimento" className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#d9e1ea] bg-white p-4 shadow-xl sm:left-auto sm:right-0">
          <div className="mb-4 flex items-center gap-2">
            <button type="button" disabled={chaveMesAtual <= chaveMesMinimo} onClick={() => setMesVisivel(new Date(ano, mes - 1, 1))} aria-label="Mês anterior" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#606b79] hover:bg-[#eef5f9] hover:text-[#273440] disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="size-5" /></button>
            <select aria-label="Mês" value={mes} onChange={(event) => setMesVisivel(new Date(ano, Number(event.target.value), 1))} className="h-9 min-w-0 flex-1 rounded-lg border border-[#d9e1ea] bg-[#FBFDFD] px-2 text-sm font-medium outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30">
              {nomesMeses.map((nome, indice) => <option key={nome} value={indice} disabled={Boolean(dataMaxima && ano === anoMaximo && indice > dataMaxima.getMonth())}>{nome}</option>)}
            </select>
            <select aria-label="Ano" value={ano} onChange={(event) => alterarAno(Number(event.target.value))} className="h-9 w-24 shrink-0 rounded-lg border border-[#d9e1ea] bg-[#FBFDFD] px-2 text-sm font-medium outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30">
              {anosDisponiveis.map((anoDisponivel) => <option key={anoDisponivel} value={anoDisponivel}>{anoDisponivel}</option>)}
            </select>
            <button type="button" disabled={chaveMesAtual >= chaveMesMaximo} onClick={() => setMesVisivel(new Date(ano, mes + 1, 1))} aria-label="Próximo mês" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#606b79] hover:bg-[#eef5f9] hover:text-[#273440] disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="size-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1" aria-hidden="true">
            {diasSemana.map((dia, indice) => <span key={`${dia}-${indice}`} className="flex h-8 items-center justify-center text-[13px] font-medium text-[#748393]">{dia}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia, indice) => {
              if (!dia) return <span key={`vazio-${indice}`} />;
              const data = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
              const selecionado = data === value;
              const desabilitado = Boolean(max && data > max);
              return (
                <button
                  key={data}
                  type="button"
                  disabled={desabilitado}
                  onClick={() => selecionar(dia)}
                  aria-label={new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${data}T12:00:00`))}
                  aria-pressed={selecionado}
                  className={`flex size-9 items-center justify-center rounded-lg text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${selecionado ? "bg-[#4697c5] font-semibold text-white" : "text-[#273440] hover:bg-[#eaf7ff] hover:text-[#0d5d86]"}`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && <FieldMessage id={`${id}-erro`} tone="error">{error}</FieldMessage>}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  max,
  error,
  hint,
  highlightHint = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "email";
  maxLength?: number;
  max?: string;
  error?: string;
  hint?: string;
  highlightHint?: boolean;
}) {
  if (type === "date") {
    return <DateField id={id} label={label} value={value} onChange={onChange} required={required} max={max} error={error} />;
  }

  return (
    <div className="min-w-0">
      <Label htmlFor={id} className={labelClass}>
        {label}{required && <span aria-label="obrigatório" className="text-red-700"> *</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          max={max}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-erro` : hint ? `${id}-ajuda` : undefined}
          className={`${formInputClass} ${readOnly ? "bg-[#edf1f5] text-[#606b79]" : ""} ${error ? "border-red-500 focus-visible:border-red-500" : ""}`}
        />
      </div>
      {error && <FieldMessage id={`${id}-erro`} tone="error">{error}</FieldMessage>}
      {!error && hint && <FieldMessage id={`${id}-ajuda`} tone={highlightHint ? "error" : "muted"}>{hint}</FieldMessage>}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, required, error, hint, placeholder }: {
  id: "senha" | "confirmarSenha";
  label: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  error?: string;
  hint?: string;
  placeholder: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className={labelClass}>
        {label}{required && <span aria-label="obrigatório" className="text-red-700"> *</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-erro` : hint ? `${id}-ajuda` : undefined}
          placeholder={placeholder}
          className={`${formInputClass} pr-11 ${error ? "border-red-500" : ""}`}
        />
        <button type="button" onClick={() => setVisivel((anterior) => !anterior)} aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${id === "senha" ? "senha" : "confirmação de senha"}`} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-[#606b79] hover:text-[#0d5d86] focus-visible:outline-2 focus-visible:outline-[#4697c5]">
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <FieldMessage id={`${id}-erro`} tone="error">{error}</FieldMessage>}
      {!error && hint && <FieldMessage id={`${id}-ajuda`}>{hint}</FieldMessage>}
    </div>
  );
}

export default function PessoasPage({
  usuarioAtual,
  podeGerenciarAcesso,
}: {
  usuarioAtual: string;
  podeGerenciarAcesso: boolean;
}) {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erroListagem, setErroListagem] = useState("");
  const [erroPessoasDisponiveis, setErroPessoasDisponiveis] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null);
  const [consultando, setConsultando] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ pessoa: Pessoa; acao: "inativar" | "reativar" } | null>(null);
  const operacaoEmCurso = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const atraso = window.setTimeout(() => listarPessoas(controller.signal, { busca, status: statusFiltro })
      .then((dados) => {
        if (!controller.signal.aborted) setPessoas(dados);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setErroListagem(error instanceof Error ? error.message : "Não foi possível carregar as pessoas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      }), 250);
    return () => { window.clearTimeout(atraso); controller.abort(); };
  }, [tentativa, busca, statusFiltro]);

  useEffect(() => {
    const controller = new AbortController();
    listarPessoas(controller.signal, { status: true })
      .then((dados) => { if (!controller.signal.aborted) { setPessoasDisponiveis(dados); setErroPessoasDisponiveis(""); } })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErroPessoasDisponiveis(error instanceof Error ? error.message : "Não foi possível carregar as pessoas disponíveis para a composição familiar.");
        }
      });
    return () => controller.abort();
  }, [tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setErroListagem("");
    setTentativa((valor) => valor + 1);
  }

  const [ordemAscendente, setOrdemAscendente] = useState(true);
  const [editando, setEditando] = useState<Pessoa | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [contexto, setContexto] = useState<"PESSOA" | "FAMILIA" | "IDOSA">("PESSOA");
  const [dadosContextuais, setDadosContextuais] = useState<DadosContextuais>(dadosContextuaisVazios);
  const [draft, setDraft] = useState<Draft>(draftVazio);
  const [erro, setErro] = useState("");
  const [errosCampos, setErrosCampos] = useState<ErrosCampos>({});
  const [errosContextuais, setErrosContextuais] = useState<ErrosContextuais>({});
  const [aviso, setAviso] = useState("");

  const pessoasFiltradas = useMemo(() => {
    return pessoas
      .sort((a, b) =>
        nomePessoa(a).localeCompare(nomePessoa(b), "pt-BR") * (ordemAscendente ? 1 : -1),
      );
  }, [pessoas, ordemAscendente]);

  function atualizar(campo: CampoTexto, valor: string) {
    const formatadores: Partial<Record<CampoTexto, (entrada: string) => string>> = {
      cpf: formatarCpf,
      cnpj: formatarCnpj,
      cep: formatarCep,
      telefone: formatarTelefone,
    };
    setDraft((anterior) => ({ ...anterior, [campo]: formatadores[campo]?.(valor) ?? valor }));
    setErro("");
    setErrosCampos((anterior) => ({
      ...anterior,
      [campo]: undefined,
      ...(campo === "senha" || campo === "confirmarSenha" ? { senha: undefined, confirmarSenha: undefined } : {}),
    }));
  }

  function alterarTipo(tipo: TipoPessoa) {
    setDraft((anterior) => ({
      ...draftVazio,
      tipo,
      telefone: anterior.telefone,
      cep: anterior.cep,
      logradouro: anterior.logradouro,
      numero: anterior.numero,
      bairro: anterior.bairro,
      cidade: anterior.cidade,
      estado: anterior.estado,
    }));
    setErro("");
    setErrosCampos({});
    setErrosContextuais({});
  }

  function abrirCadastro() {
    setEditando(null);
    setDraft({ ...draftVazio });
    setContexto("PESSOA");
    setDadosContextuais(dadosContextuaisVazios());
    setErro("");
    setErrosCampos({});
    setErrosContextuais({});
    setAviso("");
    setFormularioAberto(true);
    window.scrollTo(0, 0);
  }

  async function abrirEdicao(pessoa: Pessoa) {
    if (!pessoa.status || consultando) return;
    setConsultando(pessoa.id);
    setAviso("");
    try {
      const completa = await buscarPessoa(pessoa.id);
      setEditando(completa);
      setDraft(draftDePessoa(completa));
      setErro("");
      setErrosCampos({});
      setErrosContextuais({});
      setFormularioAberto(true);
      window.scrollTo(0, 0);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível consultar a pessoa.");
    } finally {
      setConsultando(null);
    }
  }

  function voltar() {
    setFormularioAberto(false);
    setEditando(null);
    setErro("");
    setErrosCampos({});
    window.scrollTo(0, 0);
  }

  function validar(): ErrosCampos {
    const falhas: ErrosCampos = {};
    if (draft.tipo === "FISICA") {
      if (!draft.nome.trim()) falhas.nome = "Informe o nome completo.";
      if (!cpfValido(draft.cpf)) falhas.cpf = "Informe um CPF válido.";
      if (!draft.dataNascimento && !draft.idade) {
        falhas.dataNascimento = "Informe a data de nascimento ou a idade.";
        falhas.idade = "Informe a idade ou a data de nascimento.";
      } else if (draft.dataNascimento > hojeLocal()) falhas.dataNascimento = "A data não pode ser futura.";
      if (draft.idade && (!/^\d+$/.test(draft.idade) || Number(draft.idade) > 130)) falhas.idade = "Informe uma idade válida.";
      if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
        falhas.email = "Informe um e-mail válido.";
      }
      const telefone = apenasNumeros(draft.telefone);
      if (telefone.length !== 10 && telefone.length !== 11) falhas.telefone = "Informe telefone com DDD.";
      if (draft.concederAcesso) {
        if (!draft.email.trim()) falhas.email = "Informe o e-mail para contato e recuperação de senha.";
        if (!draft.usuario.trim()) falhas.usuario = "Informe um usuário de login.";
        if (!editando && !draft.senha) falhas.senha = "Defina uma senha.";
        else if (draft.senha && draft.senha.length < 8) falhas.senha = "A senha deve conter no mínimo 8 caracteres.";
        if (editando && !draft.senha && draft.confirmarSenha) falhas.senha = "Informe a nova senha.";
        if ((!editando || draft.senha) && !draft.confirmarSenha) {
          falhas.confirmarSenha = "Confirme a senha.";
        } else if (draft.confirmarSenha && draft.confirmarSenha !== draft.senha) {
          falhas.confirmarSenha = "As senhas não coincidem.";
        }
        if (!draft.perfil) falhas.perfil = "Selecione um perfil de acesso.";
      }
      if (editando?.tipo === "FISICA" &&
          editando.usuario.toLocaleLowerCase("pt-BR") === usuarioAtual.toLocaleLowerCase("pt-BR")) {
        if (!draft.concederAcesso && Boolean(editando.usuario)) {
          falhas.concederAcesso = "Você não pode remover seu próprio acesso.";
        } else if (draft.perfil !== editando.perfil) {
          falhas.perfil = "Você não pode alterar seu próprio perfil.";
        }
      }
    } else {
      if (!draft.razaoSocial.trim()) falhas.razaoSocial = "Informe a razão social.";
      if (!cnpjValido(draft.cnpj)) falhas.cnpj = "Informe um CNPJ válido.";
      const telefone = apenasNumeros(draft.telefone);
      if (telefone.length !== 10 && telefone.length !== 11) falhas.telefone = "Informe telefone com DDD.";
    }
    if (apenasNumeros(draft.cep).length !== 8) falhas.cep = "Informe um CEP com 8 dígitos.";
    if (!draft.logradouro.trim()) falhas.logradouro = "Informe o logradouro.";
    if (!draft.numero.trim()) falhas.numero = "Informe o número.";
    if (!draft.bairro.trim()) falhas.bairro = "Informe o bairro.";
    if (!draft.cidade.trim()) falhas.cidade = "Informe a cidade.";
    if (!estadosBrasileiros.some(([uf]) => uf === draft.estado)) falhas.estado = "Selecione o estado.";
    return falhas;
  }

  function validarContextuais(): ErrosContextuais {
    if (contexto === "PESSOA") return {};
    const falhas: ErrosContextuais = {};
    if (!dadosContextuais.nomeMae.trim()) falhas.nomeMae = "Informe o nome da mãe.";
    if (!dadosContextuais.rg.trim()) falhas.rg = "Informe o RG.";
    if (!dadosContextuais.residencia) falhas.residencia = "Selecione o tipo de residência.";
    if (dadosContextuais.residencia === "Alugada" && !valorMonetarioValido(dadosContextuais.valorAluguel)) falhas.valorAluguel = "Informe um valor de aluguel válido.";
    if (!dadosContextuais.rendas.some((renda) => renda.ativa)) falhas.rendas = "Informe pelo menos uma fonte de renda familiar.";
    else if (dadosContextuais.rendas.some((renda) => renda.ativa && !valorMonetarioValido(renda.valor))) falhas.rendas = "Informe um valor válido para cada fonte de renda selecionada.";
    if (dadosContextuais.membros.some((membro) => !membro.pessoaId || !membro.vinculo)) falhas.membros = "Selecione a pessoa e o vínculo de todos os integrantes.";
    if (contexto === "IDOSA" && dadosContextuais.questionario.some((item) => !item.resposta)) falhas.questionario = "Responda às 12 perguntas do questionário.";
    return falhas;
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operacaoEmCurso.current) return;
    const falhas = validar();
    const falhasContextuais = validarContextuais();
    if (Object.keys(falhas).length > 0 || Object.keys(falhasContextuais).length > 0) {
      setErrosCampos(falhas);
      setErrosContextuais(falhasContextuais);
      setErro("Revise os campos indicados abaixo.");
      const primeiroCampo = Object.keys(falhas)[0] ?? Object.keys(falhasContextuais)[0];
      if (primeiroCampo) {
        requestAnimationFrame(() => document.getElementById(primeiroCampo)?.focus());
      }
      return;
    }

    const base = {
      telefone: apenasNumeros(draft.telefone),
      cep: apenasNumeros(draft.cep),
      logradouro: draft.logradouro.trim(),
      numero: draft.numero.trim(),
      bairro: draft.bairro.trim(),
      cidade: draft.cidade.trim(),
      estado: draft.estado.trim().toUpperCase(),
    };
    const dados: DadosPessoa = draft.tipo === "FISICA"
      ? {
          ...base,
          tipo: "FISICA",
          nome: draft.nome.trim(),
          cpf: apenasNumeros(draft.cpf),
          dataNascimento: draft.dataNascimento,
          idadeInformada: draft.dataNascimento ? null : Number(draft.idade),
          email: draft.email.trim(),
          usuario: draft.concederAcesso ? draft.usuario.trim() : editando?.tipo === "FISICA" ? editando.usuario : "",
          perfil: draft.concederAcesso ? draft.perfil : editando?.tipo === "FISICA" ? editando.perfil : "",
          senha: draft.concederAcesso ? draft.senha : undefined,
          ...(contexto === "PESSOA" && editando?.tipo === "FISICA" ? {
            nomeMae: editando.nomeMae,
            sexo: editando.sexo,
            estadoCivil: editando.estadoCivil,
            rg: editando.rg,
            nis: editando.nis,
            escolaridade: editando.escolaridade,
            ocupacao: editando.ocupacao,
            contato2: editando.contato2,
          } : {}),
          ...(contexto !== "PESSOA" ? {
            nomeMae: dadosContextuais.nomeMae.trim(),
            sexo: dadosContextuais.sexo,
            estadoCivil: dadosContextuais.estadoCivil,
            rg: dadosContextuais.rg.trim(),
            nis: dadosContextuais.nis.trim(),
            escolaridade: dadosContextuais.escolaridade,
            ocupacao: dadosContextuais.ocupacao.trim(),
            contato2: apenasNumeros(dadosContextuais.contato2),
          } : {}),
        }
      : {
          ...base,
          tipo: "JURIDICA",
          razaoSocial: draft.razaoSocial.trim(),
          cnpj: apenasNumeros(draft.cnpj),
        };

    operacaoEmCurso.current = true;
    setSalvando(true);
    setErro("");
    try {
      if (contexto !== "PESSOA") {
        await salvarCadastroContextual(
          contexto,
          dados,
          dadosContextuais,
        );
        voltar();
        return;
      }
      const removendoAcesso = Boolean(editando?.tipo === "FISICA" && editando.usuario && !draft.concederAcesso);
      await salvarPessoa(dados, editando?.id);
      if (removendoAcesso && editando) await removerAcessoPessoa(editando.id);
      voltar();
      setAviso(editando ? "Pessoa atualizada com sucesso." : "Pessoa cadastrada com sucesso.");
      setTentativa((valor) => valor + 1);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a pessoa.");
    } finally {
      operacaoEmCurso.current = false;
      setSalvando(false);
    }
  }

  async function alterarStatusPessoa(pessoa: Pessoa, acao: "inativar" | "reativar") {
    if (operacaoEmCurso.current) return;
    if (pessoa.tipo === "FISICA" &&
        pessoa.usuario.toLocaleLowerCase("pt-BR") === usuarioAtual.toLocaleLowerCase("pt-BR")) {
      setAviso("Você não pode inativar seu próprio cadastro.");
      return;
    }
    operacaoEmCurso.current = true;
    setAlterandoStatus(pessoa.id);
    setAviso("");
    try {
      if (acao === "inativar") await inativarPessoa(pessoa.id);
      else await reativarPessoa(pessoa.id);
      setPessoas((anteriores) => anteriores.filter((item) => item.id !== pessoa.id));
      setAviso(`Pessoa ${acao === "inativar" ? "inativada" : "reativada"} com sucesso.`);
      setTentativa((valor) => valor + 1);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível alterar o status da pessoa.");
    } finally {
      operacaoEmCurso.current = false;
      setAlterandoStatus(null);
      setConfirmacao(null);
    }
  }

  const campo = (
    chave: CampoTexto,
    rotulo: string,
    opcoes: { required?: boolean; disabled?: boolean; readOnly?: boolean; type?: string; placeholder?: string;
      inputMode?: "numeric" | "tel" | "email"; maxLength?: number; max?: string; hint?: string; highlightHint?: boolean } = {},
  ) => (
    <Field
      id={chave}
      label={rotulo}
      value={draft[chave]}
      onChange={(valor) => atualizar(chave, valor)}
      {...opcoes}
      error={errosCampos[chave]}
    />
  );

  return (
    <div className={`mx-auto w-full ${formularioAberto ? "max-w-[1280px]" : "max-w-[1600px]"}`}>
      <div className={`mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[#606b79] ${formularioAberto ? "text-[15px]" : "text-xs"}`}>
        <span>Sistema</span><ChevronRight size={13} /><span>Administração</span>
        <ChevronRight size={13} /><span className="text-[#273440]">Pessoas</span>
        {formularioAberto && <><ChevronRight size={13} /><span>{editando ? "Editar" : "Novo cadastro"}</span></>}
      </div>

      {aviso && (
        <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#bde0f4] bg-[#eaf7ff] px-4 py-3 text-sm text-[#0d5d86]">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso("")} aria-label="Fechar aviso"><X size={16} /></button>
        </div>
      )}

      {confirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#273440]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmar-status-pessoa">
          <div className="w-full max-w-md rounded-2xl border border-[#d9e1ea] bg-white p-6 shadow-xl">
            <h2 id="confirmar-status-pessoa" className="text-lg font-semibold">{confirmacao.acao === "inativar" ? "Inativar" : "Reativar"} pessoa?</h2>
            <p className="mt-2 text-sm leading-6 text-[#606b79]">Confirme a alteração de status de {nomePessoa(confirmacao.pessoa)}.</p>
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setConfirmacao(null)}>Cancelar</Button><Button type="button" onClick={() => alterarStatusPessoa(confirmacao.pessoa, confirmacao.acao)} className="bg-[#4697c5] text-white hover:bg-[#67a0c0]">Confirmar</Button></div>
          </div>
        </div>
      )}

      {!formularioAberto ? (
        <>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight">Gerenciamento de pessoas</h1>
              <p className="mt-1 text-sm text-[#606b79]">Cadastre e acompanhe pessoas físicas e jurídicas em um só lugar.</p>
            </div>
            <Button type="button" disabled={carregando || Boolean(erroListagem) || alterandoStatus !== null} onClick={abrirCadastro} className="h-10 gap-2 bg-[#4697c5] px-4 text-white hover:bg-[#67a0c0]">
              <Plus size={17} /> Nova pessoa
            </Button>
          </div>

          <section className={cardClass}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Pessoas cadastradas</h2>
                <p aria-live="polite" className="mt-0.5 text-sm text-[#606b79]">{pessoasFiltradas.length} resultado(s)</p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button type="button" onClick={() => setOrdemAscendente((valor) => !valor)} className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-[#d9e1ea] px-3 text-sm text-[#606b79] md:hidden" aria-label="Ordenar por nome">
                  <ArrowUpDown size={16} /> Nome
                </button>
                <select aria-label="Filtrar pessoas por status" value={statusFiltro ? "ativas" : "inativas"} onChange={(event) => { setStatusFiltro(event.target.value === "ativas"); setCarregando(true); setErroListagem(""); }} className="h-10 rounded-lg border border-[#d9e1ea] bg-white px-3 text-sm text-[#606b79] shadow-sm outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30">
                  <option value="ativas">Ativas</option><option value="inativas">Inativas</option>
                </select>
                <div className="relative min-w-0 flex-1 sm:w-80">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748393]" />
                  <Input
                    type="search"
                    aria-label="Buscar por nome ou CPF/CNPJ"
                    value={busca}
                    onChange={(event) => { setBusca(event.target.value); setCarregando(true); setErroListagem(""); }}
                    placeholder="Buscar por nome ou CPF/CNPJ"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            {carregando ? (
              <p role="status" className="py-10 text-center">Carregando pessoas...</p>
            ) : erroListagem ? (
              <div role="alert" className="py-10 text-center text-red-700">
                <p>{erroListagem}</p>
                <Button type="button" variant="outline" onClick={tentarNovamente} className="mt-4">Tentar novamente</Button>
              </div>
            ) : pessoasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eaf7ff] text-[#4697c5]"><UsersRound size={27} /></span>
                <h3 className="mt-4 font-semibold">{busca ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa cadastrada"}</h3>
                <p className="mt-1 max-w-sm text-sm text-[#606b79]">{busca ? "Tente outro nome ou documento." : "Comece cadastrando a primeira pessoa física ou jurídica."}</p>
                {!busca && statusFiltro && <Button type="button" disabled={carregando || Boolean(erroListagem) || alterandoStatus !== null} onClick={abrirCadastro} className="mt-5 bg-[#4697c5] text-white hover:bg-[#67a0c0]"><Plus size={16} /> Nova pessoa</Button>}
              </div>
            ) : (
              <>
              <div className="space-y-3 md:hidden">
                {pessoasFiltradas.map((pessoa) => (
                  <div key={pessoa.id} className="rounded-xl border border-[#e5eaf0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" disabled={!pessoa.status || alterandoStatus !== null || consultando !== null} onClick={() => abrirEdicao(pessoa)} className="text-left font-semibold hover:text-[#4697c5] disabled:cursor-default disabled:hover:text-inherit">{nomePessoa(pessoa)}</button>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${pessoa.status ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{pessoa.status ? "Ativa" : "Inativa"}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#606b79]">Pessoa {pessoa.tipo === "FISICA" ? "física" : "jurídica"} · {documentoFormatado(pessoa)}</p>
                    <p className="mt-1 text-sm text-[#606b79]">{formatarTelefone(pessoa.telefone)}</p>
                    <div className="mt-3 flex gap-3 border-t border-[#e5eaf0] pt-3 text-sm font-medium text-[#0d5d86]">
                      {pessoa.status && <button type="button" disabled={alterandoStatus !== null || consultando !== null} onClick={() => abrirEdicao(pessoa)}>{consultando === pessoa.id ? "Consultando..." : "Editar"}</button>}
                      <button type="button" disabled={alterandoStatus !== null} onClick={() => setConfirmacao({ pessoa, acao: pessoa.status ? "inativar" : "reativar" })}>{alterandoStatus === pessoa.id ? "Processando..." : pessoa.status ? "Inativar" : "Reativar"}</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">Pessoas cadastradas, ordenadas por nome</caption>
                  <thead className="border-b border-[#e5eaf0] text-[#606b79]">
                    <tr>
                      <th scope="col" aria-sort={ordemAscendente ? "ascending" : "descending"} className="pb-3 font-medium">
                        <button type="button" onClick={() => setOrdemAscendente((valor) => !valor)} className="flex items-center gap-1.5 hover:text-[#4697c5]">
                          Nome <ArrowUpDown size={15} />
                        </button>
                      </th>
                      <th scope="col" className="pb-3 font-medium">Tipo</th>
                      <th scope="col" className="pb-3 font-medium">CPF / CNPJ</th>
                      <th scope="col" className="pb-3 font-medium">Telefone</th>
                      <th scope="col" className="pb-3 font-medium">Status</th>
                      <th scope="col" className="pb-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pessoasFiltradas.map((pessoa) => (
                      <tr key={pessoa.id} className="border-b border-[#edf0f3] last:border-0">
                        <td className="py-4 pr-4 font-medium">
                          <button type="button" disabled={!pessoa.status || alterandoStatus !== null || consultando !== null} onClick={() => abrirEdicao(pessoa)} className="text-left hover:text-[#4697c5] disabled:cursor-default disabled:hover:text-inherit">{nomePessoa(pessoa)}</button>
                        </td>
                        <td className="py-4 pr-4 text-[#606b79]">{pessoa.tipo === "FISICA" ? "Física" : "Jurídica"}</td>
                        <td className="py-4 pr-4 text-[#606b79]">{documentoFormatado(pessoa)}</td>
                        <td className="py-4 pr-4 text-[#606b79]">{formatarTelefone(pessoa.telefone)}</td>
                        <td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pessoa.status ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{pessoa.status ? "Ativa" : "Inativa"}</span></td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {pessoa.status && <button type="button" disabled={alterandoStatus !== null || consultando !== null} onClick={() => abrirEdicao(pessoa)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#4697c5]" aria-label={`Editar ${nomePessoa(pessoa)}`}><Pencil size={16} /></button>}
                            <button type="button" disabled={alterandoStatus !== null} onClick={() => setConfirmacao({ pessoa, acao: pessoa.status ? "inativar" : "reativar" })} className="rounded-lg px-2 py-1 text-xs font-medium text-[#0d5d86] hover:bg-[#eaf7ff]">{alterandoStatus === pessoa.id ? "Processando..." : pessoa.status ? "Inativar" : "Reativar"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>
        </>
      ) : (
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-[30px] font-bold tracking-tight">{editando ? "Editar cadastro" : "Novo cadastro"}</h1>
            <p className="mt-1 text-base leading-6 text-[#606b79]">{editando ? "Atualize os dados cadastrais no Centro Social." : "Preencha os dados do cadastro no Centro Social."}</p>
          </div>
          <form onSubmit={salvar} noValidate aria-busy={salvando}>
            <fieldset disabled={salvando} className="space-y-8">
            {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700">{erro}</div>}
            {erroPessoasDisponiveis && contexto !== "PESSOA" && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700">{erroPessoasDisponiveis}</div>}
            <section className="rounded-xl border border-[#4697c5]/25 bg-[#4697c5]/[.045] p-5 sm:p-6">
              <Label htmlFor="contextoCadastro" className={labelClass}>Tipo de cadastro</Label>
              <select
                id="contextoCadastro"
                value={contexto}
                onChange={(event) => {
                  const novoContexto = event.target.value as "PESSOA" | "FAMILIA" | "IDOSA";
                  setContexto(novoContexto);
                  if (novoContexto !== "PESSOA") setDraft((anterior) => ({ ...anterior, tipo: "FISICA", concederAcesso: false }));
                  setErro("");
                  setErrosCampos({});
                  setErrosContextuais({});
                }}
                className="h-11 w-full max-w-xl rounded-lg border border-[#d5dbe2] bg-[#FBFDFD] px-4 text-base shadow-sm outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30"
              >
                <option value="PESSOA">Pessoa</option>
                <option value="FAMILIA">Família</option>
                <option value="IDOSA">Idosa</option>
              </select>
              <p className="mt-2 text-sm text-[#606b79]">O tipo de cadastro define os campos exibidos abaixo.</p>
            </section>
            {contexto === "PESSOA" && <fieldset>
              <legend className="sr-only">Tipo de pessoa</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["FISICA", "JURIDICA"] as const).map((tipo) => {
                  const selecionado = draft.tipo === tipo;
                  const Icone = tipo === "FISICA" ? UserRound : Building2;
                  return (
                    <label key={tipo} className={editando ? "cursor-not-allowed" : "cursor-pointer"}>
                      <input
                        type="radio"
                        name="tipoPessoa"
                        value={tipo}
                        checked={draft.tipo === tipo}
                        disabled={Boolean(editando)}
                        onChange={() => alterarTipo(tipo)}
                        className="peer sr-only"
                      />
                      <span className={`relative flex min-h-[104px] items-center gap-4 rounded-xl border p-5 text-left transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4697c5] ${selecionado ? "border-[#4697c5] bg-[#4697c5]/[.045] ring-1 ring-[#4697c5]/20" : "border-[#d9e1ea] bg-white hover:border-[#4697c5]/50"} ${editando ? "opacity-80" : ""}`}>
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${selecionado ? "bg-[#4697c5] text-white" : "bg-[#edf1f4] text-[#748393]"}`}>
                          <Icone className="size-[18px]" aria-hidden="true" />
                        </span>
                        <span>
                          <strong className="block text-base font-semibold">Pessoa {tipo === "FISICA" ? "Física" : "Jurídica"}</strong>
                          <small className="mt-1 block text-sm leading-5 text-[#606b79]">Cadastro de {tipo === "FISICA" ? "uma pessoa" : "uma organização"}</small>
                        </span>
                        {selecionado && <Check className="absolute right-4 top-4 size-4 text-[#4697c5]" aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
              {editando && <p className={`${helperTextClass} text-[#606b79]`}>O tipo de pessoa não pode ser alterado após o cadastro.</p>}
            </fieldset>}

            <section className="border-t border-[#d9e1ea] pt-7">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">{draft.tipo === "FISICA" ? "Dados pessoais" : "Dados da empresa"}</h2>
                <p className="mt-1 text-base leading-6 text-[#606b79]">{draft.tipo === "FISICA" ? "Informações de identificação e contato." : "Informações de identificação e contato da organização."}</p>
              </div>
              {draft.tipo === "FISICA" ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">{campo("nome", "Nome completo", { required: true, placeholder: "Digite o nome completo" })}</div>
                  {campo("cpf", "CPF", { required: true, readOnly: Boolean(editando), inputMode: "numeric", maxLength: 14, placeholder: "000.000.000-00", hint: editando ? "O CPF não pode ser alterado após o cadastro." : undefined })}
                  <Field key={`nascimento-${draft.dataNascimento ? "preenchido" : "vazio"}`} id="dataNascimento" label="Data de nascimento" value={draft.dataNascimento} onChange={(valor) => { atualizar("dataNascimento", valor); if (valor) atualizar("idade", ""); }} type="date" max={hojeLocal()} error={errosCampos.dataNascimento} />
                  <Field id="idade" label="Idade" value={draft.idade} onChange={(valor) => { atualizar("idade", valor.replace(/\D/g, "").slice(0, 3)); if (valor) atualizar("dataNascimento", ""); }} inputMode="numeric" maxLength={3} placeholder="Informe se não souber a data" error={errosCampos.idade} />
                  {campo("telefone", "Telefone", { required: true, type: "tel", inputMode: "tel", placeholder: "(00) 00000-0000" })}
                  {campo("email", "E-mail pessoal", { required: draft.concederAcesso, type: "email", inputMode: "email", placeholder: "nome@email.com", hint: draft.concederAcesso ? "Usado para contato e recuperação de senha." : undefined, highlightHint: draft.concederAcesso })}
                  {contexto !== "PESSOA" && <CamposIdentificacaoComplementar dados={dadosContextuais} onChange={(dados) => { setDadosContextuais(dados); setErrosContextuais({}); }} errors={errosContextuais} />}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
                  {campo("razaoSocial", "Razão social", { required: true, placeholder: "Digite a razão social" })}
                  {campo("cnpj", "CNPJ", { required: true, readOnly: Boolean(editando), inputMode: "numeric", maxLength: 18, placeholder: "00.000.000/0000-00", hint: editando ? "O CNPJ não pode ser alterado após o cadastro." : undefined })}
                  {campo("telefone", "Telefone", { required: true, type: "tel", inputMode: "tel", placeholder: "(00) 0000-0000" })}
                </div>
              )}
            </section>

            {contexto === "PESSOA" && draft.tipo === "FISICA" && podeGerenciarAcesso && (
              <section className="rounded-xl border border-[#4697c5]/25 bg-[#4697c5]/[.045] p-5 [&_input]:bg-[#F2F7FB] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Acesso ao sistema</h2>
                    <p id="acesso-ajuda" className="mt-1 text-base leading-6 text-[#606b79]">Defina se esta pessoa poderá acessar o sistema.</p>
                  </div>
                  <label htmlFor="concederAcesso" className="flex shrink-0 cursor-pointer items-center gap-3 text-base font-medium">
                    <span className="hidden sm:inline">Conceder acesso</span>
                    <input
                      id="concederAcesso"
                      type="checkbox"
                      checked={draft.concederAcesso}
                      onChange={(event) => {
                        setDraft((anterior) => ({ ...anterior, concederAcesso: event.target.checked }));
                        setErrosCampos((anterior) => ({ ...anterior, concederAcesso: undefined, email: undefined, usuario: undefined, senha: undefined, confirmarSenha: undefined, perfil: undefined }));
                        setErro("");
                      }}
                      aria-invalid={Boolean(errosCampos.concederAcesso)}
                      aria-describedby={errosCampos.concederAcesso ? "acesso-ajuda acesso-erro" : "acesso-ajuda"}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-[#d9e1ea] transition-colors peer-checked:bg-[#4697c5] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4697c5] after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {errosCampos.concederAcesso && <FieldMessage id="acesso-erro" tone="error">{errosCampos.concederAcesso}</FieldMessage>}
                {draft.concederAcesso ? (
                  <div className="mt-6 grid gap-5 border-t border-[#4697c5]/20 pt-5 sm:grid-cols-2">
                        {campo("usuario", "Usuário", { required: true, placeholder: "Digite o usuário de acesso" })}
                        <div className="min-w-0">
                          <Label htmlFor="perfil" className={labelClass}>Acesso <span aria-label="obrigatório" className="text-red-700">*</span></Label>
                          <select
                            id="perfil"
                            value={draft.perfil}
                            onChange={(event) => atualizar("perfil", event.target.value as Perfil | "")}
                            required
                            aria-invalid={Boolean(errosCampos.perfil)}
                            aria-describedby={errosCampos.perfil ? "perfil-erro" : undefined}
                            className={`h-11 w-full rounded-lg border bg-[#F2F7FB] px-4 text-base shadow-sm outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30 ${errosCampos.perfil ? "border-red-500" : "border-[#d5dbe2]"}`}
                          >
                            <option value="">Selecione o nível de acesso</option>
                            {perfis.map((perfil) => <option key={perfil} value={perfil}>{perfil}</option>)}
                          </select>
                          {errosCampos.perfil && <FieldMessage id="perfil-erro" tone="error">{errosCampos.perfil}</FieldMessage>}
                        </div>
                        <PasswordField id="senha" label={editando ? "Nova senha" : "Senha"} value={draft.senha} onChange={(valor) => atualizar("senha", valor)} required={!editando || Boolean(draft.confirmarSenha)} error={errosCampos.senha} hint={editando ? "Deixe em branco se não quiser informar outra senha." : undefined} placeholder={editando ? "Opcional" : "Mínimo de 8 caracteres"} />
                        <PasswordField id="confirmarSenha" label="Confirmar senha" value={draft.confirmarSenha} onChange={(valor) => atualizar("confirmarSenha", valor)} required={!editando || Boolean(draft.senha)} error={errosCampos.confirmarSenha} placeholder="Repita a senha" />
                  </div>
                ) : <p className="mt-5 border-t border-[#4697c5]/20 pt-4 text-base leading-6 text-[#606b79]">Esta pessoa não terá acesso ao sistema.</p>}
              </section>
            )}
            {contexto === "PESSOA" && draft.tipo === "FISICA" && !podeGerenciarAcesso && (
              <p className="border-t border-[#d9e1ea] pt-5 text-base leading-6 text-[#606b79]">Somente administradores podem conceder ou alterar o acesso ao sistema.</p>
            )}

            <section className="border-t border-[#d9e1ea] pt-7">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Endereço</h2>
                <p className="mt-1 text-base leading-6 text-[#606b79]">Informações de localização.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(180px,.7fr)_minmax(240px,1.5fr)_minmax(180px,.6fr)]">
                {campo("cep", "CEP", { required: true, inputMode: "numeric", maxLength: 9, placeholder: "00000-000" })}
                <div className="md:col-span-2">{campo("logradouro", "Logradouro", { required: true, placeholder: "Rua, avenida..." })}</div>
                {campo("numero", "Número", { required: true, placeholder: "Nº" })}
                {campo("bairro", "Bairro", { required: true, placeholder: "Bairro" })}
                {campo("cidade", "Cidade", { required: true, placeholder: "Cidade" })}
                <div className="min-w-0">
                  <Label htmlFor="estado" className={labelClass}>Estado <span aria-label="obrigatório" className="text-red-700"> *</span></Label>
                  <select id="estado" value={draft.estado} onChange={(event) => atualizar("estado", event.target.value)} required aria-invalid={Boolean(errosCampos.estado)} aria-describedby={errosCampos.estado ? "estado-erro" : undefined} className={`${formInputClass} w-full outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30 ${errosCampos.estado ? "border-red-500" : ""}`}>
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(([uf, nome]) => <option key={uf} value={uf}>{uf} - {nome}</option>)}
                  </select>
                  {errosCampos.estado && <FieldMessage id="estado-erro" tone="error">{errosCampos.estado}</FieldMessage>}
                </div>
              </div>
            </section>

            {contexto !== "PESSOA" && <DadosAssistenciais contexto={contexto} dados={dadosContextuais} onChange={(dados) => { setDadosContextuais(dados); setErrosContextuais({}); }} errors={errosContextuais} pessoasDisponiveis={pessoasDisponiveis.filter((pessoa) => pessoa.tipo === "FISICA" && (!pessoa.familiaId || dadosContextuais.membros.some((membro) => membro.pessoaId === pessoa.id)))} />}

            <div className="flex justify-end gap-3 border-t border-[#d9e1ea] pb-8 pt-6">
              <Button type="button" variant="ghost" onClick={voltar} className="h-10 px-4 text-base">Cancelar</Button>
              <Button type="submit" className="h-10 bg-[#4697c5] px-5 text-base text-white hover:bg-[#67a0c0]">{salvando ? "Salvando..." : editando ? "Salvar alterações" : "Salvar cadastro"}</Button>
            </div>
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
