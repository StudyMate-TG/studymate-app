import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const src = fileURLToPath(new URL("../src/", import.meta.url));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tarefa = (extras = {}) => ({
  idTarefa: 1, idDisciplina: 1, nomeDisciplina: "Matemática", titulo: "Exercícios",
  tipo: "TRABALHO", descricao: null, dataHoraInicio: null,
  dataEntrega: "2026-10-11T18:00:00", dataConclusao: null,
  status: "PENDENTE", prioridade: "ALTA", xpGerado: 0, version: 1,
  ...extras,
});

// Run the production TypeScript modules and their SQL against real SQLite.
// Only device APIs, the session and HTTP transport are replaced.
function ambiente() {
  const sqlite = new DatabaseSync(":memory:");
  const cache = new Map();
  let usuario = 1;
  let aoRequisitar;
  let aoCapturar;
  let cursor = 0;
  const chamadas = [];
  const notificacoes = [];
  const donos = [];
  const servidor = new Map([[1, tarefa()]]);
  const validar = (esperado) => {
    if (usuario === null || (esperado !== undefined && usuario !== esperado)) throw new Error("Sessão mudou");
    return usuario;
  };
  const db = {
    runAsync: async (sql, ...params) => sqlite.prepare(sql).run(...params),
    getFirstAsync: async (sql, ...params) => sqlite.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, ...params) => sqlite.prepare(sql).all(...params),
    withExclusiveTransactionAsync: async (action) => {
      sqlite.exec("BEGIN IMMEDIATE");
      try { await action(db); sqlite.exec("COMMIT"); }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  const substitutions = new Map([
    [path.join(src, "database/database.ts"), { getDatabase: async (id) => { donos.push(id); validar(id); return db; } }],
    [path.join(src, "services/apiConfig.ts"), { API_BASE_URL: "http://test/api" }],
    [path.join(src, "services/apiClient.ts"), {
      requireSessionUser: validar,
      handleResponse: async (response) => response,
      apiFetch: async (url, init = {}, _authenticated, id) => {
        validar(id);
        const call = { url, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null };
        chamadas.push(call);
        const override = await aoRequisitar?.(call);
        if (override !== undefined) return override;
        if (call.method === "POST") {
          const item = servidor.get(call.body.idTarefa);
          if (call.body.operation === "COMPLETE") servidor.set(item.idTarefa, tarefa({ ...item, status: "CONCLUIDA", xpGerado: 30, version: 2, dataConclusao: "2026-10-11T12:00:00" }));
          return { clientTxId: call.body.clientTxId, idTarefa: call.body.idTarefa, status: "OK", alreadyProcessed: false };
        }
        return { tarefas: [...servidor.values()], cursor: `c${++cursor}`, hasMore: false };
      },
    }],
    [path.join(src, "services/gamificacaoService.ts"), {
      capturarProgressoAntesAtividade: async (id) => { validar(id); await aoCapturar?.(); return { xpTotal: 0 }; },
      notificarProgressoAtualizado: (id, antes) => { validar(id); notificacoes.push({ id, antes }); },
    }],
  ]);
  const carregar = (relative) => load(path.resolve(src, relative));
  function load(filename) {
    if (substitutions.has(filename)) return substitutions.get(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "expo-crypto") return { randomUUID };
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(filename), `${specifier}.ts`));
      throw new Error(`Unexpected native dependency: ${specifier}`);
    };
    new Function("require", "module", "exports", output)(localRequire, module, module.exports);
    return module.exports;
  }
  sqlite.exec(carregar("database/migrations.ts").DATABASE_SCHEMA);
  const repo = carregar("database/repositories/tarefaSyncRepository.ts");
  const metadata = carregar("database/repositories/syncMetadataRepository.ts");
  const pull = carregar("services/syncTarefaService.ts");
  const engine = carregar("services/tarefaSyncEngine.ts");
  const query = (sql, ...params) => sqlite.prepare(sql).get(...params);
  const executar = (sql, ...params) => sqlite.prepare(sql).run(...params);
  const inserirLocal = (serverId = 1, status = "CONCLUIDA") => executar(`
    INSERT INTO local_tarefa (local_id, server_id, id_disciplina, nome_disciplina, titulo,
      tipo, data_entrega, status, prioridade, xp_gerado, sync_status, updated_at_local)
    VALUES ('local-1', ?, 1, 'Matemática', 'Exercícios', 'TRABALHO', '2026-10-11T18:00:00', ?, 'ALTA', 0, 'PENDING', '2026-10-11T12:00:00')`, serverId, status);
  const enfileirar = (status = "PENDING", operation = "COMPLETE") => executar(`
    INSERT INTO sync_outbox (client_tx_id, entity_local_id, entity_type, operation, payload, status, created_at)
    VALUES (?, 'local-1', 'TAREFA', ?, '{}', ?, '2026-10-11T12:00:00')`, randomUUID(), operation, status);
  executar("INSERT INTO sync_metadata (key, value) VALUES ('tarefas_cursor_1', 'original')");
  return { sqlite, query, executar, inserirLocal, enfileirar, repo, metadata, pull, engine,
    chamadas, notificacoes, donos, servidor,
    trocarUsuario: (id) => { usuario = id; },
    requisicoes: (handler) => { aoRequisitar = handler; },
    captura: (handler) => { aoCapturar = handler; },
    cursor: () => query("SELECT value FROM sync_metadata WHERE key = 'tarefas_cursor_1'").value,
  };
}

