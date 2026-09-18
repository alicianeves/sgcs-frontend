import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Search,
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
  documentoPessoa,
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
  perfil: Perfil | "";
};

type CampoTexto = Exclude<keyof Draft, "tipo" | "concederAcesso">;

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
  perfil: "",
};

const cardClass = "rounded-2xl border border-[#d9e1ea] bg-white p-5 shadow-sm sm:p-6";
const inputClass =
  "h-10 rounded-lg border-[#d9e1ea] bg-white px-3 text-[15px] shadow-sm md:text-[15px]";
const labelClass = "mb-2 text-sm font-medium text-[#273440]";

function draftDePessoa(pessoa: Pessoa): Draft {
  return {
    ...draftVazio,
    tipo: pessoa.tipo,
    telefone: pessoa.telefone,
    cep: pessoa.cep,
    logradouro: pessoa.logradouro,
    numero: pessoa.numero,
    bairro: pessoa.bairro,
    cidade: pessoa.cidade,
    estado: pessoa.estado,
    ...(pessoa.tipo === "FISICA"
      ? {
          nome: pessoa.nome,
          cpf: pessoa.cpf,
          dataNascimento: pessoa.dataNascimento,
          email: pessoa.email,
          usuario: pessoa.usuario,
          perfil: pessoa.perfil,
          concederAcesso: Boolean(pessoa.usuario),
        }
      : { razaoSocial: pessoa.razaoSocial, cnpj: pessoa.cnpj }),
  };
}

