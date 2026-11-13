/* Lógica pura (sin DOM). Funciona en navegador (window.FTCore) y en Node (require). */
(function (root) {
  'use strict';
  const DEF = { limite: 25, aviso: 2, unificar: false, justificadasCuentan: true, ambito: 'trimestre', retrasosPorFalta: 0 };

  const r1 = (n) => Math.round(n * 10) / 10, r2 = (n) => Math.round(n * 100) / 100;
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const weekday = (s) => parse(s).getDay(); // 1=lunes … 5=viernes

  /** Término al que pertenece una fecha. */
  function termOf(state, date) {
    for (const t of state.terms) if (date >= t.from && date <= t.to) return t.id;
    return null;
  }
  /** Nombre canónico de la asignatura según si se unifican. */
  function canon(state, name) {
    const s = state.settings || DEF;
    return s.unificar && state.alias && state.alias[name] ? state.alias[name] : name;
  }
  function status(margin, aviso) {
    return margin < 0 ? 'rojo' : margin <= aviso ? 'amarillo' : 'verde';
  }
  /** Horas faltadas por asignatura (canónica) en un trimestre. */
  /** Trimestre de una falta: por su fecha si la tiene; si no, el que tenga guardado (o el primero). */
  function faltaTerm(state, f) {
    if (f.date) return termOf(state, f.date);
    return state.terms.some((t) => t.id === f.term) ? f.term : (state.terms[0] || {}).id;
  }
  function absentByTerm(state, term) {
    const s = Object.assign({}, DEF, state.settings), out = {}, late = {};
    for (const f of state.faltas) {
      if (faltaTerm(state, f) !== term) continue;
      if (f.justified && !s.justificadasCuentan) continue;
      const k = canon(state, f.subject);
      if (f.type === 'retraso') { late[k] = (late[k] || 0) + 1; continue; }
      out[k] = (out[k] || 0) + f.hours;
    }
    // "N retrasos = 1 falta": cada bloque completo de N retrasos suma 1 h
    const n = +s.retrasosPorFalta;
    if (n > 0) Object.keys(late).forEach((k) => { const h = Math.floor(late[k] / n); if (h) out[k] = (out[k] || 0) + h; });
    return out;
  }
  /** Retrasos que llevas por asignatura en un trimestre (para enseñar cuántos faltan para la siguiente falta). */
  function latesByTerm(state, term) {
    const s = Object.assign({}, DEF, state.settings), out = {};
    for (const f of state.faltas) {
      if (f.type !== 'retraso' || faltaTerm(state, f) !== term || (f.justified && !s.justificadasCuentan)) continue;
      const k = canon(state, f.subject); out[k] = (out[k] || 0) + 1;
    }
    return out;
  }
  /**
   * Si el límite va sobre el curso entero, junta todos los trimestres en uno solo.
   * Los totales fijados se suman solo si todos los trimestres los tienen; si no, se calculan.
   * No modifica el estado guardado: es una vista para calcular.
   */
  function scope(state) {
    const s = Object.assign({}, DEF, state.settings);
    if (s.ambito !== 'curso' || !state.terms || state.terms.length < 2) return state;
    const ts = state.terms.slice().sort((a, b) => (a.from < b.from ? -1 : 1));
    const t = { id: 'curso', label: 'Curso entero', from: ts[0].from, to: ts.reduce((m, x) => (x.to > m ? x.to : m), ts[0].to) };
    const sumFixed = (fx) => {
      if (!fx || !ts.every((x) => fx[x.id] && Object.keys(fx[x.id]).length)) return {};
      const o = {}; ts.forEach((x) => Object.keys(fx[x.id]).forEach((k) => { o[k] = r2((o[k] || 0) + fx[x.id][k]); }));
      return { curso: o };
    };
    return Object.assign({}, state, { terms: [t], totals: sumFixed(state.totals), totalsUnified: sumFixed(state.totalsUnified),
      faltas: (state.faltas || []).map((f) => Object.assign({}, f, { term: 'curso' })) });
  }
  /** Horas totales de un trimestre calculadas con horario + festivos (si no hay totales fijados). */
  function computeTotals(state, term) {
    const t = state.terms.find((x) => x.id === term), out = {};
    if (!t) return out;
    for (let d = parse(t.from); ymd(d) <= t.to; d.setDate(d.getDate() + 1)) {
      dayClasses(state, ymd(d)).forEach((c) => { const k = c.canon; out[k] = r2((out[k] || 0) + c.hours); });
    }
    return out;
  }
  /** Resumen por asignatura: total, faltadas, %, límite, margen, estado. */
  function summary(state, term) {
    const s = Object.assign({}, DEF, state.settings);
    const fixed = (s.unificar ? state.totalsUnified : state.totals) || {};
    const totals = fixed[term] || computeTotals(state, term);
    const abs = absentByTerm(state, term);
    return Object.keys(totals).map((name) => {
      const total = totals[name], absent = abs[name] || 0;
      const limit = total * s.limite / 100, margin = r1(limit - absent);
      return { name, total, absent, pct: r1(absent / total * 100), limit: r1(limit), margin, status: status(margin, s.aviso) };
    });
  }
  /** Clases de un día. */
  function dayClasses(state, date) {
    if ((state.holidays || []).some((h) => date >= h.from && date <= (h.to || h.from))) return [];
    return (scheduleOn(state, date)[weekday(date)] || []).map((b) => Object.assign({}, b, { canon: canon(state, b.subject) }));
  }
  /** El horario semanal que toca ese día: el del tramo que lo cubra, o el principal. */
  function scheduleOn(state, date) {
    const p = (state.periods || []).find((x) => x.from && x.to && date >= x.from && date <= x.to);
    if (p && p.schedule) return p.schedule;
    // horarios anteriores: cada uno valió hasta su fecha "to" (ordenados de más antiguo a más nuevo)
    const old = (state.history || []).slice().sort((a, b) => (a.to < b.to ? -1 : 1)).find((h) => h.to && date <= h.to);
    return (old && old.schedule) || state.schedule || {};
  }
  /** Al cambiar el horario a partir de `from`, el anterior se guarda en el historial hasta el día antes. */
  function withHistory(prev, next, from) {
    const hist = ((prev && prev.history) || []).slice();
    if (prev && from && JSON.stringify(prev.schedule || {}) !== JSON.stringify(next.schedule || {})) {
      const d = parse(from); d.setDate(d.getDate() - 1); const to = ymd(d);
      const kept = hist.filter((h) => h.to < to); // un cambio anterior a otro posterior: el posterior manda
      kept.push({ to, schedule: JSON.parse(JSON.stringify(prev.schedule || {})) });
      return Object.assign({}, next, { history: kept });
    }
    return Object.assign({}, next, { history: hist });
  }
  /** Todas las asignaturas del curso, contando las de todos los tramos. */
  function allSubjects(state) {
    const out = [];
    [state.schedule || {}].concat((state.periods || []).map((p) => p.schedule || {}), (state.history || []).map((h) => h.schedule || {})).forEach((sch) => {
      Object.keys(sch).forEach((d) => (sch[d] || []).forEach((b) => { if (out.indexOf(b.subject) < 0) out.push(b.subject); }));
    });
    return out;
  }
  const RANK = { verde: 0, amarillo: 1, rojo: 2 };
  /** Parte un bloque en tramos de 1 h (el último puede ser fraccionario). Reparte con el recreo si el bloque es más largo que sus horas. */
  function hourSlots(b) {
    const mm = (t) => +t.slice(0, 2) * 60 + +t.slice(3), hh = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const s0 = mm(b.start), e0 = mm(b.end), dur = e0 - s0, n = Math.ceil(b.hours - 1e-9), out = [];
    for (let i = 0; i < n; i++) {
      const hrs = i < n - 1 ? 1 : r2(b.hours - (n - 1)), st = n > 1 && dur > b.hours * 60 + 1 ? s0 + Math.round(i * (dur - 60) / (n - 1)) : s0 + i * 60;
      out.push({ start: hh(st), end: hh(Math.min(e0, st + Math.round(hrs * 60))), hours: hrs });
    }
    return out;
  }
  /** ¿Puedo faltar este día? Veredicto por clase y global (peor caso). */
  function verdict(state, date) {
    const s = Object.assign({}, DEF, state.settings);
    const term = termOf(state, date);
    const classes = dayClasses(state, date);
    if (!classes.length) return { date, term, free: true, status: 'verde', items: [] };
    const sum = Object.fromEntries(summary(state, term).map((x) => [x.name, x]));
    const loss = {};
    classes.forEach((c) => { loss[c.canon] = (loss[c.canon] || 0) + c.hours; });
    const items = Object.keys(loss).map((name) => {
      const cur = sum[name];
      if (!cur) return { name, hours: loss[name], unknown: true, status: 'amarillo' };
      const after = r1(cur.absent + loss[name]);
      const margin = r1(cur.limit - after);
      return { name, hours: loss[name], now: cur.pct, after: r1(after / cur.total * 100), margin, status: status(margin, s.aviso) };
    });
    const worst = items.reduce((w, i) => (RANK[i.status] > RANK[w] ? i.status : w), 'verde');
    // cada hora por separado: efecto de faltar solo a esa hora
    const slots = [];
    classes.forEach((c) => hourSlots(c).forEach((sl) => {
      const cur = sum[c.canon]; if (!cur) return slots.push({ subject: c.subject, canon: c.canon, start: sl.start, end: sl.end, hours: sl.hours, unknown: true });
      const after = r1(cur.absent + sl.hours), margin = r1(cur.limit - after);
      slots.push({ subject: c.subject, canon: c.canon, start: sl.start, end: sl.end, hours: sl.hours, now: cur.pct, after: r1(after / cur.total * 100), margin, status: status(margin, s.aviso) });
    }));
    return { date, term, free: false, status: worst, items, classes, slots };
  }
  /** Horas de clase que quedan en un trimestre desde `from` (incluido), por asignatura. */
  function remaining(state, term, from) {
    const t = state.terms.find((x) => x.id === term), out = {};
    if (!t) return out;
    for (let d = parse(from > t.from ? from : t.from); ymd(d) <= t.to; d.setDate(d.getDate() + 1)) {
      dayClasses(state, ymd(d)).forEach((c) => { out[c.canon] = r1((out[c.canon] || 0) + c.hours); });
    }
    return out;
  }
  /** Simulador: efecto de faltar a las horas `idx` (posiciones en verdict().slots) de un día. */
  function simulate(state, date, idx) {
    const v = verdict(state, date); if (v.free || !v.term) return { free: true, rows: [], status: 'verde' };
    const s = Object.assign({}, DEF, state.settings), sum = Object.fromEntries(summary(state, v.term).map((x) => [x.name, x])), add = {};
    idx.forEach((i) => { const x = v.slots[i]; if (x && !x.unknown) add[x.canon] = (add[x.canon] || 0) + x.hours; });
    const rows = Object.keys(add).filter((k) => sum[k]).map((k) => {
      const cur = sum[k], after = r1(cur.absent + add[k]), margin = r1(cur.limit - after);
      return { name: k, hours: r1(add[k]), now: cur.pct, after: r1(after / cur.total * 100), margin, status: status(margin, s.aviso) };
    });
    return { free: false, rows, status: rows.reduce((w, i) => (RANK[i.status] > RANK[w] ? i.status : w), 'verde'), slots: v.slots };
  }
  /** Siguiente día con clase tras `date`. */
  function nextClassDay(state, date) {
    let d = parse(date);
    for (let i = 0; i < 40; i++) { d.setDate(d.getDate() + 1); const k = ymd(d); if (dayClasses(state, k).length) return k; }
    return null;
  }
  const api = { DEF, ymd, parse, weekday, scheduleOn, withHistory, allSubjects, termOf, faltaTerm, canon, scope, computeTotals, status, absentByTerm, latesByTerm, summary, dayClasses, hourSlots, remaining, simulate, verdict, nextClassDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
