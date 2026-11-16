// Recorrido en Chrome de la pantalla Hoy v2 y «Falté a…» (Playwright). Datos inventados (tests/fixtures/hoy-estado.js).
// Comprueba que no vuelven los fallos 4, 5, 9 y 15 de la v1. Uso: node scripts/e2e-hoy.mjs [carpeta-capturas]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const F = require('../tests/fixtures/hoy-estado.js');

const PORT = 8900 + Math.floor(Math.random() * 90);
const srv = spawn(process.execPath, [new URL('./serve-v2.mjs', import.meta.url).pathname, String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok) => srv.stdout.once('data', ok));
const BASE = 'http://localhost:' + PORT, LUNES = '2026-11-16';
const OUT = process.argv[2] || '/tmp/nv-hoy';
fs.mkdirSync(OUT, { recursive: true });
const fallos = [];
const ok = (cond, msg) => { if (!cond) { fallos.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const exe = fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

async function abrir(estado, opts, fecha) {
  const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, locale: 'es-ES', serviceWorkers: 'block' }, opts || {}));
  await c.addInitScript((s) => { if (!sessionStorage.getItem('nv.e2e')) { localStorage.setItem('ft.v2', s); sessionStorage.setItem('nv.e2e', '1'); } }, JSON.stringify(estado));
  const p = await c.newPage();
  p.setDefaultTimeout(8000);
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) p.errores.push(m.text()); });
  await p.goto(BASE + '/?hoy=' + (fecha || LUNES));
  await p.locator('h1').first().waitFor();
  return { c, p };
}
let n = 0;
async function shot(p, name) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 0, name + ': sin desbordar a lo ancho (' + over + ' px)');
  const small = await p.evaluate(() => Array.from(document.querySelectorAll('#app button, #app a, #app input, #tabs a'))
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !el.closest('label.toggle'); })
    .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 24)));
  ok(small.length === 0, name + ': zonas táctiles ≥ 44 px' + (small.length ? ' (' + small.join(', ') + ')' : ''));
  await p.screenshot({ path: OUT + '/' + String(++n).padStart(2, '0') + '-' + name + '.png', fullPage: true });
}
const sem = (p) => p.locator('.sem .big').innerText();
/** Espera a que el título sea `t` (las vueltas atrás del navegador llegan un instante después). */
const titulo = async (p, t) => { await p.locator('h1', { hasText: t }).first().waitFor({ timeout: 4000 }).catch(() => {}); return p.locator('h1').first().innerText(); };
const card = (p, name) => p.locator('article.tj', { has: p.locator('.nm', { hasText: name }) });
const estado = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('ft.v2')));
const delDia = (st) => st.faltas.filter((f) => f.date === LUNES);

