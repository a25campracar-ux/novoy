/* NoVoy v2 · Pestaña Faltas sin DOM (tarea 1.3): cuánto te queda en cada asignatura y sus faltas, agrupadas por día,
   para justificar o borrar con un toque. Hace también de «Resumen». Se prueba en Node (tests/v2-lista.test.js). */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('../core.js') : root.FTCore;
  const Hd = isNode ? require('./hoy.js') : root.NVHoy;
  const r2 = (n) => Math.round(n * 100) / 100, r1 = (n) => Math.round(n * 10) / 10;
  const RANK = { verde: 0, amarillo: 1, rojo: 2 };

  /** Trimestres para elegir (o el curso entero) y el que toca hoy. */
  function periodos(u, hoy) {
    const S = Hd.calc(u), ts = S.terms || [];
    const act = C.termOf(S, hoy) || (ts.filter((t) => t.from <= hoy).pop() || ts[0] || {}).id;
    return { lista: ts.map((t) => ({ id: t.id, label: t.id === 'curso' ? 'Todo el curso' : t.label, from: t.from, to: t.to })), actual: act };
  }

  /**
   * Asignaturas de un periodo, la más justa primero: { name, total, queda, status, pct, limites, propia, filas }.
   * filas: faltas de esa asignatura agrupadas por día (las «de antes», sin día, en una fila aparte):
   *        { date, horas, retrasos, justificadas, todas: bool, ids, inicio }.
   */
  function asignaturas(u, term, hoy) {
    const S = Hd.calc(u), aviso = +S.settings.aviso, memo = {}, filas = {};
    (u.faltas || []).forEach((f) => {
      if (C.faltaTerm(S, f) !== term) return;
      const k = C.faltaCanon(S, f, memo), d = f.date || '', g = filas[k] || (filas[k] = {}), x = g[d] || (g[d] = { date: d, horas: 0, retrasos: 0, justificadas: 0, n: 0, ids: [], inicio: [] });
      x.ids.push(f.id); x.n++;
      if (f.type === 'retraso') x.retrasos++; else x.horas = r2(x.horas + (+f.hours || 0));
      if (f.justified) x.justificadas++;
      if (f.start) x.inicio.push(f.start);
    });
    const sum = C.summary(S, term), vistas = new Set();
    const out = sum.map((r) => {
      vistas.add(r.name);
      const ls = r.limits.map((l) => ({ etiqueta: r.limits.length > 1 ? (l.sin > 0 && l.just > 0 ? 'Todas las faltas' : l.sin > 0 ? 'Sin justificante' : 'Con justificante') : '', limite: r1(l.limit), usado: l.used, queda: r1(l.limit - l.used), status: C.status(r1(l.limit - l.used), aviso) }));
      const p = ls.reduce((a, b) => (RANK[b.status] > RANK[a.status] || (b.status === a.status && b.queda < a.queda) ? b : a), ls[0]);
      return { name: r.name, total: r.total, queda: p.queda, status: p.status, pct: r.pct, limites: ls, propia: !!r.propia, filas: ordenar(filas[r.name]) };
    });
    // faltas de asignaturas que ya no tienen horas en este periodo: se enseñan igual, nunca se esconden
    Object.keys(filas).filter((k) => !vistas.has(k)).forEach((k) => out.push({ name: k, sinHoras: true, filas: ordenar(filas[k]) }));
    return out.sort((a, b) => (a.sinHoras ? 1 : 0) - (b.sinHoras ? 1 : 0) || RANK[b.status] - RANK[a.status] || a.queda - b.queda);
  }
  const ordenar = (g) => Object.values(g || {}).map((x) => Object.assign(x, { todas: x.justificadas === x.n, inicio: x.inicio.sort() })).sort((a, b) => (a.date === '' ? 1 : b.date === '' ? -1 : a.date < b.date ? 1 : -1));

  /** Marca (o desmarca) como justificadas las faltas con esos ids. */
  function justificar(u, ids, valor) {
    const s = new Set(ids), out = JSON.parse(JSON.stringify(u));
    out.faltas = (out.faltas || []).map((f) => (s.has(f.id) ? Object.assign(f, { justified: !!valor }) : f));
    return out;
  }
  /** Borra las faltas con esos ids (la pantalla ofrece «Deshacer»). */
  function borrar(u, ids) {
    const s = new Set(ids), out = JSON.parse(JSON.stringify(u));
    out.faltas = (out.faltas || []).filter((f) => !s.has(f.id));
    return out;
  }

  const api = { periodos, asignaturas, justificar, borrar };
  if (isNode) module.exports = api; else root.NVLista = api;
})(this);
