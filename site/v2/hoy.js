/* NoVoy v2 · Hoy: semáforo, una tarjeta por asignatura y apuntar el día («Fui», «Falté», «Todo el día», «Falté a…»).
   Sin DOM: se prueba en Node (tests/v2-hoy.test.js). La pantalla está en v2/app.js.

   Lo que guarda, en el mismo estado de la v1 (ft.v2):
   - faltas: { id, date, term, subject, hours, type: 'falta'|'retraso', justified, start } (igual que la v1)
   - fui: { 'AAAA-MM-DD': ['Asignatura|HH:MM', …] }  horas a las que confirmaste que fuiste (nuevo en la v2)

   Reglas que arreglan fallos de la v1:
   - El semáforo solo mira las clases que aún no has apuntado (fallo 4: contaba dos veces lo de hoy).
   - Si te has pasado, se dice «te has pasado X h», nunca «te quedan 0 h» (fallo 9).
   - El semáforo nombra la asignatura más justa, no la primera (fallo 15).
   - Solo se puede apuntar en clases que existen ese día: ni festivos ni fuera de curso (fallo 5). */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('../core.js') : root.FTCore;
  const r1 = (n) => Math.round(n * 10) / 10, r2 = (n) => Math.round(n * 100) / 100;
  const RANK = { verde: 0, amarillo: 1, rojo: 2 };
  const peorDe = (a, b) => (RANK[b] > RANK[a] ? b : a);
  const fmt = (n) => String(r1(n)).replace('.', ',');
  const clave = (subject, start) => subject + '|' + start;
  const addDays = (iso, n) => { const d = C.parse(iso); d.setDate(d.getDate() + n); return C.ymd(d); };
  const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const TUT = /^(tut|tutor|tutoria|tutoría)(\b|$)/i;

  const TONO = {
    verde: ['Tu margen lo aguanta. Con cabeza.', 'Luz verde, que no se haga costumbre.', 'Hoy el sofá gana, y tus números también.'],
    amarillo: ['Se puede, pero ya pisas el límite.', 'Margen de supervivencia. Elige bien.', 'Puedes… pero luego no me llores.'],
    rojo: ['Aquí ya no hay pella que valga.', 'Hoy toca ir. Tu yo de diciembre te lo agradece.', 'Una falta más y toca recuperar.']
  };
  const tono = (st, dia) => TONO[st][+dia.slice(-2) % TONO[st].length];

  /** Pone en orden lo guardado: ids y horas de cada falta (motor), tutoría fuera la primera vez, marcas «fui» viejas fuera. */
  function ordenar(u, hoy) {
    if (!u || !u.config) return u;
    const n = C.normalize(u.config, u.faltas || []); u.config = n.cfg; u.faltas = n.faltas;
    const cfg = u.config;
    if (!cfg.tutChecked) {
      cfg.tutChecked = true;
      const tut = C.allSubjects(cfg).filter((s) => TUT.test(String(s).trim()));
      if (tut.length) { cfg.nocount = Array.from(new Set((cfg.nocount || []).concat(tut))); cfg.ask = Object.assign({}, cfg.ask, { nocount: true }); }
    }
    if (!u.since) u.since = hoy;
    if (u.fui) { const viejo = addDays(hoy, -200); Object.keys(u.fui).forEach((k) => { if (k < viejo || !(u.fui[k] || []).length) delete u.fui[k]; }); }
    return u;
  }

  /** Estado para calcular (con los trimestres juntos si el límite va sobre el curso entero). */
  const calc = (u) => C.scope(Object.assign({}, u.config, { settings: Object.assign({}, C.DEF, u.settings), faltas: u.faltas || [] }));

  /** Horas de clase de un día, una por hora: [{ key, subject, canon, start, end, hours }]. */
  function horas(S, date) {
    const out = [];
    C.dayClasses(S, date).forEach((c) => C.hourSlots(c).forEach((sl) => out.push({ key: clave(c.subject, sl.start), subject: c.subject, canon: c.canon, start: sl.start, end: sl.end, hours: sl.hours })));
    return out;
  }

  /** Qué hay apuntado en cada hora: { key: { tipo: 'falta'|'retraso'|'fui', justified, id } }. */
  function marcas(u, date, sl) {
    const delDia = (u.faltas || []).filter((f) => f.date === date), usadas = new Set(), m = {};
    const poner = (s, f) => { usadas.add(f); m[s.key] = { tipo: f.type === 'retraso' ? 'retraso' : 'falta', justified: !!f.justified, id: f.id }; };
    sl.forEach((s) => { const f = delDia.find((x) => !usadas.has(x) && x.subject === s.subject && x.start === s.start); if (f) poner(s, f); });
    // faltas de ese día sin hora (p. ej. importadas): ocupan las primeras horas libres de su asignatura
    delDia.filter((f) => !usadas.has(f) && !f.start).forEach((f) => { const s = sl.find((x) => !m[x.key] && x.subject === f.subject); if (s) poner(s, f); });
    const fui = (u.fui && u.fui[date]) || [];
    sl.forEach((s) => { if (!m[s.key] && fui.indexOf(s.key) >= 0) m[s.key] = { tipo: 'fui' }; });
    return m;
  }

  function etiqueta(l, n) {
    if (n < 2) return '';
    if (l.sin > 0 && l.just > 0) return 'Todas las faltas';
    return l.sin > 0 ? 'Sin justificante' : 'Con justificante';
  }
  /** El límite que manda en una tarjeta: el de peor color y, a igualdad, el de menos margen. */
  const principal = (ls) => ls.reduce((a, b) => (RANK[b.status] > RANK[a.status] || (b.status === a.status && b.queda < a.queda) ? b : a), ls[0]);

  /** Números de una asignatura ahora mismo (lo que ya llevas, contando lo apuntado hoy). */
  function ahora(cur, aviso) {
    const n = cur.limits.length;
    const limites = cur.limits.map((l) => ({ etiqueta: etiqueta(l, n), limite: r1(l.limit), usado: r2(l.used), queda: r1(l.limit - l.used), coste: 0, status: C.status(r1(l.limit - l.used), aviso) }));
    const p = principal(limites);
    return { queda: p.queda, status: p.status, pct: cur.pct, limites };
  }
  /** Números si faltas `h` horas (sin justificante salvo que se diga). */
  function siFaltas(cur, h, justificada, aviso) {
    const n = cur.limits.length;
    const limites = cur.limits.map((l) => {
      const w = justificada ? l.just : l.sin, usado = r2(l.used + w * h), queda = r1(l.limit - usado);
      return { etiqueta: etiqueta(l, n), limite: r1(l.limit), usado, queda, coste: r2(w * h), status: C.status(queda, aviso) };
    });
    const p = principal(limites);
    // el % que se enseña es el del límite principal del motor (el que cuenta las faltas sin justificar)
    const lp = cur.limits.find((l) => l.sin > 0 && r1(l.limit - l.used) === cur.margin) || cur.limits.find((l) => l.sin > 0) || cur.limits[0];
    const w = justificada ? lp.just : lp.sin;
    return { queda: p.queda, status: p.status, pct: r1((cur.absent + w * h) / cur.total * 100), limites };
  }

  /** Tarjetas del día: una por asignatura, con sus horas y lo apuntado. */
  function grupos(u, S, date, sl, m) {
    const aviso = +S.settings.aviso, term = C.termOf(S, date);
    const sum = term ? Object.fromEntries(C.summary(S, term).map((x) => [x.name, x])) : {};
    const out = [], by = {};
    sl.forEach((s) => { const k = s.canon; if (!by[k]) { by[k] = { name: k, horas: [] }; out.push(by[k]); } by[k].horas.push(Object.assign({}, s, { marca: m[s.key] || null })); });
    return out.map((g) => {
      const cur = sum[g.name], pend = g.horas.filter((x) => !x.marca), hecho = g.horas.filter((x) => x.marca);
      const tipos = hecho.map((x) => x.marca.tipo);
      const estado = pend.length === g.horas.length ? 'pendiente' : pend.length ? 'parcial' : tipos.indexOf('falta') >= 0 ? 'falta' : tipos.indexOf('retraso') >= 0 ? 'retraso' : 'fui';
      const total = r2(g.horas.reduce((a, x) => a + x.hours, 0)), hPend = r2(pend.reduce((a, x) => a + x.hours, 0));
      const o = { name: g.name, horas: g.horas, pendientes: pend, estado, total, hPend, inicio: g.horas[0].start };
      if (!cur || !cur.limits || !cur.limits.length || !(cur.total > 0)) { o.sinDatos = true; return o; }
      o.ahora = ahora(cur, aviso);
      if (hPend > 0) { o.si = siFaltas(cur, hPend, false, aviso); o.conJust = siFaltas(cur, hPend, true, aviso); }
      return o;
    });
  }

  /** Semáforo con las clases que quedan por apuntar. */
  function semaforo(gs, date, faltadoHoy) {
    const pend = gs.filter((g) => g.hPend > 0);
    if (!pend.length) {
      const st = gs.filter((g) => g.ahora).reduce((w, g) => peorDe(w, g.ahora.status), 'verde');
      return { hecho: true, status: st, titulo: 'Hoy ya está apuntado.', frase: faltadoHoy > 0 ? 'Has faltado a ' + fmt(faltadoHoy) + ' h hoy.' : 'Has ido a todo. Así da gusto.' };
    }
    let st = 'verde', stJ = 'verde';
    pend.forEach((g) => {
      if (g.sinDatos) { st = peorDe(st, 'amarillo'); stJ = peorDe(stJ, 'amarillo'); return; }
      st = peorDe(st, g.si.status); stJ = peorDe(stJ, g.conJust.status);
    });
    const soloJust = st === 'rojo' && stJ !== 'rojo';
    // la más justa de las que tienen el peor color (fallo 15)
    const cand = pend.filter((g) => g.si && g.si.status === st).sort((a, b) => a.si.queda - b.si.queda), peor = cand[0] || null;
    const out = { hecho: false, status: soloJust ? 'amarillo' : st, rojo: st === 'rojo', soloJust, peor: peor && { name: peor.name, queda: peor.si.queda }, tono: tono(st, date) };
    if (soloJust) { out.titulo = 'Solo con justificante.'; out.frase = 'Sin él, te pasarías en ' + peor.name + '.'; }
    else if (st === 'rojo') { out.titulo = 'Hoy no.'; out.frase = peor ? 'Si faltas, te pasas ' + fmt(-peor.si.queda) + ' h en ' + peor.name + '.' : out.tono; }
    else if (st === 'amarillo') { out.titulo = 'Mejor no.'; out.frase = peor ? 'Si faltas, en ' + peor.name + ' te quedarían ' + fmt(peor.si.queda) + ' h.' : 'Hay una asignatura sin datos: no sé cuánto te queda.'; }
    else { out.titulo = 'Puedes faltar.'; out.frase = out.tono; }
    return out;
  }

  /** Todo lo que enseña la pantalla Hoy para una fecha. */
  function dia(u, date) {
    const S = calc(u), termReal = C.termOf(u.config, date), t = (u.config.terms || []).find((x) => x.id === termReal);
    const base = { date, trimestre: t ? t.label : null, comprobado: u.comprobado ? diasEntre(u.comprobado, date) : null };
    const hol = (S.holidays || []).find((h) => date >= h.from && date <= (h.to || h.from));
    const sl = C.termOf(S, date) ? horas(S, date) : [];
    if (!sl.length) {
      const motivo = hol ? (hol.label || 'Festivo') + '.' : !C.termOf(S, date) ? 'Hoy no es día de curso.' : 'Hoy no tienes clase.';
      const nx = C.nextClassDay(S, date), prox = nx && C.termOf(S, nx) ? { date: nx, grupos: grupos(u, S, nx, horas(S, nx), marcas(u, nx, horas(S, nx))) } : null;
      return Object.assign(base, { libre: true, motivo, proximo: prox, semaforo: { status: 'verde', titulo: 'Día libre.', frase: motivo } });
    }
    const m = marcas(u, date, sl), gs = grupos(u, S, date, sl, m);
    const faltado = r2(sl.filter((s) => m[s.key] && m[s.key].tipo === 'falta').reduce((a, s) => a + s.hours, 0));
    return Object.assign(base, { libre: false, grupos: gs, semaforo: semaforo(gs, date, faltado), pendientes: sl.filter((s) => !m[s.key]).map((s) => s.key) });
  }
  const diasEntre = (a, b) => Math.round((C.parse(b) - C.parse(a)) / 864e5);

  /** Clases de un día para «Falté a…»: bloques seguidos de una asignatura, con sus horas y lo apuntado. */
  function clases(u, date) {
    const S = calc(u); if (!C.termOf(S, date)) return [];
    const sl = horas(S, date), m = marcas(u, date, sl);
    return C.dayClasses(S, date).map((b) => {
      const hs = C.hourSlots(b).map((x) => { const key = clave(b.subject, x.start); return { key, start: x.start, end: x.end, hours: x.hours, marca: m[key] || null }; });
      return { subject: b.subject, name: b.canon, start: b.start, end: b.end, hours: r2(hs.reduce((a, x) => a + x.hours, 0)), horas: hs };
    });
  }

  /** Días de clase recientes que se pueden apuntar (hoy y hacia atrás), como mucho `n`. */
  function diasRecientes(u, hoy, n) {
    const S = calc(u), out = [];
    for (let i = 0; i <= 21 && out.length < (n || 8); i++) { const k = addDays(hoy, -i); if (C.termOf(S, k) && C.dayClasses(S, k).length) out.push(k); }
    return out;
  }

  /** Días de clase de la última semana sin nada apuntado (ni «fui» ni faltas), del más reciente al más antiguo. */
  function sinApuntar(u, hoy) {
    const S = calc(u), out = [], desde = u.since || hoy;
    for (let i = 1; i <= 7; i++) {
      const k = addDays(hoy, -i); if (k < desde || (u.okDay && k <= u.okDay)) break;
      if (!C.termOf(S, k)) continue;
      const sl = horas(S, k); if (!sl.length) continue;
      const m = marcas(u, k, sl); if (sl.some((s) => m[s.key])) continue;
      out.push(k);
    }
    return out;
  }

  /**
   * Deja apuntadas unas horas de un día. sel = { 'Asignatura|HH:MM': 'falta' | 'retraso' | 'fui' | null }
   * (null quita lo que hubiera). Lo que ya había en esas horas se sustituye; el resto del día no se toca.
   * opts.justificada: las faltas y retrasos nuevos llevan justificante.
   * Devuelve { user, faltas, horas, fui } (estado nuevo, sin tocar el de entrada) o { error }.
   */
  function fijar(u, date, sel, opts) {
    const S = calc(u);
    if (!C.termOf(S, date)) return { error: 'Ese día no es de curso.' };
    const sl = horas(S, date); if (!sl.length) return { error: 'Ese día no tienes clase.' };
    const by = Object.fromEntries(sl.map((s) => [s.key, s])), keys = Object.keys(sel || {});
    if (keys.some((k) => !by[k])) return { error: 'Esa clase no es de ese día.' };
    const m = marcas(u, date, sl), out = JSON.parse(JSON.stringify(u)), quitar = new Set(keys.map((k) => m[k] && m[k].id).filter(Boolean));
    out.faltas = (out.faltas || []).filter((f) => !quitar.has(f.id));
    out.fui = out.fui || {};
    const fui = (out.fui[date] || []).filter((k) => keys.indexOf(k) < 0), term = C.termOf(u.config, date);
    let nF = 0, h = 0, nFui = 0;
    keys.forEach((k) => {
      const s = by[k], t = sel[k];
      if (t === 'fui') { fui.push(k); nFui++; return; }
      if (t !== 'falta' && t !== 'retraso') return;
      out.faltas.push({ id: uid(), date, term, subject: s.subject, hours: t === 'retraso' ? 0 : s.hours, type: t, justified: !!(opts && opts.justificada), start: s.start });
      if (t === 'falta') { nF++; h = r2(h + s.hours); }
    });
    if (fui.length) out.fui[date] = fui; else delete out.fui[date];
    return { user: out, faltas: nF, horas: h, fui: nFui };
  }
  const todas = (keys, tipo) => Object.fromEntries(keys.map((k) => [k, tipo]));
  /** «Falté todo el día»: todas las horas que quedan por apuntar. */
  function todoElDia(u, date, opts) { const d = dia(u, date); if (d.libre) return { error: 'Hoy no tienes clase.' }; return fijar(u, date, todas(d.pendientes, 'falta'), opts); }
  /** «Fui a todo»: lo que queda por apuntar, como asistido. */
  function fuiATodo(u, date) { const S = calc(u); if (!C.termOf(S, date)) return { error: 'Ese día no es de curso.' }; const sl = horas(S, date), m = marcas(u, date, sl); return fijar(u, date, todas(sl.filter((s) => !m[s.key]).map((s) => s.key), 'fui')); }

  const api = { ordenar, calc, horas, marcas, dia, clases, diasRecientes, sinApuntar, fijar, todoElDia, fuiATodo, todas, fmt, clave, addDays };
  if (isNode) module.exports = api; else root.NVHoy = api;
})(this);
