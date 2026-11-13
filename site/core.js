/* Lógica pura (sin DOM). Funciona en navegador (window.FTCore) y en Node (require). */
(function (root) {
  'use strict';
  const DEF = { limite: 25, aviso: 2, unificar: false, justificadasCuentan: true };

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
  function absentByTerm(state, term) {
    const s = Object.assign({}, DEF, state.settings), out = {};
    for (const f of state.faltas) {
      if (f.term !== term || f.type === 'retraso') continue;
      if (f.justified && !s.justificadasCuentan) continue;
      const k = canon(state, f.subject);
      out[k] = (out[k] || 0) + f.hours;
    }
    return out;
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
    const wd = weekday(date);
    return (state.schedule[wd] || []).map((b) => Object.assign({}, b, { canon: canon(state, b.subject) }));
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
  const api = { DEF, ymd, parse, weekday, termOf, canon, computeTotals, status, absentByTerm, summary, dayClasses, hourSlots, remaining, simulate, verdict, nextClassDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