for (const status of ["PENDING", "PROCESSING", "ERROR"]) {
  test(`pull preserves an optimistic completion and its cursor while outbox is ${status}`, async (t) => {
    const a = ambiente(); t.after(() => a.sqlite.close());
    a.inserirLocal(); a.enfileirar(status);
    assert.equal(await a.repo.aplicarPullTarefas([tarefa()], 1, "new"), false);
    assert.equal(a.query("SELECT status FROM local_tarefa").status, "CONCLUIDA");
    assert.equal(a.cursor(), "original");
    a.executar("DELETE FROM sync_outbox");
    assert.equal(await a.repo.aplicarPullTarefas([tarefa({ status: "CONCLUIDA", xpGerado: 30, version: 2 })], 1, "new"), true);
    const local = a.query("SELECT * FROM local_tarefa");
    assert.equal(local.sync_status, "SYNCED"); assert.equal(local.xp_gerado, 30);
    assert.equal(a.cursor(), "new");
  });
}

test("remote tombstone waits for pending local work and is applied after confirmation", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.inserirLocal(); a.enfileirar();
  const deleted = tarefa({ deletedAt: "2026-10-11T13:00:00Z" });
  assert.equal(await a.repo.aplicarPullTarefas([deleted], 1, "deleted"), false);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM local_tarefa").n, 1);
  a.executar("DELETE FROM sync_outbox");
  assert.equal(await a.repo.aplicarPullTarefas([deleted], 1, "deleted"), true);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM local_tarefa").n, 0);
});

test("a lost CREATE response cannot insert a duplicate before idempotent replay recovers its id", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.inserirLocal(null, "PENDENTE"); a.enfileirar("ERROR", "CREATE");
  assert.equal(await a.repo.aplicarPullTarefas([tarefa()], 1, "created"), false);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM local_tarefa").n, 1);
  assert.equal(a.cursor(), "original");
  a.executar("UPDATE local_tarefa SET server_id = 1"); a.executar("DELETE FROM sync_outbox");
  assert.equal(await a.repo.aplicarPullTarefas([tarefa()], 1, "created"), true);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM local_tarefa").n, 1);
});

test("a failed pull rolls back row changes together with its cursor", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.inserirLocal();
  await assert.rejects(a.repo.aplicarPullTarefas([tarefa({ titulo: "Nova" }), tarefa({ idTarefa: undefined })], 1, "invalid"), /sem idTarefa/);
  assert.equal(a.query("SELECT titulo FROM local_tarefa").titulo, "Exercícios");
  assert.equal(a.cursor(), "original");
});

