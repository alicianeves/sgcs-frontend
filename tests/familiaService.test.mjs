import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import ts from "typescript";

const apiSource = await readFile(new URL("../src/services/apiService.ts", import.meta.url), "utf8");
const apiOutput = ts.transpileModule(apiSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const apiUrl = `data:text/javascript;base64,${Buffer.from(apiOutput).toString("base64")}`;
const pessoaSource = await readFile(new URL("../src/services/pessoaService.ts", import.meta.url), "utf8");
const pessoaOutput = ts.transpileModule(pessoaSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("@/services/apiService", apiUrl);
const pessoaUrl = `data:text/javascript;base64,${Buffer.from(pessoaOutput).toString("base64")}`;
const source = await readFile(new URL("../src/services/familiaService.ts", import.meta.url), "utf8");
const outputText = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace("@/services/apiService", apiUrl).replace("@/services/pessoaService", pessoaUrl);
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
    value: { getItem(key) { assert.equal(key, "token"); return "test-token"; }, removeItem(key) { assert.ok(["token", "usuarioAtual"].includes(key)); } },
  });
}

function familiaApi(id = 7) {
  return {
    id, nome: "Família Oliveira", quantidadeIntegrantes: 1, avaliacao: "APROVADA", status: true,
    rendas: [{ tipo: "TRABALHO", ativa: true, valor: 1500.5 }],
    integrantes: [{ pessoaId: 9, nome: "Bia", cpf: "52998224725", rg: null, nis: null, dataNascimento: "2000-01-01", idade: 26, vinculo: "FILHO_A" }],
    relatos: "Acompanhamento mensal", dataInativacao: null,
  };
}

test("family creation sends exactly the current backend contract", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/familias");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    const body = JSON.parse(options.body);
    assert.deepEqual(body, {
      nome: "Família Oliveira",
      rendas: service.opcoesRenda.map((item, index) => ({ tipo: item.tipo, ativa: index === 0, valor: index === 0 ? 1500.5 : null })),
      integrantes: [{ pessoaId: 9, vinculo: "FILHO_A" }],
      relatos: "Acompanhamento mensal",
      avaliacao: "APROVADA",
    });
    return Response.json(familiaApi());
  };
  const dados = service.dadosFamiliaVazios();
  dados.nome = " Família Oliveira ";
  dados.rendas[0] = { ...dados.rendas[0], ativa: true, valor: "R$ 1.500,50" };
  dados.integrantes = [{ pessoaId: "9", vinculo: "FILHO_A" }];
  dados.relatos = "Acompanhamento mensal";
  dados.avaliacao = "APROVADA";
  const criada = await service.salvarFamilia(dados);
  assert.equal(criada.id, "7");
  assert.equal(criada.membros[0].pessoaId, "9");
});

test("family update uses PUT and accepts an empty composition", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/familias/7");
    assert.equal(options.method, "PUT");
    const body = JSON.parse(options.body);
    assert.equal(body.nome, "Família sem integrantes");
    assert.deepEqual(body.integrantes, []);
    return Response.json({ ...familiaApi(), nome: body.nome, quantidadeIntegrantes: 0, integrantes: [] });
  };
  const dados = service.dadosFamiliaVazios();
  dados.nome = "Família sem integrantes";
  const atualizada = await service.salvarFamilia(dados, "7");
  assert.equal(atualizada.quantidadeIntegrantes, 0);
});

test("listing uses search and status filters without N+1 detail requests", async () => {
  storage();
  let chamadas = 0;
  globalThis.fetch = async (url) => {
    chamadas += 1;
    assert.equal(url, "http://localhost:8080/api/familias?busca=Oliveira&status=false");
    return Response.json([{ id: 7, nome: "Família Oliveira", quantidadeIntegrantes: 1, avaliacao: null, status: false }]);
  };
  const familias = await service.listarFamilias(undefined, { busca: "Oliveira", status: false });
  assert.equal(familias[0].nome, "Família Oliveira");
  assert.equal(chamadas, 1);
});

test("detail maps income and existing people from the response", async () => {
  storage();
  globalThis.fetch = async (url) => {
    assert.equal(url, "http://localhost:8080/api/familias/7");
    return Response.json(familiaApi());
  };
  const familia = await service.buscarFamilia("7");
  assert.equal(familia.rendas.find((item) => item.tipo === "TRABALHO").valor, "1500.5");
  assert.equal(familia.membros[0].nome, "Bia");
  assert.equal(service.nomeVinculo(familia.membros[0].vinculo), "Filho(a)");
});

test("family status uses the inactivation and reactivation endpoints", async () => {
  storage();
  const urls = [];
  globalThis.fetch = async (url, options) => { urls.push(url); assert.equal(options.method, "PATCH"); return new Response(null, { status: 204 }); };
  await service.alternarStatusFamilia("7", true);
  await service.alternarStatusFamilia("7", false);
  assert.deepEqual(urls, ["http://localhost:8080/api/familias/7/inativar", "http://localhost:8080/api/familias/7/reativar"]);
});

test("contextual elderly creation also follows the new family DTO", async () => {
  storage();
  const dados = service.dadosContextuaisVazios();
  dados.questionario = dados.questionario.map(() => ({ resposta: "SIM", observacao: "" }));
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/cadastros/contextuais");
    const body = JSON.parse(options.body);
    assert.equal(body.familia.nome, "Família de Ana");
    assert.ok(!("situacaoMoradia" in body.familia));
    assert.equal(body.atendimento.questionario.length, 12);
    assert.match(body.atendimento.dataAtendimento, /^\d{4}-\d{2}-\d{2}$/);
    return Response.json({ pessoaId: 4, familiaId: 7, atendimentoId: 18 });
  };
  const resposta = await service.salvarCadastroContextual("IDOSA", {
    tipo: "FISICA", nome: "Ana", cpf: "52998224725", dataNascimento: "1950-01-01", telefone: "11999999999",
    cep: "01001000", logradouro: "Rua A", numero: "1", bairro: "Centro", cidade: "São Paulo", estado: "SP", email: "",
  }, dados);
  assert.deepEqual(resposta, { pessoaId: 4, familiaId: 7, atendimentoId: 18 });
});
