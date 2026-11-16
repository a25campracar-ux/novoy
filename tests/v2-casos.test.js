// Tarea 1.11 y 1.5 · casos que hacen variar las horas de una asignatura durante el curso.
// En todos, el margen nunca puede salir mayor que si no se tuviera en cuenta el caso (lado estricto).
const assert = require('assert');
const C = require('../site/core.js');
const F = require('./fixtures/hoy-estado.js');
const B = (start, end, subject, hours, cuenta) => Object.assign({ start, end, subject, hours }, cuenta ? { cuenta } : {});
const st = (u) => Object.assign({}, u.config, { settings: Object.assign({}, C.DEF, u.settings), faltas: u.faltas || [] });
const fila = (S, term, name) => C.summary(C.scope(S), term).find((x) => x.name === name);
const base = F.estado(), S0 = st(base);

// ---------- 1 · módulo que empieza en el 2º trimestre ----------
{
  const u = F.estado(); u.config.vigencia = { Sistemes: { desde: '2027-01-08' } };
  const S = st(u);
  assert.strictEqual(fila(S, '1r', 'Sistemes'), undefined, '1r: Sistemes no existe todavía (antes daba 7 h de margen falso)');
  assert.ok(fila(S0, '1r', 'Sistemes').limit > 0, 'sin el caso, sí salía');
  assert.strictEqual(fila(S, '2n', 'Sistemes').total, fila(S0, '2n', 'Sistemes').total, '2n: sus horas de siempre');
  assert.deepStrictEqual(C.dayClasses(S, '2026-11-20').map((c) => c.subject), ['Programació'], 'un viernes de noviembre no hay Sistemes');
  // con otra que da esas horas mientras tanto
  u.config.vigencia.Sistemes = { desde: '2026-12-01', antes: 'Programació' };
  const S2 = st(u);
  assert.deepStrictEqual(C.dayClasses(S2, '2026-11-20').map((c) => [c.subject, c.start]), [['Programació', '15:00'], ['Programació', '17:00']], 'esas horas son de Programació para Hoy');
  assert.strictEqual(fila(S2, '1r', 'Programació').total, fila(S0, '1r', 'Programació').total, 'pero no le suman horas al total de Programació');
  assert.ok(fila(S2, '1r', 'Sistemes').total < fila(S0, '1r', 'Sistemes').total, 'Sistemes: solo sus horas desde el 1/12');
  assert.strictEqual(fila(S2, '1r', 'Sistemes').total, 6, '3 viernes × 2 h');
  u.faltas = [{ id: 'a', date: '2026-11-20', start: '17:00', subject: 'Programació', hours: 1, type: 'falta', justified: false }];
  assert.strictEqual(fila(st(u), '1r', 'Programació').absent, 1, 'una falta en esas horas cuenta en Programació');
}

// ---------- 2 · semana de proyecto con su propio horario ----------
{
  const u = F.estado(), todo = (sch, x) => Object.fromEntries(Object.keys(sch).map((d) => [d, sch[d].map((b) => Object.assign({}, b, { subject: x }))]));
  u.config.periods = [{ from: '2026-11-23', to: '2026-11-27', schedule: todo(u.config.schedule, 'Projecte') }];
  const S = st(u);
  assert.ok(fila(S, '1r', 'Projecte').total > 0, 'el proyecto tiene sus horas');
  ['Programació', 'Bases de dades', 'Llenguatges de marques', 'Entorns', 'Sistemes'].forEach((n) => {
    assert.ok(fila(S, '1r', n).total < fila(S0, '1r', n).total, n + ': esa semana no hay clase normal');
    assert.ok(fila(S, '1r', n).margin <= fila(S0, '1r', n).margin, n + ': margen nunca de más');
  });
  assert.ok(C.dayClasses(S, '2026-11-24').every((c) => c.subject === 'Projecte'), 'ese martes todo es proyecto');
}

