/* NoVoy v2 · Alta: instituto → ciclo y turno → horario → calendario → reglas → faltas de antes.
   La lógica está en reglas.js, horario.js, calendario.js y estado.js (con pruebas). Aquí solo pantallas.
   Guarda un borrador en este móvil (nv.alta) y, al terminar, el estado de la app (ft.v2) sin borrar
   las faltas que ya hubiera. */
(function () {
  'use strict';
  const C = window.FTCore, CAT = window.FTCat, R = window.NVReglas, H = window.NVHorario, K = window.NVCal, E = window.NVEstado;
  const DRAFT = 'nv.alta', STATE = 'ft.v2', DEV = 'nv.dev';
  const app = document.getElementById('alta');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const COLORS = ['#4ADE80', '#60A5FA', '#FBBF24', '#C084FC', '#F472B6', '#2DD4BF', '#FB923C', '#A3E635', '#F87171', '#94A3B8', '#38BDF8', '#E879F9'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fecha = (iso) => { if (!iso) return ''; const [y, m, dd] = iso.split('-'); return +dd + ' ' + MESES[+m - 1]; };
  const qs = new URLSearchParams(location.search);
  const HOY = /^\d{4}-\d{2}-\d{2}$/.test(qs.get('hoy') || '') ? qs.get('hoy') : C.ymd(new Date());
  const ls = { get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    check: '<svg class="chk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    gallery: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
    camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
    grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/></svg>',
    people: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.6 3 5.2"/></svg>'
  };

  // ---------- borrador ----------
  const nuevo = () => ({ v: 1, paso: 'centro', hist: [], centro: null, ciclo: null, turno: null, tplGrupo: null, tplCentro: null, plantilla: null,
    horario: null, fuente: null, quitar: [], cal: { inicio: null, fin: null, terms: null, locales: null, libres: [], libresLuego: false }, reglas: {}, previas: {}, importadas: [], dudosas: [], tutoria: 0, sinVaga: false, faltoAntes: null, compartir: true });
  const AJ = window.NVAjustes;
  // Ajustes de la app (1.4): alta.html?editar=horario|calendario|reglas|faltas reutiliza estos mismos pasos
  const EDITAR = ['horario', 'calendario', 'reglas', 'faltas'].indexOf(qs.get('editar')) >= 0 && (ls.get(STATE) || {}).config ? qs.get('editar') : null;
  // Enlace de clase (1.7): alta.html?unirse=… trae instituto, ciclo y turno
  const UNIRSE = qs.get('unirse') ? AJ.leerEnlace(qs.get('unirse')) : null;
  let d = EDITAR ? deEstado(EDITAR) : ls.get(DRAFT); if (!d || d.v !== 1) d = nuevo();
  if (UNIRSE && !EDITAR) {
    d = nuevo(); d.centro = UNIRSE.centro; d.ciclo = UNIRSE.ciclo; d.turno = UNIRSE.turno; d.unido = true;
    d.paso = (ls.get(STATE) || {}).config ? 'yaTienes' : 'uniendo';
  }
  /** Borrador a partir de lo que ya tiene la app, para cambiar una parte sin rehacer el alta. */
  function deEstado(que) {
    const st = ls.get(STATE), cfg = st.config, set = st.settings || {}, cat = cfg.catalog || {}, x = nuevo();
    x.editar = que; x.hist = [];
    x.centro = cat.centre || { name: cfg.center || 'Mi instituto', city: '' }; x.ciclo = cat.cycle || null; x.turno = cat.turno || null;
    const hz = H.deHorario(cfg.schedule || {}), r0 = hz.rows[0];
    x.horario = { rows: hz.rows, grid: hz.grid, extra: [], cfg: { n: hz.rows.length, inicio: r0 ? r0.start : '08:00', dur: r0 ? H.min(r0.end) - H.min(r0.start) : 60 } }; x.fuente = 'pintado';
    const terms = (cfg.terms || []).slice().sort((a, b) => (a.from < b.from ? -1 : 1)), gen = new Set(K.CURSO_2627.festivos.map((f) => f.from + '|' + f.to));
    const hol = cfg.holidays || [];
    x.cal = { inicio: terms.length ? terms[0].from : null, fin: terms.length ? terms[terms.length - 1].to : null, terms: terms.map((t) => Object.assign({}, t)),
      locales: hol.filter((h) => !gen.has(h.from + '|' + (h.to || h.from)) && h.label !== 'Libre disposición').map((h) => ({ from: h.from, to: h.to || h.from, label: h.label })),
      libres: hol.filter((h) => h.label === 'Libre disposición').map((h) => h.from), libresLuego: !!set.libresPendientes };
    x.reglas = AJ.respuestasDe(set);
    x.faltoAntes = true; x.compartir = true;
    x.paso = { horario: 'editor', calendario: 'calendario', reglas: 'reglas1', faltas: 'previas' }[que];
    return x;
  }
  const ui = { q: '', res: [], dirBusy: false, err: '', paint: null, otra: false, horas: false, quitar: false, cambiarFechas: false, cambiarTrim: false, libresForm: false, otroPct: false, busy: null, tplIdx: 0 };
  const save = () => { if (!d.editar) ls.set(DRAFT, d); };
  const salir = () => { location.href = './' + (HOY !== C.ymd(new Date()) ? '?hoy=' + HOY : '') + (d.editar === 'faltas' ? '#faltas' : d.editar ? '#ajustes' : ''); };
  function go(paso) { d.hist.push(d.paso); d.paso = paso; ui.err = ''; save(); render(true); }
  function back() { if (d.editar && !d.hist.length) return salir(); if (d.paso === 'entrar' && !d.hist.length) { d.paso = 'centro'; return render(true); } d.paso = d.hist.pop() || 'centro'; ui.err = ''; save(); render(true); }

  // ---------- claves de plantilla (sin datos del alumno) ----------
  const nk = (s) => K.norm(s).slice(0, 60);
  const keyCentro = () => (d.centro.code ? 'c' + nk(d.centro.code) : nk(d.centro.name) + '@' + nk(d.centro.city || ''));
  const keyGrupo = () => keyCentro() + '|' + (d.ciclo.code ? nk(d.ciclo.code) : nk(d.ciclo.name)) + '|' + d.turno;
  function devId() { let v = ls.get(DEV); if (!/^[0-9a-f]{32}$/.test(v || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); v = Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join(''); ls.set(DEV, v); } return v; }
  async function api(method, q, body) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 5000);
    try { const r = await fetch('/api/plantilla' + (q || ''), { method, signal: ctl.signal, keepalive: method === 'POST', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); return r.ok ? r.json() : null; }
    catch (e) { return null; } finally { clearTimeout(tm); }
  }

  // ---------- asignaturas y colores ----------
  const cicloCat = () => (d.ciclo && d.ciclo.code && CAT.CYCLES[d.ciclo.code]) || null;
  function corto(s) {
    const cy = d.ciclo && d.ciclo.code, m = cy && CAT.matchModule(cy, s);
    if (m) return m.short;
    const w = String(s).trim().split(/\s+/);
    return w.length > 1 ? w.map((x) => x[0]).join('').slice(0, 4).toUpperCase() : String(s).slice(0, 5);
  }
  /** Color fijo por asignatura: no cambia al pintar, quitar o reordenar (se guarda en el horario). */
  function colores(subs) {
    const hz = d.horario || {}, m = hz.col || (hz.col = {}), out = {};
    subs.forEach((s) => { if (m[s] == null) { const usados = new Set(Object.values(m)); let i = 0; while (usados.has(i) && i < COLORS.length) i++; m[s] = i < COLORS.length ? i : Object.keys(m).length; } out[s] = COLORS[m[s] % COLORS.length]; });
    return out;
  }
  const pintadas = () => (d.horario && d.horario.grid ? H.asignaturas(d.horario.grid) : []);
  /** Módulo del catálogo al que corresponde un nombre (para no repetir «E.CLI» con dos nombres). */
  const modDe = (s) => { const cy = d.ciclo && d.ciclo.code, m = cy && CAT.matchModule(cy, s); return m ? m.name : null; };
  /** Asignaturas propias: las pintadas y las añadidas, sin repetir el mismo módulo con otro nombre. */
  function propias() {
    const out = [], vistos = new Set();
    pintadas().concat((d.horario && d.horario.extra) || []).forEach((s) => { const k = modDe(s) || s; if (!vistos.has(k)) { vistos.add(k); out.push(s); } });
    return out;
  }
  /** Módulos del ciclo que aún no usas (ni has quitado). */
  function delCiclo() {
    const cat = cicloCat(); if (!cat) return [];
    const usados = new Set(propias().map((s) => modDe(s) || s)), fuera = new Set((d.horario && d.horario.ocultas) || []);
    return cat.modules.map((m) => m.name).filter((n) => !usados.has(n) && !fuera.has(n));
  }
  const paleta = () => propias().concat(delCiclo());
  /** Cambia el nombre de una asignatura en el borrador (casillas, color, añadidas). Si ya existe otra con ese nombre, se unen. */
  function renombrar(viejo, nuevo) {
    const n = String(nuevo || '').trim().replace(/\s+/g, ' ').slice(0, 40), hz = d.horario;
    if (!viejo || n.length < 2) { aviso('Escribe un nombre de al menos 2 letras.'); return; }
    if (n === viejo) { ui.ren = null; return render(false); }
    const une = paleta().indexOf(n) >= 0;
    Object.keys(hz.grid || {}).forEach((x) => Object.keys(hz.grid[x]).forEach((r) => { if (hz.grid[x][r] === viejo) hz.grid[x][r] = n; }));
    hz.extra = (hz.extra || []).filter((x) => x !== viejo); if (!une) hz.extra.push(n);
    const m = hz.col || (hz.col = {}); if (m[n] == null && m[viejo] != null) m[n] = m[viejo]; delete m[viejo];
    const mv = modDe(viejo) || viejo, mn2 = modDe(n) || n;
    hz.ocultas = (hz.ocultas || []).filter((x) => x !== mn2); if (mv !== mn2 && hz.ocultas.indexOf(mv) < 0) hz.ocultas.push(mv);
    const r = hz.renombres || (hz.renombres = {}); Object.keys(r).forEach((k) => { if (r[k] === viejo) r[k] = n; }); if (!r[viejo]) r[viejo] = n; delete r[n];
    ui.paint = n; ui.ren = null; save(); render(false);
    aviso(une ? 'Unida con ' + n : 'Ahora se llama ' + n);
  }

  // ---------- piezas ----------
  const PASOS = { entrar: 1, yaTienes: 1, uniendo: 2, especial: 2, desde: 2, centro: 1, centroOtro: 1, ciclo: 1, plantilla: 2, fuente: 2, leyendo: 2, editor: 2, calendario: 3, reglas1: 4, reglas2a: 4, reglas2b: 4, reglas2c: 4, reglas2m: 4, reglas3: 4, reglas4: 4, previas: 5, previasMano: 5, impPegar: 5, impFoto: 5, impLeyendo: 5, impIA: 5, impRevisar: 5, listo: 5 };
  const TIT = { horario: 'Cambiar horario', calendario: 'Cambiar calendario', reglas: 'Cambiar reglas', faltas: 'Pasar faltas' };
  function top() {
    if (d.editar) return '<div class="top"><button class="back" data-a="back" aria-label="' + (d.hist.length ? 'Atrás' : 'Volver a la app') + '">' + ICON.back + '</button><p class="sub grow">' + TIT[d.editar] + '</p></div>';
    const n = PASOS[d.paso] || 1, bars = [1, 2, 3, 4, 5].map((i) => '<i class="' + (i <= n ? 'on' : '') + '"></i>').join('');
    const canBack = (d.hist.length > 0 || d.paso === 'entrar') && d.paso !== 'leyendo' && d.paso !== 'impLeyendo';
    return '<div class="top">' + (canBack ? '<button class="back" data-a="back" aria-label="Atrás">' + ICON.back + '</button>' : '') +
      '<div class="prog" role="progressbar" aria-label="Paso ' + n + ' de 5" aria-valuemin="1" aria-valuemax="5" aria-valuenow="' + n + '">' + bars + '</div></div>';
  }
  const h1 = (t) => '<h1 tabindex="-1">' + esc(t) + '</h1>';
  const radio = (a, v, on, title, small) => '<button class="opt" role="radio" aria-checked="' + !!on + '" data-a="' + a + '" data-v="' + esc(v) + '"><span class="t"><b>' + esc(title) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</span><span class="radio" aria-hidden="true"></span></button>';
  const seg = (a, v, on, label) => '<button class="seg" role="radio" aria-checked="' + !!on + '" data-a="' + a + '" data-v="' + esc(v) + '">' + esc(label) + '</button>';
  const errBox = () => (ui.err ? '<div class="card bad" role="alert"><p>' + esc(ui.err) + '</p></div>' : '');
  const foot = (inner) => '<div class="foot">' + inner + '</div>';
  const next = (a, label, dis) => '<button class="btn" data-a="' + a + '"' + (dis ? ' disabled' : '') + '>' + esc(label || 'Siguiente') + '</button>';

  /** Rejilla de horario. editable: casillas pulsables; si no, vista pequeña. */
  function rejilla(rows, grid, editable) {
    const cols = colores(paleta()), dias = H.DIAS;
    let h = '<div class="tt' + (editable ? '' : ' view') + '" ' + (editable ? 'id="tt" role="grid" aria-label="Horario: toca una casilla para pintarla"' : 'aria-hidden="true"') + '><span></span>' + dias.map((x) => '<span class="d">' + H.CORTO[x] + '</span>').join('');
    rows.forEach((r, i) => {
      h += '<span class="h">' + esc(r.start) + '</span>';
      dias.forEach((x) => {
        const s = (grid[x] || {})[i], style = s ? ' style="background:' + (cols[s] || '#94A3B8') + '"' : '';
        if (editable) h += '<button class="c' + (s ? ' f' : '') + '"' + style + ' data-a="cell" data-v="' + x + ':' + i + '" aria-label="' + esc(H.NOMBRES[x] + ' ' + r.start + (s ? ', ' + s : ', vacía')) + '">' + (s ? esc(corto(s)) : '') + '</button>';
        else h += '<span class="c' + (s ? ' f' : '') + '"' + style + '>' + (s ? esc(corto(s)) : '') + '</span>';
      });
      const gap = H.huecoTras(rows, i);
      if (gap >= 10 && i < rows.length - 1) h += '<span class="gap">Recreo · ' + esc(r.end) + '–' + esc(rows[i + 1].start) + '</span>';
    });
    return h + '</div>';
  }
  function leyenda(grid) {
    const subs = H.asignaturas(grid), cols = colores(paleta());
    return '<div class="chips">' + subs.map((s) => '<span class="row" style="gap:6px;font-size:13px;color:var(--tx2)"><span class="dot" style="background:' + cols[s] + '"></span>' + esc(corto(s) + ' · ' + s) + '</span>').join('') + '</div>';
  }

  // ---------- pantallas ----------
  const V = {};

  V.centro = () => top() + h1('¿En qué instituto estudias?') +
    '<div class="search">' + ICON.search + '<label class="sr" for="q">Busca tu instituto</label><input id="q" class="input" type="search" autocomplete="off" enterkeyhint="search" placeholder="Nombre o ciudad" value="' + esc(ui.q) + '"></div>' +
    '<div id="res" class="stack">' + resultados() + '</div>' +
    foot('<button class="link" data-a="centroOtro">No está mi instituto</button><button class="link" data-a="entrar">Ya tengo cuenta</button>');
  function resultados() {
    if (ui.q.trim().length < 2) return '<p class="sub">Escribe al menos dos letras.</p>';
    const list = ui.res.map((c, i) => '<button class="opt" data-a="pickCentro" data-v="' + i + '"><span class="t"><b>' + esc(c.name) + '</b><small>' + esc(c.city || '') + (c.id ? ' · listo para tu clase' : '') + '</small></span></button>').join('');
    return list || (ui.dirBusy ? '<p class="sub">Buscando…</p>' : '<p class="sub">No lo encuentro. Prueba con otra palabra o toca «No está mi instituto».</p>');
  }
  let dirT = null;
  function buscar(q) {
    ui.q = q; const local = CAT.findCentres(q).map((c) => ({ id: c.id, name: c.name, city: c.city }));
    ui.res = local; ui.dirBusy = q.trim().length >= 3; pintar('res', resultados());
    clearTimeout(dirT);
    if (!ui.dirBusy) return;
    dirT = setTimeout(async () => {
      const r = await CAT.searchDirectory(q); if (ui.q !== q) return;
      const seen = new Set(local.map((c) => K.norm(c.name)));
      ui.res = local.concat(r.filter((c) => !seen.has(K.norm(c.name))).map((c) => ({ code: c.code, name: c.name, city: c.city })));
      ui.dirBusy = false; pintar('res', resultados());
    }, 350);
  }

  V.centroOtro = () => top() + h1('¿Cómo se llama tu instituto?') +
    '<div class="field"><label for="cn">Nombre</label><input id="cn" class="input" data-f="cn" autocomplete="off" value="' + esc(ui.cn || '') + '" placeholder="Ej.: Institut Guindàvols"></div>' +
    '<div class="field"><label for="cc">Ciudad o pueblo</label><input id="cc" class="input" data-f="cc" autocomplete="off" value="' + esc(ui.cc || '') + '" placeholder="Ej.: Lleida"></div>' +
    '<p class="sub">Con la ciudad pongo sus festivos locales.</p>' + errBox() + foot(next('centroOtroOk'));

  V.ciclo = () => {
    const cat = d.centro.id && CAT.centreById(d.centro.id), ids = Object.keys(CAT.CYCLES), mine = cat ? cat.cycles : [];
    const order = mine.concat(ids.filter((x) => mine.indexOf(x) < 0));
    const opts = order.map((code) => { const c = CAT.CYCLES[code]; return radio('pickCiclo', code, d.ciclo && d.ciclo.code === code, c.short + ' · ' + c.name, c.grade); }).join('');
    const otro = ui.otra ? '<div class="field"><label for="co">Escribe tu ciclo</label><input id="co" class="input" data-f="co" value="' + esc(ui.co || (d.ciclo && d.ciclo.prov ? d.ciclo.name : '')) + '" placeholder="Ej.: Cures auxiliars d’infermeria"></div>' : '<button class="link" data-a="cicloOtro" style="align-self:flex-start">No está mi ciclo</button>';
    return top() + '<p class="sub">' + esc(d.centro.name) + '</p>' + h1('¿Qué estudias?') + '<div class="stack" role="radiogroup" aria-label="Ciclo">' + opts + '</div>' + otro +
      '<h2>¿De mañana o de tarde?</h2><div class="grid2" role="radiogroup" aria-label="Turno">' + seg('turno', 'manana', d.turno === 'manana', 'Mañana') + seg('turno', 'tarde', d.turno === 'tarde', 'Tarde') + '</div>' +
      errBox() + foot(next('cicloOk'));
  };

  V.plantilla = () => {
    const vs = d.tplGrupo || [], v = vs[ui.tplIdx] || vs[0], hz = H.deHorario(v.data.schedule);
    const tabs = vs.length > 1 ? '<div class="grid2" role="radiogroup" aria-label="Horarios de tu clase">' + vs.map((x, i) => seg('tplIdx', i, i === ui.tplIdx, 'Opción ' + (i + 1))).join('') + '</div>' : '';
    const subs = H.asignaturas(hz.grid);
    const quitar = ui.quitar ? '<div class="list">' + subs.map((s) => '<label class="li toggle"><input type="checkbox" data-a="quitar" data-v="' + esc(s) + '"' + (d.quitar.indexOf(s) < 0 ? ' checked' : '') + '><span class="t"><b>' + esc(s) + '</b><small>' + (d.quitar.indexOf(s) < 0 ? 'Voy' : 'No voy') + '</small></span></label>').join('') + '</div>'
      : '<button class="btn2" data-a="verQuitar" style="width:auto;align-self:flex-start">No voy a todos: quitar alguno</button>';
    return top() + h1('¿Es este tu horario?') + '<p class="lead">' + esc((cicloCat() ? cicloCat().short : d.ciclo.name) + ' · ' + (d.turno === 'tarde' ? 'tarde' : 'mañana') + ' · ' + d.centro.name) + '</p>' + tabs +
      '<span class="badge">' + ICON.people + 'Lo ' + (v.conf === 1 ? 'ha subido 1 compañero' : 'han confirmado ' + v.conf + ' compañeros') + '</span>' +
      '<div class="card">' + rejilla(hz.rows, hz.grid, false) + '</div>' + leyenda(hz.grid) +
      (AJ.resumenEspeciales(v.data).length ? '<div class="card"><p class="sub" style="color:var(--tx2)"><b>Con sus casos especiales:</b> ' + esc(AJ.resumenEspeciales(v.data).join(' · ')) + '.</p></div>' : '') + quitar +
      foot(next('tplSi', 'Sí, es este') + '<button class="btn2" data-a="tplNo">No, es otro</button>');
  };

  // casos especiales (1.5 y 1.11): una pregunta de un toque; si hay, se ponen en Ajustes al acabar
  V.especial = () => top() + h1('¿Tu horario cambia durante el curso?') + '<div class="stack" role="radiogroup">' +
    radio('especial', 'no', d.especial === false, 'No, es igual todo el curso') +
    radio('especial', 'si', d.especial === true, 'Sí, tiene casos especiales', 'El proyecto cuenta dentro de otros módulos, una asignatura empieza más tarde o hay semanas con otro horario. Lo pones al acabar, en un minuto.') + '</div>' +
    foot(next('especialOk', 'Siguiente', d.especial == null));
  // «¿desde cuándo vale este horario?» (al cambiarlo desde Ajustes)
  V.desde = () => top() + h1('¿Desde cuándo vale este horario?') + '<p class="lead">Así las faltas de antes siguen contando con el horario de antes.</p><div class="stack" role="radiogroup">' +
    radio('desde', 'hoy', d.desde === 'hoy', 'Desde hoy', 'Me han cambiado el horario') + radio('desde', 'otro', d.desde === 'otro', 'Desde otro día') + radio('desde', 'siempre', d.desde === 'siempre', 'Desde siempre', 'Estaba mal puesto') + '</div>' +
    (d.desde === 'otro' ? '<div class="field"><label for="dd">Desde el</label><input id="dd" class="input" type="date" data-f="dd" value="' + esc(ui.dd || HOY) + '" max="' + K.CURSO_2627.fin + '"></div>' : '') +
    errBox() + foot(next('guardarEdicion', 'Guardar', !d.desde));
  // ya usa NoVoy y abre un enlace de clase: no se le toca nada
  V.yaTienes = () => top() + h1('Ya usas NoVoy') + '<p class="lead">Este enlace es para quien empieza. Tus faltas y tu horario siguen como estaban.</p>' +
    '<div class="card"><p>' + esc(d.centro.name + ' · ' + d.ciclo.name + ' · ' + (d.turno === 'tarde' ? 'tarde' : 'mañana')) + '</p></div>' +
    foot(next('irApp', 'Ir a NoVoy') + '<button class="btn2" data-a="unirseIgual">Cambiar mi horario por el de este grupo</button><p class="sub">Si lo cambias, tus faltas se quedan.</p>');
  V.uniendo = () => top() + h1('Buscando el horario de tu clase…') + '<p class="lead">' + esc(d.centro.name) + '</p>';
  // «Ya tengo cuenta» (1.8)
  V.entrar = () => top() + h1('Entra en tu cuenta') + '<p class="lead">Recupera tu horario y tus faltas.</p>' +
    '<form class="stack" id="fentrar" autocomplete="on"><div class="field"><label for="eu">Usuario</label><input id="eu" name="username" class="input" autocomplete="username" autocapitalize="off" spellcheck="false"></div>' +
    '<div class="field"><label for="ep">Contraseña</label><input id="ep" name="password" type="password" class="input" autocomplete="current-password"></div>' + errBox() + '<button class="btn" data-a="entrarOk">Entrar</button></form>';

  V.fuente = () => top() + h1('¿Tienes una captura de tu horario?') +
    '<p class="lead">Eres el primero de tu clase. Lo que subas lo usarán tus compañeros.</p>' + errBox() +
    '<label class="btn" tabindex="0" role="button" data-k="file1">' + ICON.gallery + 'Elegir de la galería<input id="file1" type="file" accept="image/*" class="sr" data-file="1"></label>' +
    '<label class="btn2" tabindex="0" role="button" data-k="file2">' + ICON.camera + 'Hacer una foto<input id="file2" type="file" accept="image/*" capture="environment" class="sr" data-file="1"></label>' +
    '<button class="btn2" data-a="pintarYo">' + ICON.grid + 'Lo pinto yo</button>' +
    foot('<div class="card"><p class="sub" style="color:var(--tx2)">¿No tienes captura? Ábrelo en el Moodle, haz la captura y vuelve. Solo hace falta una vez.</p></div><p class="sub">La foto se lee en tu móvil y no se guarda.</p>');

  V.leyendo = () => top() + h1('Leyendo tu horario…') + '<p class="lead" id="msg">' + esc((ui.busy && ui.busy.msg) || '') + '</p><div class="bar"><i id="pbar" style="width:' + Math.round(((ui.busy && ui.busy.p) || 0) * 100) + '%"></i></div>' +
    '<p class="sub">La primera vez tarda un poco más.</p>';

  V.editor = () => {
    const hz = d.horario, rows = hz.rows, subs = paleta(), cols = colores(subs);
    const any = pintadas().length > 0;
    const f = hz.cfg || {}, horasOk = rows.length && rows.every((x) => x.start && x.end), resumenH = horasOk ? rows[0].start + ' a ' + rows[rows.length - 1].end + ' · ' + rows.length + ' clases' : '';
    const formH = ui.horas || !horasOk ? '<div class="card stack">' +
      '<div class="grid2"><div class="field"><label for="hi">Empiezas a las</label><input id="hi" class="input" type="time" data-f="hi" value="' + esc(f.inicio || (d.turno === 'tarde' ? '15:00' : '08:00')) + '"></div>' +
      '<div class="field"><label for="hd">Cada clase dura</label><select id="hd" class="input" data-f="hd">' + [45, 50, 55, 60, 90, 120].map((m) => '<option value="' + m + '"' + (+(f.dur || 60) === m ? ' selected' : '') + '>' + m + ' min</option>').join('') + '</select></div></div>' +
      '<div class="grid2"><div class="field"><label for="hn">Clases al día</label><select id="hn" class="input" data-f="hn">' + [3, 4, 5, 6, 7, 8, 9, 10].map((m) => '<option' + (+(f.n || 6) === m ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="hr">Recreo</label><select id="hr" class="input" data-f="hr"><option value="0">Sin recreo</option>' + [1, 2, 3, 4, 5, 6].map((m) => '<option value="' + m + '"' + (+(f.tras == null ? 3 : f.tras) === m ? ' selected' : '') + '>Tras la ' + m + 'ª</option>').join('') + '</select></div></div>' +
      '<div class="field"><label for="hrd">El recreo dura</label><select id="hrd" class="input" data-f="hrd">' + [15, 20, 30, 45, 60].map((m) => '<option value="' + m + '"' + (+(f.rdur || 30) === m ? ' selected' : '') + '>' + m + ' min</option>').join('') + '</select></div>' +
      '<button class="btn2" data-a="aplicarHoras">Usar estas horas</button></div>'
      : '<div class="row"><p class="sub grow">' + esc(resumenH) + '</p><button class="link" data-a="verHoras">Cambiar las horas</button></div>';
    const mias = propias(), resto = delCiclo();
    const ficha = (s) => '<div class="ficha"><button class="fi" role="radio" aria-checked="' + (ui.paint === s) + '" aria-pressed="' + (ui.paint === s) + '" data-a="paint" data-v="' + esc(s) + '" style="--c:' + cols[s] + '" title="' + esc(s) + '"><b>' + esc(corto(s)) + '</b><small>' + esc(s) + '</small></button>' +
      '<button class="quita" data-a="quitarSub" data-v="' + esc(s) + '" aria-label="Quitar ' + esc(s) + '"><span aria-hidden="true">×</span></button></div>';
    const pal = '<div class="pal" role="radiogroup" aria-label="Asignatura para pintar">' + mias.concat(resto).map(ficha).join('') +
      '<div class="ficha"><button class="fi erase" role="radio" aria-checked="' + (ui.paint === '') + '" aria-pressed="' + (ui.paint === '') + '" data-a="paint" data-v=""><b>Borrar</b><small>casillas</small></button></div>' +
      (ui.add ? '' : '<div class="ficha"><button class="fi add" data-a="addSub"><b>+ Otra</b><small>asignatura</small></button></div>') + '</div>' +
      (ui.add ? '<div class="stack"><div class="row"><label class="sr" for="ns">Nueva asignatura</label><input id="ns" class="input grow" data-f="ns" placeholder="Nombre y pulsa Intro" autocomplete="off" enterkeyhint="done"><button class="seg" data-a="addSubOk" style="min-width:88px">Añadir</button></div><button class="link" data-a="addSubFin">Ya están todas</button></div>' : '');
    const ren = ui.ren && paleta().indexOf(ui.ren) >= 0 ? '<div class="card stack"><label for="rn"><b>Nombre de la asignatura</b></label><input id="rn" class="input" data-f="rn" value="' + esc(ui.ren) + '" autocomplete="off" maxlength="40"><div class="grid2"><button class="seg" data-a="renOk">Guardar nombre</button><button class="seg" data-a="renNo">Cancelar</button></div></div>' : '';
    const nombre = ren || (ui.paint ? '<p class="sub" aria-live="polite">Pintando: <b style="color:var(--tx)">' + esc(ui.paint) + '</b>. Toca sus horas en la rejilla. Para cambiarle el nombre, toca su tarjeta otra vez.</p>' : ui.paint === '' ? '<p class="sub" aria-live="polite">Toca una casilla para borrarla.</p>' : '<p class="sub">Toca una asignatura y después sus horas en la rejilla.</p>');
    return top() + h1(d.fuente === 'captura' ? 'Revisa tu horario' : 'Pinta tu horario') +
      (d.fuente === 'captura' ? '<p class="lead">He leído esto de tu captura. Corrige lo que no esté bien.</p>' : '') +
      formH + (rows.length ? pal + nombre + rejilla(rows, hz.grid, true) : '') + errBox() +
      foot(next('editorOk', 'Siguiente', !any));
  };

  V.calendario = () => {
    const c = d.cal, curso = K.CURSO_2627, city = d.centro.city || '';
    const locales = c.locales || [], tpl = d.tplCentro && d.tplCentro.data, libres = c.libres || [];
    const pend = !libres.length && !c.libresLuego;
    const filas = [];
    filas.push(['Clases', 'Del ' + fecha(c.inicio) + ' al ' + fecha(c.fin) + (c.inicioPropuesto ? ' · revísalo' : ''), 'fechas']);
    filas.push(['Vacaciones', 'Navidad 22 dic – 7 ene · Semana Santa 20 – 29 mar', null]);
    filas.push(['Festivos de Catalunya', 'Ya están todos', null]);
    const falta27 = locales.length && K.faltaSegundoAño(locales, curso) ? ' · Los de ' + curso.fin.slice(0, 4) + ' se publican en diciembre: añádelos si los sabes.' : '';
    filas.push(['Festivos de ' + (city || 'tu ciudad'), c.locales == null ? 'Buscándolos…' : locales.length ? locales.map((x) => x.label + ' (' + fecha(x.from) + ')').join(' · ') + falta27 : 'No los he encontrado. Añádelos tú.', 'local']);
    const trims = c.terms || [];
    filas.push(['Trimestres', trims.map((t) => fecha(t.from) + '–' + fecha(t.to)).join(' · '), 'trim']);
    let h = top() + h1(pend ? 'Tu calendario está casi listo' : 'Tu calendario está listo') + '<div class="list">' + filas.map((f) =>
      '<div class="li">' + ICON.check + '<span class="t"><b>' + esc(f[0]) + '</b><small>' + esc(f[1]) + '</small></span>' + (f[2] ? '<button class="link" data-a="cal-' + f[2] + '" aria-label="' + (f[2] === 'local' ? 'Añadir una fiesta local' : 'Cambiar ' + esc(f[0])) + '">' + (f[2] === 'local' ? 'Añadir' : 'Cambiar') + '</button>' : '') + '</div>').join('') + '</div>';
    if (ui.cambiarFechas) h += '<div class="card stack"><div class="grid2"><div class="field"><label for="ci">Empiezan</label><input id="ci" class="input" type="date" data-f="ci" value="' + esc(c.inicio) + '"></div><div class="field"><label for="cf">Acaban</label><input id="cf" class="input" type="date" data-f="cf" value="' + esc(c.fin) + '"></div></div><button class="btn2" data-a="fechasOk">Guardar</button></div>';
    if (ui.localForm) h += '<div class="card stack"><div class="field"><label for="ld">Fiesta local</label><input id="ld" class="input" type="date" data-f="ld" min="' + curso.inicio + '" max="' + curso.fin + '"></div><button class="btn2" data-a="localOk">Añadir</button></div>';
    if (ui.cambiarTrim) h += '<div class="card stack">' + trims.map((t, i) => '<p class="cap">' + esc(t.label) + '</p><div class="grid2"><div class="field"><label for="t' + i + 'a">Desde</label><input id="t' + i + 'a" class="input" type="date" data-f="t' + i + 'a" value="' + esc(t.from) + '"></div><div class="field"><label for="t' + i + 'b">Hasta</label><input id="t' + i + 'b" class="input" type="date" data-f="t' + i + 'b" value="' + esc(t.to) + '"></div></div>').join('') + '<button class="btn2" data-a="trimOk">Guardar</button></div>';
    if (libres.length) h += '<div class="card"><p><b>Días de libre disposición</b></p><p class="sub">' + esc(libres.map(fecha).join(' · ')) + (tpl && tpl.libres ? ' · los puso un compañero' : '') + '</p><button class="link" data-a="libresVer" style="align-self:flex-start;padding:0">Cambiar</button></div>';
    else if (ui.libresForm) h += '<div class="card stack"><p><b>Los 4 días que elige tu centro</b></p>' + [0, 1, 2, 3].map((i) => '<div class="field"><label for="lb' + i + '">Día ' + (i + 1) + '</label><input id="lb' + i + '" class="input" type="date" data-f="lb' + i + '" min="' + curso.inicio + '" max="' + curso.fin + '" value="' + esc((ui.lb || [])[i] || '') + '"></div>').join('') + '<button class="btn2" data-a="libresOk">Guardar</button></div>';
    else if (c.libresLuego) h += '<div class="card"><p>Vale. Cuando los sepas, ponlos en Ajustes. Mientras, no cuento ningún día de más.</p></div>';
    else h += '<div class="card amb stack"><p><b>Faltan 4 días que elige tu centro</b></p><p class="sub" style="color:var(--tx2)">Son los días de libre disposición. Suelen estar en la web del instituto.</p><div class="grid2"><button class="seg" data-a="libresVer">Los sé</button><button class="seg" data-a="libresLuego">Ponlos luego</button></div></div>';
    return h + errBox() + foot(next('calOk'));
  };

  // reglas
  const RG = () => R.conDefecto(d.reglas);
  V.reglas1 = () => {
    const t = d.reglas.tipo;
    return top() + h1('¿Cómo cuentan las faltas en tu centro?') + '<div class="stack" role="radiogroup" aria-label="Cómo cuentan las faltas">' +
      radio('tipo', 'todas', t === 'todas', 'Todas cuentan igual', 'Ej.: 25 % de faltas, tengas justificante o no') +
      radio('tipo', 'sin', t === 'sin', 'Solo las que no justificas', 'Ej.: 20 % sin justificar. Las justificadas no cuentan') +
      radio('tipo', 'dos', t === 'dos', 'Un límite para cada tipo', 'Ej.: 10 % sin justificar y 15 % justificadas') + '</div>' +
      '<div class="row" style="gap:18px"><button class="link" data-a="tipo" data-v="nose" aria-pressed="' + (t === 'nose') + '">No lo sé</button><button class="link" data-a="tipo" data-v="mitad" aria-pressed="' + (t === 'mitad') + '">Otra forma</button></div>' +
      (t === 'nose' ? '<div class="card amb"><p>Usamos la más estricta: todas cuentan y el 15 %. Pregúntalo a tu tutor y cámbialo cuando lo sepas.</p></div>' : '') +
      (t === 'mitad' ? '<div class="card"><p>Otra forma que admite NoVoy: <b>las justificadas cuentan la mitad</b>. Si en tu centro es distinto, elige la opción más parecida y más estricta.</p></div>' : '') +
      foot(next('reglas1Ok', 'Siguiente', !t));
  };
  function pcts(key, cur) {
    const own = cur && R.PCTS.indexOf(+cur) < 0;
    return '<div class="pcts" role="radiogroup" aria-label="Porcentaje">' + R.PCTS.map((p) => seg('pct', key + ':' + p, +cur === p && !ui['otro' + key], p + ' %')).join('') + seg('pctOtro', key, own || ui['otro' + key], own ? num(cur) + ' %' : 'Otro') + '</div>' +
      (ui['otro' + key] ? '<div class="row"><label class="sr" for="po' + key + '">Otro porcentaje</label><input id="po' + key + '" class="input grow" inputmode="decimal" data-f="po' + key + '" placeholder="Ej.: 12" value="' + esc(own ? cur : '') + '"><span>%</span></div>' : '');
  }
  function V2uno() {
    const a = RG();
    const hint = a.cuenta === 'sin' ? 'Las justificadas no restan. Solo cuentan las que no justificas.' : 'Con o sin justificante, todas suman al mismo ' + num(a.pct) + ' %.';
    return top() + h1('¿Cuánto puedes faltar?') + pcts('pct', a.pct) +
      '<h2>¿Qué faltas cuentan?</h2><div class="grid2" role="radiogroup" aria-label="Qué faltas cuentan">' + seg('cuenta', 'todas', a.cuenta === 'todas', 'Todas') + seg('cuenta', 'sin', a.cuenta === 'sin', 'Solo sin justificante') + '</div>' +
      '<p class="sub" aria-live="polite">' + esc(hint) + '</p>' + errBox() + foot(next('reglas2Ok'));
  }
  V.reglas2a = V2uno; V.reglas2b = V2uno;
  V.reglas2c = () => {
    const a = RG();
    return top() + '<p class="sub">Un límite para cada tipo</p>' + h1('¿Cuánto puedes faltar?') +
      '<h2>Sin justificante</h2>' + pcts('pctSin', a.pctSin) + '<h2>Con justificante</h2>' + pcts('pctJust', a.pctJust) +
      '<div class="card stack"><p><b>¿Ese ' + num(a.pctJust) + ' % es solo de las justificadas, o de todas juntas?</b></p><div class="grid2" role="radiogroup">' + seg('segundo', 'aparte', a.segundo === 'aparte', 'Solo justificadas') + seg('segundo', 'todas', a.segundo === 'todas', 'De todas juntas') + '</div></div>' +
      errBox() + foot(next('reglas2Ok'));
  };
  V.reglas2m = () => { const a = RG(); return top() + h1('¿Cuánto puedes faltar?') + pcts('pct', a.pct) + '<p class="sub">Cada hora justificada cuenta como media hora.</p>' + errBox() + foot(next('reglas2Ok')); };
  V.reglas3 = () => {
    const a = RG();
    return top() + h1('Dos preguntas más') + '<h2>¿El límite es de cada trimestre o de todo el curso?</h2><div class="stack" role="radiogroup">' +
      radio('ambito', 'trimestre', a.ambito === 'trimestre', 'De cada trimestre') + radio('ambito', 'curso', a.ambito === 'curso', 'De todo el curso') + radio('ambito', 'ra', a.ambito === 'ra', 'De cada RA') + '</div>' +
      '<h2>¿Llegar tarde cuenta como falta?</h2><div class="grid2" role="radiogroup">' + seg('retrasos', 'no', a.retrasos === 'no', 'No') + seg('retrasos', '1', a.retrasos === '1', 'Sí, cada una') + seg('retrasos', '2', a.retrasos === '2', '2 retrasos = 1 falta') + seg('retrasos', '3', a.retrasos === '3', '3 retrasos = 1 falta') + '</div>' +
      foot(next('reglas3Ok'));
  };
  /** Módulo de ejemplo (el de más horas) y sus horas en el trimestre de hoy o en el curso. */
  function ejemploModulo(s) {
    const st = borradorEstado(); if (!st || st.error) return null;
    const state = Object.assign({}, st.config, { settings: Object.assign({}, C.DEF, st.settings), faltas: [] }), sc = C.scope(state);
    const term = C.termOf(sc, HOY) || sc.terms[0].id, rows = C.summary(sc, term);
    if (!rows.length) return null;
    const m = rows.reduce((a, b) => (b.total > a.total ? b : a), rows[0]);
    return { name: m.name, total: m.total, filas: R.ejemplo(s.limites, m.total), curso: s.ambito === 'curso' };
  }
  V.reglas4 = () => {
    const s = R.aSettings(d.reglas); if (s.error) return top() + h1('Falta algo') + '<div class="card bad"><p>' + esc(s.error) + '</p></div>' + foot('<button class="btn2" data-a="cambiarReglas">Volver</button>');
    const t = R.resumen(s), ej = ejemploModulo(s), tpl = d.reglasDeTpl && d.tplCentro;
    let h = top() + h1('¿Es así en tu centro?') + (tpl ? '<span class="badge">' + ICON.people + 'Lo ' + (d.tplCentro.conf === 1 ? 'puso 1 compañero' : 'han confirmado ' + d.tplCentro.conf + ' compañeros') + '</span>' : '') +
      '<div class="card stack"><p style="font-size:17px">' + esc(t.principal) + '</p>' + (t.nota ? '<p class="sub" style="color:var(--tx2)">' + esc(t.nota) + '</p>' : '') + '<p class="sub" style="color:var(--tx2)">' + esc(t.retrasos) + '</p></div>';
    if (ej) h += '<p class="cap">Por ejemplo, en ' + esc(ej.name) + '</p><div class="list"><div class="kv"><span>' + (ej.curso ? 'Clases en el curso' : 'Clases este trimestre') + '</span><b>' + num(ej.total) + ' h</b></div>' + ej.filas.map((f) => '<div class="kv"><span>' + esc(f.etiqueta) + '</span><b>' + num(f.horas) + ' h</b></div>').join('') + '</div>';
    if (s.aproximado.indexOf('ra') >= 0) h += '<div class="card amb"><p>Por RA aún no puedo calcularlo exacto: lo verás como aproximado, contando por trimestre.</p></div>';
    if (s.aproximado.indexOf('nose') >= 0) h += '<div class="card amb"><p>Es la regla más estricta. Cuando sepas la de tu centro, cámbiala en Ajustes.</p></div>';
    return h + foot(next('reglasSi', 'Sí, es así') + '<button class="btn2" data-a="cambiarReglas">Cambiar algo</button>');
  };

  const subsPrevias = () => Object.keys(H.horasSemana(horarioFinal())).filter((x) => !/^(tut|tutor|tutoria|tutoría)\b/i.test(x));
  V.previas = () => {
    let h = top() + h1('¿Has faltado alguna vez desde septiembre?');
    if (d.faltoAntes !== true) return h + '<div class="stack" role="radiogroup">' + radio('faltoAntes', 'no', d.faltoAntes === false, 'No, ninguna') + radio('faltoAntes', 'si', false, 'Sí', 'Las pasamos ahora') + '</div>' + foot(next('previasOk', 'Siguiente', d.faltoAntes == null));
    const ya = (d.importadas || []).length;
    return top() + h1(ya ? '¿Añades otra lista?' : '¿Cómo quieres pasarlas?') + '<p class="lead">Elige lo más rápido para ti. Antes de guardar verás lo que he entendido.</p><div class="stack">' +
      '<button class="opt" data-a="modo" data-v="impPegar"><span class="t"><b>Copiar y pegar</b><small>Desde el Moodle o la web de tu centro. Lo más rápido.</small></span></button>' +
      '<button class="opt" data-a="modo" data-v="impFoto"><span class="t"><b>Con capturas</b><small>Haz capturas de tu lista y elígelas. Se leen en tu móvil.</small></span></button>' +
      '<button class="opt" data-a="modo" data-v="impIA"><span class="t"><b>Con una IA</b><small>Si tu lista es rara o está en PDF: te doy un mensaje para ChatGPT o Gemini.</small></span></button>' +
      '<button class="opt" data-a="modo" data-v="previasMano"><span class="t"><b>Contarlas a mano</b><small>Si son pocas: las horas de cada asignatura.</small></span></button></div>' +
      (ya ? foot('<button class="btn2" data-a="modo" data-v="impRevisar">Volver a lo que ya tengo (' + ya + ')</button>') : d.editar ? '' : foot('<button class="link" data-a="faltoAntes" data-v="no">En realidad, no he faltado</button>'));
  };
  V.previasMano = () => {
    let h = top() + h1('Cuenta tus faltas') + '<p class="lead">' + (d.editar ? 'Solo las horas que aún no tengas apuntadas: se suman a las que ya hay.' : 'Las horas de cada asignatura. Si no lo sabes exacto, pon de más: es lo seguro.') + '</p><div class="list">';
    subsPrevias().forEach((x) => {
      const p = d.previas[x] || {};
      const st = (k, lab) => '<div class="row" style="justify-content:space-between"><small>' + lab + '</small><span class="stepper"><button data-a="prev" data-v="' + esc(x) + '|' + k + '|-1" aria-label="Quitar 1 hora ' + lab + ' en ' + esc(x) + '">−</button><output aria-live="polite">' + num(p[k] || 0) + ' h</output><button data-a="prev" data-v="' + esc(x) + '|' + k + '|1" aria-label="Añadir 1 hora ' + lab + ' en ' + esc(x) + '">+</button></span></div>';
      h += '<div class="li"><span class="t"><b>' + esc(x) + '</b>' + st('sin', 'Sin justificante') + st('just', 'Con justificante') + '</span></div>';
    });
    return h + '</div>' + foot(next('manoOk'));
  };
  V.impPegar = () => top() + h1('Pega tu lista de faltas') +
    '<ol class="pasos"><li>En la web de tu centro, abre tu asistencia.</li><li>Mantén pulsado sobre la lista, toca «Seleccionar todo» y «Copiar».</li><li>Vuelve aquí y pégalo.</li></ol>' +
    (navigator.clipboard && navigator.clipboard.readText ? '<button class="btn2" data-a="pegar">Pegar lo que he copiado</button>' : '') +
    '<div class="field"><label for="imp">Tu lista</label><textarea id="imp" class="input area" data-f="imp" rows="7" placeholder="Fecha, asignatura y si fue falta, justificada o retraso. Da igual el formato.">' + esc(ui.imp || '') + '</textarea></div>' +
    '<p class="sub">Si tu centro tiene una página por asignatura, pega una y luego «Añadir otra lista».</p>' + errBox() + foot(next('leer', 'Leer mi lista'));
  V.impFoto = () => top() + h1('Elige las capturas de tu lista') + '<p class="lead">Puedes elegir varias. Que se vean la fecha, la asignatura y si fue falta.</p>' + errBox() +
    '<label class="btn" tabindex="0" role="button">' + ICON.gallery + 'Elegir capturas<input type="file" accept="image/*" multiple class="sr" data-imp="1"></label>' +
    foot('<p class="sub">Se leen en tu móvil y no se guardan.</p>');
  V.impLeyendo = () => top() + h1('Leyendo tus capturas…') + '<p class="lead" id="msg">' + esc((ui.busy && ui.busy.msg) || '') + '</p><div class="bar"><i id="pbar" style="width:' + Math.round(((ui.busy && ui.busy.p) || 0) * 100) + '%"></i></div>';
  V.impIA = () => {
    const pr = NVImportar.promptIA(subsPrevias());
    return top() + h1('Pásalas con una IA') +
      '<ol class="pasos"><li>Copia este mensaje.</li><li>Pégalo en ChatGPT, Gemini o la que uses, y añade tu lista o tus capturas.</li><li>Copia lo que te responda y pégalo abajo.</li></ol>' +
      '<div class="field"><label for="prm">Mensaje para la IA</label><textarea id="prm" class="input area" rows="5" readonly>' + esc(pr) + '</textarea></div>' +
      '<button class="btn2" data-a="copiarPrompt">Copiar el mensaje</button>' +
      '<div class="field"><label for="imp">Lo que te ha respondido</label><textarea id="imp" class="input area" data-f="imp" rows="6" placeholder="2026-10-19 ; Programació ; 2 ; falta">' + esc(ui.imp || '') + '</textarea></div>' +
      errBox() + foot(next('leer', 'Leer la respuesta'));
  };
  V.impRevisar = () => {
    const F = d.importadas || [], T = NVImportar.totales(F), dud = d.dudosas || [];
    const vagaH = F.filter((f) => f.vaga).reduce((a, f) => a + f.hours, 0);
    const horas = F.reduce((a, f) => a + (f.type === 'retraso' || (d.sinVaga && f.vaga) ? 0 : f.hours), 0), ret = F.filter((f) => f.type === 'retraso').length;
    let h = top() + h1(F.length ? 'He encontrado ' + num(horas) + ' h de faltas' : 'No he encontrado faltas');
    if (F.length) {
      const extra = [];
      if (ret) extra.push(ret + (ret === 1 ? ' retraso' : ' retrasos') + ' aparte.');
      if (d.tutoria) extra.push(d.tutoria + (d.tutoria === 1 ? ' de tutoría, que no cuenta.' : ' de tutoría, que no cuentan.'));
      h += '<p class="lead">' + esc(extra.join(' ') + ' Revisa que esté bien antes de guardar.') + '</p><div class="list">' + Object.keys(T).map((x) => {
        const t = T[x], partes = [];
        if (t.sin) partes.push(num(t.sin) + ' h sin justificante'); if (t.just) partes.push(num(t.just) + ' h justificadas'); if (t.vaga) partes.push(num(t.vaga) + ' h de vaga' + (d.sinVaga ? ' (no cuentan)' : ''));
        if (t.retrasos) partes.push(t.retrasos + (t.retrasos === 1 ? ' retraso' : ' retrasos'));
        return '<div class="li"><span class="t"><b>' + esc(x) + '</b><small>' + esc(partes.join(' · ')) + '</small></span></div>';
      }).join('') + '</div>';
      if (vagaH) h += '<div class="card amb stack"><p><b>' + num(vagaH) + ' h de vaga</b></p><p class="sub" style="color:var(--tx2)">Las cuento como faltas sin justificar, porque no sé cómo las cuenta tu centro. Si sabes que no cuentan, quítalas.</p>' +
        '<label class="toggle"><input type="checkbox" data-a="sinVaga"' + (d.sinVaga ? ' checked' : '') + '><span>No contar las de vaga</span></label></div>';
      h += ui.verTodas ? '<div class="list">' + F.map((f) => '<div class="kv"><span>' + esc(fecha(f.date) + ' · ' + f.subject) + '</span><b>' + (f.type === 'retraso' ? 'retraso' : num(f.hours) + ' h' + (f.vaga ? ' · vaga' : f.justified ? ' · just.' : '')) + '</b></div>').join('') + '</div>' : '<button class="link" data-a="verTodas" style="align-self:flex-start">Ver una por una (' + F.length + ')</button>';
    } else h += '<p class="lead">Prueba con «Con una IA»: entiende casi cualquier formato.</p>';
    if (dud.length) h += '<div class="card amb stack"><p><b>' + dud.length + (dud.length === 1 ? ' línea no la he entendido' : ' líneas no las he entendido') + '</b></p><p class="sub" style="color:var(--tx2)">No las cuento. Si son faltas, añádelas luego a mano.</p><div class="list">' +
      dud.slice(0, 8).map((x) => '<div class="li"><span class="t"><small>' + esc(x.motivo) + '</small><b style="font-weight:500;font-size:13px">' + esc(x.linea.slice(0, 90)) + '</b></span></div>').join('') + '</div>' + (dud.length > 8 ? '<p class="sub">Y ' + (dud.length - 8) + ' más.</p>' : '') + '</div>';
    return h + foot((F.length ? next('impOk', 'Guardar estas faltas') : '') + '<button class="btn2" data-a="otraLista">Añadir otra lista</button>' + (F.length || dud.length ? '<button class="link" data-a="borrarImp">Empezar de nuevo</button>' : ''));
  };

  V.listo = () => {
    const st = borradorEstado();
    if (!st || st.error) return top() + h1('Falta algo') + '<div class="card bad" role="alert"><p>' + esc((st && st.error) || 'No he podido montar tu configuración.') + '</p></div>' + foot('<button class="btn2" data-a="back">Volver</button>');
    const state = Object.assign({}, st.config, { settings: Object.assign({}, C.DEF, st.settings), faltas: (existente().faltas || []).concat(st.faltas) });
    const sc = C.scope(state), v = C.verdict(sc, HOY);
    const T = v.free ? ['Hoy no tienes clase.', 'ok'] : v.status === 'rojo' ? (v.soloJust ? ['Solo con justificante.', 'amb'] : ['Hoy mejor no faltes.', 'bad']) : v.status === 'amarillo' ? ['Puedes, pero con cuidado.', 'amb'] : ['Puedes faltar.', 'ok'];
    const col = T[1] === 'ok' ? 'var(--ok)' : T[1] === 'amb' ? 'var(--amb)' : 'var(--bad)';
    const viejo = existente().config;
    return top() + h1('Ya está') + '<div class="card ' + T[1] + ' stack"><div class="hero"><span class="light" style="background:' + col + '"></span><p class="big" style="color:' + col + '">' + esc(T[0]) + '</p></div>' +
      (T[1] === 'ok' && !v.free ? '<p>Luz verde, que no se haga costumbre.</p>' : '') + '</div>' +
      '<label class="toggle card"><input type="checkbox" data-a="compartir"' + (d.compartir ? ' checked' : '') + '><span class="t"><b>Compartir horario y reglas con mi clase</b><br><small class="sub">Así tus compañeros solo tienen que confirmar. Nunca se comparten tus faltas.</small></span></label>' +
      (viejo ? '<div class="card"><p class="sub" style="color:var(--tx2)">Esto cambia tu horario, tu calendario y tus reglas. Las faltas que ya tenías se quedan.</p></div>' : '') +
      foot(next('terminar', 'Empezar') + '<p class="sub center">La cifra oficial es siempre la de tu centro.</p><a class="link" href="legal.html">Qué datos salen de tu móvil</a>');
  };

  // ---------- datos derivados ----------
  function horarioFinal() { const hz = d.horario || {}; const sch = hz.schedule ? hz.schedule : H.aHorario(hz.rows || [], hz.grid || {}); return H.sinAsignaturas(sch, d.quitar); }
  function borradorEstado() {
    if (!d.centro || !d.horario) return null;
    return E.construir({ centro: d.centro, ciclo: d.ciclo, turno: d.turno, horario: d.horario, quitar: d.quitar, cal: d.cal, reglas: d.reglas, previas: d.faltoAntes ? d.previas : {}, importadas: d.faltoAntes ? (d.importadas || []).filter((f) => !(d.sinVaga && f.vaga)) : [], hoy: HOY, plantilla: d.plantilla, especiales: d.especiales });
  }
  const existente = () => ls.get(STATE) || {};

  // ---------- calendario: valores iniciales ----------
  function prepararCalendario() {
    const c = d.cal, curso = K.CURSO_2627, cat = d.centro.id && CAT.centreById(d.centro.id), tpl = d.tplCentro && d.tplCentro.data;
    const catTerms = cat && cat.terms ? cat.terms[Object.keys(cat.terms)[0]] : null;
    if (!c.inicio) { c.inicio = (tpl && tpl.inicio) || (catTerms && catTerms[0].from) || curso.inicioFP; c.inicioPropuesto = !(tpl && tpl.inicio) && !catTerms; }
    if (!c.fin) c.fin = (tpl && tpl.fin) || (catTerms && catTerms[catTerms.length - 1].to) || curso.finFP;
    if (!c.terms) c.terms = (tpl && tpl.terms) || (catTerms && catTerms.map((t) => Object.assign({}, t))) || K.trimestresPropuestos(c.inicio, c.fin, curso);
    if (!c.libres.length && tpl && tpl.libres) c.libres = tpl.libres.slice();
    if (c.locales == null) {
      const city = d.centro.city;
      const fromCat = cat ? (cat.holidays || []).filter((x) => /\(barcelona\)/i.test(x.label)).map((x) => ({ from: x.from, to: x.to, label: x.label.replace(/\s*\(barcelona\)/i, '') })) : null;
      if (fromCat && fromCat.length) c.locales = fromCat;
      else if (!city) c.locales = [];
      else K.festivosLocales(city).then((l) => { if (d.cal.locales == null) { d.cal.locales = l; save(); if (d.paso === 'calendario') render(false); } });
    }
  }

  // ---------- acciones ----------
  const A = {
    back,
    centroOtro: () => go('centroOtro'),
    pickCentro: (i) => { const c = ui.res[+i]; if (!c) return; d.centro = c; d.ciclo = null; d.tplGrupo = d.tplCentro = null; d.cal = nuevo().cal; go('ciclo'); },
    centroOtroOk: () => { const n = (ui.cn || '').trim(), c = (ui.cc || '').trim(); if (n.length < 3 || c.length < 2) { ui.err = 'Escribe el nombre del instituto y la ciudad.'; return render(false); } d.centro = { name: n, city: c, prov: true }; d.cal = nuevo().cal; go('ciclo'); },
    pickCiclo: (code) => { const c = CAT.CYCLES[code]; d.ciclo = { code, name: c.short + ' · ' + c.name }; ui.otra = false; save(); render(false); },
    cicloOtro: () => { ui.otra = true; d.ciclo = null; render(false); focusSoon('co'); },
    turno: (v) => { d.turno = v; save(); render(false); },
    cicloOk: async () => {
      if (ui.otra) { const n = (ui.co || '').trim(); if (n.length >= 3) d.ciclo = { name: n, prov: true }; }
      if (!d.ciclo || !d.turno) { ui.err = !d.ciclo ? 'Elige tu ciclo o escríbelo.' : 'Dinos si vas de mañana o de tarde.'; return render(false); }
      ui.err = ''; app.setAttribute('aria-busy', 'true');
      const r = await api('GET', '?g=' + encodeURIComponent(keyGrupo()) + '&c=' + encodeURIComponent(keyCentro()));
      app.removeAttribute('aria-busy');
      d.tplGrupo = (r && r.grupo) || []; d.tplCentro = (r && r.centro) || null; ui.tplIdx = 0;
      go(d.tplGrupo.length ? 'plantilla' : 'fuente');
    },
    tplIdx: (i) => { ui.tplIdx = +i; d.quitar = []; render(false); },
    verQuitar: () => { ui.quitar = true; render(false); },
    quitar: (s, el) => { const i = d.quitar.indexOf(s); if (el.checked && i >= 0) d.quitar.splice(i, 1); if (!el.checked && i < 0) d.quitar.push(s); save(); render(false); },
    tplSi: () => { const v = d.tplGrupo[ui.tplIdx] || d.tplGrupo[0]; d.horario = { schedule: v.data.schedule }; d.especiales = v.data.vigencia || v.data.periodos ? { vigencia: v.data.vigencia, periodos: v.data.periodos } : null; d.plantilla = { k: keyGrupo(), h: v.h }; d.fuente = 'plantilla'; prepararCalendario(); go(d.especiales ? 'calendario' : 'especial'); },
    especial: (v) => { d.especial = v === 'si'; save(); render(false); },
    especialOk: () => { if (d.especial == null) return; prepararCalendario(); go('calendario'); },
    desde: (v) => { d.desde = v; render(false); },
    guardarEdicion: () => guardarEdicion(),
    irApp: () => { location.href = './'; },
    unirseIgual: () => { d.paso = 'uniendo'; d.hist = []; render(true); unirse(); },
    entrar: () => { ui.err = ''; d.hist = []; d.paso = 'entrar'; render(true); focusSoon('eu'); },
    entrarOk: () => entrarCuenta(),
    tplNo: () => { d.quitar = []; go('fuente'); },
    pintarYo: () => { const f = { inicio: d.turno === 'tarde' ? '15:00' : '08:00', dur: 60, n: 6, tras: 3, rdur: 30 }; d.horario = { rows: H.franjas(f.inicio, f.dur, f.n, { tras: f.tras, dur: f.rdur }), grid: H.vacia(), cfg: f, extra: [] }; d.fuente = 'pintado'; ui.paint = paleta()[0] || null; ui.horas = true; go('editor'); },
    verHoras: () => { ui.horas = true; render(false); },
    aplicarHoras: () => {
      const f = { inicio: val('hi') || '08:00', dur: +val('hd') || 60, n: +val('hn') || 6, tras: +val('hr'), rdur: +val('hrd') || 30 };
      const rows = H.franjas(f.inicio, f.dur, f.n, f.tras ? { tras: f.tras, dur: f.rdur } : null);
      if (!rows.length) { ui.err = 'Revisa la hora de inicio.'; return render(false); }
      const grid = H.vacia(); H.DIAS.forEach((x) => Object.keys(d.horario.grid[x] || {}).forEach((r) => { if (+r < rows.length) grid[x][r] = d.horario.grid[x][r]; }));
      d.horario.rows = rows; d.horario.grid = grid; d.horario.cfg = f; ui.horas = false; ui.err = ''; if (ui.paint == null) ui.paint = paleta()[0] || null; save(); render(false);
    },
    paint: (s) => { if (s && ui.paint === s) { ui.ren = s; render(false); focusSoon('rn'); return; } ui.paint = s; ui.ren = null; render(false); },
    quitarSub: (s) => {
      const hz = d.horario, antes = JSON.stringify({ grid: hz.grid, extra: hz.extra || [], ocultas: hz.ocultas || [] }), paintAntes = ui.paint;
      const m = modDe(s) || s, mismo = (x) => x === s || modDe(x) === m;
      Object.keys(hz.grid).forEach((x) => Object.keys(hz.grid[x]).forEach((r) => { if (mismo(hz.grid[x][r])) delete hz.grid[x][r]; }));
      hz.extra = (hz.extra || []).filter((x) => !mismo(x)); hz.ocultas = Array.from(new Set((hz.ocultas || []).concat(m)));
      if (ui.paint === s) ui.paint = null;
      save(); render(false);
      aviso('Quitada ' + corto(s), () => { Object.assign(d.horario, JSON.parse(antes)); ui.paint = paintAntes; save(); render(false); });
    },
    addSub: () => { ui.add = true; render(false); focusSoon('ns'); },
    addSubOk: () => {
      const n = (val('ns') || '').trim().replace(/\s+/g, ' ').slice(0, 40); if (n.length < 2) { focusSoon('ns'); return; }
      if (paleta().indexOf(n) < 0) { d.horario.extra = (d.horario.extra || []).concat(n); d.horario.ocultas = (d.horario.ocultas || []).filter((x) => x !== (modDe(n) || n)); }
      ui.paint = n; save(); render(false); aviso('Añadida ' + n); focusSoon('ns'); // el campo sigue abierto para la siguiente
    },
    addSubFin: () => { ui.add = false; render(false); },
    renOk: () => renombrar(ui.ren, val('rn')),
    renNo: () => { ui.ren = null; render(false); },
    cell: (v) => pintaCelda(v),
    editorOk: () => { if (!pintadas().length) return; if (d.editar) return go('desde'); d.plantilla = null; go('especial'); },
    'cal-fechas': () => { ui.cambiarFechas = !ui.cambiarFechas; render(false); },
    'cal-local': () => { ui.localForm = !ui.localForm; render(false); focusSoon('ld'); },
    'cal-trim': () => { ui.cambiarTrim = !ui.cambiarTrim; render(false); },
    fechasOk: () => { const a = val('ci'), b = val('cf'); if (!a || !b || a > b) { ui.err = 'Revisa las fechas de inicio y final.'; return render(false); } d.cal.inicio = a; d.cal.fin = b; d.cal.inicioPropuesto = false; d.cal.terms = K.trimestresPropuestos(a, b); ui.cambiarFechas = false; ui.err = ''; save(); render(false); },
    localOk: () => { const x = val('ld'); if (!x) return; d.cal.locales = (d.cal.locales || []).concat({ from: x, to: x, label: 'Fiesta local' }).sort((p, q) => (p.from < q.from ? -1 : 1)); ui.localForm = false; save(); render(false); },
    trimOk: () => { const t = d.cal.terms.map((x, i) => Object.assign({}, x, { from: val('t' + i + 'a'), to: val('t' + i + 'b') })); const e = K.errorTrimestres(t); if (e) { ui.err = e; return render(false); } d.cal.terms = t; ui.cambiarTrim = false; ui.err = ''; save(); render(false); },
    libresVer: () => { ui.libresForm = true; ui.lb = d.cal.libres.slice(); d.cal.libres = []; d.cal.libresLuego = false; render(false); focusSoon('lb0'); },
    libresOk: () => { const l = [0, 1, 2, 3].map((i) => val('lb' + i)).filter(Boolean); if (!l.length) { ui.err = 'Pon al menos un día, o toca «Ponlos luego».'; return render(false); } d.cal.libres = Array.from(new Set(l)).sort(); ui.libresForm = false; ui.err = ''; save(); render(false); },
    libresLuego: () => { d.cal.libresLuego = true; d.cal.libres = []; ui.libresForm = false; save(); render(false); },
    calOk: () => {
      if (d.cal.locales == null) d.cal.locales = [];
      const e = K.errorTrimestres(d.cal.terms || []); if (e) { ui.err = e; return render(false); }
      if (d.editar) return guardarEdicion();
      const tr = d.tplCentro && d.tplCentro.data && d.tplCentro.data.reglas;
      if (tr && !d.reglas.tipo) { d.reglas = Object.assign({}, tr); d.reglasDeTpl = true; go('reglas4'); } else go('reglas1');
    },
    tipo: (t) => { d.reglas = { tipo: t, ambito: d.reglas.ambito, retrasos: d.reglas.retrasos }; d.reglasDeTpl = false; ui.otropct = ui.otropctSin = ui.otropctJust = false; save(); render(false); },
    reglas1Ok: () => { const t = d.reglas.tipo; if (!t) return; d.reglas = R.conDefecto(d.reglas); save(); go({ todas: 'reglas2a', sin: 'reglas2b', dos: 'reglas2c', nose: 'reglas3', mitad: 'reglas2m' }[t]); },
    pct: (v) => { const [k, p] = v.split(':'); d.reglas = Object.assign(R.conDefecto(d.reglas), { [k]: +p }); ui['otro' + k] = false; save(); render(false); },
    pctOtro: (k) => { ui['otro' + k] = true; render(false); focusSoon('po' + k); },
    cuenta: (v) => { d.reglas.cuenta = v; save(); render(false); },
    segundo: (v) => { d.reglas.segundo = v; save(); render(false); },
    reglas2Ok: () => { leerOtros(); const s = R.aSettings(d.reglas); if (s.error) { ui.err = s.error; return render(false); } go('reglas3'); },
    ambito: (v) => { d.reglas = Object.assign(R.conDefecto(d.reglas), { ambito: v }); save(); render(false); },
    retrasos: (v) => { d.reglas = Object.assign(R.conDefecto(d.reglas), { retrasos: v }); save(); render(false); },
    reglas3Ok: () => { d.reglas = R.conDefecto(d.reglas); save(); go('reglas4'); },
    reglasSi: () => (d.editar ? guardarEdicion() : go('previas')),
    cambiarReglas: () => { d.reglasDeTpl = false; go('reglas1'); },
    faltoAntes: (v) => { d.faltoAntes = v === 'si'; if (v === 'no') { d.previas = {}; d.importadas = []; d.dudosas = []; } save(); render(false); },
    prev: (v) => { const [s, k, n] = v.split('|'); const p = d.previas[s] || (d.previas[s] = {}); p[k] = Math.max(0, Math.min(200, (+p[k] || 0) + +n)); save(); render(false, '[data-v="' + cssEsc(v) + '"]'); },
    previasOk: () => { if (d.faltoAntes == null) return; go('listo'); },
    modo: (v) => { ui.imp = ''; ui.err = ''; go(v); },
    manoOk: () => { d.importadas = []; d.dudosas = []; if (d.editar) return guardarEdicion(); go('listo'); },
    pegar: async () => { try { const t = await navigator.clipboard.readText(); if (t) { ui.imp = t; render(false); } } catch (e) { aviso('Mantén pulsado el cuadro y toca «Pegar».'); } },
    copiarPrompt: async () => { const el = document.getElementById('prm'); try { await navigator.clipboard.writeText(el.value); aviso('Mensaje copiado'); } catch (e) { el.select(); document.execCommand && document.execCommand('copy'); aviso('Mensaje copiado'); } },
    leer: () => { const t = (val('imp') || '').trim(); if (t.length < 6) { ui.err = 'Pega aquí tu lista.'; return render(false); } leerTexto(t); },
    verTodas: () => { ui.verTodas = true; render(false); },
    otraLista: () => { ui.verTodas = false; go('previas'); },
    borrarImp: () => { d.importadas = []; d.dudosas = []; d.previas = {}; d.tutoria = 0; d.sinVaga = false; save(); go('previas'); },
    sinVaga: (v, el) => { d.sinVaga = !!el.checked; save(); render(false, '[data-a="sinVaga"]'); },
    impOk: () => { d.previas = {}; if (d.editar) return guardarEdicion(); go('listo'); },
    compartir: (v, el) => { d.compartir = !!el.checked; save(); },
    terminar: () => terminar()
  };
  function leerOtros() { ['pct', 'pctSin', 'pctJust'].forEach((k) => { if (!ui['otro' + k]) return; const p = R.okPct(val('po' + k)); if (p) d.reglas[k] = p; }); }

  async function terminar() {
    const st = borradorEstado(); if (!st || st.error) { ui.err = (st && st.error) || 'Falta algo.'; return render(false); }
    const old = existente(), oldF = old.faltas || [], hayPrevias = oldF.some((f) => f.note === 'previas');
    // no se pierde nada de lo que ya había: faltas, cuenta, avisos…
    const out = Object.assign({}, old, { config: st.config, settings: Object.assign({}, old.settings || {}, st.settings, { respuestas: R.conDefecto(d.reglas) }), faltas: oldF.concat(hayPrevias ? [] : st.faltas), since: old.since || st.since });
    // lo que se puso en Ajustes (casos especiales, reglas propias) no se pierde al rehacer el alta con el mismo horario
    if (old.config && !d.especiales) { ['vigencia'].forEach((k) => { if (old.config[k]) out.config[k] = old.config[k]; }); }
    // «Comprobado con tu lista hace X días» en Hoy: solo si las faltas vienen de la lista del centro (pegada, captura o IA)
    if (st.faltas.some((f) => /^importada/.test(f.note || ''))) out.comprobado = HOY;
    ls.set(STATE, out);
    if (d.compartir) {
      const b = app.querySelector('[data-a="terminar"]'); if (b) { b.disabled = true; b.textContent = 'Guardando…'; }
      await Promise.race([publicar(), new Promise((ok) => setTimeout(ok, 3000))]); // sin red, no se espera más
    }
    ls.del(DRAFT);
    location.href = './' + (HOY !== C.ymd(new Date()) ? '?hoy=' + HOY : '') + (d.especial ? '#ajustes/asig' : '');
  }

  /** Guarda solo la parte cambiada (modo editar desde Ajustes) y vuelve a la app. Nunca toca las faltas salvo en «faltas». */
  async function guardarEdicion() {
    const old = d.editar === 'horario' ? AJ.renombrar(existente(), (d.horario && d.horario.renombres) || {}) : existente(), out = JSON.parse(JSON.stringify(old)), cfg0 = old.config;
    if (d.editar === 'horario') {
      let desde = d.desde === 'siempre' ? null : d.desde === 'otro' ? val('dd') : HOY;
      if (d.desde === 'otro' && !/^\d{4}-\d{2}-\d{2}$/.test(desde || '')) { ui.err = 'Pon el día desde el que vale.'; return render(false); }
      let sch = horarioFinal();
      sch = AJ.reponerCuentas({ schedule: sch }, AJ.cuentas(cfg0)).schedule; // «cuenta dentro de» se conserva
      let cfg = Object.assign({}, cfg0, { schedule: sch });
      if (desde) cfg = C.withHistory(cfg0, cfg, desde);
      const sem = (cfg0.periods || []).filter((p) => p.todo); cfg.periods = (cfg0.periods || []).filter((p) => !p.todo);
      sem.forEach((p) => { const r = AJ.ponerSemanas(cfg, p); if (r.cfg) cfg = r.cfg; });
      out.config = cfg;
    } else if (d.editar === 'calendario') {
      const e = K.errorTrimestres(d.cal.terms || []); if (e) { ui.err = e; return render(false); }
      out.config.terms = d.cal.terms.map((t) => ({ id: t.id, label: t.label, from: t.from, to: t.to }));
      out.config.holidays = K.festivos(K.CURSO_2627, d.cal.locales, d.cal.libres);
      if (d.cal.libres.length) delete out.settings.libresPendientes; else out.settings.libresPendientes = K.CURSO_2627.diasLibreDisposicion;
    } else if (d.editar === 'reglas') {
      const s = E.settingsDe(d.reglas); if (s.error) { ui.err = s.error; return render(false); }
      out.settings = Object.assign({}, old.settings, s, { respuestas: R.conDefecto(d.reglas) });
      if (!(s.aproximado || []).length) delete out.settings.aproximado;
    } else if (d.editar === 'faltas') {
      const st = E.construir({ centro: d.centro, ciclo: d.ciclo, turno: d.turno, horario: { schedule: cfg0.schedule }, cal: { terms: cfg0.terms }, reglas: { tipo: 'nose' }, previas: d.previas, importadas: (d.importadas || []).filter((f) => !(d.sinVaga && f.vaga)), hoy: HOY });
      if (st.error) { ui.err = st.error; return render(false); }
      // una lista nueva manda sobre lo apuntado el mismo día, asignatura y tipo (como en el alta)
      const nuevas = st.faltas, k = (f) => f.date + '|' + f.subject + '|' + f.type, pisa = new Set(nuevas.filter((f) => f.date).map(k));
      out.faltas = (old.faltas || []).filter((f) => !f.date || !pisa.has(k(f))).concat(nuevas);
      if (nuevas.some((f) => /^importada/.test(f.note || ''))) out.comprobado = HOY;
    }
    ls.set(STATE, out);
    if (d.compartir && d.editar !== 'faltas' && d.ciclo && d.turno) await Promise.race([publicarDe(out.config, out.settings), new Promise((ok) => setTimeout(ok, 2500))]);
    salir();
  }
  /** Comparte la versión nueva con la clase (horario con sus casos especiales, calendario y reglas). Nunca faltas. */
  function publicarDe(cfg, set) {
    const dev = devId(), env = [api('POST', '', { tipo: 'grupo', k: keyGrupo(), dev, data: AJ.datosGrupo(cfg) })];
    const ts = cfg.terms.slice().sort((a, b) => (a.from < b.from ? -1 : 1)), c = { inicio: ts[0].from, fin: ts[ts.length - 1].to, terms: cfg.terms };
    const libres = (cfg.holidays || []).filter((h) => h.label === 'Libre disposición').map((h) => h.from); if (libres.length) c.libres = libres;
    const r = R.conDefecto((set && set.respuestas) || AJ.respuestasDe(set)); if (r.tipo !== 'nose') c.reglas = { tipo: r.tipo, pct: r.pct, cuenta: r.cuenta, pctSin: r.pctSin, pctJust: r.pctJust, segundo: r.segundo, ambito: r.ambito, retrasos: r.retrasos };
    env.push(api('POST', '', { tipo: 'centro', k: keyCentro(), dev, data: c }));
    return Promise.all(env);
  }
  /** Enlace de clase: busca la plantilla del grupo y salta a «¿Es este tu horario?». */
  async function unirse() {
    const r = await api('GET', '?g=' + encodeURIComponent(keyGrupo()) + '&c=' + encodeURIComponent(keyCentro()));
    d.tplGrupo = (r && r.grupo) || []; d.tplCentro = (r && r.centro) || null; ui.tplIdx = 0; d.hist = ['centro', 'ciclo'];
    d.paso = d.tplGrupo.length ? 'plantilla' : 'fuente'; save(); render(true);
  }
  async function entrarCuenta() {
    const b = app.querySelector('[data-a="entrarOk"]'); if (b) { b.disabled = true; b.textContent = 'Entrando…'; }
    const r = await window.NVCuenta.entrar(val('eu'), val('ep'));
    if (r.error) { ui.err = r.error; return render(false); }
    ls.set(STATE, Object.assign({}, r.estado, { acct: r.acct })); ls.del(DRAFT);
    location.href = './';
  }
  function publicar() {
    const dev = devId();
    const envios = [];
    if (d.fuente !== 'plantilla' || d.plantilla) { const hz = d.horario.schedule || H.aHorario(d.horario.rows, d.horario.grid); envios.push(api('POST', '', { tipo: 'grupo', k: keyGrupo(), dev, data: Object.assign({ schedule: hz }, d.especiales && d.especiales.vigencia ? { vigencia: d.especiales.vigencia } : {}, d.especiales && d.especiales.periodos ? { periodos: d.especiales.periodos } : {}) })); }
    const c = { inicio: d.cal.inicio, fin: d.cal.fin, terms: d.cal.terms };
    if (d.cal.libres.length) c.libres = d.cal.libres;
    const r = R.conDefecto(d.reglas); if (r.tipo !== 'nose') c.reglas = { tipo: r.tipo, pct: r.pct, cuenta: r.cuenta, pctSin: r.pctSin, pctJust: r.pctJust, segundo: r.segundo, ambito: r.ambito, retrasos: r.retrasos };
    envios.push(api('POST', '', { tipo: 'centro', k: keyCentro(), dev, data: c }));
    return Promise.all(envios);
  }

  /** Opciones del lector: asignaturas, sus otros nombres y cuántas horas hay cada día según el horario. */
  function optsLector() {
    const st = borradorEstado(); const S = st && !st.error ? Object.assign({}, st.config, { settings: Object.assign({}, C.DEF, st.settings), faltas: [] }) : null;
    const subs = subsPrevias(), cy = d.ciclo && d.ciclo.code;
    const alias = (x) => { const m = cy && CAT.matchModule(cy, x); return m ? [m.short, m.name].concat(m.alias) : [corto(x)]; };
    const blocks = (date, sub) => (S ? C.dayClasses(S, date) : []).filter((b) => b.subject === sub);
    const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
    return { curso: { inicio: (d.cal && d.cal.inicio) || K.CURSO_2627.inicio, fin: K.CURSO_2627.fin }, hoy: HOY, subs, alias,
      horasDia: (date, sub) => blocks(date, sub).reduce((a, b) => a + (+b.hours || 0), 0),
      bloquesDia: (date, sub) => blocks(date, sub).map((b) => ({ a: mins(b.start), b: mins(b.end), hours: +b.hours || 0 })) };
  }
  function leerTexto(t) {
    const r = NVImportar.leer(t, optsLector());
    d.importadas = NVImportar.unir(d.importadas || [], r.faltas);
    d.dudosas = (d.dudosas || []).concat(r.dudosas).slice(-200);
    d.tutoria = (d.tutoria || 0) + (r.tutoria || 0);
    ui.imp = ''; ui.verTodas = false; ui.err = '';
    if (d.paso === 'impLeyendo') { d.hist.pop(); d.paso = 'impFoto'; }
    go('impRevisar');
  }
  async function leerCapturasFaltas(files) {
    if (!files || !files.length) return;
    if (!window.FTShot || !FTShot.texto) { ui.err = 'No he podido cargar el lector. Prueba con «Copiar y pegar».'; return render(false); }
    ui.busy = { p: 0, msg: 'Cargando el lector…' }; go('impLeyendo');
    try {
      const t = await FTShot.texto(files, (p, msg) => { ui.busy = { p, msg }; const b = document.getElementById('pbar'), m = document.getElementById('msg'); if (b) b.style.width = Math.round(p * 100) + '%'; if (m) m.textContent = msg; });
      ui.busy = null; leerTexto(t || '');
    } catch (err) {
      ui.busy = null; d.hist.pop(); d.paso = 'impFoto';
      ui.err = err && err.message === 'net' ? 'No he podido cargar el lector. Comprueba la conexión o prueba con «Copiar y pegar».' : 'No he podido leer las capturas. Prueba con «Con una IA».';
      save(); render(true);
    }
  }

  // ---------- pintar: tocar una ficha y luego cada casilla (sin arrastrar: así hacer scroll no pinta) ----------
  function pintaCelda(v) {
    const [x, r] = v.split(':'), g = d.horario.grid[x] || (d.horario.grid[x] = {});
    if (ui.paint == null) { aviso('Elige primero una asignatura.'); return; }
    if (ui.paint && g[r] !== ui.paint) g[r] = ui.paint; else delete g[r];
    save(); render(false, '[data-v="' + v + '"]');
  }

  // ---------- eventos ----------
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]'); if (!t || t.disabled || !app.contains(t)) return;
    if (t.tagName === 'INPUT') return; // checkboxes: van por change
    e.preventDefault();
    const f = A[t.dataset.a]; if (f) f(t.dataset.v, t, e);
  });
  app.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.file) return leerCaptura(t.files && t.files[0]);
    if (t.dataset.imp) return leerCapturasFaltas(t.files);
    if (t.tagName === 'INPUT' && t.type === 'checkbox' && t.dataset.a) { const f = A[t.dataset.a]; if (f) f(t.dataset.v, t, e); }
  });
  app.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'q') return buscar(t.value);
    if (t.dataset.f) ui[t.dataset.f] = t.value;
  });
  app.addEventListener('keydown', (e) => {
    const lab = e.target.closest('label[role="button"]');
    if (lab && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lab.querySelector('input').click(); }
    if (e.key === 'Enter' && e.target.id === 'ns') { e.preventDefault(); A.addSubOk(); }
    if (e.key === 'Enter' && e.target.id === 'rn') { e.preventDefault(); A.renOk(); }
    if (e.key === 'Enter' && (e.target.id === 'eu' || e.target.id === 'ep')) { e.preventDefault(); A.entrarOk(); }
  });

  async function leerCaptura(file) {
    if (!file) return;
    if (!window.FTShot) { ui.err = 'No he podido cargar el lector. Píntalo tú: es rápido.'; return render(false); }
    ui.busy = { p: 0, msg: 'Cargando el lector…' }; go('leyendo');
    try {
      const r = await window.FTShot.read(file, (p, msg) => { ui.busy = { p, msg }; const b = document.getElementById('pbar'), m = document.getElementById('msg'); if (b) b.style.width = Math.round(p * 100) + '%'; if (m) m.textContent = msg; });
      if (!r || !r.ok || !r.rows || !r.rows.length) throw new Error('vacío');
      const hz = H.deCaptura(r); const r0 = hz.rows[0] || {}, dur0 = r0.start && r0.end ? H.min(r0.end) - H.min(r0.start) : 0;
      d.horario = { rows: hz.rows, grid: hz.grid, extra: hz.subjects, cfg: { n: hz.rows.length, inicio: hz.horasDudosas ? (d.turno === 'tarde' ? '15:00' : '08:00') : r0.start, dur: dur0 > 0 ? dur0 : 60 } }; d.fuente = 'captura';
      ui.horas = hz.horasDudosas; // si no se leyeron bien las horas, se piden antes de nada
      ui.paint = hz.subjects[0] || null; ui.busy = null; d.hist.pop(); d.paso = 'fuente'; go('editor');
    } catch (err) {
      ui.busy = null; d.hist.pop(); d.paso = 'fuente';
      ui.err = err && err.message === 'net' ? 'No he podido cargar el lector. Comprueba la conexión o píntalo tú.' : 'No he podido leer la captura. Prueba con otra en la que se vean los días y las horas, o píntalo tú.';
      save(); render(true);
    }
  }

  // ---------- pintar la pantalla ----------
  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ui[id]; };
  const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'));
  function pintar(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
  function focusSoon(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 30); }
  let toastT = null;
  /** Aviso breve. deshacer: función opcional; añade un botón «Deshacer» y dura más. */
  function aviso(t, deshacer) {
    const el = document.getElementById('aviso'); el.textContent = t;
    if (deshacer) { const b = document.createElement('button'); b.className = 'undo'; b.textContent = 'Deshacer'; b.onclick = () => { el.classList.remove('on'); deshacer(); }; el.appendChild(b); }
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), deshacer ? 5000 : 2200);
  }
  /** nuevaPantalla: lleva el foco al título y arriba del todo. keep: selector del elemento que tenía el foco. */
  function render(nuevaPantalla, keep) {
    const v = V[d.paso] || V.centro;
    const active = document.activeElement, keepSel = keep || (active && active.id ? '#' + cssEsc(active.id) : active && active.dataset && active.dataset.a ? '[data-a="' + active.dataset.a + '"][data-v="' + cssEsc(active.dataset.v || '') + '"]' : null);
    app.innerHTML = v();
    document.title = (app.querySelector('h1') ? app.querySelector('h1').textContent + ' · ' : '') + 'NoVoy';
    if (nuevaPantalla) { window.scrollTo(0, 0); const h = app.querySelector('h1'); if (h) h.focus({ preventScroll: true }); if (d.paso === 'centro') focusSoon('q'); }
    else if (keepSel) { const el = app.querySelector(keepSel); if (el) el.focus({ preventScroll: true }); }
  }

  if (d.paso === 'calendario') prepararCalendario();
  if (d.paso === 'uniendo') unirse();
  if (d.paso === 'leyendo') { d.paso = 'fuente'; }
  if (d.paso === 'impLeyendo') { d.paso = 'impFoto'; }
  render(true);
})();
