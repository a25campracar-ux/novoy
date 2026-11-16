/* NoVoy v2 · Calendario del curso: general de Catalunya + festivos del municipio + lo que elige el centro.
   Sin DOM salvo `festivosLocales` (fetch). Se prueba en Node (tests/v2-calendario.test.js). */
(function (root) {
  'use strict';

  /** Curso 2026-27. Ordre EDF/66/2026, de 22 d'abril (DOGC 9653). */
  const CURSO_2627 = {
    id: '2026-27',
    inicio: '2026-09-08', // inicio general; la FP suele empezar más tarde y lo confirma el alumno
    fin: '2027-06-21',
    inicioFP: '2026-09-14', // valor propuesto, sin confirmar: se enseña como «revísalo»
    finFP: '2027-05-26',
    festivos: [
      { from: '2026-09-11', to: '2026-09-11', label: 'Diada' },
      { from: '2026-10-12', to: '2026-10-12', label: 'Fiesta Nacional' },
      { from: '2026-12-08', to: '2026-12-08', label: 'Inmaculada' },
      { from: '2026-12-22', to: '2027-01-07', label: 'Vacaciones de Navidad' },
      { from: '2027-03-20', to: '2027-03-29', label: 'Semana Santa' }
    ],
    diasLibreDisposicion: 4
  };

  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /** Fecha suelta a 'YYYY-MM-DD': acepta ISO (con hora) y dd/mm/yyyy. */
  function aISO(v) {
    const s = String(v || '').trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return null;
  }

  /**
   * Filas del conjunto de datos abiertos de festivos locales → festivos de un municipio dentro del curso.
   * No depende del nombre de las columnas: busca en cada fila un valor que sea el municipio y otro que sea una fecha.
   */
  function filtrarLocales(rows, municipio, desde, hasta) {
    const m = norm(municipio), out = [], seen = new Set();
    if (!m) return out;
    (rows || []).forEach((r) => {
      if (!r || typeof r !== 'object') return;
      const vals = Object.keys(r).map((k) => [k, r[k]]).filter((kv) => typeof kv[1] === 'string');
      const esMuni = vals.some((kv) => norm(kv[1]) === m || norm(kv[1]).replace(/^(l |el |la |els |les )/, '') === m.replace(/^(l |el |la |els |les )/, ''));
      if (!esMuni) return;
      const fecha = vals.map((kv) => aISO(kv[1])).find(Boolean);
      if (!fecha || (desde && fecha < desde) || (hasta && fecha > hasta) || seen.has(fecha)) return;
      seen.add(fecha);
      const nombre = vals.map((kv) => kv[1]).find((v) => !aISO(v) && norm(v) !== m && v.length > 3 && v.length < 80 && !/^\d+$/.test(v));
      out.push({ from: fecha, to: fecha, label: nombre ? nombre.trim() : 'Fiesta local', local: true });
    });
    return out.sort((a, b) => (a.from < b.from ? -1 : 1));
  }

  /** Festivos locales desde los datos abiertos de la Generalitat (en el navegador). [] si no hay red o no hay datos. */
  async function festivosLocales(municipio, curso) {
    curso = curso || CURSO_2627;
    if (!municipio || typeof fetch === 'undefined') return [];
    const u = new URL('https://analisi.transparenciacatalunya.cat/resource/b4eh-r8up.json');
    u.searchParams.set('$q', municipio); u.searchParams.set('$limit', '200');
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = setTimeout(() => ctl && ctl.abort(), 6000);
      const r = await fetch(u.toString(), ctl ? { signal: ctl.signal } : {}); clearTimeout(tm);
      if (!r.ok) return [];
      return filtrarLocales(await r.json(), municipio, curso.inicio, curso.fin);
    } catch (e) { return []; }
  }

  /**
   * Trimestres por defecto entre el inicio y el fin de las clases, partidos por las vacaciones:
   * 1r hasta Navidad, 2n hasta Semana Santa, 3r hasta el final. Son una propuesta: el alumno los revisa.
   */
  function trimestresPropuestos(inicio, fin, curso) {
    curso = curso || CURSO_2627;
    const nav = curso.festivos.find((f) => /navidad/i.test(f.label)), ss = curso.festivos.find((f) => /semana santa/i.test(f.label));
    const dia = (iso, d) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
    return [
      { id: '1r', label: '1r trimestre', from: inicio, to: dia(nav.from, -1) },
      { id: '2n', label: '2n trimestre', from: dia(nav.to, 1), to: dia(ss.from, -1) },
      { id: '3r', label: '3r trimestre', from: dia(ss.to, 1), to: fin }
    ];
  }

  /** Comprueba trimestres: fechas válidas, en orden y sin solaparse. Devuelve un texto de error o ''. */
  function errorTrimestres(terms) {
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      if (!ISO.test(t.from) || !ISO.test(t.to)) return 'Falta alguna fecha del ' + t.label + '.';
      if (t.from > t.to) return 'En el ' + t.label + ', la fecha de inicio va después del final.';
      if (i && terms[i - 1].to >= t.from) return 'El ' + t.label + ' empieza antes de que acabe el anterior.';
    }
    return '';
  }

  /** Lista final de festivos: general + locales + días de libre disposición, sin repetir. */
  function festivos(curso, locales, libres) {
    const out = [], seen = new Set();
    const add = (f) => { const k = f.from + '|' + (f.to || f.from); if (seen.has(k)) return; seen.add(k); out.push({ from: f.from, to: f.to || f.from, label: f.label }); };
    (curso || CURSO_2627).festivos.forEach(add);
    (locales || []).forEach(add);
    (libres || []).filter((d) => ISO.test(d)).forEach((d) => add({ from: d, to: d, label: 'Libre disposición' }));
    return out.sort((a, b) => (a.from < b.from ? -1 : 1));
  }

  const api = { CURSO_2627, aISO, norm, filtrarLocales, festivosLocales, trimestresPropuestos, errorTrimestres, festivos };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NVCal = api;
})(this);
