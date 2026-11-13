(function () {
  'use strict';
  const C = window.FTCore, SU = window.FTSetup, KEY = 'ft.v2';
  const $ = (s) => document.querySelector(s), app = $('#app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const nice = (s) => { const d = C.parse(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  const fmt = (n) => String(Math.round(parseFloat(n) * 100) / 100).replace('.', ',');
  const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rise = (i) => ' class="rise" style="--i:' + i + '"';

  // ---------- estado (solo en este dispositivo) ----------
  let user = load();
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
    const seed = window.FT_SEED; return seed ? JSON.parse(JSON.stringify(seed)) : { config: null, settings: {}, faltas: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} acSched(); }
  // --- cuenta (usuario+contraseña): envío cifrado con retardo tras cada cambio
  let acT = null, acBusy = false, acState = '';
  function acSched() { if (!user.acct || acBusy) return; clearTimeout(acT); acT = setTimeout(() => { acPush().catch(() => {}); }, 1500); }
  async function acPush() {
    const A = window.FTAcct; if (!user.acct || !A) return false;
    acBusy = true;
    try {
      const key = await A.impKey(user.acct.k);
      const data = await A.seal(key, SU.toExport(snapState()));
      const r = await A.api({ op: 'put', id: user.acct.id, auth: user.acct.auth, data });
      if (r.ok) { acState = 'ok'; user.acct.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} return true; }
      acState = r.error === 'clave' || r.error === 'no-existe' ? 'sesion' : 'err';
      return false;
    } catch (e) { acState = 'err'; return false; } finally { acBusy = false; }
  }
  const snapState = () => state() || Object.assign({}, blank(), { settings: Object.assign({}, C.DEF, user.settings), faltas: user.faltas || [] });
  const state = () => user.config && Object.assign({}, user.config, { settings: Object.assign({}, C.DEF, user.settings), faltas: user.faltas });
  const qd = new URLSearchParams(location.search).get('d');
  const today = () => (qd && /^\d{4}-\d\d-\d\d$/.test(qd) ? qd : C.ymd(new Date()));
  let tab = user.config ? 'hoy' : 'setup', viewTerm = null, undo = null, ed = null, efId = null, fday = '', simDay = null, simSel = [], wipe = null, instTab = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android';
  let sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: '' };

  function toast(msg, fn) {
    const t = $('#toast'); t.innerHTML = '<span>' + esc(msg) + '</span>' + (fn ? '<button>Deshacer</button>' : '');
    t.classList.add('on'); undo = fn || null; clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 5000);
  }
  $('#toast').addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON' && undo) { undo(); undo = null; $('#toast').classList.remove('on'); } });
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
  }

  // ---------- mascota: semáforo con ojos retro (se ilumina del color del veredicto) ----------
  const PAL = {
    verde: { a: '#B8F7DC', b: '#34D399', c: '#0E9F68', halo: '#2FE59B' },
    amarillo: { a: '#FFE9A6', b: '#F7BC3F', c: '#CF8508', halo: '#FFC948' },
    rojo: { a: '#FFB8B8', b: '#F06464', c: '#B92D2D', halo: '#FF6B6B' }
  };
  function mascot(st) {
    const P = PAL[st], idx = { rojo: 0, amarillo: 1, verde: 2 }[st], CY = [42, 100, 158], cy = CY[idx], X = 80;
    const arm = (side) => {
      const m = side === 'l' ? 1 : -1, sx = 34, sy = 104, ex = { verde: 10, amarillo: 12, rojo: 24 }[st], ey = { verde: 66, amarillo: 112, rojo: 56 }[st];
      const px = (x) => (m === 1 ? x : 160 - x);
      return '<g class="m-arm ' + side + '" style="transform-origin:' + px(sx) + 'px ' + sy + 'px"><path d="M' + px(sx) + ' ' + sy + 'Q' + px(14) + ' ' + (sy + 6) + ' ' + px(ex) + ' ' + (ey + 8) + '" stroke="#334155" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<g transform="translate(' + px(ex) + ' ' + ey + ')"><circle cx="-3.6" cy="-8" r="3.4" fill="#fff" stroke="#CBD5E1" stroke-width="1.2"/><circle cx="3.6" cy="-8" r="3.4" fill="#fff" stroke="#CBD5E1" stroke-width="1.2"/><circle r="9.6" fill="#fff" stroke="#CBD5E1" stroke-width="1.4"/></g></g>';
    };
    const lamps = CY.map((y, i) => {
      const on = i === idx, hood = (sx) => '<path d="M' + (sx < 80 ? 34 : 126) + ' ' + (y - 23) + 'l' + (sx < 80 ? -12 : 12) + ' 5v36l' + (sx < 80 ? 12 : -12) + '-5z" fill="#2B3748"/>' + (on ? '<path d="M' + (sx < 80 ? 34 : 126) + ' ' + (y - 23) + 'l' + (sx < 80 ? -12 : 12) + ' 5v36l' + (sx < 80 ? 12 : -12) + '-5z" fill="' + P.b + '" opacity=".32"/>' : '');
      return hood(0) + hood(160) + '<circle cx="' + X + '" cy="' + y + '" r="33" fill="#111827"/>' +
        (on ? '<circle class="m-halo" cx="' + X + '" cy="' + y + '" r="38" fill="' + P.halo + '" filter="url(#b-' + st + ')"/><circle cx="' + X + '" cy="' + y + '" r="28.5" fill="url(#g-' + st + ')"/><ellipse cx="' + (X - 9) + '" cy="' + (y - 14) + '" rx="9" ry="4.4" fill="#fff" opacity=".38" transform="rotate(-24 ' + (X - 9) + ' ' + (y - 14) + ')"/>'
          : '<circle cx="' + X + '" cy="' + y + '" r="28.5" fill="#2A3647"/><ellipse cx="' + (X - 9) + '" cy="' + (y - 14) + '" rx="8" ry="3.6" fill="#fff" opacity=".07" transform="rotate(-24 ' + (X - 9) + ' ' + (y - 14) + ')"/>');
    }).join('');
    const eye = (x) => '<g transform="translate(' + x + ' 0)"><g class="eye"><ellipse rx="5.8" ry="9.4" fill="#0B0F14"/><path d="M-3.7-5.6q-1.6 4.2-.2 8.6 1.8-1.2 2.4-3.6l-1.8-.2 1.9-1.1q-.3-2.1-2.3-3.7z" fill="#fff"/></g>' +
            '</g>';
    const brows = st === 'amarillo' ? '<path d="M-17-17q5-4 9-1.5" stroke="#0B0F14" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M6-19q5-3.4 10 1.2" stroke="#0B0F14" stroke-width="2" stroke-linecap="round" fill="none"/>' :
      st === 'rojo' ? '<path d="M-17-14l11-4M17-14l-11-4" stroke="#0B0F14" stroke-width="2.4" stroke-linecap="round"/>' : '';
    const lines = st === 'amarillo' ? '<g class="m-lines" stroke="#0B0F14" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M-22 -2q-2 5 0 10M-26 1q-1.6 4 0 7"/><path d="M22 -2q2 5 0 10M26 1q1.6 4 0 7"/></g>' : '';
    return '<svg class="mascot m-' + st + '" viewBox="0 0 160 244" role="img" aria-label="Semáforo en ' + { verde: 'verde', amarillo: 'ámbar', rojo: 'rojo' }[st] + '">' +
      '<defs><radialGradient id="g-' + st + '" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="' + P.a + '"/><stop offset=".55" stop-color="' + P.b + '"/><stop offset="1" stop-color="' + P.c + '"/></radialGradient><filter id="b-' + st + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter></defs>' +
      '<g class="m-body">' + arm('l') + arm('r') + '<ellipse cx="80" cy="232" rx="42" ry="8" fill="#1F2937"/><rect x="73" y="190" width="14" height="42" rx="4" fill="#334155"/>' +
      '<rect x="34" y="6" width="92" height="188" rx="28" fill="#1F2937" stroke="#0F172A" stroke-width="2.5"/>' + lamps +
      '<g transform="translate(' + X + ' ' + cy + ') scale(1.3)"><g class="m-eyes">' + eye(-10.5) + eye(10.5) + brows + lines + '</g></g></g></svg>';
  }
  const QUIPS = {
    verde: ['Tu margen lo aguanta. Con cabeza.', 'Luz verde. Que no se haga costumbre.', 'Hoy el sofá gana, y tus números también.'],
    amarillo: ['Se puede, pero ya pisas el límite.', 'Margen de supervivencia. Elige bien.', 'Puedes… pero luego no me llores.'],
    rojo: ['Aquí ya no hay pella que valga.', 'Hoy toca ir. Tu yo de diciembre te lo agradece.', 'Una falta más y toca recuperar. Ve a clase.']
  };
  const quip = (st, day) => QUIPS[st][+day.slice(-2) % QUIPS[st].length];
  function meter(pct, after, limit, st) {
    const w = (v) => Math.min(100, v / (limit * 1.2) * 100), seg = after != null && after > pct;
    return '<div class="bar" role="img" aria-label="' + fmt(pct) + '% de un máximo de ' + limit + '%"><i class="' + st + '" data-w="' + w(pct) + '"></i>' + (seg ? '<u data-l="' + w(pct) + '" data-w="' + (Math.min(w(after), 100) - w(pct)) + '"></u>' : '') + '<s style="left:' + w(limit) + '%"></s></div>';
  }
  const cnt = (v) => '<span class="cnt" data-v="' + v + '">' + fmt(v) + '</span>';

  // ---------- vistas principales ----------
  function emptyView(title, txt) {
    return '<div class="top"><h1>' + title + '</h1></div>' +
      '<div class="verdict verde">' + mascot('verde') + '<div><span class="who">NoVoy dice</span><b>Aún no sé tu horario</b><p>' + txt + '</p></div></div>' +
      '<div class="card"><div class="sec">Configúralo cuando quieras</div><p class="muted">Son un par de minutos: una captura, pintarlo tú o tu IA.</p><div class="btns"><button class="btn small primary" data-act="go-setup">Configurar mi horario</button></div></div>';
  }
  function viewHoy() {
    if (!user.config) return emptyView('Hoy', 'Sin horario no puedo decirte si puedes faltar. Esto es solo un vistazo a la app vacía.');
    const S = state(), day = today(), v = C.verdict(S, day), lim = S.settings.limite;
    const hol = (S.holidays || []).find((h) => day >= h.from && day <= (h.to || h.from));
    let h = '<div class="top"><span class="date">' + nice(day) + '</span><span class="chip">' + esc((S.terms.find((t) => t.id === v.term) || {}).label || 'Fuera de trimestre') + '</span></div>';
    if (v.free || !v.term) {
      const why = hol ? hol.label : (!v.term ? 'Estás fuera de los trimestres configurados' : 'No hay clase');
      h += '<div class="verdict verde">' + mascot('verde') + '<div><span class="who">NoVoy dice</span><b>Día libre</b><p>' + esc(why) + '. Nada que esconder.</p></div></div>';
      const nx = C.nextClassDay(S, day), nv = nx && C.verdict(S, nx);
      if (nv && nv.term) h += '<h2>Próximo día: ' + nice(nx) + '</h2>' + classCards(nv, lim, nx, false);
    } else {
      const worst = v.items.filter((i) => i.status === v.status && !i.unknown)[0];
      const T = { verde: 'Puedes faltar', amarillo: 'Mejor no', rojo: 'Hoy no' }[v.status];
      const q = v.status === 'verde' ? quip('verde', day) : (worst ? worst.name + ': ' : '') + quip(v.status, day);
      h += '<div class="verdict ' + v.status + '">' + mascot(v.status) + '<div><span class="who">NoVoy dice</span><b>' + T + '</b><p>' + esc(q) + '</p></div></div>' + allDay(v, day) + '<h2>Hora a hora</h2>' + classCards(v, lim, day, true);
    }
    if (!flagOff('imphint')) h += '<div class="card feat"><div class="sec">¿Ya llevas faltas de antes?</div><p class="muted">Si las tienes apuntadas en notas, una tabla o el Moodle, tu IA las pasa aquí de una vez. Copias, pegas y listo.</p><div class="btns"><button class="btn small primary" data-act="start-import">Pasar mis faltas</button><button class="btn small" data-act="imp-x">Ahora no</button></div></div>';
    if (user.acct && !flagOff('lnkhint')) h += '<div class="card"><div class="sec">Por si olvidas la contraseña</div><p class="muted">No pedimos correo, así que no se puede recuperar. Guárdate el enlace de copia en tus mensajes: con él vuelves a tener todo.</p><div class="btns"><button class="btn small primary" data-act="backup-link">Copiar mi enlace</button><button class="btn small" data-act="lnk-x">Ya lo tengo</button></div></div>';
    if (!standalone() && !hintOff() && /^https?:/.test(location.protocol)) h += '<div class="card hint"><div class="grow"><b>Instálala en tu móvil</b><span class="muted">Se abre como una app. Son 20 segundos.</span></div><button class="btn small primary" data-act="open-install">Cómo</button><button class="x" data-act="hint-x" aria-label="Cerrar">×</button></div>';
    if (bkDue()) h += '<div class="card hint"><div class="grow"><b>Guarda tu copia</b><span class="muted">Si pierdes el móvil, pierdes tus faltas.</span></div><button class="btn small primary" data-act="goto-backup">Guardar</button><button class="x" data-act="bk-x" aria-label="Cerrar">×</button></div>';
    return h;
  }
  function allDay(v, day) {
    const by = {}; v.slots.filter((x) => !x.unknown).forEach((x) => { by[x.subject] = (by[x.subject] || 0) + x.hours; });
    const parts = Object.keys(by).map((k) => k + ':' + by[k]); if (!parts.length) return '';
    return '<button class="btn block day-btn" data-miss="' + esc(day) + '|' + esc(parts.join(',')) + '">Falté todo el día</button>';
  }
  function classCards(v, lim, day, canMark) {
    return v.slots.map((i, n) => {
      const sub = i.subject !== i.canon ? ' <span class="muted">· cuenta en ' + esc(i.canon) + '</span>' : '';
      const tm = '<div class="tm"><b>' + i.start + '</b><span>' + i.end + '</span></div>';
      if (i.unknown) return '<div' + rise(Math.min(n, 8)) + '><div class="card slot"><div class="row">' + tm + '<div class="grow"><div class="name">' + esc(i.subject) + '</div><div class="muted">Sin horas totales para esta asignatura</div></div></div></div></div>';
      const word = i.status === 'rojo' ? 'te pasas ' + fmt(Math.abs(i.margin)) + ' h' : 'te quedan ' + fmt(i.margin) + ' h';
      return '<div' + rise(Math.min(n, 8)) + '><div class="card slot"><div class="row">' + tm + '<div class="grow"><div class="name">' + esc(i.subject) + (i.hours < 1 ? ' <span class="muted">· ' + fmt(i.hours) + ' h</span>' : '') + '</div><div class="muted">' + (sub ? 'cuenta en ' + esc(i.canon) : 'si faltas a esta hora') + '</div></div>' +
        '<div class="right"><div class="num">' + cnt(i.now) + '% → ' + cnt(i.after) + '%</div><span class="tag ' + i.status + '">' + word + '</span></div></div>' + meter(i.now, i.after, lim, i.status) +
        (canMark ? '<div class="btns"><button class="btn small" data-miss="' + esc(day) + '|' + esc(i.subject) + ':' + i.hours + '">Falté a esta hora</button></div>' : '') + '</div></div>';
    }).join('');
  }
  function curTerm(S) { return viewTerm || C.termOf(S, today()) || (S.terms.filter((t) => t.from <= today()).pop() || S.terms[0]).id; }
  function lastLine(x, rem) {
    let t = '';
    if (x.margin < 0) t = 'Ya te has pasado ' + fmt(-x.margin) + ' h del límite.';
    else if (!rem) return '';
    else if (rem <= x.margin) t = 'Quedan ' + fmt(rem) + ' h de clase y caben en tu margen: ya no puedes pasarte.';
    else if (x.margin === 0) t = 'Quedan ' + fmt(rem) + ' h de clase. No tienes margen: cualquier falta te pasa.';
    else t = 'Quedan ' + fmt(rem) + ' h de clase. Última falta posible: ' + fmt(x.margin) + ' h más; la siguiente ya te pasa.';
    return '<p class="last ' + x.status + '">' + t + '</p>';
  }
  function viewResumen() {
    if (!user.config) return emptyView('Resumen', 'Aquí verás el porcentaje de cada asignatura y cuántas horas te quedan.');
    const S = state(), lim = S.settings.limite, tid = curTerm(S), sum = C.summary(S, tid);
    let h = '<div class="top"><h1>Resumen</h1></div>';
    if (S.terms.length > 1) h += '<div class="btns" style="margin:0 0 4px">' + S.terms.map((t) => '<button class="btn small' + (t.id === tid ? ' primary' : '') + '" data-term="' + esc(t.id) + '">' + esc(t.label) + '</button>').join('') + '</div>';
    const rem = C.remaining(S, tid, today());
    h += '<button class="card sim-entry" data-act="open-sim"><span class="grow"><b>Simulador</b><span class="muted">¿Y si falto mañana? Míralo antes de decidir.</span></span><span class="arrow">›</span></button>';
    h += '<p class="muted">Máximo permitido: ' + lim + '% de faltas por asignatura.</p>';
    if (!sum.length) h += '<div class="card muted">Este trimestre aún no tiene horas.</div>';
    sum.sort((a, b) => a.margin - b.margin).forEach((x, n) => {
      h += '<div' + rise(n) + '><div class="card"><div class="row">' + avatar(S, x.name) + '<div class="grow"><div class="name">' + esc(x.name) + '</div></div><div class="right"><div class="num">' + cnt(x.pct) + '%</div><span class="tag ' + x.status + '">' + (x.margin < 0 ? 'pasado ' + fmt(-x.margin) + ' h' : 'margen ' + fmt(x.margin) + ' h') + '</span></div></div>' + meter(x.pct, null, lim, x.status) +
        '<div class="stats"><div><b>' + fmt(x.total) + ' h</b><span>Totales</span></div><div><b>' + fmt(x.limit) + ' h</b><span>Puedes faltar</span></div><div><b>' + fmt(x.absent) + ' h</b><span>Has faltado</span></div><div class="' + x.status + '"><b>' + (x.margin < 0 ? '−' : '') + fmt(Math.abs(x.margin)) + ' h</b><span>' + (x.margin < 0 ? 'Te pasas' : 'Margen') + '</span></div></div>' + lastLine(x, rem[x.name] || 0) + '</div></div>';
    });
    const un = user.faltas.filter((f) => !f.date && f.term === tid).length;
    if (un) h += '<p class="muted" style="margin-top:14px">' + un + ' falta(s) sin fecha cuentan en el total. Ponles fecha en "Faltas".</p>';
    return h;
  }
  const subjectsOf = (S) => Array.from(new Set(Object.values(S.schedule).flat().map((b) => b.subject))).sort();
  // asignaturas del día de la semana de esa fecha (si no hay clase ese día, todas)
  const subjectsOn = (S, date) => { const d = date && /^\d{4}-\d\d-\d\d$/.test(date) ? C.weekday(date) : 0, day = Array.from(new Set((S.schedule[d] || []).map((b) => b.subject))); return day.length ? { list: day, all: false } : { list: subjectsOf(S), all: true }; };
  const subjectOpts = (S, date, sel) => { const r = subjectsOn(S, date); return r.list.map((x) => '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>').join(''); };
  // avatar por asignatura: iniciales + color fijo de la paleta (según su posición en la lista de asignaturas)
  const AVC = ['#6366F1', '#0EA5E9', '#14B8A6', '#8B5CF6', '#3B82F6', '#0891B2', '#64748B', '#7C3AED', '#2563EB', '#0D9488', '#4F46E5', '#0284C7'];
  function initials(n) {
    const t = String(n).split(/[\s.&()]+/).filter(Boolean); if (!t.length) return '?';
    if (t.length === 1) return t[0].slice(0, 3).toUpperCase();
    if (/^[IVX]+$/.test(t[1])) return t[0].slice(0, 3).toUpperCase();
    return (t[0][0] + t[1][0]).toUpperCase();
  }
  function avatar(S, name) {
    const all = Array.from(new Set(subjectsOf(S).concat(user.faltas.map((f) => f.subject)))).sort(), i = Math.max(0, all.indexOf(name)), ini = initials(name);
    return '<span class="av' + (ini.length > 2 ? ' s3' : '') + '" style="--c:' + AVC[i % AVC.length] + '" aria-hidden="true">' + esc(ini) + '</span>';
  }
  function viewFaltas() {
    if (!user.config) return emptyView('Faltas', 'Aquí se apuntan tus faltas, una a una o importadas de donde las tengas.');
    const S = state();
    let h = '<div class="top"><h1>Faltas</h1></div><form id="add" class="card"><div class="sec">Apuntar una falta</div>' +
      '<div class="two"><div class="field"><label>Fecha</label><input type="date" name="date" value="' + today() + '" required></div><div class="field"><label>Horas</label><input type="number" name="hours" min="0" step="any" value="1"></div></div>' +
      '<div class="field"><label>Asignatura</label><select name="subject">' + subjectOpts(S, today()) + '</select><div class="muted" id="subhint">' + (subjectsOn(S, today()).all ? 'Ese día no hay clase: salen todas.' : 'Solo las de ese día.') + '</div></div>' +
      '<div class="switch" style="margin-top:12px"><label for="rt">Es un retraso (no cuenta)</label><input id="rt" type="checkbox" name="retraso"></div><div class="switch"><label for="ju">Justificada</label><input id="ju" type="checkbox" name="justified"></div>' +
      '<button class="btn primary block" style="margin-top:10px">Añadir falta</button></form><h2>Registradas</h2>';
    h = h.replace('<h2>Registradas</h2>', '');
    const list = user.faltas.filter((f) => !fday || f.date === fday).sort((a, b) => ((b.date || '0') < (a.date || '0') ? -1 : 1));
    h += '<div class="top" style="margin-top:22px"><h2 style="margin:0">' + (user.faltas.length === 1 ? 'Registrada 1 falta' : 'Registradas ' + user.faltas.length + ' faltas') + '</h2></div><div class="filter"><div class="field" style="margin:0;flex:1"><label>Filtrar por día</label><input type="date" id="fday" value="' + (fday || '') + '"></div>' + (fday ? '<button class="btn small" data-act="fclear">Ver todas</button>' : '') + '</div>';
    h += list.length ? list.map((f, n) => f.id === efId ? editForm(S, f) : faltaCard(f, n)).join('') : '<p class="muted">' + (fday ? 'Ese día no hay faltas apuntadas.' : 'Aún no hay faltas. Qué sospechoso.') + '</p>';
    return h;
  }
  /** Tramo horario de esa clase según el horario, p.ej. "11:30 – 12:30". */
  function slotTime(S, f) {
    if (!f.date || !/^\d{4}-\d\d-\d\d$/.test(f.date)) return '';
    const bl = (S.schedule[C.weekday(f.date)] || []).filter((b) => b.subject === f.subject);
    if (!bl.length) return '';
    if (bl.length === 1) return bl[0].start + ' – ' + bl[0].end;
    const tot = bl.reduce((a, b) => a + (+b.hours || 0), 0);
    if (Math.abs(tot - (+f.hours || 0)) < 0.01) return bl[0].start + ' – ' + bl[bl.length - 1].end;
    return bl.map((b) => b.start + '–' + b.end).join(', ');
  }
  function faltaCard(f, n) {
    const S = state(), tags = (f.type === 'retraso' ? '<span class="tag neutral">retraso</span>' : '') + (f.justified ? '<span class="tag ok">justificada</span>' : '');
    return '<div' + rise(Math.min(n, 8)) + '><div class="card row">' + avatar(S, f.subject) + '<div class="grow"><div class="name">' + esc(f.subject) + ' <span class="muted">· ' + fmt(f.hours) + ' h</span></div><div class="muted">' + (f.date ? nice(f.date) : 'sin fecha') + (slotTime(S, f) ? ' · ' + slotTime(S, f) : '') + '</div>' + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div><div class="acts"><button class="btn small" data-edit="' + esc(f.id) + '">Editar</button><button class="btn small ghost" data-del="' + esc(f.id) + '" aria-label="Borrar falta">Borrar</button></div></div></div>';
  }
  function editForm(S, f) {
    const subs = subjectsOf(S); if (f.subject && subs.indexOf(f.subject) < 0) subs.push(f.subject);
    return '<form id="edf" class="card editing" data-id="' + esc(f.id) + '"><div class="sec">Editar falta</div><div class="two"><div class="field"><label>Fecha</label><input type="date" name="date" value="' + esc(f.date || '') + '"></div><div class="field"><label>Horas</label><input type="number" name="hours" min="0" step="any" value="' + f.hours + '"></div></div>' +
      '<div class="field"><label>Asignatura</label><select name="subject">' + subs.map((x) => '<option' + (x === f.subject ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select></div>' +
      '<div class="switch" style="margin-top:12px"><label for="ert">Es un retraso (no cuenta)</label><input id="ert" type="checkbox" name="retraso"' + (f.type === 'retraso' ? ' checked' : '') + '></div><div class="switch"><label for="eju">Justificada</label><input id="eju" type="checkbox" name="justified"' + (f.justified ? ' checked' : '') + '></div>' +
      '<div class="btns"><button type="button" class="btn small" data-act="ecancel">Cancelar</button><button class="btn small primary">Guardar cambios</button></div></form>';
  }
  function acctCard() {
    const A = window.FTAcct; if (!A || !window.crypto || !crypto.subtle) return '';
    if (user.acct) {
      const when = user.acct.t ? new Date(user.acct.t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'todavía no';
      const warn = acState === 'err' ? '<p class="muted">No se pudo guardar la última vez. Se reintenta con cada cambio.</p>' : acState === 'sesion' ? '<p class="muted">La sesión ya no vale. Cierra sesión y vuelve a entrar.</p>' : '';
      return '<div class="card"><div class="sec">Cuenta</div><p class="muted">Conectado como <b>' + esc(user.acct.u) + '</b>. Tus datos se guardan cifrados tras cada cambio. Último guardado: ' + when + '.</p>' + warn + '<div class="btns"><button class="btn small primary" data-act="acct-push">Guardar ahora</button><button class="btn small" data-act="acct-out">Cerrar sesión</button></div></div>';
    }
    if (!acg.u) acg.u = A.genUser();
    const checks = A.passChecks(acg.p || '');
    return '<div class="card"><div class="sec">Cuenta</div><p class="muted">Usuario y contraseña, sin correo. Entra en otro móvil y recupera tu horario y tus faltas.</p>' +
      '<div class="field"><label>Usuario</label><div class="two" style="grid-template-columns:1fr auto"><input id="ac-u" value="' + esc(acg.u) + '" autocomplete="username" aria-label="Usuario"><button class="btn small" data-act="acct-dice" aria-label="Otro usuario">🎲</button></div></div>' +
      '<div class="field"><label>Contraseña</label><input id="ac-p" type="password" value="' + esc(acg.p || '') + '" autocomplete="new-password" aria-label="Contraseña"></div>' +
      '<ul class="list acc-chk">' + checks.map((c) => '<li data-ok="' + (c[1] ? 1 : 0) + '">' + (c[1] ? '✅' : '◻️') + ' ' + c[0] + '</li>').join('') + '</ul>' +
      '<div class="btns"><button class="btn small primary" data-act="acct-new">Crear cuenta</button><button class="btn small" data-act="acct-login">Ya tengo cuenta: entrar</button></div></div>';
  }
  const acg = { u: '', p: '' };
  function viewAjustes() {
    const S = state(), s = S.settings, hasAlias = Object.keys(S.alias || {}).length;
    const sw = (k, label, hint) => '<div class="switch"><div><div style="font-weight:700">' + label + '</div><div class="muted">' + hint + '</div></div><input type="checkbox" data-set="' + k + '"' + (s[k] ? ' checked' : '') + '></div>';
    return '<div class="top"><h1>Ajustes</h1></div>' +
      '<div class="card"><div class="sec">Horario y calendario</div><p class="muted">Edítalo a mano o deja que tu IA lo haga por ti.</p><div class="btns"><button class="btn small primary" data-act="edit">Editar horario</button><button class="btn small" data-act="start-setup">Con mi IA</button><button class="btn small" data-act="start-update">Actualizar faltas con IA</button></div></div>' +
      '<div class="card">' + (hasAlias ? sw('unificar', 'Unificar asignaturas', 'Algunas cuentan dentro de otra (ej. proyectos).') : '') + sw('justificadasCuentan', 'Las justificadas cuentan', 'Si lo apagas, no suman al límite.') + '</div>' +
      '<div class="card"><div class="two"><div class="field" style="margin-top:0"><label>Límite de faltas (%)</label><input type="number" data-num="limite" min="1" max="100" value="' + s.limite + '"></div>' +
      '<div class="field" style="margin-top:0"><label>Aviso si quedan (h) o menos</label><input type="number" data-num="aviso" min="0" step="any" value="' + s.aviso + '"></div></div></div>' +
      (standalone() ? '' : '<div class="card"><div class="sec">Instálala en tu móvil</div><p class="muted">Icono en la pantalla de inicio, como una app.</p><div class="btns"><button class="btn small primary" data-act="open-install">Cómo instalarla</button></div></div>') +
      '<div class="card share"><div class="sec">Pásalo a tu clase</div><p class="muted">Un enlace con tu horario y calendario (sin tus faltas). Tus compañeros lo abren y ya está configurado.</p><div class="btns"><a class="btn small primary" id="sh-wa" target="_blank" rel="noopener">WhatsApp</a><button class="btn small" data-act="share">Compartir / copiar enlace</button></div></div>' +
      acctCard() + '<div class="card"><div class="sec">Copia de seguridad</div><p class="muted">Tus datos solo viven en este móvil. El enlace de copia lleva tu horario y tus faltas: guárdalo en tus mensajes y, si cambias de móvil, ábrelo para restaurar todo. No lo compartas con nadie.</p><div class="btns"><button class="btn small primary" data-act="backup-link">Copiar mi enlace de copia</button><button class="btn small" id="exp">Exportar archivo</button><label class="btn small" for="imp">Importar</label><input id="imp" type="file" accept="application/json" hidden></div></div>' +
      '<div class="card danger"><div class="sec">Empezar de cero</div>' + (wipe ? '<p><b>' + (wipe === 'todo' ? 'Se borrará todo: horario, calendario, ajustes y faltas.' : 'Se borrarán todas tus faltas. El horario se queda.') + '</b> Podrás deshacerlo unos segundos. Si lo dejas pasar, no hay vuelta atrás: haz antes tu copia.</p><div class="btns"><button class="btn small" data-act="wipe-no">Cancelar</button><button class="btn small bad" data-act="wipe-yes">Sí, borrar</button></div>' : '<p class="muted">Para empezar el curso limpio o si te has liado.</p><div class="btns"><button class="btn small" data-act="wipe-faltas">Borrar solo las faltas</button><button class="btn small" data-act="wipe-todo">Borrar todo</button></div>') + '</div>' +
      '<div class="card"><div class="btns" style="margin-top:0"><button class="btn small" id="theme">Claro / oscuro</button><button class="btn small" data-act="refresh">Actualizar app</button></div><p class="muted" style="margin-top:10px">«Actualizar app» borra la caché de la app por si algo no se ve actualizado. No toca tus faltas ni tu horario.</p><p class="muted">' + esc(S.center || '') + '</p></div>';
  }

  // ---------- editor manual ----------
  const blank = () => ({ center: '', terms: [], holidays: [], schedule: {}, alias: {}, totals: {}, totalsUnified: {} });
  function openEditor() {
    const cfg = user.config ? JSON.parse(JSON.stringify(user.config)) : blank();
    ed = { cfg, orig: structKey(cfg), hasConfig: !!user.config }; tab = 'editor'; render(); scrollTo(0, 0);
  }
  const structKey = (c) => JSON.stringify([c.terms, c.holidays, c.schedule, c.alias]);
  const edSubjects = () => Array.from(new Set(Object.values(ed.cfg.schedule).flat().map((b) => b.subject))).sort();
  function edCheck() { return SU.parseImport(SU.toExport(Object.assign({}, ed.cfg, { settings: { limite: user.settings.limite || 25 }, faltas: [] }))); }
  const DAYORDER = [1, 2, 3, 4, 5, 6];
  function viewEditor() {
    const c = ed.cfg, r = edCheck(), subs = edSubjects();
    let h = '<div class="steps"><button class="back" data-act="ed-close">‹ Atrás</button><h1>Editar horario</h1></div>';
    if (!r.ok) h += '<div class="card warn"><div class="sec">Para poder guardar</div><ul class="list">' + r.errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>';
    // horario
    h += '<div class="card"><div class="sec">Clases</div>';
    const days = DAYORDER.filter((d) => c.schedule[d] && c.schedule[d].length);
    h += days.length ? days.map((d) => '<div class="day"><b>' + DAYS[d] + '</b><span style="flex:1">' + c.schedule[d].map((b, i) => '<span class="item"><span class="grow">' + esc(b.subject) + '<span class="muted"> · ' + b.start + '–' + b.end + ' · ' + b.hours + ' h</span></span><button class="x" data-ed="blk|' + d + '|' + i + '" aria-label="Quitar ' + esc(b.subject) + '">×</button></span>').join('') + '</span></div>').join('') : '<p class="muted">Aún no hay clases.</p>';
    h += '<form id="f-blk" style="margin-top:14px;border-top:1px solid var(--line);padding-top:4px"><div class="two"><div class="field"><label>Día</label><select name="day">' + [1, 2, 3, 4, 5].map((d) => '<option value="' + d + '">' + DAYS[d] + '</option>').join('') + '</select></div><div class="field"><label>Horas de clase</label><input type="number" name="hours" min="0.1" max="12" step="any" value="1" required></div></div>' +
      '<div class="two"><div class="field"><label>Empieza</label><input type="time" name="start" value="08:00" required></div><div class="field"><label>Termina</label><input type="time" name="end" value="09:00" required></div></div>' +
      '<div class="field"><label>Asignatura</label><input name="subject" list="subs" placeholder="Ej. Matemáticas" required autocomplete="off"><datalist id="subs">' + subs.map((s) => '<option value="' + esc(s) + '">').join('') + '</datalist></div><button class="btn small block" style="margin-top:12px">Añadir clase</button></form></div>';
    // trimestres
    h += '<div class="card"><div class="sec">Trimestres</div>' + (c.terms.length ? c.terms.map((t, i) => '<div class="item"><span class="grow">' + esc(t.label) + '<span class="muted"> · ' + nice(t.from) + ' → ' + nice(t.to) + '</span></span><button class="x" data-ed="term|' + i + '" aria-label="Quitar ' + esc(t.label) + '">×</button></div>').join('') : '<p class="muted">Añade al menos uno.</p>') +
      '<form id="f-term" style="margin-top:12px;border-top:1px solid var(--line);padding-top:4px"><div class="field"><label>Nombre</label><input name="label" placeholder="1r trimestre" required></div><div class="two"><div class="field"><label>Desde</label><input type="date" name="from" required></div><div class="field"><label>Hasta</label><input type="date" name="to" required></div></div><button class="btn small block" style="margin-top:12px">Añadir trimestre</button></form></div>';
    // festivos
    h += '<div class="card"><div class="sec">Festivos y vacaciones</div>' + (c.holidays.length ? c.holidays.slice().sort((a, b) => (a.from < b.from ? -1 : 1)).map((x) => '<div class="item"><span class="grow">' + esc(x.label) + '<span class="muted"> · ' + nice(x.from) + (x.to && x.to !== x.from ? ' → ' + nice(x.to) : '') + '</span></span><button class="x" data-ed="hol|' + c.holidays.indexOf(x) + '" aria-label="Quitar ' + esc(x.label) + '">×</button></div>').join('') : '<p class="muted">Sin festivos todavía.</p>') +
      '<form id="f-hol" style="margin-top:12px;border-top:1px solid var(--line);padding-top:4px"><div class="field"><label>Nombre</label><input name="label" placeholder="Fiesta Nacional" required></div><div class="two"><div class="field"><label>Desde</label><input type="date" name="from" required></div><div class="field"><label>Hasta (opcional)</label><input type="date" name="to"></div></div><button class="btn small block" style="margin-top:12px">Añadir festivo</button></form></div>';
    // unificar
    const free = subs.filter((s) => !c.alias[s]);
    h += '<div class="card"><div class="sec">Asignaturas que cuentan juntas</div><p class="muted">Por ejemplo, varios profesores de un mismo proyecto.</p>' + Object.keys(c.alias).map((k) => '<div class="item"><span class="grow">' + esc(k) + '<span class="muted"> → dentro de ' + esc(c.alias[k]) + '</span></span><button class="x" data-ed="ali|' + esc(k) + '" aria-label="Quitar unión de ' + esc(k) + '">×</button></div>').join('') +
      (subs.length > 1 ? '<form id="f-ali" style="margin-top:12px;border-top:1px solid var(--line);padding-top:4px"><div class="two"><div class="field"><label>Asignatura</label><select name="a">' + free.map((s) => '<option>' + esc(s) + '</option>').join('') + '</select></div><div class="field"><label>Cuenta dentro de</label><select name="b">' + subs.map((s) => '<option>' + esc(s) + '</option>').join('') + '</select></div></div><button class="btn small block" style="margin-top:12px">Unir</button></form>' : '') + '</div>';
    if (ed.hasConfig && ed.orig !== structKey(c)) h += '<p class="muted" style="margin:14px 2px 0">Al guardar, las horas totales de cada asignatura se recalculan con este horario y los festivos.</p>';
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="ed-close">Cancelar</button><button class="btn primary"' + (r.ok ? '' : ' disabled') + ' data-act="ed-save">Guardar</button></div></div>';
  }
  function edSave() {
    const prev = JSON.stringify(user), changed = ed.orig !== structKey(ed.cfg), cfg = ed.cfg;
    if (changed) { cfg.totals = {}; cfg.totalsUnified = {}; }
    const hadAlias = user.config && Object.keys(user.config.alias || {}).length, hasAlias = Object.keys(cfg.alias).length;
    user.config = cfg; user.settings = Object.assign({ limite: 25, aviso: 2, justificadasCuentan: true }, user.settings);
    if (!hadAlias && hasAlias) user.settings.unificar = true; if (!hasAlias) user.settings.unificar = false;
    user.faltas = user.faltas || []; save(); ed = null; tab = 'hoy'; viewTerm = null; render();
    toast('Horario guardado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
  }
  const mm = (t) => +t.slice(0, 2) * 60 + +t.slice(3);

  // ---------- asistente "Configurar con mi IA" ----------
  function promptText() { return sx.mode === 'import' ? SU.buildImportPrompt(SU.toExport(state())) : sx.mode === 'update' ? SU.buildUpdatePrompt(SU.toExport(state())) : SU.buildPrompt(); }
  const hasAcct = () => !!(window.FTAcct && window.crypto && crypto.subtle);
  /** Pantalla 1 del asistente: crear cuenta (o entrar), antes de tocar el horario. */
  function viewAcctStep() {
    const A = window.FTAcct, login = sx.scr === 'login';
    let h = '<div class="steps">' + (login ? '<button class="back" data-act="go-reg">‹ Atrás</button>' : '') + '</div>';
    if (login) {
      h += '<h1>Entrar en tu cuenta</h1><p class="muted" style="margin-top:6px">Recupera tu horario y tus faltas en este móvil.</p>' +
        '<div class="card"><div class="field"><label>Usuario</label><input id="ac-u" value="' + esc(acg.u) + '" autocomplete="username" aria-label="Usuario"></div>' +
        '<div class="field"><label>Contraseña</label><input id="ac-p" type="password" value="' + esc(acg.p) + '" autocomplete="current-password" aria-label="Contraseña"></div></div>' +
        '<div class="card"><div class="sec">¿Sin cuenta pero con copia?</div><p class="muted">Si guardaste tu enlace de copia o un archivo, también sirve.</p><textarea id="rl" rows="2" style="min-height:64px" placeholder="Pega aquí tu enlace de copia" aria-label="Enlace de copia"></textarea><div class="btns" style="margin-top:10px"><button class="btn small" data-act="restore-link">Restaurar enlace</button><label class="btn small" for="imp">Importar archivo</label><input id="imp" type="file" accept="application/json" hidden></div></div>';
      return h + '<div class="cta"><div class="in"><button class="btn primary" data-act="acct-login">Entrar</button></div></div>';
    }
    if (!acg.u) acg.u = A.genUser();
    const checks = A.passChecks(acg.p || '');
    h += '<div class="verdict verde">' + mascot('verde') + '<div><b>Primero, tu cuenta</b><p>Sin correo ni datos personales. Sirve para recuperar tus faltas si cambias de móvil o borras la app.</p></div></div>' +
      '<div class="card"><div class="field"><label>Usuario</label><div class="two" style="grid-template-columns:1fr auto"><input id="ac-u" value="' + esc(acg.u) + '" autocomplete="username" aria-label="Usuario"><button class="btn small" data-act="acct-dice" aria-label="Generar otro usuario">🎲</button></div><p class="muted mini">Te hemos puesto uno al azar. Puedes cambiarlo.</p></div>' +
      '<div class="field"><label>Contraseña</label><input id="ac-p" type="password" value="' + esc(acg.p) + '" autocomplete="new-password" aria-label="Contraseña"></div>' +
      '<ul class="list acc-chk">' + checks.map((c) => '<li>' + (c[1] ? '✅' : '◻️') + ' ' + c[0] + '</li>').join('') + '</ul></div>' +
      '<div class="card warn"><div class="sec">Apunta la contraseña ahora</div><p>No pedimos correo, así que <b>no hay forma de recuperarla</b>. Guárdala en tu gestor:</p><ul class="list"><li><b>iPhone</b>: app <b>Contraseñas</b> (o «Guardar contraseña» cuando te lo ofrezca Safari).</li><li><b>Android</b>: <b>Gestor de contraseñas de Google</b> (Ajustes › Google › Autocompletar).</li></ul><p class="muted">Al crearla te damos también un enlace de copia para guardar en tus mensajes.</p></div>' +
      '<p class="muted mini" style="text-align:center;margin-top:16px"><button class="link" data-act="go-login">Ya tengo cuenta: entrar</button> · <button class="link" data-act="skip-reg">Ahora no</button></p>' +
      '<div class="btns share-row"><button class="btn small" data-act="share-app"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/></svg>Compartir</button></div>';
    return h + '<div class="cta"><div class="in"><button class="btn primary" data-act="acct-new">Crear cuenta</button></div></div>';
  }
  function viewSetup() {
    const imp = sx.mode === 'import', upd = sx.mode === 'update' || imp, total = 4, st = sx.step;
    if (!sx.scr) sx.scr = (!upd && !user.acct && !user.config && hasAcct()) ? 'reg' : 'method';
    if (!upd && !sx.ai && (sx.scr === 'reg' || sx.scr === 'login')) return viewAcctStep();
    let h = '<div class="steps">' + (user.config || user.skipCfg ? '<button class="back" data-act="close">‹ Atrás</button>' : (hasAcct() ? '<button class="back" data-act="go-reg">‹ Atrás</button>' : '')) + '<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + st + '"><i style="width:' + st / total * 100 + '%"></i></div></div>';
    let cta = '';
    if (st === 1 && !upd && !sx.ai) {
      h += '<div class="verdict verde">' + mascot('verde') + '<div><b>Ahora tu horario</b><p>Elige cómo prefieres meterlo. Se tarda un par de minutos.</p></div></div>' +
        '<input id="qshot" type="file" accept="image/*" hidden>' +
        '<div class="card feat"><div class="sec">Pintarlo yo</div><p class="muted">Tocas las casillas de tu semana y les pones nombre. Lo más rápido si tu horario es sencillo.</p><button class="btn primary small" style="margin-top:10px" data-act="q-start">Pintarlo yo</button></div>' +
        '<div class="card"><div class="sec">Con mi IA</div><p class="muted">Le das fotos de tu horario y ella lo rellena.</p><button class="btn small" style="margin-top:10px" data-act="ai-go">Configurar con mi IA</button></div>' +
        (user.config ? '' : '<p class="muted mini" style="text-align:center;margin-top:18px"><button class="link" data-act="skip-cfg">Ahora no, quiero ver la app primero</button></p>' +
          (!user.acct && hasAcct() ? '<p class="muted mini" style="text-align:center;margin-top:8px"><button class="link" data-act="go-reg">Crear cuenta</button></p>' : ''));
      cta = '<label class="btn primary" for="qshot">Subir captura</label>';
    } else if (st === 1) {
      h += '<div class="verdict verde">' + mascot('verde') + '<div><b>' + (imp ? 'Pasa tus faltas a NoVoy' : upd ? 'Actualiza con tu IA' : 'Configúralo en 2 minutos') + '</b><p>' + (imp ? 'Copia estas instrucciones, pégalas en tu IA y detrás pega tus faltas tal cual las tengas.' : upd ? 'Cuéntale qué faltas has tenido y ella lo apunta.' : 'Tu IA lee las fotos de tu horario y tu calendario. Tú solo revisas.') + '</p></div></div>' +
        '<p style="margin-top:18px">Primero copia las instrucciones. Tu IA sabrá exactamente qué hacer.</p>' +
        '<details><summary>Ver el texto</summary><textarea readonly id="pt" aria-label="Instrucciones para tu IA">' + esc(promptText()) + '</textarea><p class="muted">Si no se copia solo, mantén pulsado el texto y elige Copiar.</p></details>' +
        '';
      cta = (upd ? '' : '<button class="btn" data-act="ai-back">Volver</button>') + '<button class="btn primary" data-act="copy-prompt">' + (sx.copied ? 'Copiado · Siguiente' : 'Copiar instrucciones') + '</button>';
    } else if (st === 2) {
      h += '<h1>Abre tu IA</h1><p class="muted" style="margin-top:6px">Usa la que ya tengas. Vale la versión gratuita.</p>' +
        '<div class="btns"><a class="btn" href="https://chatgpt.com" target="_blank" rel="noopener">ChatGPT</a><a class="btn" href="https://claude.ai" target="_blank" rel="noopener">Claude</a><a class="btn" href="https://gemini.google.com" target="_blank" rel="noopener">Gemini</a></div>' +
        '<ol class="how"><li><span>Pega las instrucciones en un chat nuevo.</span></li>' + (imp ? '<li><span>Justo detrás, pega tus faltas: notas del móvil, una tabla, capturas del Moodle, lo que tengas.</span></li>' : upd ? '<li><span>Cuéntale qué ha pasado, por ejemplo "hoy falté a Matemáticas".</span></li>' : '<li><span>Adjunta fotos o capturas de tu horario y de tu calendario.</span></li><li><span>Contesta a sus preguntas (porcentaje de faltas, fechas de los trimestres…).</span></li>') + '<li><span>Cuando termine, pulsa el botón de copiar de su respuesta final.</span></li></ol>';
      cta = '<button class="btn primary" data-act="next">Ya la tengo copiada</button>';
    } else if (st === 3) {
      h += '<h1>Pega aquí su respuesta</h1><div class="field"><textarea id="paste" placeholder="Pega aquí lo que te ha dado tu IA" aria-label="Respuesta de tu IA">' + esc(sx.text) + '</textarea></div><div class="btns"><button class="btn small" data-act="paste">Pegar del portapapeles</button></div>';
      cta = '<button class="btn primary" data-act="review">Revisar</button>';
    } else {
      const r = sx.res;
      if (!r.ok) {
        const fix = 'Tu respuesta tiene estos errores, corrígelos y devuélveme el JSON completo en un solo bloque de código:\n- ' + r.errors.join('\n- ');
        h += '<div class="verdict rojo">' + mascot('rojo') + '<div><b>Hay que corregir algo</b><p>Díselo a tu IA y vuelve a pegar su respuesta.</p></div></div><div class="card err"><ul class="list">' + r.errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' +
          '<details open><summary>Mensaje para tu IA</summary><textarea readonly id="fixmsg" style="min-height:120px">' + esc(fix) + '</textarea></details>';
        cta = '<button class="btn" data-act="copy-fix">Copiar mensaje</button><button class="btn primary" data-act="again">Pegar otra</button>';
      } else {
        const c = r.config, keys = [1, 2, 3, 4, 5, 6, 0].filter((k) => c.schedule[k]);
        h += '<div class="verdict verde">' + mascot('verde') + '<div><b>Todo listo</b><p>Revisa que está bien antes de guardar.</p></div></div>' +
          '<div class="card"><div class="sec">Horario</div>' + keys.map((k) => '<div class="day"><b>' + DAYS[k] + '</b><span class="muted">' + c.schedule[k].map((b) => '<span>' + esc(b.subject) + ' · ' + b.start + '–' + b.end + '</span>').join('') + '</span></div>').join('') + '</div>' +
          '<div class="card"><div class="sec">Trimestres</div><ul class="list">' + c.terms.map((t) => '<li>' + esc(t.label) + ': ' + nice(t.from) + ' → ' + nice(t.to) + '</li>').join('') + '</ul><p class="muted" style="margin-top:8px">' + c.holidays.length + ' festivos/vacaciones · límite ' + fmt(r.limite != null ? r.limite : (user.settings.limite || 25)) + '% · ' + Object.keys(c.alias).length + ' asignaturas unificadas</p></div>';
        if (r.hasFaltas) { const was = user.faltas.length, now = r.faltas.length; h += '<div class="card"><div class="sec">Faltas</div><p class="muted">Ahora: ' + was + ' · Después de guardar: ' + now + (now < was ? ' · se perderían ' + (was - now) : '') + '</p></div>'; }
        if (r.warnings.length) h += '<div class="card warn"><div class="sec">Para revisar</div><ul class="list">' + r.warnings.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul></div>';
        cta = '<button class="btn" data-act="again">Volver</button><button class="btn primary" data-act="save-setup">Guardar</button>';
      }
    }
    return h + '<div class="cta"><div class="in">' + cta + '</div></div>';
  }
  function saveSetup() {
    const r = sx.res, prev = JSON.stringify(user), keepFaltas = sx.mode === 'update' || r.faltas.length ? r.faltas : user.faltas;
    const unificar = Object.keys(r.config.alias).length > 0;
    user = { config: r.config, settings: Object.assign({}, user.settings, { unificar, limite: r.limite != null ? r.limite : (user.settings.limite || 25) }), faltas: keepFaltas , acct: user.acct, skipCfg: user.skipCfg };
    save(); tab = 'hoy'; viewTerm = null; render(); toast('Guardado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
  }

  // ---------- asistente rápido: captura o rejilla de pintar ----------
  const TPL = {
    terms: [{ label: '1r trimestre', from: '2026-09-08', to: '2026-12-22' }, { label: '2n trimestre', from: '2027-01-08', to: '2027-03-19' }, { label: '3r trimestre', from: '2027-03-30', to: '2027-06-21' }],
    holidays: [{ from: '2026-09-11', to: '2026-09-11', label: 'Diada' }, { from: '2026-10-12', to: '2026-10-12', label: 'Fiesta Nacional' }, { from: '2026-12-08', to: '2026-12-08', label: 'Inmaculada' }, { from: '2026-12-22', to: '2027-01-07', label: 'Vacaciones de Navidad' }, { from: '2027-03-20', to: '2027-03-29', label: 'Semana Santa' }, { from: '2027-05-17', to: '2027-05-17', label: 'Segona Pasqua (Barcelona)' }]
  };
  let qk = null, qpaint = null, qdrag = false, qmode = null;
  const QDAYS = [[1, 'L'], [2, 'M'], [3, 'X'], [4, 'J'], [5, 'V']], QN = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };
  const qNew = () => ({ step: 1, start: '08:00', dur: 60, rows: 6, brk: 3, brkMin: 20, limite: 25, unit: 'full', subjects: [], grid: {}, photo: null, custom: null, adding: true, editing: -1, fromShot: false, busy: null, err: '', terms: JSON.parse(JSON.stringify(TPL.terms)), holidays: JSON.parse(JSON.stringify(TPL.holidays)), tmode: 'auto', totals: {} });
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function qRows() {
    if (qk.custom) return qk.custom;
    const out = []; let t = mm(qk.start || '08:00');
    for (let r = 0; r < qk.rows; r++) { out.push({ s: hhmm(t), e: hhmm(t + qk.dur) }); t += qk.dur + (qk.brk === r + 1 ? qk.brkMin : 0); }
    return out;
  }
  const qTxt = (n) => (String(n).length <= 6 ? String(n).toUpperCase() : initials(n));
  const qCol = (name) => AVC[Math.max(0, qk.subjects.indexOf(name)) % AVC.length];
  const qTid = (t, i) => (String(t.label).toLowerCase().replace(/[^a-z0-9]+/g, '') || 't') + i;
  function qCfg() {
    const rows = qRows(), unit = qk.unit === 'full' ? 1 : Math.round(qk.dur / 60 * 100) / 100, schedule = {};
    QDAYS.forEach(([d]) => {
      const g = qk.grid[d] || {}, blocks = []; let cur = null;
      rows.forEach((row, r) => {
        const s = g[r];
        if (s && cur && cur.subject === s) { cur.end = row.e; cur.hours = Math.round((cur.hours + unit) * 100) / 100; }
        else { cur = s ? { start: row.s, end: row.e, subject: s, hours: unit } : null; if (cur) blocks.push(cur); }
      });
      if (blocks.length) schedule[d] = blocks;
    });
    const terms = qk.terms.map((t, i) => ({ id: qTid(t, i), label: t.label, from: t.from, to: t.to })).sort((a, b) => (a.from < b.from ? -1 : 1));
    return { center: '', terms, holidays: qk.holidays.map((h) => ({ from: h.from, to: h.to || h.from, label: h.label || 'Festivo' })), schedule, alias: {}, totals: {}, totalsUnified: {} };
  }
  const qUsed = () => Array.from(new Set(Object.values(qk.grid).flatMap((g) => Object.values(g)))).filter(Boolean);
  function qTotalsFor(cfg, termId) { return C.computeTotals(Object.assign({}, cfg, { settings: Object.assign({}, C.DEF, { unificar: false }), faltas: [] }), termId); }
  async function qStartShot(file) {
    qk = qNew(); qk.step = 0; qk.busy = { p: 0, msg: 'Cargando el lector…' }; tab = 'quick'; render(); scrollTo(0, 0);
    const me = qk;
    try {
      const r = await window.FTShot.read(file, (p, msg) => { me.busy = { p, msg }; const b = $('#qbar'), m = $('#qmsg'); if (b) b.style.width = Math.round(p * 100) + '%'; if (m) m.textContent = msg; });
      if (qk !== me) return;
      if (!r.ok) throw new Error(r.error);
      me.custom = r.rows; me.rows = r.rows.length; me.subjects = r.subjects.slice(); me.photo = r.photo; me.fromShot = true; me.adding = false; me.grid = {};
      Object.keys(r.blocks).forEach((d) => r.blocks[d].forEach((b) => { me.grid[d] = me.grid[d] || {}; for (let i = 0; i < b.n; i++) me.grid[d][b.r0 + i] = b.subject; }));
      qpaint = me.subjects[0] || null; me.step = 1; me.busy = null;
    } catch (e) {
      if (qk !== me) return;
      me.busy = null; me.err = e && e.message === 'net' ? 'No he podido cargar el lector. Comprueba tu conexión e inténtalo otra vez.' : (e && e.message) || 'No he podido leer la imagen.';
    }
    render(); scrollTo(0, 0);
  }
  function viewQuick() {
    const st = qk.step, total = 3;
    let h = '<div class="steps"><button class="back" data-act="q-exit">‹ Atrás</button>' + (st ? '<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + st + '"><i style="width:' + st / total * 100 + '%"></i></div>' : '') + '</div>', ok = true;
    const sel = (key, opts, cur) => '<select data-qf="' + key + '">' + opts.map((o) => '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
    if (st === 0) {
      if (qk.busy) return h + '<h1>Leyendo tu horario…</h1><p class="muted" id="qmsg" style="margin-top:6px">' + esc(qk.busy.msg) + '</p><div class="prog" style="margin-top:18px"><i id="qbar" style="width:' + Math.round(qk.busy.p * 100) + '%"></i></div><p class="muted" style="margin-top:14px">La primera vez descarga el lector (unos 10 MB). Tu foto no sale del móvil.</p>';
      return h + '<h1>No he podido leerlo</h1><div class="card err"><p>' + esc(qk.err) + '</p></div><p class="muted" style="margin-top:12px">Prueba con una captura donde se vea la tabla entera, con los días y las horas. O pinta tu horario a mano, es rápido.</p><div class="btns"><label class="btn" for="qshot">Probar otra captura</label><input id="qshot" type="file" accept="image/*" hidden><button class="btn primary" data-act="q-manual">Pintarlo yo</button></div>';
    }
    if (st === 1) {
      ok = qUsed().length > 0;
      const rows = qRows();
      h += '<h1>' + (qk.fromShot ? 'Revisa tu horario' : 'Tu horario') + '</h1><p class="muted" style="margin-top:6px">' + (qk.fromShot ? 'Esto es lo que he leído. Corrige lo que no esté bien.' : 'Añade tus asignaturas, elige una y pinta sus casillas.') + '</p>' +
        (qk.photo ? '<details class="qph"' + (qk.fromShot ? ' open' : '') + '><summary>Tu captura</summary><img src="' + qk.photo + '" alt="Captura de tu horario"></details>' : '');
      h += '<div class="pals">' + qk.subjects.map((s, i) => '<button class="pal' + (qpaint === s ? ' on' : '') + '" data-pal="' + i + '" style="--c:' + AVC[i % AVC.length] + '">' + esc(s) + '</button>').join('') + '<button class="pal er' + (qpaint === '' ? ' on' : '') + '" data-pal="-1">Borrar</button><button class="pal add" data-act="q-add">+ Asignatura</button></div>';
      if (qk.editing >= 0 && qk.subjects[qk.editing] != null) h += '<form id="q-ren" class="card" style="margin-top:4px"><div class="field" style="margin-top:0"><label>Cambiar nombre</label><input name="n" value="' + esc(qk.subjects[qk.editing]) + '" autocomplete="off" required></div><div class="btns" style="margin-top:10px"><button class="btn small primary">Guardar</button><button type="button" class="btn small danger" data-q-del="' + qk.editing + '">Quitar asignatura</button></div></form>';
      if (qk.adding || !qk.subjects.length) h += '<form id="q-sub" class="card" style="margin-top:4px"><div class="field" style="margin-top:0"><label>' + (qk.subjects.length ? 'Nueva asignatura' : 'Empieza por tus asignaturas') + '</label><input name="s" placeholder="Ej. Programación, Inglés…" autocomplete="off" aria-label="Asignaturas"></div><p class="muted" style="margin-top:6px">Puedes poner varias separadas por comas.</p><button class="btn small primary" style="margin-top:10px">Añadir</button></form>';
      if (qk.subjects.length) {
        h += '<p class="muted" style="margin:6px 2px 0">' + (qpaint === null ? 'Toca una asignatura de arriba.' : 'Toca o desliza para pintar. Si tocas una casilla ya pintada, se borra.') + '</p><div class="qgrid" id="qgrid"><span></span>' + QDAYS.map(([, l]) => '<b class="gh">' + l + '</b>').join('') +
          rows.map((row, r) => '<span class="rl">' + row.s + '<small>' + row.e + '</small></span>' + QDAYS.map(([d]) => { const s = (qk.grid[d] || {})[r]; return '<button class="gc' + (s ? ' on' : '') + '" data-d="' + d + '" data-r="' + r + '" style="--c:' + (s ? qCol(s) : 'transparent') + '" aria-label="' + QN[d] + ', ' + row.s + (s ? ': ' + esc(s) : ': vacía') + '">' + (s ? esc(qTxt(s)) : '') + '</button>'; }).join('')).join('') + '</div>' +
          '<details class="more"><summary>Copiar un día a otro</summary><div class="two"><div class="field"><label>De</label><select id="qcf">' + QDAYS.map(([d]) => '<option value="' + d + '">' + QN[d] + '</option>').join('') + '</select></div><div class="field"><label>A</label><select id="qct">' + QDAYS.map(([d]) => '<option value="' + d + '"' + (d === 3 ? ' selected' : '') + '>' + QN[d] + '</option>').join('') + '</select></div></div><div class="btns"><button class="btn small" data-act="q-copy">Copiar</button><button class="btn small danger" data-act="q-clear">Vaciar todo</button></div></details>';
        if (!qk.custom) h += '<details class="more"><summary>Cambiar las horas</summary><div class="two"><div class="field"><label>1ª clase empieza</label><input type="time" data-qf="start" value="' + qk.start + '"></div><div class="field"><label>Cada hora dura</label>' + sel('dur', [[45, '45 min'], [50, '50 min'], [55, '55 min'], [60, '60 min']], qk.dur) + '</div></div><div class="two"><div class="field"><label>Horas al día</label>' + sel('rows', [4, 5, 6, 7, 8, 9, 10].map((n) => [n, n]), qk.rows) + '</div><div class="field"><label>Recreo tras la hora</label>' + sel('brk', [[0, 'Sin recreo']].concat([1, 2, 3, 4, 5, 6].map((n) => [n, n])), qk.brk) + '</div></div>' + (qk.brk ? '<div class="field"><label>Duración del recreo</label>' + sel('brkMin', [[10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min']], qk.brkMin) + '</div>' : '') + '</details>';
      }
    } else if (st === 2) {
      ok = qk.terms.length > 0 && qk.terms.every((t) => t.from && t.to && t.from <= t.to);
      h += '<h1>Calendario</h1><div class="card warn"><p>Plantilla orientativa de Catalunya 2026-27. <b>Revisa las fechas con tu centro</b>: cada uno puede cambiarlas.</p></div>' +
        '<div class="card"><div class="sec">Trimestres</div>' + qk.terms.map((t, i) => '<div class="qt"><input data-qt="' + i + '|label" value="' + esc(t.label) + '" aria-label="Nombre"><div class="two"><input type="date" data-qt="' + i + '|from" value="' + t.from + '" aria-label="Desde"><input type="date" data-qt="' + i + '|to" value="' + t.to + '" aria-label="Hasta"></div><button class="x" data-q-term="' + i + '" aria-label="Quitar ' + esc(t.label) + '">×</button></div>').join('') + '<button class="btn small" style="margin-top:10px" data-act="q-addterm">Añadir trimestre</button></div>' +
        '<div class="card"><div class="sec">Festivos y vacaciones</div>' + (qk.holidays.length ? qk.holidays.slice().sort((a, b) => (a.from < b.from ? -1 : 1)).map((x) => '<div class="item"><span class="grow">' + esc(x.label) + '<span class="muted"> · ' + nice(x.from) + (x.to && x.to !== x.from ? ' → ' + nice(x.to) : '') + '</span></span><button class="x" data-q-hol="' + qk.holidays.indexOf(x) + '" aria-label="Quitar ' + esc(x.label) + '">×</button></div>').join('') : '<p class="muted">Ninguno.</p>') +
        '<form id="q-hol" style="margin-top:12px;border-top:1px solid var(--line);padding-top:4px"><div class="two"><div class="field"><label>Desde</label><input type="date" name="from" required></div><div class="field"><label>Hasta (opcional)</label><input type="date" name="to"></div></div><div class="field"><label>Nombre (opcional)</label><input name="label" placeholder="Ej. Día de libre disposición"></div><button class="btn small block" style="margin-top:12px">Añadir festivo</button></form></div>';
    } else {
      const cfg = qCfg(), chk = SU.parseImport(SU.toExport(Object.assign({}, cfg, { settings: { limite: qk.limite }, faltas: [] })));
      ok = chk.ok;
      const keys = QDAYS.map(([d]) => d).filter((d) => cfg.schedule[d]);
      h += '<h1>Casi listo</h1><div class="card"><div class="sec">Tu horario</div>' + keys.map((d) => '<div class="day"><b>' + QN[d] + '</b><span class="muted">' + cfg.schedule[d].map((b) => esc(b.subject) + (b.hours > 1 ? ' ×' + fmt(b.hours) : '')).join(' · ') + '</span></div>').join('') + '</div>' +
        '<div class="card"><div class="field" style="margin-top:0"><label>Límite de faltas</label>' + sel('limite', [10, 15, 20, 25, 30].map((n) => [n, n + '%']), qk.limite) + '</div></div>' +
        '<details class="more"><summary>Ajustes avanzados</summary><div class="field"><label>Cada casilla cuenta como</label>' + sel('unit', [['full', '1 hora entera'], ['real', 'lo que dura']], qk.unit) + '</div><div class="field"><label>Horas totales de cada asignatura</label></div><div class="btns" style="margin-top:0"><button class="btn small' + (qk.tmode === 'auto' ? ' primary' : '') + '" data-act="q-tmode" data-m="auto">Calcular con mi horario</button><button class="btn small' + (qk.tmode === 'manual' ? ' primary' : '') + '" data-act="q-tmode" data-m="manual">Las sé yo</button></div>' +
        (qk.tmode === 'manual' ? cfg.terms.map((t) => { const auto = qTotalsFor(cfg, t.id); return '<div class="sec" style="margin-top:14px">' + esc(t.label) + '</div>' + qUsed().map((s) => { const v = (qk.totals[t.id] || {})[s]; return '<div class="item"><span class="grow">' + esc(s) + '</span><input class="num" type="number" min="0" step="any" inputmode="decimal" data-qtot="' + esc(t.id) + '|' + esc(s) + '" value="' + (v != null ? v : (auto[s] || 0)) + '" aria-label="Horas de ' + esc(s) + ' en ' + esc(t.label) + '"></div>'; }).join(''); }).join('') : '<p class="muted" style="margin-top:10px">Se calculan solas contando tus clases y los festivos.</p>') + '</details>';
      if (!chk.ok) h += '<div class="card err"><ul class="list">' + chk.errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>';
    }
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="q-back">' + (st <= 1 ? 'Cancelar' : 'Atrás') + '</button>' + (st === 0 ? '' : '<button class="btn primary"' + (ok ? '' : ' disabled') + ' data-act="q-next">' + (st === 3 ? 'Guardar' : 'Siguiente') + '</button>') + '</div></div>';
  }
  function qSave() {
    const cfg = qCfg(), prev = JSON.stringify(user);
    if (qk.tmode === 'manual') { cfg.terms.forEach((t) => { const auto = qTotalsFor(cfg, t.id), o = {}; qUsed().forEach((s) => { const v = (qk.totals[t.id] || {})[s]; o[s] = v != null && !isNaN(v) ? +v : (auto[s] || 0); }); cfg.totals[t.id] = o; cfg.totalsUnified[t.id] = o; }); }
    user = { config: cfg, settings: Object.assign({ aviso: 2, justificadasCuentan: true }, user.settings, { limite: qk.limite, unificar: false }), faltas: user.faltas || [] , acct: user.acct, skipCfg: user.skipCfg };
    save(); qk = null; tab = 'hoy'; viewTerm = null; render(); scrollTo(0, 0);
    toast('Horario guardado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
  }
  function qPaintCell(cell) {
    if (!cell || !cell.classList.contains('gc') || qmode === null) return;
    const d = +cell.dataset.d, r = +cell.dataset.r; qk.grid[d] = qk.grid[d] || {};
    if (qmode === '') delete qk.grid[d][r]; else qk.grid[d][r] = qmode;
    cell.classList.toggle('on', qmode !== ''); cell.style.setProperty('--c', qmode === '' ? 'transparent' : qCol(qmode)); cell.textContent = qmode === '' ? '' : qTxt(qmode);
  }
  app.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.gc'); if (!c || !qk) return;
    if (qpaint === null) { toast('Elige antes una asignatura'); return; }
    const cur = (qk.grid[+c.dataset.d] || {})[+c.dataset.r]; qmode = qpaint !== '' && cur === qpaint ? '' : qpaint; qdrag = true; qPaintCell(c);
  });
  app.addEventListener('pointermove', (e) => { if (!qdrag) return; qPaintCell(document.elementFromPoint(e.clientX, e.clientY)); });
  const qEnd = () => { if (qdrag) { qdrag = false; qmode = null; if (qk && qk.step === 1) { const y = scrollY; render(); scrollTo(0, y); } } };
  addEventListener('pointerup', qEnd); addEventListener('pointercancel', qEnd);

  // ---------- simulador ----------
  function viewSim() {
    const S = state(), day = simDay || (C.verdict(S, today()).free ? (C.nextClassDay(S, today()) || today()) : today()), v = C.verdict(S, day), lim = S.settings.limite;
    let h = '<div class="steps"><button class="back" data-act="sim-close">‹ Atrás</button><h1>Simulador</h1></div><p class="muted">Marca a qué horas faltarías y mira cómo quedas. No se apunta nada hasta que lo confirmes.</p>' +
      '<div class="card"><div class="field" style="margin-top:0"><label>Día</label><input type="date" id="simday" value="' + day + '"></div></div>';
    if (v.free || !v.term) return h + '<div class="card muted">Ese día no hay clase' + (v.term ? '' : ' (fuera de los trimestres)') + '. Prueba con otra fecha.</div>';
    h += '<div class="btns" style="margin:4px 0 10px"><button class="btn small" data-act="sim-all">Todo el día</button><button class="btn small" data-act="sim-none">Ninguna</button></div>';
    h += v.slots.map((x, i) => '<button class="slot-pick' + (simSel.indexOf(i) >= 0 ? ' on' : '') + '" data-sim="' + i + '">' + avatar(S, x.subject) + '<span class="grow"><b>' + esc(x.subject) + '</b><span class="muted">' + x.start + '–' + x.end + '</span></span><span class="tick">' + (simSel.indexOf(i) >= 0 ? '✓' : '') + '</span></button>').join('');
    const r = C.simulate(S, day, simSel);
    h += '<h2>Resultado</h2>';
    if (!r.rows.length) return h + '<div class="card muted">Marca alguna hora para ver cómo quedarías.</div>';
    const msg = { verde: 'Seguirías en verde', amarillo: 'Quedarías justo: mejor no pasarte', rojo: 'Te pasarías del límite' }[r.status];
    h += '<div class="verdict mini ' + r.status + '"><b>' + msg + '</b></div>';
    h += r.rows.map((x, n) => '<div' + rise(n) + '><div class="card"><div class="row"><div class="grow"><div class="name">' + esc(x.name) + ' <span class="muted">· −' + fmt(x.hours) + ' h</span></div></div><div class="right"><div class="num">' + cnt(x.now) + '% → ' + cnt(x.after) + '%</div><span class="tag ' + x.status + '">' + (x.margin < 0 ? 'te pasas ' + fmt(-x.margin) + ' h' : 'te quedan ' + fmt(x.margin) + ' h') + '</span></div></div>' + meter(x.now, x.after, lim, x.status) + '</div></div>').join('');
    const by = {}; simSel.forEach((i) => { const x = v.slots[i]; if (x && !x.unknown) by[x.subject] = (by[x.subject] || 0) + x.hours; });
    return h + '<button class="btn primary block" style="margin-top:14px" data-miss="' + esc(day) + '|' + esc(Object.keys(by).map((k) => k + ':' + by[k]).join(',')) + '">Anotar estas faltas</button>';
  }
  // ---------- instalar en el móvil ----------
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (tab === 'install') render(); });
  function viewInstall() {
    const st = (n, t, d) => '<div class="istep"><span class="n">' + n + '</span><div><b>' + t + '</b><p class="muted">' + d + '</p></div></div>';
    const ios = st(1, 'Ábrela en Safari', 'Si te llegó por WhatsApp, pulsa los tres puntos del enlace (o la brújula) y elige «Abrir en Safari». Desde otro navegador no deja instalar.') + st(2, 'Pulsa Compartir', 'Es el cuadrado con una flecha hacia arriba, abajo en el centro.') + st(3, 'Añadir a pantalla de inicio', 'Desliza el menú hacia arriba hasta encontrarlo.') + st(4, 'Pulsa Añadir', 'Ya tienes el icono del semáforo como una app más.');
    const and = (deferredInstall ? '<button class="btn primary block" data-act="do-install" style="margin-bottom:14px">Instalar ahora</button>' : '') + st(1, 'Ábrela en Chrome', 'Si te llegó por WhatsApp, pulsa los tres puntos y «Abrir en Chrome».') + st(2, 'Menú ⋮', 'Arriba a la derecha.') + st(3, 'Instalar aplicación', 'A veces pone «Añadir a pantalla de inicio». Confirma y listo.');
    return '<div class="steps"><button class="back" data-act="inst-close">‹ Atrás</button><h1>Instalar en tu móvil</h1></div><p class="muted">Se instala sin tienda de apps, en 20 segundos. Abre más rápido y sin barra del navegador.</p>' +
      '<div class="btns" style="margin:4px 0 14px"><button class="btn small' + (instTab === 'ios' ? ' primary' : '') + '" data-inst="ios">iPhone</button><button class="btn small' + (instTab === 'android' ? ' primary' : '') + '" data-inst="android">Android</button></div><div class="card">' + (instTab === 'ios' ? ios : and) + '</div>';
  }
  const hintOff = () => { try { return localStorage.getItem('ft.hint') === '1'; } catch (e) { return false; } };
  const flagOff = (k) => { try { return localStorage.getItem('ft.' + k) === '1'; } catch (e) { return false; } };
  const flagSet = (k) => { try { localStorage.setItem('ft.' + k, '1'); } catch (e) {} };
  // ---------- compartir con la clase: el horario viaja dentro del enlace ----------
  const b64 = (u) => { let t = ''; u.forEach((c) => { t += String.fromCharCode(c); }); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = (x) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  async function pack(str) {
    const u = new TextEncoder().encode(str);
    try { if (window.CompressionStream) return 'z' + b64(new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); } catch (e) {}
    return 'p' + b64(u);
  }
  async function unpack(x) {
    const u = unb64(x.slice(1));
    if (x[0] === 'z') return new TextDecoder().decode(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then((b) => new Uint8Array(b)));
    return new TextDecoder().decode(u);
  }
  let shareMsg = '';
  async function fillShare() {
    const a = $('#sh-wa'); if (!a || !user.config) return;
    const exp = JSON.parse(SU.toExport(Object.assign({}, state(), { faltas: [] }))); delete exp.dudas;
    const url = location.href.split('#')[0].split('?')[0] + '#c=' + await pack(JSON.stringify(exp));
    shareMsg = '¿Cuántas clases puedes saltarte sin pasarte del límite? Ya he cargado nuestro horario en NoVoy, el semáforo de faltas. Ábrelo y listo, sin configurar nada:\n' + url;
    a.href = 'https://wa.me/?text=' + encodeURIComponent(shareMsg);
    const full = JSON.parse(SU.toExport(state())); delete full.dudas;
    backupUrl = location.href.split('#')[0].split('?')[0] + '#c=' + await pack(JSON.stringify(full));
  }
  let backupUrl = '';
  const bkGet = () => { try { return +localStorage.getItem('ft.bk') || 0; } catch (e) { return 0; } };
  const bkSet = () => { try { localStorage.setItem('ft.bk', String(Date.now())); } catch (e) {} };
  const bkDue = () => user.faltas.length >= 3 && Date.now() - bkGet() > 30 * 864e5;
  let jn = null, acPend = null;
  async function readLink() {
    const m = /^#c=([zp][A-Za-z0-9_-]+)$/.exec(location.hash); if (!m) return;
    try { jn = SU.parseImport(await unpack(m[1])); } catch (e) { jn = { ok: false, errors: ['El enlace está cortado o no es válido. Pide que te lo vuelvan a mandar.'], warnings: [] }; }
    history.replaceState(null, '', location.href.split('#')[0]); tab = 'join'; render(); scrollTo(0, 0);
  }
  function viewJoin() {
    const r = jn, DN = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };
    let h = '<div class="steps"><h1>' + (r.ok && r.hasFaltas ? 'Copia de tus datos' : 'Te han pasado un horario de NoVoy') + '</h1></div>';
    if (!r.ok) return h + '<div class="card warn"><ul class="list">' + r.errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div><div class="cta"><div class="in"><button class="btn" data-act="join-no">Cerrar</button></div></div>';
    const c = r.config;
    h += '<div class="card"><div class="sec">' + esc(c.center || 'Tu clase') + '</div><p class="muted">Límite de faltas: ' + r.limite + '%</p>' +
      Object.keys(DN).filter((d) => c.schedule[d] && c.schedule[d].length).map((d) => '<div class="day"><b>' + DN[d] + '</b><span style="flex:1">' + Array.from(new Set(c.schedule[d].map((b) => b.subject))).map(esc).join(', ') + '</span></div>').join('') + '</div>' +
      '<div class="card"><div class="sec">Trimestres</div>' + c.terms.map((t) => '<div class="item"><span class="grow">' + esc(t.label) + '<span class="muted"> · ' + nice(t.from) + ' → ' + nice(t.to) + '</span></span></div>').join('') + '</div>' +
      (r.hasFaltas ? '<div class="card"><div class="sec">Faltas</div><p class="muted">Incluye ' + r.faltas.length + ' falta(s) apuntadas.</p></div>' : '') +
      (user.config ? '<div class="card warn"><p>' + (r.hasFaltas ? 'Ya tienes datos guardados. Si restauras, se sustituyen tu horario y tus faltas.' : 'Ya tienes un horario guardado. Si lo usas, se sustituye (tus faltas se mantienen).') + '</p></div>' : (r.hasFaltas ? '' : '<p class="muted">Empiezas con 0 faltas. Luego puedes añadir las que ya llevas.</p>'));
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="join-no">Ahora no</button><button class="btn primary" data-act="join-yes">' + (r.hasFaltas ? 'Restaurar mis datos' : 'Usar este horario') + '</button></div></div>';
  }

  // ---------- render + animaciones ----------
  const VIEWS = { hoy: viewHoy, resumen: viewResumen, faltas: viewFaltas, ajustes: viewAjustes, join: viewJoin, sim: viewSim, install: viewInstall, setup: viewSetup, editor: viewEditor, quick: viewQuick };
  function warnBar() {
    const el = document.getElementById('warnbar'); if (!el) return;
    const show = !user.config && tab !== 'setup' && tab !== 'quick' && tab !== 'editor' && tab !== 'join';
    el.hidden = !show; document.body.classList.toggle('warn', show);
    if (show) el.innerHTML = '<div class="in"><span><b>Falta tu horario</b><span class="muted"> · sin él la app no calcula nada</span></span><button class="btn small primary" data-act="go-setup">Configurar</button></div>';
  }
  function render() {
    document.body.classList.toggle('setup', tab === 'setup' || tab === 'editor' || tab === 'join' || tab === 'sim' || tab === 'install' || tab === 'quick');
    app.innerHTML = VIEWS[tab]();
    document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    requestAnimationFrame(() => requestAnimationFrame(animate));
    warnBar();
    if (tab === 'ajustes') fillShare().catch(() => {});
  }
  function animate() {
    app.querySelectorAll('.bar i[data-w]').forEach((e) => { e.style.width = e.dataset.w + '%'; });
    app.querySelectorAll('.bar u[data-w]').forEach((e) => { e.style.left = e.dataset.l + '%'; e.style.width = e.dataset.w + '%'; });
    if (REDUCED) return;
    app.querySelectorAll('.cnt').forEach((e) => {
      const to = parseFloat(e.dataset.v), t0 = performance.now(), dur = 700, dec = String(to).includes('.') ? 1 : 0;
      (function step(t) { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3)); e.textContent = fmt(dec ? v.toFixed(1) : Math.round(v)); if (k < 1) requestAnimationFrame(step); else e.textContent = fmt(to); })(t0);
    });
  }

  // ---------- eventos ----------
  const wb = document.getElementById('warnbar');
  if (wb) wb.addEventListener('click', (e) => { if (e.target.closest('[data-act="go-setup"]')) { sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); scrollTo(0, 0); } });
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); scrollTo(0, 0); } });
  const nid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  app.addEventListener('click', async (e) => {
    const b = e.target.closest('button,label'); if (!b) return; const d = b.dataset;
    if (d.miss) {
      const [date, parts] = d.miss.split('|'), added = [];
      parts.split(',').forEach((p) => { const k = p.lastIndexOf(':'); added.push({ id: nid(), date, term: C.termOf(state(), date), subject: p.slice(0, k), hours: +p.slice(k + 1), type: 'falta', justified: false, note: '' }); });
      user.faltas.push.apply(user.faltas, added); save(); if (tab === 'sim') simSel = []; render();
      toast('Falta anotada', () => { user.faltas = user.faltas.filter((f) => !added.includes(f)); save(); render(); });
    } else if (d.sim !== undefined) { const i = +d.sim, k = simSel.indexOf(i); if (k >= 0) simSel.splice(k, 1); else simSel.push(i); render();
    } else if (d.act === 'open-sim') { simDay = null; simSel = []; tab = 'sim'; render(); scrollTo(0, 0);
    } else if (d.act === 'sim-close') { tab = 'resumen'; render();
    } else if (d.act === 'sim-all') { const v = C.verdict(state(), simDay || (C.verdict(state(), today()).free ? C.nextClassDay(state(), today()) : today())); simSel = v.slots.map((x, i) => i); render();
    } else if (d.act === 'sim-none') { simSel = []; render();
    } else if (d.act === 'open-install') { tab = 'install'; render(); scrollTo(0, 0);
    } else if (d.act === 'inst-close') { tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.inst) { instTab = d.inst; render();
    } else if (d.act === 'do-install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
    } else if (d.act === 'imp-x') { flagSet('imphint'); render();
    } else if (d.act === 'lnk-x') { flagSet('lnkhint'); render();
    } else if (d.act === 'start-import') { sx = { mode: 'import', step: 1, text: '', res: null, copied: false, ai: true, scr: 'method' }; tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'hint-x') { try { localStorage.setItem('ft.hint', '1'); } catch (er) {} render();
    } else if (d.edit) { efId = d.edit; render();
    } else if (d.act === 'ecancel') { efId = null; render();
    } else if (d.act === 'fclear') { fday = ''; render();
    } else if (d.del) {
      const f = user.faltas.find((x) => x.id === d.del); user.faltas = user.faltas.filter((x) => x !== f); save(); render();
      toast('Falta borrada', () => { user.faltas.push(f); save(); render(); });
    } else if (d.term) { viewTerm = d.term; render();
    } else if (d.ed) {
      const p = d.ed.split('|'), c = ed.cfg;
      if (p[0] === 'blk') { c.schedule[p[1]].splice(+p[2], 1); if (!c.schedule[p[1]].length) delete c.schedule[p[1]]; const live = new Set(edSubjects()); Object.keys(c.alias).forEach((k) => { if (!live.has(k) || !live.has(c.alias[k])) delete c.alias[k]; }); }
      else if (p[0] === 'term') c.terms.splice(+p[1], 1); else if (p[0] === 'hol') c.holidays.splice(+p[1], 1); else if (p[0] === 'ali') delete c.alias[p[1]];
      render();
    } else if (d.act === 'join-yes') {
      const prev = JSON.stringify(user); user = { config: jn.config, settings: Object.assign({}, user.settings, { unificar: Object.keys(jn.config.alias).length > 0, limite: jn.limite || 25 }), faltas: jn.hasFaltas ? jn.faltas : (user.faltas || []) , acct: user.acct, skipCfg: user.skipCfg };
      if (acPend) { user.acct = acPend; acPend = null; }
      save(); jn = null; tab = 'hoy'; render(); toast('Horario cargado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
    } else if (d.act === 'share-app') {
      const url = location.href.split('#')[0].split('?')[0];
      const msg = '¿Cuántas clases puedes saltarte sin pasarte del límite? NoVoy te lo dice de un vistazo. Sin correo y sin tienda de apps:\n' + url;
      if (navigator.share) { try { await navigator.share({ text: msg }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
      toast((await copy(msg)) ? 'Enlace copiado. Pégalo en el grupo' : 'No se pudo copiar');
    } else if (d.act === 'go-reg') { acg.p = ''; sx.scr = 'reg'; render(); scrollTo(0, 0);
    } else if (d.act === 'go-login') { acg.p = ''; sx.scr = 'login'; render(); scrollTo(0, 0);
    } else if (d.act === 'skip-reg') { sx.scr = 'method'; render(); scrollTo(0, 0);
    } else if (d.act === 'skip-cfg') { user.skipCfg = true; save(); tab = 'hoy'; render(); scrollTo(0, 0);
    } else if (d.act === 'go-setup') { sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'acct-dice') { acg.u = window.FTAcct.genUser(); acg.p = ($('#ac-p') || {}).value || ''; render();
    } else if (d.act === 'acct-new' || d.act === 'acct-login') {
      const A = window.FTAcct, uI = ($('#ac-u') || {}).value || '', pI = ($('#ac-p') || {}).value || '';
      acg.u = uI; acg.p = pI;
      if (d.act === 'acct-new') {
        if (!A.userOk(uI.trim())) return toast('El usuario: solo letras y números, de 3 a 24');
        if (A.passChecks(pI).some((c) => !c[1])) return toast('La contraseña no cumple los 3 requisitos');
      } else if (!uI.trim() || !pI) return toast('Escribe tu usuario y tu contraseña');
      b.disabled = true; const prevTxt = b.textContent; b.textContent = 'Un momento…';
      try {
        const k = await A.derive(uI, pI), kb = await A.expKey(k.key);
        if (d.act === 'acct-new') {
          const r = await A.api({ op: 'new', id: k.id, auth: k.auth, data: await A.seal(k.key, SU.toExport(snapState())) });
          if (r.ok) { user.acct = { u: uI.trim(), id: k.id, auth: k.auth, k: kb, t: Date.now() }; acg.p = ''; save(); if (sx.scr === 'reg') { sx.scr = 'method'; scrollTo(0, 0); } toast('Cuenta creada. Apunta la contraseña'); render(); }
          else toast(r.error === 'existe' ? 'Ese usuario ya está cogido. Prueba el dado 🎲' : /^(sin-blobs|blobs-caido|sin-kv|almacen-caido)$/.test(r.error) ? 'El servidor de cuentas no está listo todavía' : 'No se pudo crear. Prueba otra vez');
        } else {
          const r = await A.api({ op: 'get', id: k.id, auth: k.auth });
          if (r.ok) {
            const txt = await A.open(k.key, r.data); jn = SU.parseImport(txt);
            const sess = { u: uI.trim(), id: k.id, auth: k.auth, k: kb, t: r.t || Date.now() };
            let vacia = false;
            try { const o = JSON.parse(txt); vacia = !!o && o.formato === 'puedo-faltar/1' && !Object.keys(o.horario || {}).some((dd) => (o.horario[dd] || []).length); } catch (er) {}
            if (jn.ok) { acPend = sess; acg.p = ''; jn.acct = sess.u; tab = 'join'; render(); scrollTo(0, 0); }
            else if (vacia) { user.acct = sess; acg.p = ''; jn = null; save(); sx.scr = 'method'; tab = 'setup'; toast('Hola de nuevo. Aún no tenías horario guardado'); render(); scrollTo(0, 0); }
            else toast('La copia guardada no se pudo leer');
          } else toast(r.error === 'no-existe' ? 'Ese usuario no existe' : r.error === 'clave' ? 'Contraseña incorrecta' : 'No se pudo entrar. Prueba otra vez');
        }
      } catch (e) { toast(e.message === 'red' ? 'Sin conexión. Inténtalo con internet' : e.message === 'sin-servidor' ? 'Este despliegue no tiene el servidor de cuentas' : 'Algo ha fallado. Prueba otra vez'); }
      b.disabled = false; b.textContent = prevTxt; render();
    } else if (d.act === 'acct-push') { toast((await acPush()) ? 'Guardado' : 'No se pudo guardar'); render();
    } else if (d.act === 'acct-out') { delete user.acct; acState = ''; save(); toast('Sesión cerrada. Tus datos siguen en este móvil'); render();
    } else if (d.act === 'join-no') { acPend = null; jn = null; tab = user.config ? 'hoy' : 'setup'; render();
    } else if (d.act === 'backup-link') {
      if (!backupUrl) return toast('Un segundo y vuelve a pulsar');
      toast((await copy(backupUrl)) ? 'Enlace copiado. Guárdalo en tus mensajes' : 'No se pudo copiar'); bkSet();
    } else if (d.act === 'goto-backup') { tab = 'ajustes'; render(); scrollTo(0, 99999);
    } else if (d.act === 'bk-x') { bkSet(); render();
    } else if (d.act === 'wipe-faltas' || d.act === 'wipe-todo') { wipe = d.act === 'wipe-todo' ? 'todo' : 'faltas'; render();
    } else if (d.act === 'wipe-no') { wipe = null; render();
    } else if (d.act === 'wipe-yes') {
      const prev = JSON.stringify(user), all = wipe === 'todo'; wipe = null;
      user = all ? { config: null, settings: {}, faltas: [] } : Object.assign({}, user, { faltas: [] });
      save(); try { if (all) localStorage.removeItem('ft.bk'); } catch (er) {}
      sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: '' }; tab = all ? 'setup' : 'ajustes'; render(); scrollTo(0, 0);
      toast(all ? 'Todo borrado' : 'Faltas borradas', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
    } else if (d.act === 'refresh') {
      toast('Actualizando…');
      try { if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k))); } catch (er) {}
      try { if (navigator.serviceWorker) await Promise.all((await navigator.serviceWorker.getRegistrations()).map((r) => r.unregister())); } catch (er) {}
      location.href = location.href.split('#')[0].split('?')[0] + '?v=' + Date.now();
    } else if (d.act === 'share') {
      if (!shareMsg) return toast('Un segundo y vuelve a pulsar');
      if (navigator.share) { try { await navigator.share({ text: shareMsg }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
      toast((await copy(shareMsg)) ? 'Mensaje copiado. Pégalo en el grupo' : 'No se pudo copiar');
    } else if (d.act === 'edit') { openEditor();
    } else if (d.act === 'ed-close') { ed = null; tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.act === 'ed-save') { edSave();
    } else if (d.act === 'start-setup' || d.act === 'start-update') { sx = { mode: d.act === 'start-update' ? 'update' : 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'close') { tab = user.config ? 'ajustes' : 'hoy'; render();
    } else if (d.act === 'copy-prompt') {
      if (sx.copied) { sx.step = 2; render(); return; }
      const ok = await copy(promptText()); sx.copied = ok; if (ok) toast('Instrucciones copiadas'); else { toast('Mantén pulsado el texto para copiarlo'); const dt = document.querySelector('details'); if (dt) dt.open = true; } render();
    } else if (d.act === 'restore-link') {
      let t = ($('#rl') || {}).value || ''; if (!t.trim()) { try { t = await navigator.clipboard.readText(); } catch (err) {} }
      const m = /#c=([zp][A-Za-z0-9_-]+)/.exec(t); if (!m) return toast('Pega el enlace de copia completo');
      try { jn = SU.parseImport(await unpack(m[1])); } catch (err) { jn = { ok: false, errors: ['El enlace está cortado o no es válido.'], warnings: [] }; }
      tab = 'join'; render(); scrollTo(0, 0);
    } else if (d.act === 'q-start' || d.act === 'q-manual') { qk = qNew(); qpaint = null; tab = 'quick'; render(); scrollTo(0, 0);
    } else if (d.act === 'q-add') { qk.adding = !qk.adding; qk.editing = -1; render();
    } else if (d.act === 'ai-go') { sx.ai = true; render(); scrollTo(0, 0);
    } else if (d.act === 'ai-back') { sx.ai = false; sx.copied = false; render();
    } else if (d.act === 'q-exit') { qk = null; tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.act === 'q-back') { if (qk.step <= 1) { qk = null; tab = user.config ? 'ajustes' : 'setup'; } else qk.step--; render(); scrollTo(0, 0);
    } else if (d.act === 'q-next') { if (qk.step === 3) qSave(); else { qk.step++; render(); scrollTo(0, 0); }
    } else if (d.pal !== undefined) { const nv = +d.pal < 0 ? '' : qk.subjects[+d.pal]; if (nv !== '' && qpaint === nv) qk.editing = qk.editing === +d.pal ? -1 : +d.pal; else { qpaint = nv; qk.editing = -1; } render();
    } else if (d.qDel !== undefined) { const n = qk.subjects.splice(+d.qDel, 1)[0]; Object.values(qk.grid).forEach((g) => Object.keys(g).forEach((r) => { if (g[r] === n) delete g[r]; })); qk.editing = -1; if (qpaint === n) qpaint = qk.subjects[0] || null; render();
    } else if (d.qTerm !== undefined) { qk.terms.splice(+d.qTerm, 1); render();
    } else if (d.qHol !== undefined) { qk.holidays.splice(+d.qHol, 1); render();
    } else if (d.act === 'q-addterm') { qk.terms.push({ label: (qk.terms.length + 1) + 'r trimestre', from: '', to: '' }); render();
    } else if (d.act === 'q-tmode') { qk.tmode = d.m; render();
    } else if (d.act === 'q-copy') { const a = +$('#qcf').value, z = +$('#qct').value; if (a !== z) { qk.grid[z] = Object.assign({}, qk.grid[a] || {}); } render();
    } else if (d.act === 'q-clear') { qk.grid = {}; render();
    } else if (d.act === 'next') { sx.step = 3; render(); scrollTo(0, 0);
    } else if (d.act === 'paste') { try { const t = await navigator.clipboard.readText(); sx.text = t; render(); } catch (err) { toast('Mantén pulsado el cuadro y elige Pegar'); }
    } else if (d.act === 'review') { const ta = $('#paste'); sx.text = ta ? ta.value : sx.text; if (!sx.text.trim()) return toast('Pega primero la respuesta de tu IA'); sx.res = SU.parseImport(sx.text); sx.step = 4; render(); scrollTo(0, 0);
    } else if (d.act === 'again') { sx.step = 3; render();
    } else if (d.act === 'copy-fix') { toast((await copy($('#fixmsg').value)) ? 'Mensaje copiado' : 'Mantén pulsado el texto para copiarlo');
    } else if (d.act === 'save-setup') { saveSetup();
    } else if (b.id === 'exp') {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([SU.toExport(state())], { type: 'application/json' })); a.download = 'novoy.json'; a.click(); bkSet();
    } else if (b.id === 'theme') {
      const r = document.documentElement, dark = getComputedStyle(r).getPropertyValue('--bg').trim().toLowerCase() === '#121212'; r.dataset.theme = dark ? 'light' : 'dark';
    }
  });
  app.addEventListener('submit', (e) => {
    e.preventDefault(); const f = new FormData(e.target), id = e.target.id;
    if (id === 'add') {
      const date = f.get('date');
      user.faltas.push({ id: nid(), date, term: C.termOf(state(), date), subject: f.get('subject'), hours: +f.get('hours') || 0, type: f.get('retraso') ? 'retraso' : 'falta', justified: !!f.get('justified'), note: '' });
      save(); tab = 'resumen'; render(); toast('Falta añadida');
    } else if (id === 'edf') {
      const fl = user.faltas.find((x) => x.id === e.target.dataset.id); if (!fl) return;
      const prev = Object.assign({}, fl), date = f.get('date') || '';
      Object.assign(fl, { date, term: date ? C.termOf(state(), date) : fl.term, subject: f.get('subject'), hours: +f.get('hours') || 0, type: f.get('retraso') ? 'retraso' : 'falta', justified: !!f.get('justified') });
      efId = null; save(); render(); toast('Falta actualizada', () => { Object.assign(fl, prev); save(); render(); });
    } else if (id === 'f-blk') {
      const day = +f.get('day'); (ed.cfg.schedule[day] = ed.cfg.schedule[day] || []).push({ start: f.get('start'), end: f.get('end'), subject: String(f.get('subject')).trim(), hours: +f.get('hours') });
      ed.cfg.schedule[day].sort((a, b) => mm(a.start) - mm(b.start)); render();
    } else if (id === 'f-term') {
      const label = String(f.get('label')).trim(); ed.cfg.terms.push({ id: (label.toLowerCase().replace(/[^a-z0-9]+/g, '') || 't') + ed.cfg.terms.length, label, from: f.get('from'), to: f.get('to') }); ed.cfg.terms.sort((a, b) => (a.from < b.from ? -1 : 1)); render();
    } else if (id === 'f-hol') {
      ed.cfg.holidays.push({ from: f.get('from'), to: f.get('to') || f.get('from'), label: String(f.get('label')).trim() }); render();
    } else if (id === 'q-sub') {
      let last = null; String(f.get('s') || '').split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!qk.subjects.some((y) => y.toLowerCase() === x.toLowerCase())) qk.subjects.push(x); last = qk.subjects.find((y) => y.toLowerCase() === x.toLowerCase()); }); if (last) qpaint = last; qk.adding = false; render();
    } else if (id === 'q-ren') {
      const nn = String(f.get('n') || '').trim(), old = qk.subjects[qk.editing]; if (nn && old != null) { qk.subjects[qk.editing] = nn; Object.values(qk.grid).forEach((g) => Object.keys(g).forEach((r) => { if (g[r] === old) g[r] = nn; })); if (qpaint === old) qpaint = nn; } qk.editing = -1; render();
    } else if (id === 'q-hol') {
      qk.holidays.push({ from: f.get('from'), to: f.get('to') || f.get('from'), label: String(f.get('label') || '').trim() || 'Festivo' }); render();
    } else if (id === 'f-ali') {
      if (f.get('a') && f.get('a') !== f.get('b')) { ed.cfg.alias[f.get('a')] = f.get('b'); render(); } else toast('Elige dos asignaturas distintas');
    }
  });
  app.addEventListener('input', (e) => { // horas sugeridas al cambiar la hora de inicio/fin
    const t = e.target, form = t.form; if (!form || form.id !== 'f-blk') return;
    if (t.name === 'hours') t.dataset.touched = '1';
    else if ((t.name === 'start' || t.name === 'end') && form.elements.start.value && form.elements.end.value && !form.elements.hours.dataset.touched) {
      const m = mm(form.elements.end.value) - mm(form.elements.start.value); if (m > 0) form.elements.hours.value = Math.max(1, Math.round(m / 60));
    }
  });
  app.addEventListener('input', (e) => {
    if (e.target.id === 'ac-p') {
      acg.p = e.target.value;
      const ul = document.querySelector('.acc-chk'); if (!ul || !window.FTAcct) return;
      window.FTAcct.passChecks(acg.p).forEach((c, i) => { const li = ul.children[i]; if (li) li.innerHTML = (c[1] ? '✅' : '◻️') + ' ' + c[0]; });
    } else if (e.target.id === 'ac-u') acg.u = e.target.value;
  });
  app.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'date' && t.form && t.form.id === 'add') {
      const sel = t.form.elements.subject, r = subjectsOn(state(), t.value), prev = sel.value;
      sel.innerHTML = subjectOpts(state(), t.value, prev); const h = $('#subhint'); if (h) h.textContent = r.all ? 'Ese día no hay clase: salen todas.' : 'Solo las de ese día.'; return;
    }
    if (t.id === 'qshot' && t.files[0]) { qStartShot(t.files[0]); t.value = ''; return; }
    if (qk && t.dataset.qf) { const k = t.dataset.qf; qk[k] = ['dur', 'rows', 'brk', 'brkMin', 'limite'].includes(k) ? +t.value : t.value; if (k === 'rows' || k === 'brk') render(); else if (k === 'dur' || k === 'brkMin') render(); return; }
    if (qk && t.dataset.qt) { const [i, k] = t.dataset.qt.split('|'); qk.terms[+i][k] = t.value; if (k !== 'label') render(); return; }
    if (qk && t.dataset.qtot) { const j = t.dataset.qtot.indexOf('|'), id = t.dataset.qtot.slice(0, j), s = t.dataset.qtot.slice(j + 1); (qk.totals[id] = qk.totals[id] || {})[s] = parseFloat(t.value); return; }
    if (t.id === 'simday') { simDay = t.value || null; simSel = []; render(); return; }
    if (t.id === 'fday') { fday = t.value; render(); return; }
    if (t.dataset.set) { user.settings = Object.assign({}, user.settings, { [t.dataset.set]: t.checked }); save(); }
    else if (t.dataset.num) { const v = parseFloat(t.value); if (v >= 0) { user.settings = Object.assign({}, user.settings, { [t.dataset.num]: v }); save(); } }
    else if (t.id === 'imp' && t.files[0]) {
      t.files[0].text().then((x) => { const r = SU.parseImport(x); if (r.ok && r.hasFaltas) { jn = r; tab = 'join'; render(); return; } sx = { mode: 'update', step: 4, text: x, res: r, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); }).catch(() => toast('Archivo no válido'));
    } else if (t.id === 'paste') { sx.text = t.value; }
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  render();
  readLink();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
