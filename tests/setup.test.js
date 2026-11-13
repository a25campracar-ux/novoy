const assert = require('assert'); const C = require('../site/core.js'), S = require('../site/setup.js');
const seed = require('../private/estado-camilo.json');
const st = Object.assign({}, seed.config, { settings: seed.settings, faltas: seed.faltas });
// ida y vuelta: exportar → pegar (con texto alrededor y vallas ```json) → mismo resumen
const exp = S.toExport(st), pasted = 'Claro, aquí tienes:\n```json\n' + exp + '\n```\n¿Algo más?';
const r = S.parseImport(pasted); assert.ok(r.ok, JSON.stringify(r.errors));
assert.strictEqual(r.faltas.length, st.faltas.length);
const st2 = Object.assign({}, r.config, { settings: { unificar: true }, faltas: r.faltas });
const a = C.summary(st, '1r').map((x) => x.name + x.absent).sort().join(), b = C.summary(st2, '1r').map((x) => x.name + x.absent).sort().join();
assert.strictEqual(a, b);
// totales calculados desde el horario cuando la IA no da totales
assert.ok(C.summary(st2, '1r').every((x) => x.total > 0));
// la plantilla del prompt es un JSON válido que la propia app acepta (salvo que es de ejemplo)
const ex = S.parseImport(S.FORMAT); assert.ok(ex.ok, JSON.stringify(ex.errors));
// errores que debe detectar
const bad = (mut) => { const o = JSON.parse(exp); mut(o); return S.parseImport(JSON.stringify(o)); };
assert.ok(!bad((o) => (o.horario.lunes[1].inicio = '08:30')).ok, 'solape');
assert.ok(!bad((o) => (o.trimestres[0].desde = '2026-02-30')).ok, 'fecha inexistente');
assert.ok(!bad((o) => (o.horario.lunes[0].fin = '07:00')).ok, 'fin antes de inicio');
assert.ok(!bad((o) => (o.horario.lunes[0].horas = 5)).ok, 'horas no caben');
assert.ok(!bad((o) => (o.limite = 250)).ok, 'límite');
assert.ok(!S.parseImport('hola').ok && !S.parseImport('{ "a": ').ok);
assert.ok(bad((o) => (o.faltas[0].asignatura = 'Inventada')).warnings.some((w) => /no está en el horario/.test(w)));
assert.ok(S.buildPrompt().includes('puedo-faltar/2') && S.buildUpdatePrompt(exp).includes('MIS DATOS'));
console.log('setup OK');

// --- tramos: horarios distintos por periodo del curso
const conTramos = JSON.parse(exp);
conTramos.formato = 'puedo-faltar/2';
conTramos.trimestres[0].horas_totales = [{ asignatura: conTramos.horario.lunes[0].asignatura, horas: 99 }];
conTramos.tramos = [{ nombre: 'Desde febrero', desde: conTramos.trimestres[0].hasta, hasta: conTramos.trimestres[0].hasta, horario: { lunes: [{ inicio: '08:00', fin: '13:00', asignatura: 'Proyecto', horas: 5 }] } }];
const rt = S.parseImport(JSON.stringify(conTramos));
assert.ok(rt.ok, 'tramos válidos: ' + rt.errors.join(' '));
assert.strictEqual(rt.config.periods.length, 1, 'un tramo');
assert.strictEqual(rt.config.periods[0].schedule[1][0].subject, 'Proyecto');
assert.ok(Object.keys(rt.config.totals).length === 1, 'horas totales por trimestre');
// tramos solapados y fechas al revés se rechazan
const solapa = JSON.parse(JSON.stringify(conTramos));
solapa.tramos.push(JSON.parse(JSON.stringify(solapa.tramos[0])));
assert.ok(!S.parseImport(JSON.stringify(solapa)).ok, 'tramos solapados');
const alreves = JSON.parse(JSON.stringify(conTramos));
alreves.tramos[0].desde = '2027-06-01'; alreves.tramos[0].hasta = '2027-01-01';
assert.ok(!S.parseImport(JSON.stringify(alreves)).ok, 'tramo al revés');
console.log('tramos OK');
