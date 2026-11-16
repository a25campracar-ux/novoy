/* NoVoy v2 · Rejilla de horario: filas (franjas), casillas pintadas y conversión al formato del motor.
   Sin DOM: se prueba en Node (tests/v2-horario.test.js).
   Una sesión de clase cuenta como 1 h aunque dure 55 min: los centros cuentan sesiones. */
(function (root) {
  'use strict';
  const DIAS = ['1', '2', '3', '4', '5'];
  const NOMBRES = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };
  const CORTO = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V' };
  const min = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : NaN; };
  const hhmm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  /**
   * Franjas del día: `n` clases de `dur` minutos desde `inicio`, con un recreo opcional
   * de `recreo.dur` minutos después de la clase número `recreo.tras`.
   */
  function franjas(inicio, dur, n, recreo) {
    const out = []; let t = min(inicio); dur = +dur; n = Math.max(1, Math.min(14, +n || 0));
    if (!(t >= 0) || !(dur >= 20 && dur <= 240)) return out;
    for (let i = 0; i < n; i++) {
      out.push({ start: hhmm(t), end: hhmm(t + dur) });
      t += dur;
      if (recreo && +recreo.tras === i + 1 && +recreo.dur > 0) t += +recreo.dur;
    }
    return out;
  }
  /** Hay un recreo entre la franja i y la i+1 si no son seguidas: devuelve sus minutos (0 si no). */
  const huecoTras = (rows, i) => (rows[i + 1] ? Math.max(0, min(rows[i + 1].start) - min(rows[i].end)) : 0);

  /** Rejilla vacía: { dia: { fila: asignatura } }. */
  const vacia = () => ({ 1: {}, 2: {}, 3: {}, 4: {}, 5: {} });

  /** Asignaturas pintadas, en orden de aparición (lunes primero). */
  function asignaturas(grid) {
    const seen = []; DIAS.forEach((d) => Object.keys(grid[d] || {}).sort((a, b) => a - b).forEach((r) => { const s = grid[d][r]; if (s && seen.indexOf(s) < 0) seen.push(s); }));
    return seen;
  }

  /** Rejilla → horario del motor: { '1': [{ start, end, subject, hours }] }. Une franjas seguidas de la misma asignatura. */
  function aHorario(rows, grid) {
    const out = {};
    DIAS.forEach((d) => {
      const g = grid[d] || {}, list = [];
      rows.forEach((row, i) => {
        const s = g[i]; if (!s) return;
        const prev = list[list.length - 1];
        // se une con la anterior si es la misma asignatura y empieza justo cuando acaba (sin recreo en medio)
        if (prev && prev.subject === s && prev.end === row.start) { prev.end = row.end; prev.hours++; prev._last = i; }
        else list.push({ start: row.start, end: row.end, subject: s, hours: 1, _last: i });
      });
      if (list.length) out[d] = list.map((b) => ({ start: b.start, end: b.end, subject: b.subject, hours: b.hours }));
    });
    return out;
  }

  /** Horario del motor → rejilla editable. Las franjas salen de las horas de inicio y fin que aparecen. */
  function deHorario(schedule) {
    // Una fila por cada sesión distinta que aparece (inicio–fin). Si un día tiene recreo y otro no, salen filas que
    // se solapan (18:00–19:00 y 18:20–19:20): así volver a guardar sin tocar da exactamente el mismo horario (fallo 7).
    const filas = new Map(), blocks = [];
    DIAS.forEach((d) => (schedule[d] || []).forEach((b) => {
      const s = min(b.start), e = min(b.end), h = Math.max(1, Math.round(+b.hours || 1));
      if (!(s >= 0 && e > s)) return;
      const step = (e - s) / h, ses = [];
      for (let k = 0; k < h; k++) { const a = Math.round(s + k * step), z = k === h - 1 ? e : Math.round(s + (k + 1) * step); filas.set(a + '-' + z, [a, z]); ses.push(a + '-' + z); }
      blocks.push({ d, ses, subject: b.subject });
    }));
    const orden = Array.from(filas.values()).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const rows = orden.map((x) => ({ start: hhmm(x[0]), end: hhmm(x[1]) })), idx = new Map(orden.map((x, i) => [x[0] + '-' + x[1], i]));
    const grid = vacia();
    blocks.forEach((x) => x.ses.forEach((k) => { grid[x.d][idx.get(k)] = x.subject; }));
    return { rows, grid };
  }

  /** Lectura de una captura (FTShot.read) → { rows, grid, subjects }. */
  function deCaptura(r) {
    const grid = vacia();
    Object.keys(r.blocks || {}).forEach((d) => (r.blocks[d] || []).forEach((b) => { for (let i = 0; i < b.n; i++) grid[d][b.r0 + i] = b.subject; }));
    // el lector de capturas (shot.js) da las horas como { s, e }; se aceptan también { start, end }
    const rows = (r.rows || []).map((x) => ({ start: x.start || x.s, end: x.end || x.e }));
    return { rows, grid, subjects: (r.subjects || []).slice(), horasDudosas: !!r.guessed || rows.some((x) => !/^\d\d:\d\d$/.test(x.start || '') || !/^\d\d:\d\d$/.test(x.end || '')) };
  }

  /** Horas por semana de cada asignatura. */
  function horasSemana(schedule) {
    const out = {};
    DIAS.forEach((d) => (schedule[d] || []).forEach((b) => { out[b.subject] = (out[b.subject] || 0) + (+b.hours || 0); }));
    return out;
  }

  /** Huella estable de un horario, para reconocer plantillas iguales. */
  function huella(schedule) {
    return DIAS.map((d) => d + ':' + (schedule[d] || []).map((b) => b.start + '-' + b.end + '=' + String(b.subject).trim().toLowerCase() + '*' + b.hours).join(',')).join('|');
  }

  /** Quita del horario las asignaturas que el alumno no cursa. */
  function sinAsignaturas(schedule, quitar) {
    const q = new Set(quitar || []), out = {};
    DIAS.forEach((d) => { const l = (schedule[d] || []).filter((b) => !q.has(b.subject)); if (l.length) out[d] = l.map((b) => Object.assign({}, b)); });
    return out;
  }

  const api = { DIAS, NOMBRES, CORTO, min, hhmm, franjas, huecoTras, vacia, asignaturas, aHorario, deHorario, deCaptura, horasSemana, huella, sinAsignaturas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NVHorario = api;
})(this);
