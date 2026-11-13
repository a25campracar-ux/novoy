const assert = require('assert'); const C = require('../site/core.js');
const seed = require('../private/estado-camilo.json');
const state = Object.assign({}, seed.config, { settings: seed.settings, faltas: seed.faltas });
const S = Object.fromEntries(C.summary(state, '1r').map((x) => [x.name, x]));
const exp = { DAW: 8, 'E.SER': 9, 'E.CLI': 9, 'IPO II': 4, TUT: 2, CTR: 2 }; // = Notion (vista unificadas)
for (const k in exp) assert.strictEqual(S[k].absent, exp[k], k);
assert.strictEqual(S['DAW'].margin, 2.5); assert.strictEqual(S['DAW'].status, 'verde');
state.settings.unificar = false; 
assert.strictEqual(C.summary(state, '1r').find((x) => x.name === 'DAW').absent, 4); state.settings.unificar = true;
const j = Object.assign({}, state, { settings: { unificar: true, justificadasCuentan: false } });
j.faltas = j.faltas.map((f) => (f.subject === 'CTR' ? Object.assign({}, f, { justified: true }) : f));
assert.strictEqual(C.summary(j, '1r').find((x) => x.name === 'CTR').absent, 0);
console.log(JSON.stringify(S, null, 0));
const v = C.verdict(state, '2026-11-13');
assert.ok(['verde', 'amarillo', 'rojo'].includes(v.status));
assert.strictEqual(C.verdict(state, '2026-11-14').free, true);
assert.strictEqual(C.verdict(state, '2026-12-08').free, true);          // festivo
const th = C.verdict(state, '2026-11-12'); assert.deepStrictEqual(th.items.map((i) => i.name + th.items.find((x) => x.name === i.name).hours), ['E.SER2', 'E.CLI2']);
// los totales fijados en Notion deben coincidir con los calculados desde horario + calendario
const calc = C.computeTotals(state, '1r'); // el calendario da 2h más en viernes (DAW/CTR: 44/22 vs 42/20 fijado en Notion)
for (const k of ['IPO II', 'TUT', 'E.CLI', 'E.SER']) assert.strictEqual(calc[k], state.totalsUnified['1r'][k], k);
assert.strictEqual(calc.DAW - 2, state.totalsUnified['1r'].DAW); assert.strictEqual(calc.CTR - 2, state.totalsUnified['1r'].CTR);
console.log('verdict', JSON.stringify(v.items));
const sl = th.slots.map((x) => x.subject + ' ' + x.start + '-' + x.end + ' ' + x.hours).join(' | ');
assert.strictEqual(sl, 'E.SER 08:00-09:00 1 | E.SER 09:00-10:00 1 | PROJ (Álvaro) 10:00-11:00 1 | PROJ (Álvaro) 11:30-12:30 1', sl);
assert.ok(th.slots.every((x) => x.after > x.now && x.margin !== undefined));
assert.strictEqual(C.hourSlots({ start: '08:00', end: '09:30', hours: 1.5 }).map((x) => x.hours).join(), '1,0.5');
const sm = C.simulate(state, '2026-11-12', [0, 1]);
assert.strictEqual(sm.rows.length, 1); assert.strictEqual(sm.rows[0].hours, 2); assert.ok(sm.rows[0].after > sm.rows[0].now);
assert.strictEqual(C.simulate(state, '2026-11-14', [0]).free, true);
const rm = C.remaining(state, '1r', '2026-11-12'); assert.ok(rm['E.SER'] > 0 && rm['E.SER'] < 53, JSON.stringify(rm));
assert.deepStrictEqual(C.remaining(state, '1r', '2026-12-01'), {});
console.log('OK');
