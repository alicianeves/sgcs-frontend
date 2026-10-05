import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatarMoeda,
  perguntasIdosa,
  type DadosContextuais,
  type MembroFamilia,
} from "@/services/familiaService";
import type { Pessoa } from "@/services/pessoaService";

type Props = {
  contexto: "FAMILIA" | "IDOSA";
  dados: DadosContextuais;
  onChange: (dados: DadosContextuais) => void;
  errors?: ErrosContextuais;
  pessoasDisponiveis: Pessoa[];
};

export type ErrosContextuais = Partial<Record<"nomeMae" | "rg" | "residencia" | "valorAluguel" | "rendas" | "membros" | "questionario", string>>;

const inputClass = "h-11 rounded-lg border border-[#d5dbe2] bg-[#FBFDFD] px-4 text-base shadow-sm md:text-base";
const labelClass = "mb-2 text-base font-medium text-[#273440]";
const sectionClass = "border-t border-[#d9e1ea] pt-7";
const selectClass = `${inputClass} w-full outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30`;

function idade(data: string) {
  if (!data) return "";
  const nascimento = new Date(`${data}T12:00:00`);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  if (hoje.getMonth() < nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) anos--;
  return String(Math.max(0, anos));
}

function dataParaTela(data: string) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Cabecalho({ titulo, descricao }: { titulo: string; descricao: string }) {
  return <div className="mb-5"><h2 className="text-lg font-semibold">{titulo}</h2><p className="mt-1 text-base leading-6 text-[#606b79]">{descricao}</p></div>;
}

