import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const src = fileURLToPath(new URL("../src/", import.meta.url));

function ambiente() {
  const cache = new Map();
  const calls = [];
  let responder = async () => Response.json({});
  let now = 1_000;
  const clock = { now: () => now };
  function load(relative) {
    const filename = path.resolve(src, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier.startsWith(".")) {
        return load(path.relative(src, path.resolve(path.dirname(filename), `${specifier}.ts`)));
      }
      throw new Error(`Unexpected dependency: ${specifier}`);
    };
    const fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return responder(url, init);
    };
    new Function("module", "exports", "require", "fetch", "Headers", "Date", output)(
      module, module.exports, localRequire, fetch, Headers, clock
    );
    return module.exports;
  }
  return {
    api: load("services/apiClient.ts"),
    notificacoes: load("services/notificacaoService.ts"),
    calls,
    responder: (value) => { responder = value; },
    avancar: (value) => { now += value; },
  };
}

test("notification requests use the JWT, pagination and optional reading filter without client ownership", async () => {
  const env = ambiente();
  env.api.setAccessToken("jwt-user-a", 60);
  const pagina = { content: [], page: 2, size: 20, totalElements: 41, totalPages: 3 };
  env.responder(async () => Response.json(pagina));
  assert.deepEqual(await env.notificacoes.listarNotificacoes(2, false), pagina);
  const request = env.calls[0];
  const url = new URL(request.url);
  assert.equal(url.pathname, "/api/notificacoes");
  assert.deepEqual(Object.fromEntries(url.searchParams), { page: "2", size: "20", lida: "false" });
  assert.equal(request.init.headers.get("Authorization"), "Bearer jwt-user-a");

  await env.notificacoes.listarNotificacoes();
  assert.equal(new URL(env.calls[1].url).searchParams.has("lida"), false);
  await env.notificacoes.listarNotificacoes(0, true);
  assert.equal(new URL(env.calls[2].url).searchParams.get("lida"), "true");
  assert.equal(env.calls.some((call) => call.url.includes("idUsuario")), false);
});

test("reading and unread count use their backend contracts", async () => {
  const env = ambiente();
  env.api.setAccessToken("jwt-user-a", 60);
  const lida = { idNotificacao: 9, lida: true };
  env.responder(async (url) => Response.json(String(url).endsWith("/total") ? { total: 3 } : lida));
  assert.deepEqual(await env.notificacoes.marcarNotificacaoLida(9), lida);
  assert.equal(env.calls[0].url, "http://localhost:8081/api/notificacoes/9/lida");
  assert.equal(env.calls[0].init.method, "PATCH");
  assert.equal(env.calls[0].init.body, undefined);
  assert.equal(await env.notificacoes.totalNaoLidas(), 3);
  assert.equal(env.calls[1].url, "http://localhost:8081/api/notificacoes/nao-lidas/total");
});

test("notification data is never requested without a session", async () => {
  const env = ambiente();
  await assert.rejects(env.notificacoes.listarNotificacoes(), /sessão terminou/);
  assert.equal(env.calls.length, 0);
});

test("late data and late unauthorized responses from account A do not enter or expire account B", async () => {
  for (const status of [200, 401]) {
    const env = ambiente();
    env.api.setAccessToken("jwt-user-a", 60);
    const firstVersion = env.api.getSessionVersion();
    let finish;
    env.responder(() => new Promise((resolve) => { finish = resolve; }));
    const request = env.notificacoes.listarNotificacoes();
    env.api.clearAccessToken();
    env.api.setAccessToken("jwt-user-b", 60);
    finish(Response.json({ content: [{ mensagem: "private account A" }] }, { status }));
    await assert.rejects(request, /sessão mudou/);
    assert.equal(env.api.hasSession(), true);
    assert.ok(env.api.getSessionVersion() > firstVersion);
    env.responder(async () => Response.json({ total: 0 }));
    await env.notificacoes.totalNaoLidas();
    assert.equal(env.calls.at(-1).init.headers.get("Authorization"), "Bearer jwt-user-b");
  }
});

test("401 and elapsed JWT lifetime notify the UI that the session expired", async () => {
  const env = ambiente();
  const reasons = [];
  const off = env.api.onSessionEnded((reason) => reasons.push(reason));
  env.api.setAccessToken("jwt-user-a", 60);
  env.responder(async () => new Response(null, { status: 401 }));
  await assert.rejects(env.notificacoes.totalNaoLidas(), /sessão terminou/);
  assert.equal(env.api.hasSession(), false);
  assert.deepEqual(reasons, ["expired"]);

  env.api.setAccessToken("jwt-user-b", 1);
  env.avancar(1_001);
  assert.equal(env.api.hasSession(), false);
  assert.deepEqual(reasons, ["expired", "expired"]);
  off();
});

test("a new login invalidates notification cache keys even for the same account", () => {
  const env = ambiente();
  env.api.setAccessToken("jwt-user-a", 60);
  const first = env.api.getSessionVersion();
  env.api.clearAccessToken();
  env.api.setAccessToken("jwt-user-a-new-login", 60);
  assert.notEqual(env.api.getSessionVersion(), first);
});
