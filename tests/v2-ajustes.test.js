// v2 · Ajustes y Faltas sin DOM: reparto de PROJ, fechas, semanas, regla propia, contar, reglas, enlace de clase,
// copia de la cuenta, y la lista de Faltas (justificar y borrar).
const assert = require('assert');
const C = require('../site/core.js'), A = require('../site/v2/ajustes.js'), L = require('../site/v2/lista.js'), Hd = require('../site/v2/hoy.js');
const F = require('./fixtures/hoy-estado.js');
const LUNES = '2026-11-16';

// ---------- 1.5 · «esta clase cuenta dentro de…», hora a hora ----------
let u = F.estado();
u.config.schedule['2'] = [{ start: '15:00', end: '17:00', subject: 'PROJ', hours: 2 }, { start: '17:00', end: '18:00', subject: 'Entorns', hours: 1 }];
let cfg = A.asignarCuenta(u.config, '2', '16:00', 'PROJ', 'Bases de dades');
assert.deepStrictEqual(cfg.schedule['2'].map((b) => [b.start, b.end, b.hours, b.cuenta || '']), [['15:00', '16:00', 1, ''], ['16:00', '17:00', 1, 'Bases de dades'], ['17:00', '18:00', 1, '']], 'parte el bloque de 2 h');
assert.ok(!u.config.schedule['2'][0].cuenta, 'no toca el de entrada');
cfg = A.asignarCuenta(cfg, '2', '15:00', 'PROJ', 'Bases de dades');
assert.deepStrictEqual(cfg.schedule['2'].map((b) => [b.start, b.end, b.hours, b.cuenta || '']), [['15:00', '17:00', 2, 'Bases de dades'], ['17:00', '18:00', 1, '']], 'y lo vuelve a unir si las dos horas van al mismo');
assert.deepStrictEqual(A.horasDe(cfg, 'PROJ').map((h) => h.cuenta), ['Bases de dades', 'Bases de dades']);
const back = A.asignarCuenta(cfg, '2', '15:00', 'PROJ', 'PROJ');
assert.deepStrictEqual(back.schedule['2'].map((b) => b.cuenta || ''), ['', 'Bases de dades', ''], 'volver a «aparte» quita solo esa hora');
// repintar el horario no pierde el reparto
const lista = A.cuentas(cfg);
const repintado = JSON.parse(JSON.stringify(u.config));
assert.deepStrictEqual(A.reponerCuentas(repintado, lista).schedule['2'], cfg.schedule['2'], 'se repone en el horario nuevo');

// ---------- 1.11 · fechas de una asignatura ----------
let r = A.ponerFechas(u.config, 'Sistemes', { desde: '2027-01-08', antes: 'Programació' });
assert.deepStrictEqual(r.cfg.vigencia.Sistemes, { desde: '2027-01-08', antes: 'Programació' });
assert.ok(A.ponerFechas(u.config, 'Sistemes', { desde: '2027-02-01', hasta: '2027-01-01' }).error, 'acaba antes de empezar');
assert.deepStrictEqual(A.ponerFechas(r.cfg, 'Sistemes', {}).cfg.vigencia, {}, 'sin fechas se quita');
assert.strictEqual(A.ponerFechas(u.config, 'Sistemes', { hasta: '2027-03-05', antes: 'Programació' }).cfg.vigencia.Sistemes.antes, undefined, '«antes» solo tiene sentido con fecha de inicio');

// ---------- 1.11 · semanas con otro horario ----------
r = A.ponerSemanas(u.config, { from: '2026-11-23', to: '2026-11-27', todo: 'Projecte' });
assert.ok(!r.error);
const S = Object.assign({}, r.cfg, { settings: C.DEF, faltas: [] });
assert.ok(C.dayClasses(S, '2026-11-25').every((c) => c.subject === 'Projecte'), 'esa semana todo es Projecte');
assert.strictEqual(C.dayClasses(S, '2026-11-25').length, 2, 'las clases seguidas se unen; el recreo se respeta');
assert.ok(A.ponerSemanas(r.cfg, { from: '2026-11-26', to: '2026-12-02', todo: 'X Y' }).error, 'no se cruzan');
assert.ok(A.ponerSemanas(u.config, { from: '2026-11-23', to: '2026-11-27', todo: '' }).error);
assert.deepStrictEqual(A.quitarSemanas(r.cfg, 0).periods, []);

// ---------- 1.11 · regla propia ----------
let s2 = A.reglaPropia(u.settings, 'Sistemes', [{ pct: 10, sin: 1, just: 1 }]);
assert.deepStrictEqual(s2.porAsignatura, { Sistemes: { limites: [{ pct: 10, sin: 1, just: 1 }] } });
assert.strictEqual(A.reglaPropia(s2, 'Sistemes', null).porAsignatura, undefined);