function Campo({ id, label, value, onChange, onBlur, type = "text", placeholder, readOnly = false, required = false, error, min, max, inputMode }: {
  id: string; label: string; value: string; onChange: (valor: string) => void; onBlur?: () => void; type?: string; placeholder?: string; readOnly?: boolean; required?: boolean; error?: string; min?: number | string; max?: number | string; inputMode?: "numeric" | "decimal";
}) {
  return <div className="min-w-0"><Label htmlFor={id} className={labelClass}>{label}{required && <span aria-label="obrigatório" className="text-red-700"> *</span>}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder={placeholder} readOnly={readOnly} required={required} min={min} max={max} inputMode={inputMode} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-erro` : undefined} className={`${inputClass} ${readOnly ? "bg-[#edf1f5] text-[#606b79]" : ""} ${error ? "border-red-500" : ""}`} />{error && <p id={`${id}-erro`} className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}

type CamposIdentificacaoProps = Pick<Props, "dados" | "onChange" | "errors">;

export function CamposIdentificacaoComplementar({ dados, onChange, errors = {} }: CamposIdentificacaoProps) {
  const atualizar = <K extends keyof DadosContextuais>(campo: K, valor: DadosContextuais[K]) => onChange({ ...dados, [campo]: valor });

  return <>
    <div className="sm:col-span-2"><Campo id="nomeMae" label="Nome da mãe" value={dados.nomeMae} onChange={(valor) => atualizar("nomeMae", valor)} placeholder="Digite o nome completo" required error={errors.nomeMae} /></div>
    <div><Label htmlFor="sexo" className={labelClass}>Sexo</Label><select id="sexo" value={dados.sexo} onChange={(event) => atualizar("sexo", event.target.value)} className={selectClass}><option value="">Selecione</option><option>Feminino</option><option>Masculino</option><option>Outro</option><option>Prefere não informar</option></select></div>
    <div><Label htmlFor="estadoCivil" className={labelClass}>Estado civil</Label><select id="estadoCivil" value={dados.estadoCivil} onChange={(event) => atualizar("estadoCivil", event.target.value)} className={selectClass}><option value="">Selecione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União estável</option></select></div>
    <Campo id="rg" label="RG" value={dados.rg} onChange={(valor) => atualizar("rg", valor)} placeholder="00.000.000-0" required error={errors.rg} />
    <Campo id="nis" label="Número do NIS" value={dados.nis} onChange={(valor) => atualizar("nis", valor.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" />
  </>;
}

export default function DadosAssistenciais({ contexto, dados, onChange, errors = {}, pessoasDisponiveis }: Props) {
  const atualizar = <K extends keyof DadosContextuais>(campo: K, valor: DadosContextuais[K]) => onChange({ ...dados, [campo]: valor });

  function atualizarMembro(id: string, campo: keyof Omit<MembroFamilia, "id">, valor: string) {
    atualizar("membros", dados.membros.map((membro) => membro.id === id ? { ...membro, [campo]: valor } : membro));
  }

  function selecionarPessoa(membroId: string, pessoaId: string) {
    const pessoa = pessoasDisponiveis.find((item) => item.id === pessoaId && item.tipo === "FISICA");
    atualizar("membros", dados.membros.map((membro) => membro.id === membroId ? {
      ...membro, pessoaId,
      nome: pessoa?.tipo === "FISICA" ? pessoa.nome : "",
      dataNascimento: pessoa?.tipo === "FISICA" ? pessoa.dataNascimento : "",
      idade: pessoa?.tipo === "FISICA" && pessoa.idade != null ? String(pessoa.idade) : "",
    } : membro));
  }

  return <>
    <section className={sectionClass}>
      <Cabecalho titulo="Residência" descricao="Informe a situação da moradia." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="residencia" className={labelClass}>Tipo de residência <span aria-label="obrigatório" className="text-red-700">*</span></Label><select id="residencia" value={dados.residencia} onChange={(event) => atualizar("residencia", event.target.value)} required aria-invalid={Boolean(errors.residencia)} aria-describedby={errors.residencia ? "residencia-erro" : undefined} className={`${selectClass} ${errors.residencia ? "border-red-500" : ""}`}><option value="">Selecione</option><option>Própria</option><option>Cedida</option><option>Alugada</option></select>{errors.residencia && <p id="residencia-erro" className="mt-2 text-sm text-red-700">{errors.residencia}</p>}</div>
        {dados.residencia === "Alugada" && <Campo id="valorAluguel" label="Valor do aluguel" value={dados.valorAluguel} onChange={(valor) => atualizar("valorAluguel", valor)} onBlur={() => atualizar("valorAluguel", formatarMoeda(dados.valorAluguel))} inputMode="decimal" placeholder="R$ 0,00" required error={errors.valorAluguel} />}
      </div>
    </section>

    <section className={sectionClass}>
      <Cabecalho titulo="Outros dados" descricao="Informações complementares para o acompanhamento." />
      <div className="grid gap-5 sm:grid-cols-3">
        <div><Label htmlFor="escolaridade" className={labelClass}>Escolaridade</Label><select id="escolaridade" value={dados.escolaridade} onChange={(event) => atualizar("escolaridade", event.target.value)} className={selectClass}><option value="">Selecione</option><option>Não alfabetizado(a)</option><option>Ensino fundamental</option><option>Ensino médio</option><option>Ensino superior</option><option>Pós-graduação</option></select></div>
        <Campo id="ocupacao" label="Ocupação" value={dados.ocupacao} onChange={(valor) => atualizar("ocupacao", valor)} placeholder="Ocupação atual" />
        <Campo id="contato2" label="2º telefone" value={dados.contato2} onChange={(valor) => atualizar("contato2", valor)} placeholder="(00) 00000-0000" />
      </div>
    </section>

    <section className={sectionClass}>
      <Cabecalho titulo="Avaliação" descricao="Informe o resultado da avaliação familiar, quando disponível." />
      <div className="max-w-sm"><Label htmlFor="avaliacao" className={labelClass}>Resultado</Label><select id="avaliacao" value={dados.avaliacao} onChange={(event) => atualizar("avaliacao", event.target.value as DadosContextuais["avaliacao"])} className={selectClass}><option value="">Não avaliada</option><option>Aprovada</option><option>Reprovada</option></select></div>
    </section>

    <section id="rendas" tabIndex={-1} className={sectionClass}>
      <div className="mb-5"><h2 className="text-lg font-semibold">Renda familiar <span aria-label="obrigatório" className="text-red-700">*</span></h2><p className="mt-1 text-base leading-6 text-[#606b79]">Marque as fontes existentes e informe os valores mensais.</p>{errors.rendas && <p className="mt-2 text-sm text-red-700">{errors.rendas}</p>}</div>
      <div className="overflow-hidden rounded-xl border border-[#d9e1ea]">
        {dados.rendas.map((renda, indice) => <div key={renda.id} className={`grid items-center gap-3 p-4 sm:grid-cols-[1fr_180px] ${indice ? "border-t border-[#d9e1ea]" : ""}`}>
          <label className="flex cursor-pointer items-center gap-3 text-base"><input type="checkbox" checked={renda.ativa} onChange={(event) => atualizar("rendas", dados.rendas.map((item) => item.id === renda.id ? { ...item, ativa: event.target.checked, valor: event.target.checked ? item.valor : "" } : item))} className="size-4 accent-[#4697c5]" />{renda.nome}</label>
          <Input aria-label={`Valor de ${renda.nome}`} disabled={!renda.ativa} value={renda.valor} inputMode="decimal" onChange={(event) => atualizar("rendas", dados.rendas.map((item) => item.id === renda.id ? { ...item, valor: event.target.value } : item))} onBlur={() => atualizar("rendas", dados.rendas.map((item) => item.id === renda.id ? { ...item, valor: formatarMoeda(item.valor) } : item))} placeholder="R$ 0,00" className={inputClass} />
        </div>)}
      </div>
    </section>

    <section id="membros" tabIndex={-1} className={sectionClass}>
      <Cabecalho titulo="Composição familiar" descricao="Adicione pessoas cadastradas; a data de nascimento ou a idade informada no cadastro será exibida abaixo." />
      {errors.membros && <p className="mb-4 text-sm text-red-700">{errors.membros}</p>}
      <div className="space-y-4">
        {dados.membros.map((membro, indice) => <div key={membro.id} className="rounded-xl border border-[#d9e1ea] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Membro {indice + 1}</h3><Button type="button" variant="ghost" onClick={() => atualizar("membros", dados.membros.filter((item) => item.id !== membro.id))} className="text-red-700"><Trash2 className="size-4" /> Remover</Button></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label htmlFor={`membro-${membro.id}-pessoa`} className={labelClass}>Nome <span className="text-red-700">*</span></Label><select id={`membro-${membro.id}-pessoa`} value={membro.pessoaId} onChange={(event) => selecionarPessoa(membro.id, event.target.value)} className={selectClass}><option value="">Selecione uma pessoa cadastrada</option>{pessoasDisponiveis.filter((pessoa) => pessoa.tipo === "FISICA" && !dados.membros.some((item) => item.id !== membro.id && item.pessoaId === pessoa.id)).map((pessoa) => <option key={pessoa.id} value={pessoa.id}>{pessoa.tipo === "FISICA" ? pessoa.nome : ""}</option>)}</select></div>
            <Campo id={`membro-${membro.id}-nascimento`} label="Data de nascimento" value={dataParaTela(membro.dataNascimento)} onChange={() => undefined} readOnly />
            <Campo id={`membro-${membro.id}-idade`} label="Idade" value={membro.idade || idade(membro.dataNascimento)} onChange={() => undefined} readOnly />
            <div><Label htmlFor={`membro-${membro.id}-vinculo`} className={labelClass}>Vínculo familiar <span className="text-red-700">*</span></Label><select id={`membro-${membro.id}-vinculo`} value={membro.vinculo} onChange={(event) => atualizarMembro(membro.id, "vinculo", event.target.value)} className={selectClass}><option value="">Selecione</option>{["Filho(a)", "Esposo(a)", "Mãe", "Pai", "Irmão(ã)", "Neto(a)", "Outro"].map((vinculo) => <option key={vinculo}>{vinculo}</option>)}</select></div>
          </div>
        </div>)}
        <Button type="button" variant="outline" onClick={() => atualizar("membros", [...dados.membros, { id: crypto.randomUUID(), pessoaId: "", nome: "", cpf: "", rg: "", nis: "", dataNascimento: "", idade: "", vinculo: "" }])} className="h-10"><Plus className="size-4" /> Adicionar integrante</Button>
      </div>
    </section>

    {contexto === "IDOSA" && <>
      <section className={sectionClass}><Cabecalho titulo="Vínculos e atendimentos" descricao="Selecione os serviços e benefícios relacionados." /><div className="grid gap-3 sm:grid-cols-3">{["Bolsa Família", "CRAS Nochete", "UBS/ESF Guanabara"].map((vinculo) => <label key={vinculo} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d9e1ea] bg-white p-4"><input type="checkbox" checked={dados.vinculos.includes(vinculo)} onChange={(event) => atualizar("vinculos", event.target.checked ? [...dados.vinculos, vinculo] : dados.vinculos.filter((item) => item !== vinculo))} className="size-4 accent-[#4697c5]" />{vinculo}</label>)}</div></section>
      {errors.questionario && <p id="questionario" tabIndex={-1} className="text-sm text-red-700">{errors.questionario}</p>}
      <section className={sectionClass}><Cabecalho titulo="Questionário" descricao="Responda às perguntas e acrescente observações quando necessário." /><div className="space-y-4">{perguntasIdosa.map((pergunta, indice) => <div key={pergunta} className="rounded-xl border border-[#d9e1ea] bg-white p-4 sm:p-5"><p className="mb-4 font-medium">{indice + 1}. {pergunta}</p><div className="mb-4 flex gap-2">{(["SIM", "NAO"] as const).map((resposta) => <Button key={resposta} type="button" variant={dados.questionario[indice]?.resposta === resposta ? "default" : "outline"} onClick={() => atualizar("questionario", dados.questionario.map((item, itemIndice) => itemIndice === indice ? { ...item, resposta } : item))} className="h-9 px-4">{resposta === "SIM" ? "Sim" : "Não"}</Button>)}</div><Input aria-label={`Observação da pergunta ${indice + 1}`} value={dados.questionario[indice]?.observacao ?? ""} onChange={(event) => atualizar("questionario", dados.questionario.map((item, itemIndice) => itemIndice === indice ? { ...item, observacao: event.target.value } : item))} placeholder="Observações complementares (opcional)" className={inputClass} /></div>)}</div></section>
      <section className={sectionClass}><Cabecalho titulo="Encaminhamentos" descricao="Registre encaminhamentos realizados." /><textarea id="encaminhamentos" value={dados.encaminhamentos} onChange={(event) => atualizar("encaminhamentos", event.target.value)} placeholder="Descreva os encaminhamentos..." rows={4} className={`${inputClass} h-auto w-full py-3 outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30`} /></section>
    </>}

    <section className={sectionClass}><Cabecalho titulo="Relatos" descricao="Registre informações relevantes para o acompanhamento." /><textarea id="relatos" value={dados.relatos} onChange={(event) => atualizar("relatos", event.target.value)} placeholder="Digite relatos, observações ou informações complementares..." rows={4} className={`${inputClass} h-auto w-full py-3 outline-none focus-visible:border-[#4697c5] focus-visible:ring-2 focus-visible:ring-[#4697c5]/30`} /></section>
  </>;
}
