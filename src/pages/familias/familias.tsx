import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Pencil, Plus, Search, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  alternarStatusFamilia,
  listarFamilias,
  type Familia,
} from "@/services/familiaService";
import { formatarCpf, formatarTelefone } from "@/services/pessoaService";

type Props = {
  onNovaFamilia: () => void;
  onEditarFamilia: (familia: Familia | string) => void;
};

const cardClass = "rounded-2xl border border-[#d9e1ea] bg-white p-5 shadow-sm sm:p-6";

function formatarData(data: string) {
  if (!data) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${data.slice(0, 10)}T12:00:00`));
}

export default function FamiliasPage({ onNovaFamilia, onEditarFamilia }: Props) {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Familia | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listarFamilias(controller.signal)
      .then((dados) => { if (!controller.signal.aborted) setFamilias(dados); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : "Não foi possível carregar as famílias."); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return familias.filter((familia) => !termo ||
      familia.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
      familia.cpf.includes(termo.replace(/\D/g, "")) ||
      familia.nis.includes(termo.replace(/\D/g, "")) ||
      familia.bairro.toLocaleLowerCase("pt-BR").includes(termo));
  }, [familias, busca]);

  async function alternar(familia: Familia) {
    try {
      await alternarStatusFamilia(familia.id, familia.status);
      const atualizada = { ...familia, status: !familia.status, dataInativacao: familia.status ? new Date().toISOString() : null };
      setFamilias((anteriores) => anteriores.map((item) => item.id === familia.id ? atualizada : item));
      setDetalhe((atual) => atual?.id === familia.id ? atualizada : atual);
      setAviso(`Família ${familia.status ? "inativada" : "ativada"} com sucesso.`);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível alterar o status da família.");
    }
  }

  if (detalhe) {
    const rendaTotal = detalhe.rendas.filter((renda) => renda.ativa);
    return <div className="w-full">
      <Button type="button" variant="ghost" onClick={() => setDetalhe(null)} className="mb-5 h-9 px-2"><ArrowLeft className="size-4" /> Voltar para famílias</Button>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h1 className="text-[30px] font-bold tracking-tight">{detalhe.nome}</h1><p className="mt-1 text-base text-[#606b79]">Ficha socioeconômica da família.</p></div>
        <Button type="button" onClick={() => onEditarFamilia(detalhe)} className="h-10 bg-[#4697c5] px-4 text-white hover:bg-[#67a0c0]"><Pencil className="size-4" /> Editar família</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cardClass}><h2 className="text-lg font-semibold">Identificação</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Responsável" valor={detalhe.nome} /><Info label="CPF" valor={formatarCpf(detalhe.cpf)} /><Info label="NIS" valor={detalhe.nis || "Não informado"} /><Info label="Telefone" valor={formatarTelefone(detalhe.telefone)} /><Info label="Data do cadastro" valor={formatarData(detalhe.dataCriacao)} /><Info label="Situação" valor={detalhe.status ? "Ativa" : "Inativa"} /></dl></section>
        <section className={cardClass}><h2 className="text-lg font-semibold">Endereço</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Info label="Logradouro" valor={`${detalhe.logradouro}, ${detalhe.numero}`} /></div><Info label="Bairro" valor={detalhe.bairro} /><Info label="CEP" valor={detalhe.cep} /><Info label="Cidade / Estado" valor={`${detalhe.cidade} - ${detalhe.estado}`} /><Info label="Residência" valor={detalhe.residencia || "Não informada"} /></dl></section>
        <section className={`${cardClass} lg:col-span-2`}><h2 className="text-lg font-semibold">Composição familiar</h2>{detalhe.membros.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-[#e5eaf0] text-[#606b79]"><tr><th className="pb-3 font-medium">Nome</th><th className="pb-3 font-medium">Nascimento</th><th className="pb-3 font-medium">Vínculo</th></tr></thead><tbody>{detalhe.membros.map((membro) => <tr key={membro.id} className="border-b border-[#edf0f3] last:border-0"><td className="py-3 font-medium">{membro.nome}</td><td className="py-3 text-[#606b79]">{formatarData(membro.dataNascimento)}</td><td className="py-3 text-[#606b79]">{membro.vinculo || "Não informado"}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-[#606b79]">Nenhum integrante adicional informado.</p>}</section>
        <section className={cardClass}><h2 className="text-lg font-semibold">Renda familiar</h2>{rendaTotal.length ? <dl className="mt-5 space-y-3">{rendaTotal.map((renda) => <div key={renda.id} className="flex justify-between gap-4"><dt className="text-[#606b79]">{renda.nome}</dt><dd className="font-medium">{renda.valor || "Valor não informado"}</dd></div>)}</dl> : <p className="mt-3 text-[#606b79]">Nenhuma fonte de renda informada.</p>}</section>
        <section className={cardClass}><h2 className="text-lg font-semibold">Relatos</h2><p className="mt-3 whitespace-pre-wrap text-[#606b79]">{detalhe.relatos || "Nenhum relato informado."}</p></section>
      </div>
    </div>;
  }

  if (carregando) return <p role="status" className="py-12 text-center text-[#606b79]">Carregando famílias...</p>;
  if (erro) return <div role="alert" className="py-12 text-center text-red-700">{erro}</div>;

  return <div className="w-full">
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><h1 className="text-[28px] font-bold tracking-tight">Famílias</h1><p className="mt-1 text-sm text-[#606b79]">Cadastre e acompanhe as famílias atendidas pelo Centro Social.</p></div>
      <Button type="button" onClick={onNovaFamilia} className="h-10 gap-2 bg-[#4697c5] px-4 text-white hover:bg-[#67a0c0]"><Plus size={17} /> Nova Família</Button>
    </div>
    {aviso && <div role="status" className="mb-5 rounded-xl border border-[#b8ddc9] bg-[#effaf4] px-4 py-3 text-sm text-[#19704b]">{aviso}</div>}
    <section className={cardClass}>
      <div className="mb-5 flex flex-col gap-4 border-b border-[#e5eaf0] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-semibold">Famílias cadastradas</h2><p className="mt-1 text-sm text-[#606b79]">{filtradas.length} registro(s) encontrado(s)</p></div>
        <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748393]" /><Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por responsável, CPF, NIS ou bairro" className="h-10 rounded-lg border-[#d9e1ea] bg-white pl-9 text-[15px] shadow-sm" /></div>
      </div>
      {filtradas.length === 0 ? <div className="flex flex-col items-center py-16 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-[#eaf7ff] text-[#4697c5]"><UsersRound size={27} /></span><h3 className="mt-4 font-semibold">{busca ? "Nenhuma família encontrada" : "Nenhuma família cadastrada"}</h3><p className="mt-1 max-w-sm text-sm text-[#606b79]">{busca ? "Tente outro nome ou documento." : "Comece cadastrando a primeira família."}</p>{!busca && <Button type="button" onClick={onNovaFamilia} className="mt-5 bg-[#4697c5] text-white hover:bg-[#67a0c0]"><Plus size={16} /> Nova Família</Button>}</div> : <>
        <div className="space-y-3 md:hidden">{filtradas.map((familia) => <article key={familia.id} className="rounded-xl border border-[#e5eaf0] p-4"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => setDetalhe(familia)} className="text-left font-semibold hover:text-[#4697c5]">{familia.nome}</button><Status ativa={familia.status} /></div><p className="mt-1 text-sm text-[#606b79]">CPF {formatarCpf(familia.cpf)} · {familia.bairro}</p><div className="mt-3 flex gap-3 border-t border-[#e5eaf0] pt-3 text-sm font-medium text-[#0d5d86]"><button type="button" onClick={() => setDetalhe(familia)}>Visualizar</button><button type="button" onClick={() => onEditarFamilia(familia.id)}>Editar</button><button type="button" onClick={() => alternar(familia)}>{familia.status ? "Inativar" : "Ativar"}</button></div></article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#e5eaf0] text-[#606b79]"><tr><th className="pb-3 font-medium">Responsável</th><th className="pb-3 font-medium">CPF</th><th className="pb-3 font-medium">Telefone</th><th className="pb-3 font-medium">Bairro</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Ações</th></tr></thead><tbody>{filtradas.map((familia) => <tr key={familia.id} className="border-b border-[#edf0f3] last:border-0"><td className="py-4 pr-4 font-medium"><button type="button" onClick={() => setDetalhe(familia)} className="hover:text-[#4697c5]">{familia.nome}</button></td><td className="py-4 pr-4 text-[#606b79]">{formatarCpf(familia.cpf)}</td><td className="py-4 pr-4 text-[#606b79]">{formatarTelefone(familia.telefone)}</td><td className="py-4 pr-4 text-[#606b79]">{familia.bairro}</td><td className="py-4 pr-4"><Status ativa={familia.status} /></td><td className="py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => setDetalhe(familia)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#4697c5]" aria-label={`Visualizar ${familia.nome}`}><Eye size={16} /></button><button type="button" onClick={() => onEditarFamilia(familia.id)} className="rounded-lg p-2 text-[#606b79] hover:bg-[#eaf7ff] hover:text-[#4697c5]" aria-label={`Editar ${familia.nome}`}><Pencil size={16} /></button><button type="button" onClick={() => alternar(familia)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#0d5d86] hover:bg-[#eaf7ff]">{familia.status ? "Inativar" : "Ativar"}</button></div></td></tr>)}</tbody></table></div>
      </>}
    </section>
  </div>;
}

function Status({ ativa }: { ativa: boolean }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ativa ? "bg-[#e6f7ee] text-[#19704b]" : "bg-[#f1f3f5] text-[#606b79]"}`}>{ativa ? "Ativa" : "Inativa"}</span>;
}

function Info({ label, valor }: { label: string; valor: string }) {
  return <div><dt className="text-xs text-[#606b79]">{label}</dt><dd className="mt-1 font-medium">{valor}</dd></div>;
}