function Field({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "email";
  maxLength?: number;
  max?: string;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className={labelClass}>
        {label}{required && <span className="text-[#1495D6]">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        max={max}
        className={inputClass}
      />
    </div>
  );
}

export default function PessoasPage({
  usuarioAtual,
}: {
  usuarioAtual: string;
}) {
  const [pessoas, setPessoas] = useState<Pessoa[]>(listarPessoas);
  const [busca, setBusca] = useState("");
  const [ordemAscendente, setOrdemAscendente] = useState(true);
  const [editando, setEditando] = useState<Pessoa | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftVazio);
  const [erro, setErro] = useState("");
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
    setDraft((anterior) => ({ ...anterior, [campo]: valor }));
    setErro("");
  }

  function abrirCadastro() {
    setEditando(null);
    setDraft({ ...draftVazio });
    setErro("");
    setAviso("");
    setFormularioAberto(true);
    window.scrollTo(0, 0);
  }

  function abrirEdicao(pessoa: Pessoa) {
    setEditando(pessoa);
    setDraft(draftDePessoa(pessoa));
    setErro("");
    setAviso("");
    setFormularioAberto(true);
    window.scrollTo(0, 0);
  }

  function voltar() {
    setFormularioAberto(false);
    setEditando(null);
    setErro("");
    window.scrollTo(0, 0);
  }

  function validar(): string {
    if (apenasNumeros(draft.telefone).length < 10) return "Informe um telefone válido com DDD.";
    if (apenasNumeros(draft.cep).length !== 8) return "Informe um CEP com 8 dígitos.";
    if (!draft.logradouro.trim() || !draft.numero.trim() || !draft.bairro.trim() ||
        !draft.cidade.trim() || !draft.estado.trim()) {
      return "Preencha todos os campos obrigatórios do endereço.";
    }
    if (draft.tipo === "FISICA") {
      if (!draft.nome.trim()) return "Informe o nome completo.";
      if (!cpfValido(draft.cpf)) return "Informe um CPF válido.";
      if (!draft.dataNascimento || draft.dataNascimento > new Date().toISOString().slice(0, 10)) {
        return "A data de nascimento não pode ser futura.";
      }
      if (pessoas.some((pessoa) =>
        pessoa.id !== editando?.id && pessoa.tipo === "FISICA" &&
        pessoa.cpf === apenasNumeros(draft.cpf))) {
        return "Já existe uma pessoa cadastrada com este CPF.";
      }
      if (draft.concederAcesso) {
        if (!draft.usuario.trim() || (!editando && !draft.senha)) {
          return "Informe usuário e senha para conceder acesso.";
        }
        if (!draft.perfil) return "Selecione um perfil de acesso.";
        if (pessoas.some((pessoa) =>
          pessoa.id !== editando?.id && pessoa.tipo === "FISICA" &&
          pessoa.usuario.toLocaleLowerCase("pt-BR") === draft.usuario.trim().toLocaleLowerCase("pt-BR"))) {
          return "Este nome de usuário já está em uso.";
        }
      }
      if (editando?.tipo === "FISICA" &&
          editando.usuario.toLocaleLowerCase("pt-BR") === usuarioAtual.toLocaleLowerCase("pt-BR") &&
          draft.perfil !== editando.perfil) {
        return "Você não pode alterar seu próprio perfil de acesso.";
      }
    } else {
      if (!draft.razaoSocial.trim()) return "Informe a razão social.";
      if (!cnpjValido(draft.cnpj)) return "Informe um CNPJ válido.";
      if (pessoas.some((pessoa) =>
        pessoa.id !== editando?.id && pessoa.tipo === "JURIDICA" &&
        pessoa.cnpj === apenasNumeros(draft.cnpj))) {
        return "Já existe uma pessoa cadastrada com este CNPJ.";
      }
    }
    return "";
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensagem = validar();
    if (mensagem) {
      setErro(mensagem);
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
    opcoes: { required?: boolean; disabled?: boolean; type?: string; placeholder?: string;
      inputMode?: "numeric" | "tel" | "email"; maxLength?: number; max?: string } = {},
  ) => (
    <Field
      id={chave}
      label={rotulo}
      value={draft[chave]}
      onChange={(valor) => atualizar(chave, valor)}
      {...opcoes}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-3 flex items-center gap-2 text-xs text-[#606b79]">
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
                <p className="mt-0.5 text-sm text-[#606b79]">{pessoasFiltradas.length} resultado(s)</p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button type="button" onClick={() => setOrdemAscendente((valor) => !valor)} className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-[#d9e1ea] px-3 text-sm text-[#606b79] md:hidden" aria-label="Ordenar por nome">
                  <ArrowUpDown size={16} /> Nome
                </button>
                <div className="relative min-w-0 flex-1 sm:w-80">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748393]" />
                  <Input
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
                    <p className="mt-1 text-sm text-[#606b79]">Pessoa {pessoa.tipo === "FISICA" ? "física" : "jurídica"} · {documentoPessoa(pessoa)}</p>
                    <p className="mt-1 text-sm text-[#606b79]">{pessoa.telefone}</p>
                    <div className="mt-3 flex gap-3 border-t border-[#e5eaf0] pt-3 text-sm font-medium text-[#0d5d86]">
                      <button type="button" onClick={() => abrirEdicao(pessoa)}>Editar</button>
                      <button type="button" onClick={() => alternarStatus(pessoa)}>{pessoa.status ? "Inativar" : "Ativar"}</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-[#e5eaf0] text-[#606b79]">
                    <tr>
                      <th scope="col" className="pb-3 font-medium">
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
                        <td className="py-4 pr-4 text-[#606b79]">{documentoPessoa(pessoa)}</td>
                        <td className="py-4 pr-4 text-[#606b79]">{pessoa.telefone}</td>
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
        <>
          <button type="button" onClick={voltar} className="mb-5 inline-flex items-center gap-2 text-sm text-[#606b79] hover:text-[#1495D6]"><ArrowLeft size={16} /> Voltar para pessoas</button>
          <div className="mb-7">
            <h1 className="text-[28px] font-bold tracking-tight">{editando ? "Editar pessoa" : "Cadastrar pessoa"}</h1>
            <p className="mt-1 text-sm text-[#606b79]">Preencha os dados de identificação, contato e endereço.</p>
          </div>
          <form onSubmit={salvar} className="space-y-5">
            {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
            <section className={cardClass}>
              <h2 className="mb-5 font-semibold">Identificação</h2>
              <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Tipo de pessoa">
                {(["FISICA", "JURIDICA"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    disabled={Boolean(editando)}
                    onClick={() => { setDraft({ ...draftVazio, tipo }); setErro(""); }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${draft.tipo === tipo ? "border-[#1495D6] bg-[#eaf7ff] text-[#0d5d86]" : "border-[#d9e1ea] text-[#606b79] hover:border-[#1495D6]"}`}
                  >
                    Pessoa {tipo === "FISICA" ? "física" : "jurídica"}
                  </button>
                ))}
              </div>
              {draft.tipo === "FISICA" ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {campo("nome", "Nome completo", { required: true, placeholder: "Nome da pessoa" })}
                  {campo("cpf", "CPF", { required: true, disabled: Boolean(editando), inputMode: "numeric", maxLength: 14, placeholder: "Somente números" })}
                  {campo("dataNascimento", "Data de nascimento", { required: true, type: "date", max: new Date().toISOString().slice(0, 10) })}
                  {campo("email", "E-mail pessoal", { type: "email", inputMode: "email", placeholder: "nome@exemplo.com" })}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {campo("razaoSocial", "Razão social", { required: true, placeholder: "Nome da organização" })}
                  {campo("cnpj", "CNPJ", { required: true, disabled: Boolean(editando), inputMode: "numeric", maxLength: 18, placeholder: "Somente números" })}
                </div>
              )}
            </section>

            <section className={cardClass}>
              <h2 className="mb-5 font-semibold">Contato e endereço</h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {campo("telefone", "Telefone", { required: true, type: "tel", inputMode: "tel", placeholder: "(18) 00000-0000" })}
                {campo("cep", "CEP", { required: true, inputMode: "numeric", maxLength: 9, placeholder: "00000-000" })}
                {campo("logradouro", "Logradouro", { required: true, placeholder: "Rua / Avenida" })}
                {campo("numero", "Número", { required: true, placeholder: "Número" })}
                {campo("bairro", "Bairro", { required: true, placeholder: "Bairro" })}
                {campo("cidade", "Cidade", { required: true, placeholder: "Cidade" })}
                {campo("estado", "Estado", { required: true, maxLength: 2, placeholder: "UF" })}
              </div>
            </section>

            {draft.tipo === "FISICA" && (
              <section className={cardClass}>
                <div className="flex items-start gap-3">
                  <input
                    id="concederAcesso"
                    type="checkbox"
                    checked={draft.concederAcesso}
                    onChange={(event) => setDraft((anterior) => ({ ...anterior, concederAcesso: event.target.checked }))}
                    className="mt-1 size-4 accent-[#1495D6]"
                  />
                  <div>
                    <Label htmlFor="concederAcesso" className="cursor-pointer font-semibold">Conceder acesso ao sistema</Label>
                    <p className="mt-1 text-sm text-[#606b79]">Disponível apenas para colaboradores da instituição.</p>
                  </div>
                </div>
                {draft.concederAcesso && (
                  <div className="mt-6 grid gap-5 border-t border-[#e5eaf0] pt-6 md:grid-cols-2 xl:grid-cols-3">
                    {campo("usuario", "Usuário", { required: true, placeholder: "Identificador de login" })}
                    {campo("senha", editando ? "Nova senha (opcional)" : "Senha", { required: !editando, type: "password", placeholder: editando ? "Deixe vazio para manter" : "Defina uma senha" })}
                    <div>
                      <Label htmlFor="perfil" className={labelClass}>Perfil de acesso <span className="text-[#1495D6]">*</span></Label>
                      <select
                        id="perfil"
                        value={draft.perfil}
                        onChange={(event) => atualizar("perfil", event.target.value as Perfil | "")}
                        required
                        className="h-10 w-full rounded-lg border border-[#d9e1ea] bg-white px-3 text-sm shadow-sm outline-none focus:border-[#1495D6]"
                      >
                        <option value="">Selecione um perfil</option>
                        {perfis.map((perfil) => <option key={perfil} value={perfil}>{perfil}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="flex justify-end gap-3 pb-8">
              <Button type="button" variant="outline" onClick={voltar} className="h-10 px-4">Cancelar</Button>
              <Button type="submit" className="h-10 bg-[#1495D6] px-5 text-white hover:bg-[#117eb5]"><Check size={17} /> Salvar cadastro</Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
