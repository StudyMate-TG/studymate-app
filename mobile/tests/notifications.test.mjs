import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { horarioLembreteTarefa, horariosLembreteAvaliacao, instanteAcademico, nivelAlertaFaltas } from "../src/utils/notificacaoPolicy.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const src = fileURLToPath(new URL("../src/", import.meta.url));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
function ambiente(platform = "android") {
  const cache = new Map();
  const storage = new Map();
  const scheduled = new Map();
  const shown = new Set();
  const calls = [];
  let permissionHook;
  let scheduleHook;
  let httpHook = async () => new Response(JSON.stringify({ total: 2 }));
  const expo = {
    AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { DATE: "date" },
    setNotificationHandler: () => {}, setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => { await permissionHook?.(); return { granted: true }; },
    requestPermissionsAsync: async () => ({ granted: true }),
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    scheduleNotificationAsync: async (request) => {
      await scheduleHook?.();
      scheduled.set(request.identifier, request); calls.push(request);
      if (request.trigger === null) shown.add(request.identifier);
      return request.identifier;
    },
    cancelScheduledNotificationAsync: async (id) => { scheduled.delete(id); },
    dismissNotificationAsync: async (id) => { shown.delete(id); },
    cancelAllScheduledNotificationsAsync: async () => { scheduled.clear(); },
    dismissAllNotificationsAsync: async () => { shown.clear(); },
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "react-native") return { Platform: { OS: platform } };
      if (specifier === "expo-notifications") return expo;
      if (specifier === "@react-native-async-storage/async-storage") return {
        getItem: async (key) => storage.get(key) ?? null,
        setItem: async (key, value) => { storage.set(key, value); },
        removeItem: async (key) => { storage.delete(key); },
      };
      if (specifier === "./apiConfig") return { API_BASE_URL: "http://test/api" };
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(filename), `${specifier}.ts`));
      throw new Error(`Unexpected dependency: ${specifier}`);
    };
    new Function("require", "module", "exports", "fetch", output)(localRequire, module, module.exports, (...args) => httpHook(...args));
    return module.exports;
  }
  const api = load(path.join(src, "services/apiClient.ts"));
  const native = load(path.join(src, "services/notificacaoService.ts"));
  const central = load(path.join(src, "services/centralNotificacoesService.ts"));
  api.setAccessToken("jwt-one", 3600, 1);
  return { api, native, central, calls, scheduled, shown, storage,
    permission: (handler) => { permissionHook = handler; }, schedule: (handler) => { scheduleHook = handler; },
    http: (handler) => { httpHook = handler; },
  };
}
const task = { localId: "local-one", idTarefa: 7, titulo: "Entrega", dataEntrega: "2099-12-31T18:00:00" };

