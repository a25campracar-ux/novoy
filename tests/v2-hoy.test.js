// v2 · pantalla Hoy sin DOM: semáforo, tarjetas, «Fui», «Falté», «Todo el día» y «Falté a…».
// Comprueba que no vuelven los fallos 4, 5, 9 y 15 de la v1.
const assert = require('assert');
const Hd = require('../site/v2/hoy.js');
const F = require('./fixtures/hoy-estado.js');
const LUNES = '2026-11-16';
const nuevo = (o) => Hd.ordenar(F.estado(o), LUNES);
const g = (d, name) => d.grupos.find((x) => x.name === name);
const K = { prog1: 'Programació|15:00', prog2: 'Programació|16:00', bd: 'Bases de dades|17:00', lm: 'Llenguatges de marques|18:20' };

// ---------- el día tal cual ----------
let u = nuevo(), d = Hd.dia(u, LUNES);
assert.strictEqual(d.libre, false);
assert.deepStrictEqual(d.grupos.map((x) => x.name), ['Programació', 'Bases de dades', 'Llenguatges de marques'], 'una tarjeta por asignatura, en orden');
assert.strictEqual(g(d, 'Programació').hPend, 2, 'Programació: 2 h hoy');
assert.strictEqual(g(d, 'Programació').si.queda, 22.5, 'si faltas: te quedan 24,5 − 2');
assert.strictEqual(g(d, 'Programació').si.pct, 2, '% después: 2 de 98 h');
assert.strictEqual(g(d, 'Programació').ahora.queda, 24.5, 'ahora: todo el margen');
assert.strictEqual(d.semaforo.titulo, 'Puedes faltar.');
assert.strictEqual(d.trimestre, '1r trimestre');
assert.ok(!d.grupos.some((x) => /tutor/i.test(x.name)), 'la tutoría no sale (no cuenta)');
assert.deepStrictEqual(d.pendientes, [K.prog1, K.prog2, K.bd, K.lm]);

// ---------- «Fui»: enseña lo que tienes ahora, no lo que pasaría ----------
let r = Hd.fijar(u, LUNES, { [K.bd]: 'fui' });
assert.ok(!r.error); assert.strictEqual(r.fui, 1);
assert.strictEqual(u.fui, undefined, 'no toca el estado de entrada');
d = Hd.dia(r.user, LUNES);
assert.strictEqual(g(d, 'Bases de dades').estado, 'fui');
assert.strictEqual(g(d, 'Bases de dades').si, undefined, 'ya no hay «si faltas»');
assert.strictEqual(g(d, 'Bases de dades').ahora.queda, 13.5, 'margen de ahora: 25 % de 54 h');
assert.strictEqual(g(d, 'Bases de dades').ahora.pct, 0);
assert.deepStrictEqual(r.user.fui[LUNES], [K.bd]);
assert.strictEqual(r.user.faltas.length, 0, '«Fui» no crea faltas');

// ---------- «Falté» a una hora de una asignatura de 2 h: parcial ----------
r = Hd.fijar(r.user, LUNES, { [K.prog1]: 'falta' });
d = Hd.dia(r.user, LUNES);
const pg = g(d, 'Programació');
assert.strictEqual(pg.estado, 'parcial');
assert.strictEqual(pg.hPend, 1, 'queda 1 h por apuntar');
assert.strictEqual(pg.ahora.queda, 23.5, 'ahora ya cuenta la hora apuntada');
assert.strictEqual(pg.si.queda, 22.5, 'si faltas a la otra hora: 23,5 − 1 (sin contar dos veces la primera)');
const f0 = r.user.faltas[0];
assert.deepStrictEqual([f0.date, f0.subject, f0.start, f0.hours, f0.type, f0.term], [LUNES, 'Programació', '15:00', 1, 'falta', '1r']);

// ---------- fallo 4: el semáforo no cuenta dos veces lo apuntado hoy ----------
u = nuevo({ faltas: F.previas('Llenguatges de marques', 8) }); // 10,5 h de límite: si faltas, quedan 1,5 h
d = Hd.dia(u, LUNES);
assert.strictEqual(d.semaforo.status, 'amarillo');
assert.strictEqual(d.semaforo.peor.name, 'Llenguatges de marques');
r = Hd.fijar(u, LUNES, { [K.lm]: 'falta' });
d = Hd.dia(r.user, LUNES);
assert.strictEqual(g(d, 'Llenguatges de marques').ahora.queda, 1.5, 'tras apuntarla: 1,5 h, no 0,5');
assert.strictEqual(d.semaforo.status, 'verde', 'lo apuntado ya no pesa en el semáforo de lo que queda');
r = Hd.todoElDia(r.user, LUNES);
d = Hd.dia(r.user, LUNES);
assert.strictEqual(d.semaforo.hecho, true);
assert.strictEqual(d.semaforo.titulo, 'Hoy ya está apuntado.');
assert.strictEqual(d.semaforo.frase, 'Has faltado a 4 h hoy.');
assert.strictEqual(r.user.faltas.filter((f) => f.date === LUNES).length, 4, 'todo el día: 4 h, cada una con su hora');
assert.strictEqual(Hd.todoElDia(r.user, LUNES).faltas, 0, 'repetir «todo el día» no suma nada');

