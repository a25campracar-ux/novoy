// Comprueba contra los datos abiertos reales que el alta encuentra los festivos locales (necesita red).
// Uso: node scripts/comprobar-festivos.mjs [municipio...]
import { createRequire } from 'node:module';
const K = createRequire(import.meta.url)('../site/v2/calendario.js');
const munis = process.argv.slice(2).length ? process.argv.slice(2) : ['Barcelona', 'Lleida', 'Girona', 'Tarragona', "L'Hospitalet de Llobregat", 'Sant Cugat del Vallès'];
let malos = 0;
for (const m of munis) {
  const f = await K.festivosLocales(m);
  const u = new URL('https://analisi.transparenciacatalunya.cat/resource/b4eh-r8up.json');
  u.searchParams.set('$where', "upper(ajuntament_o_nucli_municipal) like '%" + m.split(/[\s']+/).sort((a, b) => b.length - a.length)[0].toUpperCase() + "%' AND any_calendari in ('2026','2027')");
  const rows = await (await fetch(u)).json();
  console.log('   filas:', rows.slice(0, 6).map((r) => r.ajuntament_o_nucli_municipal + ' ' + String(r.data).slice(0, 10)).join(' | '));
  console.log(m.padEnd(28), f.map((x) => x.from).join(' · ') || 'NINGUNO', K.faltaSegundoAño(f) ? '(sin los de ' + K.CURSO_2627.fin.slice(0, 4) + ')' : '');
  if (!f.length) malos++;
}
process.exit(malos ? 1 : 0);