// ---------- contar o no una asignatura ----------
const c2 = A.contar(u.config, 'Entorns', false);
assert.deepStrictEqual(c2.nocount, ['Entorns']);
assert.deepStrictEqual(A.contar(c2, 'Entorns', true).nocount, []);

// ---------- reglas: de settings a respuestas ----------
assert.deepStrictEqual(A.respuestasDe({ limites: [{ pct: 25, sin: 1, just: 1 }], ambito: 'trimestre', retrasosPorFalta: 3 }), { ambito: 'trimestre', retrasos: '3', tipo: 'todas', pct: 25, cuenta: 'todas' });
assert.strictEqual(A.respuestasDe({ limites: [{ pct: 20, sin: 1, just: 0 }] }).tipo, 'sin');
assert.deepStrictEqual(A.respuestasDe({ limites: [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }] }).segundo, 'aparte');
assert.strictEqual(A.respuestasDe({ limites: [{ pct: 25, sin: 1, just: 0.5 }] }).tipo, 'mitad');
assert.strictEqual(A.respuestasDe({ limites: [{ pct: 15, sin: 1, just: 1 }], aproximado: ['nose'] }).tipo, 'nose');
assert.strictEqual(A.respuestasDe({ respuestas: { tipo: 'sin', pct: 12 } }).pct, 12, 'si el alta guardó las respuestas, se usan');
assert.strictEqual(A.respuestasDe({ limites: [{ pct: 25, sin: 1, just: 1 }], ambito: 'curso', ambitoElegido: 'ra' }).ambito, 'ra');

// ---------- 1.7 · enlace de clase ----------
const cat = { centre: { id: 'ped', name: 'Institut Pedralbes', city: 'Barcelona', code: '08013275' }, cycle: { code: 'ICC0', name: 'DAW · Desenvolupament' }, turno: 'tarde' };
const url = A.enlaceClase(Object.assign({}, u.config, { catalog: cat }), 'https://novoy.example');
assert.ok(/^https:\/\/novoy\.example\/alta\.html\?unirse=[A-Za-z0-9_-]+$/.test(url), url);
const j = A.leerEnlace(url.split('unirse=')[1]);
assert.deepStrictEqual(j, { centro: { name: 'Institut Pedralbes', city: 'Barcelona', id: 'ped', code: '08013275' }, ciclo: { name: 'DAW · Desenvolupament', code: 'ICC0' }, turno: 'tarde' });
assert.ok(!/faltas|schedule|Programació/.test(Buffer.from(url.split('unirse=')[1], 'base64').toString()), 'el enlace no lleva ni faltas ni horario');
assert.strictEqual(A.leerEnlace('basura'), null);
assert.strictEqual(A.enlaceClase(Object.assign({}, u.config, { catalog: { centre: { name: 'X' } } }), 'x'), null, 'sin ciclo ni turno, no hay enlace');

// ---------- 1.8 · copia de la cuenta ----------
const conCuenta = Object.assign(F.estado(), { acct: { u: 'KiwiMango12', id: 'x', auth: 'y', k: 'z' }, fui: { [LUNES]: ['a|15:00'] } });
const txt = A.paraCuenta(conCuenta);
assert.ok(!/KiwiMango12/.test(txt), 'la sesión no se guarda dentro de la copia');
const vuelta = A.deCuenta(txt);
assert.deepStrictEqual(vuelta.fui, conCuenta.fui, 'vuelve todo (también lo de «Fui»)');
assert.strictEqual(A.deCuenta('{"formato":"puedo-faltar/2"}'), null, 'formato de la v1: lo lee la v1');

