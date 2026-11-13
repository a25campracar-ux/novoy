/* Configuración con IA: genera el prompt, valida lo que devuelve la IA y lo convierte al formato interno. */
(function (root) {
  'use strict';
  const DAYS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
  const DAYNAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const strip = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const isDate = (s) => { const m = typeof s === 'string' && /^(\d{4})-(\d\d)-(\d\d)$/.exec(s); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]; };
  const time = (s) => { const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(s).trim()); return m ? m[1].padStart(2, '0') + ':' + m[2] : null; };
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);

  const FORMAT = `{
  "formato": "puedo-faltar/1",
  "centro": "Nombre del centro y curso",
  "limite": 25,
  "trimestres": [ { "id": "1r", "nombre": "1r trimestre", "desde": "2026-09-14", "hasta": "2026-11-27" } ],
  "festivos": [ { "desde": "2026-10-12", "hasta": "2026-10-12", "nombre": "Fiesta Nacional" } ],
  "horario": {
    "lunes": [ { "inicio": "08:00", "fin": "10:00", "asignatura": "Matemáticas", "horas": 2 } ],
    "martes": [], "miercoles": [], "jueves": [], "viernes": []
  },
  "unificar": [ { "asignatura": "Proyecto (Pol)", "dentro_de": "Programación" } ],
  "faltas": [ { "fecha": "2026-10-02", "asignatura": "Matemáticas", "horas": 2, "tipo": "falta", "justificada": false } ],
  "dudas": [ "Cualquier dato que no se vea claro en las fotos" ]
}`;

  function buildPrompt() {
    return `Actúa como mi asistente para configurar una app llamada "NoVoy". La app calcula mi porcentaje de faltas por asignatura y me dice si puedo faltar hoy. Necesita mi horario semanal y el calendario escolar en un formato exacto.

CÓMO TRABAJAR
1. Te voy a adjuntar fotos o capturas de mi horario semanal y de mi calendario escolar (o PDF). Léelas con mucha atención.
2. Si te falta algún dato, PREGÚNTAMELO antes de dar el resultado. Como mínimo confirma: qué porcentaje máximo de faltas me permiten por asignatura (normalmente 25), las fechas de inicio y fin de cada trimestre o evaluación, y si alguna asignatura cuenta junta con otra (por ejemplo varios profesores de un mismo proyecto).
3. NO inventes nada. Lo que no se vea o no sepas, no lo pongas: añádelo a "dudas".
4. Antes de responder, revisa tu trabajo: ningún bloque de un mismo día debe solaparse, "fin" debe ser posterior a "inicio", los festivos y vacaciones deben incluir TODOS los días sin clase del calendario que caigan dentro de los trimestres (puentes, vacaciones de Navidad y Semana Santa, festivos locales), y las fechas deben existir de verdad.
5. "horas" es el número de horas de clase del bloque (08:00 a 10:00 son 2 horas). Los recreos o descansos no cuentan.
6. Mi respuesta final debe ser UN SOLO bloque de código con este JSON, sin texto antes ni después de ese bloque, para que yo lo copie entero:

\`\`\`json
${FORMAT}
\`\`\`

REGLAS DEL FORMATO
- Fechas siempre AAAA-MM-DD y horas HH:MM en 24 h.
- Días del horario: lunes, martes, miercoles, jueves, viernes (sin tildes). Un día sin clase va con [].
- "festivos": una entrada por festivo o por periodo de vacaciones (si es un solo día, "desde" y "hasta" son iguales).
- "unificar": solo si algunas asignaturas cuentan juntas para el porcentaje; si no hay, usa [].
- "faltas": déjala como [] salvo que yo te dé mis faltas. Tipo: "falta" o "retraso" (el retraso no cuenta).
- No cambies ni añadas campos.

Empieza saludándome y pidiéndome las fotos.`;
  }

  function buildUpdatePrompt(snapshot) {
    return `Eres mi asistente para la app "NoVoy". Abajo tienes mi configuración y mis faltas actuales en JSON. Voy a decirte cosas como "hoy falté a Matemáticas" o "el martes no fui a ninguna clase" o "el lunes llegué tarde a Lengua".

CÓMO TRABAJAR
1. Usa mi horario del JSON para saber qué asignaturas y cuántas horas tenía ese día. Si la fecha o la asignatura no quedan claras, pregúntame.
2. Añade las faltas nuevas a la lista "faltas" (tipo "falta"; si fue un retraso, "retraso" con horas 0). Si te pido borrar o corregir una, hazlo. No cambies nada más.
3. No inventes fechas ni horas. Hoy es la fecha que yo te diga al empezar.
4. Cuando termine, dime qué has cambiado en una frase y dame el JSON COMPLETO actualizado en UN SOLO bloque de código, sin texto dentro del bloque, para copiarlo entero.

MIS DATOS ACTUALES
\`\`\`json
${snapshot}
\`\`\`

Empieza preguntándome qué ha pasado.`;
  }

  /** Importar de golpe las faltas que ya llevas apuntadas en otro sitio. Directo, sin charla. */
  function buildImportPrompt(snapshot) {
    return `Tarea: pasar mis faltas de clase ya apuntadas al JSON de la app "NoVoy". No te enrolles.

REGLAS
1. Te pegaré mis faltas tal cual las tengo (notas, tabla, Excel, capturas, lo que sea). Interprétalas con mi horario del JSON de abajo.
2. Cada falta: fecha "AAAA-MM-DD", asignatura EXACTAMENTE como aparece en mi horario, horas que tenía ese día de esa asignatura, tipo "falta" (o "retraso" con horas 0), y justificada true/false (si no lo sé, false).
3. No inventes. Si una fecha o asignatura no cuadra con mi horario, déjala fuera y dilo al final en una línea.
4. No me hagas preguntas de una en una: haz lo que puedas con lo que te dé.
5. Añade las faltas a la lista "faltas" que ya existe, sin borrar lo que haya. No toques nada más del JSON.

RESPUESTA (en este orden y nada más)
a) Máximo 3 líneas: cuántas faltas has añadido, de qué asignaturas, y qué has descartado.
b) El JSON COMPLETO actualizado en UN SOLO bloque de código, sin comentarios dentro.

MI JSON ACTUAL
\`\`\`json
${snapshot}
\`\`\`

Ahora te pego mis faltas:`;
  }

  /** Estado de la app → JSON en formato de intercambio (para "Actualizar con mi IA" y exportar). */
  function toExport(S) {
    const sch = {};
    ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach((n) => { sch[n] = (S.schedule[DAYS[n]] || []).map((b) => ({ inicio: b.start, fin: b.end, asignatura: b.subject, horas: b.hours })); });
    return JSON.stringify({
      formato: 'puedo-faltar/1', centro: S.center || '', limite: (S.settings && S.settings.limite) || 25,
      trimestres: S.terms.map((t) => ({ id: t.id, nombre: t.label, desde: t.from, hasta: t.to })),
      festivos: (S.holidays || []).map((h) => ({ desde: h.from, hasta: h.to || h.from, nombre: h.label })),
      horario: sch,
      unificar: Object.keys(S.alias || {}).map((k) => ({ asignatura: k, dentro_de: S.alias[k] })),
      faltas: S.faltas.map((f) => ({ fecha: f.date, asignatura: f.subject, horas: f.hours, tipo: f.type, justificada: !!f.justified })),
      dudas: []
    }, null, 1);
  }

  /** Saca el JSON de lo que pegue el usuario (con o sin ```json y con texto alrededor). */
  function extractJSON(text) {
    const t = String(text || '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const f = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    const body = f ? f[1] : t;
    const a = body.indexOf('{'), b = body.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('No encuentro ningún bloque de datos en lo que has pegado.');
    return JSON.parse(body.slice(a, b + 1));
  }

  /** Valida y convierte. Devuelve { ok, errors[], warnings[], config, limite, faltas, hasFaltas }. */
  function parseImport(text) {
    const errors = [], warnings = [];
    let j;
    try { j = extractJSON(text); } catch (e) {
      return { ok: false, errors: [e instanceof SyntaxError ? 'El texto pegado no es un JSON válido (¿se cortó al copiar?).' : e.message], warnings };
    }
    if (j.formato !== 'puedo-faltar/1') warnings.push('El formato no se identifica como "puedo-faltar/1"; reviso igualmente.');
    // trimestres
    const terms = [];
    (Array.isArray(j.trimestres) ? j.trimestres : []).forEach((t, i) => {
      if (!isDate(t && t.desde) || !isDate(t && t.hasta)) return errors.push('Trimestre ' + (i + 1) + ': las fechas "desde" y "hasta" no son válidas.');
      if (t.hasta < t.desde) return errors.push('Trimestre ' + (i + 1) + ': termina antes de empezar.');
      terms.push({ id: String(t.id || i + 1), label: String(t.nombre || t.id || 'Trimestre ' + (i + 1)), from: t.desde, to: t.hasta });
    });
    if (!terms.length) errors.push('Falta al menos un trimestre con fechas de inicio y fin.');
    terms.sort((a, b) => (a.from < b.from ? -1 : 1));
    for (let i = 1; i < terms.length; i++) if (terms[i].from <= terms[i - 1].to) errors.push('Los trimestres "' + terms[i - 1].label + '" y "' + terms[i].label + '" se solapan.');
    // festivos
    const holidays = [];
    (Array.isArray(j.festivos) ? j.festivos : []).forEach((h, i) => {
      const to = h && (h.hasta || h.desde);
      if (!isDate(h && h.desde) || !isDate(to)) return errors.push('Festivo ' + (i + 1) + ': fecha no válida.');
      if (to < h.desde) return errors.push('Festivo "' + (h.nombre || i + 1) + '": termina antes de empezar.');
      holidays.push({ from: h.desde, to: to, label: String(h.nombre || 'Festivo') });
    });
    // horario
    const schedule = {}, subjects = new Set();
    const src = j.horario && typeof j.horario === 'object' ? j.horario : {};
    Object.keys(src).forEach((k) => {
      const wd = DAYS[strip(k)];
      if (wd === undefined) return warnings.push('Día desconocido "' + k + '", lo ignoro.');
      const blocks = [];
      (Array.isArray(src[k]) ? src[k] : []).forEach((b, i) => {
        const where = k + ' #' + (i + 1), s = time(b && b.inicio), e = time(b && b.fin), name = String((b && b.asignatura) || '').trim();
        if (!s || !e) return errors.push(where + ': hora de inicio o fin no válida.');
        if (mins(e) <= mins(s)) return errors.push(where + ' (' + name + '): termina antes de empezar.');
        if (!name) return errors.push(where + ': falta el nombre de la asignatura.');
        const hours = +b.horas;
        if (!(hours > 0 && hours <= 12)) return errors.push(where + ' (' + name + '): "horas" debe ser un número entre 0,1 y 12.');
        if (hours * 60 > (mins(e) - mins(s)) * 1.25 + 1) errors.push(where + ' (' + name + '): ' + hours + ' h no caben entre ' + s + ' y ' + e + '.');
        blocks.push({ start: s, end: e, subject: name, hours: hours }); subjects.add(name);
      });
      blocks.sort((a, b) => mins(a.start) - mins(b.start));
      for (let i = 1; i < blocks.length; i++) if (mins(blocks[i].start) < mins(blocks[i - 1].end)) errors.push(k + ': "' + blocks[i - 1].subject + '" y "' + blocks[i].subject + '" se solapan.');
      if (blocks.length) schedule[wd] = blocks;
    });
    if (!subjects.size) errors.push('El horario no tiene ninguna clase.');
    // unificar
    const alias = {};
    (Array.isArray(j.unificar) ? j.unificar : []).forEach((u) => {
      if (!u || !subjects.has(u.asignatura)) return warnings.push('Unificar: "' + (u && u.asignatura) + '" no está en el horario, lo ignoro.');
      if (!subjects.has(u.dentro_de)) return warnings.push('Unificar: "' + u.dentro_de + '" no está en el horario, lo ignoro.');
      if (u.asignatura !== u.dentro_de) alias[u.asignatura] = u.dentro_de;
    });
    // faltas
    const hasFaltas = Array.isArray(j.faltas);
    const faltas = [];
    (hasFaltas ? j.faltas : []).forEach((f, i) => {
      if (f.fecha != null && !isDate(f.fecha)) return errors.push('Falta ' + (i + 1) + ': fecha no válida.');
      const hours = +f.horas;
      if (!(hours >= 0 && hours <= 12)) return errors.push('Falta ' + (i + 1) + ': horas no válidas.');
      if (!subjects.has(f.asignatura) && !Object.keys(alias).length) warnings.push('Falta del ' + (f.fecha || 'sin fecha') + ': "' + f.asignatura + '" no está en el horario.');
      else if (!subjects.has(f.asignatura)) warnings.push('Falta del ' + (f.fecha || 'sin fecha') + ': "' + f.asignatura + '" no está en el horario.');
      const term = f.fecha ? (terms.find((t) => f.fecha >= t.from && f.fecha <= t.to) || {}).id : (terms[0] || {}).id;
      if (f.fecha && !term) warnings.push('Falta del ' + f.fecha + ' (' + f.asignatura + '): cae fuera de los trimestres y no contará.');
      faltas.push({ id: 'i' + i, date: f.fecha || null, term: term || null, subject: String(f.asignatura), hours: hours, type: f.tipo === 'retraso' ? 'retraso' : 'falta', justified: !!f.justificada, note: f.fecha ? '' : 'sin fecha' });
    });
    const limite = j.limite == null ? null : +j.limite;
    if (limite !== null && !(limite > 0 && limite <= 100)) errors.push('El límite de faltas debe estar entre 1 y 100 (%).');
    (Array.isArray(j.dudas) ? j.dudas : []).forEach((d) => d && warnings.push('Duda de la IA: ' + d));
    if (errors.length) return { ok: false, errors, warnings };
    return { ok: true, errors, warnings, limite, hasFaltas, faltas,
      config: { center: String(j.centro || ''), terms, holidays, schedule, alias, totals: {}, totalsUnified: {} } };
  }

  const api = { buildPrompt, buildUpdatePrompt, buildImportPrompt, toExport, extractJSON, parseImport, DAYNAMES, FORMAT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTSetup = api;
})(typeof window !== 'undefined' ? window : globalThis);
