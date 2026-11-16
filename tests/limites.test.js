// Reglas con 1 o 2 límites (settings.limites). Autocontenido.
// Cubre los casos reales: 25 % de todas, 20 % solo sin justificar, 10 % sin justificar + 15 % justificadas
// (aparte o de todas juntas), justificadas que cuentan la mitad, retrasos y el veredicto estricto.
const assert = require('assert'); const C = require('../site/core.js');

const base = {
  terms: [{ id: '1r', label: '1r', from: '2026-09-14', to: '2026-11-27' }],
  holidays: [],
  schedule: { 1: [{ start: '08:00', end: '10:00', subject: 'IPO', hours: 2 }] },
  periods: [], alias: {}, totals: { '1r': { IPO: 40 } }, totalsUnified: {}
};
const F = (date, hours, justified, type) => ({ id: date + hours + justified + (type || ''), date, subject: 'IPO', hours, type: type || 'falta', justified: !!justified });
const faltas = [F('2026-09-14', 3, false), F('2026-09-21', 2, true)]; // 3 h sin justificar, 2 h justificadas
const mk = (settings, fs) => Object.assign({}, base, { settings: Object.assign({}, C.DEF, settings), faltas: fs || faltas });
const row = (st) => C.summary(st, '1r').find((x) => x.name === 'IPO');
const L = (pct, sin, just) => ({ pct, sin, just });
const LUNES = '2026-11-16'; // IPO 2 h

// --- A · 25 %, cuentan todas
let r = row(mk({ limites: [L(25, 1, 1)] }));
assert.deepStrictEqual([r.absent, r.limit, r.margin, r.status], [5, 10, 5, 'verde'], 'A');

// --- B · 20 %, solo sin justificar
r = row(mk({ limites: [L(20, 1, 0)] }));
assert.deepStrictEqual([r.absent, r.limit, r.margin], [3, 8, 5], 'B');

// --- C1 · 10 % sin justificar y 15 % justificadas, aparte
const c1 = mk({ limites: [L(10, 1, 0), L(15, 0, 1)] });
r = row(c1);
assert.deepStrictEqual(r.limits.map((l) => [l.used, l.limit, l.margin]), [[3, 4, 1], [2, 6, 4]], 'C1 límites');
assert.deepStrictEqual([r.absent, r.margin, r.status], [3, 1, 'amarillo'], 'C1 dato principal = sin justificar');
assert.deepStrictEqual([r.j.absent, r.j.margin], [2, 4], 'C1 compatibilidad v1');
// veredicto: sin justificante se pasa (3+2 > 4); con justificante, no (2+2 ≤ 6)
let v = C.verdict(c1, LUNES);
assert.strictEqual(v.status, 'rojo', 'C1 hoy sin justificante');
assert.strictEqual(v.items[0].conJust.status, 'amarillo', 'C1 hoy con justificante');
assert.strictEqual(v.soloJust, true, 'C1 «Solo con justificante»');

// --- C2 · 10 % sin justificar y 15 % de todas juntas
const c2 = mk({ limites: [L(10, 1, 0), L(15, 1, 1)] });
r = row(c2);
assert.deepStrictEqual(r.limits.map((l) => [l.used, l.margin]), [[3, 1], [5, 1]], 'C2 límites');
v = C.verdict(c2, LUNES);
assert.strictEqual(v.status, 'rojo');
assert.strictEqual(v.items[0].conJust.status, 'rojo', 'C2: con justificante pasa el 15 % de todas');
assert.strictEqual(v.soloJust, false);

// --- D · justificadas cuentan la mitad
r = row(mk({ limites: [L(25, 1, 0.5)] }));
assert.deepStrictEqual([r.absent, r.margin], [4, 6], 'D');

// --- retrasos: el bloque de N se cuenta con el peso de cada límite
const late = [F('2026-09-14', 0, false, 'retraso'), F('2026-09-15', 0, false, 'retraso'), F('2026-09-16', 0, true, 'retraso')];
assert.strictEqual(row(mk({ limites: [L(25, 1, 1)], retrasosPorFalta: 3 }, late)).absent, 1, '2 + 1 justificado = 3 retrasos = 1 h');
assert.strictEqual(row(mk({ limites: [L(25, 1, 0)], retrasosPorFalta: 3 }, late)).absent, 0, 'el justificado no cuenta');
assert.strictEqual(row(mk({ limites: [L(25, 1, 1)], retrasosPorFalta: 0 }, late)).absent, 0, 'sin regla de retrasos');

// --- ajustes antiguos (v1) → límites
assert.deepStrictEqual(C.limitsOf({ limite: 25, justModo: 'juntas' }), [L(25, 1, 1)]);
assert.deepStrictEqual(C.limitsOf({ limite: 20, justModo: 'nocuentan' }), [L(20, 1, 0)]);
assert.deepStrictEqual(C.limitsOf({ limite: 10, justModo: 'separadas', limiteJust: 15 }), [L(10, 1, 0), L(15, 0, 1)]);
assert.deepStrictEqual(C.limitsOf({ limite: 25, justificadasCuentan: false }), [L(20 + 5, 1, 0)]);
// los mismos números con ajustes antiguos que con límites
assert.deepStrictEqual(row(mk({ limite: 10, justModo: 'separadas', limiteJust: 15 })).limits, row(c1).limits, 'v1 = v2');
// límites inválidos: se ignoran y se usan los ajustes antiguos
assert.deepStrictEqual(C.limitsOf({ limite: 15, limites: [{ pct: 0 }, { pct: 300 }] }), [L(15, 1, 1)]);

// --- simulador con y sin justificante
const si = C.simulate(c1, LUNES, [0, 1]);
assert.strictEqual(si.status, 'rojo');
assert.strictEqual(C.simulate(c1, LUNES, [0, 1], { justificada: true }).status, 'amarillo');

console.log('límites OK');
