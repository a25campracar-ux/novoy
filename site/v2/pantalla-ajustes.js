/* NoVoy v2 · Ajustes (1.4) con PROJ por clase (1.5), casos de mitad de curso (1.11), enlace de clase (1.7),
   cuenta (1.8) e instalar. Cambiar horario, calendario, reglas o pasar la lista usan los mismos pasos del alta
   (alta.html?editar=…). La lógica está en ajustes.js y cuenta.js. */
(function () {
  'use strict';
  const NV = window.NV; if (!NV) return;
  const { C, Hd, esc, fecha, horasTxt, HOY, ICON } = NV;
  const AJ = window.NVAjustes, R = window.NVReglas, H = window.NVHorario;
  const DIA = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };
  const COLORS = ['#4ADE80', '#60A5FA', '#FBBF24', '#C084FC', '#F472B6', '#2DD4BF', '#FB923C', '#A3E635', '#F87171', '#94A3B8', '#38BDF8', '#E879F9'];
  const conHoy = (u) => u + (NV.HOY !== C.ymd(new Date()) ? (u.indexOf('?') < 0 ? '?' : '&') + 'hoy=' + HOY : '');
  const ui = { abierto: {}, modo: 'crear', usuario: null, cerrar: false, borrar: false, carga: null, err: '' };

  const top = (atras) => '<div class="top"><button class="back" data-a="atras" data-v="' + (atras || '') + '" aria-label="Atrás">' + ICON.back + '</button></div>';
  const li = (titulo, sub, ir, href, extra) => (href ? '<a class="li ir" href="' + esc(href) + '">' : '<button class="li ir" data-ir="' + esc(ir) + '">') + '<span class="t"><b>' + esc(titulo) + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + (extra || '') + ICON.next + (href ? '</a>' : '</button>');
  const todas = (cfg) => { const s = AJ.asignaturas(cfg); (cfg.periods || []).forEach((p) => { if (p.todo && s.indexOf(p.todo) < 0) s.push(p.todo); }); return s; };
  const corto = (s) => { const w = String(s).trim().split(/[\s.]+/).filter(Boolean); return w.length > 1 ? w.map((x) => x[0]).join('').slice(0, 4).toUpperCase() : String(s).slice(0, 5); };

  // ---------- principal ----------
  function principal() {
    const u = NV.user, cfg = u.config, st = u.settings || {}, sem = H.horasSemana(cfg.schedule), nh = Object.values(sem).reduce((a, b) => a + b, 0);
    let regla = '';
    try { const s = Object.assign({}, st, { ambito: st.ambitoElegido || st.ambito, limites: C.limitsOf(st), aproximado: st.aproximado || [] }); regla = esc(R.resumen(s).principal); } catch (e) { regla = ''; }
    const fest = (cfg.holidays || []).length, libres = st.libresPendientes ? ' · <span class="q amarillo">faltan los días de libre disposición</span>' : '';
    const esp = Object.keys(cfg.vigencia || {}).length + (cfg.periods || []).length + AJ.cuentas(cfg).length + Object.keys(st.porAsignatura || {}).length;
    const cuenta = u.acct ? 'Guardada como ' + esc(u.acct.u) + (u.acct.err ? ' · <span class="q rojo">sin guardar</span>' : '') : 'Sin cuenta: si cambias de móvil, lo pierdes';
    let h = '<header class="hd"><div><h1 tabindex="-1">Ajustes</h1><span class="sub">' + esc((cfg.catalog && cfg.catalog.centre && cfg.catalog.centre.name) || cfg.center || '') + '</span></div></header>';
    h += '<p class="cap">Tu clase</p><div class="list">' +
      li('Horario', nh + ' h a la semana' + ((cfg.periods || []).length ? ' · semanas especiales' : ''), 'ajustes/horario') +
      li('Asignaturas', esp ? esp + ' casos especiales' : 'Contar o no, proyectos, fechas y reglas propias', 'ajustes/asig') +
      li('Reglas de faltas', regla, null, conHoy('alta.html?editar=reglas')) +
      li('Calendario', (cfg.terms || []).length + ' trimestres · ' + fest + ' festivos' + libres, null, conHoy('alta.html?editar=calendario')) + '</div>';
    h += '<p class="cap">Tus faltas</p><div class="list">' + li('Pasar mi lista de faltas', 'Pegándola, con capturas o con una IA', null, conHoy('alta.html?editar=faltas')) + '</div>';
    h += '<p class="cap">Compartir y guardar</p><div class="list">' + li('Pásalo a tu clase', 'Tus compañeros solo confirman el horario', 'ajustes/clase') + li('Tu cuenta', cuenta, 'ajustes/cuenta') + li('Ponla en tu pantalla de inicio', 'Se abre como una app', 'ajustes/instalar') + '</div>';
    h += '<p class="cap">Sobre NoVoy</p><div class="list">' + li('Aviso legal y privacidad', 'La cifra oficial es la de tu centro', null, 'legal.html') + li('Borrar todo', 'Empezar de cero en este móvil', 'ajustes/borrar') + '</div>';
    return h;
  }

  // ---------- horario y semanas especiales ----------
  function rejilla(cfg) {
    const hz = H.deHorario(cfg.schedule || {}), subs = AJ.asignaturas(cfg), col = (s) => COLORS[subs.indexOf(s) % COLORS.length];
    let h = '<div class="tt view" aria-hidden="true"><span></span>' + H.DIAS.map((x) => '<span class="d">' + H.CORTO[x] + '</span>').join('');
    hz.rows.forEach((r, i) => { h += '<span class="h">' + esc(r.start) + '</span>' + H.DIAS.map((x) => { const s = (hz.grid[x] || {})[i]; return '<span class="c' + (s ? ' f' : '') + '"' + (s ? ' style="background:' + col(s) + '"' : '') + '>' + (s ? esc(corto(s)) : '') + '</span>'; }).join(''); });
    return h + '</div><div class="chips">' + subs.map((s) => '<span class="row" style="gap:6px;font-size:13px;color:var(--tx2)"><span class="dot" style="background:' + col(s) + '"></span>' + esc(corto(s) + ' · ' + s) + '</span>').join('') + '</div>';
  }
  function horario() {
    const cfg = NV.user.config, ps = cfg.periods || [];
    let h = top() + '<h1 tabindex="-1">Tu horario</h1><div class="card">' + rejilla(cfg) + '</div>';
    h += '<a class="btn" href="' + conHoy('alta.html?editar=horario') + '">Cambiar horario</a>';
    h += proyecto(cfg);
    h += '<h2>Otras semanas con otro horario</h2><p class="sub">Si alguna semana todas las clases son de una sola asignatura.</p>';
    if (ps.some((p) => !p.proyecto)) h += '<div class="list">' + ps.map((p, i) => p.proyecto ? '' : '<div class="li"><span class="t"><b>' + esc(p.todo || p.label || 'Otro horario') + '</b><small>Del ' + fecha(p.from) + ' al ' + fecha(p.to) + (p.todo ? ': todas las clases' : '') + '</small></span><button class="link" data-a="quitarSem" data-v="' + i + '" aria-label="Quitar las semanas de ' + esc(p.todo || '') + '">Quitar</button></div>').join('') + '</div>';
    if (ui.abierto.sem) h += '<form class="card stack" data-f="semanas"><div class="grid2"><div class="field"><label for="sf">Primer día</label><input id="sf" name="from" class="input" type="date" required></div><div class="field"><label for="st">Último día</label><input id="st" name="to" class="input" type="date" required></div></div>' +
      '<div class="field"><label for="sx">Esos días todo es de</label><input id="sx" name="todo" class="input" list="subs" placeholder="Ej.: Proyecto" autocomplete="off" required><datalist id="subs">' + todas(cfg).map((s) => '<option value="' + esc(s) + '">').join('') + '</datalist></div>' + err() + '<button class="btn2">Añadir</button></form>';
    else h += '<button class="btn2" data-a="abre" data-v="sem">Añadir semanas con otro horario</button>';
    return h;
  }

  // ---------- semanas de proyecto: un toque por semana ----------
  function proyecto(cfg) {
    let h = '<h2 id="proyecto">Semanas de proyecto</h2>';
    if (!cfg.proyecto) {
      h += '<p class="sub">Si tu centro hace semanas de proyecto, esas semanas todas tus clases cuentan en el proyecto. Las faltas que pongan en PROJ el resto del curso van al módulo de esa hora.</p>';
      if (ui.abierto.proj) h += '<form class="card stack" data-f="proyecto"><div class="field"><label for="pn">¿Cómo se llama en tu centro?</label><input id="pn" name="nombre" class="input" value="PROJ" autocomplete="off" maxlength="40"></div>' + err() + '<button class="btn2">Activar</button></form>';
      else h += '<button class="btn2" data-a="abre" data-v="proj">Mi centro hace semanas de proyecto</button>';
      return h;
    }
    const sem = AJ.semanasCurso(cfg, HOY), n = sem.filter((w) => w.proyecto).length;
    h += '<p class="sub">Toca las semanas que han sido (o serán) de <b>' + esc(cfg.proyecto.nombre) + '</b>. Sus faltas se mueven solas. ' + (n ? n + (n === 1 ? ' semana marcada.' : ' semanas marcadas.') : 'Ninguna marcada.') + '</p>';
    h += '<div class="semanas" role="group" aria-label="Semanas del curso">' + sem.map((w) => '<button class="seg" aria-pressed="' + w.proyecto + '" data-a="semProj" data-d="' + w.lunes + '" aria-label="Semana del ' + fecha(w.lunes) + (w.actual ? ', esta semana' : '') + '">' + fecha(w.lunes) + (w.actual ? '<small>esta</small>' : '') + '</button>').join('') + '</div>';
    return h + '<button class="link" data-a="sinProj">Mi centro no hace semanas de proyecto</button>';
  }

  // ---------- asignaturas ----------
  function asignaturas() {
    const u = NV.user, cfg = u.config, nc = cfg.nocount || [], vig = cfg.vigencia || {}, own = (u.settings || {}).porAsignatura || {}, cu = AJ.cuentas(cfg);
    let h = top() + '<h1 tabindex="-1">Asignaturas</h1><p class="lead">Toca una para cambiar cómo cuenta.</p><div class="list">';
    h += todas(cfg).map((s) => {
      const x = [];
      if (nc.indexOf(s) >= 0) x.push('No cuenta');
      const c = Array.from(new Set(cu.filter((y) => y.subject === s).map((y) => y.cuenta))); if (c.length) x.push('Cuenta en ' + c.join(' y '));
      if (vig[s] && vig[s].desde) x.push('Empieza el ' + fecha(vig[s].desde)); if (vig[s] && vig[s].hasta) x.push('Acaba el ' + fecha(vig[s].hasta));
      if (own[s]) x.push('Regla propia: ' + own[s].limites.map((l) => l.pct + ' %').join(' y '));
      return li(s, esc(x.join(' · ') || 'Normal'), 'ajustes/asig/' + s);
    }).join('');
    return h + '</div><div class="card stack"><p class="sub" style="color:var(--tx2)"><b>¿Proyecto (PROJ)?</b> No lo añadas como asignatura. Marca sus semanas en Horario, con un toque por semana.</p><button class="btn2" data-ir="ajustes/horario">Semanas de proyecto</button></div><p class="nota">¿Te sobra o te falta una asignatura? Cámbialo en «Horario».</p>';
  }
  function asignatura(s) {
    const u = NV.user, cfg = u.config, otras = todas(cfg).filter((x) => x !== s), cuenta = (cfg.nocount || []).indexOf(s) < 0;
    const hs = AJ.horasDe(cfg, s), v = (cfg.vigencia || {})[s] || {}, own = ((u.settings || {}).porAsignatura || {})[s];
    let h = top('asig') + '<p class="sub">Asignatura</p><h1 tabindex="-1">' + esc(s) + '</h1>';
    // contar o no
    h += '<label class="toggle card"><input type="checkbox" data-a="contar"' + (cuenta ? ' checked' : '') + '><span class="t"><b>Contar sus faltas</b><br><small class="sub">Quítalo si no la cursas, la tienes convalidada o no cuenta faltas, como la tutoría.</small></span></label>';
    // «cuenta dentro de» por hora: ya no se ofrece (el proyecto no se configura: sus faltas van al módulo de esa hora);
    // solo se enseña a quien ya lo tenía puesto, para que pueda quitarlo
    if (hs.some((x) => x.cuenta)) {
      const algun = true;
      h += '<section class="card stack"><p><b>¿Sus clases cuentan dentro de otra asignatura?</b></p><p class="sub">Pasa con el proyecto: cada hora cuenta en el módulo del profesor que la da.</p>';
      if (algun || ui.abierto.cuenta) h += hs.map((x) => '<div class="row"><label class="grow" for="cu' + x.dia + x.start.replace(':', '') + '">' + DIA[x.dia] + ' ' + x.start + '</label><select id="cu' + x.dia + x.start.replace(':', '') + '" class="input sel" data-a="cuenta" data-d="' + x.dia + '" data-v="' + x.start + '"><option value="">' + esc(s) + ' (aparte)</option>' + otras.map((o) => '<option' + (x.cuenta === o ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></div>').join('');
      else h += '<button class="btn2" data-a="abre" data-v="cuenta">Sí, elegir en qué cuenta cada hora</button>';
      h += '</section>';
    }
    // 1.11: fechas
    const tieneF = v.desde || v.hasta;
    h += '<section class="card stack"><p><b>¿Empieza más tarde o acaba antes?</b></p>';
    if (tieneF || ui.abierto.fechas) h += '<form class="stack" data-f="fechas"><div class="grid2"><div class="field"><label for="fd">Empieza el</label><input id="fd" name="desde" class="input" type="date" value="' + esc(v.desde || '') + '"></div><div class="field"><label for="fh">Acaba el</label><input id="fh" name="hasta" class="input" type="date" value="' + esc(v.hasta || '') + '"></div></div>' +
      '<div class="field"><label for="fa">Mientras no empieza, sus horas son de</label><select id="fa" name="antes" class="input"><option value="">Nadie (no hay clase)</option>' + otras.map((o) => '<option' + (v.antes === o ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></div>' +
      '<p class="sub">Su límite se calcula solo con las horas de ese periodo.</p>' + err() + '<button class="btn2">Guardar fechas</button>' + (tieneF ? '<button type="button" class="link" data-a="sinFechas">Quitar las fechas</button>' : '') + '</form>';
    else h += '<p class="sub">Si dura todo el curso, no hagas nada.</p><button class="btn2" data-a="abre" data-v="fechas">Poner fechas</button>';
    h += '</section>';
    // 1.11: regla propia
    h += '<section class="card stack"><p><b>¿Tiene una regla de faltas propia?</b></p>';
    if (own || ui.abierto.regla) {
      const l = own ? own.limites[0] : { pct: 25, sin: 1, just: 1 }, pct = ui.pct != null ? ui.pct : l.pct, cu2 = ui.cu != null ? ui.cu : (l.just > 0 ? 'todas' : 'sin');
      h += '<div class="pcts" role="radiogroup" aria-label="Porcentaje">' + [10, 15, 20, 25].map((p) => '<button class="seg" role="radio" aria-checked="' + (+pct === p) + '" data-a="pct" data-v="' + p + '">' + p + ' %</button>').join('') + '</div>' +
        '<div class="grid2" role="radiogroup" aria-label="Qué faltas cuentan"><button class="seg" role="radio" aria-checked="' + (cu2 === 'todas') + '" data-a="cu" data-v="todas">Todas</button><button class="seg" role="radio" aria-checked="' + (cu2 === 'sin') + '" data-a="cu" data-v="sin">Solo sin justificante</button></div>' +
        '<button class="btn2" data-a="guardaRegla">Guardar regla propia</button>' + (own ? '<button class="link" data-a="sinRegla">Usar la regla general</button>' : '');
    } else h += '<p class="sub">Normalmente no. Algunos centros ponen otra al proyecto.</p><button class="btn2" data-a="abre" data-v="regla">Poner una regla propia</button>';
    return h + '</section>';
  }

  // ---------- pásalo a tu clase (1.7) ----------
  function clase() {
    const url = AJ.enlaceClase(NV.user.config, location.origin + location.pathname.replace(/[^/]*$/, ''));
    let h = top() + '<h1 tabindex="-1">Pásalo a tu clase</h1>';
    if (!url) return h + '<div class="card"><p>Para compartir hace falta tu instituto, tu ciclo y tu turno. Vuelve a hacer el alta para ponerlos.</p></div>';
    h += '<p class="lead">Con este enlace, tus compañeros entran con tu instituto, tu ciclo y tu turno ya puestos y solo confirman el horario.</p>' +
      '<div class="card"><p class="sub" style="color:var(--tx2)">No lleva tus faltas ni nada tuyo. Si alguien ya usa NoVoy, no le cambia nada.</p></div>' +
      '<button class="btn" data-a="compartir" data-v="' + esc(url) + '">' + ICON.share + 'Compartir el enlace</button>' +
      '<div class="field"><label for="url">Enlace</label><input id="url" class="input" readonly value="' + esc(url) + '"></div>';
    return h;
  }

  // ---------- cuenta (1.8) ----------
  const err = () => (ui.err ? '<div class="card bad" role="alert"><p>' + esc(ui.err) + '</p></div>' : '');
  const checks = (p) => '<ul class="checks" id="checks">' + window.FTAcct.passChecks(window.FTAcct.cleanPass(p || '')).map((c) => '<li class="' + (c[1] ? 'ok' : '') + '">' + (c[1] ? '✓ ' : '· ') + esc(c[0]) + '</li>').join('') + '</ul>';
  function cuenta() {
    const u = NV.user, A = window.FTAcct;
    let h = top() + '<h1 tabindex="-1">Tu cuenta</h1>';
    if (ui.carga) {
      const e = ui.carga.estado, n = (e.faltas || []).length;
      return h + '<div class="card stack"><p><b>En tu cuenta hay un horario y ' + n + (n === 1 ? ' falta' : ' faltas') + ' guardados.</b></p><p class="sub" style="color:var(--tx2)">Si los cargas, lo de este móvil se sustituye por lo de la cuenta.</p></div>' +
        '<div class="foot"><button class="btn" data-a="cargar">Cargar lo de la cuenta</button><button class="btn2" data-a="noCargar">Cancelar</button></div>';
    }
    if (u.acct) {
      const t = u.acct.t ? Math.max(0, Math.round((Date.now() - u.acct.t) / 60000)) : null;
      h += '<div class="list"><div class="kv"><span>Usuario</span><b>' + esc(u.acct.u) + '</b></div><div class="kv"><span>Guardado</span><b>' + (u.acct.err ? 'No se pudo' : t == null ? '—' : t < 1 ? 'Ahora' : t < 60 ? 'Hace ' + t + ' min' : 'Hace ' + Math.round(t / 60) + ' h') + '</b></div></div>';
      if (u.acct.err === 'sesion') h += '<div class="card bad"><p>La contraseña ha cambiado en otro móvil. Cierra sesión y vuelve a entrar.</p></div>';
      h += '<p class="sub">Se guarda sola, cifrada, cada vez que cambias algo. Para entrar en otro móvil: «Ya tengo cuenta» al empezar.</p>';
      h += '<button class="btn2" data-a="subir">Guardar ahora</button>';
      if (ui.cerrar) h += '<div class="card amb stack"><p><b>¿Cerrar sesión?</b></p><p class="sub" style="color:var(--tx2)">Tus datos se quedan en este móvil. Para volver a entrar necesitarás tu contraseña.</p><div class="grid2"><button class="seg" data-a="cerrarSi">Cerrar sesión</button><button class="seg" data-a="cerrarNo">Cancelar</button></div></div>';
      else h += '<button class="link" data-a="cerrar">Cerrar sesión</button>';
      if (ui.borrarC) h += '<div class="card bad stack"><p><b>¿Borrar tu cuenta del servidor?</b></p><p class="sub" style="color:var(--tx2)">Se borra la copia cifrada. Lo de este móvil se queda.</p><div class="grid2"><button class="seg" data-a="borrarCSi">Borrar la cuenta</button><button class="seg" data-a="borrarCNo">Cancelar</button></div></div>';
      else h += '<button class="link" data-a="borrarC">Borrar mi cuenta</button>';
      return h;
    }
    if (!ui.usuario) ui.usuario = A.genUser();
    h += '<p class="lead">Guarda tu horario y tus faltas cifrados. Con tu usuario y tu contraseña los recuperas en otro móvil. Sin correo.</p>';
    h += '<div class="grid2" role="radiogroup" aria-label="Cuenta"><button class="seg" role="radio" aria-checked="' + (ui.modo === 'crear') + '" data-a="modo" data-v="crear">Crear cuenta</button><button class="seg" role="radio" aria-checked="' + (ui.modo === 'entrar') + '" data-a="modo" data-v="entrar">Ya tengo una</button></div>';
    if (ui.modo === 'crear') {
      h += '<form class="stack" data-f="crear" autocomplete="on"><div class="field"><label for="cu">Usuario</label><div class="row"><input id="cu" name="username" class="input grow" autocomplete="username" autocapitalize="off" spellcheck="false" value="' + esc(ui.usuario) + '"><button type="button" class="seg" data-a="otroUser" style="min-width:72px">Otro</button></div></div>' +
        '<div class="field"><label for="cp">Contraseña</label><input id="cp" name="password" type="password" class="input" autocomplete="new-password" data-a="pass"></div>' + checks('') +
        '<div class="field"><label for="cp2">Repítela</label><input id="cp2" type="password" class="input" autocomplete="new-password"></div>' +
        '<div class="card amb"><p class="sub" style="color:var(--tx2)">Apúntala o deja que la guarde tu móvil: sin correo no se puede recuperar.</p></div>' + err() + '<button class="btn">Crear cuenta</button></form>';
    } else {
      h += '<form class="stack" data-f="entrar" autocomplete="on"><div class="field"><label for="eu">Usuario</label><input id="eu" name="username" class="input" autocomplete="username" autocapitalize="off" spellcheck="false"></div>' +
        '<div class="field"><label for="ep">Contraseña</label><input id="ep" name="password" type="password" class="input" autocomplete="current-password"></div>' + err() + '<button class="btn">Entrar</button></form>';
    }
    return h;
  }

  function instalar() {
    return top() + '<h1 tabindex="-1">Ponla en tu pantalla de inicio</h1><p class="lead">Así se abre como una app y tus datos no se borran.</p>' +
      '<h2>En iPhone (Safari)</h2><ol class="pasos"><li>Toca el botón de compartir (el cuadrado con la flecha).</li><li>Toca «Añadir a pantalla de inicio».</li><li>Toca «Añadir».</li></ol>' +
      '<h2>En Android (Chrome)</h2><ol class="pasos"><li>Toca el menú (los tres puntos).</li><li>Toca «Instalar aplicación» o «Añadir a pantalla de inicio».</li></ol>';
  }
  function borrar() {
    return top() + '<h1 tabindex="-1">Borrar todo</h1><div class="card bad stack"><p><b>Se borran de este móvil tu horario, tus reglas y tus faltas.</b></p><p class="sub" style="color:var(--tx2)">' + (NV.user.acct ? 'Tu cuenta no se toca: podrás volver a entrar con tu usuario y contraseña.' : 'No tienes cuenta: no se podrá recuperar.') + '</p></div>' +
      '<div class="foot"><button class="btn peligro" data-a="borrarSi">Borrar todo</button><button class="btn2" data-a="atras">Cancelar</button></div>';
  }

  function vista(r) {
    if (r.raw !== ui.ruta) { ui.ruta = r.raw; limpiar(); }
    const s = r.sub;
    if (s[0] === 'horario') return horario();
    if (s[0] === 'asig') return s[1] ? asignatura(s.slice(1).join('/')) : asignaturas();
    if (s[0] === 'clase') return clase();
    if (s[0] === 'cuenta') return cuenta();
    if (s[0] === 'instalar') return instalar();
    if (s[0] === 'borrar') return borrar();
    return principal();
  }
  const sub = () => NV.ruta().sub;
  const cfgA = (cfg, msg) => NV.aplicar(Object.assign({}, NV.user, { config: cfg }), msg);
  const limpiar = () => { ui.abierto = {}; ui.err = ''; ui.pct = ui.cu = null; ui.cerrar = false; ui.borrarC = false; };

  NV.pantallas.ajustes = {
    vista,
    acciones: {
      atras: (el) => NV.atras(el.dataset.v ? 'ajustes/' + el.dataset.v : 'ajustes'),
      abre: (el) => { ui.abierto[el.dataset.v] = true; ui.err = ''; NV.render(false); },
      quitarSem: (el) => cfgA(AJ.quitarSemanas(NV.user.config, +el.dataset.v), 'Semanas quitadas'),
      semProj: (el) => { const on = el.getAttribute('aria-pressed') !== 'true', r = AJ.marcarProyecto(NV.user, el.dataset.d, on); NV.aplicar(r, (on ? 'Semana del ' + fecha(el.dataset.d) + ': de proyecto' : 'Semana del ' + fecha(el.dataset.d) + ': normal') + (r.movidas ? ' · ' + r.movidas + (r.movidas === 1 ? ' falta movida' : ' faltas movidas') : '')); },
      sinProj: () => { let u = NV.user; AJ.semanasCurso(u.config).filter((w) => w.proyecto).forEach((w) => { const r = AJ.marcarProyecto(u, w.lunes, false); if (r.user) u = r.user; }); u = Object.assign({}, u, { config: AJ.ponerProyecto(u.config, null) }); NV.aplicar(u, 'Semanas de proyecto quitadas'); },
      sinFechas: () => { const s = sub().slice(1).join('/'), r = AJ.ponerFechas(NV.user.config, s, {}); ui.abierto.fechas = false; cfgA(r.cfg, 'Fechas quitadas'); },
      pct: (el) => { ui.pct = +el.dataset.v; NV.render(false); },
      cu: (el) => { ui.cu = el.dataset.v; NV.render(false); },
      guardaRegla: () => {
        const s = sub().slice(1).join('/'), l = (((NV.user.settings || {}).porAsignatura || {})[s] || { limites: [{ pct: 25, just: 1 }] }).limites[0];
        const pct = ui.pct != null ? ui.pct : l.pct, cu = ui.cu != null ? ui.cu : (l.just > 0 ? 'todas' : 'sin');
        NV.aplicar(Object.assign({}, NV.user, { settings: AJ.reglaPropia(NV.user.settings, s, [{ pct, sin: 1, just: cu === 'todas' ? 1 : 0 }]) }), 'Regla propia guardada: ' + pct + ' %');
      },
      sinRegla: () => { const s = sub().slice(1).join('/'); ui.abierto.regla = false; NV.aplicar(Object.assign({}, NV.user, { settings: AJ.reglaPropia(NV.user.settings, s, null) }), 'Usa la regla general'); },
      compartir: async (el) => {
        const url = el.dataset.v, txt = 'Mira cuántas horas puedes faltar sin pasarte. Entra con nuestra clase ya puesta:';
        try { if (navigator.share) { await navigator.share({ title: 'NoVoy', text: txt, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(url); NV.aviso('Enlace copiado'); } catch (e) { const i = document.getElementById('url'); if (i) { i.select(); NV.aviso('Mantén pulsado y copia el enlace'); } }
      },
      modo: (el) => { ui.modo = el.dataset.v; ui.err = ''; NV.render(false); },
      otroUser: () => { ui.usuario = window.FTAcct.genUser(); NV.render(false); },
      subir: async (el) => { el.disabled = true; el.textContent = 'Guardando…'; const ok = await NV.subir(); NV.render(false); NV.aviso(ok ? 'Guardado en tu cuenta' : 'No se ha podido guardar. ¿Tienes internet?'); },
      cerrar: () => { ui.cerrar = true; NV.render(false); },
      cerrarNo: () => { ui.cerrar = false; NV.render(false); },
      cerrarSi: () => { const u = Object.assign({}, NV.user); delete u.acct; NV.user = u; NV.guardar(); ui.cerrar = false; NV.render(false); NV.aviso('Sesión cerrada'); },
      borrarC: () => { ui.borrarC = true; NV.render(false); },
      borrarCNo: () => { ui.borrarC = false; NV.render(false); },
      borrarCSi: async () => {
        const a = NV.user.acct;
        try { const r = await window.FTAcct.api({ op: 'del', id: a.id, auth: a.auth }); if (!r.ok) throw new Error(r.error); }
        catch (e) { return NV.aviso(e && e.message === 'red' ? 'Sin conexión. Inténtalo con internet.' : 'No se ha podido borrar. Prueba otra vez.'); }
        const u = Object.assign({}, NV.user); delete u.acct; NV.user = u; NV.guardar(); ui.borrarC = false; NV.render(false); NV.aviso('Cuenta borrada');
      },
      cargar: () => { const c = ui.carga; ui.carga = null; NV.user = Object.assign({}, c.estado, { acct: c.acct }); NV.guardar(); NV.aviso('Cargado lo de tu cuenta'); NV.atras('ajustes'); },
      noCargar: () => { ui.carga = null; NV.render(false); },
      borrarSi: () => { try { localStorage.removeItem('ft.v2'); localStorage.removeItem('nv.alta'); } catch (e) {} location.replace('alta.html'); }
    },
    cambios: {
      contar: (el) => { const s = sub().slice(1).join('/'); cfgA(AJ.contar(NV.user.config, s, el.checked), el.checked ? s + ' cuenta' : s + ' ya no cuenta'); },
      cuenta: (el) => { const s = sub().slice(1).join('/'); cfgA(AJ.asignarCuenta(NV.user.config, el.dataset.d, el.dataset.v, s, el.value || s), el.value ? 'Esa hora cuenta en ' + el.value : 'Esa hora vuelve a ser de ' + s); }
    },
    entradas: { pass: (el) => { const c = document.getElementById('checks'); if (c) c.outerHTML = checks(el.value); } },
    envios: {
      proyecto: (f) => { const n = f.nombre.value.trim(); if (n.length < 2) { ui.err = 'Escribe su nombre.'; return NV.render(false); } ui.err = ''; ui.abierto.proj = false; cfgA(AJ.ponerProyecto(NV.user.config, n), 'Semanas de proyecto activadas: toca las que lo son'); },
      semanas: (f) => { const r = AJ.ponerSemanas(NV.user.config, { from: f.from.value, to: f.to.value, todo: f.todo.value }); if (r.error) { ui.err = r.error; return NV.render(false); } ui.abierto.sem = false; ui.err = ''; cfgA(r.cfg, 'Semanas añadidas'); },
      fechas: (f) => { const s = sub().slice(1).join('/'), r = AJ.ponerFechas(NV.user.config, s, { desde: f.desde.value, hasta: f.hasta.value, antes: f.antes.value }); if (r.error) { ui.err = r.error; return NV.render(false); } ui.err = ''; ui.abierto.fechas = false; cfgA(r.cfg, 'Fechas guardadas'); },
      crear: async (f) => {
        const u = f.username.value.trim(), p = f.password.value, p2 = document.getElementById('cp2').value;
        ui.usuario = u; ui.err = window.NVCuenta.revisar(u, p, p2); if (ui.err) return NV.render(false);
        const b = f.querySelector('.btn'); b.disabled = true; b.textContent = 'Creando…';
        const r = await window.NVCuenta.crear(u, p, NV.user);
        if (r.error) { ui.err = r.error; return NV.render(false); }
        NV.user = Object.assign({}, NV.user, { acct: r.acct }); NV.guardar(); ui.err = ''; NV.render(false); NV.aviso('Cuenta creada. Ya no pierdes nada');
      },
      entrar: async (f) => {
        const b = f.querySelector('.btn'); b.disabled = true; b.textContent = 'Entrando…';
        const r = await window.NVCuenta.entrar(f.username.value, f.password.value);
        if (r.error) { ui.err = r.error; return NV.render(false); }
        ui.err = ''; ui.carga = r; NV.render(false);
      }
    }
  };
})();