test("pagination stops at a protected page and resumes from the original cursor after confirmation", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.inserirLocal(); a.enfileirar();
  a.requisicoes((call) => {
    const cursor = new URL(call.url).searchParams.get("cursor");
    return cursor === "original"
      ? { tarefas: [tarefa()], cursor: "next", hasMore: true }
      : { tarefas: [tarefa({ idTarefa: 2 })], cursor: "last", hasMore: false };
  });
  await a.pull.executarPullTarefas(1);
  assert.equal(a.chamadas.length, 1); assert.equal(a.cursor(), "original");
  a.executar("DELETE FROM sync_outbox");
  await a.pull.executarPullTarefas(1);
  assert.equal(a.chamadas.length, 3); assert.equal(a.cursor(), "last");
  assert.equal(a.query("SELECT COUNT(*) AS n FROM local_tarefa").n, 2);
});

test("completion queued during an active pull runs a second push without reverting the local task", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  const entered = deferred(); const release = deferred(); let first = true;
  a.requisicoes(async (call) => {
    if (call.method === "GET" && first) { first = false; entered.resolve(); await release.promise; }
  });
  const sync = a.engine.sincronizarTarefas(1);
  await entered.promise;
  a.inserirLocal(); a.enfileirar();
  assert.equal(a.engine.sincronizarTarefas(1), sync);
  assert.equal(a.engine.sincronizarTarefas(1), sync);
  release.resolve(); await sync;
  assert.deepEqual(a.chamadas.map((call) => call.method), ["GET", "POST", "GET"]);
  const local = a.query("SELECT * FROM local_tarefa");
  assert.equal(local.status, "CONCLUIDA"); assert.equal(local.xp_gerado, 30);
  assert.equal(local.sync_status, "SYNCED");
  assert.equal(a.query("SELECT COUNT(*) AS n FROM sync_outbox").n, 0);
  assert.equal(a.notificacoes.length, 2);
  assert.ok(a.donos.every((id) => id === 1));
});

test("a failed push keeps its outbox entry and rejects without an endless repeat; a later retry succeeds", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.inserirLocal(); a.enfileirar();
  const entered = deferred(); const release = deferred();
  a.requisicoes(async (call) => {
    if (call.method === "POST") { entered.resolve(); await release.promise; throw new Error("Sem conexão"); }
  });
  const sync = a.engine.sincronizarTarefas(1);
  await entered.promise;
  assert.equal(a.engine.sincronizarTarefas(1), sync);
  const failure = assert.rejects(sync, /Sem conexão/);
  release.resolve(); await failure;
  assert.equal(a.chamadas.length, 1);
  assert.equal(a.query("SELECT status FROM sync_outbox").status, "ERROR");
  assert.equal(a.query("SELECT status FROM local_tarefa").status, "CONCLUIDA");
  a.requisicoes(undefined);
  await a.engine.sincronizarTarefas(1);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM sync_outbox").n, 0);
  assert.equal(a.query("SELECT xp_gerado FROM local_tarefa").xp_gerado, 30);
});

test("metadata from an old session cannot be written into another account's database", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  a.trocarUsuario(2);
  await assert.rejects(a.metadata.salvarMetadata("tarefas_last_sync_at_1", "now", 1), /Sessão mudou/);
  assert.equal(a.query("SELECT COUNT(*) AS n FROM sync_metadata WHERE key = 'tarefas_last_sync_at_1'").n, 0);
});

test("switching accounts during an active synchronization stops old-account pull and notifications", async (t) => {
  const a = ambiente(); t.after(() => a.sqlite.close());
  const entered = deferred(); const release = deferred();
  a.captura(async () => { entered.resolve(); await release.promise; });
  const sync = a.engine.sincronizarTarefas(1);
  await entered.promise; a.trocarUsuario(2);
  const failure = assert.rejects(sync, /Sessão mudou/);
  release.resolve(); await failure;
  assert.equal(a.chamadas.length, 0); assert.equal(a.notificacoes.length, 0);
  assert.equal(a.cursor(), "original");
});
