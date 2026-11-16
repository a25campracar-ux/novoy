/* NoVoy v2 · Uso diario: el armazón. Estado, guardar (y la cuenta), avisos, navegación y pestañas.
   Las pantallas están en pantalla-hoy.js, pantalla-faltas.js y pantalla-ajustes.js; la lógica, sin DOM, en
   hoy.js, lista.js y ajustes.js (con pruebas). Mismo estado que el alta y la v1: localStorage «ft.v2».
   Se carga antes que las pantallas; arranca cuando el documento está listo. */
(function () {
  'use strict';
  const C = window.FTCore, Hd = window.NVHoy, KEY = 'ft.v2';
  const app = document.getElementById('app'), tabs = document.getElementById('tabs');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const qs = new URLSearchParams(location.search), qd = qs.get('hoy') || qs.get('d');
  const HOY = /^\d{4}-\d{2}-\d{2}$/.test(qd || '') ? qd : C.ymd(new Date());
  const largo = (iso) => { const d = C.parse(iso); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  const fecha = (iso) => { const d = C.parse(iso); return d.getDate() + ' ' + MESES[d.getMonth()]; };
  const corto = (iso) => (iso === HOY ? 'Hoy' : iso === Hd.addDays(HOY, -1) ? 'Ayer' : iso === Hd.addDays(HOY, 1) ? 'Mañana' : cap(DIAS[C.parse(iso).getDay()].slice(0, 3)) + ' ' + C.parse(iso).getDate());
  const horasTxt = (n) => Hd.fmt(n) + ' h';
  const ls = { get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  // Enlaces antiguos de clase o de copia de la v1 (#c=…): los sigue abriendo la v1.
  if (/^#c=/.test(location.hash)) { location.replace('clasica.html' + location.search + location.hash); return; }
  let user = ls.get(KEY);
  if (!user || !user.config) { location.replace('alta.html' + location.search); return; }
  Hd.ordenar(user, HOY);

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    sim: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
  };

  // ---------- guardar y cuenta ----------
  let subirT = null, subiendo = false, otraVez = false;
  function guardar() {
    Hd.ordenar(user, HOY); ls.set(KEY, user);
    if (user.acct) { clearTimeout(subirT); subirT = setTimeout(() => { subir().catch(() => {}); }, 1500); }
  }
  /** Sube la copia cifrada a la cuenta. Devuelve true si se ha guardado. */
  async function subir() {
    const A = window.FTAcct, AJ = window.NVAjustes; if (!user.acct || !A) return false;
    if (subiendo) { otraVez = true; return false; }
    subiendo = true;
    try {
      const key = await A.impKey(user.acct.k), data = await A.seal(key, AJ.paraCuenta(user));
      const r = await A.api({ op: 'put', id: user.acct.id, auth: user.acct.auth, u: user.acct.u, data });
      if (r.ok) { user.acct.t = Date.now(); user.acct.err = null; ls.set(KEY, user); return true; }
      user.acct.err = r.error === 'clave' || r.error === 'no-existe' ? 'sesion' : r.error === 'bloqueada' ? 'bloqueada' : 'error'; ls.set(KEY, user);
      return false;
    } catch (e) { return false; } finally { subiendo = false; if (otraVez) { otraVez = false; subir().catch(() => {}); } }
  }

  // ---------- avisos ----------
  let toastT = null;
  /** Aviso breve. deshacer: función opcional; añade «Deshacer» y dura más. */
  function aviso(t, deshacer) {
    const el = document.getElementById('aviso'); el.textContent = t;
    if (deshacer) { const b = document.createElement('button'); b.className = 'undo'; b.textContent = 'Deshacer'; b.onclick = () => { el.classList.remove('on'); deshacer(); }; el.appendChild(b); }
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), deshacer ? 5000 : 2400);
  }
  /** Aplica lo que devuelve la lógica ({ user }, un estado nuevo o { error }) y ofrece «Deshacer». */
  function aplicar(res, msg) {
    const nuevo = res && res.user ? res.user : res && res.config ? res : null;
    if (!nuevo) { aviso((res && res.error) || 'No se ha podido hacer.'); return false; }
    const prev = user; user = nuevo; guardar(); render();
    if (msg) aviso(msg, () => { user = prev; guardar(); render(); });
    return true;
  }

  // ---------- navegación: #hoy, #faltas, #ajustes, #ajustes/…, #falte, #simular ----------
  let pila = 0;
  const ruta = () => { const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'hoy'; const p = h.split('/'); return { base: p[0], sub: p.slice(1), raw: h }; };
  let pintado = null; // hash ya pintado: ir() pinta al momento y el evento hashchange no repite
  function ir(hash) { pila++; location.hash = hash; if (location.hash !== pintado) render(true); }
  /** Volver atrás dentro de la app; si se llegó de fuera, a `fuera`. */
  function atras(fuera) { if (pila > 0) { pila--; history.back(); } else location.replace('#' + (fuera || 'hoy')); }
  window.addEventListener('hashchange', () => { if (location.hash !== pintado) render(true); });

  const NV = window.NV = {
    C, Hd, esc, cap, largo, fecha, corto, horasTxt, HOY, ICON, ls, pantallas: {},
    get user() { return user; }, set user(v) { user = v; },
    guardar, subir, aviso, aplicar, ir, atras, ruta, render
  };

  // ---------- pintar ----------
  const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'));
  /** nueva: foco en el título y arriba del todo. Si no, intenta dejar el foco en el mismo botón. */
  function render(nueva, focoSel) {
    const r = ruta(), P = NV.pantallas[r.base] || NV.pantallas.hoy;
    const act = document.activeElement;
    const sel = focoSel || (act && act.dataset && act.dataset.a && app.contains(act) ? '[data-a="' + act.dataset.a + '"]' + ['b', 'k', 'v', 'd'].map((x) => (act.dataset[x] != null ? '[data-' + x + '="' + cssEsc(act.dataset[x]) + '"]' : '')).join('') : null);
    app.innerHTML = P.vista(r); pintado = location.hash;
    const conTabs = P.tabs !== false && !r.sub.length;
    tabs.hidden = !conTabs; document.body.classList.toggle('contabs', conTabs);
    tabs.querySelectorAll('a').forEach((a) => { if (a.getAttribute('href') === '#' + (P.tab || r.base)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const h1 = app.querySelector('h1');
    document.title = (h1 ? h1.textContent + ' · ' : '') + 'NoVoy';
    if (nueva) { window.scrollTo(0, 0); if (h1) h1.focus({ preventScroll: true }); }
    else if (sel) { const el = app.querySelector(sel); if (el) el.focus({ preventScroll: true }); }
  }
  const pantalla = () => NV.pantallas[ruta().base] || NV.pantallas.hoy;
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a],[data-ir]'); if (!el || el.disabled || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
    if (el.dataset.ir != null) { e.preventDefault(); ir(el.dataset.ir); return; }
    const f = (pantalla().acciones || {})[el.dataset.a];
    if (f) { e.preventDefault(); f(el, e); }
  });
  app.addEventListener('change', (e) => { const el = e.target; const f = el.dataset && el.dataset.a && (pantalla().cambios || {})[el.dataset.a]; if (f) f(el, e); });
  app.addEventListener('input', (e) => { const el = e.target; const f = el.dataset && el.dataset.a && (pantalla().entradas || {})[el.dataset.a]; if (f) f(el, e); });
  app.addEventListener('submit', (e) => { const f = (pantalla().envios || {})[e.target.dataset.f]; if (f) { e.preventDefault(); f(e.target, e); } });
  tabs.addEventListener('click', (e) => { if (e.target.closest('a')) pila++; });

  document.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#falte' || location.hash === '#simular') history.replaceState(null, '', location.pathname + location.search);
    guardar();
    render(false);
    if (user.acct && !(user.acct.t > Date.now() - 6 * 3600e3)) subir().catch(() => {});
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  });
})();
