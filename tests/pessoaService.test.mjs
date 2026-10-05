import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/services/pessoaService.ts", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../src/services/apiService.ts", import.meta.url), "utf8");
const apiOutput = ts.transpileModule(apiSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const apiUrl = `data:text/javascript;base64,${Buffer.from(apiOutput).toString("base64")}`;
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const outputText = transpiled.replace("@/services/apiService", apiUrl);
const service = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

function storage(token = "test-token") {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem(key) { assert.equal(key, "token"); return token; }, removeItem(key) { assert.ok(["token", "usuarioAtual"].includes(key)); } },
  });
}

test("listing authenticates and converts numeric IDs and backend roles", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/pessoas");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return Response.json([{ id: 42, tipo: "FISICA", perfil: "ATENDIMENTO_GESTAO", usuario: "ana" }]);
  };
  const [pessoa] = await service.listarPessoas();
  assert.equal(pessoa.id, "42");
  assert.equal(pessoa.perfil, "Atendimento/Gestão");
});

test("listing sends backend search and status filters", async () => {
  storage();
  globalThis.fetch = async (url) => {
    assert.equal(url, "http://localhost:8080/api/pessoas?busca=Ana+Silva&status=false");
    return Response.json([]);
  };
  assert.deepEqual(await service.listarPessoas(undefined, { busca: "Ana Silva", status: false }), []);
});

test("detail and reactivation use the person endpoints", async () => {
  storage();
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push([url, options.method ?? "GET"]);
    if ((options.method ?? "GET") === "GET") return Response.json({ id: 12, tipo: "FISICA", nome: "Ana", idade: 30 });
    return new Response(null, { status: 204 });
  };
  assert.equal((await service.buscarPessoa("12")).id, "12");
  await service.reativarPessoa("12");
  assert.deepEqual(requests, [
    ["http://localhost:8080/api/pessoas/12", "GET"],
    ["http://localhost:8080/api/pessoas/12/reativar", "PATCH"],
  ]);
});

test("creation sends password and API role to the physical person route", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/pessoas/fisicas");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), {
      nome: "Ana", dataNascimento: null, idadeInformada: 30, tipoCadastro: "PESSOA",
      familiaId: null, vinculoFamiliar: null, contatosFamiliares: [],
      perfil: "ADMINISTRADOR", senha: "password123",
    });
    return Response.json({ id: 12, tipo: "FISICA", perfil: "ADMINISTRADOR", usuario: "ana" });
  };
  const result = await service.salvarPessoa({ tipo: "FISICA", nome: "Ana", idadeInformada: 30, perfil: "Administrador", senha: "password123" });
  assert.equal(result.id, "12");
});

test("editing omits an empty password, preserving the existing credential", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/pessoas/fisicas/12");
    assert.equal(options.method, "PUT");
    assert.equal(Object.hasOwn(JSON.parse(options.body), "senha"), false);
    return Response.json({ id: 12, tipo: "FISICA", perfil: "COLABORADOR", usuario: "ana" });
  };
  await service.salvarPessoa({ tipo: "FISICA", perfil: "Colaborador", senha: "" }, "12");
});

test("legal persons use their own endpoint without access fields", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/pessoas/juridicas");
    assert.deepEqual(JSON.parse(options.body), { razaoSocial: "Empresa", cnpj: "12345678000199", tipoCadastro: "PESSOA" });
    return Response.json({ id: 13, tipo: "JURIDICA", razaoSocial: "Empresa" });
  };
  assert.equal((await service.salvarPessoa({ tipo: "JURIDICA", razaoSocial: "Empresa", cnpj: "12345678000199" })).tipo, "JURIDICA");
});

test("inactivation accepts an empty 204 response", async () => {
  storage();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:8080/api/pessoas/12");
    assert.equal(options.method, "DELETE");
    return new Response(null, { status: 204 });
  };
  await service.inativarPessoa("12");
});

test("elderly registration sends family contacts and never sends access fields", async () => {
  storage();
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.tipoCadastro, "IDOSO");
    assert.equal(body.familiaId, 7);
    assert.equal(body.vinculoFamiliar, "FILHO_A");
    assert.deepEqual(body.contatosFamiliares, [{
      nome: "Maria", dataNascimento: "1980-01-01", idade: 46,
      vinculoFamiliar: "FILHO_A", telefone: "11999999999",
    }]);
    assert.equal(Object.hasOwn(body, "usuario"), false);
    assert.equal(Object.hasOwn(body, "senha"), false);
    assert.equal(Object.hasOwn(body, "perfil"), false);
    return Response.json({ id: 14, tipo: "FISICA", tipoCadastro: "IDOSO", contatosFamiliares: [] });
  };
  await service.salvarPessoa({
    tipo: "FISICA", tipoCadastro: "IDOSO", familiaId: "7", vinculoFamiliar: "FILHO_A",
    usuario: "ignorado", senha: "ignorada", perfil: "Administrador",
    contatosFamiliares: [{ nome: " Maria ", dataNascimento: "1980-01-01", idade: 46, vinculoFamiliar: "FILHO_A", telefone: "(11) 99999-9999" }],
  });
});

test("backend validation and conflict messages are preserved", async () => {
  storage();
  for (const status of [400, 409]) {
    globalThis.fetch = async () => Response.json({ message: "CPF já cadastrado." }, { status });
    await assert.rejects(service.salvarPessoa({ tipo: "FISICA" }), /CPF já cadastrado/);
  }
});

test("authentication, permission and network failures are reported", async () => {
  storage(null);
  globalThis.fetch = () => assert.fail("Must not request without a token");
  await assert.rejects(service.listarPessoas(), /sessão expirou/);
  storage();
  for (const [status, message] of [
    [400, /dados enviados são inválidos/],
    [401, /sessão expirou/],
    [403, /permissão/],
    [404, /não foi encontrado/],
    [409, /conflita com os dados/],
    [500, /erro interno/],
  ]) {
    globalThis.fetch = async () => new Response("", { status });
    await assert.rejects(service.listarPessoas(), (erro) => {
      assert.equal(erro.name, "ErroApi");
      assert.equal(erro.status, status);
      assert.match(erro.message, message);
      assert.doesNotMatch(erro.message, /conectar ao servidor/);
      return true;
    });
  }
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(service.listarPessoas(), (erro) => {
    assert.equal(erro.name, "ErroConexaoApi");
    assert.match(erro.message, /conectar ao servidor/);
    return true;
  });
});

test("an intentional request cancellation is not classified as a connection failure", async () => {
  storage();
  const controller = new AbortController();
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")));
  });

  const primeiraRequisicao = service.listarPessoas(controller.signal, { status: true });
  controller.abort();
  await assert.rejects(primeiraRequisicao, (erro) => {
    assert.equal(erro.name, "AbortError");
    assert.doesNotMatch(erro.message, /conectar ao servidor/);
    return true;
  });

  globalThis.fetch = async () => Response.json([]);
  assert.deepEqual(await service.listarPessoas(undefined, { status: true }), []);
});
