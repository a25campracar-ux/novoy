/* NoVoy v2 · Ajustes sin DOM: casos especiales del horario (1.5 y 1.11), regla propia, asignaturas que no cuentan,
   enlace de clase (1.7) y copia para la cuenta (1.8). Todo devuelve copias: nunca cambia lo que recibe.
   Se prueba en Node (tests/v2-ajustes.test.js). */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('../core.js') : root.FTCore;
  const clon = (o) => JSON.parse(JSON.stringify(o));
  const DIAS = ['1', '2', '3', '4', '5'];
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const mn = (t) => +t.slice(0, 2) * 60 + +t.slice(3);

  /** Asignaturas del horario principal, en orden de aparición. */
  function asignaturas(cfg) {
    const out = [];
    DIAS.forEach((d) => ((cfg.schedule || {})[d] || []).forEach((b) => { if (out.indexOf(b.subject) < 0) out.push(b.subject); }));
    return out;
  }
  /** Cada hora de una asignatura en el horario: [{ dia, start, end, hours, cuenta }]. */
  function horasDe(cfg, subject) {
    const out = [];
    DIAS.forEach((d) => ((cfg.schedule || {})[d] || []).forEach((b) => { if (b.subject === subject) C.hourSlots(b).forEach((x) => out.push({ dia: d, start: x.start, end: x.end, hours: x.hours, cuenta: b.cuenta || null })); }));
    return out;
  }
  /** Une bloques seguidos de la misma asignatura y el mismo «cuenta dentro de». */
  function unir(list) {
    const out = [];
    list.slice().sort((a, b) => mn(a.start) - mn(b.start)).forEach((b) => {
      const p = out[out.length - 1];
      if (p && p.subject === b.subject && (p.cuenta || null) === (b.cuenta || null) && p.end === b.start) { p.end = b.end; p.hours = Math.round((p.hours + b.hours) * 100) / 100; }
      else out.push(Object.assign({}, b));
    });
    return out;
  }
  /**
   * 1.5 · «Esta clase cuenta dentro de…»: la hora `start` del día `dia` de `subject` pasa a contar en `destino`
   * (o vuelve a ser suya si destino es ella misma o vacío). Si el bloque tiene varias horas, se parte.
   */
  function asignarCuenta(cfg0, dia, start, subject, destino) {
    const cfg = clon(cfg0), l = (cfg.schedule || {})[dia] || [], i = l.findIndex((b) => b.subject === subject && mn(b.start) <= mn(start) && mn(start) < mn(b.end));
    if (i < 0) return cfg0;
    const b = l[i], partes = C.hourSlots(b).map((x) => {
      const o = { start: x.start, end: x.end, subject: b.subject, hours: x.hours };
      const c = x.start === start ? destino : b.cuenta;
      if (c && c !== b.subject) o.cuenta = c;
      return o;
    });
    // si el bloque llevaba un recreo dentro, las horas partidas ya lo dejan fuera
    cfg.schedule[dia] = unir(l.slice(0, i).concat(partes, l.slice(i + 1)));
    return cfg;
  }
  /** Lo que hay que conservar al repintar el horario: cada hora que contaba dentro de otra. */
  function cuentas(cfg) {
    const out = [];
    DIAS.forEach((d) => ((cfg.schedule || {})[d] || []).forEach((b) => { if (b.cuenta) C.hourSlots(b).forEach((x) => out.push({ dia: d, start: x.start, subject: b.subject, cuenta: b.cuenta })); }));
    return out;
  }
  /** Vuelve a poner las «cuenta dentro de» en un horario nuevo, donde siga habiendo esa misma clase. */
  function reponerCuentas(cfg, lista) {
    let c = cfg;
    (lista || []).forEach((x) => { c = asignarCuenta(c, x.dia, x.start, x.subject, x.cuenta); });
    return c;
  }

  /**
   * 1.11 · Fechas de una asignatura: desde (empieza el…), hasta (acaba el…) y antes (quién da esas horas mientras
   * no ha empezado; opcional). Sin desde ni hasta, se quita. Devuelve { cfg } o { error }.
   */
  function ponerFechas(cfg0, subject, f) {
    const desde = f && ISO.test(f.desde || '') ? f.desde : null, hasta = f && ISO.test(f.hasta || '') ? f.hasta : null;
    if (desde && hasta && hasta < desde) return { error: 'Acaba antes de empezar. Revisa las fechas.' };
    const cfg = clon(cfg0); cfg.vigencia = cfg.vigencia || {};
    if (!desde && !hasta) { delete cfg.vigencia[subject]; return { cfg }; }
    const v = {}; if (desde) v.desde = desde; if (hasta) v.hasta = hasta;
    if (desde && f.antes && f.antes !== subject && asignaturas(cfg).indexOf(f.antes) >= 0) v.antes = f.antes;
    cfg.vigencia[subject] = v;
    return { cfg };
  }

  /** 1.11 · Semanas con otro horario: del `from` al `to` todas las clases son de `todo`. */
  function ponerSemanas(cfg0, s) {
    if (!s || !ISO.test(s.from || '') || !ISO.test(s.to || '') || s.to < s.from) return { error: 'Pon el primer y el último día.' };
    const todo = String(s.todo || '').trim().slice(0, 40); if (todo.length < 2) return { error: 'Escribe de qué asignatura son esas semanas.' };
    const cfg = clon(cfg0), ps = cfg.periods || [];
    if (ps.some((p) => p.from <= s.to && s.from <= p.to)) return { error: 'Esas fechas se cruzan con otras semanas especiales.' };
    const sch = {}; DIAS.forEach((d) => { if ((cfg.schedule[d] || []).length) sch[d] = unir(cfg.schedule[d].map((b) => ({ start: b.start, end: b.end, subject: todo, hours: b.hours }))); });
    cfg.periods = ps.concat({ from: s.from, to: s.to, todo, label: 'Semanas de ' + todo, schedule: sch }).sort((a, b) => (a.from < b.from ? -1 : 1));
    return { cfg };
  }
  function quitarSemanas(cfg0, i) { const cfg = clon(cfg0); cfg.periods = (cfg.periods || []).filter((p, j) => j !== i); return cfg; }

  /** 1.11 · Regla propia de una asignatura (limites como los generales) o null para quitarla. */
  function reglaPropia(settings0, subject, limites) {
    const s = clon(settings0 || {}); s.porAsignatura = s.porAsignatura || {};
    if (limites && limites.length) s.porAsignatura[subject] = { limites }; else delete s.porAsignatura[subject];
    if (!Object.keys(s.porAsignatura).length) delete s.porAsignatura;
    return s;
  }

  /** Contar o no una asignatura (la tutoría, o un módulo convalidado o que no cursas). No borra nada. */
  function contar(cfg0, subject, si) {
    const cfg = clon(cfg0), nc = new Set(cfg.nocount || []);
    if (si) nc.delete(subject); else nc.add(subject);
    cfg.nocount = Array.from(nc); cfg.tutChecked = true;
    return cfg;
  }

  // ---------- reglas: de settings a las respuestas del alta (para «Cambiar reglas») ----------
  function respuestasDe(st) {
    if (st && st.respuestas && st.respuestas.tipo) return clon(st.respuestas);
    const L = C.limitsOf(st || {}), amb = (st && (st.ambitoElegido || st.ambito)) || 'trimestre';
    const ret = String((st && st.retrasosPorFalta) || 0), r = { ambito: amb, retrasos: ret === '0' ? 'no' : ret };
    if ((st && st.aproximado || []).indexOf('nose') >= 0) return Object.assign(r, { tipo: 'nose' });
    if (L.length > 1) return Object.assign(r, { tipo: 'dos', pctSin: L[0].pct, pctJust: L[1].pct, segundo: L[1].sin > 0 ? 'todas' : 'aparte' });
    const l = L[0];
    if (l.just > 0 && l.just < 1) return Object.assign(r, { tipo: 'mitad', pct: l.pct });
    return Object.assign(r, { tipo: l.just > 0 ? 'todas' : 'sin', pct: l.pct, cuenta: l.just > 0 ? 'todas' : 'sin' });
  }

  // ---------- 1.7 · enlace de clase: centro, ciclo y turno; nunca faltas ni horario de nadie ----------
  const b64u = (t) => (typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(t))) : Buffer.from(t, 'utf8').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (t) => { const s = t.replace(/-/g, '+').replace(/_/g, '/'); return typeof atob !== 'undefined' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); };
  function enlaceClase(cfg, base) {
    const cat = (cfg && cfg.catalog) || {}, c = cat.centre, y = cat.cycle;
    if (!c || !c.name || !y || !y.name || !cat.turno) return null;
    const o = { c: { name: c.name, city: c.city || '' }, y: { name: y.name }, t: cat.turno };
    if (c.id) o.c.id = c.id; if (c.code) o.c.code = c.code; if (c.prov) o.c.prov = 1; if (y.code) o.y.code = y.code; if (y.prov) o.y.prov = 1;
    return String(base || '').replace(/\/?$/, '/') + 'alta.html?unirse=' + b64u(JSON.stringify(o));
  }
  const corta = (s, n) => typeof s === 'string' && s.trim().length > 0 && s.length <= n && !/[<>{}]/.test(s);
  function leerEnlace(param) {
    try {
      const o = JSON.parse(unb64u(String(param || '')));
      if (!o || !o.c || !corta(o.c.name, 120) || !o.y || !corta(o.y.name, 120) || ['manana', 'tarde'].indexOf(o.t) < 0) return null;
      const centro = { name: o.c.name.trim(), city: corta(o.c.city, 80) ? o.c.city.trim() : '' };
      if (corta(o.c.id, 40)) centro.id = o.c.id; if (corta(o.c.code, 20)) centro.code = o.c.code; if (o.c.prov) centro.prov = true;
      const ciclo = { name: o.y.name.trim() }; if (corta(o.y.code, 20)) ciclo.code = o.y.code; if (o.y.prov) ciclo.prov = true;
      return { centro, ciclo, turno: o.t };
    } catch (e) { return null; }
  }

  // ---------- 1.8 · lo que se guarda (cifrado) en la cuenta ----------
  const FORMATO = 'novoy/3';
  function paraCuenta(u) { const e = clon(u); delete e.acct; return JSON.stringify({ formato: FORMATO, estado: e }); }
  /** Copia de la cuenta → estado (sin la sesión). null si no es del formato nuevo (la v1 guardaba otro). */
  function deCuenta(txt) {
    try { const o = JSON.parse(txt); if (o && o.formato === FORMATO && o.estado && o.estado.config) { const e = o.estado; delete e.acct; return e; } } catch (e) {}
    return null;
  }

  // ---------- plantilla del grupo: claves y lo que se comparte (nunca faltas) ----------
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const nk = (t) => norm(t).slice(0, 60);
  /** Las mismas claves que usa el alta para buscar la plantilla de un centro y de un grupo. */
  function claves(centro, ciclo, turno) {
    if (!centro || !centro.name) return null;
    const c = centro.code ? 'c' + nk(centro.code) : nk(centro.name) + '@' + nk(centro.city || '');
    return { centro: c, grupo: ciclo && turno ? c + '|' + (ciclo.code ? nk(ciclo.code) : nk(ciclo.name)) + '|' + turno : null };
  }
  /** Horario con sus casos especiales (1.5 y 1.11), tal como viaja en la plantilla del grupo. */
  function datosGrupo(cfg) {
    const out = { schedule: clon(cfg.schedule || {}) };
    if (cfg.vigencia && Object.keys(cfg.vigencia).length) out.vigencia = clon(cfg.vigencia);
    const ps = (cfg.periods || []).filter((p) => p.todo).map((p) => ({ from: p.from, to: p.to, todo: p.todo }));
    if (ps.length) out.periodos = ps;
    return out;
  }
  /** Al revés: aplica la vigencia y las semanas especiales de una plantilla a una configuración. */
  function conEspeciales(cfg0, data) {
    let cfg = clon(cfg0);
    if (data && data.vigencia) cfg.vigencia = clon(data.vigencia);
    (data && data.periodos || []).forEach((p) => { const r = ponerSemanas(cfg, p); if (r.cfg) cfg = r.cfg; });
    return cfg;
  }
  /** Frases cortas de los casos especiales de un horario (para enseñarlos en la plantilla). */
  function resumenEspeciales(data) {
    const out = [], c = {};
    DIAS.forEach((d) => ((data && data.schedule || {})[d] || []).forEach((b) => { if (b.cuenta) (c[b.subject] = c[b.subject] || new Set()).add(b.cuenta); }));
    Object.keys(c).forEach((k) => out.push(k + ' cuenta en ' + Array.from(c[k]).join(' y ')));
    const v = (data && data.vigencia) || {};
    Object.keys(v).forEach((k) => { if (v[k].desde) out.push(k + ' empieza el ' + v[k].desde.split('-').reverse().slice(0, 2).join('/')); if (v[k].hasta) out.push(k + ' acaba el ' + v[k].hasta.split('-').reverse().slice(0, 2).join('/')); });
    ((data && data.periodos) || []).forEach((p) => out.push('Semanas de ' + p.todo + ' del ' + p.from.split('-').reverse().slice(0, 2).join('/') + ' al ' + p.to.split('-').reverse().slice(0, 2).join('/')));
    return out;
  }

  const api = { claves, datosGrupo, conEspeciales, resumenEspeciales, asignaturas, horasDe, asignarCuenta, cuentas, reponerCuentas, ponerFechas, ponerSemanas, quitarSemanas, reglaPropia, contar, respuestasDe, enlaceClase, leerEnlace, paraCuenta, deCuenta, FORMATO };
  if (isNode) module.exports = api; else root.NVAjustes = api;
})(this);
