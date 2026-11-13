/* Catálogo de NoVoy: centros, ciclos y módulos con sus horas oficiales en el centro.
   Las horas son las del currículum de Catalunya (horas en el centro educativo, sin la estancia en la empresa).
   Sirven para COMPROBAR lo que pinta el alumno, no para calcular: el cálculo sale de su horario × semanas del curso.
   hours: null = no se ha podido verificar en una fuente pública; el módulo sale en la lista, pero sin comprobación.
   Fuentes: Institut Escola del Treball (fitxa DAW 2026), Institut Marianao (fulls informatius DAW/DAM 2025-26 y 2026-27). */
(function (root) {
  'use strict';
  const CYCLES = {
    ICC0: {
      code: 'ICC0', short: 'DAW', name: 'Desenvolupament d’Aplicacions Web', grade: 'CFGS',
      modules: [
        // 1r curso (común con DAM)
        { code: '0483', name: 'Sistemes informàtics', short: 'SI', course: 1, hours: 99, alias: ['si', 'sistemes', 'sistemas'] },
        { code: '0484', name: 'Bases de dades', short: 'BD', course: 1, hours: 132, alias: ['bd', 'bbdd', 'bases'] },
        { code: '0485', name: 'Programació', short: 'PROG', course: 1, hours: 198, alias: ['prog', 'programacio', 'programacion', 'programació', 'programación'] },
        { code: '0373', name: 'Llenguatges de marques', short: 'LMSGI', course: 1, hours: 66, alias: ['lm', 'lmsgi', 'marques', 'marcas'] },
        { code: '0487', name: 'Entorns de desenvolupament', short: 'ED', course: 1, hours: 66, alias: ['ed', 'entorns', 'entornos'] },
        { code: '0179', name: 'Anglès professional', short: 'ANG', course: 1, hours: 66, alias: ['ang', 'angles', 'anglès', 'ingles', 'inglés', 'english'] },
        { code: '1709', name: 'Itinerari per a l’ocupabilitat I', short: 'IPO I', course: 1, hours: null, alias: ['ipo i', 'ipo1', 'ipo 1'] },
        { code: 'DIG', name: 'Digitalització aplicada', short: 'DIG', course: 1, hours: null, alias: ['dig', 'digitalitzacio', 'digitalización'] },
        { code: 'SOS', name: 'Sostenibilitat aplicada', short: 'SOS', course: 1, hours: null, alias: ['sos', 'sostenibilitat', 'sostenibilidad'] },
        // 2n curso
        { code: '0612', name: 'Desenvolupament web en entorn client', short: 'E.CLI', course: 2, hours: 99, alias: ['e.cli', 'ecli', 'dwec', 'client', 'cliente'] },
        { code: '0613', name: 'Desenvolupament web en entorn servidor', short: 'E.SER', course: 2, hours: 99, alias: ['e.ser', 'eser', 'dwes', 'servidor'] },
        { code: '0614', name: 'Desplegament d’aplicacions web', short: 'DAW', course: 2, hours: 66, alias: ['daw', 'desplegament', 'despliegue'] },
        { code: '0615', name: 'Disseny d’interfícies web', short: 'DIW', course: 2, hours: 66, alias: ['diw', 'interficies', 'interfícies', 'interfaces'] },
        { code: '1710', name: 'Itinerari per a l’ocupabilitat II', short: 'IPO II', course: 2, hours: 66, alias: ['ipo ii', 'ipo2', 'ipo 2'] },
        { code: 'PROJ', name: 'Projecte intermodular', short: 'PROJ', course: 2, hours: null, alias: ['proj', 'projecte', 'proyecto'] },
        { code: 'OPT', name: 'Optativa', short: 'OPT', course: 2, hours: null, alias: ['opt', 'optativa'] }
      ]
    }
  };
  // Calendario general de Catalunya 2026-27 (Ordre EDF/66/2026) + festivos de Barcelona.
  const CAT_2627 = [
    { from: '2026-09-11', to: '2026-09-11', label: 'Diada' },
    { from: '2026-09-24', to: '2026-09-24', label: 'La Mercè (Barcelona)' },
    { from: '2026-10-12', to: '2026-10-12', label: 'Fiesta Nacional' },
    { from: '2026-12-08', to: '2026-12-08', label: 'Inmaculada' },
    { from: '2026-12-22', to: '2027-01-07', label: 'Vacaciones de Navidad' },
    { from: '2027-03-20', to: '2027-03-29', label: 'Semana Santa' },
    { from: '2027-05-17', to: '2027-05-17', label: 'Segona Pasqua (Barcelona)' }
  ];
  const CENTRES = [
    { id: 'pedralbes', name: 'Institut Pedralbes', city: 'Barcelona', cycles: ['ICC0'],
      terms: { 2: [{ id: '1r', label: '1r trimestre', from: '2026-09-14', to: '2026-11-27' }, { id: '2n', label: '2n trimestre', from: '2026-11-30', to: '2027-03-05' }, { id: '3r', label: '3r trimestre', from: '2027-03-08', to: '2027-05-26' }] },
      holidays: CAT_2627 }
  ];
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(institut|instituto|ins|ies|escola|col·legi|colegio|centre|de|del|la|el|i|y)\b/g, ' ').replace(/[^a-z0-9.]+/g, ' ').trim();
  /** Centros del catálogo que encajan con lo escrito (sin tildes, sin "Institut", etc.). */
  function findCentres(q) { const n = norm(q); if (n.length < 2) return []; return CENTRES.filter((c) => norm(c.name + ' ' + c.city).indexOf(n) >= 0 || n.split(' ').every((w) => norm(c.name).indexOf(w) >= 0)); }
  const centreById = (id) => CENTRES.find((c) => c.id === id) || null;
  const centreByName = (name) => { const n = norm(name); return CENTRES.find((c) => norm(c.name) === n || (n && norm(c.name).indexOf(n) >= 0 && n.length >= 5)) || null; };
  /** Módulo del ciclo al que corresponde un nombre de asignatura (por nombre, abreviatura o alias). */
  function matchModule(cycle, subject) {
    const c = CYCLES[cycle]; if (!c) return null;
    const s = String(subject || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    if (!s) return null;
    return c.modules.find((m) => m.short.toLowerCase() === s || m.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === s || m.alias.some((a) => a.normalize('NFD').replace(/[̀-ͯ]/g, '') === s)) ||
      c.modules.find((m) => m.alias.some((a) => a.length >= 5 && s.indexOf(a.normalize('NFD').replace(/[̀-ͯ]/g, '')) >= 0)) || null;
  }
  /** Directorio oficial de centros (dades obertes de la Generalitat). Devuelve [{name, city, code}] o [] si no hay red. */
  async function searchDirectory(q) {
    const t = String(q || '').trim().toUpperCase().replace(/'/g, "''"); if (t.length < 3) return [];
    const u = new URL('https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json');
    u.searchParams.set('$select', 'codi_centre,denominaci_completa,nom_municipi,any');
    u.searchParams.set('$where', "upper(denominaci_completa) like '%" + t + "%'");
    u.searchParams.set('$order', 'any DESC'); u.searchParams.set('$limit', '60');
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = setTimeout(() => ctl && ctl.abort(), 5000);
      const r = await fetch(u.toString(), ctl ? { signal: ctl.signal } : {}); clearTimeout(tm);
      if (!r.ok) return [];
      const rows = await r.json(), seen = new Set(), out = [];
      rows.forEach((x) => { if (!x.codi_centre || seen.has(x.codi_centre)) return; seen.add(x.codi_centre); out.push({ code: x.codi_centre, name: tidyName(x.denominaci_completa), city: tidyName(x.nom_municipi || '') }); });
      return out.slice(0, 8);
    } catch (e) { return []; }
  }
  const tidyName = (s) => String(s || '').toLowerCase().replace(/(^|[\s'·(-])([a-zà-ü])/g, (m, a, b) => a + b.toUpperCase());
  const api = { CYCLES, CENTRES, findCentres, centreById, centreByName, matchModule, searchDirectory, norm, CAT_2627 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FTCat = api;
})(this);
