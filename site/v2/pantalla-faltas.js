/* NoVoy v2 · Pestaña Faltas (1.3): cuánto te queda en cada asignatura y, al tocarla, sus faltas por día para
   justificar o borrar. Hace también de Resumen. La lógica está en lista.js. */
(function () {
  'use strict';
  const NV = window.NV; if (!NV) return;
  const { Hd, esc, cap, largo, fecha, horasTxt, HOY } = NV;
  const L = window.NVLista, fmt = Hd.fmt;
  let periodo = null, abierta = null;

  function fila(x) {
    const que = [];
    if (x.horas) que.push(horasTxt(x.horas) + (x.inicio.length && x.date ? ' · ' + x.inicio.join(', ') : ''));
    if (x.retrasos) que.push(x.retrasos === 1 ? 'retraso' : x.retrasos + ' retrasos');
    const cuando = x.date ? cap(largo(x.date)) : 'De antes de empezar';
    const ids = esc(JSON.stringify(x.ids));
    return '<li class="fl"><div class="t"><b>' + esc(cuando) + '</b><small>' + esc(que.join(' y ')) + (x.todas ? ' · <span class="tag fui">Justificada</span>' : x.justificadas ? ' · ' + x.justificadas + ' justificada' + (x.justificadas > 1 ? 's' : '') : '') + '</small></div>' +
      '<div class="bts"><button class="solo" data-a="just" data-v="' + (x.todas ? '0' : '1') + '" data-k="' + ids + '" aria-label="' + (x.todas ? 'Quitar justificante' : 'Justificar') + ', ' + esc(cuando) + '">' + (x.todas ? 'Quitar justificante' : 'Justificar') + '</button>' +
      '<button class="solo" data-a="borrar" data-k="' + ids + '" aria-label="Borrar la falta del ' + esc(cuando) + '">Borrar</button></div></li>';
  }
  function asignatura(a) {
    const open = abierta === a.name, id = 'as-' + encodeURIComponent(a.name).replace(/%/g, '');
    let cab;
    if (a.sinHoras) cab = '<span class="q">Sin clases en este periodo</span>';
    else {
      const p = a.limites[0];
      cab = '<span class="q ' + a.status + '">' + (a.queda < 0 ? 'te has pasado ' + horasTxt(-a.queda) : 'te quedan ' + horasTxt(a.queda)) + '</span><span class="pct">llevas ' + fmt(a.pct) + ' %' + (a.limites.length === 1 ? ' · ' + fmt(p.usado) + ' de ' + horasTxt(p.limite) : '') + '</span>';
    }
    const n = a.filas.length;
    let h = '<article class="tj' + (a.sinHoras ? ' hecha' : '') + '"><button class="cab" aria-expanded="' + open + '" aria-controls="' + id + '" data-a="abrir" data-v="' + esc(a.name) + '"><span class="t"><h3 class="nm">' + esc(a.name) + '</h3><span class="meta">' + (n ? n + (n === 1 ? ' día con faltas' : ' días con faltas') : 'Sin faltas') + (a.propia ? ' · regla propia' : '') + '</span></span><span class="der">' + cab + '</span></button>';
    if (!a.sinHoras) h += NV.barras({ limites: a.limites.map((l) => Object.assign({ coste: 0 }, l)) });
    else {
      const todas = esc(JSON.stringify([].concat.apply([], a.filas.map((x) => x.ids))));
      h += '<p class="sub">Ya no está en tu horario. Si son faltas puestas en PROJ u otro nombre, pásalas a la clase que tenías a esa hora.</p><div class="bts"><button class="solo" data-a="reubicar" data-k="' + todas + '">Pasarlas a su clase</button><button class="solo" data-a="borrar" data-k="' + todas + '" aria-label="Borrar todas las faltas de ' + esc(a.name) + '">Borrar</button></div>';
    }
    if (open) h += '<ul class="fls" id="' + id + '">' + (n ? a.filas.map(fila).join('') : '<li class="nota">Ninguna falta en este periodo.</li>') + '</ul>';
    return h + '</article>';
  }
  function vista() {
    const u = NV.user, P = L.periodos(u, HOY);
    if (!periodo || !P.lista.some((t) => t.id === periodo)) periodo = P.actual;
    const lista = L.asignaturas(u, periodo, HOY);
    let h = '<header class="hd"><div><h1 tabindex="-1">Faltas</h1><span class="sub">Toca una asignatura para ver sus faltas</span></div></header>';
    if (P.lista.length > 1) h += '<div class="dias" role="radiogroup" aria-label="Periodo">' + P.lista.map((t) => '<button class="seg" role="radio" aria-checked="' + (t.id === periodo) + '" data-a="periodo" data-v="' + t.id + '">' + esc(t.label.replace(' trimestre', ' trim.')) + '</button>').join('') + '</div>';
    if (!lista.length) h += '<div class="card"><p>No hay clases en este periodo.</p></div>';
    h += '<div class="stack">' + lista.map(asignatura).join('') + '</div>';
    h += '<div class="acc"><button class="btn2" data-a="otro">Apuntar otro día</button><a class="btn2" href="alta.html?editar=faltas' + (NV.HOY !== NV.C.ymd(new Date()) ? '&hoy=' + HOY : '') + '">Pasar mi lista</a></div>';
    const c = u.comprobado;
    h += '<p class="nota center">' + (c ? 'Comparado con tu lista el ' + fecha(c) + '. ' : '') + 'La cifra oficial es siempre la de tu centro.</p>';
    return h;
  }
  const ids = (el) => { try { return JSON.parse(el.dataset.k); } catch (e) { return []; } };
  NV.pantallas.faltas = {
    vista,
    acciones: {
      periodo: (el) => { periodo = el.dataset.v; abierta = null; NV.render(false); },
      abrir: (el) => { abierta = abierta === el.dataset.v ? null : el.dataset.v; NV.render(false); },
      just: (el) => { const v = el.dataset.v === '1'; NV.aplicar(L.justificar(NV.user, ids(el), v), v ? 'Justificada' : 'Quitado el justificante'); },
      borrar: (el) => NV.aplicar(L.borrar(NV.user, ids(el)), ids(el).length > 1 ? 'Faltas borradas' : 'Falta borrada'),
      reubicar: (el) => { const r = L.reubicar(NV.user, ids(el)); NV.aplicar(r, r.movidas + (r.movidas === 1 ? ' falta pasada a su clase' : ' faltas pasadas a su clase') + (r.sinHora ? ' · ' + r.sinHora + ' sin hora: bórralas o déjalas' : '')); },
      otro: () => NV.abrirFalte(Hd.diasRecientes(NV.user, HOY, 1)[0] || HOY)
    }
  };
})();
