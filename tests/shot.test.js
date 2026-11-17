// Lector de capturas de horario: el nombre del profesor no es una asignatura.
const assert = require('assert');
const S = require('../site/shot.js');

assert.ok(S.persona('Carles Narvaez B.'));
assert.ok(S.persona('Marta Puig'));
assert.ok(!S.persona('Bases de dades'));
assert.ok(!S.persona('E.CLI'));
assert.ok(!S.persona('Carles')); // un nombre suelto no basta
assert.ok(!S.persona('Aula 2.3'));

// Rejilla sintética: 5 días, horas a la izquierda, fondo blanco.
const words = [], w = (t, x, y, h = 12) => words.push({ t, x, y, w: t.length * 5, h, c: 90 });
const C = (i) => 60 + i * 100;
['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'].forEach((d, i) => w(d, C(i) + 30, 10));
['8:00', '9:00', '10:00', '11:00'].forEach((t, i) => w(t, 5, 50 + i * 60));
const linea = (txt, col, y, h) => { let x = C(col) + 5; txt.split(' ').forEach((p) => { w(p, x, y, h); x += p.length * 5 + 4; }); };
linea('DAW', 0, 45); linea('Carles Narvaez B.', 0, 62, 9);          // código y profesor debajo
linea('Carles Narvaez Bonet', 1, 50, 9);                               // el OCR perdió el código: solo el profesor
linea('Bases de dades', 2, 105);
linea('Marta Puig', 3, 165, 9); linea('E.CLI', 3, 181);                // profesor encima del código
const r = S.analyze(words, () => [255, 255, 255], 600, 320);
assert.ok(r.ok, r.error);
assert.ok(!r.subjects.some((s) => S.persona(s)), 'ningún profesor como asignatura: ' + r.subjects);
assert.deepStrictEqual(r.subjects.slice().sort(), ['Bases de dades', 'DAW', 'E.CLI']);
console.log('ok');
