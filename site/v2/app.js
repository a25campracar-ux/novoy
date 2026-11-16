/* NoVoy v2 · Uso diario: pantalla Hoy y «Falté a…».
   La lógica está en hoy.js (con pruebas). Aquí solo pantallas. Resumen, Faltas y Ajustes siguen en la v1
   (clasica.html) hasta las tareas 1.3 y 1.4. Mismo estado que la v1 y el alta: localStorage «ft.v2». */
(function () {
  'use strict';
  const C = window.FTCore, Hd = window.NVHoy, KEY = 'ft.v2';
  const app = document.getElementById('app'), tabs = document.getElementById('tabs');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = Hd.fmt;
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const qs = new URLSearchParams(location.search), qd = qs.get('hoy') || qs.get('d');
  const HOY = /^\d{4}-\d{2}-\d{2}$/.test(qd || '') ? qd : C.ymd(new Date());
  const largo = (iso) => { const d = C.parse(iso); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
  const corto = (iso) => iso === HOY ? 'Hoy' : iso === Hd.addDays(HOY, -1) ? 'Ayer' : cap(DIAS[C.parse(iso).getDay()].slice(0, 3)) + ' ' + C.parse(iso).getDate();
  const horasTxt = (n) => fmt(n) + ' h';

  // Enlaces antiguos de clase o de copia (#c=…): los sigue abriendo la v1.
  if (/^#c=/.test(location.hash)) { location.replace('clasica.html' + location.search + location.hash); return; }
  let user = null;
  try { user = JSON.parse(localStorage.getItem(KEY)); } catch (e) { user = null; }
  if (!user || !user.config) { location.replace('alta.html' + location.search); return; }
  Hd.ordenar(user, HOY);
  const guardar = () => { Hd.ordenar(user, HOY); try { localStorage.setItem(KEY, JSON.stringify(user)); } catch (e) {} };
  guardar();

  let vista = 'hoy', fx = null; // fx: «Falté a…» = { date, sel: { clave: 'falta'|'retraso' }, just, tarde }
  if (location.hash === '#falte') history.replaceState(null, '', location.pathname + location.search);

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  // ---------- Hoy ----------
  function comprobado(n) {
    if (n == null) return '<p class="comp">' + ICON.info + '<span>Aún sin comparar con la lista de tu centro.</span></p>';
    const t = n <= 0 ? 'hoy' : n === 1 ? 'ayer' : 'hace ' + n + ' días';
    return '<p class="comp">' + ICON.shield + '<span>Comprobado con tu lista ' + t + '.</span></p>';
  }
  function semaforo(d) {
    const s = d.semaforo;
    return '<section class="sem ' + s.status + '" aria-label="Semáforo de hoy"><div class="hero"><span class="light" aria-hidden="true"></span><p class="big">' + esc(s.titulo) + '</p></div>' +
      '<p class="frase">' + esc(s.frase) + '</p>' + (s.tono && !s.soloJust && s.frase !== s.tono ? '<p class="tono">' + esc(s.tono) + '</p>' : '') + (d.libre ? '' : comprobado(d.comprobado)) + '</section>';
  }
  /** Una barra por límite: lo que te queda (y, si faltas, en claro lo que gastarías). */
  function barras(v) {
    return '<div class="lims">' + v.limites.map((l) => {
      const queda = Math.max(0, l.queda), base = l.limite > 0 ? l.limite : 1;
      const w = Math.min(100, queda / base * 100), wc = Math.min(100 - w, (l.coste > 0 ? Math.min(l.coste, Math.max(0, l.queda + l.coste)) : 0) / base * 100);
      const txt = l.queda < 0 ? 'te pasas ' + horasTxt(-l.queda) : 'quedan ' + fmt(l.queda) + ' de ' + horasTxt(l.limite);
      return (l.etiqueta ? '<div class="lrow"><span>' + esc(l.etiqueta) + '</span><b class="q ' + l.status + '">' + txt + '</b></div>' : '') +
        '<div class="mt" role="img" aria-label="' + esc((l.etiqueta ? l.etiqueta + ': ' : '') + txt) + '"><i class="' + l.status + '" style="width:' + w.toFixed(1) + '%"></i>' + (wc > 0 ? '<u class="' + l.status + '" style="width:' + wc.toFixed(1) + '%"></u>' : '') + '</div>';
    }).join('') + '</div>';
  }
  const ks = (hs) => esc(JSON.stringify(hs.map((x) => x.key)));
  function tarjeta(g, soloVer) {
    const times = g.horas.map((x) => x.start), meta = (times.length > 2 ? times[0] + ' a ' + g.horas[g.horas.length - 1].end : times.join(' y ')) + ' · ' + horasTxt(g.total);
    const pend = soloVer ? g.horas : g.pendientes, abierta = soloVer || g.estado === 'pendiente' || g.estado === 'parcial';
    let der = '', cuerpo = '', bts = '', cls = 'tj';
    if (g.sinDatos) der = '<span class="tag">sin datos</span>';
    else if (abierta && g.si) {
      const v = g.si;
      der = '<span class="lbl">Si faltas</span><span class="q ' + v.status + '">' + (v.queda < 0 ? 'te pasas ' + horasTxt(-v.queda) : 'te quedan ' + horasTxt(v.queda)) + '</span><span class="pct">' + fmt(g.ahora.pct) + ' % → ' + fmt(v.pct) + ' %</span>';
      cuerpo = barras(v);
    } else if (g.ahora) {
      const v = g.ahora, lab = { fui: 'Fuiste', falta: 'Falta apuntada', retraso: 'Retraso apuntado' }[g.estado] || 'Ahora';
      der = '<span class="tag ' + g.estado + '">' + (g.estado === 'fui' ? ICON.check : '') + lab + '</span><span class="q ' + v.status + '">' + (v.queda < 0 ? 'te has pasado ' + horasTxt(-v.queda) : 'te quedan ' + horasTxt(v.queda)) + '</span><span class="pct">llevas ' + fmt(v.pct) + ' %</span>';
      cuerpo = barras(v);
      cls += ' hecha';
    }
    if (!soloVer) {
      if (abierta) {
        const hecho = g.horas.filter((x) => x.marca), nota = hecho.length ? '<p class="nota">Ya apuntado: ' + hecho.map((x) => x.start + ' ' + ({ fui: 'fuiste', falta: 'faltaste', retraso: 'llegaste tarde' }[x.marca.tipo])).join(', ') + '.</p>' : '';
        bts = nota + '<div class="bts"><button class="bfui" data-a="fui" data-k="' + ks(pend) + '" aria-label="Fui a ' + esc(g.name) + '">' + ICON.check + 'Fui</button>' +
          '<button class="bfal" data-a="falta" data-k="' + ks(pend) + '" aria-label="Falté a ' + esc(g.name) + (pend.length > 1 ? ', ' + horasTxt(g.hPend) : '') + '">' + (pend.length > 1 ? 'Falté ' + horasTxt(g.hPend) : 'Falté') + '</button></div>' +
          (pend.length > 1 ? '<div class="solos">' + pend.map((x) => '<button class="solo" data-a="falta" data-k="' + ks([x]) + '" aria-label="Falté a ' + esc(g.name) + ' solo a las ' + x.start + '">Solo a las ' + x.start + '</button>').join('') + '</div>' : '');
      } else {
        const p = g.ahora && g.ahora.limites[0];
        bts = '<div class="pie">' + (p && g.ahora.limites.length === 1 ? '<span class="nota">Llevas ' + horasTxt(p.usado) + ' de ' + horasTxt(p.limite) + ' que puedes faltar.</span>' : '<span></span>') +
          '<button class="link" data-a="quitar" data-k="' + ks(g.horas) + '" aria-label="' + (g.estado === 'fui' ? 'Cambiar' : 'Quitar') + ' lo apuntado en ' + esc(g.name) + '">' + (g.estado === 'fui' ? 'Cambiar' : 'Quitar') + '</button></div>';
      }
    }
    return '<article class="' + cls + '"><div class="top1"><div class="t"><h3 class="nm">' + esc(g.name) + '</h3><span class="meta">' + meta + '</span></div><div class="der">' + der + '</div></div>' + cuerpo + bts + '</article>';
  }
  function preguntaDia() {
    const p = Hd.sinApuntar(user, HOY); if (!p.length) return '';
    const k = p[0], cuando = k === Hd.addDays(HOY, -1) ? 'Ayer' : 'El ' + largo(k);
    return '<section class="card preg"><p><b>' + cuando + ', ¿fuiste a todo?</b></p>' + (p.length > 1 ? '<p class="sub">Y ' + (p.length - 1) + (p.length === 2 ? ' día más' : ' días más') + ' sin apuntar.</p>' : '') +
      '<div class="bts"><button class="bfui" data-a="diafui" data-d="' + k + '">' + ICON.check + 'Sí, a todo</button><button class="bfal" data-a="falte" data-d="' + k + '">Falté a alguna</button></div></section>';
  }
  function vHoy() {
    const d = Hd.dia(user, HOY);
    let h = '<header class="hd"><h1 tabindex="-1">Hoy</h1><span class="sub">' + cap(largo(HOY)) + (d.trimestre ? ' · ' + esc(d.trimestre) : '') + '</span></header>';
    h += preguntaDia() + semaforo(d);
    if (!d.libre) {
      h += d.pendientes.length ? '<div class="acc"><button class="btn2" data-a="todo">Falté todo el día</button><button class="btn2" data-a="falte">Falté a…</button></div>'
        : '<div class="acc uno"><button class="btn2" data-a="falte">Cambiar lo de hoy</button></div>';
      h += '<p class="cap">Hoy tienes</p><div class="stack">' + d.grupos.map((g) => tarjeta(g)).join('') + '</div>';
      if (d.grupos.filter((g) => g.hPend > 0).length > 1) h += '<button class="link" data-a="fuitodo">Fui a todas</button>';
    } else if (d.proximo) {
      h += '<p class="cap">Si faltas el ' + largo(d.proximo.date) + '</p><div class="stack">' + d.proximo.grupos.map((g) => tarjeta(g, true)).join('') + '</div>';
    }
    return h;
  }

  // ---------- Falté a… ----------
  function abrirFalte(date) {
    const cl = Hd.clases(user, date || HOY); if (!cl.length) { aviso('Ese día no tienes clase.'); return; }
    fx = { date: date || HOY, sel: {}, just: false, tarde: false };
    cl.forEach((b) => b.horas.forEach((x) => { if (x.marca && x.marca.tipo !== 'fui') { fx.sel[x.key] = x.marca.tipo; if (x.marca.justified) fx.just = true; if (x.marca.tipo === 'retraso') fx.tarde = true; } }));
    if (vista !== 'falte') history.pushState({ v: 'falte' }, '', '#falte');
    vista = 'falte'; render(true);
  }
  function cuentaSel() {
    let h = 0, r = 0; const cl = Hd.clases(user, fx.date);
    cl.forEach((b) => b.horas.forEach((x) => { if (fx.sel[x.key] === 'falta') h += x.hours; else if (fx.sel[x.key] === 'retraso') r++; }));
    return { h: Math.round(h * 100) / 100, r, cl };
  }
  function vFalte() {
    const { h, r, cl } = cuentaSel(), dias = Hd.diasRecientes(user, HOY, 8), hoy = fx.date === HOY;
    if (dias.indexOf(fx.date) < 0) dias.push(fx.date);
    const yaHabia = cl.some((b) => b.horas.some((x) => x.marca));
    let out = '<div class="top"><button class="back" data-a="cerrar" aria-label="Volver a Hoy">' + ICON.back + '</button></div>';
    out += '<div><p class="sub">' + cap(largo(fx.date)) + '</p><h1 tabindex="-1">' + (hoy ? '¿A qué clases has faltado?' : '¿A qué clases faltaste?') + '</h1></div>';
    out += '<div class="dias" role="radiogroup" aria-label="Día">' + dias.map((k) => '<button class="seg" role="radio" aria-checked="' + (k === fx.date) + '" data-a="dia" data-d="' + k + '">' + corto(k) + '</button>').join('') + '</div>';
    out += '<div class="stack">' + cl.map((b, i) => {
      const fal = b.horas.filter((x) => fx.sel[x.key] === 'falta'), on = fal.length > 0, tarde = fx.sel[b.horas[0].key] === 'retraso';
      let x = '<div class="blq"><button class="clase" aria-pressed="' + on + '" data-a="tg" data-b="' + i + '"><span class="hora">' + b.start + '</span><span class="t"><b>' + esc(b.name) + '</b><small>' + horasTxt(b.hours) + (on && fal.length < b.horas.length ? ' · faltaste ' + horasTxt(fal.reduce((a, y) => a + y.hours, 0)) : '') + '</small></span><span class="box" aria-hidden="true">' + (on ? ICON.check : '') + '</span></button>';
      if (on && b.horas.length > 1) x += '<div class="subs" role="group" aria-label="Horas de ' + esc(b.name) + '">' + b.horas.map((y) => '<button class="seg" aria-pressed="' + (fx.sel[y.key] === 'falta') + '" data-a="th" data-k="' + esc(y.key) + '">' + y.start + '</button>').join('') + '</div>';
      if (fx.tarde && !on) x += '<div class="subs"><button class="seg" aria-pressed="' + tarde + '" data-a="tarde" data-b="' + i + '">Llegué tarde</button></div>';
      return x + '</div>';
    }).join('') + '</div>';
    out += '<div class="row wrap"><button class="btn2 auto" data-a="todas">Falté a todas</button>' + (fx.tarde ? '' : '<button class="btn2 auto" data-a="vertarde">Llegué tarde a una</button>') + '</div>';
    out += '<label class="toggle"><input type="checkbox" data-a="just"' + (fx.just ? ' checked' : '') + '><span>Tengo justificante</span></label>';
    const cta = h > 0 ? 'Apuntar ' + horasTxt(h) + (r ? ' y ' + r + (r === 1 ? ' retraso' : ' retrasos') : '') : r ? 'Apuntar ' + (r === 1 ? 'el retraso' : r + ' retrasos') : yaHabia ? 'No falté a nada' : 'No he faltado';
    out += '<div class="foot"><button class="btn" data-a="guardar">' + cta + '</button><button class="link" data-a="cerrar">Cancelar</button></div>';
    return out;
  }
  function guardarFalte() {
    const cl = Hd.clases(user, fx.date), sel = {};
    cl.forEach((b) => b.horas.forEach((x) => { sel[x.key] = fx.sel[x.key] || 'fui'; }));
    const r = Hd.fijar(user, fx.date, sel, { justificada: fx.just });
    if (r.error) return aviso(r.error);
    const prev = user, date = fx.date; user = r.user; guardar(); cerrarFalte();
    const n = cuentaDia(date);
    aviso(n.h > 0 || n.r > 0 ? (date === HOY ? 'Apuntado' : 'Apuntado el ' + largo(date)) + ': ' + (n.h > 0 ? horasTxt(n.h) : '') + (n.h > 0 && n.r ? ' y ' : '') + (n.r ? n.r + (n.r === 1 ? ' retraso' : ' retrasos') : '') : 'Apuntado: fuiste a todo', () => { user = prev; guardar(); render(); });
  }
  function cuentaDia(date) { let h = 0, r = 0; (user.faltas || []).forEach((f) => { if (f.date !== date) return; if (f.type === 'retraso') r++; else h += +f.hours || 0; }); return { h: Math.round(h * 100) / 100, r }; }
  function cerrarFalte() { if (vista === 'falte' && history.state && history.state.v === 'falte') history.back(); else { vista = 'hoy'; fx = null; render(true); } }
  window.addEventListener('popstate', () => { if (vista === 'falte') { vista = 'hoy'; fx = null; render(true); } });

  // ---------- acciones ----------
  function aplicar(res, msg) {
    if (!res || res.error) return aviso((res && res.error) || 'No se ha podido apuntar.');
    const prev = user; user = res.user; guardar(); render();
    aviso(msg, () => { user = prev; guardar(); render(); });
  }
  const leerK = (el) => { try { return JSON.parse(el.dataset.k); } catch (e) { return []; } };
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]'); if (!el || el.tagName === 'INPUT') return;
    const a = el.dataset.a, nombre = () => (el.closest('.tj') && el.closest('.tj').querySelector('.nm') || {}).textContent || '';
    if (a === 'fui') aplicar(Hd.fijar(user, HOY, Hd.todas(leerK(el), 'fui')), 'Apuntado: fuiste a ' + nombre());
    else if (a === 'falta') { const r = Hd.fijar(user, HOY, Hd.todas(leerK(el), 'falta')); aplicar(r, 'Falta apuntada: ' + nombre() + ', ' + horasTxt(r.horas || 0)); }
    else if (a === 'quitar') aplicar(Hd.fijar(user, HOY, Hd.todas(leerK(el), null)), 'Quitado lo de ' + nombre());
    else if (a === 'todo') { const r = Hd.todoElDia(user, HOY); aplicar(r, 'Todo el día apuntado: ' + horasTxt(r.horas || 0)); }
    else if (a === 'fuitodo') aplicar(Hd.fuiATodo(user, HOY), 'Apuntado: fuiste a todas');
    else if (a === 'diafui') aplicar(Hd.fuiATodo(user, el.dataset.d), 'Apuntado: el ' + largo(el.dataset.d) + ' fuiste a todo');
    else if (a === 'falte') abrirFalte(el.dataset.d || HOY);
    else if (a === 'cerrar') cerrarFalte();
    else if (a === 'dia') { const k = el.dataset.d; fx = null; vista = 'falte'; abrirFalte(k); }
    else if (a === 'tg' || a === 'tarde' || a === 'th' || a === 'todas' || a === 'vertarde') {
      const cl = Hd.clases(user, fx.date);
      if (a === 'tg') { const b = cl[+el.dataset.b], on = b.horas.some((x) => fx.sel[x.key] === 'falta'); b.horas.forEach((x) => { if (on) delete fx.sel[x.key]; else fx.sel[x.key] = 'falta'; }); }
      else if (a === 'th') { const k = el.dataset.k; if (fx.sel[k] === 'falta') delete fx.sel[k]; else fx.sel[k] = 'falta'; }
      else if (a === 'tarde') { const b = cl[+el.dataset.b], k = b.horas[0].key; b.horas.forEach((x) => delete fx.sel[x.key]); if (el.getAttribute('aria-pressed') !== 'true') fx.sel[k] = 'retraso'; }
      else if (a === 'todas') { const all = cl.every((b) => b.horas.every((x) => fx.sel[x.key] === 'falta')); cl.forEach((b) => b.horas.forEach((x) => { if (all) delete fx.sel[x.key]; else fx.sel[x.key] = 'falta'; })); }
      else if (a === 'vertarde') fx.tarde = true;
      render(false, a === 'vertarde' ? '.clase' : null, el);
    } else if (a === 'guardar') guardarFalte();
  });
  app.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.a === 'just' && fx) fx.just = e.target.checked; });

  // ---------- pintar ----------
  let toastT = null;
  function aviso(t, deshacer) {
    const el = document.getElementById('aviso'); el.textContent = t;
    if (deshacer) { const b = document.createElement('button'); b.className = 'undo'; b.textContent = 'Deshacer'; b.onclick = () => { el.classList.remove('on'); deshacer(); }; el.appendChild(b); }
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), deshacer ? 5000 : 2200);
  }
  /** nueva: foco en el título y arriba del todo. Si no, intenta dejar el foco en el mismo botón. */
  function render(nueva, focoSel, origen) {
    const act = origen || document.activeElement, sel = focoSel || (act && act.dataset && act.dataset.a ? '[data-a="' + act.dataset.a + '"]' + (act.dataset.b != null ? '[data-b="' + act.dataset.b + '"]' : '') + (act.dataset.k ? '[data-k="' + (window.CSS && CSS.escape ? CSS.escape(act.dataset.k) : act.dataset.k) + '"]' : '') : null);
    app.innerHTML = vista === 'falte' ? vFalte() : vHoy();
    tabs.hidden = vista === 'falte';
    document.body.classList.toggle('contabs', vista !== 'falte');
    document.title = (vista === 'falte' ? 'Falté a…' : 'Hoy') + ' · NoVoy';
    if (nueva) { window.scrollTo(0, 0); const h = app.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
    else if (sel) { const el = app.querySelector(sel); if (el) el.focus({ preventScroll: true }); }
  }
  render(false);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
