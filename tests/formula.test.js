// Fórmula: horas semanales × semanas del curso (no el recuento del calendario), justificadas en sus 3 modos.
const assert = require('assert'); const C = require('../site/core.js');
const wk = { 1: [{ start: '08:00', end: '11:00', subject: 'A', hours: 3 }], 2: [{ start: '08:00', end: '10:00', subject: 'A', hours: 2 }] }; // 5 h/semana
const terms = [{ id: '1r', label: '1r', from: '2026-09-14', to: '2026-11-27' }, { id: '2n', label: '2n', from: '2026-11-30', to: '2027-03-05' }, { id: '3r', label: '3r', from: '2027-03-08', to: '2027-06-18' }];
const holidays = [{ from: '2026-12-22', to: '2027-01-07', label: 'Nadal' }, { from: '2027-03-20', to: '2027-03-29', label: 'SS' }];
const base = { terms, holidays, schedule: wk, alias: {}, faltas: [] };
const st = (settings, faltas) => Object.assign({}, base, { settings: Object.assign({}, C.DEF, settings), faltas: faltas || [] });
// curso entero: 5 h × 33 semanas = 165 h exactas
const sc = C.scope(st({ ambito: 'curso' }));
assert.strictEqual(C.summary(sc, 'curso')[0].total, 165);
// por trimestre: los tres suman 165 h (escalado), cada uno proporcional a sus semanas
const s3 = st({}); const t3 = terms.map((t) => C.summary(s3, t.id)[0].total); const sum = Math.round(t3.reduce((a, b) => a + b, 0));
assert.ok(Math.abs(sum - 165) <= 1, 'suma trimestres ' + sum + ' ' + t3);
// con el calendario "crudo" (sin la fórmula) salen más horas
assert.ok(C.computeTotals(st({ formula: 'calendario' }), '1r').A > t3[0]);
// nunca escala al alza: con 52 semanas se queda en el recuento
assert.strictEqual(C.computeTotals(st({ semanas: 52 }), '1r').A, C.computeTotals(st({ formula: 'calendario' }), '1r').A);
// justificadas
const f = [{ id: 'a', date: '2026-09-14', term: '1r', subject: 'A', hours: 3, type: 'falta', justified: false }, { id: 'b', date: '2026-09-15', term: '1r', subject: 'A', hours: 2, type: 'falta', justified: true }];
assert.strictEqual(C.summary(st({ justModo: 'juntas' }, f), '1r')[0].absent, 5);
assert.strictEqual(C.summary(st({ justModo: 'nocuentan' }, f), '1r')[0].absent, 3);
const sep = C.summary(st({ justModo: 'separadas', limite: 20, limiteJust: 10 }, f), '1r')[0];
assert.strictEqual(sep.absent, 3); assert.strictEqual(sep.j.absent, 2); assert.ok(sep.j.limit < sep.limit);
// compatibilidad: el interruptor antiguo sigue funcionando
assert.strictEqual(C.summary(st({ justificadasCuentan: false }, f), '1r')[0].absent, 3);
console.log('formula OK', t3);
