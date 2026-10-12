import test from "node:test";
import assert from "node:assert/strict";
import { detectarOfensivaAcesa, reservarComemoracao } from "../src/utils/ofensivaUtils.ts";
import { obterDataHojeSaoPaulo } from "../src/utils/dataEstudoUtils.ts";

const resumo = ({ xp = 100, ativo = false, dia = "2026-10-11", dias = 1 } = {}) => ({
  xpTotal: xp, ativoHoje: ativo, ofensivaAtual: dias,
  semana: [{ data: dia, ativo, xp: ativo ? 30 : 0 }],
});

test("today changes at São Paulo midnight regardless of the host timezone", () => {
  assert.equal(obterDataHojeSaoPaulo(new Date("2026-10-11T02:59:59Z")), "2026-10-10");
  assert.equal(obterDataHojeSaoPaulo(new Date("2026-10-11T03:00:00Z")), "2026-10-11");
});

test("the first confirmed task or presence lights the streak", () => {
  for (const xpNovo of [20, 30]) {
    assert.deepEqual(detectarOfensivaAcesa(resumo(), resumo({ ativo: true, xp: 100 + xpNovo, dias: 4 })), {
      data: "2026-10-11", dias: 4, xpNovo,
    });
  }
});

test("login and polling with no prior snapshot never create a ceremony", () => {
  assert.equal(detectarOfensivaAcesa(null, resumo({ ativo: true, xp: 130 })), null);
});

test("additional XP on an already active day does not replay the ceremony", () => {
  assert.equal(detectarOfensivaAcesa(resumo({ ativo: true }), resumo({ ativo: true, xp: 130 })), null);
});

test("replayed completion or reopened task without new XP does not celebrate", () => {
  assert.equal(detectarOfensivaAcesa(resumo(), resumo({ ativo: true })), null);
  assert.equal(detectarOfensivaAcesa(resumo({ xp: 130 }), resumo({ ativo: true, xp: 100 })), null);
});

test("a confirmation crossing midnight lights the new server day", () => {
  for (const ativo of [false, true]) {
    assert.deepEqual(detectarOfensivaAcesa(resumo({ dia: "2026-10-10", ativo }), resumo({ ativo: true, xp: 130 })), {
      data: "2026-10-11", dias: 1, xpNovo: 30,
    });
  }
});

test("future or inactive snapshots and no new XP cannot light today's ceremony", () => {
  assert.equal(detectarOfensivaAcesa(resumo({ dia: "2026-10-12" }), resumo({ ativo: true, xp: 130 })), null);
  assert.equal(detectarOfensivaAcesa(resumo({ dia: "2026-10-10" }), resumo({ ativo: true })), null);
  assert.equal(detectarOfensivaAcesa(resumo(), resumo({ xp: 130 })), null);
});

test("offline confirmation uses the current server day", () => {
  const confirmouHoje = detectarOfensivaAcesa(resumo({ dia: "2026-10-12" }), resumo({ dia: "2026-10-12", ativo: true, xp: 130 }));
  assert.equal(confirmouHoje.data, "2026-10-12");
});

test("missing or inconsistent server week cannot trigger a ceremony", () => {
  assert.equal(detectarOfensivaAcesa(resumo(), { ...resumo({ ativo: true, xp: 130 }), semana: [] }), null);
  assert.equal(detectarOfensivaAcesa(resumo(), { ...resumo({ ativo: true, xp: 130 }), semana: [{ data: "2026-10-11", ativo: false }] }), null);
});

test("persistent dedup survives a new provider instance", async () => {
  const saved = new Map();
  const storage = { getItem: async (key) => saved.get(key) ?? null, setItem: async (key, value) => { saved.set(key, value); } };
  assert.equal(await reservarComemoracao("1_2026-10-11", new Set(), storage, () => true), true);
  assert.equal(await reservarComemoracao("1_2026-10-11", new Set(), storage, () => true), false);
  assert.equal(await reservarComemoracao("2_2026-10-11", new Set(), storage, () => true), true);
  assert.equal(await reservarComemoracao("1_2026-10-12", new Set(), storage, () => true), true);
});

test("storage failures preserve a valid ceremony once in memory", async () => {
  const storage = { getItem: async () => { throw new Error("unavailable"); }, setItem: async () => { throw new Error("unavailable"); } };
  const reserved = new Set();
  assert.equal(await reservarComemoracao("1_2026-10-11", reserved, storage, () => true), true);
  assert.equal(await reservarComemoracao("1_2026-10-11", reserved, storage, () => true), false);
});

test("simultaneous confirmations reserve only one ceremony", async () => {
  const reserved = new Set();
  const storage = { getItem: async () => null, setItem: async () => {} };
  const results = await Promise.all([
    reservarComemoracao("1_2026-10-11", reserved, storage, () => true),
    reservarComemoracao("1_2026-10-11", reserved, storage, () => true),
  ]);
  assert.deepEqual(results, [true, false]);
});

test("a session change while storage awaits prevents the old account ceremony", async () => {
  let valid = true;
  let resolve;
  let wrote = false;
  const storage = { getItem: () => new Promise((done) => { resolve = done; }), setItem: async () => { wrote = true; } };
  const result = reservarComemoracao("1_2026-10-11", new Set(), storage, () => valid);
  valid = false;
  resolve(null);
  assert.equal(await result, false);
  assert.equal(wrote, false);
});