test("academic wall times use São Paulo independent of the device zone", () => {
  assert.equal(instanteAcademico("2026-10-27T18:00:00").toISOString(), "2026-10-27T21:00:00.000Z");
  assert.equal(instanteAcademico("2026-10-27T18:00:00+01:00").toISOString(), "2026-10-27T17:00:00.000Z");
  assert.equal(horarioLembreteTarefa("2026-10-27T18:00:00").toISOString(), "2026-10-26T21:00:00.000Z");
  const evaluation = horariosLembreteAvaliacao("2026-11-01");
  assert.equal(evaluation.vespera.toISOString(), "2026-10-31T21:00:00.000Z");
  assert.equal(evaluation.dia.toISOString(), "2026-11-01T11:00:00.000Z");
});
test("invalid dates and unavailable absence limits do not generate reminders", () => {
  for (const value of ["invalid", "2026-02-31", "2026-10-27T25:00:00"]) assert.equal(instanteAcademico(value), null);
  assert.equal(horariosLembreteAvaliacao("2026-02-31"), null);
  assert.equal(nivelAlertaFaltas(3, 0), 100); assert.equal(nivelAlertaFaltas(0, 0), 0); assert.equal(nivelAlertaFaltas(NaN, 10), 0);
  assert.equal(nivelAlertaFaltas(2, 4), 0); assert.equal(nivelAlertaFaltas(3, 4), 75);
  assert.equal(nivelAlertaFaltas(4, 4), 100);
});
test("simultaneous task reschedules leave one account-scoped OS reminder", async () => {
  const a = ambiente();
  await Promise.all([a.native.agendarNotificacaoTarefa(task), a.native.agendarNotificacaoTarefa(task)]);
  assert.equal(a.scheduled.size, 1);
  const reminder = [...a.scheduled.values()][0];
  assert.equal(reminder.content.data.idUsuario, 1);
  assert.equal(reminder.trigger.date.toISOString(), "2099-12-30T21:00:00.000Z");
  await a.native.cancelarNotificacoesTarefa({ localId: task.localId });
  assert.equal(a.scheduled.size, 0);
});
test("a changed due date replaces the reminder and past dates cancel it", async () => {
  const a = ambiente();
  await a.native.agendarNotificacaoTarefa(task);
  await a.native.agendarNotificacaoTarefa({ ...task, dataEntrega: "2099-12-30T18:00:00" });
  assert.equal(a.scheduled.size, 1);
  assert.equal([...a.scheduled.values()][0].trigger.date.toISOString(), "2099-12-29T21:00:00.000Z");
  await a.native.agendarNotificacaoTarefa({ ...task, dataEntrega: "2000-01-01T18:00:00" });
  assert.equal(a.scheduled.size, 0);
});
test("logout cancels both pending and displayed reminders before another account schedules", async () => {
  const a = ambiente();
  await a.native.agendarNotificacaoTarefa(task);
  await a.native.verificarNotificacaoFaltas({ idUsuario: 1, idDisciplina: 7, nomeDisciplina: "Matemática", totalFaltas: 3, limiteFaltas: 4 });
  assert.equal(a.shown.size, 1);
  a.api.clearAccessToken();
  await a.native.cancelarTodosLembretesLocais();
  assert.equal(a.scheduled.size, 0); assert.equal(a.shown.size, 0);
  a.api.setAccessToken("jwt-two", 3600, 2);
  await a.native.agendarNotificacaoTarefa(task);
  assert.ok([...a.scheduled.keys()][0].includes(":2:"));
  assert.equal([...a.scheduled.values()][0].content.data.idUsuario, 2);
});
test("logout during permission acquisition prevents the previous account scheduling", async () => {
  const a = ambiente(); const entered = deferred(); const release = deferred();
  a.permission(async () => { entered.resolve(); await release.promise; });
  const result = a.native.agendarNotificacaoTarefa(task);
  await entered.promise; a.api.clearAccessToken(); release.resolve();
  assert.equal(await result, null);
  await a.native.cancelarTodosLembretesLocais(); assert.equal(a.scheduled.size, 0);
});
test("logout while the native schedule call awaits removes its late result", async () => {
  const a = ambiente(); const entered = deferred(); const release = deferred();
  a.schedule(async () => { entered.resolve(); await release.promise; });
  const result = a.native.agendarNotificacaoTarefa(task);
  await entered.promise; a.api.clearAccessToken(); release.resolve();
  assert.equal(await result, null);
  await a.native.cancelarTodosLembretesLocais(); assert.equal(a.scheduled.size, 0);
});
test("the browser uses the authenticated inbox without calling native notification APIs", async () => {
  const a = ambiente("web");
  assert.equal(await a.native.configurarNotificacoes(), false);
  assert.equal(await a.native.agendarNotificacaoTarefa(task), null);
  let requested;
  a.http(async (url, init) => { requested = { url, init }; return new Response(JSON.stringify({ total: 2 })); });
  assert.deepEqual(await a.central.contarNotificacoesNaoLidas(), { total: 2 });
  assert.equal(requested.url, "http://test/api/notificacoes/nao-lidas/total");
  assert.equal(requested.init.headers.get("Authorization"), "Bearer jwt-one");
  assert.equal(a.calls.length, 0);
});
test("the inbox uses pagination and reading filters without sending user authorization in query/body", async () => {
  const a = ambiente(); const calls = [];
  a.http(async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ content: [], totalElements: 0 })); });
  await a.central.listarNotificacoes(2, 20, false);
  await a.central.marcarNotificacaoLida(7);
  assert.equal(calls[0].url, "http://test/api/notificacoes?page=2&size=20&lida=false");
  assert.equal(calls[1].url, "http://test/api/notificacoes/7/lida");
  assert.equal(calls[1].init.method, "PATCH"); assert.equal(calls[1].init.body, undefined);
  await assert.rejects(a.central.listarNotificacoes(0, 51), /Paginação/);
});
test("an old HTTP response is rejected after switching or renewing the session", async () => {
  for (const newUser of [1, 2]) {
    const a = ambiente(); const entered = deferred(); const release = deferred();
    a.http(async () => { entered.resolve(); await release.promise; return new Response(JSON.stringify({ total: 99 })); });
    const result = a.central.contarNotificacoesNaoLidas();
    await entered.promise; a.api.setAccessToken("new-jwt", 3600, newUser);
    const rejected = assert.rejects(result, /sessão mudou/);
    release.resolve(); await rejected;
  }
});
test("a 401 clears session and device reminders and records the expired-session UI message", async () => {
  const a = ambiente(); await a.native.agendarNotificacaoTarefa(task);
  a.http(async () => new Response("{}", { status: 401 }));
  await assert.rejects(a.central.contarNotificacoesNaoLidas(), /sessão terminou/);
  await a.native.cancelarTodosLembretesLocais();
  assert.equal(a.api.hasSession(), false); assert.equal(a.scheduled.size, 0);
  assert.match(a.api.getSessionEndReason(), /expirou/);
});

