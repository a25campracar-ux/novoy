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
  let user = tidy(load());
  try { if (user.config) localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} // guarda ya la versión con ids y unidades
  /** Ids fijos de asignaturas y faltas, y cada falta partida en unidades de una clase. */
  function tidy(u) { if (u && u.config) { const n = C.normalize(u.config, u.faltas || []); u.config = n.cfg; u.faltas = n.faltas; tutAuto(u.config); if (!u.since) u.since = C.ymd(new Date()); } return u; }
  /** La tutoría no forma parte del currículum: no cuenta faltas. Se marca sola una vez; luego manda lo que elija el alumno. */
  function tutAuto(cfg) {
    if (!cfg || cfg.tutChecked) return;
    cfg.tutChecked = true;
    const tut = C.allSubjects(cfg).filter((s) => /^(tut|tutor|tutoria|tutoría)(\b|$)/i.test(String(s).trim()));
    if (!tut.length) return;
    cfg.nocount = Array.from(new Set((cfg.nocount || []).concat(tut)));
    cfg.ask = Object.assign({}, cfg.ask, { nocount: true });
  }
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
    const seed = window.FT_SEED; return seed ? JSON.parse(JSON.stringify(seed)) : { config: null, settings: {}, faltas: [] };
  }
  function save() { tidy(user); try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} acSched(); }
  // --- cuenta (usuario+contraseña): envío cifrado con retardo tras cada cambio
  let acT = null, acBusy = false, acState = '';
  let acDirty = false;
  function acSched() { if (!user.acct) return; if (acBusy) { acDirty = true; return; } clearTimeout(acT); acT = setTimeout(() => { acPush().catch(() => {}); }, 1500); }
  async function acPush() {
    const A = window.FTAcct; if (!user.acct || !A) return false;
    acBusy = true;
    try {
      const key = await A.impKey(user.acct.k);
      const data = await A.seal(key, SU.toExport(snapState()));
      const r = await A.api({ op: 'put', id: user.acct.id, auth: user.acct.auth, u: user.acct.u, data });
      if (r.ok) { acState = 'ok'; user.acct.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} return true; }
      acState = r.error === 'bloqueada' ? 'bloqueada' : r.error === 'clave' || r.error === 'no-existe' ? 'sesion' : 'err';
      return false;
    } catch (e) { acState = 'err'; return false; } finally { acBusy = false; if (acDirty) { acDirty = false; acSched(); } }
  }
  const snapState = () => state() || Object.assign({}, blank(), { settings: Object.assign({}, C.DEF, user.settings), faltas: user.faltas || [] });
  /** Si se renombró una asignatura fuera de la rejilla, su unión puede apuntar a un nombre que ya no existe. */
  function fixAlias() {
    if (!user.config || !user.config.alias) return;
    const subs = C.allSubjects(user.config), bad = Object.keys(user.config.alias).filter((k) => subs.indexOf(user.config.alias[k]) < 0);
    if (!bad.length) return;
    bad.forEach((k) => { delete user.config.alias[k]; });
    save();
  }
  const state = () => user.config && Object.assign({}, user.config, { settings: Object.assign({}, C.DEF, user.settings), faltas: user.faltas });
  /** Lo que se usa para calcular: igual que state(), pero con los trimestres juntos si el límite va sobre el curso entero. */
  const calc = () => user.config && C.scope(state());
  const qd = new URLSearchParams(location.search).get('d');
  const today = () => (qd && /^\d{4}-\d\d-\d\d$/.test(qd) ? qd : C.ymd(new Date()));
  let tab = user.config ? 'hoy' : (!user.acct && !location.hash && (() => { try { return localStorage.getItem('ft.intro') !== '1'; } catch (e) { return false; } })() ? 'intro' : 'setup'), viewTerm = null, undo = null, ed = null, efId = null, fday = '', simDay = null, simSel = [], wipe = null, instTab = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android';
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
  /** Aviso que publica el admin para toda la clase. */
  function noticeCard() {
    if (!gNotice || !gNotice.text || flagOff('nt' + gNotice.ts)) return '';
    return '<div class="card notice"><div class="sec">Aviso</div><p>' + esc(gNotice.text) + '</p><div class="btns"><button class="btn small" data-act="nt-x">Entendido</button></div></div>';
  }
  function emptyView(title, txt) {
    return '<div class="top"><h1>' + title + '</h1></div>' +
      '<div class="verdict verde">' + mascot('verde') + '<div><span class="who">NoVoy dice</span><b>Aún no sé tu horario</b><p>' + txt + '</p></div></div>' + noticeCard() +
      '<div class="card"><div class="sec">Pon tu horario</div><p class="muted">Con una foto o pintándolo. Tarda un par de minutos.</p><div class="btns"><button class="btn small primary" data-act="go-setup">Poner mi horario</button></div></div>';
  }
  function viewHoy() {
    if (!user.config) return emptyView('Hoy', 'Sin tu horario no puedo decirte si puedes faltar.');
    const S = calc(), day = today(), v = C.verdict(S, day);
    const hol = (S.holidays || []).find((h) => day >= h.from && day <= (h.to || h.from));
    let h = '<div class="top"><span class="date">' + cap(nice(day)) + '</span><span class="chip">' + esc((S.terms.find((t) => t.id === v.term) || {}).label || 'Fuera de curso') + '</span></div>';
    h += askYesterday(S, day) + offBubble(S, day);
    if (v.free || !v.term) {
      const why = hol ? hol.label : (!v.term ? 'Hoy no es día de curso' : 'Hoy no tienes clase');
      h += '<div class="verdict verde">' + mascot('verde') + '<div><span class="who">NoVoy dice</span><b>Día libre</b><p>' + esc(why) + '.</p></div></div>';
      const nx = C.nextClassDay(S, day), nv = nx && C.verdict(S, nx);
      if (nv && nv.term) h += '<h2>Si faltas el ' + nice(nx) + '</h2>' + subjectCards(S, nv, nx, false);
    } else {
      const worst = v.items.filter((i) => i.status === v.status && !i.unknown)[0];
      const T = { verde: 'Puedes faltar', amarillo: 'Mejor no', rojo: 'Hoy no' }[v.status];
      const q = v.status === 'verde' ? quip('verde', day) : (worst ? worst.name + ': ' : '') + quip(v.status, day);
      h += '<div class="verdict ' + v.status + '">' + mascot(v.status) + '<div><span class="who">NoVoy dice</span><b>' + T + '</b><p>' + esc(q) + '</p></div></div>' + allDay(v, day) + '<h2>Si faltas hoy</h2>' + subjectCards(S, v, day, true);
    }
    return h + noticeCard() + oneHint();
  }
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  /** Un solo aviso a la vez, el más importante. Si hay cinco, nadie lee ninguno. */
  function oneHint() {
    const accSnooze = Date.now() - (+lsGet('ft.accx') || 0) < 7 * 864e5;
    if (iosRisk()) return '<div class="card warn hint1"><div class="sec">Tus faltas pueden borrarse</div><p>En iPhone, si no la instalas, Safari borra sus datos si pasas días sin abrirla.</p><div class="btns"><button class="btn small primary" data-act="open-install">Instalarla</button><button class="btn small" data-act="ios-x">Más tarde</button></div></div>';
    if (!user.faltas.length && !flagOff('imphint')) return '<div class="card feat hint1"><div class="sec">¿Ya has faltado antes de hoy?</div><p class="muted">Ponlo y el cálculo será el de verdad.</p><div class="btns"><button class="btn small primary" data-act="prv-open">Poner mis faltas</button><button class="btn small" data-act="imp-x">No he faltado</button></div></div>';
    if (!user.acct && hasAcct() && !accSnooze) return '<div class="card hint hint1"><div class="grow"><b>Guarda tu horario</b><span class="muted">Si cambias de móvil, no pierdes nada.</span></div><button class="btn small primary" data-act="acct-open">Guardar</button><button class="x" data-act="acct-later" aria-label="Ahora no">×</button></div>';
    if (!standalone() && !hintOff() && /^https?:/.test(location.protocol)) return '<div class="card hint hint1"><div class="grow"><b>Ponla en tu pantalla de inicio</b><span class="muted">Se abre como una app.</span></div><button class="btn small primary" data-act="open-install">Cómo</button><button class="x" data-act="hint-x" aria-label="Cerrar">×</button></div>';
    if (!user.acct && bkDue()) return '<div class="card hint hint1"><div class="grow"><b>Guarda tu copia</b><span class="muted">Si pierdes el móvil, pierdes tus faltas.</span></div><button class="btn small primary" data-act="goto-backup">Guardar</button><button class="x" data-act="bk-x" aria-label="Cerrar">×</button></div>';
    if (user.acct && !flagOff('lnkhint')) return '<div class="card hint1"><div class="sec">Por si olvidas la contraseña</div><p class="muted">Guarda este enlace en tus mensajes. Con él lo recuperas todo.</p><div class="btns"><button class="btn small primary" data-act="backup-link">Copiar mi enlace</button><button class="btn small" data-act="lnk-x">Ya lo tengo</button></div></div>';
    return '';
  }
  /** Último día con clase antes de hoy (hasta una semana atrás). */
  function lastClassDay(S, day) {
    for (let i = 1; i <= 7; i++) { const k = addDays(day, -i); if (C.dayClasses(S, k).length) return { k, i }; }
    return null;
  }
  /** Si el último día de clase no apuntaste nada, una pregunta de un toque. Así el número no se queda viejo. */
  function askYesterday(S, day) {
    const p = lastClassDay(S, day); if (!p) return '';
    if (p.k < (user.since || day) || p.k <= (user.okDay || '') || !C.termOf(S, p.k)) return '';
    if (user.faltas.some((f) => f.date === p.k)) return '';
    const when = p.i === 1 ? 'Ayer' : 'El ' + DAYS[C.parse(p.k).getDay()];
    return '<div class="card ask-y"><b>' + when + ', ¿fuiste a todas las clases?</b><div class="btns"><button class="btn small primary" data-yok="' + p.k + '">Sí, a todas</button><button class="btn small" data-yno="' + p.k + '">Falté a alguna</button></div></div>';
  }
  /** Una tarjeta por asignatura (no por hora): cuánto te queda si faltas, y un botón. */
  function subjectCards(S, v, day, canMark) {
    const lim = S.settings.limite, groups = [], by = {};
    v.slots.forEach((x) => { const k = x.canon || x.subject; if (!by[k]) { by[k] = { name: k, slots: [] }; groups.push(by[k]); } by[k].slots.push(x); });
    const sum = Object.fromEntries(C.summary(S, v.term).map((x) => [x.name, x]));
    const isTaken = (x) => user.faltas.some((f) => f.date === day && f.start === x.start && f.subject === x.subject && f.type !== 'retraso');
    return groups.map((g, n) => {
      const st0 = g.slots.map((x) => x.start), times = st0.length > 1 ? st0.slice(0, -1).join(', ') + ' y ' + st0[st0.length - 1] : st0[0], hrs = g.slots.reduce((a, x) => a + x.hours, 0);
      const sub = '<div class="muted">' + times + ' · ' + fmt(hrs) + ' h</div>';
      if (g.slots[0].unknown) return '<div' + rise(Math.min(n, 8)) + '><div class="card slot"><div class="row">' + avatar(S, g.name) + '<div class="grow"><div class="name">' + esc(g.name) + '</div>' + sub + '</div><span class="tag">sin datos</span></div></div></div>';
      const cur = sum[g.name], free = g.slots.filter((x) => !isTaken(x)), done = g.slots.length - free.length;
      let right, bar, btns = '';
      if (canMark && !free.length) {
        // ya apuntada hoy: se ve el margen que queda ahora, y se puede quitar
        right = '<span class="tag ' + (cur ? cur.status : 'verde') + '">✓ apuntada</span>';
        bar = cur ? meter(cur.pct, null, lim, cur.status) : '';
        btns = '<p class="muted mini" style="margin:8px 0 0">Te quedan ' + fmt(cur ? Math.max(0, cur.margin) : 0) + ' h. <button class="link" data-unmiss="' + esc(JSON.stringify({ d: day, u: g.slots.map((x) => [x.subject, x.start]) })) + '">Quitar</button></p>';
      } else {
        const miss = canMark ? free : g.slots, mh = miss.reduce((a, x) => a + x.hours, 0);
        const left = cur ? r1(cur.limit - cur.absent - mh) : 0, st = statusOf(left);
        right = '<span class="tag ' + st + '">' + (left < 0 ? 'te pasas ' + fmt(-left) + ' h' : 'te quedan ' + fmt(left) + ' h') + '</span>';
        bar = cur ? meter(cur.pct, r1(((cur.absent + mh) / cur.total) * 100), lim, st) : '';
        if (canMark) btns = '<div class="btns"><button class="btn small dark" data-miss="' + missAttr(day, free) + '">' + (free.length > 1 ? 'Falté a todo' : 'Falté') + '</button>' +
          (free.length > 1 ? free.map((x) => '<button class="btn small" data-miss="' + missAttr(day, [x]) + '">Solo ' + x.start + '</button>').join('') : '') + '</div>' +
          (done ? '<p class="muted mini" style="margin:8px 0 0">Ya apuntada ' + done + ' de ' + g.slots.length + ' horas.</p>' : '');
      }
      return '<div' + rise(Math.min(n, 8)) + '><div class="card slot"><div class="row">' + avatar(S, g.name) + '<div class="grow"><div class="name">' + esc(g.name) + '</div>' + sub + '</div><div class="right">' + right + '</div></div>' + bar + btns + '</div></div>';
    }).join('');
  }
  const r1 = (x) => Math.round(x * 10) / 10;
  const statusOf = (m) => C.status(m, (user.settings && user.settings.aviso != null) ? +user.settings.aviso : C.DEF.aviso);
  // ---------- faltas de antes: contadores por asignatura (sustituye al copiar y pegar con la IA) ----------
  let prv = null; // { tid, real, vals, min, prev, warn, next }
  function prvOpen(next) {
    const S = calc(); if (!S) return;
    const tid = curTerm(S), real = tid === 'curso' ? (C.termOf(state(), today()) || state().terms[0].id) : tid;
    const sum = C.summary(S, tid), mine = {};
    user.faltas.forEach((f) => { if (f.note === 'previas' && !f.date && C.faltaTerm(S, f) === tid) { const k = C.canon(S, f.subject); mine[k] = (mine[k] || 0) + (+f.hours || 0); } });
    const vals = {}, min = {};
    sum.forEach((x) => { vals[x.name] = r1(x.absent); min[x.name] = r1(Math.max(0, x.absent - (mine[x.name] || 0))); });
    prv = { tid, real, vals, min, prev: mine, warn: false, next: next || 'hoy' }; tab = 'previas'; render(); scrollTo(0, 0);
  }
  function viewPrevias() {
    if (!prv) { prvOpen('hoy'); return ''; }
    const S = calc(), t = S.terms.find((x) => x.id === prv.tid) || S.terms[0], names = Object.keys(prv.vals).sort();
    let h = '<div class="steps"><button class="back" data-act="prv-close">‹ Atrás</button></div><h1 class="big">¿Cuántas horas has faltado ya?</h1><p class="lead">Desde el ' + nice(t.from) + ' hasta hoy. Si no te acuerdas, míralo en el Moodle.</p>';
    h += '<div class="card cnts">' + names.map((n) => '<div class="cnt-row">' + avatar(S, n) + '<b class="grow">' + esc(n) + '</b><button class="step" data-pv="' + esc(n) + '|-1" aria-label="Una hora menos en ' + esc(n) + '"' + (prv.vals[n] <= (prv.min[n] || 0) ? ' disabled' : '') + '>−</button><span class="pv">' + fmt(prv.vals[n]) + ' h</span><button class="step" data-pv="' + esc(n) + '|1" aria-label="Una hora más en ' + esc(n) + '">+</button></div>').join('') + '</div>';
    if (prv.warn) h += '<div class="card warn"><p><b>¿Seguro que no has faltado nada desde el ' + nice(t.from) + '?</b></p><p class="muted">Si pones 0 y no es verdad, NoVoy te dirá que puedes faltar cuando no.</p></div>';
    return h + '<div class="cta"><div class="in"><button class="btn primary" data-act="prv-save">' + (prv.warn ? 'Sí, no he faltado' : 'Listo') + '</button></div></div>';
  }
  function prvSave() {
    const all0 = Object.keys(prv.vals).every((k) => !prv.vals[k]);
    if (all0 && !prv.warn) { prv.warn = true; render(); return; }
    const before = JSON.stringify(user.faltas);
    user.faltas = user.faltas.filter((f) => !(f.note === 'previas' && !f.date && C.faltaTerm(calc(), f) === prv.tid));
    Object.keys(prv.vals).forEach((n) => { const extra = r1(prv.vals[n] - (prv.min[n] || 0)); if (extra > 0) user.faltas.push({ id: nid(), date: '', term: prv.real, subject: n, hours: extra, type: 'falta', justified: false, note: 'previas' }); });
    flagSet('imphint'); const next = prv.next; prv = null; save(); tab = next === 'previas' ? 'hoy' : next; render(); scrollTo(0, 0);
    toast('Guardado', () => { user.faltas = JSON.parse(before); save(); render(); });
  }
  /** data-miss: JSON con la fecha y una unidad por cada hora (asignatura, inicio, horas). */
  const missAttr = (day, slots) => esc(JSON.stringify({ d: day, u: slots.map((x) => [x.subject, x.start, x.hours]) }));
  let onOpen = null; // asignatura desactivada que se está activando
  function offBubble(S, day) {
    const off = C.disabledOn(S, day), pj = S.project && S.project.name && C.projectWeekHours(S.project) > 0;
    if (pj && C.projectOn(S, day)) { const r = S.project.ranges.filter((x) => x.from <= day && (!x.to || day <= x.to)).pop(); return '<div class="card pjbar"><div class="grow"><b>Semana de ' + esc(S.project.name.toLowerCase()) + '</b><span class="muted">Desde el ' + nice(r.from) + '. Las horas marcadas cuentan como ' + esc(S.project.name) + '.</span></div><button class="btn small" data-act="pj-off">Ya es semana normal</button></div>' + (off.length ? offRow(off, S, day) : ''); }
    if (!off.length && !pj) return '';
    return (pj ? '<div class="offs"><button class="pal pj" data-act="pj-on">Semana de ' + esc(S.project.name.toLowerCase()) + ' <span class="mini">activar</span></button></div>' : '') + (off.length ? offRow(off, S, day) : '');
  }
  function offRow(off, S, day) {
    let h = '<div class="offs"><span class="muted mini">Aún no se dan:</span>' + off.map((x) => '<button class="pal pal-off" data-on-open="' + esc(x.name) + '">' + esc(x.name) + ' <span class="mini">activar</span></button>').join('') + '</div>';
    const x = off.find((y) => y.name === onOpen);
    if (x) h += '<div class="card"><div class="sec">¿Ya ha empezado ' + esc(x.name) + '?</div><p class="muted">Desde ese día sus horas dejan de contar para ' + esc(x.cover) + ' y cuentan para ' + esc(x.name) + '. Las faltas que apuntaste en esas horas pasan a ' + esc(x.name) + '.</p><div class="field"><label>Empezó el</label><input type="date" id="on-d" value="' + today() + '"></div><div class="btns"><button class="btn small" data-on-open="">Cancelar</button><button class="btn small primary" data-on-go="' + esc(x.name) + '">Activar</button></div></div>';
    return h;
  }
  /** Activa una asignatura desde `date`: sus franjas vuelven a ser suyas y sus faltas desde ese día también. */
  function activate(name, date) {
    const prev = JSON.stringify(user), x = (user.config.disabled || {})[name]; if (!x) return;
    x.on = date;
    const S = state(), moved = [];
    user.faltas.forEach((f) => {
      if (!f.date || f.date < date || f.subject !== x.cover || !f.start) return;
      const own = (C.scheduleOn(S, f.date)[C.weekday(f.date)] || []).filter((b) => b.subject === name).some((b) => C.hourSlots(b).some((sl) => sl.start === f.start));
      if (own) { f.subject = name; delete f.sid; moved.push(f.id); }
    });
    onOpen = null; save(); render();
    toast(name + ' activada' + (moved.length ? ' · ' + moved.length + ' falta(s) movidas' : ''), () => { user = JSON.parse(prev); save(); render(); });
  }
  function allDay(v, day) {
    const sl = v.slots.filter((x) => !x.unknown); if (!sl.length) return '';
    return '<button class="btn block day-btn" data-miss="' + missAttr(day, sl) + '">Falté todo el día</button>';
  }
  function curTerm(S) { return (viewTerm && S.terms.some((t) => t.id === viewTerm) ? viewTerm : null) || C.termOf(S, today()) || (S.terms.filter((t) => t.from <= today()).pop() || S.terms[0]).id; }
  function lastLine(x, rem) {
    let t = '';
    if (x.margin < 0) t = 'Te has pasado ' + fmt(-x.margin) + ' h del límite.';
    else if (rem && rem <= x.margin) t = 'A salvo: aunque faltes a todo lo que queda, no te pasas.';
    else if (x.margin === 0) t = 'Sin margen: una falta más y te pasas.';
    else return '';
    return '<p class="last ' + (rem && rem <= x.margin && x.margin >= 0 ? 'verde' : x.status) + '">' + t + '</p>';
  }
  function viewResumen() {
    if (!user.config) return emptyView('Resumen', 'Aquí verás cuántas horas te quedan en cada asignatura.');
    const S = calc(), lim = S.settings.limite, tid = curTerm(S), sum = C.summary(S, tid);
    let h = '<div class="top"><h1>Resumen</h1></div>';
    if (S.terms.length > 1) h += '<div class="seg terms">' + S.terms.map((t) => '<button class="' + (t.id === tid ? 'on' : '') + '" data-term="' + esc(t.id) + '">' + esc(t.label.replace(/ trimestre$/, ' trim.')) + '</button>').join('') + '</div>';
    const rem = C.remaining(S, tid, today());
    h += '<p class="muted">Puedes faltar hasta el ' + lim + '% de cada asignatura.</p>';
    if (!sum.length) h += '<div class="card muted">Este trimestre aún no tiene horas.</div>';
    const offNow = new Set(C.disabledOn(S, today()).map((x) => x.name)), offRows = sum.filter((x) => offNow.has(x.name));
    sum.filter((x) => !offNow.has(x.name)).sort((a, b) => a.margin - b.margin).forEach((x, n) => {
      h += '<div' + rise(n) + '><div class="card"><div class="row">' + avatar(S, x.name) + '<div class="grow"><div class="name">' + esc(x.name) + '</div><div class="muted">Llevas ' + fmt(x.absent) + ' de ' + fmt(x.limit) + ' h</div></div><div class="right"><span class="tag big ' + x.status + '">' + (x.margin < 0 ? 'te pasas ' + fmt(-x.margin) + ' h' : 'te quedan ' + fmt(x.margin) + ' h') + '</span></div></div>' + meter(x.pct, null, lim, x.status) +
        lastLine(x, rem[x.name] || 0) + '</div></div>';
    });
    const nc = (S.nocount || []).filter((k) => C.allSubjects(S).indexOf(k) >= 0);
    if (nc.length) h += '<p class="muted mini" style="margin:14px 2px 0">' + nc.map(esc).join(', ') + ' no ' + (nc.length === 1 ? 'cuenta' : 'cuentan') + ' faltas. <button class="link" data-act="go-nocount">Cambiar</button></p>';
    if (offRows.length) h += '<div class="card"><div class="sec">Aún no se dan</div><ul class="list">' + offRows.map((x) => '<li><b>' + esc(x.name) + '</b> · ' + fmt(x.total) + ' h en total · podrás faltar ' + fmt(x.limit) + ' h</li>').join('') + '</ul><p class="muted">Actívalas en la pantalla Hoy cuando empiecen.</p></div>';
    const orph = C.orphans(S);
    if (orph.length) h += '<div class="card warn"><div class="sec">Faltas sin asignatura</div><p>' + orph.length + ' falta' + (orph.length === 1 ? '' : 's') + ' de ' + Array.from(new Set(orph.map((f) => f.subject))).map(esc).join(', ') + ' ya no ' + (orph.length === 1 ? 'está' : 'están') + ' en tu horario. No se han borrado: edítalas en «Faltas» para pasarlas a otra asignatura.</p></div>';
    const n = +S.settings.retrasosPorFalta, late = n > 0 ? C.latesByTerm(S, tid) : {};
    if (n > 0 && Object.keys(late).length) h += '<div class="card"><div class="sec">Retrasos</div><p class="muted">Cada ' + n + ' retrasos cuentan 1 h de falta (ya sumada arriba).</p><ul class="list">' + Object.keys(late).sort().map((k) => { const r = late[k] % n; return '<li><b>' + esc(k) + '</b>: ' + late[k] + ' retraso' + (late[k] === 1 ? '' : 's') + ' · ' + (r === 0 ? 'el siguiente empieza otra cuenta' : 'te faltan ' + (n - r) + ' para la siguiente hora') + '</li>'; }).join('') + '</ul></div>';
    const un = user.faltas.filter((f) => !f.date && f.note !== 'previas' && f.term === tid).length;
    if (un) h += '<p class="muted" style="margin-top:14px">' + un + ' falta(s) sin fecha cuentan en el total. Ponles fecha en "Faltas".</p>';
    return h;
  }
  const subjectsOf = (S) => C.allSubjects(S).slice().sort();
  // asignaturas del día de la semana de esa fecha (si no hay clase ese día, todas)
  const subjectsOn = (S, date) => {
    const ok = date && /^\d{4}-\d\d-\d\d$/.test(date);
    const day = ok ? Array.from(new Set(C.dayClasses(S, date).map((b) => b.subject))) : [];
    return day.length ? { list: day, all: false } : { list: subjectsOf(S), all: true };
  };
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
    let h = '<div class="top"><h1>Faltas</h1></div>' + weekGrid(S) + '<details class="more"><summary>Apuntar a mano (otra forma)</summary><form id="add" class="card" style="margin-top:8px"><div class="sec">Apuntar una falta</div>' +
      '<div class="field"><label>Fecha</label><input type="date" name="date" value="' + today() + '" required></div>' +
      '<div class="field"><label>Asignatura</label><select name="subject">' + subjectOpts(S, today()) + '</select><div class="muted" id="subhint">' + (subjectsOn(S, today()).all ? 'Ese día no hay clase: salen todas.' : 'Solo las de ese día.') + '</div></div>' +
      '<div class="field"><label>Hora</label><select name="slot">' + slotOpts(S, today(), subjectsOn(S, today()).list[0]) + '</select><div class="muted">Cada hora es una falta. Si faltaste a dos seguidas, apunta las dos.</div></div>' +
      '<div class="switch" style="margin-top:12px"><label for="rt">' + lateLabel() + '</label><input id="rt" type="checkbox" name="retraso"></div><div class="switch"><label for="ju">Justificada</label><input id="ju" type="checkbox" name="justified"></div>' +
      '<button class="btn primary block" style="margin-top:10px">Añadir falta</button></form></details><h2>Registradas</h2>';
    h = h.replace('<h2>Registradas</h2>', '');
    const list = user.faltas.filter((f) => !fday || f.date === fday).sort((a, b) => ((b.date || '0') < (a.date || '0') ? -1 : 1));
    h += '<div class="top" style="margin-top:22px"><h2 style="margin:0">' + (user.faltas.length === 1 ? 'Registrada 1 falta' : 'Registradas ' + user.faltas.length + ' faltas') + '</h2></div><div class="filter"><div class="field" style="margin:0;flex:1"><label>Filtrar por día</label><input type="date" id="fday" value="' + (fday || '') + '"></div>' + (fday ? '<button class="btn small" data-act="fclear">Ver todas</button>' : '') + '</div>';
    h += list.length ? list.map((f, n) => f.id === efId ? editForm(S, f) : faltaCard(f, n)).join('') : '<p class="muted">' + (fday ? 'Ese día no hay faltas apuntadas.' : 'Aún no hay faltas. Qué sospechoso.') + '</p>';
    return h;
  }
  /** Las horas sueltas de esa clase ese día, una por una: ["08:00 – 09:00", "09:00 – 10:00"]. */
  // ---- rejilla de la semana: cada casilla es una hora de clase; tocarla abre una tarjeta para apuntarla
  let fwk = null, fcell = null; // lunes de la semana que se ve, y casilla abierta {d, st, s, h}
  const addDays = (k, n) => { const d = C.parse(k); d.setDate(d.getDate() + n); return C.ymd(d); };
  const mondayOf = (k) => { const d = C.parse(k), w = d.getDay(); d.setDate(d.getDate() + (w === 0 ? 1 : w === 6 ? 2 : 1 - w)); return C.ymd(d); };
  function weekGrid(S) {
    const mon = fwk || mondayOf(today()), days = [0, 1, 2, 3, 4].map((i) => addDays(mon, i)), cols = {}, rows = {};
    days.forEach((k) => { cols[k] = {}; C.dayClasses(S, k).forEach((b) => C.hourSlots(b).forEach((x) => { cols[k][x.start] = { s: b.subject, e: x.end, h: x.hours }; rows[x.start] = rows[x.start] || x.end; })); });
    const starts = Object.keys(rows).sort(), DL = ['L', 'M', 'X', 'J', 'V'];
    const mine = (k, st, sub) => user.faltas.find((f) => f.date === k && f.start === st && f.subject === sub);
    const hol = (k) => (S.holidays || []).find((x) => k >= x.from && k <= (x.to || x.from));
    let h = '<div class="card wk"><div class="wkbar"><button class="btn small" data-fw="-7" aria-label="Semana anterior">‹</button><b>' + nice(days[0]).replace(/^\S+ /, '') + ' – ' + nice(days[4]).replace(/^\S+ /, '') + '</b><button class="btn small" data-fw="7" aria-label="Semana siguiente">›</button></div>' +
      (mon !== mondayOf(today()) ? '<p style="text-align:center;margin:0 0 6px"><button class="link" data-fw="0">Volver a esta semana</button></p>' : '') +
      '<p class="muted mini" style="margin:0 0 8px">Toca la hora a la que faltaste.</p>';
    if (!starts.length) return h + '<p class="muted">Esta semana no hay clase.</p></div>';
    // línea de tiempo: cada casilla se coloca según su hora real, así los días con horas distintas no se descuadran
    const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3), K = 1.05;
    let t0 = Infinity, t1 = 0; days.forEach((k) => Object.keys(cols[k]).forEach((st) => { t0 = Math.min(t0, mins(st)); t1 = Math.max(t1, mins(cols[k][st].e)); }));
    const H = Math.round((t1 - t0) * K), top = (t) => Math.round((mins(t) - t0) * K);
    const ticks = Array.from(new Set(starts)).filter((st, i, arr) => i === 0 || mins(st) - mins(arr[i - 1]) >= 25);
    h += '<div class="tl"><span></span>' + days.map((k, i) => '<b class="gh' + (k === today() ? ' now' : '') + '">' + DL[i] + '<small>' + C.parse(k).getDate() + '</small></b>').join('');
    h += '<div class="ax" style="height:' + H + 'px">' + ticks.map((st) => '<span style="top:' + top(st) + 'px">' + st + '</span>').join('') + '</div>';
    days.forEach((k) => {
      h += '<div class="col" style="height:' + H + 'px">';
      const sl = Object.keys(cols[k]).sort();
      if (!sl.length) h += '<span class="fc empty" style="top:0;height:' + H + 'px">' + (hol(k) ? '<small>' + esc(hol(k).label) + '</small>' : '') + '</span>';
      sl.forEach((st) => {
        const c = cols[k][st], f = mine(k, st, c.s), cls = f ? (f.type === 'retraso' ? ' late' : ' miss') : '', open = fcell && fcell.d === k && fcell.st === st ? ' sel' : '';
        const odd = ticks.indexOf(st) < 0 || (mins(c.e) - mins(st)) !== 60; // hora distinta de las de la columna de horas: se enseña dentro
        h += '<button class="fc' + cls + open + '" style="top:' + top(st) + 'px;height:' + Math.max(28, Math.round((mins(c.e) - mins(st)) * K) - 4) + 'px;--c:' + AVC[Math.max(0, subjectsOf(S).indexOf(c.s)) % AVC.length] + '" data-fc="' + esc(JSON.stringify({ d: k, st, s: c.s, h: c.h, e: c.e })) + '" aria-label="' + esc(c.s + ', ' + nice(k) + ', ' + st + '–' + c.e + (f ? ', apuntada' : '')) + '">' + esc(initials(c.s)) + (odd ? '<small>' + st + '</small>' : '') + (f ? '<i>' + (f.type === 'retraso' ? 'R' : '✕') + '</i>' : '') + '</button>';
      });
      h += '</div>';
    });
    h += '</div>' + cellCard() + '</div>';
    return h;
  }
  function cellCard() {
    if (!fcell) return '';
    const c = fcell, f = user.faltas.find((x) => x.date === c.d && x.start === c.st && x.subject === c.s);
    const late = f ? f.type === 'retraso' : !!c.late, just = f ? !!f.justified : !!c.just;
    return '<div class="fcard"><div class="row"><div class="grow"><div class="name">' + esc(c.s) + '</div><div class="muted">' + nice(c.d) + ' · ' + c.st + '–' + c.e + '</div></div><button class="x" data-fc-x="1" aria-label="Cerrar">×</button></div>' +
      '<div class="switch"><label for="fc-l">¿Retraso?</label><input id="fc-l" type="checkbox" data-fc-t="late"' + (late ? ' checked' : '') + '></div>' +
      '<div class="switch"><label for="fc-j">¿Justificada?</label><input id="fc-j" type="checkbox" data-fc-t="just"' + (just ? ' checked' : '') + '></div>' +
      '<div class="btns">' + (f ? '<button class="btn small" data-fc-del="' + esc(f.id) + '">Quitar</button><button class="btn small primary" data-fc-save="' + esc(f.id) + '">Guardar</button>' : '<button class="btn primary block" data-fc-add="1">' + (late ? 'Apuntar retraso' : 'Apuntar falta') + '</button>') + '</div></div>';
  }
  /** Opciones de hora de una asignatura un día: "inicio|horas". Si no hay clase, una unidad sin hora. */
  function slotOpts(S, date, subject, sel) {
    const out = [];
    if (date && /^\d{4}-\d\d-\d\d$/.test(date)) C.dayClasses(S, date).filter((b) => b.subject === subject).forEach((b) => C.hourSlots(b).forEach((x) => out.push(x)));
    if (!out.length) return '<option value="|1">Sin hora concreta (1 h)</option>';
    return out.map((x) => '<option value="' + x.start + '|' + x.hours + '"' + (x.start === sel ? ' selected' : '') + '>' + x.start + ' – ' + x.end + (x.hours !== 1 ? ' (' + fmt(x.hours) + ' h)' : '') + '</option>').join('');
  }
  function slotTimes(S, f) {
    if (!f.date || !/^\d{4}-\d\d-\d\d$/.test(f.date)) return [];
    const out = [];
    (C.scheduleOn(S, f.date)[C.weekday(f.date)] || []).filter((b) => b.subject === f.subject)
      .forEach((b) => C.hourSlots(b).forEach((x) => out.push(x.start + ' – ' + x.end)));
    return out;
  }
  const orphanSet = () => new Set(user.config ? C.orphans(state()).map((f) => f.id) : []);
  function lateLabel() { const n = +(user.settings || {}).retrasosPorFalta; return n > 0 ? 'Es un retraso (cada ' + n + ' = 1 h de falta)' : 'Es un retraso (no cuenta)'; }
  function faltaCard(f, n) {
    const S = state(), tags = (f.type === 'retraso' ? '<span class="tag neutral">retraso</span>' : '') + (f.justified ? '<span class="tag ok">justificada</span>' : '');
    return '<div' + rise(Math.min(n, 8)) + '><div class="card row">' + avatar(S, f.subject) + '<div class="grow"><div class="name">' + esc(f.subject) + (f.hours !== 1 && f.type !== 'retraso' ? ' <span class="muted">· ' + fmt(f.hours) + ' h</span>' : '') + '</div><div class="muted">' + (f.date ? nice(f.date) : f.note === 'previas' ? 'de antes de usar NoVoy' : 'sin fecha') + (f.start ? ' · ' + f.start : '') + '</div>' + (orphanSet().has(f.id) ? '<div class="tags"><span class="tag amarillo">ya no está en tu horario</span></div>' : '') + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div><div class="acts"><button class="btn small" data-edit="' + esc(f.id) + '">Editar</button><button class="btn small ghost" data-del="' + esc(f.id) + '" aria-label="Borrar falta">Borrar</button></div></div></div>';
  }
  function editForm(S, f) {
    const subs = subjectsOf(S); if (f.subject && subs.indexOf(f.subject) < 0) subs.push(f.subject);
    return '<form id="edf" class="card editing" data-id="' + esc(f.id) + '"><div class="sec">Editar falta</div><div class="field"><label>Fecha</label><input type="date" name="date" value="' + esc(f.date || '') + '"></div>' +
      '<div class="field"><label>Asignatura</label><select name="subject">' + subs.map((x) => '<option' + (x === f.subject ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Hora</label><select name="slot">' + slotOpts(S, f.date, f.subject, f.start) + '</select></div>' +
      '<div class="switch" style="margin-top:12px"><label for="ert">' + lateLabel() + '</label><input id="ert" type="checkbox" name="retraso"' + (f.type === 'retraso' ? ' checked' : '') + '></div><div class="switch"><label for="eju">Justificada</label><input id="eju" type="checkbox" name="justified"' + (f.justified ? ' checked' : '') + '></div>' +
      '<div class="btns"><button type="button" class="btn small" data-act="ecancel">Cancelar</button><button class="btn small primary">Guardar cambios</button></div></form>';
  }
  let adm = null, gNotice = null; // panel de admin y aviso global
  const isMainAdmin = () => !!(user.acct && window.FTAcct && user.acct.u.toLowerCase() === FTAcct.ADMIN);
  const isAdmin = () => isMainAdmin() || !!(user.acct && user.acct.adm); // el servidor lo vuelve a comprobar siempre
  async function admApi(what, extra) {
    const A = window.FTAcct;
    return A.api(Object.assign({ op: 'admin', what, id: user.acct.id, auth: user.acct.auth }, extra || {}));
  }
  async function admLoad() {
    adm = adm || { tab: 'users' };
    adm.busy = true; render();
    try {
      const [l, s] = await Promise.all([admApi('list'), admApi('stats')]);
      if (!l.ok) throw new Error(l.error || 'error');
      adm.users = l.users; adm.stats = s.ok ? s.stats : null;
      const n = await window.FTAcct.notice(); adm.notice = n || { text: '', until: '' };
    } catch (e) { toast(e.message === 'red' ? 'Sin conexión' : 'No se pudo cargar el panel'); }
    adm.busy = false; render();
  }
  const ago = (t) => {
    if (!t) return 'nunca';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    if (m < 1440) return 'hace ' + Math.round(m / 60) + ' h';
    const d = Math.round(m / 1440);
    return d === 1 ? 'ayer' : 'hace ' + d + ' días';
  };
  const kb = (n) => (n > 1024 ? Math.round(n / 1024) + ' KB' : (n || 0) + ' B');
  function viewAdmin() {
    let h = '<div class="steps"><button class="back" data-act="adm-close">‹ Atrás</button></div><h1>Panel de admin</h1>' +
      '<p class="muted" style="margin-top:6px">Conectado como <b>' + esc(user.acct.u) + '</b>. Las faltas de cada alumno van cifradas con su contraseña: aquí no se pueden abrir.</p>';
    if (adm && adm.busy && !adm.users) return h + '<p class="muted" style="margin-top:20px">Cargando…</p>';
    if (!adm || !adm.users) return h + '<div class="btns"><button class="btn primary" data-act="adm-load">Cargar</button></div>';
    const st = adm.stats;
    if (st) h += '<div class="card"><div class="sec">Uso</div><div class="nums">' +
      [['Cuentas', st.cuentas], ['Activas 7 días', st.activas7], ['Hoy', st.activas24], ['Altas 7 días', st.altas7]]
        .map((x) => '<div><b>' + x[1] + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +
      (st.lectura && st.lectura.length ? '<p class="muted mini" style="margin:10px 0 0">Lector de capturas (30 días): ' +
        (() => { const a = {}; st.lectura.forEach((d) => Object.keys(d.v).forEach((k) => { a[k] = (a[k] || 0) + d.v[k]; }));
          const tot = (a['ocr-ok'] || 0) + (a['ocr-editado'] || 0) + (a['ocr-fallo'] || 0);
          return tot ? (a['ocr-ok'] || 0) + ' bien · ' + (a['ocr-editado'] || 0) + ' con retoques · ' + (a['ocr-fallo'] || 0) + ' fallidas · ' + (a['manual'] || 0) + ' pintados a mano' : 'todavía sin datos'; })() + '</p>' : '') +
      '<div class="btns" style="margin-top:12px"><button class="btn small" data-act="adm-load">Actualizar</button><button class="btn small" data-act="adm-export">Descargar copia</button></div></div>';
    h += '<div class="card"><div class="sec">Aviso para todos</div><p class="muted">Sale en la pantalla principal de cualquiera que abra la app.</p>' +
      '<form id="adm-notice"><div class="field"><label>Mensaje (vacío para quitarlo)</label><input name="text" maxlength="300" value="' + esc((adm.notice && adm.notice.text) || '') + '" placeholder="Mañana no hay clase"></div>' +
      '<div class="field"><label>Hasta el día (opcional)</label><input type="date" name="until" value="' + esc((adm.notice && adm.notice.until) || '') + '"></div>' +
      '<div class="btns"><button class="btn small primary">Publicar aviso</button></div></form></div>';
    h += '<div class="top" style="margin-top:22px"><h2 style="margin:0">' + adm.users.length + ' cuenta' + (adm.users.length === 1 ? '' : 's') + '</h2></div>';
    h += adm.users.map((u) => '<div class="card row' + (u.blocked ? ' err' : '') + '"><div class="grow"><b>' + esc(u.u || '(sin nombre)') + '</b>' +
      (u.blocked ? ' <span class="pill">bloqueada</span>' : '') + (u.adm || u.u.toLowerCase() === FTAcct.ADMIN ? ' <span class="pill">admin</span>' : '') +
      '<div class="muted">' + (u.c ? 'alta ' + nice(new Date(u.c).toISOString().slice(0, 10)) : 'alta desconocida') + ' · últ. uso ' + ago(u.t) + ' · ' + kb(u.n) + '</div>' +
      (u.note ? '<div class="muted">Nota: ' + esc(u.note) + '</div>' : '') +
      '</div><div class="btns"><button class="btn small" data-adm-note="' + u.id + '">Nota</button>' + (isMainAdmin() && u.u.toLowerCase() !== FTAcct.ADMIN ? '<button class="btn small" data-adm-role="' + u.id + '">' + (u.adm ? 'Quitar admin' : 'Hacer admin') + '</button>' : '') + '<button class="btn small" data-adm-block="' + u.id + '">' + (u.blocked ? 'Desbloquear' : 'Bloquear') + '</button><button class="btn small" data-adm-del="' + u.id + '">Borrar</button></div></div>').join('');
    return h;
  }
  function acctCard() {
    const A = window.FTAcct; if (!A || !window.crypto || !crypto.subtle) return '';
    if (user.acct) {
      const when = user.acct.t ? new Date(user.acct.t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'todavía no';
      const warn = acState === 'err' ? '<p class="muted">No se pudo guardar la última vez. Se reintenta con cada cambio.</p>' : acState === 'sesion' ? '<p class="muted">La sesión ya no vale. Cierra sesión y vuelve a entrar.</p>' : acState === 'bloqueada' ? '<p class="muted">Esta cuenta está bloqueada: deja de guardarse en el servidor. Tus datos siguen en este móvil.</p>' : '';
      return '<div class="card"><div class="sec">Cuenta</div><p class="muted">Conectado como <b>' + esc(user.acct.u) + '</b>. Tus datos se guardan cifrados tras cada cambio. Último guardado: ' + when + '.</p>' + warn + acctTools() + '<div class="btns"><button class="btn small primary" data-act="acct-push">Guardar ahora</button><button class="btn small" data-acx="out">Cerrar sesión</button>' + (isAdmin() ? '<button class="btn small" data-act="adm-open">Panel de admin</button>' : '') + '</div></div>';
    }
    const m = acg.mode === 'login' ? 'login' : 'new';
    return '<div class="card"><div class="sec">Cuenta</div><p class="muted">Usuario y contraseña, sin correo. Entra en otro móvil y recupera tu horario y tus faltas.</p>' +
      '<div class="seg" style="margin:10px 0 4px;display:inline-flex"><button class="' + (m === 'new' ? 'on' : '') + '" data-act="ac-mode" data-m="new">Crear cuenta</button><button class="' + (m === 'login' ? 'on' : '') + '" data-act="ac-mode" data-m="login">Ya tengo: entrar</button></div>' + accForm(m, true) + '</div>';
  }
  const acg = { u: '', p: '', mode: 'new', eye: false };
  /** Formulario de cuenta. mode 'new' (crear) o 'login' (entrar). Un <form> de verdad con autocomplete
   *  correcto: si el campo de entrar fuese "new-password", el móvil propondría una contraseña nueva
   *  y la guardaría encima de la buena. */
  function accForm(mode, withSubmit) {
    const A = window.FTAcct, nw = mode === 'new', t = acg.eye ? 'text' : 'password';
    if (nw && !acg.u) acg.u = A.genUser();
    const checks = A.passChecks(A.cleanPass(acg.p || ''));
    return '<form id="acf" data-mode="' + mode + '" method="post" action="#" autocomplete="on">' +
      '<div class="field"><label for="ac-u">Usuario</label>' + (nw ? '<div class="two" style="grid-template-columns:1fr auto"><input id="ac-u" name="username" value="' + esc(acg.u) + '" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false"><button type="button" class="btn small" data-act="acct-dice" aria-label="Otro usuario">🎲</button></div><p class="muted mini">Te hemos puesto uno al azar. Puedes cambiarlo.</p>' : '<input id="ac-u" name="username" value="' + esc(acg.uLogin || '') + '" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Tu usuario">') + '</div>' +
      '<div class="field"><label for="ac-p">Contraseña</label><div class="two" style="grid-template-columns:1fr auto"><input id="ac-p" name="password" type="' + t + '" value="' + esc(acg.p || '') + '" autocomplete="' + (nw ? 'new-password' : 'current-password') + '" autocapitalize="off" autocorrect="off" spellcheck="false"><button type="button" class="btn small" data-act="ac-eye" aria-label="' + (acg.eye ? 'Ocultar' : 'Ver') + ' contraseña">' + (acg.eye ? 'Ocultar' : 'Ver') + '</button></div></div>' +
      (nw ? '<div class="field"><label for="ac-p2">Repite la contraseña</label><input id="ac-p2" name="password2" type="' + t + '" value="' + esc(acg.p2 || '') + '" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
        '<ul class="list acc-chk">' + checks.map((c) => '<li data-ok="' + (c[1] ? 1 : 0) + '">' + (c[1] ? '✅' : '◻️') + ' ' + c[0] + '</li>').join('') + '<li id="ac-same">' + (acg.p && acg.p2 != null && A.cleanPass(acg.p) === A.cleanPass(acg.p2 || '') ? '✅' : '◻️') + ' Las dos iguales</li></ul>' : '') +
      (withSubmit ? '<button class="btn primary block" style="margin-top:12px">' + (nw ? 'Crear cuenta' : 'Entrar') + '</button>' : '') + '</form>';
  }
  /** Crear cuenta o entrar. */
  async function acctGo(mode, b) {
    const A = window.FTAcct, uI = (($('#ac-u') || {}).value || '').trim(), pRaw = ($('#ac-p') || {}).value || '', p2 = ($('#ac-p2') || {}).value || '';
    acg.p = pRaw; acg.p2 = p2; if (mode === 'new') acg.u = uI; else acg.uLogin = uI;
    if (mode === 'new') {
      if (!A.userOk(uI)) return toast('El usuario: solo letras y números, de 3 a 24');
      if (A.passChecks(A.cleanPass(pRaw)).some((c) => !c[1])) return toast('La contraseña no cumple los 3 requisitos');
      if (A.cleanPass(pRaw) !== A.cleanPass(p2)) return toast('Las dos contraseñas no son iguales');
    } else if (!uI || !pRaw) return toast('Escribe tu usuario y tu contraseña');
    const prevTxt = b ? b.textContent : ''; if (b) { b.disabled = true; b.textContent = 'Un momento…'; }
    try {
      if (mode === 'new') {
        const k = await A.derive(uI, A.cleanPass(pRaw)), kb = await A.expKey(k.key);
        const r = await A.api({ op: 'new', id: k.id, auth: k.auth, u: uI, data: await A.seal(k.key, SU.toExport(snapState())) });
        if (r.ok) { user.acct = { u: uI, id: k.id, auth: k.auth, k: kb, t: Date.now() }; acg.p = ''; acg.p2 = ''; acg.eye = false; save(); if (sx.scr === 'reg') { sx.scr = 'method'; if (user.config) tab = 'hoy'; scrollTo(0, 0); } toast('Cuenta creada. Ya no pierdes nada'); }
        else toast(r.error === 'existe' ? 'Ese usuario ya está cogido. Prueba el dado 🎲' : /^(sin-blobs|blobs-caido|sin-kv|almacen-caido)$/.test(r.error) ? 'El servidor de cuentas no está listo todavía' : 'No se pudo crear. Prueba otra vez');
      } else {
        let r = null, k = null;
        for (const v of A.passVariants(pRaw)) { k = await A.derive(uI, v); r = await A.api({ op: 'get', id: k.id, auth: k.auth }); if (r.ok || r.error !== 'clave') break; }
        if (r.ok) {
          const kb = await A.expKey(k.key), txt = await A.open(k.key, r.data); jn = SU.parseImport(txt);
          const sess = { u: uI, id: k.id, auth: k.auth, k: kb, t: r.t || Date.now(), adm: !!r.adm };
          let vacia = false;
          try { const o = JSON.parse(txt); vacia = !!o && !Object.keys(o.horario || {}).some((dd) => (o.horario[dd] || []).length); } catch (er) {}
          acg.p = ''; acg.eye = false;
          if (jn.ok) { acPend = sess; jn.acct = sess.u; tab = 'join'; scrollTo(0, 0); }
          else if (vacia) { user.acct = sess; jn = null; save(); sx.scr = 'method'; tab = 'setup'; toast('Hola de nuevo. Aún no tenías horario guardado'); scrollTo(0, 0); }
          else toast('La copia guardada no se pudo leer');
        } else toast(r.error === 'no-existe' ? 'Ese usuario no existe. Revisa mayúsculas aparte: ¿lo escribiste igual?' : r.error === 'clave' ? 'Contraseña incorrecta' : r.error === 'bloqueada' ? 'Esta cuenta está bloqueada' : 'No se pudo entrar. Prueba otra vez');
      }
    } catch (e) { toast(e.message === 'red' ? 'Sin conexión. Inténtalo con internet' : e.message === 'sin-servidor' ? 'Este despliegue no tiene el servidor de cuentas' : 'Algo ha fallado. Prueba otra vez'); }
    if (b) { b.disabled = false; b.textContent = prevTxt; } render();
  }
  // ---------- con la sesión abierta: comprobar, cambiar contraseña y cerrar sesión con red de seguridad
  let acx = null, acxFail = false; // 'check' | 'change' | 'out'
  function acctTools() {
    const hidden = '<input type="text" name="username" value="' + esc(user.acct.u) + '" autocomplete="username" hidden>';
    const pf = (id, ac, lab) => '<div class="field"><label for="' + id + '">' + lab + '</label><input id="' + id + '" type="password" autocomplete="' + ac + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>';
    if (acx === 'check' || acx === 'out') return '<form id="acx-f" class="acx" data-m="' + acx + '" method="post" action="#">' + hidden + '<p class="muted">' + (acx === 'out' ? 'Antes de cerrar sesión, comprueba que recuerdas tu contraseña. Sin ella no podrás volver a entrar.' : 'Escríbela (o deja que la rellene tu gestor) y te digo si es la buena.') + '</p>' + pf('acx-p', 'current-password', 'Contraseña') +
      (acxFail ? '<div class="card warn" style="margin-top:10px"><p><b>No coincide.</b> Ahora que aún estás dentro, cámbiala por una que sepas' + (acx === 'out' ? ' antes de cerrar sesión' : '') + '.</p><div class="btns"><button type="button" class="btn small primary" data-acx="change">Cambiar contraseña</button>' + (acx === 'out' ? '<button type="button" class="btn small bad" data-act="acct-out-force">Cerrar igualmente</button>' : '') + '</div></div>' : '') +
      '<div class="btns"><button type="button" class="btn small" data-acx="">Cancelar</button><button class="btn small primary">' + (acx === 'out' ? 'Comprobar y cerrar sesión' : 'Comprobar') + '</button></div></form>';
    if (acx === 'change') return '<form id="acx-f" class="acx" data-m="change" method="post" action="#">' + hidden + '<p class="muted">Tus datos se vuelven a cifrar con la nueva. La antigua deja de valer en todos los móviles.</p>' + pf('acx-n', 'new-password', 'Contraseña nueva') + pf('acx-n2', 'new-password', 'Repítela') + '<p class="muted mini">Más de 8 caracteres, una mayúscula y un número.</p><div class="btns"><button type="button" class="btn small" data-acx="">Cancelar</button><button class="btn small primary">Cambiar contraseña</button></div></form>';
    return '<div class="btns"><button class="btn small" data-acx="check">Comprobar mi contraseña</button><button class="btn small" data-acx="change">Cambiar contraseña</button></div>';
  }
  async function acxGo(m, b) {
    const A = window.FTAcct;
    if (m === 'check' || m === 'out') {
      const p = ($('#acx-p') || {}).value || ''; if (!p) return toast('Escribe tu contraseña');
      b.disabled = true; const ok = await A.check(user.acct, p); b.disabled = false;
      if (!ok) { acxFail = true; render(); return; }
      acxFail = false;
      if (m === 'out') { acx = null; delete user.acct; acState = ''; save(); toast('Sesión cerrada. Tus datos siguen en este móvil'); render(); return; }
      acx = null; toast('Es la buena ✓'); render(); return;
    }
    const n = ($('#acx-n') || {}).value || '', n2 = ($('#acx-n2') || {}).value || '';
    if (A.passChecks(A.cleanPass(n)).some((c) => !c[1])) return toast('La nueva no cumple los 3 requisitos');
    if (A.cleanPass(n) !== A.cleanPass(n2)) return toast('Las dos no son iguales');
    b.disabled = true; b.textContent = 'Un momento…';
    try {
      const k = await A.derive(user.acct.u, A.cleanPass(n));
      const r = await A.api({ op: 'rekey', id: user.acct.id, auth: user.acct.auth, newAuth: k.auth, data: await A.seal(k.key, SU.toExport(snapState())) });
      if (r.ok) { user.acct = Object.assign({}, user.acct, { auth: k.auth, k: await A.expKey(k.key), t: r.t || Date.now() }); acState = 'ok'; acx = null; acxFail = false; save(); toast('Contraseña cambiada. Guárdala en tu gestor'); }
      else toast(r.error === 'clave' ? 'La sesión ya no vale: entra otra vez' : 'No se pudo cambiar. Prueba otra vez');
    } catch (e) { toast(e.message === 'red' ? 'Sin conexión' : 'Algo ha fallado'); }
    render();
  }
  /** Reglas del centro que cambian el cálculo. Si no las sabes, se usa lo más restrictivo. */
  function rulesCard(S) {
    const s = S.settings, multi = (S.terms || []).length > 1;
    return '<div class="card"><div class="sec">Reglas de tu centro</div><p class="muted">Pregúntalo a tu tutor si no lo sabes. Mientras tanto se usa lo más estricto.</p>' +
      (multi ? '<div class="field"><label>El límite se aplica</label><select data-sel="ambito"><option value="trimestre"' + (s.ambito !== 'curso' ? ' selected' : '') + '>En cada trimestre (o no lo sé)</option><option value="curso"' + (s.ambito === 'curso' ? ' selected' : '') + '>Sobre el curso entero</option></select><div class="muted">' + (s.ambito === 'curso' ? 'Se suman todos los trimestres en uno.' : 'Cada trimestre tiene su propio margen.') + '</div></div>' : '') +
      '<div class="field"><label>Retrasos que hacen 1 h de falta</label><input type="number" data-num="retrasosPorFalta" min="0" max="50" step="1" inputmode="numeric" value="' + (+s.retrasosPorFalta || 0) + '"><div class="muted">0 = los retrasos no cuentan. Si no lo sabes, muchos centros usan 3.</div></div></div>';
  }
  /** Ajustes por apartados: primero la lista, luego un apartado con sus tarjetas. */
  let ajSec = null;
  const AJ = [
    ['horario', 'Horario', 'Tu semana, trimestres y festivos'],
    ['faltas', 'Reglas de tu centro', 'Límite, retrasos y justificadas'],
    ['clase', 'Pásalo a tu clase', 'Un enlace con tu horario, sin tus faltas'],
    ['cuenta', 'Cuenta y copia', 'Para no perder tus faltas'],
    ['app', 'App', 'Instalar, tema y actualizar'],
    ['borrar', 'Empezar de cero', 'Borrar tus faltas o todo']
  ];
  function viewAjustes() {
    const S = snapState(), s = S.settings, hasAlias = Object.keys(S.alias || {}).length;
    const sw = (k, label, hint) => '<div class="switch"><div><div style="font-weight:700">' + label + '</div><div class="muted">' + hint + '</div></div><input type="checkbox" data-set="' + k + '"' + (s[k] ? ' checked' : '') + '></div>';
    if (!ajSec || !AJ.some((x) => x[0] === ajSec)) {
      const sub = { faltas: s.limite + '% · ' + (s.ambito === 'curso' ? 'curso entero' : 'por trimestre') + (+s.retrasosPorFalta ? ' · ' + s.retrasosPorFalta + ' retrasos = 1 h' : ''), cuenta: user.acct ? 'Conectado como ' + user.acct.u : null, horario: S.center || null };
      return '<div class="top"><h1>Ajustes</h1></div>' + AJ.map((x, i) => '<div' + rise(i) + '><button class="card sim-entry aj' + (x[0] === 'borrar' ? ' aj-bad' : '') + '" data-aj="' + x[0] + '"><span class="grow"><b>' + x[1] + '</b><span class="muted">' + esc(sub[x[0]] || x[2]) + '</span></span><span class="arrow">›</span></button></div>').join('');
    }
    const title = AJ.find((x) => x[0] === ajSec)[1];
    let h = '<div class="steps"><button class="back" data-aj="">‹ Ajustes</button><h1>' + title + '</h1></div>';
    if (ajSec === 'horario') h += ('<div class="card"><div class="sec">Tu horario</div><p class="muted">Cambia una clase, el calendario o los festivos.</p><div class="btns"><button class="btn small primary" data-act="edit">Cambiar mi horario</button><label class="btn small" for="qshot">Subir otra foto</label><input id="qshot" type="file" accept="image/*" hidden></div><p class="muted mini" style="margin:10px 0 0"><button class="link" data-act="edit-adv">Editor avanzado: unir asignaturas, nombre del centro</button></p></div>') +
      '<div class="card"><div class="sec">Faltas de antes</div><p class="muted">Las que tenías antes de usar NoVoy.</p><div class="btns"><button class="btn small" data-act="prv-open">Cambiar</button></div></div>';
    else if (ajSec === 'faltas') h += rulesCard(S) + ('<div class="card">' + (hasAlias ? sw('unificar', 'Unificar asignaturas', 'Algunas cuentan dentro de otra (ej. proyectos).') : '') + sw('justificadasCuentan', 'Las justificadas cuentan', 'Si lo apagas, no suman al límite.') + '</div>' +
      '<div class="card"><div class="two"><div class="field" style="margin-top:0"><label>Límite de faltas (%)</label><input type="number" data-num="limite" min="1" max="100" value="' + s.limite + '"></div>' +
      '<div class="field" style="margin-top:0"><label>Aviso si quedan (h) o menos</label><input type="number" data-num="aviso" min="0" step="any" value="' + s.aviso + '"></div></div></div>');
    else if (ajSec === 'clase') h += ('<div class="card share"><div class="sec">Pásalo a tu clase</div><p class="muted">Un enlace con tu horario y calendario (sin tus faltas). Tus compañeros lo abren y ya está configurado.</p><div class="btns"><a class="btn small primary" id="sh-wa" target="_blank" rel="noopener">WhatsApp</a><button class="btn small" data-act="share">Compartir / copiar enlace</button></div></div>');
    else if (ajSec === 'cuenta') h += acctCard() + ('<div class="card"><div class="sec">Copia de seguridad</div><p class="muted">Tus datos solo viven en este móvil. El enlace de copia lleva tu horario y tus faltas: guárdalo en tus mensajes y, si cambias de móvil, ábrelo para restaurar todo. No lo compartas con nadie.</p><div class="btns"><button class="btn small primary" data-act="backup-link">Copiar mi enlace de copia</button><button class="btn small" id="exp">Exportar archivo</button><label class="btn small" for="imp">Importar</label><input id="imp" type="file" accept="application/json" hidden></div></div>');
    else if (ajSec === 'app') h += ((standalone() ? '' : '<div class="card"><div class="sec">Instálala en tu móvil</div><p class="muted">Icono en la pantalla de inicio, como una app.</p><div class="btns"><button class="btn small primary" data-act="open-install">Cómo instalarla</button></div></div>')) + ('<div class="card"><div class="btns" style="margin-top:0"><button class="btn small" id="theme">Claro / oscuro</button><button class="btn small" data-act="refresh">Actualizar app</button></div><p class="muted" style="margin-top:10px">«Actualizar app» borra la caché de la app por si algo no se ve actualizado. No toca tus faltas ni tu horario.</p><p class="muted">' + esc(S.center || '') + '</p></div>');
    else if (ajSec === 'borrar') h += ('<div class="card danger"><div class="sec">Empezar de cero</div>' + (wipe ? '<p><b>' + (wipe === 'todo' ? 'Se borrará todo: horario, calendario, ajustes y faltas.' : 'Se borrarán todas tus faltas. El horario se queda.') + '</b> Podrás deshacerlo unos segundos. Si lo dejas pasar, no hay vuelta atrás: haz antes tu copia.</p><div class="btns"><button class="btn small" data-act="wipe-no">Cancelar</button><button class="btn small bad" data-act="wipe-yes">Sí, borrar</button></div>' : '<p class="muted">Para empezar el curso limpio o si te has liado.</p><div class="btns"><button class="btn small" data-act="wipe-faltas">Borrar solo las faltas</button><button class="btn small" data-act="wipe-todo">Borrar todo</button></div>') + '</div>');
    return h;
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
    if (ed.hasConfig && ed.orig !== structKey(c)) h += '<p class="muted" style="margin:14px 2px 0">Al guardar, las horas totales que pusiste a mano se mantienen; las demás se calculan con este horario y los festivos.</p>';
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="ed-close">Cancelar</button><button class="btn primary"' + (r.ok ? '' : ' disabled') + ' data-act="ed-save">Guardar</button></div></div>';
  }
  /** ¿Hace falta preguntar desde cuándo vale el horario nuevo? Solo si ya hay faltas y la semana cambia. */
  const needsFrom = (cfg) => !!(user.config && (user.faltas || []).some((f) => f.date) && JSON.stringify(user.config.schedule || {}) !== JSON.stringify(cfg.schedule || {}));
  let pend = null; // guardado pendiente de la pregunta "¿desde cuándo?"
  function askFrom(cfg, finish) { pend = { cfg, finish, back: tab }; tab = 'desde'; render(); scrollTo(0, 0); }
  function viewDesde() {
    const last = (user.faltas || []).filter((f) => f.date).map((f) => f.date).sort().pop();
    return '<div class="steps"><button class="back" data-act="desde-back">‹ Atrás</button><h1>¿Desde cuándo vale este horario?</h1></div>' +
      '<p class="muted">Así tus faltas de antes siguen contando con el horario que tenías entonces.</p>' +
      '<div class="card"><div class="sec">Ha cambiado el horario</div><p class="muted">Por ejemplo, se ha ido un profesor y han recolocado las clases.</p><div class="field"><label>El nuevo horario empieza el</label><input type="date" id="desde-d" value="' + today() + '"></div><button class="btn primary block" style="margin-top:12px" data-act="desde-ok">Guardar desde ese día</button></div>' +
      '<div class="card"><div class="sec">Me había equivocado</div><p class="muted">El horario siempre fue este; lo estoy corrigiendo. Se recalcula todo el curso' + (last ? ', también las faltas hasta el ' + nice(last) : '') + '.</p><button class="btn block" style="margin-top:10px" data-act="desde-all">Corregir desde el principio</button></div>';
  }
  function edSave() {
    if (needsFrom(ed.cfg) && !ed.from) return askFrom(ed.cfg, (from) => { ed.from = from || 'all'; edSave(); });
    const prev = JSON.stringify(user);
    const cfg = C.pruneTotals(C.withHistory(user.config, ed.cfg, ed.from && ed.from !== 'all' ? ed.from : null)); // las horas que pusiste a mano se quedan
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
    let h = '<div class="steps"><button class="back" data-act="' + (user.config ? 'acct-later' : 'skip-reg') + '">‹ Atrás</button></div>';
    if (login) {
      h += '<h1 class="big">Entrar</h1><p class="lead">Recupera tu horario y tus faltas en este móvil.</p>' +
        '<div class="card">' + accForm('login', false) + '</div>' +
        '<div class="card"><div class="sec">¿Sin cuenta pero con copia?</div><p class="muted">Si guardaste tu enlace de copia o un archivo, también sirve.</p><textarea id="rl" rows="2" style="min-height:64px" placeholder="Pega aquí tu enlace de copia" aria-label="Enlace de copia"></textarea><div class="btns" style="margin-top:10px"><button class="btn small" data-act="restore-link">Restaurar enlace</button><label class="btn small" for="imp">Importar archivo</label><input id="imp" type="file" accept="application/json" hidden></div></div>';
      return h + '<div class="cta"><div class="in"><button class="btn primary" type="submit" form="acf">Entrar</button></div></div>';
    }
    h += '<h1 class="big">Guarda tu horario</h1><p class="lead">Crea una cuenta para no perder tus faltas si cambias de móvil. Sin correo.</p>' +
      '<div class="card">' + accForm('new', false) + '</div>' +
      '<div class="card warn"><div class="sec">Apunta la contraseña</div><p>Sin correo <b>no se puede recuperar</b>. Deja que el móvil la guarde cuando te lo pregunte.</p></div>' +
      '<p class="muted mini center" style="margin-top:16px"><button class="link" data-act="go-login">Ya tengo cuenta: entrar</button></p>';
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="' + (user.config ? 'acct-later' : 'skip-reg') + '">Ahora no</button><button class="btn primary" type="submit" form="acf">Crear cuenta</button></div></div>';
  }
  function viewSetup() {
    const imp = sx.mode === 'import', upd = sx.mode === 'update' || imp, total = 4, st = sx.step;
    if (!sx.scr) sx.scr = 'method';
    if (!upd && !sx.ai && (sx.scr === 'reg' || sx.scr === 'login')) return viewAcctStep();
    let cta = '';
    if (st === 1 && !upd && !sx.ai) {
      // elegir cómo meter el horario: foto primero, pintar después. Nada más.
      let h0 = '<div class="steps">' + (user.config || user.skipCfg ? '<button class="back" data-act="close">‹ Atrás</button>' : '') + '</div>' +
        '<h1 class="big">Tu horario</h1><p class="lead">Haz una foto o una captura de tu horario. Yo lo relleno.</p>' +
        '<input id="qshot" type="file" accept="image/*" hidden>' +
        '<label class="choice main" for="qshot"><span class="ic" aria-hidden="true">📷</span><span class="grow"><b>Subir foto del horario</b><span>La foto no sale de tu móvil</span></span><span class="arrow">›</span></label>' +
        '<button class="choice" data-act="q-start"><span class="ic" aria-hidden="true">✏️</span><span class="grow"><b>Pintarlo yo</b><span>Tocas las horas de tu semana</span></span><span class="arrow">›</span></button>' +
        (!user.config && !user.acct && hasAcct() ? '<p class="muted mini center" style="margin-top:22px"><button class="link" data-act="go-login">Ya tengo cuenta: entrar</button></p>' : '') +
        (user.config ? '' : '<p class="muted mini center" style="margin-top:10px"><button class="link" data-act="skip-cfg">Ahora no, solo quiero mirar</button></p>');
      return h0;
    }
    let h = '<div class="steps">' + (user.config || user.skipCfg ? '<button class="back" data-act="close">‹ Atrás</button>' : '<button class="back" data-act="ai-back">‹ Atrás</button>') + '<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + st + '"><i style="width:' + st / total * 100 + '%"></i></div></div>';
    if (st === 1) {
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
    user = { config: r.config, settings: Object.assign({}, user.settings, r.reglas || {}, { unificar, limite: r.limite != null ? r.limite : (user.settings.limite || 25) }), faltas: keepFaltas , acct: user.acct, skipCfg: user.skipCfg };
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
  /** Caja para desactivar una asignatura que aún no se da: se queda en su sitio y otra la cubre. */
  function qOffBox(name) {
    if (!qYes('late')) return '';
    const others = qk.subjects.filter((x) => x !== name && !qCover(x)), cur = qCover(name);
    if (cur) return '<div class="offbox"><b>Desactivada</b><p class="muted">Aún no se da. En sus horas cuenta <b>' + esc(cur) + '</b>. La activas desde la pantalla Hoy cuando empiece.</p><button type="button" class="btn small" data-q-on="' + esc(name) + '">Quitar desactivación</button></div>';
    if (!others.length) return '';
    return '<details class="offbox"><summary>¿Aún no se da esta asignatura?</summary><p class="muted">Se queda en su sitio, pero hasta que la actives sus horas cuentan para otra (la que se da de verdad esas semanas).</p><div class="field"><label>Mientras tanto se da</label><select id="q-cover">' + others.map((x) => '<option>' + esc(x) + '</option>').join('') + '</select></div><button type="button" class="btn small primary" style="margin-top:10px" data-q-off="' + esc(name) + '">Desactivar</button></details>';
  }
  const QP = '__P__';
  /** Preguntas de sí/no: lo que se conteste que no, no aparece (se puede cambiar luego desde Ajustes). */
  const ASK = [['proj', '¿Tienes semanas de proyecto?', 'Semanas en que se deja la clase normal y se hace proyecto.'], ['late', '¿Alguna asignatura empieza a mitad de curso?', 'Sale en el horario pero aún no se da (otra ocupa su hora).'], ['nocount', '¿Alguna clase no cuenta faltas?', 'Por ejemplo, la tutoría.']];
  const qYes = (k) => !!(qk.ask && qk.ask[k] === true);
  function qAsk() {
    const a = qk.ask || {}, done = ASK.every((x) => a[x[0]] != null);
    if (done && !qk.askOpen) return '<p class="muted mini" style="margin:4px 2px 2px">' + ASK.filter((x) => a[x[0]]).map((x) => ({ proj: 'Con semanas de proyecto', late: 'Con asignaturas que empiezan tarde', nocount: 'Con clases que no cuentan' })[x[0]]).join(' · ') + (ASK.some((x) => a[x[0]]) ? ' · ' : '') + '<button class="link" data-act="q-ask-open">Cambiar respuestas</button></p>';
    return '<div class="card ask">' + ASK.map((x) => '<div class="askrow"><div class="grow"><b>' + x[1] + '</b><span class="muted mini">' + x[2] + '</span></div><div class="seg"><button class="' + (a[x[0]] === true ? 'on' : '') + '" data-ask="' + x[0] + '|1">Sí</button><button class="' + (a[x[0]] === false ? 'on' : '') + '" data-ask="' + x[0] + '|0">No</button></div></div>').join('') + (done ? '<button class="btn small" style="margin-top:8px" data-act="q-ask-open">Listo</button>' : '') + '</div>';
  }
  const qProjHours = () => { const rows = qRows(); let h = 0; Object.keys(qk.proj || {}).forEach((d) => Object.keys(qk.proj[d]).forEach((r) => { const row = rows[+r]; if (row) h += qk.unit === 'full' ? 1 : Math.round((mm(row.e) - mm(row.s)) / 60 * 100) / 100; })); return Math.round(h * 100) / 100; };
  function qNoCountBox(name) {
    if (!qYes('nocount')) return '';
    const on = (qk.nocount || []).indexOf(name) >= 0;
    return '<div class="offbox switch"><div><b>No cuenta faltas</b><div class="muted mini">Sale en el horario, pero no tiene porcentaje.</div></div><input type="checkbox" data-q-nc="' + esc(name) + '"' + (on ? ' checked' : '') + '></div>';
  }
  const qTxt = (n) => (String(n).length <= 6 ? String(n).toUpperCase() : initials(n));
  const qCol = (name) => AVC[Math.max(0, qk.subjects.indexOf(qCover(name) || name)) % AVC.length];
  /** Si la asignatura está desactivada en la rejilla, la que la cubre. */
  const qCover = (name) => { const x = (qk.disabled || {})[name]; return x && x.cover && !x.on ? x.cover : null; };
  const qCell = (s) => (qCover(s) ? esc(qTxt(qCover(s))) + '<small class="dis">' + esc(qTxt(s)) + '</small>' : esc(qTxt(s)));
  const qTid = (t, i) => t.id || (String(t.label).toLowerCase().replace(/[^a-z0-9]+/g, '') || 't') + i;
  /** Horario guardado -> estado de la rejilla, para poder editarlo pintando. */
  /** Franjas de proyecto guardadas -> casillas de la rejilla. */
  function qProjGrid(cfg, rows) {
    const out = {}, sch = (cfg.project && cfg.project.schedule) || {};
    Object.keys(sch).forEach((d) => (sch[d] || []).forEach((b) => C.hourSlots(b).forEach((x) => rows.forEach((r, i) => { if (mm(x.start) <= mm(r.s) && mm(x.end) >= mm(r.e)) (out[d] = out[d] || {})[i] = true; }))));
    return out;
  }
  function qFromCfg(cfg, pi) {
    const sch = pi == null ? (cfg.schedule || {}) : ((cfg.periods || [])[pi] || {}).schedule || {};
    const bounds = new Set(), slotsOf = (b) => C.hourSlots(b);
    QDAYS.forEach(([d]) => (sch[d] || []).forEach((b) => slotsOf(b).forEach((x) => { bounds.add(mm(x.start)); bounds.add(mm(x.end)); })));
    const bs = Array.from(bounds).sort((a, b) => a - b), rows = [];
    for (let i = 0; i + 1 < bs.length; i++) {
      const a = bs[i], z = bs[i + 1];
      const used = QDAYS.some(([d]) => (sch[d] || []).some((b) => slotsOf(b).some((x) => mm(x.start) <= a && mm(x.end) >= z)));
      if (used) rows.push({ s: hhmm(a), e: hhmm(z) });
    }
    const grid = {}, subjects = []; let exact = true;
    QDAYS.forEach(([d]) => (sch[d] || []).forEach((b) => {
      if (subjects.indexOf(b.subject) < 0) subjects.push(b.subject);
      let n = 0;
      slotsOf(b).forEach((x) => rows.forEach((r, i) => {
        if (mm(x.start) <= mm(r.s) && mm(x.end) >= mm(r.e)) { (grid[d] = grid[d] || {})[i] = b.subject; n++; }
      }));
      if (Math.abs(n - (+b.hours || 0)) > 0.01) exact = false;
    }));
    return Object.assign(qNew(), {
      custom: rows.length ? rows : null, grid, subjects, adding: false, unit: exact ? 'full' : 'real',
      terms: cfg.terms.map((t) => ({ id: t.id, label: t.label, from: t.from, to: t.to })),
      tmode: Object.keys(cfg.totals || {}).length ? 'manual' : 'auto', totals: JSON.parse(JSON.stringify(cfg.totals || {})), disabled: JSON.parse(JSON.stringify(cfg.disabled || {})), proj: qProjGrid(cfg, rows), nocount: (cfg.nocount || []).slice(), ask: Object.assign({ proj: !!cfg.project, late: Object.keys(cfg.disabled || {}).length > 0, nocount: (cfg.nocount || []).length > 0 }, cfg.ask || {}), ambito: (user.settings || {}).ambito || 'trimestre', retrasos: +(user.settings || {}).retrasosPorFalta || 0, projName: (cfg.project && cfg.project.name) || 'Proyecto', projWeeks: cfg.project && cfg.project.weeks != null ? cfg.project.weeks : 4,
      holidays: (cfg.holidays || []).map((h) => ({ label: h.label, from: h.from, to: h.to })),
      limite: (user.settings && user.settings.limite) || 25, base: cfg, pi: pi == null ? null : pi
    });
  }
  function qCfg() {
    const rows = qRows(), schedule = {};
    QDAYS.forEach(([d]) => {
      const g = qk.grid[d] || {}, blocks = []; let cur = null;
      rows.forEach((row, r) => {
        const s = g[r], unit = qk.unit === 'full' ? 1 : Math.round((mm(row.e) - mm(row.s)) / 60 * 100) / 100;
        if (s && cur && cur.subject === s && cur.end === row.s) { cur.end = row.e; cur.hours = Math.round((cur.hours + unit) * 100) / 100; }
        else { cur = s ? { start: row.s, end: row.e, subject: s, hours: unit } : null; if (cur) blocks.push(cur); }
      });
      if (blocks.length) schedule[d] = blocks;
    });
    const terms = qk.terms.map((t, i) => ({ id: qTid(t, i), label: t.label, from: t.from, to: t.to })).sort((a, b) => (a.from < b.from ? -1 : 1));
    const base = qk.base || {}, periods = JSON.parse(JSON.stringify(base.periods || []));
    const ren = qk.ren || {}, rn = (x) => (ren[x] != null ? ren[x] : x);
    const alias = {}; Object.keys(base.alias || {}).forEach((k) => { const a = rn(k), b = rn(base.alias[k]); if (a !== b) alias[a] = b; });
    periods.forEach((p) => Object.keys(p.schedule || {}).forEach((d) => p.schedule[d].forEach((b) => { b.subject = rn(b.subject); })));
    let main = base.schedule || {};
    if (qk.pi == null) main = schedule; else if (periods[qk.pi]) periods[qk.pi].schedule = schedule;
    const history = JSON.parse(JSON.stringify(base.history || []));
    history.forEach((x) => Object.keys(x.schedule || {}).forEach((d) => x.schedule[d].forEach((b) => { b.subject = rn(b.subject); })));
    const rnT = (fx) => { const o = {}; Object.keys(fx || {}).forEach((tid) => { o[tid] = {}; Object.keys(fx[tid]).forEach((k) => { o[tid][rn(k)] = fx[tid][k]; }); }); return o; };
    const subjects = (base.subjects || []).map((m) => ({ id: m.id, name: rn(m.name) }));
    // proyecto: bloques seguidos de casillas marcadas, mismo criterio de horas que la rejilla
    const pname = String(qk.projName || 'Proyecto').trim() || 'Proyecto', psch = {};
    QDAYS.forEach(([d]) => { const g = (qk.proj || {})[d] || {}, bl = []; let cur = null;
      rows.forEach((row, r) => { const unit = qk.unit === 'full' ? 1 : Math.round((mm(row.e) - mm(row.s)) / 60 * 100) / 100;
        if (g[r] && cur && cur.end === row.s) { cur.end = row.e; cur.hours = Math.round((cur.hours + unit) * 100) / 100; } else { cur = g[r] ? { start: row.s, end: row.e, subject: pname, hours: unit } : null; if (cur) bl.push(cur); } });
      if (bl.length) psch[d] = bl; });
    const A = qk.ask || {};
    const project = A.proj && Object.keys(psch).length ? { name: pname, weeks: +qk.projWeeks >= 0 ? +qk.projWeeks : 4, schedule: psch, ranges: (base.project && base.project.ranges) || [] } : null;
    return { center: base.center || '', terms, holidays: qk.holidays.map((h) => ({ from: h.from, to: h.to || h.from, label: h.label || 'Festivo' })), schedule: main, periods, history, alias, subjects, disabled: A.late ? Object.assign({}, qk.disabled || base.disabled || {}) : {}, project, nocount: A.nocount ? (qk.nocount || []).filter((x) => qUsed().indexOf(x) >= 0) : [], ask: { proj: A.proj, late: A.late, nocount: A.nocount }, tutChecked: !!base.tutChecked, totals: rnT(base.totals), totalsUnified: rnT(base.totalsUnified) };
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
      if (window.FTAcct) FTAcct.stat('ocr-fallo');
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
      h += '<div class="pals">' + qk.subjects.map((s, i) => '<button class="pal' + (qpaint === s ? ' on' : '') + (qCover(s) ? ' pal-off' : '') + '" data-pal="' + i + '" style="--c:' + AVC[i % AVC.length] + '">' + esc(s) + (qCover(s) ? ' <span class="mini">desactivada</span>' : '') + ((qk.nocount || []).indexOf(s) >= 0 && qYes('nocount') ? ' <span class="mini">no cuenta</span>' : '') + '</button>').join('') + (qYes('proj') ? '<button class="pal pj' + (qpaint === QP ? ' on' : '') + '" data-act="q-proj">' + esc(qk.projName || 'Proyecto') + ' <span class="mini">franjas</span></button>' : '') + '<button class="pal er' + (qpaint === '' ? ' on' : '') + '" data-pal="-1">Borrar</button><button class="pal add" data-act="q-add">+ Asignatura</button></div>';
      if (qpaint === QP) h += '<div class="card" style="margin-top:4px"><div class="sec">Semanas de proyecto</div><p class="muted">Marca en la rejilla las horas que se convierten en proyecto cuando hay semana de proyecto. Tus asignaturas se quedan debajo. Luego lo activas desde Hoy con un toque.</p><div class="two"><div class="field"><label>Nombre</label><input data-qf="projName" value="' + esc(qk.projName || 'Proyecto') + '" autocomplete="off"></div><div class="field"><label>Semanas en el curso</label><input type="number" min="0" max="40" step="1" inputmode="numeric" data-qf="projWeeks" value="' + (qk.projWeeks != null ? qk.projWeeks : 4) + '"></div></div><p class="muted mini">Con las semanas se calculan sus horas totales (' + fmt(qProjHours() * (qk.projWeeks != null ? qk.projWeeks : 4)) + ' h). Si sabes las oficiales, ponlas en «Horas totales».</p>' + (qProjHours() ? '<button type="button" class="btn small danger" style="margin-top:8px" data-act="q-proj-clear">Quitar las franjas de proyecto</button>' : '') + '</div>';
      if (qk.editing >= 0 && qk.subjects[qk.editing] != null) h += '<form id="q-ren" class="card" style="margin-top:4px"><div class="field" style="margin-top:0"><label>Cambiar nombre</label><input name="n" value="' + esc(qk.subjects[qk.editing]) + '" autocomplete="off" required></div><div class="btns" style="margin-top:10px"><button class="btn small primary">Guardar</button><button type="button" class="btn small danger" data-q-del="' + qk.editing + '">Quitar asignatura</button></div>' + qNoCountBox(qk.subjects[qk.editing]) + qOffBox(qk.subjects[qk.editing]) + '</form>';
      if (qk.adding || !qk.subjects.length) h += '<form id="q-sub" class="card" style="margin-top:4px"><div class="field" style="margin-top:0"><label>' + (qk.subjects.length ? 'Nueva asignatura' : 'Empieza por tus asignaturas') + '</label><input name="s" placeholder="Ej. Programación" autocomplete="off" enterkeyhint="next" aria-label="Asignaturas"></div><p class="muted" style="margin-top:6px">Escribe una y pulsa Enter para crear la siguiente.</p><div class="btns" style="margin-top:10px"><button class="btn small primary">Añadir</button>' + (qk.subjects.length ? '<button type="button" class="btn small" data-act="q-add-done">Listo</button>' : '') + '</div></form>';
      if (qk.subjects.length) {
        h += '<p class="muted" style="margin:6px 2px 0">' + (qpaint === null ? 'Toca una asignatura de arriba.' : qpaint === QP ? 'Toca o desliza para marcar las horas de proyecto. Otra vez para quitarlas.' : 'Toca o desliza para pintar. Si tocas una casilla ya pintada, se borra.') + '</p><div class="qgrid" id="qgrid"><span></span>' + QDAYS.map(([, l]) => '<b class="gh">' + l + '</b>').join('') +
          rows.map((row, r) => '<span class="rl">' + row.s + '<small>' + row.e + '</small></span>' + QDAYS.map(([d]) => { const s = (qk.grid[d] || {})[r]; return '<button class="gc' + (s ? ' on' : '') + (s && qCover(s) ? ' off' : '') + (((qk.proj || {})[d] || {})[r] ? ' pj' : '') + '" data-d="' + d + '" data-r="' + r + '" style="--c:' + (s ? qCol(s) : 'transparent') + '" aria-label="' + QN[d] + ', ' + row.s + (s ? ': ' + esc(s) : ': vacía') + '">' + (s ? qCell(s) : '') + '</button>'; }).join('')).join('') + '</div>' +
          '<details class="more"><summary>Copiar un día a otro</summary><div class="two"><div class="field"><label>De</label><select id="qcf">' + QDAYS.map(([d]) => '<option value="' + d + '">' + QN[d] + '</option>').join('') + '</select></div><div class="field"><label>A</label><select id="qct">' + QDAYS.map(([d]) => '<option value="' + d + '"' + (d === 3 ? ' selected' : '') + '>' + QN[d] + '</option>').join('') + '</select></div></div><div class="btns"><button class="btn small" data-act="q-copy">Copiar</button><button class="btn small danger" data-act="q-clear">Vaciar todo</button></div></details>';
        h += qk.custom ? qCustomHours(rows) : '<details class="more"><summary>Cambiar las horas</summary><div class="two"><div class="field"><label>1ª clase empieza</label><input type="time" data-qf="start" value="' + qk.start + '"></div><div class="field"><label>Cada hora dura</label>' + sel('dur', [[45, '45 min'], [50, '50 min'], [55, '55 min'], [60, '60 min']], qk.dur) + '</div></div><div class="two"><div class="field"><label>Horas al día</label>' + sel('rows', [4, 5, 6, 7, 8, 9, 10].map((n) => [n, n]), qk.rows) + '</div><div class="field"><label>Recreo tras la hora</label>' + sel('brk', [[0, 'Sin recreo']].concat([1, 2, 3, 4, 5, 6].map((n) => [n, n])), qk.brk) + '</div></div>' + (qk.brk ? '<div class="field"><label>Duración del recreo</label>' + sel('brkMin', [[10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min']], qk.brkMin) + '</div>' : '') + '</details>';
      }
      const moreOn = qk.moreOpen || ((qk.base && qk.base.periods) || []).length || Object.values(qk.ask || {}).some((x) => x === true);
      h += '<details class="more"' + (moreOn ? ' open' : '') + '><summary>Casos especiales: tutoría, proyectos, cambios de horario</summary>' + qAsk() + qTramos() + '</details>';
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
        '<div class="card"><div class="sec">Reglas de tu centro</div><p class="muted mini">Si no lo sabes, déjalo así: es lo más estricto. Lo puedes cambiar en Ajustes.</p><div class="field"><label>Límite de faltas</label>' + sel('limite', [10, 15, 20, 25, 30].map((n) => [n, n + '%']), qk.limite) + '</div>' +
          (cfg.terms.length > 1 ? '<div class="field"><label>El límite se aplica</label>' + sel('ambito', [['trimestre', 'En cada trimestre (o no lo sé)'], ['curso', 'Sobre el curso entero']], qk.ambito || 'trimestre') + '</div>' : '') +
          '<div class="field"><label>¿Los retrasos suman faltas?</label>' + sel('retrasos', [[0, 'No'], [2, 'Sí, 2 retrasos = 1 h'], [3, 'Sí, 3 retrasos = 1 h'], [4, 'Sí, 4 retrasos = 1 h'], [5, 'Sí, 5 retrasos = 1 h']], qk.retrasos || 0) + '</div></div>' +
        '<details class="more"><summary>Ajustes avanzados</summary><div class="field"><label>Horas totales de cada asignatura</label></div><div class="btns" style="margin-top:0"><button class="btn small' + (qk.tmode === 'auto' ? ' primary' : '') + '" data-act="q-tmode" data-m="auto">Calcular con mi horario</button><button class="btn small' + (qk.tmode === 'manual' ? ' primary' : '') + '" data-act="q-tmode" data-m="manual">Las sé yo</button></div>' +
        (qk.tmode === 'manual' ? cfg.terms.map((t) => { const auto = qTotalsFor(cfg, t.id); return '<div class="sec" style="margin-top:14px">' + esc(t.label) + '</div>' + qUsed().map((s) => { const v = (qk.totals[t.id] || {})[s]; return '<div class="item"><span class="grow">' + esc(s) + '</span><input class="num" type="number" min="0" step="any" inputmode="decimal" data-qtot="' + esc(t.id) + '|' + esc(s) + '" value="' + (v != null ? v : (auto[s] || 0)) + '" aria-label="Horas de ' + esc(s) + ' en ' + esc(t.label) + '"></div>'; }).join(''); }).join('') : '<p class="muted" style="margin-top:10px">Se calculan solas contando tus clases y los festivos.</p>') + '</details>';
      if (!chk.ok) h += '<div class="card err"><ul class="list">' + chk.errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>';
    }
    return h + '<div class="cta"><div class="in"><button class="btn" data-act="q-back">' + (st <= 1 ? 'Cancelar' : 'Atrás') + '</button>' + (st === 0 ? '' : '<button class="btn primary"' + (ok ? '' : ' disabled') + ' data-act="q-next">' + (st === 3 ? 'Guardar' : 'Siguiente') + '</button>') + '</div></div>';
  }
  function qSave(from) {
    if (from === undefined && needsFrom(qCfg())) return askFrom(qCfg(), (f) => qSave(f || null));
    const fresh = !user.config, cfg = C.withHistory(user.config, qCfg(), from || null), prev = JSON.stringify(user);
    // "Las sé yo": solo se guardan las horas escritas (las demás siguen calculándose). "Calcular": se quitan todas.
    if (qk.tmode === 'manual') { cfg.terms.forEach((t) => { const o = Object.assign({}, (cfg.totals || {})[t.id]); qUsed().forEach((s) => { const v = (qk.totals[t.id] || {})[s]; if (v != null && !isNaN(v) && v > 0) o[s] = +v; }); if (Object.keys(o).length) { cfg.totals[t.id] = o; cfg.totalsUnified[t.id] = Object.assign({}, (cfg.totalsUnified || {})[t.id], o); } }); }
    else { cfg.totals = {}; cfg.totalsUnified = {}; }
    Object.assign(cfg, C.pruneTotals(cfg));
    if (window.FTAcct) FTAcct.stat(qk.fromShot ? (qk.edited ? 'ocr-editado' : 'ocr-ok') : 'manual');
    const ren = qk.ren || {};
    const faltas = (user.faltas || []).map((f) => (ren[f.subject] != null ? Object.assign({}, f, { subject: ren[f.subject] }) : f));
    user = { config: cfg, settings: Object.assign({ aviso: 2, justificadasCuentan: true }, user.settings, { ambito: qk.ambito || 'trimestre', retrasosPorFalta: +qk.retrasos || 0, limite: qk.limite, unificar: Object.keys(cfg.alias || {}).length > 0 && user.settings ? user.settings.unificar : false }), faltas: faltas, acct: user.acct, skipCfg: user.skipCfg };
    save(); qk = null; tab = 'hoy'; viewTerm = null;
    if (fresh && !user.faltas.length) { prvOpen('hoy'); return; } // siguiente paso del alta: las faltas que ya llevas
    render(); scrollTo(0, 0);
    toast('Horario guardado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
  }
  /** Chips de tramo: el horario principal y los periodos con horario distinto. */
  /** Franjas leídas de una captura o de un horario guardado: se editan una a una. */
  function qCustomHours(rows) {
    return '<details class="more" id="q-hours"' + (qk.hopen ? ' open' : '') + '><summary>Cambiar las horas</summary>' +
      '<p class="muted mini" style="margin:0 0 8px">Estas horas salen de tu horario. Corrige la que esté mal.</p>' +
      '<div class="hrows">' + rows.map((r, i) =>
        '<div class="hrow"><span>' + (i + 1) + 'ª</span>' +
        '<input type="time" data-qr="' + i + '" data-qe="s" value="' + r.s + '" aria-label="Empieza la hora ' + (i + 1) + '">' +
        '<input type="time" data-qr="' + i + '" data-qe="e" value="' + r.e + '" aria-label="Termina la hora ' + (i + 1) + '">' +
        '<button class="x" data-q-delrow="' + i + '" aria-label="Quitar la hora ' + (i + 1) + '">×</button></div>').join('') + '</div>' +
      '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="q-addrow">+ Añadir hora</button>' +
      '<button class="btn small" data-act="q-autorows">Volver a calcularlas</button></div></details>';
  }
  function qTramos() {
    const ps = (qk.base && qk.base.periods) || [];
    if (!ps.length && !qk.addp) return qk.base ? '<p class="muted mini" style="margin:0 2px 10px"><button class="link" data-act="q-addp">El horario cambia durante el curso</button></p>' : '';
    const chip = (i, lab, sub) => '<button class="pal tr' + (qk.pi === i ? ' on' : '') + '" data-q-tramo="' + (i == null ? 'main' : i) + '">' + esc(lab) + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</button>';
    let h = '<div class="pals tramos">' + chip(null, 'Principal', 'el resto del curso') +
      ps.map((p, i) => chip(i, p.label || 'Tramo ' + (i + 1), nice(p.from) + ' → ' + nice(p.to))).join('') +
      '<button class="pal add" data-act="q-addp">+ Tramo</button></div>';
    if (qk.pi != null && ps[qk.pi]) h += '<p class="muted mini" style="margin:0 2px 10px">Pintando el tramo <b>' + esc(ps[qk.pi].label) + '</b>. <button class="link" data-q-delp="' + qk.pi + '">Quitar este tramo</button></p>';
    if (qk.addp) h += '<form id="q-per" class="card" style="margin-bottom:12px"><div class="sec">Nuevo tramo</div><p class="muted">Un periodo con un horario distinto, por ejemplo cuando se concentra un módulo.</p><div class="field"><label>Nombre</label><input name="label" placeholder="A partir de febrero" required></div><div class="two"><div class="field"><label>Desde</label><input type="date" name="from" required></div><div class="field"><label>Hasta</label><input type="date" name="to" required></div></div><div class="btns"><button type="button" class="btn small" data-act="q-addp">Cancelar</button><button class="btn small primary">Crear tramo</button></div></form>';
    return h;
  }
  /** Guarda lo pintado en el horario que toca y abre otro tramo. */
  function qGo(pi) { const ren = qk.ren, cfg = qCfg(); qk = Object.assign(qFromCfg(cfg, pi), { adding: false, ren: ren }); qpaint = null; render(); scrollTo(0, 0); }
  function qPaintCell(cell) {
    if (qk.fromShot) qk.edited = true;
    if (!cell || !cell.classList.contains('gc') || qmode === null) return;
    const d = +cell.dataset.d, r = +cell.dataset.r; qk.grid[d] = qk.grid[d] || {};
    if (qmode === QP || qmode === 'P-') { qk.proj = qk.proj || {}; qk.proj[d] = qk.proj[d] || {}; if (qmode === QP) qk.proj[d][r] = true; else delete qk.proj[d][r]; cell.classList.toggle('pj', qmode === QP); return; }
    if (qmode === '') delete qk.grid[d][r]; else qk.grid[d][r] = qmode;
    cell.classList.toggle('on', qmode !== ''); cell.style.setProperty('--c', qmode === '' ? 'transparent' : qCol(qmode)); cell.innerHTML = qmode === '' ? '' : qCell(qmode); cell.classList.toggle('off', !!(qmode && qCover(qmode)));
  }
  app.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.gc'); if (!c || !qk) return;
    if (qpaint === null) { toast('Elige antes una asignatura'); return; }
    const cur = (qk.grid[+c.dataset.d] || {})[+c.dataset.r]; qmode = qpaint === QP ? (((qk.proj || {})[+c.dataset.d] || {})[+c.dataset.r] ? 'P-' : QP) : qpaint !== '' && cur === qpaint ? '' : qpaint; qdrag = true; qPaintCell(c);
  });
  app.addEventListener('pointermove', (e) => { if (!qdrag) return; qPaintCell(document.elementFromPoint(e.clientX, e.clientY)); });
  // el desplegable de las horas no se cierra al corregir una franja
  document.addEventListener('toggle', (e) => { if (e.target && e.target.id === 'q-hours' && qk) qk.hopen = e.target.open; }, true);
  const qEnd = () => { if (qdrag) { qdrag = false; qmode = null; if (qk && qk.step === 1) { const y = scrollY; render(); scrollTo(0, y); } } };
  addEventListener('pointerup', qEnd); addEventListener('pointercancel', qEnd);

  // ---------- simulador ----------
  function viewSim() {
    const S = calc(), day = simDay || (C.verdict(S, today()).free ? (C.nextClassDay(S, today()) || today()) : today()), v = C.verdict(S, day), lim = S.settings.limite;
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
    const sl = simSel.map((i) => v.slots[i]).filter((x) => x && !x.unknown);
    return h + '<button class="btn primary block" style="margin-top:14px" data-miss="' + missAttr(day, sl) + '">Anotar estas faltas</button>';
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
  /** iPhone + Safari sin instalar + faltas sin cuenta ni copia reciente: riesgo real de perderlas. */
  const iosRisk = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone() && /^https?:/.test(location.protocol) && !user.acct && (user.faltas || []).length > 0 && Date.now() - (+lsGet('ft.iosx') || 0) > 7 * 864e5;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
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
    const a = $('#sh-wa'); if (!user.config) return;
    const exp = JSON.parse(SU.toExport(Object.assign({}, state(), { faltas: [] }))); delete exp.dudas;
    const url = location.href.split('#')[0].split('?')[0] + '#c=' + await pack(JSON.stringify(exp));
    shareMsg = '¿Cuántas clases puedes saltarte sin pasarte del límite? Ya he cargado nuestro horario en NoVoy, el semáforo de faltas. Ábrelo y listo, sin configurar nada:\n' + url;
    if (a) a.href = 'https://wa.me/?text=' + encodeURIComponent(shareMsg);
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
  const VIEWS = { previas: viewPrevias, intro: viewIntro, desde: viewDesde, hoy: viewHoy, resumen: viewResumen, faltas: viewFaltas, ajustes: viewAjustes, join: viewJoin, sim: viewSim, install: viewInstall, setup: viewSetup, editor: viewEditor, quick: viewQuick, admin: viewAdmin };
  function warnBar() {
    const el = document.getElementById('warnbar'); if (!el) return;
    const show = !user.config && tab !== 'setup' && tab !== 'quick' && tab !== 'editor' && tab !== 'join';
    el.hidden = !show; document.body.classList.toggle('warn', show);
    if (show) el.innerHTML = '<div class="in"><span><b>Falta tu horario</b><span class="muted"> · sin él la app no calcula nada</span></span><button class="btn small primary" data-act="go-setup">Configurar</button></div>';
  }
  // ---------- intro: qué es NoVoy en ~10 s, casi sin texto (solo la primera vez) ----------
  let iScene = 0, iTimer = null;
  const ISCENES = [
    { cap: 'Pásate del 25 %… y adiós evaluación continua', art: () => '<div class="i-art i-s1">' + mascot('rojo') + '<div class="i-bar"><i></i><s></s><span>25 %</span></div><div class="i-days">' + [1, 2, 3, 4, 5, 6].map((n) => '<b style="--d:' + n + '">✕</b>').join('') + '</div></div>' },
    { cap: 'Pinta tu horario una vez', art: () => '<div class="i-art i-grid">' + Array.from({ length: 20 }, (_, n) => '<b style="--d:' + ((n * 7) % 20) + ';--c:' + AVC[(n * 3 + Math.floor(n / 5)) % 6] + '"></b>').join('') + '<i class="i-finger"></i></div>' },
    { cap: 'Cada mañana te dice si puedes faltar', art: () => '<div class="i-art i-s3"><div class="i-phone">' + mascot('verde') + '<b>Puedes faltar</b><span class="tag verde">te quedan 4 h</span></div></div>' },
    { cap: '¿Faltaste? Un toque y apuntado', art: () => '<div class="i-art i-grid i-tap">' + Array.from({ length: 15 }, (_, n) => '<b class="' + (n === 7 ? 'hit' : '') + '" style="--d:0;--c:' + AVC[(n * 3) % 6] + '"></b>').join('') + '<i class="i-finger"></i></div>' }
  ];
  function viewIntro() {
    const last = iScene >= ISCENES.length;
    const dots = '<div class="i-dots">' + ISCENES.map((_, i) => '<i class="' + (i === iScene ? 'on' : i < iScene ? 'done' : '') + '"></i>').join('') + '</div>';
    if (last) return '<div class="intro end"><div class="i-art">' + mascot('verde') + '</div><h1>NoVoy</h1><p class="muted">Tu semáforo de faltas. Gratis y sin correo.</p><button class="btn primary block" data-act="intro-go">Empezar</button><p class="muted mini" style="text-align:center;margin-top:10px"><button class="link" data-act="intro-replay">Verlo otra vez</button></p></div>';
    const sc = ISCENES[iScene];
    return '<div class="intro">' + dots + '<div class="i-scene" key="' + iScene + '">' + sc.art() + '<p class="i-cap">' + sc.cap + '</p></div><button class="link i-skip" data-act="intro-go">Saltar</button></div>';
  }
  function introTick() { clearTimeout(iTimer); if (tab !== 'intro' || iScene >= ISCENES.length) return; const sp = iScene === 0 && document.getElementById('splash') ? 1200 : 0; // la primera escena empieza cuando se va el splash
    if (sp) { const bar = document.querySelector('.i-dots i.on'); if (bar) bar.style.animationDelay = sp + 'ms'; }
    iTimer = setTimeout(() => { iScene++; render(); }, (REDUCED ? 3500 : 3000) + sp); }
  function render() {
    document.body.classList.toggle('setup', tab === 'intro' || tab === 'previas' || tab === 'desde' || tab === 'setup' || tab === 'editor' || tab === 'join' || tab === 'sim' || tab === 'install' || tab === 'quick' || tab === 'admin');
    app.innerHTML = VIEWS[tab]();
    document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    requestAnimationFrame(() => requestAnimationFrame(animate));
    warnBar();
    if (tab === 'intro') introTick();
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
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { if (b.dataset.tab === 'ajustes') ajSec = null; if (b.dataset.tab === 'faltas') { fwk = null; fcell = null; } tab = b.dataset.tab; render(); scrollTo(0, 0); } });
  const nid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  app.addEventListener('click', async (e) => {
    if (tab === 'intro' && !e.target.closest('button') && e.target.closest('.intro:not(.end)')) { iScene++; render(); return; } // tocar = siguiente
    const b = e.target.closest('button,label'); if (!b) return; const d = b.dataset;
    if (d.miss) {
      let m; try { m = JSON.parse(d.miss); } catch (er) { return; }
      const date = m.d, taken = new Set(user.faltas.filter((f) => f.date === date && f.start && f.type !== 'retraso').map((f) => f.subject + '@' + f.start));
      const added = m.u.filter((x) => !taken.has(x[0] + '@' + x[1])).map((x) => ({ id: nid(), date, term: C.termOf(state(), date), subject: x[0], start: x[1], hours: +x[2], type: 'falta', justified: false, note: '' }));
      if (!added.length) { toast('Esa hora ya estaba apuntada'); return; }
      const ids = added.map((x) => x.id);
      user.faltas.push.apply(user.faltas, added); save(); if (tab === 'sim') simSel = []; render();
      toast(added.length === 1 ? 'Falta anotada' : added.length + ' horas anotadas', () => { user.faltas = user.faltas.filter((f) => ids.indexOf(f.id) < 0); save(); render(); });
    } else if (d.unmiss) {
      let m; try { m = JSON.parse(d.unmiss); } catch (er) { return; }
      const keys = new Set(m.u.map((x) => x[0] + '@' + x[1])), gone = user.faltas.filter((f) => f.date === m.d && f.type !== 'retraso' && keys.has(f.subject + '@' + f.start));
      user.faltas = user.faltas.filter((f) => gone.indexOf(f) < 0); save(); render();
      toast('Quitada', () => { user.faltas.push.apply(user.faltas, gone); save(); render(); });
    } else if (d.yok) { user.okDay = d.yok; save(); render(); toast('Perfecto, apuntado que fuiste');
    } else if (d.yno) { fwk = mondayOf(d.yno); fcell = null; tab = 'faltas'; render(); scrollTo(0, 0); toast('El ' + DAYS[C.parse(d.yno).getDay()] + ': toca la hora que faltaste');
    } else if (d.act === 'prv-open') { prvOpen(tab === 'previas' ? 'hoy' : tab);
    } else if (d.act === 'prv-close') { tab = (prv && prv.next) || 'hoy'; prv = null; render(); scrollTo(0, 0);
    } else if (d.pv) { const i = d.pv.lastIndexOf('|'), n = d.pv.slice(0, i), k = +d.pv.slice(i + 1); prv.vals[n] = Math.max(prv.min[n] || 0, Math.min(999, (prv.vals[n] || 0) + k)); prv.warn = false; render();
    } else if (d.act === 'prv-save') { prvSave();
    } else if (d.act === 'go-nocount') { qk = qFromCfg(user.config); qk.askOpen = true; qk.moreOpen = true; const ni = qk.subjects.findIndex((x) => (qk.nocount || []).indexOf(x) >= 0); qpaint = ni >= 0 ? qk.subjects[ni] : null; qk.editing = ni; tab = 'quick'; render(); scrollTo(0, 0);
    } else if (d.act === 'pj-on' || d.act === 'pj-off') {
      const prev = JSON.stringify(user), p = user.config.project, day = today(); p.ranges = p.ranges || [];
      if (d.act === 'pj-on') { p.ranges.push({ from: day, to: null }); toast('Semana de ' + p.name.toLowerCase() + ' activada', () => { user = JSON.parse(prev); save(); render(); }); }
      else { const r = p.ranges.filter((x) => x.from <= day && (!x.to || day <= x.to)).pop(); if (r) { const y = C.parse(day); y.setDate(y.getDate() - 1); const yd = C.ymd(y); if (yd < r.from) p.ranges.splice(p.ranges.indexOf(r), 1); else r.to = yd; } toast('Vuelta al horario normal', () => { user = JSON.parse(prev); save(); render(); }); }
      save(); render();
    } else if (d.fw !== undefined) { const mon = fwk || mondayOf(today()); fwk = +d.fw === 0 ? null : addDays(mon, +d.fw); fcell = null; render();
    } else if (d.fc) { const c = JSON.parse(d.fc); fcell = fcell && fcell.d === c.d && fcell.st === c.st ? null : c; render(); const el = $('.fcard'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    } else if (d.fcX) { fcell = null; render();
    } else if (d.fcAdd) {
      const c = fcell, late = !!($('#fc-l') || {}).checked, just = !!($('#fc-j') || {}).checked, id = nid();
      user.faltas.push({ id, date: c.d, term: C.termOf(state(), c.d), subject: c.s, start: c.st, hours: late ? 0 : c.h, type: late ? 'retraso' : 'falta', justified: just, note: '' });
      fcell = null; save(); render(); toast((late ? 'Retraso' : 'Falta') + ' apuntada: ' + c.s + ' ' + c.st, () => { user.faltas = user.faltas.filter((x) => x.id !== id); save(); render(); });
    } else if (d.fcSave) {
      const f = user.faltas.find((x) => x.id === d.fcSave); if (!f) return; const late = !!($('#fc-l') || {}).checked;
      f.type = late ? 'retraso' : 'falta'; f.hours = late ? 0 : fcell.h; f.justified = !!($('#fc-j') || {}).checked; fcell = null; save(); render(); toast('Guardado');
    } else if (d.fcDel) { const f = user.faltas.find((x) => x.id === d.fcDel); user.faltas = user.faltas.filter((x) => x !== f); fcell = null; save(); render(); toast('Quitada', () => { user.faltas.push(f); save(); render(); });
    } else if (d.onOpen !== undefined) { onOpen = d.onOpen || null; render();
    } else if (d.onGo) { const v = ($('#on-d') || {}).value; if (!/^\d{4}-\d\d-\d\d$/.test(v || '')) { toast('Elige una fecha'); return; } activate(d.onGo, v);
    } else if (d.aj !== undefined) { ajSec = d.aj || null; render(); scrollTo(0, 0);
    } else if (d.sim !== undefined) { const i = +d.sim, k = simSel.indexOf(i); if (k >= 0) simSel.splice(k, 1); else simSel.push(i); render();
    } else if (d.act === 'open-sim') { simDay = null; simSel = []; tab = 'sim'; render(); scrollTo(0, 0);
    } else if (d.act === 'sim-close') { tab = 'resumen'; render();
    } else if (d.act === 'sim-all') { const v = C.verdict(calc(), simDay || (C.verdict(calc(), today()).free ? C.nextClassDay(calc(), today()) : today())); simSel = v.slots.map((x, i) => i); render();
    } else if (d.act === 'sim-none') { simSel = []; render();
    } else if (d.act === 'open-install') { tab = 'install'; render(); scrollTo(0, 0);
    } else if (d.act === 'inst-close') { tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.inst) { instTab = d.inst; render();
    } else if (d.act === 'do-install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
    } else if (d.act === 'nt-x') { flagSet('nt' + gNotice.ts); render();
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
      const prev = JSON.stringify(user); user = { config: jn.config, settings: Object.assign({}, user.settings, jn.reglas || {}, { unificar: Object.keys(jn.config.alias).length > 0, limite: jn.limite || 25 }), faltas: jn.hasFaltas ? jn.faltas : (user.faltas || []) , acct: user.acct, skipCfg: user.skipCfg };
      if (acPend) { user.acct = acPend; acPend = null; }
      save(); jn = null; tab = 'hoy';
      if (!user.faltas.length) { prvOpen('hoy'); return; }
      render(); toast('Horario cargado', () => { user = JSON.parse(prev); save(); tab = user.config ? 'hoy' : 'setup'; render(); });
    } else if (d.act === 'adm-open') { tab = 'admin'; render(); scrollTo(0, 0); if (!adm || !adm.users) admLoad();
    } else if (d.act === 'adm-close') { tab = 'ajustes'; render(); scrollTo(0, 0);
    } else if (d.act === 'adm-load') { admLoad();
    } else if (d.act === 'adm-export') {
      const r = await admApi('export');
      if (!r.ok) return toast('No se pudo exportar');
      const a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }));
      a2.download = 'novoy-cuentas-' + new Date().toISOString().slice(0, 10) + '.json'; a2.click();
      toast('Copia descargada');
    } else if (d.admRole) {
      const r = await admApi('role', { target: d.admRole });
      if (!r.ok) return toast(r.error === 'solo-principal' ? 'Solo la cuenta principal da el rol' : 'No se pudo');
      const u = adm.users.find((x) => x.id === d.admRole); if (u) u.adm = r.user.adm;
      render(); toast(r.user.adm ? (u ? u.u : 'La cuenta') + ' ya es admin' : 'Rol de admin quitado');
    } else if (d.admBlock) {
      const r = await admApi('block', { target: d.admBlock });
      if (!r.ok) return toast(r.error === 'eres-tu' ? 'No puedes bloquearte a ti' : r.error === 'principal' ? 'A la cuenta principal no se la toca' : r.error === 'solo-principal' ? 'Solo la cuenta principal puede con otros admins' : 'No se pudo');
      const u = adm.users.find((x) => x.id === d.admBlock); if (u) u.blocked = r.user.blocked;
      render(); toast(r.user.blocked ? 'Cuenta bloqueada' : 'Cuenta desbloqueada');
    } else if (d.admNote) {
      const u = adm.users.find((x) => x.id === d.admNote);
      const txt = prompt('Nota sobre ' + (u ? u.u : 'esta cuenta') + ' (solo la ves tú):', (u && u.note) || '');
      if (txt === null) return;
      const r = await admApi('note', { target: d.admNote, note: txt });
      if (!r.ok) return toast('No se pudo guardar la nota');
      if (u) u.note = r.user.note; render();
    } else if (d.admDel) {
      const u = adm.users.find((x) => x.id === d.admDel);
      if (!confirm('¿Borrar la cuenta ' + (u ? u.u : '') + '? Perderá su copia en el servidor y no se puede deshacer.')) return;
      const r = await admApi('del', { target: d.admDel });
      if (!r.ok) return toast(r.error === 'eres-tu' ? 'No puedes borrarte a ti' : 'No se pudo borrar');
      adm.users = adm.users.filter((x) => x.id !== d.admDel); render(); toast('Cuenta borrada');
    } else if (d.act === 'share-app') {
      const url = location.href.split('#')[0].split('?')[0];
      const msg = '¿Cuántas clases puedes saltarte sin pasarte del límite? NoVoy te lo dice de un vistazo. Sin correo y sin tienda de apps:\n' + url;
      if (navigator.share) { try { await navigator.share({ text: msg }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
      toast((await copy(msg)) ? 'Enlace copiado. Pégalo en el grupo' : 'No se pudo copiar');
    } else if (d.act === 'go-reg') { acg.p = ''; acg.p2 = ''; sx.scr = 'reg'; render(); scrollTo(0, 0);
    } else if (d.act === 'go-login') { acg.p = ''; acg.p2 = ''; sx.scr = 'login'; render(); scrollTo(0, 0);
    } else if (d.act === 'skip-reg') { sx.scr = 'method'; render(); scrollTo(0, 0);
    } else if (d.act === 'acct-open') { acg.p = ''; acg.p2 = ''; sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: 'reg' }; tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'acct-later') { try { localStorage.setItem('ft.accx', String(Date.now())); } catch (er) {} sx.scr = 'method'; tab = user.config ? 'hoy' : 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'skip-cfg') { user.skipCfg = true; save(); tab = 'hoy'; render(); scrollTo(0, 0);
    } else if (d.act === 'go-setup') { sx = { mode: 'setup', step: 1, text: '', res: null, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'acct-dice') { acg.u = window.FTAcct.genUser(); acg.p = ($('#ac-p') || {}).value || ''; render();
    } else if (d.act === 'intro-replay') { iScene = 0; render();
    } else if (d.act === 'intro-go') { clearTimeout(iTimer); flagSet('intro'); tab = 'setup'; render(); scrollTo(0, 0);
    } else if (d.act === 'ac-mode') { acg.mode = d.m; acg.p = ''; acg.p2 = ''; render();
    } else if (d.act === 'ac-eye') { acg.p = ($('#ac-p') || {}).value || ''; acg.p2 = ($('#ac-p2') || {}).value || ''; const fu = $('#acf #ac-u'); if (fu) { if ($('#acf').dataset.mode === 'login') acg.uLogin = fu.value; else acg.u = fu.value; } acg.eye = !acg.eye; render();
    } else if (d.acx !== undefined) { acx = d.acx || null; acxFail = false; render(); const i = $('#acx-p') || $('#acx-n'); if (i) i.focus();
    } else if (d.act === 'acct-out-force') { acx = null; acxFail = false; delete user.acct; acState = ''; save(); toast('Sesión cerrada. Tus datos siguen en este móvil'); render();
    } else if (d.act === 'acct-push') { toast((await acPush()) ? 'Guardado' : 'No se pudo guardar'); render();
    } else if (d.act === 'acct-out') { acx = 'out'; acxFail = false; render();
    } else if (d.act === 'join-no') { acPend = null; jn = null; tab = user.config ? 'hoy' : 'setup'; render();
    } else if (d.act === 'backup-link') {
      if (!backupUrl) return toast('Un segundo y vuelve a pulsar');
      toast((await copy(backupUrl)) ? 'Enlace copiado. Guárdalo en tus mensajes' : 'No se pudo copiar'); bkSet();
    } else if (d.act === 'goto-backup') { tab = 'ajustes'; ajSec = 'cuenta'; render(); scrollTo(0, 0);
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
    } else if (d.act === 'edit') { qk = user.config ? qFromCfg(user.config) : qNew(); qpaint = null; tab = 'quick'; render(); scrollTo(0, 0);
    } else if (d.act === 'edit-adv') { openEditor();
    } else if (d.act === 'ed-close') { ed = null; tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.act === 'ios-x') { try { localStorage.setItem('ft.iosx', String(Date.now())); } catch (e) {} render();
    } else if (d.act === 'ed-save') { edSave();
    } else if (d.act === 'desde-ok' || d.act === 'desde-all') {
      const v = d.act === 'desde-ok' ? ($('#desde-d') || {}).value : '';
      if (d.act === 'desde-ok' && !/^\d{4}-\d\d-\d\d$/.test(v || '')) { toast('Elige una fecha'); return; }
      const p = pend; pend = null; tab = p.back; p.finish(v || null);
    } else if (d.act === 'desde-back') { const p = pend; pend = null; tab = p ? p.back : 'ajustes'; render(); scrollTo(0, 0);
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
    } else if (d.qTramo !== undefined) { qGo(d.qTramo === 'main' ? null : +d.qTramo);
    } else if (d.qDelp !== undefined) {
      const cfg = qCfg(); cfg.periods.splice(+d.qDelp, 1);
      qk = Object.assign(qFromCfg(cfg, null), { adding: false, ren: qk.ren }); qpaint = null; render(); scrollTo(0, 0);
      toast('Tramo quitado');
    } else if (d.act === 'q-addp') { qk.addp = !qk.addp; render();
    } else if (d.act === 'q-add') { qk.adding = !qk.adding; qk.editing = -1; render();
    } else if (d.act === 'ai-go') { sx.ai = true; render(); scrollTo(0, 0);
    } else if (d.act === 'ai-back') { sx.ai = false; sx.copied = false; render();
    } else if (d.act === 'q-exit') { qk = null; tab = user.config ? 'ajustes' : 'setup'; render();
    } else if (d.act === 'q-back') { if (qk.step <= 1) { qk = null; tab = user.config ? 'ajustes' : 'setup'; } else qk.step--; render(); scrollTo(0, 0);
    } else if (d.act === 'q-next') { if (qk.step === 3) qSave(); else { qk.step++; render(); scrollTo(0, 0); }
    } else if (d.ask) { const [k, v] = d.ask.split('|'); qk.ask = Object.assign({}, qk.ask, { [k]: v === '1' }); if (k === 'proj' && v !== '1' && qpaint === QP) qpaint = null; render();
    } else if (d.act === 'q-ask-open') { qk.askOpen = !qk.askOpen; render();
    } else if (d.act === 'q-add-done') { qk.adding = false; render();
    } else if (d.act === 'q-proj') { qpaint = qpaint === QP ? null : QP; qk.editing = -1; render();
    } else if (d.act === 'q-proj-clear') { qk.proj = {}; render();
    } else if (d.qOff !== undefined) { const c = ($('#q-cover') || {}).value; if (!c) return; qk.disabled = Object.assign({}, qk.disabled, { [d.qOff]: { cover: c, on: null } }); render();
    } else if (d.qOn !== undefined) { const o = Object.assign({}, qk.disabled); delete o[d.qOn]; qk.disabled = o; render();
    } else if (d.pal !== undefined) { const nv = +d.pal < 0 ? '' : qk.subjects[+d.pal]; if (nv !== '' && qpaint === nv) qk.editing = qk.editing === +d.pal ? -1 : +d.pal; else { qpaint = nv; qk.editing = -1; } render();
    } else if (d.qDel !== undefined) { const n = qk.subjects.splice(+d.qDel, 1)[0]; if (qk.disabled) { const o = {}; Object.keys(qk.disabled).forEach((k) => { if (k !== n && qk.disabled[k].cover !== n) o[k] = qk.disabled[k]; }); qk.disabled = o; } Object.values(qk.grid).forEach((g) => Object.keys(g).forEach((r) => { if (g[r] === n) delete g[r]; })); qk.editing = -1; if (qpaint === n) qpaint = qk.subjects[0] || null; render();
    } else if (d.qTerm !== undefined) { qk.terms.splice(+d.qTerm, 1); render();
    } else if (d.qHol !== undefined) { qk.holidays.splice(+d.qHol, 1); render();
    } else if (d.act === 'q-addterm') { qk.terms.push({ label: (qk.terms.length + 1) + 'r trimestre', from: '', to: '' }); render();
    } else if (d.act === 'q-tmode') { qk.tmode = d.m; render();
    } else if (d.act === 'q-addrow') {
      const rows = qRows(), last = rows[rows.length - 1];
      const dur = last ? mm(last.e) - mm(last.s) : 60, st2 = last ? mm(last.e) : 8 * 60;
      qk.custom = rows.concat([{ s: hhmm(st2), e: hhmm(Math.min(st2 + dur, 23 * 60 + 59)) }]);
      render();
    } else if (d.qDelrow !== undefined) {
      const i = +d.qDelrow, rows = qRows();
      if (rows.length <= 1) return toast('Tiene que quedar al menos una hora');
      qk.custom = rows.filter((_, k) => k !== i);
      [qk.grid, qk.proj].forEach((g) => { if (!g) return; Object.keys(g).forEach((dd) => {
        const o = {}; Object.keys(g[dd]).map(Number).sort((a, b) => a - b).forEach((r) => { if (r < i) o[r] = g[dd][r]; else if (r > i) o[r - 1] = g[dd][r]; });
        g[dd] = o; }); });
      render();
    } else if (d.act === 'q-autorows') {
      qk.custom = null; render(); toast('Vuelven a calcularse solas');
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
  app.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target), id = e.target.id;
    if (id === 'acf') { const sb = e.submitter || $('button[form=acf]') || e.target.querySelector('button:not([type=button])'); return acctGo(e.target.dataset.mode, sb); }
    if (id === 'acx-f') { return acxGo(e.target.dataset.m, e.submitter || e.target.querySelector('button:not([type=button])')); }
    if (id === 'add') {
      const date = f.get('date');
      const [st, hs] = String(f.get('slot') || '|1').split('|'), late = !!f.get('retraso');
      if (!late && st && user.faltas.some((x) => x.date === date && x.subject === f.get('subject') && x.start === st && x.type !== 'retraso')) { toast('Esa hora ya estaba apuntada'); return; }
      user.faltas.push({ id: nid(), date, term: C.termOf(state(), date), subject: f.get('subject'), start: st || undefined, hours: late ? 0 : (+hs || 1), type: late ? 'retraso' : 'falta', justified: !!f.get('justified'), note: '' });
      save(); tab = 'resumen'; render(); toast('Falta añadida');
    } else if (id === 'edf') {
      const fl = user.faltas.find((x) => x.id === e.target.dataset.id); if (!fl) return;
      const prev = Object.assign({}, fl), date = f.get('date') || '';
      const [st, hs] = String(f.get('slot') || '|1').split('|'), late = !!f.get('retraso');
      Object.assign(fl, { date, term: date ? C.termOf(state(), date) : fl.term, subject: f.get('subject'), start: st || undefined, hours: late ? 0 : (+hs || 1), type: late ? 'retraso' : 'falta', justified: !!f.get('justified') });
      if (fl.sid) { const m = (user.config.subjects || []).find((x) => x.name === fl.subject); fl.sid = m ? m.id : undefined; }
      efId = null; save(); render(); toast('Falta actualizada', () => { Object.assign(fl, prev); save(); render(); });
    } else if (id === 'f-blk') {
      const day = +f.get('day'); (ed.cfg.schedule[day] = ed.cfg.schedule[day] || []).push({ start: f.get('start'), end: f.get('end'), subject: String(f.get('subject')).trim(), hours: +f.get('hours') });
      ed.cfg.schedule[day].sort((a, b) => mm(a.start) - mm(b.start)); render();
    } else if (id === 'f-term') {
      const label = String(f.get('label')).trim(); ed.cfg.terms.push({ id: (label.toLowerCase().replace(/[^a-z0-9]+/g, '') || 't') + ed.cfg.terms.length, label, from: f.get('from'), to: f.get('to') }); ed.cfg.terms.sort((a, b) => (a.from < b.from ? -1 : 1)); render();
    } else if (id === 'f-hol') {
      ed.cfg.holidays.push({ from: f.get('from'), to: f.get('to') || f.get('from'), label: String(f.get('label')).trim() }); render();
    } else if (id === 'q-sub') {
      let last = null; String(f.get('s') || '').split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!qk.subjects.some((y) => y.toLowerCase() === x.toLowerCase())) qk.subjects.push(x); last = qk.subjects.find((y) => y.toLowerCase() === x.toLowerCase()); }); if (last) qpaint = last; qk.adding = true; render();
      // Enter crea la asignatura y deja el teclado abierto para la siguiente
      const inp = $('#q-sub input[name=s]'); if (inp) { inp.focus(); }
    } else if (id === 'q-ren') {
      const nn = String(f.get('n') || '').trim(), old = qk.subjects[qk.editing];
      if (qk.fromShot) qk.edited = true;
      if (nn && old != null && nn !== old) {
        qk.ren = qk.ren || {}; let chained = false;
        Object.keys(qk.ren).forEach((k) => { if (qk.ren[k] === old) { qk.ren[k] = nn; chained = true; } });
        if (!chained) qk.ren[old] = nn;
      }
      if (nn && old != null && qk.disabled) { const o = {}; Object.keys(qk.disabled).forEach((k) => { const x = qk.disabled[k]; o[k === old ? nn : k] = Object.assign({}, x, { cover: x.cover === old ? nn : x.cover }); }); qk.disabled = o; }
      if (nn && old != null) { qk.subjects[qk.editing] = nn; Object.values(qk.grid).forEach((g) => Object.keys(g).forEach((r) => { if (g[r] === old) g[r] = nn; })); if (qpaint === old) qpaint = nn; } qk.editing = -1; render();
    } else if (id === 'adm-notice') {
      const r = await admApi('notice', { text: String(f.get('text') || ''), until: f.get('until') || '' });
      if (!r.ok) return toast('No se pudo publicar');
      adm.notice = { text: String(f.get('text') || ''), until: f.get('until') || '' };
      toast(adm.notice.text ? 'Aviso publicado' : 'Aviso quitado'); render();
    } else if (id === 'q-per') {
      const from = f.get('from'), to = f.get('to'), label = String(f.get('label') || '').trim() || 'Tramo';
      if (!from || !to || to < from) return toast('Revisa las fechas del tramo');
      const cfg = qCfg(); cfg.periods = cfg.periods || [];
      if (cfg.periods.some((p) => from <= p.to && to >= p.from)) return toast('Ese tramo se solapa con otro');
      cfg.periods.push({ label, from, to, schedule: {} });
      cfg.periods.sort((a, b) => (a.from < b.from ? -1 : 1));
      const pi = cfg.periods.findIndex((p) => p.from === from && p.to === to);
      qk = Object.assign(qFromCfg(cfg, pi), { adding: true, ren: qk.ren }); qpaint = null; render(); scrollTo(0, 0);
      toast('Tramo creado. Pinta su horario');
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
    if (e.target.id === 'ac-p' || e.target.id === 'ac-p2') {
      if (e.target.id === 'ac-p') acg.p = e.target.value; else acg.p2 = e.target.value;
      const ul = document.querySelector('.acc-chk'), A = window.FTAcct; if (!ul || !A) return;
      A.passChecks(A.cleanPass(acg.p || '')).forEach((c, i) => { const li = ul.children[i]; if (li) li.innerHTML = (c[1] ? '✅' : '◻️') + ' ' + c[0]; });
      const same = $('#ac-same'); if (same) same.innerHTML = (acg.p && A.cleanPass(acg.p) === A.cleanPass(acg.p2 || '') ? '✅' : '◻️') + ' Las dos iguales';
    } else if (e.target.id === 'ac-u') { const f = e.target.form; if (f && f.dataset.mode === 'login') acg.uLogin = e.target.value; else acg.u = e.target.value; }
  });
  app.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'date' && t.form && t.form.id === 'add') {
      const sel = t.form.elements.subject, r = subjectsOn(state(), t.value), prev = sel.value;
      sel.innerHTML = subjectOpts(state(), t.value, prev); const h = $('#subhint'); if (h) h.textContent = r.all ? 'Ese día no hay clase: salen todas.' : 'Solo las de ese día.';
      if (t.form.elements.slot) t.form.elements.slot.innerHTML = slotOpts(state(), t.value, sel.value); return;
    }
    if ((t.name === 'subject' || t.name === 'date') && t.form && (t.form.id === 'add' || t.form.id === 'edf') && t.form.elements.slot) {
      t.form.elements.slot.innerHTML = slotOpts(state(), t.form.elements.date.value, t.form.elements.subject.value); return;
    }
    if (t.id === 'qshot' && t.files[0]) { qStartShot(t.files[0]); t.value = ''; return; }
    if (qk && t.dataset.qr !== undefined) { // una franja concreta leída de la captura
      const i = +t.dataset.qr, rows = qRows().slice(), v = t.value;
      if (!/^\d\d:\d\d$/.test(v)) return;
      rows[i] = Object.assign({}, rows[i], t.dataset.qe === 's' ? { s: v } : { e: v });
      if (mm(rows[i].e) <= mm(rows[i].s)) { toast('Esa hora termina antes de empezar'); return render(); }
      qk.custom = rows; render(); return;
    }
    if (qk && t.dataset.qf) { const k = t.dataset.qf; qk[k] = ['dur', 'rows', 'brk', 'brkMin', 'limite', 'projWeeks', 'retrasos'].includes(k) ? +t.value : t.value; if (k === 'projName' || k === 'projWeeks') { render(); return; } if (k === 'rows' || k === 'brk') render(); else if (k === 'dur' || k === 'brkMin') render(); return; }
    if (qk && t.dataset.qt) { const [i, k] = t.dataset.qt.split('|'); qk.terms[+i][k] = t.value; if (k !== 'label') render(); return; }
    if (qk && t.dataset.qtot) { const j = t.dataset.qtot.indexOf('|'), id = t.dataset.qtot.slice(0, j), s = t.dataset.qtot.slice(j + 1); (qk.totals[id] = qk.totals[id] || {})[s] = parseFloat(t.value); return; }
    if (t.id === 'simday') { simDay = t.value || null; simSel = []; render(); return; }
    if (t.id === 'fday') { fday = t.value; render(); return; }
    if (qk && t.dataset.qNc) { const n = t.dataset.qNc, l = (qk.nocount || []).filter((x) => x !== n); if (t.checked) l.push(n); qk.nocount = l; render(); return; }
    if (t.dataset.fcT && fcell) { fcell[t.dataset.fcT] = t.checked; const b = $('[data-fc-add]'); if (b) b.textContent = fcell.late ? 'Apuntar retraso' : 'Apuntar falta'; return; }
    if (t.dataset.sel) { user.settings = Object.assign({}, user.settings, { [t.dataset.sel]: t.value }); viewTerm = null; save(); render(); return; }
    if (t.dataset.set) { user.settings = Object.assign({}, user.settings, { [t.dataset.set]: t.checked }); save(); }
    else if (t.dataset.num) { const v = parseFloat(t.value); if (v >= 0) { user.settings = Object.assign({}, user.settings, { [t.dataset.num]: v }); save(); } }
    else if (t.id === 'imp' && t.files[0]) {
      t.files[0].text().then((x) => { const r = SU.parseImport(x); if (r.ok && r.hasFaltas) { jn = r; tab = 'join'; render(); return; } sx = { mode: 'update', step: 4, text: x, res: r, copied: false, ai: false, scr: 'method' }; tab = 'setup'; render(); }).catch(() => toast('Archivo no válido'));
    } else if (t.id === 'paste') { sx.text = t.value; }
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  fixAlias();
  render();
  if (window.FTAcct) FTAcct.notice().then((n) => { if (n && n.text) { gNotice = n; render(); } });
  readLink();
  if (window.ftSplashDone) window.ftSplashDone(); // la app ya está pintada: fuera el splash (como mínimo ~1 s de animación)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
