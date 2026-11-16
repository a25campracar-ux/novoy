// Estado inventado para probar la pantalla Hoy (pruebas en Node y recorrido en Chrome). Ningún dato real.
// Turno de tarde, 1r trimestre de 2026-27 con los festivos generales. Lunes 16/11/2026:
//   15:00 Programació (2 h) · 17:00 Bases de dades (1 h) · 18:20 Llenguatges de marques (1 h)
const K = require('../../site/v2/calendario.js');
const B = (start, end, subject, hours) => ({ start, end, subject, hours });
function estado(opts) {
  opts = opts || {};
  const c = K.CURSO_2627;
  return {
    config: {
      center: 'Institut de Prova',
      terms: K.trimestresPropuestos(c.inicioFP, c.finFP, c),
      holidays: K.festivos(c, [], []),
      schedule: {
        1: [B('15:00', '17:00', 'Programació', 2), B('17:00', '18:00', 'Bases de dades', 1), B('18:20', '19:20', 'Llenguatges de marques', 1)],
        2: [B('15:00', '17:00', 'Bases de dades', 2), B('17:00', '18:00', 'Entorns', 1), B('18:20', '19:20', 'Tutoria', 1)],
        3: [B('15:00', '18:00', 'Programació', 3), B('18:20', '19:20', 'Entorns', 1)],
        4: [B('15:00', '17:00', 'Llenguatges de marques', 2), B('17:00', '18:00', 'Bases de dades', 1)],
        5: [B('15:00', '17:00', 'Programació', 2), B('17:00', '19:00', 'Sistemes', 2)]
      },
      periods: [], alias: {}, nocount: [], totals: {}, totalsUnified: {}, origen: { version: 2 },
      catalog: { centre: { name: 'Institut de Prova', city: 'Lleida', prov: true }, cycle: { name: 'Ciclo de Prova', prov: true }, turno: 'tarde' }
    },
    settings: Object.assign({ limites: [{ pct: 25, sin: 1, just: 1 }], ambito: 'trimestre', retrasosPorFalta: 0 }, opts.settings || {}),
    faltas: opts.faltas || [],
    since: opts.since || '2026-11-02',
    comprobado: opts.comprobado || null
  };
}
/** n faltas de 1 h de una asignatura, en días pasados sin hora (como las «de antes»). */
const previas = (subject, h, justified) => [{ id: 'p-' + subject + (justified ? 'j' : ''), date: '', term: '1r', subject, hours: h, type: 'falta', justified: !!justified, note: 'previas' }];
module.exports = { estado, previas };