// ---------- 1.3 · lista de Faltas ----------
u = Hd.ordenar(F.estado({ faltas: F.previas('Bases de dades', 3) }), LUNES);
u = Hd.fijar(u, '2026-11-09', { 'Programació|15:00': 'falta', 'Programació|16:00': 'falta', 'Bases de dades|17:00': 'retraso' }).user;
u = Hd.fijar(u, '2026-11-11', { 'Programació|15:00': 'falta' }, { justificada: true }).user;
const P = L.periodos(u, LUNES);
assert.strictEqual(P.actual, '1r'); assert.deepStrictEqual(P.lista.map((x) => x.id), ['1r', '2n', '3r']);
let G = L.asignaturas(u, '1r', LUNES);
const prog = G.find((x) => x.name === 'Programació'), bd = G.find((x) => x.name === 'Bases de dades');
assert.deepStrictEqual(prog.filas.map((x) => [x.date, x.horas, x.todas]), [['2026-11-11', 1, true], ['2026-11-09', 2, false]], 'una fila por día, la más reciente arriba');
assert.deepStrictEqual(prog.filas[1].inicio, ['15:00', '16:00']);
assert.deepStrictEqual(bd.filas.map((x) => [x.date, x.horas, x.retrasos]), [['2026-11-09', 0, 1], ['', 3, 0]], 'las de antes, al final');
assert.strictEqual(prog.queda, 21.5, '24,5 − 3');
assert.ok(G.indexOf(bd) < G.indexOf(prog) || bd.queda >= prog.queda, 'la más justa primero');
// justificar: 3 toques (pestaña, asignatura, «Justificar») = una llamada
u = L.justificar(u, prog.filas[1].ids, true);
G = L.asignaturas(u, '1r', LUNES);
assert.strictEqual(G.find((x) => x.name === 'Programació').filas[1].todas, true);
u = L.borrar(u, G.find((x) => x.name === 'Programació').filas[0].ids);
assert.strictEqual(L.asignaturas(u, '1r', LUNES).find((x) => x.name === 'Programació').queda, 22.5, 'borrar devuelve el margen');
// curso entero
const uc = Hd.ordenar(F.estado({ settings: { ambito: 'curso' }, faltas: F.previas('Bases de dades', 3) }), LUNES);
assert.deepStrictEqual(L.periodos(uc, LUNES).lista.map((x) => x.label), ['Todo el curso']);
assert.strictEqual(L.asignaturas(uc, 'curso', LUNES).find((x) => x.name === 'Bases de dades').filas[0].horas, 3);
// faltas de una asignatura que ya no está en el horario: siguen saliendo
const uo = Hd.ordenar(F.estado({ faltas: F.previas('Química', 2) }), LUNES);
assert.ok(L.asignaturas(uo, '1r', LUNES).some((x) => x.name === 'Química' && x.sinHoras));
// ---------- fallo 7: abrir el horario y guardarlo sin tocar no lo cambia ----------
const H = require('../site/v2/horario.js');
const ida = (sch) => { const h = H.deHorario(sch); return H.aHorario(h.rows, h.grid); };
assert.deepStrictEqual(ida(F.estado().config.schedule), F.estado().config.schedule, 'días con y sin recreo');
const s55 = { 1: [{ start: '08:00', end: '09:50', subject: 'A', hours: 2 }, { start: '10:20', end: '11:15', subject: 'B', hours: 1 }], 3: [{ start: '08:55', end: '09:50', subject: 'B', hours: 1 }] };
assert.deepStrictEqual(ida(s55), s55, 'clases de 55 min');
const mix = { 1: [{ start: '15:00', end: '17:00', subject: 'A', hours: 2 }], 2: [{ start: '15:30', end: '16:30', subject: 'B', hours: 1 }, { start: '16:30', end: '18:30', subject: 'A', hours: 2 }] };
assert.deepStrictEqual(ida(mix), mix, 'días que empiezan a horas distintas');
// ---------- cambiar el nombre de una asignatura en todo lo guardado ----------
{
  let x = F.estado({ faltas: F.previas('Bases de dades', 2), settings: { porAsignatura: { 'Bases de dades': { limites: [{ pct: 10, sin: 1, just: 1 }] } } } });
  x.config.nocount = ['Bases de dades']; x.config.vigencia = { Sistemes: { desde: '2027-01-08', antes: 'Bases de dades' } };
  x.config.schedule['2'][1].cuenta = 'Bases de dades'; x.fui = { '2026-11-17': ['Bases de dades|15:00'] };
  x.config.history = [{ from: null, to: '2026-11-01', schedule: { 1: [{ start: '15:00', end: '16:00', subject: 'Bases de dades', hours: 1 }] } }];
  const y = A.renombrar(x, { 'Bases de dades': 'BD' });
  assert.ok(!JSON.stringify(y).replace(/"id":"[^"]*"/g, '').includes('Bases de dades'), 'ya no queda el nombre viejo en ningún sitio');
  assert.strictEqual(y.faltas[0].subject, 'BD'); assert.deepStrictEqual(y.fui['2026-11-17'], ['BD|15:00']);
  assert.strictEqual(y.config.vigencia.Sistemes.antes, 'BD'); assert.ok(y.settings.porAsignatura.BD);
  assert.ok(JSON.stringify(x).includes('Bases de dades'), 'no toca el de entrada');
  assert.strictEqual(A.renombrar(x, {}), x);
  // con el registro del motor (ids de asignatura), al volver a abrir la app la falta no vuelve al nombre viejo
  const Hd2 = require('../site/v2/hoy.js');
  const z = Hd2.ordenar(F.estado({ faltas: [{ id: 'q', date: '2026-11-09', start: '17:00', subject: 'Bases de dades', hours: 1, type: 'falta', justified: false }] }), '2026-11-16');
  const z2 = Hd2.ordenar(A.renombrar(z, { 'Bases de dades': 'BD' }), '2026-11-16');
  assert.strictEqual(z2.faltas[0].subject, 'BD');
}
console.log('v2-ajustes: todo correcto');
