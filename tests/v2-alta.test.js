// v2 · lógica del alta sin DOM: reglas, horario, calendario y estado final (y que el motor lo entienda).
const assert = require('assert');
const R = require('../site/v2/reglas.js'), H = require('../site/v2/horario.js');
const K = require('../site/v2/calendario.js'), E = require('../site/v2/estado.js'), C = require('../site/core.js');

// ---------- reglas: cada rama de la pantalla 2 ----------
assert.deepStrictEqual(R.aSettings({ tipo: 'todas' }).limites, [{ pct: 25, sin: 1, just: 1 }], 'todas: 25 % ya preparado');
assert.deepStrictEqual(R.aSettings({ tipo: 'sin' }).limites, [{ pct: 20, sin: 1, just: 0 }], 'sin: «solo sin justificante» ya marcado');
assert.deepStrictEqual(R.aSettings({ tipo: 'todas', cuenta: 'sin', pct: 15 }).limites, [{ pct: 15, sin: 1, just: 0 }], 'se puede corregir en 2a');
assert.deepStrictEqual(R.aSettings({ tipo: 'dos' }).limites, [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }], 'dos: aparte');
assert.deepStrictEqual(R.aSettings({ tipo: 'dos', segundo: 'todas' }).limites, [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 1, just: 1 }], 'dos: de todas juntas');
const nose = R.aSettings({ tipo: 'nose' });
assert.deepStrictEqual(nose.limites, [{ pct: 15, sin: 1, just: 1 }], 'no lo sé: 15 % de todas');
assert.deepStrictEqual(nose.aproximado, ['nose']);
assert.deepStrictEqual(R.aSettings({ tipo: 'todas', ambito: 'ra' }).aproximado, ['ra'], 'por RA: aproximado');
assert.strictEqual(R.aSettings({ tipo: 'todas', retrasos: '3' }).retrasosPorFalta, 3);
assert.ok(R.aSettings({ tipo: 'todas', pct: 0 }).error, 'porcentaje inválido');
assert.ok(R.aSettings({ tipo: 'dos', pctSin: 10, pctJust: '' }).error);
assert.strictEqual(R.aSettings({ tipo: 'todas', pct: '12,5' }).limites[0].pct, 12.5, 'acepta coma');
// frases
const fr = (a) => R.resumen(R.aSettings(a)).principal;
assert.strictEqual(fr({ tipo: 'dos', retrasos: '3' }), 'Puedes faltar el 10 % sin justificante y otro 15 % con justificante, en cada módulo y cada trimestre.');
assert.strictEqual(fr({ tipo: 'todas', ambito: 'curso' }), 'Puedes faltar el 25 % de las clases, con o sin justificante, en cada módulo, sobre todo el curso.');
assert.strictEqual(fr({ tipo: 'sin' }), 'Puedes faltar el 20 % de las clases sin justificante, en cada módulo y cada trimestre.');
assert.strictEqual(R.resumen(R.aSettings({ tipo: 'sin' })).nota, 'Las justificadas no cuentan.');
assert.strictEqual(R.resumen(R.aSettings({ tipo: 'todas' })).nota, '');
assert.strictEqual(fr({ tipo: 'dos', segundo: 'todas' }), 'Puedes faltar el 10 % sin justificante, y el 15 % contando todas, en cada módulo y cada trimestre.');
assert.strictEqual(R.resumen(R.aSettings({ tipo: 'dos', retrasos: '3' })).retrasos, '3 retrasos cuentan como 1 falta.');
assert.deepStrictEqual(R.ejemplo(R.aSettings({ tipo: 'dos' }).limites, 66), [{ etiqueta: 'Sin justificante, hasta', horas: 6.6 }, { etiqueta: 'Con justificante, hasta', horas: 9.9 }]);
// ida y vuelta
['todas', 'sin', 'dos', 'nose'].forEach((t) => {
  const s = R.aSettings({ tipo: t, ambito: 'curso', retrasos: '2' }), back = R.aRespuestas(s);
  assert.deepStrictEqual(R.aSettings(back).limites, s.limites, 'ida y vuelta ' + t);
  assert.strictEqual(back.ambito, 'curso'); assert.strictEqual(back.retrasos, '2');
});

// ---------- horario ----------
const rows = H.franjas('15:00', 55, 6, { tras: 3, dur: 20 });
assert.deepStrictEqual(rows.map((r) => r.start + '-' + r.end), ['15:00-15:55', '15:55-16:50', '16:50-17:45', '18:05-19:00', '19:00-19:55', '19:55-20:50'], 'recreo tras la 3ª');
const grid = H.vacia();
grid[1] = { 0: 'Programació', 1: 'Programació', 2: 'Programació', 3: 'Programació', 4: 'FOL' };
grid[3] = { 0: 'Bases de dades', 2: 'Bases de dades' };
const sch = H.aHorario(rows, grid);
assert.deepStrictEqual(sch[1].map((b) => [b.start, b.end, b.subject, b.hours]),
  [['15:00', '17:45', 'Programació', 3], ['18:05', '19:00', 'Programació', 1], ['19:00', '19:55', 'FOL', 1]], 'no une a través del recreo; 55 min = 1 sesión');
