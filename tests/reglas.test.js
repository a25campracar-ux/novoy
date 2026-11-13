// Reglas del centro (ámbito del límite, retrasos) y horario con "vigente desde".
// Autocontenido: no necesita la carpeta private/.
const assert = require('assert');
const C = require('../site/core.js'), SU = require('../site/setup.js');

const base = {
  center: 'Prueba',
  terms: [
    { id: '1r', label: '1r', from: '2026-09-14', to: '2026-11-27' },
    { id: '2n', label: '2n', from: '2026-11-30', to: '2027-03-05' }
  ],
  holidays: [{ from: '2026-12-22', to: '2027-01-07', label: 'Navidad' }],
  schedule: { 1: [{ start: '08:00', end: '10:00', subject: 'IPO', hours: 2 }], 3: [{ start: '08:00', end: '09:00', subject: 'Chat', hours: 1 }] },
  periods: [], alias: {}, totals: {}, totalsUnified: {}
};
const mk = (settings, faltas, extra) => Object.assign({}, base, extra || {}, { settings: Object.assign({}, C.DEF, settings), faltas });
const F = (date, subject, hours, type) => ({ id: date + subject + type, date, term: null, subject, hours, type: type || 'falta', justified: false });
const row = (S, term, name) => C.summary(S, term).find((x) => x.name === name);

// --- ámbito: por trimestre (por defecto) vs curso entero
const faltas = [F('2026-09-14', 'IPO', 2), F('2026-12-14', 'IPO', 2)];
const tri = mk({}, faltas);
assert.strictEqual(row(tri, '1r', 'IPO').absent, 2, 'por trimestre: cada uno lo suyo');
assert.strictEqual(row(tri, '2n', 'IPO').absent, 2);
const cur = C.scope(mk({ ambito: 'curso' }, faltas));
assert.deepStrictEqual(cur.terms.map((t) => t.id), ['curso']);
const rc = row(cur, 'curso', 'IPO');
assert.strictEqual(rc.absent, 4, 'curso: se suman');
assert.strictEqual(rc.total, row(tri, '1r', 'IPO').total + row(tri, '2n', 'IPO').total, 'curso: total = suma de trimestres');
assert.ok(rc.margin > row(tri, '1r', 'IPO').margin, 'el curso entero da más margen que un trimestre');
// totales fijados: se suman solo si todos los trimestres los tienen
const fx = C.scope(mk({ ambito: 'curso' }, [], { totals: { '1r': { IPO: 22 }, '2n': { IPO: 20 } } }));
assert.strictEqual(row(fx, 'curso', 'IPO').total, 42);
const half = C.scope(mk({ ambito: 'curso' }, [], { totals: { '1r': { IPO: 22 } } }));
assert.ok(row(half, 'curso', 'IPO').total > 22, 'si falta un trimestre, se calcula');
// scope no toca el estado original ni se aplica con un solo trimestre
const one = mk({ ambito: 'curso' }, faltas, { terms: [base.terms[0]] });
assert.strictEqual(C.scope(one), one);
assert.strictEqual(tri.terms.length, 2);
// el veredicto del día usa el ámbito
assert.strictEqual(C.verdict(cur, '2026-12-14').term, 'curso');

// --- retrasos: N retrasos = 1 h de falta
const late = [F('2026-09-16', 'Chat', 0, 'retraso'), F('2026-09-23', 'Chat', 0, 'retraso'), F('2026-09-30', 'Chat', 0, 'retraso'), F('2026-10-07', 'Chat', 0, 'retraso')];
assert.strictEqual((row(mk({}, late), '1r', 'Chat') || {}).absent, 0, 'por defecto no cuentan');
assert.strictEqual(row(mk({ retrasosPorFalta: 3 }, late), '1r', 'Chat').absent, 1, '4 retrasos con N=3 → 1 h');
assert.strictEqual(row(mk({ retrasosPorFalta: 2 }, late), '1r', 'Chat').absent, 2, '4 retrasos con N=2 → 2 h');
assert.strictEqual(C.latesByTerm(mk({ retrasosPorFalta: 3 }, late), '1r').Chat, 4);
const lj = late.map((f) => Object.assign({}, f, { justified: true }));
assert.strictEqual(row(mk({ retrasosPorFalta: 2, justificadasCuentan: false }, lj), '1r', 'Chat').absent, 0, 'justificados fuera si las justificadas no cuentan');

// --- faltas sin fecha o con trimestre viejo
assert.strictEqual(C.faltaTerm(tri, { date: null, term: 'curso' }), '1r', 'sin fecha y trimestre desconocido → el primero');
assert.strictEqual(C.faltaTerm(tri, { date: '2026-12-14', term: '1r' }), '2n', 'con fecha manda la fecha');

// --- horario con "vigente desde": el pasado no se reescribe
const nuevo = Object.assign({}, base, { schedule: { 1: [{ start: '08:00', end: '10:00', subject: 'CTR', hours: 2 }], 3: base.schedule[3] } });
const h = C.withHistory(base, nuevo, '2026-11-16');
assert.deepStrictEqual(h.history.map((x) => x.to), ['2026-11-15']);
const S = mk({}, [F('2026-11-09', 'IPO', 2)], h);
assert.strictEqual(C.dayClasses(S, '2026-11-09')[0].subject, 'IPO', 'antes del cambio: horario viejo');
assert.strictEqual(C.dayClasses(S, '2026-11-16')[0].subject, 'CTR', 'desde el cambio: horario nuevo');
assert.strictEqual(row(S, '1r', 'IPO').absent, 2, 'la falta vieja sigue contando');
assert.ok(row(S, '1r', 'IPO').total > 0 && row(S, '1r', 'CTR').total > 0, 'cada módulo suma solo sus semanas');
assert.ok(C.allSubjects(S).includes('IPO'), 'las asignaturas del horario viejo siguen existiendo');
// "me había equivocado": sin fecha no se guarda historial
assert.deepStrictEqual(C.withHistory(base, nuevo, null).history, []);
// sin cambios en la semana: tampoco
assert.deepStrictEqual(C.withHistory(base, Object.assign({}, base), '2026-11-16').history, []);
// un segundo cambio anterior al primero sustituye al posterior
const h2 = C.withHistory(h, Object.assign({}, nuevo, { schedule: base.schedule }), '2026-10-05');
assert.deepStrictEqual(h2.history.map((x) => x.to), ['2026-10-04']);

// --- ida y vuelta por el formato de intercambio (copias, cuentas, enlaces)
const exp = SU.toExport(mk({ ambito: 'curso', retrasosPorFalta: 3, justificadasCuentan: false }, [], h));
const r = SU.parseImport(exp);
assert.ok(r.ok, JSON.stringify(r.errors));
assert.deepStrictEqual(r.config.history.map((x) => x.to), ['2026-11-15']);
assert.strictEqual(r.config.history[0].schedule[1][0].subject, 'IPO');
assert.deepStrictEqual(r.reglas, { ambito: 'curso', retrasosPorFalta: 3, justificadasCuentan: false, justModo: 'nocuentan', limiteJust: 25, semanas: 33 });
// un JSON sin estos campos (el de la IA) sigue valiendo y no trae reglas
const plain = SU.parseImport(SU.FORMAT);
assert.ok(plain.ok, JSON.stringify(plain.errors));
assert.strictEqual(plain.reglas.justModo, 'juntas'); // la plantilla de la IA ya trae reglas
assert.deepStrictEqual(plain.config.history, []);

console.log('reglas OK');
