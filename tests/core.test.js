// Motor de cálculo con datos inventados (tests/fixtures). No necesita la carpeta private/.
const assert = require('assert'); const C = require('../site/core.js');
const seed = require('./fixtures/estado-ejemplo.json');
const state = Object.assign({}, seed.config, { settings: seed.settings, faltas: seed.faltas });
const row = (st, term, name) => C.summary(st, term).find((x) => x.name === name);
const withS = (extra) => Object.assign({}, state, { settings: Object.assign({}, state.settings, extra) });

// faltas por asignatura, con PROJ unificada en Programació y justificadas que cuentan igual
const S = Object.fromEntries(C.summary(state, '1r').map((x) => [x.name, x]));
assert.deepStrictEqual(Object.keys(S).sort(), ['Bases de dades', 'FOL', 'Llenguatges', 'Programació'], 'Tutoria no cuenta');
assert.strictEqual(S['Programació'].absent, 4, '2 sin justificar + 1 justificada + 1 de PROJ');
assert.strictEqual(S['Bases de dades'].absent, 2);
assert.strictEqual(S['FOL'].absent, 2, 'justificada que cuenta');
assert.strictEqual(S['Llenguatges'].absent, 0, 'retrasos sin regla no suman');
// totales del trimestre desde horario + calendario, escalados a 33 semanas
assert.strictEqual(S['Programació'].total, 52);
assert.strictEqual(S['Programació'].limit, 13);
assert.strictEqual(S['Programació'].margin, 9);
assert.strictEqual(S['Programació'].status, 'verde');

// sin unificar, PROJ va aparte
assert.strictEqual(row(withS({ unificar: false }), '1r', 'Programació').absent, 3);
assert.strictEqual(row(withS({ unificar: false }), '1r', 'PROJ').absent, 1);
// justificadas que no cuentan
assert.strictEqual(row(withS({ justModo: 'nocuentan' }), '1r', 'FOL').absent, 0);
assert.strictEqual(row(withS({ justModo: 'nocuentan' }), '1r', 'Programació').absent, 3);
// 3 retrasos = 1 falta
assert.strictEqual(row(withS({ retrasosPorFalta: 3 }), '1r', 'Llenguatges').absent, 1);

// veredicto del día
const v = C.verdict(state, '2026-11-16');
assert.deepStrictEqual(v.items.map((i) => i.name + i.hours), ['Programació2', 'Bases de dades1'], 'lunes: Tutoria no sale');
assert.strictEqual(v.status, 'verde');
assert.strictEqual(C.verdict(state, '2026-11-14').free, true, 'sábado');
assert.strictEqual(C.verdict(state, '2026-12-08').free, true, 'festivo');
console.log('core OK');
