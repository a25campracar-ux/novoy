/* NoVoy v2 · Pantallas Hoy (1.1), «Falté a…» (1.2) y Simular (1.6). La lógica está en hoy.js. */
(function () {
  'use strict';
  const NV = window.NV; if (!NV) return;
  const { C, Hd, esc, cap, largo, fecha, corto, horasTxt, HOY, ICON } = NV;
  const fmt = Hd.fmt;

  // ---------- piezas ----------
  function comprobado(n) {
    if (n == null) return '<p class="comp">' + ICON.info + '<span>Aún sin comparar con la lista de tu centro.</span></p>';
    const t = n <= 0 ? 'hoy' : n === 1 ? 'ayer' : 'hace ' + n + ' días';
    return '<p class="comp">' + ICON.shield + '<span>Comprobado con tu lista ' + t + '.</span></p>';
  }
  function semaforo(d, sinComp) {
    const s = d.semaforo;
    return '<section class="sem ' + s.status + '" aria-label="Semáforo"><div class="hero"><span class="light" aria-hidden="true"></span><p class="big">' + esc(s.titulo) + '</p></div>' +
      '<p class="frase">' + esc(s.frase) + '</p>' + (s.tono && !s.soloJust && s.frase !== s.tono ? '<p class="tono">' + esc(s.tono) + '</p>' : '') + (d.libre || sinComp ? '' : comprobado(d.comprobado)) + '</section>';
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
  NV.barras = barras;
  const ks = (hs) => esc(JSON.stringify(hs.map((x) => x.key)));
  function tarjeta(g, soloVer) {
    const times = g.horas.map((x) => x.start), meta = (times.length > 2 ? times[0] + ' a ' + g.horas[g.horas.length - 1].end : times.join(' y ')) + ' · ' + horasTxt(g.total);
    const otras = Array.from(new Set(g.horas.map((x) => x.subject).filter((s) => s !== g.name)));
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
    return '<article class="' + cls + '"><div class="top1"><div class="t"><h3 class="nm">' + esc(g.name) + '</h3><span class="meta">' + meta + (otras.length ? ' · incluye ' + esc(otras.join(', ')) : '') + '</span></div><div class="der">' + der + '</div></div>' + cuerpo + bts + '</article>';
  }
  function preguntaDia() {
    const p = Hd.sinApuntar(NV.user, HOY); if (!p.length) return '';
    const k = p[0], cuando = k === Hd.addDays(HOY, -1) ? 'Ayer' : 'El ' + largo(k);
    return '<section class="card preg"><p><b>' + cuando + ', ¿fuiste a todo?</b></p>' + (p.length > 1 ? '<p class="sub">Y ' + (p.length - 1) + (p.length === 2 ? ' día más' : ' días más') + ' sin apuntar.</p>' : '') +
      '<div class="bts"><button class="bfui" data-a="diafui" data-d="' + k + '">' + ICON.check + 'Sí, a todo</button><button class="bfal" data-a="falte" data-d="' + k + '">Falté a alguna</button></div></section>';
  }
  /** Un solo consejo a la vez: guardar la cuenta tras una semana (1.8) o instalarla en iPhone. */
  function consejo() {
    const u = NV.user, x = NV.ls.get('nv.consejo') || {}, ahora = Date.now(), dormido = (k) => x[k] && ahora - x[k] < 7 * 864e5;
    const semana = u.since && u.since <= Hd.addDays(HOY, -7);
    if (!u.acct && semana && !dormido('cuenta')) return '<section class="card consejo"><p><b>Guarda tus faltas en una cuenta</b></p><p class="sub">Si cambias de móvil o se borra, las recuperas. Sin correo.</p><div class="bts"><button class="bfui" data-ir="ajustes/cuenta">Crear cuenta</button><button class="bfal" data-a="dormir" data-v="cuenta">Ahora no</button></div></section>';
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), inst = window.matchMedia && matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (ios && !inst && !dormido('instalar')) return '<section class="card consejo"><p><b>Ponla en tu pantalla de inicio</b></p><p class="sub">En iPhone, si no la instalas, Safari puede borrar tus faltas.</p><div class="bts"><button class="bfui" data-ir="ajustes/instalar">Cómo</button><button class="bfal" data-a="dormir" data-v="instalar">Ahora no</button></div></section>';
    return '';
  }
  /** Semana de proyecto: un toque para activarla o quitarla (si el centro las hace). */
  function proyecto() {
    const cfg = NV.user.config; if (!cfg.proyecto || !window.NVAjustes) return '';
    const w = window.NVAjustes.semanasCurso(cfg, HOY).find((x) => x.actual), n = esc(cfg.proyecto.nombre);
    if (w && w.proyecto) return '<section class="card proj"><p><b>Semana de proyecto</b></p><p class="sub">Esta semana todas tus clases cuentan en ' + n + '.</p><button class="link" data-a="proyecto" data-v="0">No es de proyecto</button></section>';
    return '<button class="btn2" data-a="proyecto" data-v="1">Esta semana es de ' + n + '</button>';
  }
  function luego() {
    const l = Hd.empiezanLuego(NV.user, HOY); if (!l.length) return '';
    return '<p class="nota center">Empiezan más tarde: ' + l.map((x) => esc(x.name) + ' (' + fecha(x.desde) + ')').join(' · ') + '.</p>';
  }

  // ---------- Hoy ----------
  function vHoy() {
    const d = Hd.dia(NV.user, HOY);
    let h = '<header class="hd"><div><h1 tabindex="-1">Hoy</h1><span class="sub">' + cap(largo(HOY)) + (d.trimestre ? ' · ' + esc(d.trimestre) : '') + '</span></div><button class="btn2 auto ico" data-ir="simular">' + ICON.sim + 'Simular</button></header>';
    h += preguntaDia() + semaforo(d);
    const pj = d.libre ? '' : proyecto();
    if (pj.indexOf('card proj') >= 0) h += pj; // semana de proyecto activa: se ve antes que las tarjetas
    if (!d.libre) {
      h += d.pendientes.length ? '<div class="acc"><button class="btn2" data-a="todo">Falté todo el día</button><button class="btn2" data-a="falte">Falté a…</button></div>'
        : '<div class="acc uno"><button class="btn2" data-a="falte">Cambiar lo de hoy</button></div>';
      h += '<p class="cap">Hoy tienes</p><div class="stack">' + d.grupos.map((g) => tarjeta(g)).join('') + '</div>';
      if (d.grupos.filter((g) => g.hPend > 0).length > 1) h += '<button class="link" data-a="fuitodo">Fui a todas</button>';
      if (pj.indexOf('card proj') < 0) h += pj;
    } else if (d.proximo) {
      h += '<p class="cap">Si faltas el ' + largo(d.proximo.date) + '</p><div class="stack">' + d.proximo.grupos.map((g) => tarjeta(g, true)).join('') + '</div>';
    }
    return h + luego() + consejo();
  }
  const leerK = (el) => { try { return JSON.parse(el.dataset.k); } catch (e) { return []; } };
  const nombre = (el) => ((el.closest('.tj') && el.closest('.tj').querySelector('.nm')) || {}).textContent || '';
  NV.pantallas.hoy = {
    vista: vHoy,
    acciones: {
      fui: (el) => NV.aplicar(Hd.fijar(NV.user, HOY, Hd.todas(leerK(el), 'fui')), 'Apuntado: fuiste a ' + nombre(el)),
      falta: (el) => { const r = Hd.fijar(NV.user, HOY, Hd.todas(leerK(el), 'falta')); NV.aplicar(r, 'Falta apuntada: ' + nombre(el) + ', ' + horasTxt(r.horas || 0)); },
      quitar: (el) => NV.aplicar(Hd.fijar(NV.user, HOY, Hd.todas(leerK(el), null)), 'Quitado lo de ' + nombre(el)),
      todo: () => { const r = Hd.todoElDia(NV.user, HOY); NV.aplicar(r, 'Todo el día apuntado: ' + horasTxt(r.horas || 0)); },
      fuitodo: () => NV.aplicar(Hd.fuiATodo(NV.user, HOY), 'Apuntado: fuiste a todas'),
      diafui: (el) => NV.aplicar(Hd.fuiATodo(NV.user, el.dataset.d), 'Apuntado: el ' + largo(el.dataset.d) + ' fuiste a todo'),
      falte: (el) => abrirFalte(el.dataset.d || HOY),
      proyecto: (el) => { const on = el.dataset.v === '1', r = window.NVAjustes.marcarProyecto(NV.user, HOY, on); NV.aplicar(r, on ? 'Semana de proyecto: todo cuenta en ' + NV.user.config.proyecto.nombre : 'Semana normal otra vez'); },
      dormir: (el) => { const x = NV.ls.get('nv.consejo') || {}; x[el.dataset.v] = Date.now(); NV.ls.set('nv.consejo', x); NV.render(); }
    }
  };

  // ---------- Falté a… ----------
  let fx = null; // { date, sel: { clave: 'falta'|'retraso' }, just, tarde, otro }
  function abrirFalte(date, sinNavegar) {
    const cl = Hd.clases(NV.user, date || HOY); if (!cl.length) { NV.aviso('Ese día no tienes clase.'); return; }
    fx = { date: date || HOY, sel: {}, just: false, tarde: false, otro: false };
    cl.forEach((b) => b.horas.forEach((x) => { if (x.marca && x.marca.tipo !== 'fui') { fx.sel[x.key] = x.marca.tipo; if (x.marca.justified) fx.just = true; if (x.marca.tipo === 'retraso') fx.tarde = true; } }));
    if (sinNavegar) NV.render(true); else NV.ir('falte');
  }
  NV.abrirFalte = abrirFalte;
  function cuentaSel() {
    let h = 0, r = 0; const cl = Hd.clases(NV.user, fx.date);
    cl.forEach((b) => b.horas.forEach((x) => { if (fx.sel[x.key] === 'falta') h += x.hours; else if (fx.sel[x.key] === 'retraso') r++; }));
    return { h: Math.round(h * 100) / 100, r, cl };
  }
  function vFalte() {
    if (!fx) fx = { date: HOY, sel: {}, just: false, tarde: false, otro: false };
    const { h, r, cl } = cuentaSel(), dias = Hd.diasRecientes(NV.user, HOY, 8), hoy = fx.date === HOY;
    if (dias.indexOf(fx.date) < 0) dias.push(fx.date);
    const yaHabia = cl.some((b) => b.horas.some((x) => x.marca));
    const ini = (NV.user.config.terms || []).reduce((m, t) => (!m || t.from < m ? t.from : m), '');
    let out = '<div class="top"><button class="back" data-a="cerrar" aria-label="Volver">' + ICON.back + '</button></div>';
    out += '<div><p class="sub">' + cap(largo(fx.date)) + '</p><h1 tabindex="-1">' + (hoy ? '¿A qué clases has faltado?' : '¿A qué clases faltaste?') + '</h1></div>';
    out += '<div class="dias" role="radiogroup" aria-label="Día">' + dias.map((k) => '<button class="seg" role="radio" aria-checked="' + (k === fx.date) + '" data-a="dia" data-d="' + k + '">' + corto(k) + '</button>').join('') +
      '<button class="seg" data-a="otro" aria-expanded="' + fx.otro + '">Otro día</button></div>';
    if (fx.otro) out += '<div class="field"><label for="otrodia">¿Qué día?</label><input id="otrodia" class="input" type="date" data-a="otrodia" min="' + ini + '" max="' + HOY + '" value="' + fx.date + '"></div>';
    if (!cl.length) out += '<div class="card"><p>Ese día no tienes clase.</p></div>';
    out += '<div class="stack">' + cl.map((b, i) => {
      const fal = b.horas.filter((x) => fx.sel[x.key] === 'falta'), on = fal.length > 0, tarde = fx.sel[b.horas[0].key] === 'retraso';
      let x = '<div class="blq"><button class="clase" aria-pressed="' + on + '" data-a="tg" data-b="' + i + '"><span class="hora">' + b.start + '</span><span class="t"><b>' + esc(b.name) + '</b><small>' + horasTxt(b.hours) + (b.subject !== b.name ? ' · ' + esc(b.subject) : '') + (on && fal.length < b.horas.length ? ' · faltaste ' + horasTxt(fal.reduce((a, y) => a + y.hours, 0)) : '') + '</small></span><span class="box" aria-hidden="true">' + (on ? ICON.check : '') + '</span></button>';
      if (on && b.horas.length > 1) x += '<div class="subs" role="group" aria-label="Horas de ' + esc(b.name) + '">' + b.horas.map((y) => '<button class="seg" aria-pressed="' + (fx.sel[y.key] === 'falta') + '" data-a="th" data-k="' + esc(y.key) + '">' + y.start + '</button>').join('') + '</div>';
      if (fx.tarde && !on) x += '<div class="subs"><button class="seg" aria-pressed="' + tarde + '" data-a="tarde" data-b="' + i + '">Llegué tarde</button></div>';
      return x + '</div>';
    }).join('') + '</div>';
    if (cl.length) {
      out += '<div class="row wrap"><button class="btn2 auto" data-a="todas">Falté a todas</button>' + (fx.tarde ? '' : '<button class="btn2 auto" data-a="vertarde">Llegué tarde a una</button>') + '</div>';
      out += '<label class="toggle"><input type="checkbox" data-a="just"' + (fx.just ? ' checked' : '') + '><span>Tengo justificante</span></label>';
      const cta = h > 0 ? 'Apuntar ' + horasTxt(h) + (r ? ' y ' + r + (r === 1 ? ' retraso' : ' retrasos') : '') : r ? 'Apuntar ' + (r === 1 ? 'el retraso' : r + ' retrasos') : yaHabia ? 'No falté a nada' : 'No he faltado';
      out += '<div class="foot"><button class="btn" data-a="guardar">' + cta + '</button><button class="link" data-a="cerrar">Cancelar</button></div>';
    }
    return out;
  }
  function cuentaDia(date) { let h = 0, r = 0; (NV.user.faltas || []).forEach((f) => { if (f.date !== date) return; if (f.type === 'retraso') r++; else h += +f.hours || 0; }); return { h: Math.round(h * 100) / 100, r }; }
  function guardarFalte() {
    const cl = Hd.clases(NV.user, fx.date), sel = {};
    cl.forEach((b) => b.horas.forEach((x) => { sel[x.key] = fx.sel[x.key] || 'fui'; }));
    const r = Hd.fijar(NV.user, fx.date, sel, { justificada: fx.just });
    if (r.error) return NV.aviso(r.error);
    const prev = NV.user, date = fx.date; NV.user = r.user; NV.guardar(); fx = null; NV.atras('hoy');
    const n = cuentaDia(date);
    NV.aviso(n.h > 0 || n.r > 0 ? (date === HOY ? 'Apuntado' : 'Apuntado el ' + largo(date)) + ': ' + (n.h > 0 ? horasTxt(n.h) : '') + (n.h > 0 && n.r ? ' y ' : '') + (n.r ? n.r + (n.r === 1 ? ' retraso' : ' retrasos') : '') : 'Apuntado: fuiste a todo', () => { NV.user = prev; NV.guardar(); NV.render(); });
  }
  const toque = (fn) => (el) => { const cl = Hd.clases(NV.user, fx.date); fn(el, cl); NV.render(false); };
  NV.pantallas.falte = {
    vista: vFalte, tabs: false, tab: 'hoy',
    acciones: {
      cerrar: () => { fx = null; NV.atras('hoy'); },
      dia: (el) => { const k = el.dataset.d; abrirFalte(k, true); },
      otro: () => { fx.otro = !fx.otro; NV.render(false, fx.otro ? '#otrodia' : null); },
      tg: toque((el, cl) => { const b = cl[+el.dataset.b], on = b.horas.some((x) => fx.sel[x.key] === 'falta'); b.horas.forEach((x) => { if (on) delete fx.sel[x.key]; else fx.sel[x.key] = 'falta'; }); }),
      th: toque((el) => { const k = el.dataset.k; if (fx.sel[k] === 'falta') delete fx.sel[k]; else fx.sel[k] = 'falta'; }),
      tarde: toque((el, cl) => { const b = cl[+el.dataset.b], k = b.horas[0].key, ya = fx.sel[k] === 'retraso'; b.horas.forEach((x) => delete fx.sel[x.key]); if (!ya) fx.sel[k] = 'retraso'; }),
      todas: toque((el, cl) => { const all = cl.every((b) => b.horas.every((x) => fx.sel[x.key] === 'falta')); cl.forEach((b) => b.horas.forEach((x) => { if (all) delete fx.sel[x.key]; else fx.sel[x.key] = 'falta'; })); }),
      vertarde: (el) => { fx.tarde = true; NV.render(false, '.clase'); },
      guardar: guardarFalte
    },
    cambios: {
      just: (el) => { fx.just = el.checked; },
      otrodia: (el) => { const k = el.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return; if (k > HOY) return NV.aviso('Solo puedes apuntar hasta hoy.'); if (!Hd.clases(NV.user, k).length) return NV.aviso('Ese día no tienes clase.'); abrirFalte(k, true); }
    }
  };

  // ---------- Simular (1.6) ----------
  let sim = { date: null, just: false };
  function vSim() {
    const dias = Hd.diasSiguientes(NV.user, HOY, 10);
    if (!sim.date || dias.indexOf(sim.date) < 0) sim.date = dias[0] || HOY;
    const d = Hd.dia(NV.user, sim.date, { justificada: sim.just });
    let h = '<div class="top"><button class="back" data-a="cerrar" aria-label="Volver">' + ICON.back + '</button></div>';
    h += '<div><p class="sub">Simulador</p><h1 tabindex="-1">¿Y si falto el ' + largo(sim.date) + '?</h1></div>';
    h += '<div class="dias" role="radiogroup" aria-label="Día">' + dias.map((k) => '<button class="seg" role="radio" aria-checked="' + (k === sim.date) + '" data-a="dia" data-d="' + k + '">' + corto(k) + '</button>').join('') + '</div>';
    h += '<label class="toggle"><input type="checkbox" data-a="just"' + (sim.just ? ' checked' : '') + '><span>Tendré justificante</span></label>';
    if (!dias.length) return h + '<div class="card"><p>No quedan días de clase en este curso.</p></div>';
    h += semaforo(d, true);
    if (!d.libre) h += '<p class="cap">Ese día tienes</p><div class="stack">' + d.grupos.map((g) => tarjeta(Object.assign({}, g, { pendientes: g.horas, hPend: g.total, estado: 'pendiente' }), true)).join('') + '</div>';
    return h + '<p class="nota center">Simular no apunta nada.</p>';
  }
  NV.pantallas.simular = {
    vista: vSim, tabs: false, tab: 'hoy',
    acciones: { cerrar: () => NV.atras('hoy'), dia: (el) => { sim.date = el.dataset.d; NV.render(false); } },
    cambios: { just: (el) => { sim.just = el.checked; NV.render(false, '[data-a="just"]'); } }
  };
})();
