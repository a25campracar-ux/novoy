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

// --- formato iEduca (una fila por sesión con su hora; «No justificada»; vaga; tutoría)
r = I.leer(`\t16/11/2026\t15:00\tPROG\tNo justificada
\t16/11/2026\t16:00\tPROG\tNo justificada
\t16/11/2026\t17:00\tPROG\tNo justificada
17/11/2026\t15:00\tBD\tRetard
\t13/11/2026\t15:00\tFOL\tVaga
\t13/11/2026\t16:00\tFOL\tVaga
\t10/11/2026\t15:00\tBD\tJustificada
\t09/11/2026\t18:00\tTUT\tNo justificada`, Object.assign({}, opts, { hoy: '2026-11-17' }));
assert.deepStrictEqual(fmt(r), ['2026-11-10 Bases de dades 1 falta true', '2026-11-13 FOL 2 falta false', '2026-11-16 Programació 2 falta false', '2026-11-17 Bases de dades 0 retraso false'],
  'iEduca: «No justificada» es sin justificar; 1 h por fila con tope en las horas de clase');
assert.ok(r.faltas.find((f) => f.subject === 'FOL').vaga, 'la vaga queda marcada');
assert.strictEqual(r.tutoria, 1, 'la tutoría se cuenta aparte');
assert.strictEqual(r.dudosas.length, 0);
assert.strictEqual(I.estado('No justificada'), 'falta');
assert.strictEqual(I.estado('Falta no justificada'), 'falta');
assert.strictEqual(I.estado('Sin justificar'), 'falta');
assert.strictEqual(I.estado('Injustificada'), 'falta');
assert.strictEqual(I.estado('Justificada'), 'just');
assert.deepStrictEqual(I.totales(r.faltas)['FOL'], { sin: 0, just: 0, retrasos: 0, vaga: 2 });

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
assert.deepStrictEqual(I.totales(I.unir(a, b)), { 'Programació': { sin: 4, just: 0, retrasos: 0, vaga: 0 } });
// volver a pegar corrige una lectura antigua equivocada en vez de sumarse (caso real: 82 h con 0 justificadas)
const vieja = I.leer('2026-11-02 ; Programació ; 2 ; justificada\n2026-11-02 ; Programació ; retraso', opts).faltas;
const buena = I.leer('2026-11-02 ; Programació ; 2 ; no justificada', opts).faltas;
const juntas = I.unir(vieja, buena);
assert.deepStrictEqual(I.totales(juntas), { 'Programació': { sin: 2, just: 0, retrasos: 1, vaga: 0 } });
assert.ok(I.promptIA(subs).includes('Programació, Bases de dades'));
console.log('v2 importar OK');

// ---------- con fecha y hora manda el horario (faltas apuntadas en PROJ u otro nombre) ----------
{
  const I2 = require('../site/v2/importar.js');
  const horario = { 1: [['08:00', '10:00', 'IPO II'], ['10:00', '11:00', 'DAW']], 5: [['08:00', '09:00', 'E.CLI']] };
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const dia = (iso) => new Date(iso + 'T12:00:00').getDay();
  const bl = (date) => (horario[dia(date)] || []).map((x) => ({ a: mins(x[0]), b: mins(x[1]), hours: (mins(x[1]) - mins(x[0])) / 60, subject: x[2] }));
  const o = { curso: { inicio: '2026-09-14', fin: '2027-06-18' }, hoy: '2026-11-17', subs: ['IPO II', 'DAW', 'E.CLI'],
    horasDia: (d, s) => bl(d).filter((x) => x.subject === s).reduce((a, x) => a + x.hours, 0),
    bloquesDia: (d, s) => bl(d).filter((x) => x.subject === s),
    claseA: (d, m) => { const x = bl(d).find((y) => y.a <= m && m < y.b); return x ? x.subject : null; } };
  const r = I2.leer('16/11/2026 08:00 PROJ No justificada\n16/11/2026 09:00 PROJ No justificada\n13/11/2026 08:00 PROJ Retard\n16/11/2026 10:00 DAW No justificada\n16/11/2026 08:00 DAW No justificada', o);
  assert.deepStrictEqual(r.dudosas.map((x) => x.linea), [], 'ninguna línea sin entender');
  const k = (f) => f.date + ' ' + f.subject + ' ' + f.type + ' ' + f.hours + (f.porHora ? ' *' : '');
  assert.deepStrictEqual(r.faltas.map(k), ['2026-11-13 E.CLI retraso 0 *', '2026-11-16 DAW falta 1', '2026-11-16 IPO II falta 2 *'],
    'PROJ del lunes a las 8 y a las 9 → IPO II; del viernes a las 8 → E.CLI; «DAW a las 8» del lunes → IPO II (la clase de esa hora)');
  assert.strictEqual(I2.horaInicio('9/10/2026 09:00 PROJ'), 540);
  assert.strictEqual(I2.horaInicio('9/10/2026 PROJ'), null, 'sin hora, se queda como estaba');
}
