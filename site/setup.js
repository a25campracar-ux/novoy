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
  "formato": "puedo-faltar/2",
  "centro": "Nombre del centro y curso",
  "limite": 25,
  "trimestres": [
    { "id": "1r", "nombre": "1r trimestre", "desde": "2026-09-14", "hasta": "2026-12-18",
      "horas_totales": [ { "asignatura": "Matematicas", "horas": 99 } ] }
  ],
  "festivos": [ { "desde": "2026-10-12", "hasta": "2026-10-12", "nombre": "Fiesta Nacional" } ],
  "horario": {
    "lunes": [ { "inicio": "08:00", "fin": "10:00", "asignatura": "Matematicas", "horas": 2 } ],
    "martes": [], "miercoles": [], "jueves": [], "viernes": []
  },
  "tramos": [
    { "nombre": "A partir de febrero", "desde": "2027-02-08", "hasta": "2027-06-19",
      "horario": { "lunes": [], "martes": [], "miercoles": [], "jueves": [], "viernes": [] } }
  ],
  "unificar": [ { "asignatura": "Proyecto (Pol)", "dentro_de": "Programacion" } ],
  "no_cuentan": [ "Tutoria" ],
  "reglas": { "ambito": "trimestre", "justificadas": "juntas", "limite_justificadas": 25, "semanas_curso": 33, "retrasos_por_falta": 0 },
  "faltas": [ { "fecha": null, "asignatura": "Matematicas", "horas": 2, "tipo": "falta", "justificada": false } ],
  "dudas": [ "Lo que no se vea claro en las fotos" ]
}`;

  function buildPrompt() {
    return `Eres el asistente de configuracion de "NoVoy", una app que dice a un estudiante cuantas horas puede faltar a cada asignatura sin pasarse del limite de faltas de su centro.

TU TRABAJO
Hazme una encuesta corta, en pasos, y al final dame un JSON para pegar en la app.

COMO PREGUNTAR
- Un paso cada vez. En cada paso, como mucho 3 preguntas cortas y numeradas. Espera mi respuesta antes de seguir.
- Habla claro y sencillo, como a alguien que no sabe nada de esto. Nada de palabras tecnicas.
- Si te mando una foto o captura (horario, calendario, Moodle), leela tu y pregunta solo lo que no se vea.
- Si no se algo, te digo "no lo se": entonces usa lo que pone en "SI NO LO SABE" y apuntalo en "dudas".
- No inventes nada.
- Al empezar, dime en una linea que son 6 pasos y que tardamos unos 3 minutos.

LOS 6 PASOS
1. Centro y estudios: nombre del centro, que estudio (por ejemplo DAW) y que curso (1o o 2o).
2. Horario: pideme una foto o captura de mi horario semanal. Si no tengo, que te lo diga dia a dia (hora de inicio y fin, asignatura). Pregunta cuanto dura cada clase si no se ve.
3. Calendario: fechas de inicio y fin de cada trimestre. Los festivos y vacaciones los pones tu (calendario escolar oficial de mi comunidad para este curso) y me los resumes en una linea para que los confirme.
4. Reglas del centro (lo mas importante, explicalo con un ejemplo):
   a) Que porcentaje de faltas me permiten (casi siempre 25%). SI NO LO SABE: 20.
   b) Las faltas justificadas: ¿cuentan igual que las otras, no cuentan, o tienen su propio porcentaje? SI NO LO SABE: cuentan igual.
   c) El limite, ¿se mira en cada trimestre o sobre el curso entero? SI NO LO SABE: trimestre.
   d) ¿Cuantas semanas de clase tiene el curso? SI NO LO SABE: 33.
   e) ¿Los retrasos suman faltas? (por ejemplo 3 retrasos = 1 hora). SI NO LO SABE: 0.
5. Casos especiales, solo si aplican (pregunta con un si/no primero): alguna clase que no cuenta faltas (por ejemplo la tutoria), semanas de proyecto, o un horario que cambia a mitad de curso.
6. Faltas que ya llevo: cuantas horas he faltado ya a cada asignatura este trimestre. SI NO LO SABE: 0 y avisame de que lo mire en el Moodle.

CUANDO TERMINES
Dame 2 lineas de resumen y despues el JSON en UN SOLO bloque de codigo. Nada despues.

