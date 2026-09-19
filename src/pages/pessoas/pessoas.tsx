import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpDown,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
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
import {
  apenasNumeros,
  cnpjValido,
  cpfValido,
  documentoFormatado,
  documentoPessoa,
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarTelefone,
  listarPessoas,
  nomePessoa,
  perfis,
  salvarPessoas,
  type Perfil,
  type Pessoa,
  type TipoPessoa,
} from "@/services/pessoaService";

type Draft = {
  tipo: TipoPessoa;
  nome: string;
  cpf: string;
  dataNascimento: string;
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
  "h-11 rounded-lg border-[#d5dbe2] bg-white px-4 text-[15px] shadow-sm md:text-[15px]";
const labelClass = "mb-2 text-[15px] font-medium text-[#273440]";
const helperTextClass = "mt-2 text-[13px] leading-5";

function hojeLocal() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
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
          email: pessoa.email,
          usuario: pessoa.usuario,
          perfil: pessoa.perfil,
          concederAcesso: Boolean(pessoa.usuario),
        }
      : { razaoSocial: pessoa.razaoSocial, cnpj: formatarCnpj(pessoa.cnpj) }),
  };
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
          className={`${formInputClass} ${readOnly ? "bg-[#edf1f5] text-[#606b79]" : ""} ${type === "date" ? "cursor-pointer pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0" : ""} ${error ? "border-red-500 focus-visible:border-red-500" : ""}`}
        />
        {type === "date" && <CalendarDays className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#657384]" aria-hidden="true" />}
      </div>
      {error && <p id={`${id}-erro`} className={`${helperTextClass} text-red-700`}>{error}</p>}
      {!error && hint && <p id={`${id}-ajuda`} className={`${helperTextClass} ${highlightHint ? "text-red-700" : "text-[#606b79]"}`}>{hint}</p>}
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
  hint: string;
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
          aria-describedby={error ? `${id}-erro` : `${id}-ajuda`}
          placeholder={placeholder}
          className={`${formInputClass} pr-11 ${error ? "border-red-500" : ""}`}
        />
        <button type="button" onClick={() => setVisivel((anterior) => !anterior)} aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${id === "senha" ? "senha" : "confirmação de senha"}`} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-[#606b79] hover:text-[#0d5d86] focus-visible:outline-2 focus-visible:outline-[#1495D6]">
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? <p id={`${id}-erro`} className={`${helperTextClass} text-red-700`}>{error}</p> : <p id={`${id}-ajuda`} className={`${helperTextClass} text-[#606b79]`}>{hint}</p>}
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
  const [pessoas, setPessoas] = useState<Pessoa[]>(listarPessoas);
  const [busca, setBusca] = useState("");
  const [ordemAscendente, setOrdemAscendente] = useState(true);
  const [editando, setEditando] = useState<Pessoa | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftVazio);
  const [erro, setErro] = useState("");
  const [errosCampos, setErrosCampos] = useState<ErrosCampos>({});
  const [aviso, setAviso] = useState("");

  const pessoasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const digitos = apenasNumeros(busca);
    return pessoas
      .filter((pessoa) =>
        !termo ||
        nomePessoa(pessoa).toLocaleLowerCase("pt-BR").includes(termo) ||
        (digitos.length > 0 && apenasNumeros(documentoPessoa(pessoa)).includes(digitos)),
      )
      .sort((a, b) =>
        nomePessoa(a).localeCompare(nomePessoa(b), "pt-BR") * (ordemAscendente ? 1 : -1),
      );
  }, [pessoas, busca, ordemAscendente]);

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
  }

  function abrirCadastro() {
    setEditando(null);
    setDraft({ ...draftVazio });
    setErro("");
    setErrosCampos({});
    setAviso("");
    setFormularioAberto(true);
    window.scrollTo(0, 0);
  }

  function abrirEdicao(pessoa: Pessoa) {
    setEditando(pessoa);
    setDraft(draftDePessoa(pessoa));
    setErro("");
    setErrosCampos({});
    setAviso("");
    setFormularioAberto(true);
    window.scrollTo(0, 0);
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
      else if (pessoas.some((pessoa) =>
        pessoa.id !== editando?.id && pessoa.tipo === "FISICA" &&
        pessoa.cpf === apenasNumeros(draft.cpf))) {
        falhas.cpf = "Este CPF já está cadastrado.";
      }
      if (!draft.dataNascimento) falhas.dataNascimento = "Informe a data de nascimento.";
      else if (draft.dataNascimento > hojeLocal()) falhas.dataNascimento = "A data não pode ser futura.";
      if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
        falhas.email = "Informe um e-mail válido.";
      }
      const telefone = apenasNumeros(draft.telefone);
      if (telefone.length !== 10 && telefone.length !== 11) falhas.telefone = "Informe telefone com DDD.";
      if (draft.concederAcesso) {
        if (!draft.email.trim()) falhas.email = "Informe o e-mail para contato e recuperação de senha.";
        if (!draft.usuario.trim()) falhas.usuario = "Informe um usuário de login.";
        else if (pessoas.some((pessoa) =>
          pessoa.id !== editando?.id && pessoa.tipo === "FISICA" &&
          pessoa.usuario.toLocaleLowerCase("pt-BR") === draft.usuario.trim().toLocaleLowerCase("pt-BR"))) {
          falhas.usuario = "Este usuário já está em uso.";
        }
        if (!editando && !draft.senha) falhas.senha = "Defina uma senha.";
        else if (draft.senha && draft.senha.length < 8) falhas.senha = "Use pelo menos 8 caracteres.";
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
      else if (pessoas.some((pessoa) =>
        pessoa.id !== editando?.id && pessoa.tipo === "JURIDICA" &&
        pessoa.cnpj === apenasNumeros(draft.cnpj))) {
        falhas.cnpj = "Este CNPJ já está cadastrado.";
      }
      const telefone = apenasNumeros(draft.telefone);
      if (telefone.length !== 10 && telefone.length !== 11) falhas.telefone = "Informe telefone com DDD.";
    }
    if (apenasNumeros(draft.cep).length !== 8) falhas.cep = "Informe um CEP com 8 dígitos.";
    if (!draft.logradouro.trim()) falhas.logradouro = "Informe o logradouro.";
    if (!draft.numero.trim()) falhas.numero = "Informe o número.";
    if (!draft.bairro.trim()) falhas.bairro = "Informe o bairro.";
    if (!draft.cidade.trim()) falhas.cidade = "Informe a cidade.";
    if (!/^[A-Za-z]{2}$/.test(draft.estado.trim())) falhas.estado = "Informe a sigla do estado (UF).";
    return falhas;
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const falhas = validar();
    if (Object.keys(falhas).length > 0) {
      setErrosCampos(falhas);
      setErro("Revise os campos indicados abaixo.");
      const primeiroCampo = Object.keys(falhas)[0];
      if (primeiroCampo) {
        requestAnimationFrame(() => document.getElementById(primeiroCampo)?.focus());
      }
      return;
    }

    const base = {
      id: editando?.id ?? crypto.randomUUID(),
      telefone: apenasNumeros(draft.telefone),
      cep: apenasNumeros(draft.cep),
      logradouro: draft.logradouro.trim(),
      numero: draft.numero.trim(),
      bairro: draft.bairro.trim(),
      cidade: draft.cidade.trim(),
      estado: draft.estado.trim().toUpperCase(),
      status: editando?.status ?? true,
      dataCriacao: editando?.dataCriacao ?? new Date().toISOString(),
      dataInativacao: editando?.dataInativacao ?? null,
    };
    const pessoa: Pessoa = draft.tipo === "FISICA"
      ? {
          ...base,
          tipo: "FISICA",
          nome: draft.nome.trim(),
          cpf: apenasNumeros(draft.cpf),
          dataNascimento: draft.dataNascimento,
          email: draft.email.trim(),
          usuario: draft.concederAcesso ? draft.usuario.trim() : "",
          perfil: draft.concederAcesso ? draft.perfil : "",
        }
      : {
          ...base,
          tipo: "JURIDICA",
          razaoSocial: draft.razaoSocial.trim(),
          cnpj: apenasNumeros(draft.cnpj),
        };

    const atualizadas = editando
      ? pessoas.map((item) => item.id === editando.id ? pessoa : item)
      : [...pessoas, pessoa];
    try {
      salvarPessoas(atualizadas);
      setPessoas(atualizadas);
      voltar();
      setAviso(draft.concederAcesso
        ? "Pessoa salva neste navegador. O acesso ao sistema depende da integração com o backend."
        : `Pessoa ${editando ? "atualizada" : "cadastrada"} neste navegador.`);
    } catch {
      setErro("Não foi possível salvar os dados neste navegador.");
    }
  }

  function alternarStatus(pessoa: Pessoa) {
    if (pessoa.tipo === "FISICA" && pessoa.status &&
        pessoa.usuario.toLocaleLowerCase("pt-BR") === usuarioAtual.toLocaleLowerCase("pt-BR")) {
      setAviso("Você não pode inativar seu próprio cadastro.");
      return;
    }
    const atualizadas = pessoas.map((item): Pessoa => item.id === pessoa.id
      ? { ...item, status: !item.status, dataInativacao: item.status ? new Date().toISOString() : null }
      : item);
    try {
      salvarPessoas(atualizadas);
      setPessoas(atualizadas);
      setAviso(`Pessoa ${pessoa.status ? "inativada" : "reativada"} neste navegador.`);
    } catch {
      setAviso("Não foi possível alterar o status neste navegador.");
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
      <div className={`mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[#606b79] ${formularioAberto ? "text-sm" : "text-xs"}`}>
        <span>Sistema</span><ChevronRight size={13} /><span>Administração</span>
        <ChevronRight size={13} /><span className="text-[#273440]">Pessoas</span>
        {formularioAberto && <><ChevronRight size={13} /><span>{editando ? "Editar" : "Nova pessoa"}</span></>}
      </div>

      {aviso && (
        <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#bde0f4] bg-[#eaf7ff] px-4 py-3 text-sm text-[#0d5d86]">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso("")} aria-label="Fechar aviso"><X size={16} /></button>
        </div>
      )}

      {!formularioAberto ? (
        <>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight">Gerenciamento de pessoas</h1>
              <p className="mt-1 text-sm text-[#606b79]">Cadastre e acompanhe pessoas físicas e jurídicas em um só lugar.</p>
            </div>
            <Button type="button" onClick={abrirCadastro} className="h-10 gap-2 bg-[#1495D6] px-4 text-white hover:bg-[#117eb5]">
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
                <div className="relative min-w-0 flex-1 sm:w-80">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748393]" />
                  <Input
                    type="search"
                    aria-label="Buscar por nome ou CPF/CNPJ"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar por nome ou CPF/CNPJ"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            {pessoasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eaf7ff] text-[#1495D6]"><UsersRound size={27} /></span>
                <h3 className="mt-4 font-semibold">{busca ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa cadastrada"}</h3>
                <p className="mt-1 max-w-sm text-sm text-[#606b79]">{busca ? "Tente outro nome ou documento." : "Comece cadastrando a primeira pessoa física ou jurídica."}</p>
                {!busca && <Button type="button" onClick={abrirCadastro} className="mt-5 bg-[#1495D6] text-white hover:bg-[#117eb5]"><Plus size={16} /> Nova pessoa</Button>}
              </div>
            ) : (
              <>
              <div className="space-y-3 md:hidden">
                {pessoasFiltradas.map((pessoa) => (
                  <div key={pessoa.id} className="rounded-xl border border-[#e5eaf0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => abrirEdicao(pessoa)} className="text-left font-semibold hover:text-[#1495D6]">{nomePessoa(pessoa)}</button>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${pessoa.status ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{pessoa.status ? "Ativa" : "Inativa"}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#606b79]">Pessoa {pessoa.tipo === "FISICA" ? "física" : "jurídica"} · {documentoFormatado(pessoa)}</p>
                    <p className="mt-1 text-sm text-[#606b79]">{formatarTelefone(pessoa.telefone)}</p>
                    <div className="mt-3 flex gap-3 border-t border-[#e5eaf0] pt-3 text-sm font-medium text-[#0d5d86]">
                      <button type="button" onClick={() => abrirEdicao(pessoa)}>Editar</button>
                      <button type="button" onClick={() => alternarStatus(pessoa)}>{pessoa.status ? "Inativar" : "Ativar"}</button>
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
                        <button type="button" onClick={() => setOrdemAscendente((valor) => !valor)} className="flex items-center gap-1.5 hover:text-[#1495D6]">
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
                          <button type="button" onClick={() => abrirEdicao(pessoa)} className="text-left hover:text-[#1495D6]">{nomePessoa(pessoa)}</button>
                        </td>
                        <td className="py-4 pr-4 text-[#606b79]">{pessoa.tipo === "FISICA" ? "Física" : "Jurídica"}</td>
                        <td className="py-4 pr-4 text-[#606b79]">{documentoFormatado(pessoa)}</td>
                        <td className="py-4 pr-4 text-[#606b79]">{formatarTelefone(pessoa.telefone)}</td>
                        <td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pessoa.status ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{pessoa.status ? "Ativa" : "Inativa"}</span></td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => abrirEdicao(pessoa)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#1495D6]" aria-label={`Editar ${nomePessoa(pessoa)}`}><Pencil size={16} /></button>
                            <button type="button" onClick={() => alternarStatus(pessoa)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#0d5d86] hover:bg-[#eaf7ff]">{pessoa.status ? "Inativar" : "Ativar"}</button>
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
            <h1 className="text-[30px] font-bold tracking-tight">{editando ? "Editar pessoa" : "Nova pessoa"}</h1>
            <p className="mt-1 text-[15px] leading-6 text-[#606b79]">{editando ? "Atualize os dados da pessoa no Centro Social." : "Cadastre uma nova pessoa no Centro Social."}</p>
          </div>
          <form onSubmit={salvar} noValidate className="space-y-8">
            {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
            <fieldset>
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
                      <span className={`relative flex min-h-[104px] items-center gap-4 rounded-xl border p-5 text-left transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1495D6] ${selecionado ? "border-[#1495D6] bg-[#1495D6]/[.045] ring-1 ring-[#1495D6]/20" : "border-[#d9e1ea] bg-white hover:border-[#1495D6]/50"} ${editando ? "opacity-80" : ""}`}>
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${selecionado ? "bg-[#1495D6] text-white" : "bg-[#edf1f4] text-[#748393]"}`}>
                          <Icone className="size-[18px]" aria-hidden="true" />
                        </span>
                        <span>
                          <strong className="block text-[15px] font-semibold">Pessoa {tipo === "FISICA" ? "Física" : "Jurídica"}</strong>
                          <small className="mt-1 block text-[13px] leading-5 text-[#606b79]">Cadastro de {tipo === "FISICA" ? "uma pessoa" : "uma organização"}</small>
                        </span>
                        {selecionado && <Check className="absolute right-4 top-4 size-4 text-[#1495D6]" aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
              {editando && <p className={`${helperTextClass} text-[#606b79]`}>O tipo de pessoa não pode ser alterado após o cadastro.</p>}
            </fieldset>

            <section className="border-t border-[#d9e1ea] pt-7">
              <div className="mb-5">
                <h2 className="text-[17px] font-semibold">{draft.tipo === "FISICA" ? "Dados pessoais" : "Dados da empresa"}</h2>
                <p className="mt-1 text-[15px] leading-6 text-[#606b79]">{draft.tipo === "FISICA" ? "Informações de identificação e contato." : "Informações de identificação e contato da organização."}</p>
              </div>
              {draft.tipo === "FISICA" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">{campo("nome", "Nome completo", { required: true, placeholder: "Digite o nome completo" })}</div>
                  {campo("cpf", "CPF", { required: true, readOnly: Boolean(editando), inputMode: "numeric", maxLength: 14, placeholder: "000.000.000-00", hint: editando ? "O CPF não pode ser alterado após o cadastro." : undefined })}
                  {campo("dataNascimento", "Data de nascimento", { required: true, type: "date", max: hojeLocal() })}
                  {campo("telefone", "Telefone", { required: true, type: "tel", inputMode: "tel", placeholder: "(00) 00000-0000" })}
                  {campo("email", "E-mail pessoal", { required: draft.concederAcesso, type: "email", inputMode: "email", placeholder: "nome@email.com", hint: draft.concederAcesso ? "Usado para contato e recuperação de senha." : undefined, highlightHint: draft.concederAcesso })}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
                  {campo("razaoSocial", "Razão social", { required: true, placeholder: "Digite a razão social" })}
                  {campo("cnpj", "CNPJ", { required: true, readOnly: Boolean(editando), inputMode: "numeric", maxLength: 18, placeholder: "00.000.000/0000-00", hint: editando ? "O CNPJ não pode ser alterado após o cadastro." : undefined })}
                  {campo("telefone", "Telefone", { required: true, type: "tel", inputMode: "tel", placeholder: "(00) 0000-0000" })}
                </div>
              )}
            </section>

            {draft.tipo === "FISICA" && podeGerenciarAcesso && (
              <section className="rounded-xl border border-[#1495D6]/25 bg-[#1495D6]/[.045] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[17px] font-semibold">Acesso ao sistema</h2>
                    <p id="acesso-ajuda" className="mt-1 text-[15px] leading-6 text-[#606b79]">Defina se esta pessoa poderá acessar o sistema.</p>
                  </div>
                  <label htmlFor="concederAcesso" className="flex shrink-0 cursor-pointer items-center gap-3 text-[15px] font-medium">
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
                    <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-[#d9e1ea] transition-colors peer-checked:bg-[#1495D6] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1495D6] after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {errosCampos.concederAcesso && <p id="acesso-erro" className={`${helperTextClass} text-red-700`}>{errosCampos.concederAcesso}</p>}
                {draft.concederAcesso ? (
                  <div className="mt-6 grid gap-5 border-t border-[#1495D6]/20 pt-5 sm:grid-cols-2">
                        {campo("usuario", "Usuário", { required: true, placeholder: "Digite o usuário de acesso" })}
                        <div className="min-w-0">
                          <Label htmlFor="perfil" className={labelClass}>Acesso <span aria-label="obrigatório" className="text-red-700">*</span></Label>
                          <select
                            id="perfil"
                            value={draft.perfil}
                            onChange={(event) => atualizar("perfil", event.target.value as Perfil | "")}
                            required
                            aria-invalid={Boolean(errosCampos.perfil)}
                            aria-describedby={errosCampos.perfil ? "perfil-erro" : "perfil-ajuda"}
                            className={`h-11 w-full rounded-lg border bg-white px-4 text-[15px] shadow-sm outline-none focus-visible:border-[#1495D6] focus-visible:ring-2 focus-visible:ring-[#1495D6]/30 ${errosCampos.perfil ? "border-red-500" : "border-[#d5dbe2]"}`}
                          >
                            <option value="">Selecione o nível de acesso</option>
                            {perfis.map((perfil) => <option key={perfil} value={perfil}>{perfil}</option>)}
                          </select>
                          {errosCampos.perfil ? <p id="perfil-erro" className={`${helperTextClass} text-red-700`}>{errosCampos.perfil}</p> : <p id="perfil-ajuda" className={`${helperTextClass} text-[#606b79]`}>Define as áreas disponíveis.</p>}
                        </div>
                        <PasswordField id="senha" label={editando ? "Nova senha" : "Senha"} value={draft.senha} onChange={(valor) => atualizar("senha", valor)} required={!editando || Boolean(draft.confirmarSenha)} error={errosCampos.senha} hint={editando ? "Deixe em branco se não quiser informar outra senha." : "Use pelo menos 8 caracteres."} placeholder={editando ? "Opcional" : "Mínimo de 8 caracteres"} />
                        <PasswordField id="confirmarSenha" label="Confirmar senha" value={draft.confirmarSenha} onChange={(valor) => atualizar("confirmarSenha", valor)} required={!editando || Boolean(draft.senha)} error={errosCampos.confirmarSenha} hint="Digite a mesma senha novamente." placeholder="Repita a senha" />
                  </div>
                ) : <p className="mt-5 border-t border-[#1495D6]/20 pt-4 text-[15px] leading-6 text-[#606b79]">Esta pessoa não terá acesso ao sistema.</p>}
              </section>
            )}
            {draft.tipo === "FISICA" && !podeGerenciarAcesso && (
              <p className="border-t border-[#d9e1ea] pt-5 text-[15px] leading-6 text-[#606b79]">Somente administradores podem conceder ou alterar o acesso ao sistema.</p>
            )}

            <section className="border-t border-[#d9e1ea] pt-7">
              <div className="mb-5">
                <h2 className="text-[17px] font-semibold">Endereço</h2>
                <p className="mt-1 text-[15px] leading-6 text-[#606b79]">Informações de localização.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(180px,.7fr)_minmax(240px,1.5fr)_minmax(180px,.6fr)]">
                {campo("cep", "CEP", { required: true, inputMode: "numeric", maxLength: 9, placeholder: "00000-000" })}
                <div className="md:col-span-2">{campo("logradouro", "Logradouro", { required: true, placeholder: "Rua, avenida..." })}</div>
                {campo("numero", "Número", { required: true, placeholder: "Nº" })}
                {campo("bairro", "Bairro", { required: true, placeholder: "Bairro" })}
                {campo("cidade", "Cidade", { required: true, placeholder: "Cidade" })}
                {campo("estado", "Estado", { required: true, maxLength: 2, placeholder: "Selecione" })}
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-[#d9e1ea] pb-8 pt-6">
              <Button type="button" variant="ghost" onClick={voltar} className="h-10 px-4 text-[15px]">Cancelar</Button>
              <Button type="submit" className="h-10 bg-[#1495D6] px-5 text-[15px] text-white hover:bg-[#117eb5]">{editando ? "Salvar alterações" : "Salvar pessoa"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
