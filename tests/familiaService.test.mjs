import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/services/familiaService.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const service = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

function storage() {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem(key) { assert.equal(key, "token"); return "test-token"; } },
  });
}

function dadosContextuais() {
  const dados = service.dadosContextuaisVazios();
  dados.residencia = "Alugada";
  dados.valorAluguel = "850,50";
  dados.rendas[0] = { ...dados.rendas[0], ativa: true, valor: "1.500,00" };
  dados.membros = [{ id: "m1", pessoaId: "9", nome: "Bia", dataNascimento: "2000-01-01", vinculo: "Filho(a)" }];
  dados.relatos = "Acompanhamento mensal";
  return dados;
}

test("family creation sends the backend identifiers and converted values", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/familias");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    const body = JSON.parse(options.body);
    assert.equal(body.responsavelId, 4);
    assert.equal(body.situacaoMoradia, "ALUGADA");
    assert.equal(body.valorAluguel, 850.5);
    assert.deepEqual(body.rendas[0], { tipo: "TRABALHO", ativa: true, valor: 1500 });
    assert.deepEqual(body.integrantes, [{ pessoaId: 9, vinculo: "FILHO_A" }]);
    return Response.json({ id: 7 });
  };

  assert.equal(await service.salvarFamilia({ ...dadosContextuais(), responsavelId: "4" }), "7");
});

test("elderly care creation sends links and all questionnaire answers", async () => {
  storage();
  const dados = dadosContextuais();
  dados.vinculos = ["Bolsa Fam\u00edlia", "UBS/ESF Guanabara"];
  dados.encaminhamentos = "Consulta";
  dados.questionario = dados.questionario.map((_, indice) => ({ resposta: indice % 2 ? "NAO" : "SIM", observacao: "" }));
  let requisicao;
  globalThis.fetch = async (url, options) => {
    requisicao = { url, options };
    return Response.json({ id: 18 });
  };

  assert.equal(await service.salvarAtendimento({ ...dados, fisicaId: "4" }), "18");
  assert.equal(requisicao.url, "http://localhost:8080/api/atendimentos");
  assert.equal(requisicao.options.method, "POST");
  const body = JSON.parse(requisicao.options.body);
  assert.equal(body.fisicaId, 4);
  assert.equal(body.bolsaFamilia, true);
  assert.equal(body.crasNochete, false);
  assert.equal(body.ubsEsfGuanabara, true);
  assert.equal(body.questionario.length, 12);
  assert.deepEqual(body.questionario[0], { numero: 1, resposta: "SIM", observacao: null });
});

test("family status uses the inactivation and reactivation endpoints", async () => {
  storage();
  const urls = [];
  globalThis.fetch = async (url, options) => {
    urls.push(url);
    assert.equal(options.method, "PATCH");
    return new Response(null, { status: 204 });
  };
  await service.alternarStatusFamilia("7", true);
  await service.alternarStatusFamilia("7", false);
  assert.deepEqual(urls, [
    "http://localhost:8080/api/familias/7/inativar",
    "http://localhost:8080/api/familias/7/reativar",
  ]);
});

test("listing loads family details, responsible person and elderly care from the API", async () => {
  storage();
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(url);
    if (url.endsWith("/familias")) return Response.json([{ id: 7 }]);
    if (url.endsWith("/familias/7")) return Response.json({
      id: 7,
      responsavel: { id: 4 },
      dataCadastro: "2026-09-21",
      situacaoMoradia: "PROPRIA",
      valorAluguel: null,
      rendas: [{ tipo: "TRABALHO", ativa: true, valor: 1200 }],
      integrantes: [{ pessoaId: 9, nome: "Bia", dataNascimento: "2000-01-01", vinculo: "FILHO_A" }],
      relatos: "Relato familiar",
      status: true,
      dataInativacao: null,
    });
    if (url.endsWith("/pessoas/4")) return Response.json({
      id: 4, nome: "Ana", cpf: "12345678901", dataNascimento: "1950-05-05", email: null,
      telefone: "11999999999", cep: "12345678", logradouro: "Rua A", numero: "10",
      bairro: "Centro", cidade: "Santos", estado: "SP", nomeMae: "Maria", sexo: "FEMININO",
      estadoCivil: "SOLTEIRO_A", rg: "123", nis: "456", escolaridade: "ENSINO_MEDIO",
      ocupacao: null, contato2: null,
    });
    if (url.includes("/atendimentos?fisicaId=4")) return Response.json([{
      id: 18, fisicaId: 4, bolsaFamilia: true, crasNochete: false, ubsEsfGuanabara: true,
      questionario: Array.from({ length: 12 }, (_, indice) => ({ numero: indice + 1, resposta: "SIM", observacao: null })),
      encaminhamentos: "Consulta", relatos: "Relato da idosa", status: true,
    }]);
    return new Response(null, { status: 404 });
  };

  const [familia] = await service.listarFamilias();
  assert.equal(familia.contexto, "IDOSA");
  assert.equal(familia.nome, "Ana");
  assert.equal(familia.atendimentoId, "18");
  assert.equal(familia.membros[0].pessoaId, "9");
  assert.equal(familia.questionario.length, 12);
  assert.equal(requested.length, 4);
});
