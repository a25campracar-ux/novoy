// Comprueba contra los datos abiertos reales que el lector de festivos locales encuentra algo.
// Uso: node scripts/comprobar-festivos.mjs [municipio...]   (necesita red)
import { createRequire } from 'node:module';
const K = createRequire(import.meta.url)('../site/v2/calendario.js');
const munis = process.argv.slice(2).length ? process.argv.slice(2) : ['Barcelona', 'Lleida', 'Girona', 'Tarragona', "L'Hospitalet de Llobregat"];
let malos = 0;
for (const m of munis) {
  const u = new URL('https://analisi.transparenciacatalunya.cat/resource/b4eh-r8up.json');
  u.searchParams.set('$q', m); u.searchParams.set('$limit', '200');
  const r = await fetch(u); const rows = r.ok ? await r.json() : [];
  if (m === munis[0]) console.log('Columnas de ejemplo:', JSON.stringify(rows[0] || {}));
  const f = K.filtrarLocales(rows, m, K.CURSO_2627.inicio, K.CURSO_2627.fin);
  console.log(m.padEnd(28), r.status, rows.length + ' filas →', f.map((x) => x.from + ' ' + x.label).join(' · ') || 'NINGUNO');
  if (!f.length) malos++;
}
process.exit(malos ? 1 : 0);