// ---------- fallo 9: pasado del límite dice cuánto, nunca «0 h» ----------
u = nuevo({ faltas: F.previas('Llenguatges de marques', 12) });
d = Hd.dia(u, LUNES);
assert.strictEqual(g(d, 'Llenguatges de marques').ahora.queda, -1.5, 'ahora: te has pasado 1,5 h');
assert.strictEqual(g(d, 'Llenguatges de marques').si.queda, -2.5);
assert.strictEqual(d.semaforo.titulo, 'Hoy no.');
assert.strictEqual(d.semaforo.frase, 'Si faltas, te pasas 2,5 h en Llenguatges de marques.');

// ---------- fallo 15: nombra la más justa, no la primera ----------
u = nuevo({ faltas: F.previas('Bases de dades', 10.5).concat(F.previas('Llenguatges de marques', 8)) });
d = Hd.dia(u, LUNES);
assert.strictEqual(g(d, 'Bases de dades').si.queda, 2, 'Bases de dades: ámbar con 2 h');
assert.strictEqual(g(d, 'Llenguatges de marques').si.queda, 1.5, 'Llenguatges: ámbar con 1,5 h');
assert.strictEqual(d.semaforo.peor.name, 'Llenguatges de marques', 'la de menos margen, aunque vaya después');
assert.strictEqual(d.semaforo.frase, 'Si faltas, en Llenguatges de marques te quedarían 1,5 h.');

// ---------- dos límites: dos barras y «Solo con justificante» ----------
u = nuevo({ settings: { limites: [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }] }, faltas: F.previas('Llenguatges de marques', 4) });
d = Hd.dia(u, LUNES);
const lm = g(d, 'Llenguatges de marques');
assert.deepStrictEqual(lm.si.limites.map((l) => l.etiqueta), ['Sin justificante', 'Con justificante']);
assert.deepStrictEqual(lm.si.limites.map((l) => l.queda), [-0.8, 6.3], 'sin justificante te pasas; el otro límite no cambia');
assert.strictEqual(d.semaforo.soloJust, true);
assert.strictEqual(d.semaforo.titulo, 'Solo con justificante.');
assert.strictEqual(d.semaforo.status, 'amarillo');
assert.strictEqual(lm.conJust.limites[1].queda, 5.3, 'con justificante gasta del segundo límite');
r = Hd.fijar(u, LUNES, { [K.lm]: 'falta' }, { justificada: true });
assert.strictEqual(r.user.faltas.find((f) => f.date === LUNES).justified, true, '«Tengo justificante» se guarda');
assert.strictEqual(g(Hd.dia(r.user, LUNES), 'Llenguatges de marques').ahora.limites[1].queda, 5.3);
assert.strictEqual(g(Hd.dia(nuevo(), LUNES), 'Programació').si.limites[0].etiqueta, '', 'con un solo límite, sin etiqueta');

// ---------- fallo 5: solo clases que existen ese día ----------
u = nuevo();
assert.ok(Hd.fijar(u, '2026-12-08', { 'Bases de dades|15:00': 'falta' }).error, 'festivo: no deja');
assert.ok(Hd.fijar(u, '2026-12-28', { 'Bases de dades|15:00': 'falta' }).error, 'vacaciones: no deja');
assert.ok(Hd.fijar(u, '2026-09-07', { 'Programació|15:00': 'falta' }).error, 'antes del curso: no deja');
assert.ok(Hd.fijar(u, '2026-11-21', {}).error, 'sábado: no deja');
assert.ok(Hd.fijar(u, LUNES, { 'Sistemes|17:00': 'falta' }).error, 'clase que no es de ese día: no deja');
assert.ok(Hd.todoElDia(u, '2026-12-08').error);
assert.deepStrictEqual(Hd.clases(u, '2026-12-08'), [], '«Falté a…» de un festivo: sin clases');

