// Prueba de extremo a extremo del alta v2 en un navegador real (Playwright + Chrome).
// Arranca su propio servidor local (KV vacío) en un puerto libre. Uso: node scripts/e2e-alta.mjs [carpeta-capturas]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';

import { spawn } from 'node:child_process';
const PORT = 8900 + Math.floor(Math.random() * 90);
const srv = spawn(process.execPath, [new URL('./serve-v2.mjs', import.meta.url).pathname, String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok) => srv.stdout.once('data', ok));
const BASE = 'http://localhost:' + PORT;
const OUT = process.argv[2] || '/tmp/nv-shots';
fs.mkdirSync(OUT, { recursive: true });
const fallos = [];
const ok = (cond, msg) => { if (!cond) { fallos.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
async function ctx(opts) {
  const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, locale: 'es-ES' }, opts || {}));
  const p = await c.newPage();
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource|analisi\./.test(m.text())) p.errores.push(m.text()); });
  return { c, p };
}
let n = 0;
async function shot(p, name) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 0, name + ': sin desbordar a lo ancho (' + over + ' px)');
  const small = await p.evaluate(() => Array.from(document.querySelectorAll('#alta button, #alta a, #alta input:not(.sr), #alta select, #alta label[role=button]'))
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !el.closest('.tt.view') && !el.closest('label.toggle'); })
    .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 24)));
  ok(small.length === 0, name + ': zonas táctiles ≥ 44 px' + (small.length ? ' (' + small.join(', ') + ')' : ''));
  await p.screenshot({ path: OUT + '/' + String(++n).padStart(2, '0') + '-' + name + '.png', fullPage: true });
}
const h1 = async (p, esperado) => { if (esperado) await p.locator('h1', { hasText: esperado }).first().waitFor({ timeout: 8000 }).catch(() => {}); return p.locator('h1').innerText(); };
const tap = (p, name) => p.getByRole('button', { name, exact: true }).first().click();
const radio = (p, name) => p.getByRole('radio', { name }).first().click();