// ---------- 3 · curso que acaba en marzo por la estancia en empresa ----------
{
  const u = F.estado({ settings: { ambito: 'curso' } }), fin = '2027-03-05';
  u.config.vigencia = {}; ['Programació', 'Bases de dades', 'Llenguatges de marques', 'Entorns', 'Sistemes'].forEach((n) => { u.config.vigencia[n] = { hasta: fin }; });
  const S = st(u), Sb = st(F.estado({ settings: { ambito: 'curso' } }));
  ['Programació', 'Bases de dades', 'Sistemes'].forEach((n) => {
    assert.ok(fila(S, 'curso', n).total < fila(Sb, 'curso', n).total, n + ': menos horas en el curso');
    assert.ok(fila(S, 'curso', n).margin < fila(Sb, 'curso', n).margin, n + ': menos margen');
  });
  assert.deepStrictEqual(C.dayClasses(S, '2027-04-05'), [], 'en abril ya no hay clases');
}

// ---------- 4 · reparto de PROJ: cada clase cuenta dentro de un módulo ----------
{
  const u = F.estado();
  u.config.schedule = {
    1: [B('15:00', '17:00', 'PROJ', 2, 'E.CLI'), B('17:00', '19:00', 'E.CLI', 2)],          // PROJ (Álvaro) → E.CLI
    2: [B('15:00', '16:00', 'PROJ', 1, 'E.CLI'), B('16:00', '17:00', 'PROJ', 1, 'CTR'), B('17:00', '19:00', 'CTR', 2)], // PROJ (Pol) → 1 h E.CLI y 1 h CTR
    3: [B('15:00', '16:00', 'PROJ', 1, 'DAW'), B('16:00', '19:00', 'DAW', 3)]               // PROJ (Ermengol) → DAW
  };
  const S = st(u), R = Object.fromEntries(C.summary(S, '1r').map((x) => [x.name, x]));
  assert.strictEqual(R.PROJ, undefined, 'PROJ no sale como asignatura aparte');
  // lo mismo que pintar cada hora de PROJ directamente con su módulo
  const ren = F.estado(); ren.config.schedule = JSON.parse(JSON.stringify(u.config.schedule)); Object.values(ren.config.schedule).forEach((l) => l.forEach((b) => { if (b.cuenta) { b.subject = b.cuenta; delete b.cuenta; } }));
  const R0 = Object.fromEntries(C.summary(st(ren), '1r').map((x) => [x.name, x]));
  ['E.CLI', 'CTR', 'DAW'].forEach((n) => assert.strictEqual(R[n].total, R0[n].total, n + ': sus horas más las de PROJ que le tocan'));
  assert.ok(R['E.CLI'].total > R.CTR.total && R.DAW.total > R.CTR.total, 'E.CLI 5 h/semana, DAW 4, CTR 3');
  u.faltas = [
    { id: 'a', date: '2026-11-17', start: '16:00', subject: 'PROJ', hours: 1, type: 'falta', justified: false },
    { id: 'b', date: '2026-11-17', start: '15:00', subject: 'PROJ', hours: 1, type: 'falta', justified: false },
    { id: 'c', date: '2026-11-18', start: '15:00', subject: 'PROJ', hours: 1, type: 'retraso', justified: false }
  ];
  const R2 = Object.fromEntries(C.summary(st(u), '1r').map((x) => [x.name, x]));
  assert.strictEqual(R2.CTR.absent, 1, 'la hora de PROJ de las 16:00 del martes cuenta en CTR');
  assert.strictEqual(R2['E.CLI'].absent, 1, 'la de las 15:00, en E.CLI');
  assert.deepStrictEqual(C.countsByTerm(st(u), '1r').DAW, { hSin: 0, hJust: 0, lSin: 1, lJust: 0 }, 'el retraso de PROJ del miércoles, en DAW');
  assert.deepStrictEqual(C.dayClasses(S, '2026-11-17').map((c) => c.canon), ['E.CLI', 'CTR', 'CTR'], 'Hoy agrupa cada clase en su módulo');
}

// ---------- 5 · regla propia de una asignatura ----------
{
  const u = F.estado({ settings: { porAsignatura: { Sistemes: { limites: [{ pct: 10, sin: 1, just: 1 }] } } } });
  const r = fila(st(u), '1r', 'Sistemes'), g = fila(st(u), '1r', 'Programació');
  assert.strictEqual(r.limit, 2.8, 'Sistemes: 10 % de 28 h');
  assert.strictEqual(r.propia, true);
  assert.strictEqual(g.limit, 24.5, 'las demás, la regla general');
}

console.log('v2-casos: todo correcto');