assert.deepStrictEqual(sch[3].map((b) => b.hours), [1, 1], 'no une franjas separadas');
assert.deepStrictEqual(H.horasSemana(sch), { 'Programació': 4, FOL: 1, 'Bases de dades': 2 });
// ida y vuelta horario ↔ rejilla
const back = H.deHorario(sch);
assert.deepStrictEqual(H.aHorario(back.rows, back.grid), sch, 'deHorario ∘ aHorario');
assert.deepStrictEqual(H.asignaturas(grid), ['Programació', 'FOL', 'Bases de dades']);
assert.strictEqual(H.huella(sch), H.huella(JSON.parse(JSON.stringify(sch))));
assert.deepStrictEqual(Object.keys(H.sinAsignaturas(sch, ['Bases de dades'])), ['1'], 'quitar módulos');
assert.deepStrictEqual(H.franjas('8:00', 10, 3), [], 'duración absurda');

// ---------- calendario ----------
assert.strictEqual(K.aISO('2026-10-12T00:00:00.000'), '2026-10-12');
assert.strictEqual(K.aISO('24/9/2026'), '2026-09-24');
const filas = [
  { any: '2026', data: '2026-09-24T00:00:00.000', festa: 'La Mercè', ajuntament: 'Barcelona' },
  { any: '2027', data: '2027-05-17T00:00:00.000', festa: 'Segona Pasqua', ajuntament: 'Barcelona' },
  { any: '2026', data: '2026-06-24T00:00:00.000', festa: 'Fora del curs', ajuntament: 'Barcelona' },
  { any: '2026', data: '2026-09-29T00:00:00.000', festa: 'Sant Miquel', ajuntament: 'Badalona' },
  { any: '2026', data: '2026-09-24T00:00:00.000', festa: 'La Mercè', ajuntament: 'Barcelona' }
];
assert.deepStrictEqual(K.filtrarLocales(filas, 'Barcelona', '2026-09-08', '2027-06-21').map((f) => f.from + ' ' + f.label),
  ['2026-09-24 La Mercè', '2027-05-17 Segona Pasqua'], 'solo del municipio, dentro del curso y sin repetir');
assert.deepStrictEqual(K.filtrarLocales([{ m: "L'Hospitalet de Llobregat", d: '13/06/2027', n: 'Fiesta mayor' }], "l'hospitalet de llobregat").length, 1);
const tp = K.trimestresPropuestos('2026-09-14', '2027-05-26');
assert.deepStrictEqual(tp.map((t) => t.from + '/' + t.to), ['2026-09-14/2026-12-21', '2027-01-08/2027-03-19', '2027-03-30/2027-05-26']);
assert.strictEqual(K.errorTrimestres(tp), '');
assert.ok(K.errorTrimestres([{ label: '1r trimestre', from: '2026-12-01', to: '2026-11-01' }]));
assert.strictEqual(K.festivos(K.CURSO_2627, [{ from: '2026-09-24', label: 'La Mercè' }], ['2026-11-02', 'mal']).filter((f) => f.label === 'Libre disposición').length, 1);

// ---------- estado final ----------
const d = {
  centro: { id: 'pedralbes', name: 'Institut Pedralbes', city: 'Barcelona' }, ciclo: { code: 'ICC0', name: 'DAW' }, turno: 'tarde',
  horario: { rows, grid }, quitar: [],
  cal: { inicio: '2026-09-14', fin: '2027-05-26', locales: [{ from: '2026-09-24', to: '2026-09-24', label: 'La Mercè' }], libres: ['2026-11-02'] },
  reglas: { tipo: 'dos', retrasos: '3' }, previas: { 'Programació': { sin: 3, just: 1 }, FOL: { sin: 0 } }, hoy: '2026-11-16'
};
const st = E.construir(d);
assert.ok(!st.error, st.error);
assert.strictEqual(st.config.terms.length, 3);
assert.ok(st.config.holidays.some((h) => h.label === 'La Mercè') && st.config.holidays.some((h) => h.label === 'Libre disposición'));
assert.strictEqual(st.settings.justModo, 'separadas'); assert.strictEqual(st.settings.limiteJust, 15);
assert.strictEqual(st.settings.libresPendientes, undefined, 'puso sus días');
assert.deepStrictEqual(st.faltas.map((f) => [f.subject, f.hours, f.justified, f.term, f.note]), [['Programació', 3, false, '1r', 'previas'], ['Programació', 1, true, '1r', 'previas']]);
// el motor entiende el estado
const state = Object.assign({}, st.config, { settings: Object.assign({}, C.DEF, st.settings), faltas: st.faltas });
const prog = C.summary(state, '1r').find((x) => x.name === 'Programació');
assert.ok(prog.total > 0, 'total calculado desde horario + calendario');
assert.strictEqual(prog.limits.length, 2);
assert.deepStrictEqual(prog.limits.map((l) => l.used), [3, 1], 'previas: 3 sin justificar, 1 justificada');
assert.ok(C.verdict(state, '2026-11-16').items.length > 0, 'veredicto del lunes');
// errores claros
assert.ok(E.construir({}).error);
assert.ok(E.construir(Object.assign({}, d, { horario: { rows, grid: H.vacia() } })).error, 'horario vacío');
assert.strictEqual(E.construir(Object.assign({}, d, { cal: Object.assign({}, d.cal, { libres: [], libresLuego: true }) })).settings.libresPendientes, 4);
assert.strictEqual(E.construir(Object.assign({}, d, { reglas: { tipo: 'todas', ambito: 'ra' } })).settings.ambito, 'trimestre', 'RA se calcula por trimestre y queda marcado');
console.log('v2 alta OK');