// ---------- A · el primero de la clase: pinta el horario ----------
console.log('A · primer alumno');
{
  const { c, p } = await ctx();
  await p.goto(BASE + '/');
  await p.waitForURL(/alta\.html/);
  ok(true, 'sin configurar, la app manda al alta nueva');
  await p.goto(BASE + '/alta.html?hoy=2026-11-16');
  ok((await h1(p)) === '¿En qué instituto estudias?', 'abre en el instituto');
  await p.fill('#q', 'pedral');
  await p.getByRole('button', { name: /Institut Pedralbes/ }).click();
  ok((await h1(p)) === '¿Qué estudias?', 'pasa al ciclo');
  await shot(p, 'ciclo');
  await radio(p, /^DAW ·/); await radio(p, 'Tarde');
  await tap(p, 'Siguiente');
  ok((await h1(p, 'captura')) === '¿Tienes una captura de tu horario?', 'sin plantilla: pide captura');
  await shot(p, 'fuente');
  await tap(p, 'Lo pinto yo');
  await p.selectOption('#hd', '55'); await p.selectOption('#hr', '3'); await p.selectOption('#hrd', '20');
  await tap(p, 'Usar estas horas');
  ok(await p.locator('#tt .gap').count() === 1, 'se ve el recreo en la rejilla');
  // pinta: Programació lunes 3 h arrastrando, Bases de dades martes 2 h tocando
  await radio(p, 'PROG');
  const cell = (v) => p.locator('#tt [data-v="' + v + '"]');
  const b0 = await cell('1:0').boundingBox(), b2 = await cell('1:2').boundingBox();
  await p.mouse.move(b0.x + 10, b0.y + 10); await p.mouse.down();
  await p.mouse.move(b0.x + 10, (b0.y + b2.y) / 2 + 10, { steps: 4 }); await p.mouse.move(b2.x + 10, b2.y + 10, { steps: 4 }); await p.mouse.up();
  ok((await cell('1:2').getAttribute('aria-label')).includes('Programació'), 'arrastrar pinta varias casillas');
  await radio(p, 'BD'); await cell('2:0').click(); await cell('2:1').click();
  await radio(p, 'LMSGI'); await cell('3:3').click(); await cell('4:4').click();
  ok((await cell('2:1').getAttribute('aria-label')).includes('Bases de dades'), 'tocar pinta');
  await cell('4:4').click();
  ok((await cell('4:4').getAttribute('aria-label')).includes('vacía'), 'tocar otra vez la borra');
  await shot(p, 'editor');
  await tap(p, 'Siguiente');
  ok(/calendario/i.test(await h1(p)), 'calendario');
  ok((await p.locator('.list').innerText()).includes('La Mercè'), 'festivos de Barcelona puestos solos');
  await tap(p, 'Ponlos luego');
  await shot(p, 'calendario');
  await tap(p, 'Siguiente');
  ok((await h1(p)) === '¿Cómo cuentan las faltas en tu centro?', 'reglas 1');
  await shot(p, 'reglas1');
  await radio(p, /Un límite para cada tipo/); await tap(p, 'Siguiente');
  ok((await p.locator('h2').allInnerTexts()).join('|') === 'Sin justificante|Con justificante', 'rama de dos límites: dos porcentajes');
  await shot(p, 'reglas2c');
  await tap(p, 'Siguiente');
  await radio(p, '3 retrasos = 1 falta'); await shot(p, 'reglas3'); await tap(p, 'Siguiente');
  const res = await p.locator('.card').first().innerText();
  ok(res.includes('Puedes faltar el 10 % sin justificante y otro 15 % con justificante, en cada módulo y cada trimestre.'), 'resumen en una frase');
  ok((await p.locator('.list').innerText()).includes('Sin justificante, hasta'), 'ejemplo en horas');
  await shot(p, 'reglas4');
  await tap(p, 'Sí, es así');
  await radio(p, /^Sí/);
  await p.getByRole('button', { name: 'Añadir 1 hora Sin justificante en Programació' }).click();
  await p.getByRole('button', { name: 'Añadir 1 hora Sin justificante en Programació' }).click();
  await shot(p, 'previas');
  await tap(p, 'Siguiente');
  ok((await h1(p)) === 'Ya está', 'pantalla final');
  await shot(p, 'listo');
  await tap(p, 'Empezar');
  await p.waitForURL(BASE + '/');
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('ft.v2')));
  ok(st && st.config && st.config.schedule['1'][0].hours === 3, 'estado guardado con el horario');
  ok(JSON.stringify(st.settings.limites) === JSON.stringify([{ pct: 10, sin: 1, just: 0 }, { pct: 15, sin: 0, just: 1 }]), 'reglas guardadas');
  ok(st.faltas.reduce((a, f) => a + f.hours, 0) === 2 && st.faltas.every((f) => f.note === 'previas' && f.subject === 'Programació'), 'faltas de antes (2 h)');
  await p.waitForTimeout(2600);
  const txt = await p.locator('#app').innerText();
  ok(!/¿En qué instituto|Elige tu centro/.test(txt) && txt.length > 20, 'la app abre directamente en su pantalla principal');
  await p.screenshot({ path: OUT + '/' + String(++n).padStart(2, '0') + '-v1-hoy.png' });
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- B · un compañero: solo confirma ----------
console.log('B · compañero con plantilla');
{
  const { c, p } = await ctx();
  await p.goto(BASE + '/alta.html?hoy=2026-11-16');
  await p.fill('#q', 'pedralbes');
  await p.getByRole('button', { name: /Institut Pedralbes/ }).click();
  await radio(p, /^DAW ·/); await radio(p, 'Tarde'); await tap(p, 'Siguiente');
  ok((await h1(p, 'Es este')) === '¿Es este tu horario?', 've la plantilla de su clase');
  ok((await p.locator('.badge').innerText()).includes('1 compañero'), 'dice quién la subió');
  await tap(p, 'No voy a todos: quitar alguno');
  await p.getByRole('checkbox').last().uncheck();
  await shot(p, 'plantilla');
  await tap(p, 'Sí, es este');
  await tap(p, 'Siguiente');
  ok((await h1(p)) === '¿Es así en tu centro?', 'reglas del centro ya puestas: solo confirma');
  ok((await p.locator('.badge').innerText()).includes('compañero'), 'reglas confirmadas por compañeros');
  await shot(p, 'reglas4-compañero');
  await tap(p, 'Sí, es así');
  await radio(p, 'No, ninguna'); await tap(p, 'Siguiente');
  await tap(p, 'Empezar'); await p.waitForURL(BASE + '/');
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('ft.v2')));
  ok(Object.values(st.config.schedule).flat().every((b) => b.subject !== 'Llenguatges de marques'), 'quitó el módulo que no cursa');
  ok(st.settings.retrasosPorFalta === 3, 'reglas heredadas');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