// ---------- A · «Fui» y «Falté» en un día normal ----------
console.log('A · Fui y Falté');
{
  const { c, p } = await abrir(F.estado({ comprobado: '2026-11-13' }));
  ok((await p.locator('h1').innerText()) === 'Hoy', 'abre en Hoy');
  ok((await sem(p)) === 'Puedes faltar.', 'semáforo verde');
  ok(/hace 3 días/.test(await p.locator('.sem .comp').innerText()), '«Comprobado con tu lista hace 3 días»');
  ok(await p.locator('article.tj').count() === 3, 'una tarjeta por asignatura (sin tutoría)');
  ok(/Si faltas[\s\S]*te quedan 12,5 h/.test(await card(p, 'Bases de dades').innerText()), 'Bases de dades: «si faltas, te quedan 12,5 h»');
  await shot(p, 'hoy-verde');
  await p.getByRole('button', { name: 'Fui a Bases de dades' }).click();
  const bd = await card(p, 'Bases de dades').innerText();
  ok(/Fuiste/.test(bd) && /te quedan 13,5 h/.test(bd) && /llevas 0 %/.test(bd) && !/Si faltas/.test(bd), 'tras «Fui»: enseña lo que tienes ahora (13,5 h, 0 %)');
  ok(/Llevas 0 h de 13,5 h/.test(bd), 'y cuánto llevas del límite');
  ok((await estado(p)).fui[LUNES].includes('Bases de dades|17:00'), '«Fui» queda guardado');
  await shot(p, 'hoy-fui');
  await p.locator('#aviso .undo').click();
  ok(/Si faltas/.test(await card(p, 'Bases de dades').innerText()), '«Deshacer» lo devuelve');
  await p.getByRole('button', { name: 'Falté a Llenguatges de marques' }).click();
  const lm = await card(p, 'Llenguatges de marques').innerText();
  ok(/Falta apuntada/.test(lm) && /te quedan 9,5 h/.test(lm), 'tras «Falté»: falta apuntada, te quedan 9,5 h');
  // Programació (2 h): «Solo a las 16:00»
  await p.getByRole('button', { name: 'Falté a Programació solo a las 16:00' }).click();
  const pg = await card(p, 'Programació').innerText();
  ok(/Ya apuntado: 16:00 faltaste/.test(pg) && /Falté\s*$/m.test(pg), 'una hora de dos: queda la otra con «Falté»');
  await p.getByRole('button', { name: 'Fui a Programació' }).click();
  await p.getByRole('button', { name: 'Fui a Bases de dades' }).click();
  ok((await sem(p)) === 'Hoy ya está apuntado.', 'todo apuntado: «Hoy ya está apuntado»');
  const st = await estado(p);
  ok(delDia(st).length === 2 && delDia(st).every((f) => f.start), '2 faltas guardadas, cada una con su hora');
  await shot(p, 'hoy-apuntado');
  await p.getByRole('button', { name: 'Quitar lo apuntado en Llenguatges de marques' }).click();
  ok(/Si faltas/.test(await card(p, 'Llenguatges de marques').innerText()), '«Quitar» la deja sin apuntar');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- B · fallos 4, 9 y 15 ----------
console.log('B · fallos 4, 9 y 15 de la v1');
{
  // 15: dos en ámbar → nombra la más justa (Llenguatges, 1,5 h), no la primera (Bases de dades, 2 h)
  let { c, p } = await abrir(F.estado({ faltas: F.previas('Bases de dades', 10.5).concat(F.previas('Llenguatges de marques', 8)) }));
  ok((await sem(p)) === 'Mejor no.', 'ámbar');
  ok(/Llenguatges de marques te quedarían 1,5 h/.test(await p.locator('.sem .frase').innerText()), 'fallo 15: nombra la más justa');
  await shot(p, 'hoy-ambar');
  // 4: al apuntar la falta, el semáforo no la vuelve a contar
  await p.getByRole('button', { name: 'Falté a Llenguatges de marques' }).click();
  ok(/te quedan 1,5 h/.test(await card(p, 'Llenguatges de marques').innerText()), 'fallo 4: tras apuntar, 1,5 h (no 0,5)');
  ok(/Bases de dades te quedarían 2 h/.test(await p.locator('.sem .frase').innerText()), 'el semáforo pasa a la siguiente pendiente');
  await c.close();
  // 9: pasado del límite
  ({ c, p } = await abrir(F.estado({ faltas: F.previas('Llenguatges de marques', 12) })));
  ok((await sem(p)) === 'Hoy no.', 'rojo');
  ok(/te pasas 2,5 h/.test(await card(p, 'Llenguatges de marques').innerText()), 'fallo 9: «te pasas 2,5 h», no «0 h»');
  await p.getByRole('button', { name: 'Fui a Llenguatges de marques' }).click();
  ok(/te has pasado 1,5 h/.test(await card(p, 'Llenguatges de marques').innerText()), 'tras «Fui»: «te has pasado 1,5 h»');
  await shot(p, 'hoy-rojo');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- C · todo el día en 1 toque; «Falté a…» en 3 ----------
console.log('C · Todo el día y Falté a…');
{
  const { c, p } = await abrir(F.estado());
  await p.getByRole('button', { name: 'Falté todo el día' }).click();
  ok((await sem(p)) === 'Hoy ya está apuntado.' && delDia(await estado(p)).length === 4, '«Falté todo el día»: 1 toque, 4 h');
  await p.locator('#aviso .undo').click();
  ok(delDia(await estado(p)).length === 0, '«Deshacer» lo quita todo');
  // 3 toques: abrir, «Falté a todas», apuntar
  await p.getByRole('button', { name: 'Falté a…', exact: true }).click();
  ok((await p.locator('h1').innerText()) === '¿A qué clases has faltado?', 'abre «Falté a…»');
  ok(await p.locator('#tabs').isHidden(), 'sin pestañas mientras apuntas');
  await p.getByRole('button', { name: 'Falté a todas' }).click();
  ok((await p.locator('.foot .btn').innerText()) === 'Apuntar 4 h', 'botón «Apuntar 4 h»');
  await shot(p, 'falte-todas');
  await p.getByRole('button', { name: 'Apuntar 4 h' }).click();
  ok((await titulo(p, 'Hoy')) === 'Hoy' && delDia(await estado(p)).length === 4, '3 toques para un día entero');
  // corregir: abre con lo apuntado; dejar solo una hora de Programació, retraso en Bases de dades, con justificante
  await p.getByRole('button', { name: 'Cambiar lo de hoy' }).click();
  ok(await p.locator('.clase[aria-pressed="true"]').count() === 3, 'abre con lo ya apuntado marcado');
  await p.getByRole('button', { name: 'Falté a todas' }).click(); // quita todas
  await p.locator('.clase', { hasText: 'Programació' }).click();
  await p.locator('.subs .seg', { hasText: '15:00' }).click();
  ok(/faltaste 1 h/.test(await p.locator('.clase', { hasText: 'Programació' }).innerText()), 'una hora de un bloque de 2');
  await p.getByRole('button', { name: 'Llegué tarde a una' }).click();
  await p.locator('.blq', { hasText: 'Bases de dades' }).getByRole('button', { name: 'Llegué tarde' }).click();
  await p.getByText('Tengo justificante').click();
  ok((await p.locator('.foot .btn').innerText()) === 'Apuntar 1 h y 1 retraso', 'botón «Apuntar 1 h y 1 retraso»');
  await shot(p, 'falte-tarde');
  await p.locator('.foot .btn').click(); await titulo(p, 'Hoy');
  const d = delDia(await estado(p));
  ok(d.length === 2 && d.some((f) => f.type === 'retraso' && f.subject === 'Bases de dades') && d.some((f) => f.type === 'falta' && f.start === '16:00') && d.every((f) => f.justified), 'guarda 1 h (16:00) y 1 retraso, justificados');
  ok((await estado(p)).fui[LUNES].includes('Llenguatges de marques|18:20'), 'lo no marcado queda como «fui»');
  ok(/Retraso apuntado/.test(await card(p, 'Bases de dades').innerText()), 'la tarjeta dice «Retraso apuntado»');
  // un día pasado desde la fila de días
  await p.getByRole('button', { name: 'Cambiar lo de hoy' }).click();
  await p.getByRole('radio', { name: 'Vie 13' }).click();
  ok((await p.locator('h1').innerText()) === '¿A qué clases faltaste?' && /viernes 13/i.test(await p.locator('#app .sub').first().innerText()), 'cambia a un día pasado');
  ok(/Sistemes/.test(await p.locator('#app').innerText()), 'con las clases de ese día');
  await p.locator('.clase', { hasText: 'Sistemes' }).click();
  await p.locator('.foot .btn').click();
  ok((await estado(p)).faltas.filter((f) => f.date === '2026-11-13').length === 2, 'apunta en el viernes (2 h de Sistemes)');
  ok((await titulo(p, 'Hoy')) === 'Hoy', 'vuelve a Hoy');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- D · fallo 5: festivos, días pasados sin apuntar, dos límites ----------
console.log('D · festivos, días sin apuntar y dos límites');
{
  let { c, p } = await abrir(F.estado(), null, '2026-12-08');
  ok((await sem(p)) === 'Día libre.' && /Inmaculada/.test(await p.locator('.sem .frase').innerText()), 'festivo: «Día libre», con el motivo');
  ok(await p.locator('.tj button, .acc button').count() === 0, 'fallo 5: en un festivo no se puede apuntar');
  ok(/Si faltas el miércoles 9 dic/i.test(await p.locator('#app').innerText()), 'enseña el siguiente día de clase');
  await shot(p, 'festivo');
  await c.close();
  ({ c, p } = await abrir(F.estado({ since: '2026-12-01' }), null, '2026-12-09'));
  ok(/Ayer|El /.test(await p.locator('.preg').innerText()) && /lunes 7 dic/.test(await p.locator('.preg').innerText()), 'pregunta por el último día sin apuntar, saltando el festivo');
  await p.getByRole('button', { name: 'Falté a alguna' }).click();
  ok(!(await p.locator('.dias').innerText()).includes('Mar 8'), '«Falté a…» no ofrece el festivo');
  await p.locator('.top .back').click(); await titulo(p, 'Hoy');
  await p.getByRole('button', { name: 'Sí, a todo' }).click();
  ok(/viernes 4 dic/.test(await p.locator('.preg').innerText()), '«Sí, a todo» pasa al día anterior');
  await c.close();
  ({ c, p } = await abrir(F.estado({ settings: { limites: [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }] }, faltas: F.previas('Llenguatges de marques', 4) }), { colorScheme: 'dark', viewport: { width: 320, height: 640 } }));
  ok((await sem(p)) === 'Solo con justificante.', 'dos límites: «Solo con justificante»');
  ok(await card(p, 'Llenguatges de marques').locator('.mt').count() === 2, 'dos barras en la tarjeta');
  ok(/Sin justificante[\s\S]*Con justificante/.test(await card(p, 'Llenguatges de marques').innerText()), 'cada barra con su nombre');
  await shot(p, 'dos-limites-oscuro-320');
  await p.getByRole('button', { name: 'Falté a…', exact: true }).click();
  await shot(p, 'falte-oscuro-320');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- E · simulador (1.6) ----------
console.log('E · simulador');
{
  const { c, p } = await abrir(F.estado({ settings: { limites: [{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }] }, faltas: F.previas('Llenguatges de marques', 4) }));
  await p.getByRole('button', { name: 'Simular' }).click();
  ok(/¿Y si falto el lunes 16 nov\?/.test(await p.locator('h1').innerText()), 'abre el simulador en hoy');
  ok((await sem(p)) === 'Solo con justificante.', 'mismo semáforo que Hoy');
  await p.getByText('Tendré justificante').click();
  ok((await sem(p)) !== 'Solo con justificante.' && (await sem(p)) !== 'Hoy no.', '«Tendré justificante» cambia el semáforo');
  await p.getByRole('radio', { name: 'Mañana' }).click();
  ok(/martes 17 nov/.test(await p.locator('h1').innerText()) && /Entorns/.test(await p.locator('#app').innerText()), 'otro día: sus clases');
  ok(!(await p.locator('#app button', { hasText: /^Falté$/ }).count()), 'simular no tiene botones de apuntar');
  await shot(p, 'simular');
  const antes = (await estado(p)).faltas.length;
  await p.locator('.top .back').click();
  ok((await titulo(p, 'Hoy')) === 'Hoy' && (await estado(p)).faltas.length === antes, 'vuelve a Hoy sin haber apuntado nada');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

await browser.close();
srv.kill();
console.log(fallos.length ? '\n' + fallos.length + ' FALLOS' : '\nTodo correcto');
process.exit(fallos.length ? 1 : 0);
