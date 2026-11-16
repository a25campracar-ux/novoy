// v2 · lector de faltas: listas copiadas de plataformas reales, respuesta de IA y texto de captura.
const assert = require('assert');
const I = require('../site/v2/importar.js');

const curso = { inicio: '2026-09-08', fin: '2027-06-21' };
// horario: L y X Programació 15-17 (2 h) · M Bases de dades 15-17 · J Llenguatges de marques 15-16 · V FOL 15-17
const SCH = { 1: [['Programació', 900, 1020, 2]], 2: [['Bases de dades', 900, 1020, 2]], 3: [['Programació', 900, 1020, 2]], 4: [['Llenguatges de marques', 900, 960, 1]], 5: [['FOL', 900, 1020, 2]] };
const subs = ['Programació', 'Bases de dades', 'Llenguatges de marques', 'FOL'];
const wd = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const opts = {
  curso, hoy: '2026-11-16', subs,
  alias: (s) => ({ 'Programació': ['PROG', 'Programacion', 'Programming'], 'Bases de dades': ['BD', 'Bases de datos'], 'Llenguatges de marques': ['LMSGI', 'Lenguajes de marcas'], FOL: [] }[s] || []),
  horasDia: (d, s) => (SCH[wd(d)] || []).filter((b) => b[0] === s).reduce((a, b) => a + b[3], 0),
  bloquesDia: (d, s) => (SCH[wd(d)] || []).filter((b) => b[0] === s).map((b) => ({ a: b[1], b: b[2], hours: b[3] }))
};
const fmt = (r) => r.faltas.map((f) => [f.date, f.subject, f.hours, f.type, f.justified].join(' '));

// --- Moodle en castellano, copiado de la página de Asistencia de una asignatura
let r = I.leer(`Programació
Asistencia
Fecha	Descripción	Estado	Puntos	Observaciones
lun 21 sep 2026 15:00 - 17:00	Sesión regular de clase	Ausente	0 / 2
mié 23 sep 2026 15:00 - 17:00	Sesión regular de clase	Presente	2 / 2
lun 5 oct 2026 15:00 - 17:00	Sesión regular de clase	Justificada	1 / 2
mié 7 oct 2026 15:00 - 17:00	Sesión regular de clase	Retraso	1 / 2
Sesiones tomadas: 4  Puntos: 4 / 8  Porcentaje: 50,0 %`, opts);
assert.deepStrictEqual(fmt(r), ['2026-09-21 Programació 2 falta false', '2026-10-05 Programació 2 falta true', '2026-10-07 Programació 0 retraso false'], 'Moodle es');
assert.strictEqual(r.dudosas.length, 0);

// --- plataforma en catalán, una fila por hora (se suman, con tope en las horas de clase)
r = I.leer(`Data	Hora	Matèria	Tipus
20/10/2026	15:00-16:00	Bases de dades	Falta
20/10/2026	16:00-17:00	Bases de dades	Falta
20/10/2026	16:00-17:00	Bases de dades	Falta
22/10/2026	15:00-16:00	Llenguatges de marques	Retard
23/10/2026	15:00-17:00	FOL	Falta justificada
dl. 26 d'oct. de 2026	Programació	Absència`, opts);
assert.deepStrictEqual(fmt(r), ['2026-10-20 Bases de dades 2 falta false', '2026-10-22 Llenguatges de marques 0 retraso false', '2026-10-23 FOL 2 falta true', '2026-10-26 Programació 2 falta false'], 'catalán, filas por hora');

// --- Moodle en inglés con letras de estado y horas AM/PM
r = I.leer(`Course: Programming
Mon 9 Nov 2026 3PM - 5PM Regular class session A 0/2
Wed 11 Nov 2026 3PM - 4PM Regular class session L 1/2
Wed 4 Nov 2026 3PM - 5PM Regular class session P 2/2
Mon 2 Nov 2026 3PM - 5PM Regular class session E 1/2`, opts);
assert.deepStrictEqual(fmt(r), ['2026-11-02 Programació 2 falta true', '2026-11-09 Programació 2 falta false', '2026-11-11 Programació 0 retraso false'], 'Moodle en inglés');

// --- respuesta de una IA (formato del prompt) y en JSON
r = I.leer('2026-11-02 ; Programació ; 2 ; falta\n2026-11-03 ; BD ; 1 ; justificada\n2026-11-05 ; Llenguatges de marques ; 0 ; retraso', opts);
assert.deepStrictEqual(fmt(r), ['2026-11-02 Programació 2 falta false', '2026-11-03 Bases de dades 1 falta true', '2026-11-05 Llenguatges de marques 0 retraso false'], 'líneas de IA');
r = I.leer('Aquí tienes:\n```json\n[{"fecha":"2026-10-14","asignatura":"Programació","horas":1,"tipo":"falta"},{"date":"2026-10-16","subject":"FOL","hours":2,"justificada":true}]\n```', opts);
assert.deepStrictEqual(fmt(r), ['2026-10-14 Programació 1 falta false', '2026-10-16 FOL 2 falta true'], 'JSON de IA');

// --- lo dudoso se enseña, no se pierde
r = I.leer(`21/09/2026 Falta
22/09/2026 Programació Falta
25/12/2026 Programació Falta
2026-08-01 FOL Falta
de 15:00 a 17:00 Programació
Texto suelto de la web`, opts);
assert.deepStrictEqual(r.faltas, [], 'nada seguro');
assert.deepStrictEqual(r.dudosas.map((d) => d.motivo), ['No sé de qué asignatura es', 'Ese día no tienes Programació', 'La fecha no es de este curso', 'La fecha no es de este curso']);
assert.strictEqual(I.estado('de 15:00 a 17:00 Programació'), null, 'la «a» de un tramo no es Absent');

// --- sin horas escritas ni tramo: la clase entera (lo seguro)
assert.strictEqual(I.leer('16/11/2026 Programació falta', opts).faltas[0].hours, 2);
assert.strictEqual(I.leer('16/11/2026 Programació falta 1 h', opts).faltas[0].hours, 1);
// la coincidencia más larga gana
assert.strictEqual(I.asignatura('Bases de dades avançades', ['Bases', 'Bases de dades']), 'Bases de dades');
// unir dos listas sin repetir
const a = I.leer('2026-11-02 ; Programació ; 2 ; falta', opts).faltas, b = I.leer('2026-11-02 ; Programació ; 2 ; falta\n2026-11-09 ; Programació ; 2 ; falta', opts).faltas;
assert.strictEqual(I.unir(a, b).length, 2);
assert.deepStrictEqual(I.totales(I.unir(a, b)), { 'Programació': { sin: 4, just: 0, retrasos: 0 } });
assert.ok(I.promptIA(subs).includes('Programació, Bases de dades'));
console.log('v2 importar OK');
