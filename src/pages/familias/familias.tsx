import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  alternarStatusFamilia, buscarFamilia, dadosFamiliaVazios, formatarMoeda, listarFamilias,
  nomeAvaliacao, nomeVinculo, opcoesVinculo, salvarFamilia, valorMonetario,
  type DadosFamilia, type Familia, type FamiliaResumo, type VinculoFamiliar,
} from "@/services/familiaService";
import { formatarCpf, listarPessoas, type Pessoa } from "@/services/pessoaService";

const cardClass = "rounded-2xl border border-[#d9e1ea] bg-white p-5 shadow-sm sm:p-6";
const inputClass = "h-11 rounded-lg border-[#d5dbe2] bg-[#f8fafb] px-4 text-base shadow-sm";
const selectClass = "h-11 w-full rounded-lg border border-[#d5dbe2] bg-[#f8fafb] px-4 text-base shadow-sm outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30";

function BreadcrumbFamilias({ etapa }: { etapa?: string }) {
  return <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-[#606b79]">
    <span>Sistema</span><ChevronRight size={13} /><span>Administração</span><ChevronRight size={13} /><span>Famílias</span>
    {etapa && <><ChevronRight size={13} /><span className="text-[#273440]">{etapa}</span></>}
  </nav>;
}

export default function FamiliasPage() {
  const [familias, setFamilias] = useState<FamiliaResumo[]>([]);
  const [modo, setModo] = useState<"lista" | "detalhe" | "formulario">("lista");
  const [familiaAtual, setFamiliaAtual] = useState<Familia | null>(null);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"ativas" | "inativas" | "todas">("ativas");
  const [carregando, setCarregando] = useState(true);
  const [consultando, setConsultando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [avisoErro, setAvisoErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [confirmacao, setConfirmacao] = useState<FamiliaResumo | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (modo !== "lista") return;
    const controller = new AbortController();
    const atraso = window.setTimeout(() => listarFamilias(controller.signal, {
      busca, status: statusFiltro === "todas" ? undefined : statusFiltro === "ativas",
    }).then((dados) => { if (!controller.signal.aborted) { setFamilias(dados); setErro(""); } })
      .catch((falha: unknown) => { if (!controller.signal.aborted) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as famílias."); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); }), 250);
    return () => { window.clearTimeout(atraso); controller.abort(); };
  }, [busca, statusFiltro, tentativa, modo]);

  async function consultar(id: string, destino: "detalhe" | "formulario") {
    setConsultando(id); setErro(""); setAviso(""); setAvisoErro(false);
    try {
      setFamiliaAtual(await buscarFamilia(id));
      setModo(destino); window.scrollTo(0, 0);
    } catch (falha) {
      setAviso(falha instanceof Error ? falha.message : "Não foi possível consultar a família.");
      setAvisoErro(true);
    } finally { setConsultando(null); }
  }

  function voltarLista(mensagem = "") {
    setFamiliaAtual(null); setCarregando(true); setModo("lista"); setAviso(mensagem); setAvisoErro(false); setTentativa((valor) => valor + 1); window.scrollTo(0, 0);
  }

  async function alternar(familia: FamiliaResumo) {
    setProcessando(familia.id);
    try {
      await alternarStatusFamilia(familia.id, familia.status);
      voltarLista(`Família ${familia.status ? "inativada" : "reativada"} com sucesso.`);
    } catch (falha) {
      setAviso(falha instanceof Error ? falha.message : "Não foi possível alterar o status da família.");
      setAvisoErro(true);
    } finally { setProcessando(null); setConfirmacao(null); }
  }

  if (modo === "formulario") return <FormularioFamilia familia={familiaAtual} onCancelar={() => voltarLista()} onSalvo={(editando) => voltarLista(editando ? "Família atualizada com sucesso." : "Família cadastrada com sucesso.")} />;
  if (modo === "detalhe" && familiaAtual) return <>{confirmacao && <ConfirmarStatus familia={confirmacao} processando={processando === confirmacao.id} onCancelar={() => setConfirmacao(null)} onConfirmar={() => alternar(confirmacao)} />}<DetalheFamilia familia={familiaAtual} aviso={aviso} avisoErro={avisoErro} onVoltar={() => voltarLista()} onEditar={() => setModo("formulario")} onAlterarStatus={() => setConfirmacao(familiaAtual)} /></>;

  return <div className="mx-auto w-full max-w-[1600px]">
    <BreadcrumbFamilias />
    {confirmacao && <ConfirmarStatus familia={confirmacao} processando={processando === confirmacao.id} onCancelar={() => setConfirmacao(null)} onConfirmar={() => alternar(confirmacao)} />}
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><h1 className="text-[28px] font-bold tracking-tight">Famílias</h1><p className="mt-1 text-sm text-[#606b79]">Cadastre e acompanhe as famílias atendidas pelo Centro Social.</p></div>
      <Button type="button" onClick={() => { setFamiliaAtual(null); setModo("formulario"); setAviso(""); setAvisoErro(false); window.scrollTo(0, 0); }} className="h-10 gap-2 bg-[#4697c5] px-4 text-white hover:bg-[#67a0c0]"><Plus size={17} /> Cadastrar nova família</Button>
    </div>
    {aviso && <div role={avisoErro ? "alert" : "status"} className={`mb-5 rounded-xl border px-4 py-3 text-sm ${avisoErro ? "border-red-200 bg-red-50 text-red-700" : "border-[#b8ddc9] bg-[#effaf4] text-[#19704b]"}`}>{aviso}</div>}
    <section className={cardClass}>
      <div className="mb-5 flex flex-col gap-4 border-b border-[#e5eaf0] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-semibold">Famílias cadastradas</h2><p className="mt-1 text-sm text-[#606b79]">{familias.length} registro(s) encontrado(s)</p></div>
        <div className="flex w-full gap-2 sm:w-auto">
          <select aria-label="Filtrar famílias por status" value={statusFiltro} onChange={(event) => { setCarregando(true); setStatusFiltro(event.target.value as typeof statusFiltro); }} className="h-10 rounded-lg border border-[#d9e1ea] bg-white px-3 text-sm text-[#606b79] shadow-sm"><option value="ativas">Ativas</option><option value="inativas">Inativas</option><option value="todas">Todas</option></select>
          <div className="relative min-w-0 flex-1 sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748393]" /><Input value={busca} onChange={(event) => { setCarregando(true); setBusca(event.target.value); }} placeholder="Buscar por nome da família" className="h-10 rounded-lg border-[#d9e1ea] bg-white pl-9 text-[15px] shadow-sm" /></div>
        </div>
      </div>
      {carregando ? <p role="status" className="py-10 text-center text-[#606b79]">Carregando famílias...</p> : erro ? <div role="alert" className="py-10 text-center text-red-700"><p>{erro}</p><Button type="button" variant="outline" onClick={() => { setCarregando(true); setTentativa((valor) => valor + 1); }} className="mt-4">Tentar novamente</Button></div> : familias.length === 0 ? <div className="flex flex-col items-center py-16 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-[#eaf7ff] text-[#4697c5]"><UsersRound size={27} /></span><h3 className="mt-4 font-semibold">{busca ? "Nenhuma família encontrada" : "Nenhuma família cadastrada"}</h3><p className="mt-1 text-sm text-[#606b79]">{busca ? "Tente buscar por outro nome." : "Comece cadastrando a primeira família."}</p></div> : <TabelaFamilias familias={familias} consultando={consultando} processando={processando} onDetalhe={(id) => consultar(id, "detalhe")} onEditar={(id) => consultar(id, "formulario")} onStatus={setConfirmacao} />}
    </section>
  </div>;
}

function TabelaFamilias({ familias, consultando, processando, onDetalhe, onEditar, onStatus }: { familias: FamiliaResumo[]; consultando: string | null; processando: string | null; onDetalhe: (id: string) => void; onEditar: (id: string) => void; onStatus: (familia: FamiliaResumo) => void }) {
  return <><div className="space-y-3 md:hidden">{familias.map((familia) => <article key={familia.id} className="rounded-xl border border-[#e5eaf0] p-4"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => onDetalhe(familia.id)} className="text-left font-semibold hover:text-[#4697c5]">{familia.nome}</button><Status ativa={familia.status} /></div><p className="mt-1 text-sm text-[#606b79]">{familia.quantidadeIntegrantes} integrante(s) · {nomeAvaliacao(familia.avaliacao)}</p><div className="mt-3 flex gap-3 border-t border-[#e5eaf0] pt-3 text-sm font-medium text-[#0d5d86]"><button type="button" disabled={consultando !== null} onClick={() => onDetalhe(familia.id)}>{consultando === familia.id ? "Consultando..." : "Visualizar"}</button><button type="button" disabled={consultando !== null} onClick={() => onEditar(familia.id)}>Editar</button><button type="button" disabled={Boolean(processando)} onClick={() => onStatus(familia)}>{familia.status ? "Inativar" : "Reativar"}</button></div></article>)}</div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[#e5eaf0] text-[#606b79]"><tr><th className="pb-3 font-medium">Nome da família</th><th className="pb-3 font-medium">Integrantes</th><th className="pb-3 font-medium">Avaliação</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Ações</th></tr></thead><tbody>{familias.map((familia) => <tr key={familia.id} className="border-b border-[#edf0f3] last:border-0"><td className="py-4 pr-4 font-medium"><button type="button" onClick={() => onDetalhe(familia.id)} className="hover:text-[#4697c5]">{familia.nome}</button></td><td className="py-4 pr-4 text-[#606b79]">{familia.quantidadeIntegrantes}</td><td className="py-4 pr-4 text-[#606b79]">{nomeAvaliacao(familia.avaliacao)}</td><td className="py-4 pr-4"><Status ativa={familia.status} /></td><td className="py-4"><div className="flex justify-end gap-1"><button type="button" disabled={consultando !== null} onClick={() => onDetalhe(familia.id)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#4697c5]" aria-label={`Visualizar ${familia.nome}`}><Eye size={16} /></button><button type="button" disabled={consultando !== null} onClick={() => onEditar(familia.id)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#4697c5]" aria-label={`Editar ${familia.nome}`}><Pencil size={16} /></button><button type="button" disabled={Boolean(processando)} onClick={() => onStatus(familia)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#0d5d86] hover:bg-[#eaf7ff]">{familia.status ? "Inativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div></>;
}

function DetalheFamilia({ familia, aviso, avisoErro, onVoltar, onEditar, onAlterarStatus }: { familia: Familia; aviso: string; avisoErro: boolean; onVoltar: () => void; onEditar: () => void; onAlterarStatus: () => void }) {
  const rendas = familia.rendas.filter((renda) => renda.ativa);
  const total = rendas.reduce((soma, renda) => soma + (valorMonetario(renda.valor) ?? 0), 0);
  return <div className="mx-auto w-full max-w-[1600px]"><BreadcrumbFamilias etapa="Visualizar" />{aviso && <div role={avisoErro ? "alert" : "status"} className={`mb-5 rounded-xl border px-4 py-3 text-sm ${avisoErro ? "border-red-200 bg-red-50 text-red-700" : "border-[#b8ddc9] bg-[#effaf4] text-[#19704b]"}`}>{aviso}</div>}<Button type="button" variant="ghost" onClick={onVoltar} className="mb-5 h-9 px-2"><ArrowLeft className="size-4" /> Voltar para famílias</Button><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-[30px] font-bold tracking-tight">{familia.nome}</h1><p className="mt-1 text-base text-[#606b79]">Dados cadastrados da família.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={onAlterarStatus}>{familia.status ? "Inativar" : "Reativar"}</Button><Button type="button" onClick={onEditar} className="bg-[#4697c5] text-white hover:bg-[#67a0c0]"><Pencil className="size-4" /> Editar família</Button></div></div><div className="grid gap-5 lg:grid-cols-2"><section className={cardClass}><h2 className="text-lg font-semibold">Identificação</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Nome da família" valor={familia.nome} /><Info label="Situação" valor={familia.status ? "Ativa" : "Inativa"} /><Info label="Avaliação" valor={nomeAvaliacao(familia.avaliacao)} /><Info label="Integrantes" valor={String(familia.quantidadeIntegrantes)} /></dl></section><section className={cardClass}><h2 className="text-lg font-semibold">Renda familiar</h2>{rendas.length ? <><dl className="mt-5 space-y-3">{rendas.map((renda) => <div key={renda.tipo} className="flex justify-between gap-4"><dt className="text-[#606b79]">{renda.nome}</dt><dd className="font-medium">{formatarMoeda(renda.valor)}</dd></div>)}</dl><div className="mt-4 flex justify-between border-t border-[#e5eaf0] pt-4 font-semibold"><span>Total mensal</span><span>{formatarMoeda(total)}</span></div></> : <p className="mt-3 text-[#606b79]">Nenhuma fonte de renda informada.</p>}</section><section className={`${cardClass} lg:col-span-2`}><h2 className="text-lg font-semibold">Composição familiar</h2>{familia.membros.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#e5eaf0] text-[#606b79]"><tr><th className="pb-3 font-medium">Nome</th><th className="pb-3 font-medium">CPF</th><th className="pb-3 font-medium">Nascimento / idade</th><th className="pb-3 font-medium">Vínculo</th></tr></thead><tbody>{familia.membros.map((membro) => <tr key={membro.id} className="border-b border-[#edf0f3] last:border-0"><td className="py-3 font-medium">{membro.nome}</td><td className="py-3 text-[#606b79]">{membro.cpf ? formatarCpf(membro.cpf) : "Não informado"}</td><td className="py-3 text-[#606b79]">{membro.dataNascimento || (membro.idade ? `${membro.idade} anos` : "Não informado")}</td><td className="py-3 text-[#606b79]">{nomeVinculo(membro.vinculo)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-[#606b79]">Nenhum integrante vinculado.</p>}</section><section className={`${cardClass} lg:col-span-2`}><h2 className="text-lg font-semibold">Relatos</h2><p className="mt-3 whitespace-pre-wrap text-[#606b79]">{familia.relatos || "Nenhum relato informado."}</p></section></div></div>;
}

function FormularioFamilia({ familia, onCancelar, onSalvo }: { familia: Familia | null; onCancelar: () => void; onSalvo: (editando: boolean) => void }) {
  const [dados, setDados] = useState<DadosFamilia>(() => familia ? { nome: familia.nome, rendas: familia.rendas, integrantes: familia.membros.map((membro) => ({ pessoaId: membro.pessoaId, vinculo: membro.vinculo as VinculoFamiliar })), relatos: familia.relatos, avaliacao: familia.avaliacao } : dadosFamiliaVazios());
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [erro, setErro] = useState("");
  const [erros, setErros] = useState<{ nome?: string; rendas?: string; integrantes?: string }>({});
  const [salvando, setSalvando] = useState(false);
  const salvamento = useRef(false);

  useEffect(() => { const controller = new AbortController(); listarPessoas(controller.signal, { status: true }).then((lista) => setPessoas(lista.filter((pessoa) => pessoa.tipo === "FISICA" && (!pessoa.familiaId || pessoa.familiaId === familia?.id)))).catch((falha: unknown) => setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as pessoas.")); return () => controller.abort(); }, [familia?.id]);
  const pessoasFiltradas = useMemo(() => { const termo = buscaPessoa.trim().toLocaleLowerCase("pt-BR"); return pessoas.filter((pessoa) => pessoa.tipo === "FISICA" && (!termo || pessoa.nome.toLocaleLowerCase("pt-BR").includes(termo) || pessoa.cpf.includes(termo.replace(/\D/g, "")))); }, [pessoas, buscaPessoa]);

  function validar() {
    const falhas: typeof erros = {};
    if (!dados.nome.trim()) falhas.nome = "Informe o nome da família.";
    else if (dados.nome.trim().length > 150) falhas.nome = "Use no máximo 150 caracteres.";
    if (dados.rendas.some((renda) => renda.ativa && (valorMonetario(renda.valor) === null || (valorMonetario(renda.valor) ?? -1) < 0))) falhas.rendas = "Informe um valor válido para cada renda selecionada.";
    if (dados.integrantes.some((item) => !item.pessoaId || !item.vinculo)) falhas.integrantes = "Selecione a pessoa e o vínculo de todos os integrantes.";
    if (new Set(dados.integrantes.map((item) => item.pessoaId)).size !== dados.integrantes.length) falhas.integrantes = "A mesma pessoa não pode ser adicionada mais de uma vez.";
    return falhas;
  }

  async function submeter(event: FormEvent) {
    event.preventDefault(); if (salvamento.current) return;
    const falhas = validar();
    if (Object.keys(falhas).length) { setErros(falhas); setErro("Revise os campos indicados abaixo."); requestAnimationFrame(() => document.getElementById(Object.keys(falhas)[0])?.focus()); return; }
    salvamento.current = true; setSalvando(true); setErro("");
    try { await salvarFamilia(dados, familia?.id); onSalvo(Boolean(familia)); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível salvar a família."); }
    finally { salvamento.current = false; setSalvando(false); }
  }

  return <div className="mx-auto w-full max-w-[1600px]"><BreadcrumbFamilias etapa={familia ? "Editar" : "Novo cadastro"} /><Button type="button" variant="ghost" onClick={onCancelar} className="mb-5 h-9 px-2"><ArrowLeft className="size-4" /> Voltar para famílias</Button><div className="mb-8"><h1 className="text-[30px] font-bold tracking-tight">{familia ? "Editar família" : "Cadastrar nova família"}</h1><p className="mt-1 text-base text-[#606b79]">Informe os dados da família e vincule pessoas já cadastradas, se desejar.</p></div><form onSubmit={submeter} noValidate><fieldset disabled={salvando} className="space-y-8">{erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{erro}</div>}<section className={cardClass}><h2 className="text-lg font-semibold">Identificação</h2><p className="mt-1 text-[#606b79]">Use o nome pelo qual a família será identificada no sistema.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><Label htmlFor="nome" className="mb-2 block font-medium">Nome da família <span className="text-red-700">*</span></Label><Input id="nome" value={dados.nome} maxLength={150} onChange={(event) => { setDados({ ...dados, nome: event.target.value }); setErros({ ...erros, nome: undefined }); }} placeholder="Ex.: Família Oliveira" aria-invalid={Boolean(erros.nome)} className={`${inputClass} ${erros.nome ? "border-red-500" : ""}`} />{erros.nome && <p className="mt-2 text-sm text-red-700">{erros.nome}</p>}</div><div><Label htmlFor="avaliacao" className="mb-2 block font-medium">Avaliação</Label><select id="avaliacao" value={dados.avaliacao ?? ""} onChange={(event) => setDados({ ...dados, avaliacao: (event.target.value || null) as DadosFamilia["avaliacao"] })} className={selectClass}><option value="">Não avaliada</option><option value="APROVADA">Aprovada</option><option value="REPROVADA">Reprovada</option></select></div></div></section><section id="rendas" tabIndex={-1} className={cardClass}><h2 className="text-lg font-semibold">Renda familiar</h2><p className="mt-1 text-[#606b79]">Marque as fontes existentes e informe os valores mensais.</p>{erros.rendas && <p className="mt-2 text-sm text-red-700">{erros.rendas}</p>}<div className="mt-5 overflow-hidden rounded-xl border border-[#d9e1ea]">{dados.rendas.map((renda, indice) => <div key={renda.tipo} className={`grid items-center gap-3 p-4 sm:grid-cols-[1fr_180px] ${indice ? "border-t border-[#d9e1ea]" : ""}`}><label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={renda.ativa} onChange={(event) => setDados({ ...dados, rendas: dados.rendas.map((item) => item.tipo === renda.tipo ? { ...item, ativa: event.target.checked, valor: event.target.checked ? item.valor : "" } : item) })} className="size-4 accent-[#4697c5]" />{renda.nome}</label><Input aria-label={`Valor de ${renda.nome}`} disabled={!renda.ativa} value={renda.valor} onChange={(event) => { setDados({ ...dados, rendas: dados.rendas.map((item) => item.tipo === renda.tipo ? { ...item, valor: event.target.value } : item) }); setErros({ ...erros, rendas: undefined }); }} onBlur={() => setDados({ ...dados, rendas: dados.rendas.map((item) => item.tipo === renda.tipo ? { ...item, valor: formatarMoeda(item.valor) } : item) })} placeholder="R$ 0,00" className={inputClass} /></div>)}</div></section><section id="integrantes" tabIndex={-1} className={cardClass}><h2 className="text-lg font-semibold">Composição familiar</h2><p className="mt-1 text-[#606b79]">Vincule pessoas físicas já cadastradas. É permitido salvar a família sem integrantes.</p>{erros.integrantes && <p className="mt-2 text-sm text-red-700">{erros.integrantes}</p>}<div className="relative mt-5 max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748393]" /><Input value={buscaPessoa} onChange={(event) => setBuscaPessoa(event.target.value)} placeholder="Filtrar pessoas por nome ou CPF" className={`${inputClass} pl-9`} /></div><div className="mt-5 space-y-4">{dados.integrantes.map((integrante, indice) => { const pessoa = pessoas.find((item) => item.id === integrante.pessoaId); return <div key={`${integrante.pessoaId}-${indice}`} className="rounded-xl border border-[#d9e1ea] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Integrante {indice + 1}</h3><Button type="button" variant="ghost" onClick={() => setDados({ ...dados, integrantes: dados.integrantes.filter((_, itemIndice) => itemIndice !== indice) })} className="text-red-700"><Trash2 className="size-4" /> Remover</Button></div><div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor={`pessoa-${indice}`} className="mb-2 block font-medium">Pessoa <span className="text-red-700">*</span></Label><select id={`pessoa-${indice}`} value={integrante.pessoaId} onChange={(event) => { const integrantes = [...dados.integrantes]; integrantes[indice] = { ...integrante, pessoaId: event.target.value }; setDados({ ...dados, integrantes }); setErros({ ...erros, integrantes: undefined }); }} className={selectClass}><option value="">Selecione uma pessoa</option>{pessoasFiltradas.filter((item) => item.id === integrante.pessoaId || !dados.integrantes.some((selecionado) => selecionado.pessoaId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.tipo === "FISICA" ? `${item.nome} — ${formatarCpf(item.cpf)}` : ""}</option>)}</select>{pessoa?.tipo === "FISICA" && <p className="mt-2 text-sm text-[#606b79]">{pessoa.dataNascimento || (pessoa.idade != null ? `${pessoa.idade} anos` : "Nascimento não informado")}</p>}</div><div><Label htmlFor={`vinculo-${indice}`} className="mb-2 block font-medium">Vínculo familiar <span className="text-red-700">*</span></Label><select id={`vinculo-${indice}`} value={integrante.vinculo} onChange={(event) => { const integrantes = [...dados.integrantes]; integrantes[indice] = { ...integrante, vinculo: event.target.value as VinculoFamiliar }; setDados({ ...dados, integrantes }); setErros({ ...erros, integrantes: undefined }); }} className={selectClass}><option value="">Selecione</option>{opcoesVinculo.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>)}</select></div></div></div>; })}<Button type="button" variant="outline" onClick={() => setDados({ ...dados, integrantes: [...dados.integrantes, { pessoaId: "", vinculo: "" }] })}><Plus className="size-4" /> Adicionar integrante</Button></div></section><section className={cardClass}><h2 className="text-lg font-semibold">Relatos</h2><p className="mt-1 text-[#606b79]">Registre informações relevantes para o acompanhamento.</p><textarea value={dados.relatos} onChange={(event) => setDados({ ...dados, relatos: event.target.value })} rows={5} placeholder="Digite relatos, observações ou informações complementares..." className="mt-5 w-full rounded-lg border border-[#d5dbe2] bg-[#f8fafb] px-4 py-3 text-base shadow-sm outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30" /></section><div className="flex justify-end gap-3 border-t border-[#d9e1ea] pb-8 pt-6"><Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button><Button type="submit" className="bg-[#4697c5] px-5 text-white hover:bg-[#67a0c0]">{salvando ? "Salvando..." : familia ? "Salvar alterações" : "Cadastrar família"}</Button></div></fieldset></form></div>;
}

function Status({ ativa }: { ativa: boolean }) { return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ativa ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{ativa ? "Ativa" : "Inativa"}</span>; }
function Info({ label, valor }: { label: string; valor: string }) { return <div><dt className="text-xs text-[#606b79]">{label}</dt><dd className="mt-1 font-medium">{valor}</dd></div>; }
function ConfirmarStatus({ familia, processando, onCancelar, onConfirmar }: { familia: FamiliaResumo; processando: boolean; onCancelar: () => void; onConfirmar: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#273440]/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl border border-[#d9e1ea] bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">{familia.status ? "Inativar" : "Reativar"} família?</h2><p className="mt-2 text-sm leading-6 text-[#606b79]">Confirme a alteração de status de {familia.nome}.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" disabled={processando} onClick={onCancelar}>Cancelar</Button><Button type="button" disabled={processando} onClick={onConfirmar} className="bg-[#4697c5] text-white hover:bg-[#67a0c0]">{processando ? "Processando..." : "Confirmar"}</Button></div></div></div>; }