// ---------- C · ramas de un solo porcentaje, «No lo sé», oscuro y 320 px ----------
console.log('C · ramas, oscuro y pantalla pequeña');
{
  const { c, p } = await ctx({ colorScheme: 'dark', viewport: { width: 320, height: 640 } });
  await p.route('**/analisi.transparenciacatalunya.cat/**', (r) => r.abort()); // simula que no hay red
  await p.goto(BASE + '/alta.html?hoy=2026-11-16');
  await p.getByRole('button', { name: 'No está mi instituto' }).click();
  await p.fill('#cn', 'Institut de Prova'); await p.fill('#cc', 'Lleida'); await tap(p, 'Siguiente');
  await p.getByRole('button', { name: 'No está mi ciclo' }).click(); await p.fill('#co', 'Cures auxiliars d’infermeria'); await radio(p, 'Mañana'); await tap(p, 'Siguiente');
  await tap(p, 'Lo pinto yo'); await tap(p, 'Usar estas horas');
  await p.getByRole('button', { name: '+ Otra' }).click(); await p.fill('#ns', 'Higiene'); await tap(p, 'Añadir');
  await p.locator('#tt [data-v="1:0"]').click();
  await shot(p, 'oscuro-320-editor');
  await tap(p, 'Siguiente');
  await p.locator('.list', { hasText: 'No los he encontrado' }).waitFor({ timeout: 8000 }).catch(() => {});
  ok((await p.locator('.list').innerText()).includes('No los he encontrado'), 'sin red: pide añadir los festivos locales');
  await tap(p, 'Siguiente');
  await radio(p, /Todas cuentan igual/); await tap(p, 'Siguiente');
  ok(await p.getByRole('radio', { name: 'Todas' }).getAttribute('aria-checked') === 'true', 'rama «todas»: Todas ya marcado');
  ok(await p.getByRole('radio', { name: '25 %' }).getAttribute('aria-checked') === 'true', 'rama «todas»: 25 % ya puesto');
  await shot(p, 'oscuro-320-reglas2a');
  await p.locator('[data-a="back"]').click();
  await radio(p, /Solo las que no justificas/); await tap(p, 'Siguiente');
  ok(await p.getByRole('radio', { name: 'Solo sin justificante' }).getAttribute('aria-checked') === 'true', 'rama «sin»: solo sin justificante ya marcado');
  await radio(p, 'Otro'); await p.fill('#popct', '12,5'); await tap(p, 'Siguiente');
  await tap(p, 'Siguiente');
  ok((await p.locator('.card').first().innerText()).includes('12,5 %'), 'porcentaje propio');
  await tap(p, 'Cambiar algo');
  await p.getByRole('button', { name: 'No lo sé' }).click();
  ok((await p.locator('.card.amb').innerText()).includes('15 %'), '«No lo sé» usa el 15 %');
  await shot(p, 'oscuro-320-nolose');
  await tap(p, 'Siguiente'); await radio(p, 'De cada RA'); await tap(p, 'Siguiente');
  ok((await p.locator('.card.amb').allInnerTexts()).join(' ').includes('RA'), 'por RA: aviso de aproximado');
  ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
  await c.close();
}

await browser.close();
srv.kill();
console.log(fallos.length ? '\n' + fallos.length + ' FALLOS' : '\nTodo correcto');
process.exit(fallos.length ? 1 : 0);