test("remote completion or deletion removes old OS reminders during reconciliation", async () => {
  const a = ambiente();
  await a.native.agendarNotificacaoTarefa(task);
  await a.native.reconciliarLembretesTarefas([{ ...task, serverId: 7, status: "CONCLUIDA" }], 1);
  assert.equal(a.scheduled.size, 0);
  await a.native.reconciliarLembretesTarefas([{ ...task, serverId: 7, status: "PENDENTE" }], 1);
  assert.equal(a.scheduled.size, 1);
  await a.native.reconciliarLembretesTarefas([], 1);
  assert.equal(a.scheduled.size, 0);
});

test("concluding a task while reconciliation awaits permissions cannot reintroduce its reminder", async () => {
  const a = ambiente(); const entered = deferred(); const release = deferred(); let first = true;
  a.permission(async () => { if (first) { first = false; entered.resolve(); await release.promise; } });
  const second = { ...task, localId: "local-two", idTarefa: 8 };
  const reconcile = a.native.reconciliarLembretesTarefas([
    { ...task, serverId: 7, status: "PENDENTE" }, { ...second, serverId: 8, status: "PENDENTE" },
  ], 1);
  await entered.promise;
  const conclude = a.native.cancelarNotificacoesTarefa(second);
  release.resolve(); await Promise.all([reconcile, conclude]);
  assert.deepEqual([...a.scheduled.values()].map((x) => x.content.data.idTarefa), [7]);
});
test("a task snapshot captured before a newer local mutation is ignored", async () => {
  const a = ambiente(); const revision = a.native.getRevisaoLembretes();
  await a.native.cancelarNotificacoesTarefa(task);
  await a.native.reconciliarLembretesTarefas([{ ...task, serverId: 7, status: "PENDENTE" }], 1, revision);
  assert.equal(a.scheduled.size, 0);
});
test("evaluation reconciliation schedules São Paulo defaults and removes corrected or deleted entries", async () => {
  const a = ambiente(); const evaluation = { idAvaliacao: 7, nome: "Prova", dataAvaliacao: "2099-12-31", nota: null };
  await a.native.reconciliarLembretesAvaliacoes([evaluation], 1, 9);
  assert.equal(a.scheduled.size, 2);
  assert.deepEqual([...a.scheduled.values()].map(x => x.trigger.date.toISOString()), ["2099-12-30T21:00:00.000Z", "2099-12-31T11:00:00.000Z"]);
  await a.native.reconciliarLembretesAvaliacoes([{ ...evaluation, nota: 8 }], 1, 9);
  assert.equal(a.scheduled.size, 0);
  await a.native.reconciliarLembretesAvaliacoes([evaluation], 1, 9);
  await a.native.reconciliarLembretesAvaliacoes([], 1, 9);
  assert.equal(a.scheduled.size, 0);
});
