/* NoVoy v2 · Reglas de faltas: de las respuestas del alta a settings, y de settings a una frase.
   Sin DOM: se prueba en Node (tests/v2-reglas.test.js). */
(function (root) {
  'use strict';

  /** Valores por defecto de cada forma de contar (lo que sale ya marcado en la pantalla 2). */
  const DEFECTO = {
    todas: { pct: 25, cuenta: 'todas' },
    sin: { pct: 20, cuenta: 'sin' },
    dos: { pctSin: 10, pctJust: 15, segundo: 'aparte' },
    nose: { pct: 15, cuenta: 'todas' }, // decisión del autor (16/11/2026): la más estricta
    mitad: { pct: 25 } // «Otra forma»: las justificadas cuentan la mitad
  };
  const PCTS = [10, 15, 20, 25];
  const RETRASOS = { no: 0, '1': 1, '2': 2, '3': 3 };

  const okPct = (n) => { const v = +String(n).replace(',', '.'); return v > 0 && v <= 100 ? Math.round(v * 10) / 10 : null; };

  /** Respuestas con los valores por defecto de su forma de contar, sin pisar lo que ya eligió el alumno. */
  function conDefecto(a) {
    const t = (a && a.tipo) || 'nose', def = {};
    Object.keys(a || {}).forEach((k) => { if (a[k] !== undefined && a[k] !== null && a[k] !== '') def[k] = a[k]; });
    return Object.assign({ tipo: t, ambito: 'trimestre', retrasos: 'no' }, DEFECTO[t], def);
  }

  /**
   * Respuestas → reglas para el motor.
   * a = { tipo: 'todas'|'sin'|'dos'|'nose', pct, cuenta: 'todas'|'sin', pctSin, pctJust,
   *       segundo: 'aparte'|'todas', ambito: 'trimestre'|'curso'|'ra', retrasos: 'no'|'1'|'2'|'3' }
   * Devuelve { limites, ambito, retrasosPorFalta, aproximado: [motivos] } o { error }.
   */
  function aSettings(a0) {
    const a = conDefecto(a0), aprox = [];
    let limites;
    if (a.tipo === 'dos') {
      const s = okPct(a.pctSin), j = okPct(a.pctJust);
      if (!s || !j) return { error: 'Pon los dos porcentajes (entre 1 y 100).' };
      limites = [{ pct: s, sin: 1, just: 0 }, a.segundo === 'todas' ? { pct: j, sin: 1, just: 1 } : { pct: j, sin: 0, just: 1 }];
    } else {
      const p = okPct(a.pct);
      if (!p) return { error: 'Pon un porcentaje entre 1 y 100.' };
      limites = [{ pct: p, sin: 1, just: a.tipo === 'mitad' ? 0.5 : a.cuenta === 'sin' ? 0 : 1 }];
      if (a.tipo === 'nose') aprox.push('nose');
    }
    const ambito = ['trimestre', 'curso', 'ra'].indexOf(a.ambito) >= 0 ? a.ambito : 'trimestre';
    if (ambito === 'ra') aprox.push('ra'); // sin las horas de cada RA el motor calcula por trimestre: se marca aproximado
    return { limites, ambito, retrasosPorFalta: RETRASOS[a.retrasos] != null ? RETRASOS[a.retrasos] : 0, aproximado: aprox };
  }

  const n = (x) => String(x).replace('.', ',');

  /** Frase principal: «Puedes faltar el 10 % sin justificante y otro 15 % con justificante». */
  function frase(limites) {
    const L = limites || [];
    if (L.length === 1) {
      const l = L[0];
      if (l.just >= 1) return 'Puedes faltar el ' + n(l.pct) + ' % de las clases, con o sin justificante';
      return 'Puedes faltar el ' + n(l.pct) + ' % de las clases sin justificante';
    }
    if (L.length === 2) {
      const sin = L.find((l) => l.just === 0) || L[0], otro = L.find((l) => l !== sin);
      if (otro.sin === 0) return 'Puedes faltar el ' + n(sin.pct) + ' % sin justificante y otro ' + n(otro.pct) + ' % con justificante';
      return 'Puedes faltar el ' + n(sin.pct) + ' % sin justificante, y el ' + n(otro.pct) + ' % contando todas';
    }
    return '';
  }
  function fraseAmbito(ambito) {
    return ambito === 'curso' ? 'en cada módulo, sobre todo el curso' : ambito === 'ra' ? 'en cada RA de cada módulo' : 'en cada módulo y cada trimestre';
  }
  function fraseRetrasos(r) {
    return !(r > 0) ? 'Llegar tarde no cuenta.' : r === 1 ? 'Cada retraso cuenta como 1 falta.' : r + ' retrasos cuentan como 1 falta.';
  }
  /** Nota sobre las justificadas cuando hay un solo límite que no las cuenta enteras. */
  function notaJustificadas(limites) {
    const L = limites || [];
    if (L.length !== 1 || L[0].just >= 1) return '';
    return L[0].just > 0 ? 'Las justificadas cuentan la mitad.' : 'Las justificadas no cuentan.';
  }
  /** Las líneas del resumen: la regla, la nota de las justificadas (si hay) y los retrasos. */
  function resumen(s) {
    return { principal: frase(s.limites) + ', ' + fraseAmbito(s.ambito) + '.', nota: notaJustificadas(s.limites), retrasos: fraseRetrasos(s.retrasosPorFalta) };
  }

  /** Ejemplo en horas para un módulo de `total` horas: [{ etiqueta, horas }]. */
  function ejemplo(limites, total) {
    const r1 = (x) => Math.round(x * 10) / 10;
    return (limites || []).map((l) => ({
      etiqueta: l.sin > 0 && l.just === 0 ? 'Sin justificante, hasta' : l.sin === 0 ? 'Con justificante, hasta' : 'Contando todas, hasta',
      horas: r1(total * l.pct / 100)
    }));
  }

  /** Reglas guardadas → respuestas, para volver a abrir el flujo con lo que ya había. */
  function aRespuestas(s) {
    const L = (s && s.limites) || [], r = s && s.retrasosPorFalta;
    const base = { ambito: (s && s.ambito) || 'trimestre', retrasos: r > 0 && r <= 3 ? String(r) : 'no' };
    if (L.length === 2) {
      const sin = L.find((l) => l.just === 0) || L[0], otro = L.find((l) => l !== sin);
      return Object.assign(base, { tipo: 'dos', pctSin: sin.pct, pctJust: otro.pct, segundo: otro.sin === 0 ? 'aparte' : 'todas' });
    }
    if (L.length === 1) {
      const nose = ((s && s.aproximado) || []).indexOf('nose') >= 0;
      if (L[0].just > 0 && L[0].just < 1) return Object.assign(base, { tipo: 'mitad', pct: L[0].pct });
      return Object.assign(base, { tipo: nose ? 'nose' : L[0].just ? 'todas' : 'sin', pct: L[0].pct, cuenta: L[0].just ? 'todas' : 'sin' });
    }
    return base;
  }

  const api = { DEFECTO, PCTS, conDefecto, aSettings, frase, resumen, ejemplo, aRespuestas, okPct };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NVReglas = api;
})(this);
