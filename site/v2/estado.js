/* NoVoy v2 · Del borrador del alta al estado que guarda la app (mismo formato que la v1: ft.v2).
   Sin DOM: se prueba en Node (tests/v2-estado.test.js). */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const H = isNode ? require('./horario.js') : root.NVHorario;
  const R = isNode ? require('./reglas.js') : root.NVReglas;
  const K = isNode ? require('./calendario.js') : root.NVCal;
  const AJ = isNode ? require('./ajustes.js') : root.NVAjustes;

  /** Trimestre en el que cae una fecha (o el último que ya empezó). */
  function trimestreDe(terms, iso) {
    const t = terms.find((x) => x.from <= iso && iso <= x.to);
    if (t) return t;
    const pasados = terms.filter((x) => x.from <= iso);
    return pasados.length ? pasados[pasados.length - 1] : terms[0];
  }

  /** Reglas del alta → settings del motor, más los campos antiguos para que la v1 los enseñe bien. */
  function settingsDe(reglas) {
    const s = R.aSettings(reglas);
    if (s.error) return s;
    const L = s.limites, out = { limites: L, ambito: s.ambito === 'curso' ? 'curso' : 'trimestre', ambitoElegido: s.ambito, retrasosPorFalta: s.retrasosPorFalta, aproximado: s.aproximado };
    // compatibilidad con la interfaz v1 (el motor manda con `limites`)
    out.limite = L[0].pct;
    if (L.length === 1) out.justModo = L[0].just ? 'juntas' : 'nocuentan';
    else if (L[1].sin === 0) { out.justModo = 'separadas'; out.limiteJust = L[1].pct; }
    else out.justModo = 'juntas';
    out.justificadasCuentan = out.justModo === 'juntas';
    return out;
  }

  /**
   * Borrador → { config, settings, faltas } o { error }.
   * d = { centro:{ id, code, name, city, prov }, ciclo:{ code, name, prov }, turno,
   *       horario: { rows, grid } | { schedule }, quitar: [asignaturas],
   *       cal: { inicio, fin, terms, locales, libres, libresLuego },
   *       reglas: respuestas, previas: { asignatura: { sin, just } },
   *       importadas: [{ date, subject, hours, type, justified }], hoy: 'YYYY-MM-DD' }
   */
  function construir(d) {
    if (!d || !d.centro || !d.centro.name) return { error: 'Falta el instituto.' };
    let schedule = d.horario && d.horario.schedule ? d.horario.schedule : d.horario ? H.aHorario(d.horario.rows || [], d.horario.grid || {}) : {};
    schedule = H.sinAsignaturas(schedule, d.quitar);
    if (!Object.keys(schedule).length) return { error: 'El horario está vacío.' };
    const cal = d.cal || {}, curso = K.CURSO_2627;
    const inicio = cal.inicio || curso.inicioFP, fin = cal.fin || curso.finFP;
    const terms = cal.terms && cal.terms.length ? cal.terms : K.trimestresPropuestos(inicio, fin, curso);
    const errT = K.errorTrimestres(terms); if (errT) return { error: errT };
    const settings = settingsDe(d.reglas || { tipo: 'nose' }); if (settings.error) return settings;
    if (cal.libresLuego || !(cal.libres || []).length) settings.libresPendientes = curso.diasLibreDisposicion;
    const config = {
      center: d.centro.name,
      catalog: {
        centre: { id: d.centro.id || null, name: d.centro.name, code: d.centro.code || null, city: d.centro.city || '', prov: !!d.centro.prov },
        cycle: d.ciclo ? { code: d.ciclo.code || null, name: d.ciclo.name, prov: !!d.ciclo.prov } : null,
        turno: d.turno || null
      },
      terms: terms.map((t) => ({ id: t.id, label: t.label, from: t.from, to: t.to })),
      holidays: K.festivos(curso, cal.locales, cal.libres),
      schedule,
      periods: [], alias: {}, nocount: [], totals: {}, totalsUnified: {},
      origen: { version: 2, plantilla: d.plantilla || null, calendario: curso.id }
    };
    // casos especiales que vienen en la plantilla del grupo (1.11): fechas por asignatura y semanas con otro horario
    if (d.especiales && AJ) Object.assign(config, AJ.conEspeciales(config, d.especiales));
    // faltas que ya llevaba: sin fecha, en el trimestre de hoy (el formato «previas» de la v1)
    const hoy = d.hoy || new Date().toISOString().slice(0, 10), t = trimestreDe(config.terms, hoy), faltas = [];
    let n = 0;
    Object.keys(d.previas || {}).forEach((subject) => {
      const p = d.previas[subject] || {};
      [['sin', false], ['just', true]].forEach(([k, justified]) => {
        const h = Math.round((+p[k] || 0) * 100) / 100;
        if (h > 0) faltas.push({ id: 'p' + (++n) + '-' + Date.now().toString(36), date: '', term: t.id, subject, hours: h, type: 'falta', justified, note: 'previas' });
      });
    });
    // faltas leídas de una lista (pegada, captura o IA): con su fecha real
    (d.importadas || []).forEach((f) => {
      if (!f || !f.date || !f.subject) return;
      faltas.push({ id: 'i' + (++n) + '-' + Date.now().toString(36), date: f.date, subject: f.subject, hours: f.type === 'retraso' ? 0 : Math.round((+f.hours || 0) * 100) / 100, type: f.type === 'retraso' ? 'retraso' : 'falta', justified: !!f.justified, note: f.vaga ? 'importada-vaga' : 'importada' });
    });
    return { config, settings, faltas, since: hoy };
  }

  const api = { construir, settingsDe, trimestreDe };
  if (isNode) module.exports = api; else root.NVEstado = api;
})(this);
