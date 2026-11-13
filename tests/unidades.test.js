// Ids de asignaturas y faltas, unidades de 1 h y horas totales fijadas. Autocontenido.
const assert = require('assert');
const C = require('../site/core.js'), SU = require('../site/setup.js');
const cfg = {
  terms: [{ id: '1r', label: '1r', from: '2026-09-14', to: '2026-11-27' }], holidays: [], periods: [], alias: {},
  schedule: { 2: [{ start: '08:00', end: '10:00', subject: 'DAW', hours: 2 }, { start: '10:00', end: '12:30', subject: 'PROJ', hours: 2 }] },
  totals: { '1r': { DAW: 30 } }, totalsUnified: {}
};
const st = (c, f, set) => Object.assign({}, c, { settings: Object.assign({}, C.DEF, set), faltas: f });

// una falta de 2 h seguidas de DAW = dos unidades, cada una con su hora
let n = C.normalize(cfg, [{ id: 'a', date: '2026-11-03', subject: 'DAW', hours: 2, type: 'falta' }]);
assert.deepStrictEqual(n.faltas.map((f) => [f.start, f.hours]), [['08:00', 1], ['09:00', 1]]);
assert.strictEqual(n.faltas[0].id, 'a'); assert.notStrictEqual(n.faltas[1].id, 'a');
// el recreo no rompe las horas: PROJ 10:00-12:30 con 2 h
n = C.normalize(cfg, [{ id: 'p', date: '2026-11-03', subject: 'PROJ', hours: 2, type: 'falta' }]);
assert.deepStrictEqual(n.faltas.map((f) => f.start), ['10:00', '11:30']);
// idempotente: normalizar dos veces no cambia nada
const again = C.normalize(n.cfg, n.faltas); assert.deepStrictEqual(again.faltas, n.faltas);
// si ya hay una unidad a las 08:00, la siguiente va a las 09:00
n = C.normalize(cfg, [{ id: 'x', date: '2026-11-03', subject: 'DAW', start: '08:00', hours: 1, type: 'falta' }, { id: 'y', date: '2026-11-03', subject: 'DAW', hours: 1, type: 'falta' }]);
assert.deepStrictEqual(n.faltas.map((f) => f.start), ['08:00', '09:00']);
// sin fecha: se parte en unidades de 1 h sin hora
n = C.normalize(cfg, [{ id: 'z', date: null, term: '1r', subject: 'DAW', hours: 3, type: 'falta' }]);
assert.deepStrictEqual(n.faltas.map((f) => f.hours), [1, 1, 1]);
// retrasos: una unidad de 0 h
n = C.normalize(cfg, [{ id: 'r', date: '2026-11-03', subject: 'DAW', hours: 0, type: 'retraso' }]);
assert.strictEqual(n.faltas.length, 1); assert.strictEqual(n.faltas[0].hours, 0);
// ids duplicados (importaciones repetidas) se arreglan
n = C.normalize(cfg, [{ id: 'i0', date: '2026-11-03', subject: 'DAW', start: '08:00', hours: 1 }, { id: 'i0', date: '2026-11-10', subject: 'DAW', start: '08:00', hours: 1 }]);
assert.strictEqual(new Set(n.faltas.map((f) => f.id)).size, 2);
// el total no cambia al partir
const sumAbs = (c, f) => C.summary(st(c, f), '1r').find((x) => x.name === 'DAW').absent;
assert.strictEqual(sumAbs(cfg, [{ id: 'a', date: '2026-11-03', subject: 'DAW', hours: 2, type: 'falta' }]), 2);
assert.strictEqual(sumAbs(n.cfg, C.normalize(cfg, [{ id: 'a', date: '2026-11-03', subject: 'DAW', hours: 2, type: 'falta' }]).faltas), 2);

// ids de asignatura: renombrar no pierde las faltas
n = C.normalize(cfg, [{ id: 'a', date: '2026-11-03', subject: 'DAW', start: '08:00', hours: 1 }]);
const sid = n.cfg.subjects.find((m) => m.name === 'DAW').id; assert.strictEqual(n.faltas[0].sid, sid);
const ren = C.renameSubjects(n.cfg, { DAW: 'Desplegament' });
const n2 = C.normalize(ren, n.faltas);
assert.strictEqual(n2.faltas[0].subject, 'Desplegament', 'la falta sigue a su asignatura');
assert.strictEqual(n2.cfg.subjects.find((m) => m.id === sid).name, 'Desplegament', 'mismo id');
assert.strictEqual(n2.cfg.totals['1r'].Desplegament, 30, 'las horas fijadas también se renombran');
// quitar una asignatura del horario no borra sus faltas: quedan como huérfanas
const sinDaw = Object.assign({}, n.cfg, { schedule: { 2: [cfg.schedule[2][1]] } });
const n3 = C.normalize(sinDaw, n.faltas);
assert.strictEqual(n3.faltas.length, 1);
assert.strictEqual(C.orphans(st(n3.cfg, n3.faltas)).length, 1);

// horas totales: las fijadas mandan y el resto se calcula (antes, PROJ desaparecía del resumen)
const sum = C.summary(st(cfg, []), '1r');
assert.strictEqual(sum.find((x) => x.name === 'DAW').total, 30);
assert.ok(sum.find((x) => x.name === 'PROJ').total > 0, 'PROJ sigue saliendo, calculada');
// pruneTotals solo quita lo que ya no existe
const pr = C.pruneTotals(Object.assign({}, cfg, { totals: { '1r': { DAW: 30, Viejo: 10 }, 'zz': { DAW: 1 } } }));
assert.deepStrictEqual(pr.totals, { '1r': { DAW: 30 } });

// ida y vuelta: ids, hora de cada unidad y registro de asignaturas se conservan
n = C.normalize(cfg, [{ id: 'a', date: '2026-11-03', subject: 'DAW', hours: 2, type: 'falta' }]);
const r = SU.parseImport(SU.toExport(st(n.cfg, n.faltas)));
assert.ok(r.ok, JSON.stringify(r.errors));
assert.deepStrictEqual(r.faltas.map((f) => [f.id, f.start]), n.faltas.map((f) => [f.id, f.start]));
assert.deepStrictEqual(r.config.subjects, n.cfg.subjects);
console.log('unidades OK');