// ---------- retraso, sustituir y quitar ----------
r = Hd.fijar(u, LUNES, { [K.bd]: 'retraso' });
let f = r.user.faltas[0];
assert.deepStrictEqual([f.type, f.hours, f.start], ['retraso', 0, '17:00']);
assert.strictEqual(g(Hd.dia(r.user, LUNES), 'Bases de dades').estado, 'retraso');
r = Hd.fijar(r.user, LUNES, { [K.bd]: 'falta' });
assert.strictEqual(r.user.faltas.length, 1, 'una hora tiene una sola marca: la falta sustituye al retraso');
r = Hd.fijar(r.user, LUNES, { [K.bd]: 'fui' });
assert.strictEqual(r.user.faltas.length, 0, '«Fui» quita la falta de esa hora');
r = Hd.fijar(r.user, LUNES, { [K.bd]: null });
assert.strictEqual(r.user.fui[LUNES], undefined, 'quitar deja la hora sin apuntar');
assert.strictEqual(g(Hd.dia(r.user, LUNES), 'Bases de dades').estado, 'pendiente');

// ---------- una falta importada con fecha pero sin hora ocupa su hora ----------
u = nuevo({ faltas: [{ id: 'i1', date: LUNES, subject: 'Programació', hours: 2, type: 'falta', justified: false, note: 'importada' }] });
d = Hd.dia(u, LUNES);
assert.strictEqual(g(d, 'Programació').estado, 'falta', 'las 2 h importadas cubren las dos horas');
assert.strictEqual(d.semaforo.peor.name !== 'Programació', true);

// ---------- «Falté a…»: bloques de clase con sus horas ----------
const cl = Hd.clases(nuevo(), LUNES);
assert.deepStrictEqual(cl.map((c) => [c.name, c.hours, c.horas.length]), [['Programació', 2, 2], ['Bases de dades', 1, 1], ['Llenguatges de marques', 1, 1]]);
assert.deepStrictEqual(cl[0].horas.map((h) => h.key), [K.prog1, K.prog2]);

// ---------- días sin apuntar y días para elegir ----------
u = nuevo({ since: '2026-11-09' });
assert.deepStrictEqual(Hd.sinApuntar(u, LUNES), ['2026-11-13', '2026-11-12', '2026-11-11', '2026-11-10', '2026-11-09']);
r = Hd.fuiATodo(u, '2026-11-13');
assert.deepStrictEqual(Hd.sinApuntar(r.user, LUNES)[0], '2026-11-12', '«Sí, a todo» lo quita de la lista');
assert.deepStrictEqual(Hd.sinApuntar(nuevo({ since: LUNES }), LUNES), [], 'antes del alta no se pregunta');
assert.deepStrictEqual(Hd.diasRecientes(nuevo(), '2026-12-09', 3), ['2026-12-09', '2026-12-07', '2026-12-04'], 'sin el festivo ni el fin de semana');

// ---------- día libre: motivo y el siguiente día de clase ----------
d = Hd.dia(nuevo(), '2026-12-08');
assert.strictEqual(d.libre, true);
assert.strictEqual(d.motivo, 'Inmaculada.');
assert.strictEqual(d.proximo.date, '2026-12-09');
assert.strictEqual(Hd.dia(nuevo(), '2026-12-26').motivo, 'Vacaciones de Navidad.');
assert.strictEqual(Hd.dia(nuevo(), '2027-06-10').motivo, 'Hoy no es día de curso.');

// ---------- límite sobre el curso entero ----------
d = Hd.dia(nuevo({ settings: { ambito: 'curso' } }), LUNES);
assert.ok(g(d, 'Programació').ahora.limites[0].limite > 50, 'curso entero: el límite es de todo el curso');

// ---------- comprobado hace X días ----------
assert.strictEqual(Hd.dia(nuevo({ comprobado: '2026-11-13' }), LUNES).comprobado, 3);
assert.strictEqual(Hd.dia(nuevo(), LUNES).comprobado, null);

// ---------- marcas «fui» viejas se limpian ----------
u = F.estado(); u.fui = { '2026-01-01': ['x|15:00'], [LUNES]: [K.bd] };
Hd.ordenar(u, LUNES);
assert.deepStrictEqual(Object.keys(u.fui), [LUNES]);

// ---------- simulador (1.6) ----------
u = nuevo({ settings: { limites: [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }] }, faltas: F.previas('Llenguatges de marques', 4) });
assert.strictEqual(Hd.dia(u, LUNES).semaforo.titulo, 'Solo con justificante.');
d = Hd.dia(u, LUNES, { justificada: true });
assert.notStrictEqual(d.semaforo.status, 'rojo', 'con justificante ya no es rojo');
assert.strictEqual(g(d, 'Llenguatges de marques').si.limites[1].queda, 5.3, 'gasta del límite de justificadas');
assert.deepStrictEqual(Hd.diasSiguientes(nuevo(), '2026-12-07', 3), ['2026-12-07', '2026-12-09', '2026-12-10'], 'salta el festivo');
const uv = nuevo(); uv.config.vigencia = { Sistemes: { desde: '2027-01-08' } };
assert.deepStrictEqual(Hd.empiezanLuego(uv, LUNES), [{ name: 'Sistemes', desde: '2027-01-08' }]);
console.log('v2-hoy: todo correcto');
