/* NoVoy v2 · Lector de faltas: entiende una lista copiada de cualquier plataforma (Moodle, iEduca,
   Clickedu…), la respuesta de una IA o el texto de una captura, sin IA en el servidor.
   Busca en cada línea una fecha, una asignatura y un estado; lo que no entiende NO se descarta:
   va a «dudosas» para que el alumno lo vea. Sin DOM: tests/v2-importar.test.js. */
(function (root) {
  'use strict';
  const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = (s) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim();

  // meses en castellano, catalán e inglés (abreviados o enteros)
  const MESES = [
    ['ene', 'enero', 'gen', 'gener', 'jan', 'january'], ['feb', 'febrero', 'febr', 'febrer', 'february'], ['mar', 'marzo', 'marc', 'marc', 'march'],
    ['abr', 'abril', 'apr', 'april'], ['may', 'mayo', 'maig'], ['jun', 'junio', 'juny', 'june'], ['jul', 'julio', 'juliol', 'july'],
    ['ago', 'agosto', 'ag', 'agost', 'aug', 'august'], ['sep', 'sept', 'septiembre', 'set', 'setembre', 'september'], ['oct', 'octubre', 'october'],
    ['nov', 'noviembre', 'novembre', 'november'], ['dic', 'diciembre', 'des', 'desembre', 'dec', 'december']
  ];
  const MES = {}; MESES.forEach((l, i) => l.forEach((w) => { MES[w] = i + 1; }));

  // estados de asistencia (palabras sueltas y abreviaturas de las plataformas)
  // «No justificada» va antes que «justificada»: si no, una falta sin justificar se leería como justificada
  const NOJUST = /\b(no justificad[ao]s?|no justificats?|sin justificar|sense justificar|injustificad[ao]s?|unjustified|unexcused|not excused|nj)\b/;
  const VAGA = /\b(vaga|huelga|strike)\b/;
  const TUT = /^(tut|tutoria|tutor|tutoria grup)$/;
  const PRESENTE = /\b(present|presente|assistit|asistio|asistencia correcta|attended)\b/;
  const JUST = /\b(justificad[ao]s?|justificat|justificada|justified|excused|excusad[ao]|fj)\b/;
  const RETRASO = /\b(retard|retards|retraso|retrasos|late|tard|impuntual|llegada tarde|arribada tard)\b/;
  const FALTA = /\b(falta|faltas|absent|absencia|absent[ea]|ausente|ausencia|absence|no assistit|no asistio|fnj|f)\b/;
  const SUELTA = { a: 'falta', f: 'falta', j: 'just', e: 'just', l: 'retraso', r: 'retraso', t: 'retraso', p: 'presente' };

  const pad = (n) => String(n).padStart(2, '0');
  /** Año de una fecha sin año dentro del curso: sep–dic → primer año, ene–ago → segundo. */
  const añoCurso = (m, curso) => (m >= 9 ? +curso.inicio.slice(0, 4) : +curso.fin.slice(0, 4));
  const valida = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };

  /** Primera fecha de la línea (la que aparece antes) → { iso, at } o null. */
  function fecha(line, curso) {
    const s = fold(line).replace(/[.,]/g, ' ').replace(/\bd['’]/g, '   '), c = [];
    // rango: 0 = con año, 1 = con el mes escrito, 2 = día/mes sin año (puede ser una puntuación «2/2»)
    const add = (y, m, d, at, rank) => { if (y < 100) y += 2000; if (m >= 1 && m <= 12 && valida(y, m, d)) c.push({ iso: y + '-' + pad(m) + '-' + pad(d), at, rank }); };
    let m;
    const R1 = /(\d{4})-(\d{1,2})-(\d{1,2})/g, R2 = /(?<![\d:])(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?![\d:])/g;
    const R3 = /(?<!\d)(\d{1,2})(?:\s+de)?\s+([a-z]{3,10})(?:\s+(?:de\s+)?(\d{4}))?/g, R4 = /\b([a-z]{3,10})\s+(\d{1,2})\s+(\d{4})/g;
    R1.lastIndex = 0; while ((m = R1.exec(s))) add(+m[1], +m[2], +m[3], m.index, 0);
    R2.lastIndex = 0; while ((m = R2.exec(s))) add(m[3] ? +m[3] : añoCurso(+m[2], curso), +m[2], +m[1], m.index, m[3] ? 0 : 2);
    R3.lastIndex = 0; while ((m = R3.exec(s))) if (MES[m[2]]) add(m[3] ? +m[3] : añoCurso(MES[m[2]], curso), MES[m[2]], +m[1], m.index, m[3] ? 0 : 1);
    R4.lastIndex = 0; while ((m = R4.exec(s))) if (MES[m[1]]) add(+m[3], MES[m[1]], +m[2], m.index, 0);
    if (!c.length) return null;
    return c.sort((a, b) => a.rank - b.rank || a.at - b.at)[0];
  }

  /** Estado de la línea: 'falta' | 'just' | 'retraso' | 'presente' | null. */
  function estado(line) {
    // fuera los tramos horarios («de 15:00 a 17:00», «3PM - 5PM»): su «a» no es «Absent»
    const s = fold(line).replace(/\d{1,2}[:.h]\d{2}\s*(?:-|–|a|to|fins)\s*\d{1,2}[:.h]\d{2}/g, ' ')
      .replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/g, ' ').replace(/[^a-z0-9/ ]+/g, ' ');
    if (VAGA.test(s)) return 'vaga';
    if (NOJUST.test(s)) return RETRASO.test(s) ? 'retraso' : 'falta';
    if (RETRASO.test(s) && JUST.test(s)) return 'retraso-just';
    if (RETRASO.test(s)) return 'retraso';
    if (JUST.test(s)) return 'just';
    if (FALTA.test(s.replace(/\bfalta(s)? justificad/g, ''))) return 'falta';
    if (PRESENTE.test(s)) return 'presente';
    const toks = s.split(/\s+/).filter((t) => t.length === 1 && SUELTA[t]);
    return toks.length === 1 ? SUELTA[toks[0]] : null;
  }

  /** Minutos de un tramo horario de la línea (15:00-17:00, 3PM - 5PM) o null. */
  function tramo(line) {
    const s = fold(line);
    let m = /(\d{1,2})[:.h](\d{2})\s*(?:-|–|a|to|fins)\s*(\d{1,2})[:.h](\d{2})/.exec(s);
    if (m) return { a: +m[1] * 60 + +m[2], b: +m[3] * 60 + +m[4] };
    m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/.exec(s);
    if (m) { const t = (h, mi, ap) => ((+h % 12) + (ap === 'pm' ? 12 : 0)) * 60 + (+mi || 0); return { a: t(m[1], m[2], m[3]), b: t(m[4], m[5], m[6]) }; }
    return null;
  }
  /** Hora de inicio de la línea en minutos («08:00», «8.00», «8h00» o el principio de un tramo), sin contar la fecha. */
  function horaInicio(line) {
    const t = tramo(line); if (t) return t.a;
    const m = /(?:^|[^\d])(\d{1,2})[:h](\d{2})(?!\d)/.exec(fold(line).replace(/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/g, ' '));
    return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null;
  }
  /** Horas escritas en la línea («2 h», «2 hores», «2 horas»), o null. */
  function horasEscritas(line) {
    const m = /(\d+(?:[.,]\d+)?)\s*(?:h\b|hores|horas|hours|sesiones|sessions)/.exec(fold(line));
    return m ? +m[1].replace(',', '.') : null;
  }

  /**
   * Asignatura nombrada en la línea. `subs` = asignaturas del horario; `alias(s)` = otros nombres
   * (abreviatura del catálogo…). Gana la coincidencia más larga para no confundir «Programació»
   * con «Programació web».
   */
  function asignatura(line, subs, alias) {
    const s = ' ' + words(line) + ' ';
    let best = null, bl = 0;
    subs.forEach((sub) => [sub].concat(alias ? alias(sub) : []).forEach((n) => {
      const w = words(n); if (w.length < 2) return;
      const hit = w.length <= 4 ? s.indexOf(' ' + w + ' ') >= 0 : s.indexOf(w) >= 0;
      if (hit && w.length > bl) { best = sub; bl = w.length; }
    }));
    return best;
  }

  /** JSON de una IA: [{ fecha|date, asignatura|subject|modulo, horas|hours, tipo|type, justificada }] → líneas. */
  function desdeJSON(txt) {
    const a = txt.indexOf('['), b = txt.lastIndexOf(']');
    if (a < 0 || b < a) return null;
    try {
      const arr = JSON.parse(txt.slice(a, b + 1));
      if (!Array.isArray(arr)) return null;
      return arr.map((o) => [o.fecha || o.date || o.dia || '', o.asignatura || o.subject || o.modulo || o.module || '', (o.horas || o.hours || '') && ((o.horas || o.hours) + ' h'),
        o.tipo || o.type || o.estado || '', o.justificada || o.justified ? 'justificada' : ''].join(' ; '));
    } catch (e) { return null; }
  }

  /**
   * Lee un texto. opts = { subs: [asignaturas], alias(sub) → [nombres], horasDia(fecha, sub) → horas de esa
   * asignatura ese día según el horario (0 si no hay clase), bloquesDia(fecha, sub) → [{a, b, hours}] en minutos,
   * curso: { inicio, fin }, hoy }.
   * Devuelve { faltas: [{ date, subject, hours, type, justified }], dudosas: [{ linea, motivo }], ignoradas }.
   */
  function leer(texto, opts) {
    const curso = opts.curso, hoy = opts.hoy || curso.fin;
    const lineas = desdeJSON(texto) || String(texto || '').split(/\r?\n/);
    const brutas = [], dudosas = []; let ignoradas = 0, tutoria = 0, ctxSub = null, ctxFecha = null;
    lineas.forEach((raw) => {
      const linea = raw.replace(/\s+/g, ' ').trim(); if (!linea) return;
      const f = fecha(linea, curso), sub = asignatura(linea, opts.subs, opts.alias), st = estado(linea);
      if (!f && !st) { if (sub) ctxSub = sub; else ignoradas++; return; } // cabecera de asignatura o texto suelto
      const date = f ? f.iso : ctxFecha;
      if (f) ctxFecha = f.iso;
      if (!st) { ignoradas++; return; } // una fila con fecha pero sin estado: cabecera de día o columna suelta
      if (st === 'presente') { ignoradas++; return; }
      // la tutoría no cuenta para el límite: se dice cuántas había, sin pedir que se revisen
      if (!sub && words(linea).split(' ').some((w) => TUT.test(w))) { tutoria++; return; }
      let subject = sub || ctxSub, porHora = false;
      // Con fecha y hora, manda el horario: «16/11 08:00» es la clase que tienes el lunes a las 8:00.
      // Así se entienden las faltas puestas en otro nombre (p. ej. en PROJ) o en una asignatura que ya no se llama así.
      const ini = date && opts.claseA ? horaInicio(linea) : null;
      // Solo si la asignatura viene en la propia línea (o no viene ninguna): si sale de la cabecera de la lista y ese día no la
      // tienes, mejor enseñarla como dudosa que adivinar.
      const deLinea = !!sub || !ctxSub;
      if (ini != null && deLinea && !(subject && opts.bloquesDia && opts.bloquesDia(date, subject).some((x) => x.a <= ini && ini < x.b))) {
        const c = opts.claseA(date, ini); if (c && c !== subject) { subject = c; porHora = true; }
      }
      if (!date) return dudosas.push({ linea, motivo: 'No veo la fecha' });
      if (!subject) return dudosas.push({ linea, motivo: 'No sé de qué asignatura es' });
      if (date < curso.inicio || date > hoy) return dudosas.push({ linea, motivo: 'La fecha no es de este curso' });
      const enHorario = opts.horasDia ? opts.horasDia(date, subject) : 1;
      if (opts.horasDia && !enHorario) return dudosas.push({ linea, motivo: 'Ese día no tienes ' + subject });
      let hours = horasEscritas(linea), tr = tramo(linea);
      const partes = linea.split(/\s*;\s*/); // formato del prompt: fecha ; asignatura ; horas ; tipo
      if (hours == null && partes.length >= 3 && /^\d+([.,]\d+)?$/.test(partes[2])) hours = +partes[2].replace(',', '.');
      if (hours == null && tr && opts.bloquesDia) {
        const bl = opts.bloquesDia(date, subject).filter((x) => x.a < tr.b && x.b > tr.a);
        if (bl.length) hours = bl.reduce((s, x) => s + x.hours, 0);
      }
      if (hours == null && tr) hours = Math.ceil((tr.b - tr.a) / 60); // sin horario que lo diga: redondea hacia arriba
      // una sola hora («08:00»): la plataforma pone una fila por sesión → 1 h
      if (hours == null && !tr && /(^|\D)\d{1,2}:\d{2}(\D|$)/.test(linea.replace(/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/g, ''))) hours = Math.min(1, enHorario || 1);
      const type = st.indexOf('retraso') === 0 ? 'retraso' : 'falta';
      if (hours == null) hours = type === 'retraso' ? 0 : enHorario || 1; // sin horas: la clase entera (lo seguro)
      brutas.push({ date, subject, hours: type === 'retraso' ? 0 : hours, type, justified: st === 'just' || st === 'retraso-just', vaga: st === 'vaga', tope: enHorario, porHora });
    });
    // mismo día, asignatura y tipo: se suman (una plataforma lista una fila por hora), con tope en las horas de clase
    const map = new Map();
    brutas.forEach((x) => {
      const k = x.date + '|' + x.subject + '|' + x.type + '|' + x.justified + '|' + x.vaga;
      const y = map.get(k);
      if (!y) return map.set(k, Object.assign({}, x));
      if (x.porHora) y.porHora = true;
      if (x.type === 'retraso') return; // un retraso por clase
      y.hours = Math.min(y.hours + x.hours, x.tope || Infinity);
    });
    const faltas = Array.from(map.values()).map((x) => Object.assign({ date: x.date, subject: x.subject, hours: Math.round(x.hours * 100) / 100, type: x.type, justified: x.justified }, x.vaga ? { vaga: true } : {}, x.porHora ? { porHora: true } : {}))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.subject < b.subject ? -1 : 1));
    return { faltas, dudosas, ignoradas, tutoria };
  }

  /** Une lecturas sucesivas (varias listas pegadas) sin contar dos veces la misma falta. */
  /**
   * Junta una lectura nueva (b) con lo ya leído (a). Para el mismo día, asignatura y clase de registro
   * (falta o retraso) manda la lectura nueva: si una lectura antigua se equivocó (justificada, horas…),
   * volver a pegar la lista la corrige en vez de sumarse encima.
   */
  function unir(a, b) {
    const k = (x) => x.date + '|' + x.subject + '|' + (x.type === 'retraso' ? 'r' : 'f'), nuevas = new Set(b.map(k));
    return a.filter((x) => !nuevas.has(k(x))).concat(b);
  }

  /** Totales por asignatura: { sub: { sin, just, retrasos } }. */
  function totales(faltas) {
    const out = {};
    faltas.forEach((f) => {
      const o = out[f.subject] || (out[f.subject] = { sin: 0, just: 0, retrasos: 0, vaga: 0 });
      if (f.type === 'retraso') o.retrasos++; else if (f.vaga) o.vaga += f.hours; else if (f.justified) o.just += f.hours; else o.sin += f.hours;
    });
    return out;
  }

  /** Mensaje para pegar en una IA: le pide el formato de línea que este lector entiende mejor. */
  function promptIA(subs) {
    return 'Te voy a pasar mi lista de faltas de asistencia (copiada o en captura). Devuélveme SOLO una línea por falta, sin nada más, con este formato:\n' +
      'AAAA-MM-DD ; asignatura ; horas ; falta | justificada | retraso\n' +
      'Usa exactamente uno de estos nombres de asignatura: ' + subs.join(', ') + '.\n' +
      'Si una misma clase sale en varias filas (una por hora), júntalas en una línea con sus horas. No incluyas los días que asistí.\n' +
      'Ejemplo: 2026-10-19 ; ' + (subs[0] || 'Programació') + ' ; 2 ; falta\n\nMi lista:\n';
  }

  const api = { horaInicio, fecha, estado, tramo, horasEscritas, asignatura, desdeJSON, leer, unir, totales, promptIA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NVImportar = api;
})(this);
