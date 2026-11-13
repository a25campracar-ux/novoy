/* Lógica pura (sin DOM). Funciona en navegador (window.FTCore) y en Node (require). */
(function (root) {
  'use strict';
  const DEF = { limite: 25, aviso: 2, unificar: false, justificadasCuentan: true, ambito: 'trimestre', retrasosPorFalta: 0, semanas: 33, justModo: null, limiteJust: 25 };
  /** Cómo cuentan las justificadas: 'juntas' (mismo %), 'nocuentan' o 'separadas' (su propio %). */
  const justMode = (s) => (s.justModo === 'juntas' || s.justModo === 'nocuentan' || s.justModo === 'separadas' ? s.justModo : (s.justificadasCuentan === false ? 'nocuentan' : 'juntas'));

  const r1 = (n) => Math.round(n * 10) / 10, r2 = (n) => Math.round(n * 100) / 100;
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const weekday = (s) => parse(s).getDay(); // 1=lunes … 5=viernes
  const todayStr = () => ymd(new Date());

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
  function absentByTerm(state, term, justOnly) {
    const s = Object.assign({}, DEF, state.settings), out = {}, late = {}, jm = justMode(s);
    for (const f of state.faltas) {
      if (faltaTerm(state, f) !== term) continue;
      if (justOnly) { if (f.justified && f.type !== 'retraso') { const k = canon(state, f.subject); out[k] = (out[k] || 0) + f.hours; } continue; }
      if (f.justified && jm !== 'juntas') continue;
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
      if (f.type !== 'retraso' || faltaTerm(state, f) !== term || (f.justified && justMode(s) !== 'juntas')) continue;
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
  /** Días lectivos (lunes a viernes sin festivos) de todos los trimestres. */
  function lectiveDays(state) {
    let n = 0;
    (state.terms || []).forEach((t) => { for (let d = parse(t.from); ymd(d) <= t.to; d.setDate(d.getDate() + 1)) { const k = ymd(d), w = d.getDay(); if (w > 0 && w < 6 && !(state.holidays || []).some((h) => k >= h.from && k <= (h.to || h.from))) n++; } });
    return n;
  }
  /** semanas oficiales / semanas del calendario, como mucho 1. */
  function weeksFactor(state) {
    const s = Object.assign({}, DEF, state.settings), w = +s.semanas; if (!(w > 0) || s.formula === 'calendario') return 1;
    const key = JSON.stringify([state.terms, state.holidays, w]); if (weeksFactor.k === key) return weeksFactor.v;
    const days = lectiveDays(state), v = days ? Math.min(1, (w * 5) / days) : 1;
    weeksFactor.k = key; weeksFactor.v = v; return v;
  }
  /** Horas totales de un trimestre calculadas con horario + festivos (si no hay totales fijados). */
  /** Horas de clase de un trimestre contando el calendario día a día (sin escalar). */
  function rawCount(state, t) {
    const out = {};
    for (let d = parse(t.from); ymd(d) <= t.to; d.setDate(d.getDate() + 1)) dayClasses(state, ymd(d), true).forEach((c) => { const k = c.canon; out[k] = r2((out[k] || 0) + c.hours); });
    return out;
  }
  /** Por asignatura: (horas semanales × semanas del curso) / (horas que da el calendario en todo el curso), como mucho 1. */
  function nominalFactors(state) {
    const s = Object.assign({}, DEF, state.settings), w = +s.semanas;
    if (!(w > 0) || s.formula === 'calendario') return { '*': 1 };
    const key = JSON.stringify([state.terms, state.holidays, state.schedule, state.periods, state.history, state.nocount, state.disabled, state.alias, s.unificar, w]);
    if (nominalFactors.k === key) return nominalFactors.v;
    const all = {}, weekly = {};
    (state.terms || []).forEach((t) => { const c = rawCount(state, t); Object.keys(c).forEach((k) => { all[k] = (all[k] || 0) + c[k]; }); });
    const nc = state.nocount || [];
    Object.keys(state.schedule || {}).forEach((d) => (state.schedule[d] || []).forEach((b) => { if (nc.indexOf(b.subject) >= 0) return; const k = canon(state, b.subject); weekly[k] = (weekly[k] || 0) + (+b.hours || 0); }));
    const v = { '*': weeksFactor(state) };
    Object.keys(all).forEach((k) => { if (weekly[k] && all[k]) v[k] = Math.min(1, (weekly[k] * w) / all[k]); });
    nominalFactors.k = key; nominalFactors.v = v; return v;
  }
  function computeTotals(state, term) {
    const t = state.terms.find((x) => x.id === term), out = {};
    if (!t) return out;
    // cuenta cada franja para su dueña de la rejilla, aunque esté desactivada y la cubra otra:
    // las horas oficiales de un módulo son las suyas de la semana; las prestadas no le suman
    for (let d = parse(t.from); ymd(d) <= t.to; d.setDate(d.getDate() + 1)) {
      dayClasses(state, ymd(d), true).forEach((c) => { const k = c.canon; out[k] = r2((out[k] || 0) + c.hours); });
    }
    // Fórmula del centro: horas semanales × semanas del curso (33 por normativa), no los días del calendario.
    // El calendario da más semanas de las oficiales (38 frente a 33), así que se escala a la baja; nunca al alza.
    const fx = nominalFactors(state);
    Object.keys(out).forEach((k) => { const f = fx[k] != null ? fx[k] : fx['*']; if (f < 1) out[k] = r2(out[k] * f); });
    const p = state.project;
    if (p && p.name && +p.weeks > 0 && projectWeekHours(p) > 0) {
      // no se sabe qué semanas serán: total del curso = semanas × horas por semana, repartido según los días lectivos del trimestre
      const days = (a, b) => { let n = 0; for (let d = parse(a); ymd(d) <= b; d.setDate(d.getDate() + 1)) { const k = ymd(d), w = d.getDay(); if (w > 0 && w < 6 && !(state.holidays || []).some((h) => k >= h.from && k <= (h.to || h.from))) n++; } return n; };
      const all = (state.terms || []).reduce((n, x) => n + days(x.from, x.to), 0), mine = days(t.from, t.to);
      if (all) out[canon(state, p.name)] = r1(+p.weeks * projectWeekHours(p) * mine / all);
    }
    return out;
  }
  /** Resumen por asignatura: total, faltadas, %, límite, margen, estado. */
  function summary(state, term) {
    const s = Object.assign({}, DEF, state.settings);
    const fixed = ((s.unificar ? state.totalsUnified : state.totals) || {})[term] || {};
    // las horas fijadas a mano mandan; el resto de asignaturas se calcula con el horario
    const totals = Object.assign(computeTotals(state, term), fixed);
    const abs = absentByTerm(state, term), nc = state.nocount || [], sep = justMode(s) === 'separadas', jab = sep ? absentByTerm(state, term, true) : {};
    return Object.keys(totals).filter((name) => nc.indexOf(name) < 0).map((name) => {
      const total = totals[name], absent = abs[name] || 0;
      const limit = total * s.limite / 100, margin = r1(limit - absent);
      const o = { name, total, absent, pct: r1(absent / total * 100), limit: r1(limit), margin, status: status(margin, s.aviso), off: offOn(state, name, todayStr()) };
      if (sep) { // justificadas con su propio límite: el estado es el peor de los dos
        const ja = jab[name] || 0, jl = total * (+s.limiteJust || s.limite) / 100, jm = r1(jl - ja);
        o.j = { absent: ja, limit: r1(jl), margin: jm, pct: r1(ja / total * 100), status: status(jm, s.aviso) };
        if (RANK[o.j.status] > RANK[o.status]) o.status = o.j.status;
      }
      return o;
    });
  }
  /** Clases de un día. */
  /** ¿Esta asignatura está desactivada ese día? (aún no se imparte: la cubre otra). */
  function offOn(state, subject, date) {
    const x = (state.disabled || {})[subject];
    return !!(x && x.cover && !(x.on && date >= x.on));
  }
  /** ¿Semana de proyecto activa ese día? (se activa y se termina a mano; cada vez queda un rango). */
  function projectOn(state, date) {
    const p = state.project;
    return !!(p && p.name && (p.ranges || []).some((r) => r.from && date >= r.from && (!r.to || date <= r.to)));
  }
  const mn = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  /**
   * Clases de un día.
   * - Si una asignatura está desactivada, su franja cuenta para la que la cubre.
   * - En semana de proyecto, las franjas marcadas como proyecto pasan a ser del proyecto (hora a hora).
   * `raw`: sin sustituir nada (la dueña de cada franja en la rejilla).
   */
  function dayClasses(state, date, raw) {
    if ((state.holidays || []).some((h) => date >= h.from && date <= (h.to || h.from))) return [];
    const nc = state.nocount || []; // clases que no cuentan faltas (p. ej. tutoría): no existen para el cálculo
    let out = (scheduleOn(state, date)[weekday(date)] || []).filter((b0) => nc.indexOf(b0.subject) < 0).map((b0) => {
      const b = Object.assign({}, b0);
      if (!raw && offOn(state, b.subject, date)) { b.covers = b.subject; b.subject = state.disabled[b.subject].cover; }
      return b;
    });
    if (!raw && projectOn(state, date)) {
      const pb = ((state.project.schedule || {})[weekday(date)] || []);
      if (pb.length) {
        const hit = (x) => pb.some((p) => mn(x.start) < mn(p.end) && mn(x.end) > mn(p.start));
        const keep = [];
        out.forEach((b) => { if (!hit(b)) keep.push(b); else hourSlots(b).forEach((x) => { if (!hit(x)) keep.push(Object.assign({}, b, x)); }); });
        out = keep.concat(pb.map((p) => Object.assign({}, p, { subject: state.project.name, project: true }))).sort((a, b) => mn(a.start) - mn(b.start));
      }
    }
    return out.map((b) => Object.assign(b, { canon: canon(state, b.subject) }));
  }
  /** Horas de proyecto de una semana (lo marcado en la rejilla). */
  function projectWeekHours(p) { let h = 0; Object.keys((p && p.schedule) || {}).forEach((d) => (p.schedule[d] || []).forEach((b) => { h += +b.hours || 0; })); return r2(h); }
  /** Asignaturas desactivadas hoy: [{ name, cover, on }]. */
  function disabledOn(state, date) {
    return Object.keys(state.disabled || {}).filter((k) => offOn(state, k, date)).map((k) => ({ name: k, cover: state.disabled[k].cover, on: state.disabled[k].on || null }));
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
    const out = state.project && state.project.name ? [state.project.name] : [];
    [state.schedule || {}].concat((state.periods || []).map((p) => p.schedule || {}), (state.history || []).map((h) => h.schedule || {})).forEach((sch) => {
      Object.keys(sch).forEach((d) => (sch[d] || []).forEach((b) => { if (out.indexOf(b.subject) < 0) out.push(b.subject); }));
    });
    return out;
  }
  const RANK = { verde: 0, amarillo: 1, rojo: 2 };
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  /** Quita de las horas fijadas las asignaturas y trimestres que ya no existen. Nunca borra las que siguen. */
  function pruneTotals(cfg) {
    const subs = allSubjects(cfg), canonAll = subs.concat(Object.values(cfg.alias || {})), terms = (cfg.terms || []).map((t) => t.id);
    const clean = (fx) => { const o = {}; Object.keys(fx || {}).forEach((tid) => { if (terms.indexOf(tid) < 0) return; const x = {}; Object.keys(fx[tid] || {}).forEach((k) => { if (canonAll.indexOf(k) >= 0) x[k] = fx[tid][k]; }); if (Object.keys(x).length) o[tid] = x; }); return o; };
    const dis = {}; Object.keys(cfg.disabled || {}).forEach((k) => { const x = cfg.disabled[k]; if (subs.indexOf(k) >= 0 && x && subs.indexOf(x.cover) >= 0 && x.cover !== k) dis[k] = x; });
    return Object.assign({}, cfg, { totals: clean(cfg.totals), totalsUnified: clean(cfg.totalsUnified), disabled: dis, nocount: (cfg.nocount || []).filter((k) => subs.indexOf(k) >= 0) });
  }
  /** Renombra asignaturas en todo el horario (principal, tramos e historial), uniones y horas fijadas. */
  function renameSubjects(cfg, ren) {
    if (!ren || !Object.keys(ren).length) return cfg;
    const c = JSON.parse(JSON.stringify(cfg)), rn = (x) => (ren[x] != null ? ren[x] : x);
    const sch = (o) => Object.keys(o || {}).forEach((d) => (o[d] || []).forEach((b) => { b.subject = rn(b.subject); }));
    sch(c.schedule); (c.periods || []).forEach((p) => sch(p.schedule)); (c.history || []).forEach((h) => sch(h.schedule));
    const al = {}; Object.keys(c.alias || {}).forEach((k) => { const a = rn(k), b = rn(c.alias[k]); if (a !== b) al[a] = b; }); c.alias = al;
    ['totals', 'totalsUnified'].forEach((key) => Object.keys(c[key] || {}).forEach((tid) => { const o = {}; Object.keys(c[key][tid]).forEach((k) => { o[rn(k)] = c[key][tid][k]; }); c[key][tid] = o; }));
    (c.subjects || []).forEach((m) => { m.name = rn(m.name); });
    if (c.project && c.project.name) c.project.name = rn(c.project.name);
    c.nocount = (c.nocount || []).map(rn);
    const dis = {}; Object.keys(c.disabled || {}).forEach((k) => { dis[rn(k)] = Object.assign({}, c.disabled[k], { cover: rn(c.disabled[k].cover) }); }); c.disabled = dis;
    return c;
  }
  /**
   * Pone en orden los datos guardados (se llama al cargar y al guardar):
   * - cada asignatura tiene un id fijo en cfg.subjects ({ id, name }); renombrar cambia el nombre, no el id
   * - cada falta tiene id único y `sid` (id de su asignatura); si la asignatura se renombró, la falta la sigue
   * - cada falta es UNA unidad: una hora de clase (o lo que dure la casilla). Las de varias horas se parten
   *   en unidades, una por cada hora de esa asignatura ese día, aunque sean seguidas.
   * Nunca borra faltas: si su asignatura ya no está en el horario, se queda (ver orphans()).
   */
  function normalize(cfg, faltas) {
    if (!cfg) return { cfg, faltas: faltas || [] };
    const c = Object.assign({}, cfg);
    c.schedule = splitAtBreaks(c.schedule);
    if (c.periods) c.periods = c.periods.map((p) => Object.assign({}, p, { schedule: splitAtBreaks(p.schedule, c.schedule) }));
    if (c.history) c.history = c.history.map((h) => Object.assign({}, h, { schedule: splitAtBreaks(h.schedule, c.schedule) }));
    if (c.project && c.project.schedule) c.project = Object.assign({}, c.project, { schedule: splitAtBreaks(c.project.schedule, c.schedule) });
    const reg = (cfg.subjects || []).map((m) => ({ id: m.id, name: m.name })).filter((m) => m.id && m.name);
    const byName = (n) => reg.find((m) => m.name === n), byId = (i) => reg.find((m) => m.id === i);
    allSubjects(c).forEach((n) => { if (!byName(n)) reg.push({ id: uid('m'), name: n }); });
    const seen = new Set(), out = [];
    (faltas || []).forEach((f0) => {
      const f = Object.assign({}, f0);
      if (f.sid && byId(f.sid)) f.subject = byId(f.sid).name;          // la asignatura se renombró: la falta la sigue
      else { let m = byName(f.subject); if (!m) { m = { id: uid('m'), name: f.subject }; reg.push(m); } f.sid = m.id; }
      const units = unitsOf(c, f, out);
      units.forEach((u, i) => { const g = Object.assign({}, f, u); if (i || !g.id || seen.has(g.id)) g.id = uid('f'); seen.add(g.id); out.push(g); });
    });
    // horas que ya no existen (p. ej. 09:10 de un reparto antiguo con el recreo mal puesto): a la hora real más cercana libre
    out.forEach((f) => {
      if (!f.date || !f.start) return;
      const sl = []; dayClasses(c, f.date).filter((b) => b.subject === f.subject).forEach((b) => hourSlots(b).forEach((x) => sl.push(x.start)));
      if (!sl.length || sl.indexOf(f.start) >= 0) return;
      const used = new Set(out.filter((x) => x !== f && x.date === f.date && x.subject === f.subject && x.type === f.type).map((x) => x.start));
      const free = sl.filter((x) => !used.has(x)); if (!free.length) return;
      f.start = free.reduce((best, x) => (Math.abs(mn(x) - mn(f.start)) < Math.abs(mn(best) - mn(f.start)) ? x : best), free[0]);
    });
    // el registro guarda las asignaturas del horario y las que aún tienen faltas
    const live = new Set(allSubjects(c).concat(out.map((f) => f.subject)));
    c.subjects = reg.filter((m) => live.has(m.name));
    return { cfg: c, faltas: out };
  }
  /** Parte una falta en unidades de una clase. Devuelve [{ hours, start? }, …]. */
  function unitsOf(cfg, f, taken) {
    if (f.type === 'retraso') return [{ hours: 0 }];
    const total = +f.hours || 0;
    if (f.start && total <= 1.0001) return [{ hours: total }];
    let slots = [];
    if (f.date) {
      const used = new Set(taken.filter((x) => x.date === f.date && x.subject === f.subject && x.start).map((x) => x.start));
      dayClasses(cfg, f.date).filter((b) => b.subject === f.subject).forEach((b) => hourSlots(b).forEach((x) => { if (!used.has(x.start)) slots.push(x); }));
    }
    if (total <= 1.0001 && !slots.length) return [{ hours: total }];
    const res = []; let left = r2(total);
    while (left > 0.0001) {
      const sl = slots.shift(), h = r2(Math.min(left, sl ? sl.hours : 1));
      res.push(sl ? { hours: h, start: sl.start } : { hours: h }); left = r2(left - h);
    }
    return res.length ? res : [{ hours: 0 }];
  }
  /** Faltas cuya asignatura ya no aparece en ningún horario (para reasignarlas, nunca se borran solas). */
  function orphans(state) {
    const subs = allSubjects(state);
    return (state.faltas || []).filter((f) => subs.indexOf(f.subject) < 0);
  }
  /** Parte un bloque en tramos de 1 h (el último puede ser fraccionario). Reparte con el recreo si el bloque es más largo que sus horas. */
  function hourSlots(b) {
    const mm = (t) => +t.slice(0, 2) * 60 + +t.slice(3), hh = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const s0 = mm(b.start), e0 = mm(b.end), dur = e0 - s0, n = Math.ceil(b.hours - 1e-9), out = [];
    for (let i = 0; i < n; i++) {
      // si el bloque dura más que sus horas, dentro hay un recreo: horas seguidas desde el inicio y la última pegada al final
      // (antes se repartían a partes iguales y salían horas imposibles como 09:10 o 10:20)
      const hrs = i < n - 1 ? 1 : r2(b.hours - (n - 1)), st = n > 1 && i === n - 1 && dur > b.hours * 60 + 1 ? e0 - Math.round(hrs * 60) : s0 + i * 60;
      out.push({ start: hh(st), end: hh(Math.min(e0, st + Math.round(hrs * 60))), hours: hrs });
    }
    return out;
  }
  /**
   * Parte los bloques que llevan un recreo dentro (dura más que sus horas) usando los recreos que se ven en
   * otros días (huecos cortos entre clases). Ej.: FIS 08:00–12:30 con 4 h y un hueco 11:00–11:30 el lunes
   * → FIS 08:00–11:00 (3 h) + FIS 11:30–12:30 (1 h). Si no se ve ningún recreo que encaje, lo deja igual.
   */
  function splitAtBreaks(sch, ref) {
    const hh = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const gaps = [];
    [sch, ref].forEach((src) => Object.keys(src || {}).forEach((d) => { const bl = (src[d] || []).slice().sort((a, b) => mn(a.start) - mn(b.start));
      for (let i = 1; i < bl.length; i++) { const a = mn(bl[i - 1].end), z = mn(bl[i].start); if (z > a && z - a <= 45 && !gaps.some((g) => g[0] === a && g[1] === z)) gaps.push([a, z]); } }));
    let changed = false; const out = {};
    Object.keys(sch || {}).forEach((d) => {
      out[d] = [];
      (sch[d] || []).forEach((b) => {
        const s0 = mn(b.start), e0 = mn(b.end), extra = e0 - s0 - b.hours * 60;
        const g = extra > 1 ? gaps.find((x) => x[0] > s0 && x[1] < e0 && Math.abs((x[1] - x[0]) - extra) <= 1) : null;
        const h1 = g ? r2((g[0] - s0) / 60) : 0;
        if (g && h1 > 0 && h1 < b.hours) { changed = true; out[d].push(Object.assign({}, b, { end: hh(g[0]), hours: h1 }), Object.assign({}, b, { start: hh(g[1]), hours: r2(b.hours - h1) })); }
        else out[d].push(b);
      });
    });
    return changed ? out : sch;
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
  const api = { justMode, weeksFactor, nominalFactors, lectiveDays, splitAtBreaks, projectOn, projectWeekHours, offOn, disabledOn, DEF, ymd, parse, weekday, scheduleOn, withHistory, normalize, unitsOf, orphans, pruneTotals, renameSubjects, allSubjects, termOf, faltaTerm, canon, scope, computeTotals, status, absentByTerm, latesByTerm, summary, dayClasses, hourSlots, remaining, simulate, verdict, nextClassDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