REGLAS DEL JSON
- Fechas AAAA-MM-DD, horas HH:MM en 24 h. Dias: lunes, martes, miercoles, jueves, viernes (sin tildes). Un dia sin clase va con [].
- Pon un trimestre por cada trimestre real, aunque el limite sea sobre el curso entero (eso va en "reglas").
- "horas" de un bloque son sus horas de clase: de 08:00 a 10:00 son 2. Si el recreo parte un bloque, parte el bloque en dos.
- Escribe cada asignatura SIEMPRE con el mismo nombre en todo el JSON.
- "reglas.justificadas": "juntas" (cuentan igual, mismo %), "no_cuentan" o "separadas" (tienen su propio %, que va en "limite_justificadas").
- "faltas" de antes: una entrada por asignatura con "fecha": null y las horas que llevo.
- "horas_totales" solo si tengo un papel oficial con las horas de cada modulo; si no, quita el campo.
- "tramos", "unificar", "no_cuentan" y "proyecto": [] o null si no aplican.
- No añadas ni quites campos.

\`\`\`json
${FORMAT}
\`\`\`

Empieza con el paso 1.`;
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
    const schOf = (src) => { const o = {}; ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach((n) => { o[n] = ((src || {})[DAYS[n]] || []).map((b) => ({ inicio: b.start, fin: b.end, asignatura: b.subject, horas: b.hours })); }); return o; };
    const sch = schOf(S.schedule);
    return JSON.stringify({
      formato: 'puedo-faltar/2', centro: S.center || '', limite: (S.settings && S.settings.limite) || 25,
      trimestres: S.terms.map((t) => { const o = { id: t.id, nombre: t.label, desde: t.from, hasta: t.to }; const h = (S.totals || {})[t.id]; if (h && Object.keys(h).length) o.horas_totales = Object.keys(h).map((k) => ({ asignatura: k, horas: h[k] })); return o; }),
      festivos: (S.holidays || []).map((h) => ({ desde: h.from, hasta: h.to || h.from, nombre: h.label })),
      horario: sch,
      tramos: (S.periods || []).map((p) => ({ nombre: p.label || 'Tramo', desde: p.from, hasta: p.to, horario: schOf(p.schedule) })),
      historial: (S.history || []).map((x) => ({ hasta: x.to, horario: schOf(x.schedule) })),
      unificar: Object.keys(S.alias || {}).map((k) => ({ asignatura: k, dentro_de: S.alias[k] })),
      reglas: (() => { const st = S.settings || {}, jm = st.justModo || (st.justificadasCuentan === false ? 'nocuentan' : 'juntas'); return { ambito: st.ambito || 'trimestre', retrasos_por_falta: +(st.retrasosPorFalta || 0), justificadas_cuentan: jm !== 'nocuentan', justificadas: jm === 'nocuentan' ? 'no_cuentan' : jm, limite_justificadas: +(st.limiteJust || st.limite || 25), semanas_curso: +(st.semanas || 33) }; })(),
      modulos: (S.subjects || []).map((m) => ({ id: m.id, nombre: m.name })),
      proyecto: S.project && S.project.name ? { nombre: S.project.name, semanas: +S.project.weeks || 0, horario: schOf(S.project.schedule), activo: (S.project.ranges || []).map((r) => (r.to ? { desde: r.from, hasta: r.to } : { desde: r.from })) } : null,
      no_cuentan: (S.nocount || []).slice(),
      catalogo: S.catalog || null,
      desactivadas: Object.keys(S.disabled || {}).map((k) => { const o = { asignatura: k, en_su_lugar: S.disabled[k].cover }; if (S.disabled[k].on) o.desde = S.disabled[k].on; return o; }),
      faltas: S.faltas.map((f) => { const o = { fecha: f.date, asignatura: f.subject, horas: f.hours, tipo: f.type, justificada: !!f.justified }; if (f.start) o.inicio = f.start; if (f.id) o.id = f.id; return o; }),
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
    if (j.formato !== 'puedo-faltar/2' && j.formato !== 'puedo-faltar/1') warnings.push('El formato no se identifica como "puedo-faltar"; reviso igualmente.');
    // trimestres
    const terms = [];
    (Array.isArray(j.trimestres) ? j.trimestres : []).forEach((t, i) => {
      if (!isDate(t && t.desde) || !isDate(t && t.hasta)) return errors.push('Trimestre ' + (i + 1) + ': las fechas "desde" y "hasta" no son válidas.');
      if (t.hasta < t.desde) return errors.push('Trimestre ' + (i + 1) + ': termina antes de empezar.');
      const term = { id: String(t.id || i + 1), label: String(t.nombre || t.id || 'Trimestre ' + (i + 1)), from: t.desde, to: t.hasta };
      if (Array.isArray(t.horas_totales) && t.horas_totales.length) {
        term.hours = {};
        t.horas_totales.forEach((x) => {
          const nm = String((x && x.asignatura) || '').trim(), hv = +(x && x.horas);
          if (!nm) return warnings.push('Horas totales de "' + term.label + '": falta el nombre de una asignatura.');
          if (!(hv > 0 && hv <= 2000)) return errors.push('Horas totales de "' + nm + '" en "' + term.label + '": ' + (x && x.horas) + ' no es un número de horas válido.');
          term.hours[nm] = hv;
        });
      }
      terms.push(term);
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
    // horario (y, más abajo, el de cada tramo: misma validación)
    const subjects = new Set();
    const readSchedule = (src, tag) => {
      const schedule = {};
      Object.keys(src && typeof src === 'object' ? src : {}).forEach((k) => {
      const wd = DAYS[strip(k)];
      if (wd === undefined) return warnings.push('Día desconocido "' + k + '", lo ignoro.');
      const blocks = [];
      (Array.isArray(src[k]) ? src[k] : []).forEach((b, i) => {
        const where = tag + k + ' #' + (i + 1), s = time(b && b.inicio), e = time(b && b.fin), name = String((b && b.asignatura) || '').trim();
        if (!s || !e) return errors.push(where + ': hora de inicio o fin no válida.');
        if (mins(e) <= mins(s)) return errors.push(where + ' (' + name + '): termina antes de empezar.');
        if (!name) return errors.push(where + ': falta el nombre de la asignatura.');
        const hours = +b.horas;
        if (!(hours > 0 && hours <= 12)) return errors.push(where + ' (' + name + '): "horas" debe ser un número entre 0,1 y 12.');
        if (hours * 60 > (mins(e) - mins(s)) * 1.25 + 1) errors.push(where + ' (' + name + '): ' + hours + ' h no caben entre ' + s + ' y ' + e + '.');
        if (hours * 60 < mins(e) - mins(s) - 1 && Math.abs(hours - Math.round(hours)) < 0.01) warnings.push(where + ' (' + name + '): dura ' + (mins(e) - mins(s)) + ' min pero son ' + hours + ' h. Si hay un recreo dentro, mejor parte el bloque en dos.');
        blocks.push({ start: s, end: e, subject: name, hours: hours }); subjects.add(name);
      });
      blocks.sort((a, b) => mins(a.start) - mins(b.start));
      for (let i = 1; i < blocks.length; i++) if (mins(blocks[i].start) < mins(blocks[i - 1].end)) errors.push(k + ': "' + blocks[i - 1].subject + '" y "' + blocks[i].subject + '" se solapan.');
      if (blocks.length) schedule[wd] = blocks;
      });
      return schedule;
    };
    const schedule = readSchedule(j.horario, '');
    // tramos: periodos con un horario distinto
    const periods = [];
    (Array.isArray(j.tramos) ? j.tramos : []).forEach((p, i) => {
      const nm = String((p && p.nombre) || 'Tramo ' + (i + 1));
      if (!isDate(p && p.desde) || !isDate(p && p.hasta)) return errors.push('Tramo "' + nm + '": las fechas "desde" y "hasta" no son válidas.');
      if (p.hasta < p.desde) return errors.push('Tramo "' + nm + '": termina antes de empezar.');
      const sch = readSchedule(p.horario, nm + ' ');
      if (!Object.keys(sch).length) return warnings.push('Tramo "' + nm + '": no tiene ninguna clase, lo ignoro.');
      periods.push({ label: nm, from: p.desde, to: p.hasta, schedule: sch });
    });
    periods.sort((a, b) => (a.from < b.from ? -1 : 1));
    for (let i = 1; i < periods.length; i++) if (periods[i].from <= periods[i - 1].to) errors.push('Los tramos "' + periods[i - 1].label + '" y "' + periods[i].label + '" se solapan.');
    if (!subjects.size) errors.push('El horario no tiene ninguna clase.');
    // historial: horarios anteriores, cada uno válido hasta "hasta" (se guarda al cambiar el horario a mitad de curso)
    const history = [];
    (Array.isArray(j.historial) ? j.historial : []).forEach((x, i) => {
      if (!isDate(x && x.hasta)) return warnings.push('Horario anterior ' + (i + 1) + ': fecha no válida, lo ignoro.');
      const sch = readSchedule(x.horario, 'Horario anterior ' + (i + 1) + ' ');
      if (Object.keys(sch).length) history.push({ to: x.hasta, schedule: sch });
    });
    // unificar
    const alias = {};
    (Array.isArray(j.unificar) ? j.unificar : []).forEach((u) => {
      if (!u || !subjects.has(u.asignatura)) return warnings.push('Unificar: "' + (u && u.asignatura) + '" no está en el horario, lo ignoro.');
      if (!subjects.has(u.dentro_de)) return warnings.push('Unificar: "' + u.dentro_de + '" no está en el horario, lo ignoro.');
      if (u.asignatura !== u.dentro_de) alias[u.asignatura] = u.dentro_de;
    });
    // proyecto: franjas que en semana de proyecto pasan a ser del proyecto; se activa y termina a mano
    let project = null;
    if (j.proyecto && typeof j.proyecto === 'object' && j.proyecto.nombre) {
      const sch = readSchedule(j.proyecto.horario, 'Proyecto ');
      const ranges = (Array.isArray(j.proyecto.activo) ? j.proyecto.activo : []).filter((r) => r && isDate(r.desde) && (r.hasta == null || isDate(r.hasta))).map((r) => ({ from: r.desde, to: r.hasta || null }));
      project = { name: String(j.proyecto.nombre), weeks: Math.max(0, +j.proyecto.semanas || 0), schedule: sch, ranges };
      subjects.add(project.name);
    }
    // desactivadas: aún no se imparten; su franja la cubre otra hasta "desde"
    const disabled = {};
    (Array.isArray(j.desactivadas) ? j.desactivadas : []).forEach((x) => {
      if (!x || !subjects.has(x.asignatura) || !subjects.has(x.en_su_lugar) || x.asignatura === x.en_su_lugar) return warnings.push('Desactivada: "' + (x && x.asignatura) + '" o su sustituta no están en el horario, lo ignoro.');
      if (x.desde != null && !isDate(x.desde)) return warnings.push('Desactivada "' + x.asignatura + '": fecha no válida, la ignoro.');
      disabled[x.asignatura] = { cover: x.en_su_lugar, on: x.desde || null };
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
      const tdy = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10), term = f.fecha ? (terms.find((t) => f.fecha >= t.from && f.fecha <= t.to) || {}).id : (terms.find((t) => tdy >= t.from && tdy <= t.to) || terms[0] || {}).id;
      if (f.fecha && !term) warnings.push('Falta del ' + f.fecha + ' (' + f.asignatura + '): cae fuera de los trimestres y no contará.');
      const st = f.inicio != null ? time(f.inicio) : null;
      faltas.push({ id: typeof f.id === 'string' && f.id ? f.id : null, start: st || undefined, date: f.fecha || null, term: term || null, subject: String(f.asignatura), hours: hours, type: f.tipo === 'retraso' ? 'retraso' : 'falta', justified: !!f.justificada, note: f.fecha ? '' : 'previas' });
    });
    const limite = j.limite == null ? null : +j.limite;
    // reglas del centro (opcionales): solo se aplican si vienen
    let reglas = null;
    if (j.reglas && typeof j.reglas === 'object') {
      reglas = {};
      if (j.reglas.ambito === 'curso' || j.reglas.ambito === 'trimestre') reglas.ambito = j.reglas.ambito;
      const n = +j.reglas.retrasos_por_falta; if (n >= 0 && n <= 50) reglas.retrasosPorFalta = Math.floor(n);
      if (typeof j.reglas.justificadas_cuentan === 'boolean') reglas.justificadasCuentan = j.reglas.justificadas_cuentan;
      const jm = { juntas: 'juntas', no_cuentan: 'nocuentan', nocuentan: 'nocuentan', separadas: 'separadas' }[strip(j.reglas.justificadas || '')];
      if (jm) { reglas.justModo = jm; reglas.justificadasCuentan = jm !== 'nocuentan'; }
      const lj = +j.reglas.limite_justificadas; if (lj > 0 && lj <= 100) reglas.limiteJust = lj;
      const sw = +j.reglas.semanas_curso; if (sw >= 1 && sw <= 52) reglas.semanas = Math.round(sw);
    }
    if (limite !== null && !(limite > 0 && limite <= 100)) errors.push('El límite de faltas debe estar entre 1 y 100 (%).');
    (Array.isArray(j.dudas) ? j.dudas : []).forEach((d) => d && warnings.push('Duda de la IA: ' + d));
    if (errors.length) return { ok: false, errors, warnings };
    const totals = {};
    terms.forEach((t) => {
      if (!t.hours) return;
      Object.keys(t.hours).forEach((nm) => { if (!subjects.has(nm)) warnings.push('Horas totales: "' + nm + '" no aparece en ningún horario.'); });
      totals[t.id] = t.hours; delete t.hours;
    });
    return { ok: true, errors, warnings, limite, reglas, hasFaltas, faltas,
      config: { center: String(j.centro || ''), terms, holidays, schedule, periods, history, alias, totals, totalsUnified: {}, disabled, project, nocount: (Array.isArray(j.no_cuentan) ? j.no_cuentan : []).filter((x) => subjects.has(x)), catalog: j.catalogo && typeof j.catalogo === 'object' ? j.catalogo : null,
        subjects: (Array.isArray(j.modulos) ? j.modulos : []).filter((m) => m && typeof m.id === 'string' && m.nombre).map((m) => ({ id: m.id, name: String(m.nombre) })) } };
  }

  const api = { buildPrompt, buildUpdatePrompt, buildImportPrompt, toExport, extractJSON, parseImport, DAYNAMES, FORMAT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTSetup = api;
})(typeof window !== 'undefined' ? window : globalThis);
