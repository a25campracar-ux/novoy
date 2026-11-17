// Recorrido en Chrome de Faltas (1.3), Ajustes (1.4), PROJ (1.5), casos de mitad de curso (1.11),
// enlace de clase (1.7) y cuenta (1.8). Datos inventados. Uso: node scripts/e2e-ajustes.mjs [carpeta-capturas]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const F = require('../tests/fixtures/hoy-estado.js');
const AJ = require('../site/v2/ajustes.js');

const PORT = 8900 + Math.floor(Math.random() * 90);
const srv = spawn(process.execPath, [new URL('./serve-v2.mjs', import.meta.url).pathname, String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok) => srv.stdout.once('data', ok));
const BASE = 'http://localhost:' + PORT, LUNES = '2026-11-16';
const OUT = process.argv[2] || '/tmp/nv-ajustes';
fs.mkdirSync(OUT, { recursive: true });
const fallos = [];
const ok = (cond, msg) => { if (!cond) { fallos.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const exe = fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

async function abrir(estado, opts, ruta) {
  const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, locale: 'es-ES', serviceWorkers: 'block' }, opts || {}));
  if (estado) await c.addInitScript((s) => { if (!sessionStorage.getItem('nv.e2e')) { localStorage.setItem('ft.v2', s); sessionStorage.setItem('nv.e2e', '1'); } }, JSON.stringify(estado));
  const p = await c.newPage();
  p.setDefaultTimeout(8000);
  p.errores = [];
  p.on('pageerror', (e) => p.errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource|analisi\./.test(m.text())) p.errores.push(m.text()); });
  await p.goto(BASE + (ruta || '/?hoy=' + LUNES));
  await p.locator('h1').first().waitFor();
  return { c, p };
}
let n = 0;
async function shot(p, name) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 0, name + ': sin desbordar a lo ancho (' + over + ' px)');
  const small = await p.evaluate(() => Array.from(document.querySelectorAll('main button, main a, main input:not([type=checkbox]), main select, #tabs a'))
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !el.closest('label.toggle') && !el.closest('.tt.view') && !el.matches('.quita, .toast .undo, .sub a'); })
    .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 24)));
  ok(small.length === 0, name + ': zonas táctiles ≥ 44 px' + (small.length ? ' (' + small.join(', ') + ')' : ''));
  await p.screenshot({ path: OUT + '/' + String(++n).padStart(2, '0') + '-' + name + '.png', fullPage: true });
}
const titulo = async (p, t) => { await p.locator('h1', { hasText: t }).first().waitFor({ timeout: 5000 }).catch(() => {}); return p.locator('h1').first().innerText(); };
const estado = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('ft.v2')));
const tab = (p, t) => p.locator('#tabs a', { hasText: t }).click();
const sinErrores = (p) => ok(p.errores.length === 0, 'sin errores de JavaScript' + (p.errores.length ? ': ' + p.errores.join(' | ') : ''));
const conFaltas = () => {
  const u = F.estado({ faltas: F.previas('Bases de dades', 10) });
  u.faltas.push({ id: 'f1', date: '2026-11-09', start: '15:00', subject: 'Programació', hours: 1, type: 'falta', justified: false });
  u.faltas.push({ id: 'f2', date: '2026-11-09', start: '16:00', subject: 'Programació', hours: 1, type: 'falta', justified: false });
  return u;
};

// ---------- F · Faltas: lo que te queda y justificar en 3 toques ----------
console.log('F · Faltas');
{
  const { c, p } = await abrir(conFaltas());
  ok(await p.locator('#tabs a').count() === 3, 'tres pestañas: Hoy, Faltas y Ajustes');
  await tab(p, 'Faltas');                                                          // toque 1
  ok((await titulo(p, 'Faltas')) === 'Faltas', 'abre Faltas');
  ok((await p.locator('article.tj .nm').first().innerText()) === 'Bases de dades', 'la más justa arriba');
  ok(/te quedan 3,5 h/.test(await p.locator('article.tj').first().innerText()), 'Bases de dades: te quedan 3,5 h');
  await shot(p, 'faltas');
  await p.getByRole('button', { name: /^Programació/ }).click();                   // toque 2
  ok(/Lunes 9 nov[\s\S]*2 h · 15:00, 16:00/.test(await p.locator('.fls').innerText()), 'sus faltas, agrupadas por día');
  await p.getByRole('button', { name: 'Justificar, Lunes 9 nov' }).click();         // toque 3
  let st = await estado(p);
  ok(st.faltas.filter((f) => f.date === '2026-11-09').every((f) => f.justified), 'justificada en 3 toques');
  ok(/Justificada/.test(await p.locator('.fls').innerText()), 'se ve «Justificada»');
  await shot(p, 'faltas-justificada');
  await p.getByRole('button', { name: 'Borrar la falta del Lunes 9 nov' }).click();
  ok((await estado(p)).faltas.filter((f) => f.date === '2026-11-09').length === 0, 'borrar');
  await p.locator('#aviso .undo').click();
  ok((await estado(p)).faltas.filter((f) => f.date === '2026-11-09').length === 2, '«Deshacer» la devuelve');
  await p.getByRole('radio', { name: '2n trim.' }).click();
  ok(/Ninguna|Sin faltas/.test(await p.locator('#app').innerText()), 'otro trimestre, sin faltas');
  await p.getByRole('button', { name: 'Apuntar otro día' }).click();
  ok(/¿A qué clases/.test(await titulo(p, '¿A qué clases')), '«Apuntar otro día» abre «Falté a…»');
  await p.getByRole('button', { name: 'Otro día' }).click();
  await p.fill('#otrodia', '2026-10-12');
  ok(/no tienes clase/.test(await p.locator('#aviso').innerText()), 'un festivo de otro día: no deja');
  await p.fill('#otrodia', '2026-10-14');
  ok(/miércoles 14 oct/i.test(await p.locator('#app .sub').first().innerText()), 'otro día cualquiera del curso');
  // faltas de una asignatura que ya no está (un «PROJ de un profesor»): pasarlas a su clase
  await c.close();
  const v = conFaltas(); v.faltas.push({ id: 'pj', date: '2026-11-13', start: '17:00', subject: 'PROJ Pol', hours: 1, type: 'falta', justified: false });
  const x = await abrir(v, null, '/?hoy=' + LUNES + '#faltas');
  await x.p.getByRole('button', { name: /^PROJ Pol/ }).click().catch(() => {});
  ok(/Ya no está en tu horario/.test(await x.p.locator('#app').innerText()), 'una asignatura que ya no está sale aparte');
  await x.p.getByRole('button', { name: 'Pasarlas a su clase' }).click();
  ok((await estado(x.p)).faltas.find((f) => f.id === 'pj').subject === 'Sistemes', '«Pasarlas a su clase»: el viernes a las 17:00 es Sistemes');
  await shot(x.p, 'faltas-reubicar');
  sinErrores(x.p);
  await x.c.close();
}

// ---------- G · Ajustes: PROJ, fechas, semanas, regla propia, contar ----------
console.log('G · Ajustes de asignaturas');
{
  const u = F.estado();
  u.config.schedule['2'] = [{ start: '15:00', end: '17:00', subject: 'PROJ', hours: 2, cuenta: 'Entorns' }, { start: '17:00', end: '18:00', subject: 'Entorns', hours: 1 }];
  const { c, p } = await abrir(u, null, '/?hoy=2026-11-17');
  await tab(p, 'Ajustes');
  ok((await titulo(p, 'Ajustes')) === 'Ajustes', 'abre Ajustes');
  await shot(p, 'ajustes');
  await p.getByRole('button', { name: /^Asignaturas/ }).click();
  await p.getByRole('button', { name: /^PROJ/ }).click();
  ok((await titulo(p, 'PROJ')) === 'PROJ', 'ficha de la asignatura');
  await p.selectOption('#cu21500', 'Entorns');
  await p.selectOption('#cu21600', 'Bases de dades');
  let st = await estado(p);
  ok(JSON.stringify(st.config.schedule['2'].map((b) => b.cuenta || '')) === '["Entorns","Bases de dades",""]', '1.5: cada hora de PROJ cuenta en su módulo');
  await shot(p, 'asignatura-proj');
  // fechas: Sistemes empieza en enero
  await p.locator('.top .back').click(); await titulo(p, 'Asignaturas');
  ok(/Cuenta en Entorns y Bases de dades/.test(await p.locator('#app').innerText()), 'la lista lo resume');
  ok(/¿Proyecto \(PROJ\)\? No lo añadas como asignatura/.test(await p.locator('#app').innerText()), 'Asignaturas lleva a las semanas de proyecto');
  await p.getByRole('button', { name: /^Sistemes/ }).click();
  await p.getByRole('button', { name: 'Poner fechas' }).click();
  await p.fill('#fd', '2027-01-08');
  await p.getByRole('button', { name: 'Guardar fechas' }).click();
  st = await estado(p);
  ok(st.config.vigencia && st.config.vigencia.Sistemes.desde === '2027-01-08', '1.11: «Empieza el 8 ene» guardado');
  // regla propia
  await p.getByRole('button', { name: 'Poner una regla propia' }).click();
  await p.getByRole('radio', { name: '10 %' }).click();
  await p.getByRole('button', { name: 'Guardar regla propia' }).click();
  ok(JSON.stringify((await estado(p)).settings.porAsignatura) === '{"Sistemes":{"limites":[{"pct":10,"sin":1,"just":1}]}}', '1.11: regla propia del 10 %');
  await shot(p, 'asignatura-fechas-regla');
  // Hoy: martes 17 con PROJ repartido
  await tab(p, 'Hoy').catch(() => {});
  await p.goto(BASE + '/?hoy=2026-11-17#hoy'); await titulo(p, 'Hoy');
  const cards = await p.locator('article.tj .nm').allInnerTexts();
  ok(JSON.stringify(cards) === '["Entorns","Bases de dades"]', 'Hoy agrupa las horas de PROJ en su módulo (' + cards.join(', ') + ')');
  ok(/incluye PROJ/.test(await p.locator('article.tj').first().innerText()), 'y dice que incluye PROJ');
  await p.goto(BASE + '/?hoy=2026-11-20#hoy'); await titulo(p, 'Hoy');
  ok(!/Sistemes/.test(await p.locator('.stack').innerText()), 'un viernes de noviembre no sale Sistemes');
  ok(/Empiezan más tarde: Sistemes \(8 ene\)/.test(await p.locator('#app').innerText()), '«Empiezan más tarde: Sistemes (8 ene)»');
  // semanas con otro horario
  await p.goto(BASE + '/?hoy=2026-11-20#ajustes/horario'); await titulo(p, 'Tu horario');
  await p.getByRole('button', { name: 'Añadir semanas con otro horario' }).click();
  await p.fill('#sf', '2026-11-23'); await p.fill('#st', '2026-11-27'); await p.fill('#sx', 'Projecte');
  await p.getByRole('button', { name: 'Añadir', exact: true }).click();
  ok(((await estado(p)).config.periods || []).length === 1, '1.11: semanas de proyecto guardadas');
  await shot(p, 'horario-semanas');
  await p.goto(BASE + '/?hoy=2026-11-24#hoy'); await titulo(p, 'Hoy');
  ok(JSON.stringify(await p.locator('article.tj .nm').allInnerTexts()) === '["Projecte"]', 'esa semana Hoy solo tiene Projecte');
  // semanas de proyecto: activar, un toque por semana, y las faltas de esa semana van al proyecto
  await p.goto(BASE + '/?hoy=' + LUNES + '#ajustes/horario'); await titulo(p, 'Tu horario');
  await p.getByRole('button', { name: 'Mi centro hace semanas de proyecto' }).click();
  await p.getByRole('button', { name: 'Activar' }).click();
  await p.getByRole('button', { name: 'Semana del 9 nov' }).click();
  st = await estado(p);
  ok(st.config.proyecto && st.config.proyecto.nombre === 'PROJ' && st.config.periods.some((x) => x.proyecto && x.from === '2026-11-09'), 'semana del 9 nov marcada de proyecto con un toque');
  await shot(p, 'semanas-proyecto');
  await p.goto(BASE + '/?hoy=' + LUNES + '#hoy'); await titulo(p, 'Hoy');
  await p.getByRole('button', { name: 'Esta semana es de PROJ' }).click();
  ok(JSON.stringify(await p.locator('article.tj .nm').allInnerTexts()) === '["PROJ"]' && /Semana de proyecto/.test(await p.locator('#app').innerText()), 'Hoy: un toque y esta semana todo es PROJ');
  await shot(p, 'hoy-proyecto');
  await p.getByRole('button', { name: 'No es de proyecto' }).click();
  ok(!/Semana de proyecto/.test(await p.locator('#app').innerText()), '«No es de proyecto» lo quita');
  // contar: una asignatura que no cursas deja de salir
  await p.goto(BASE + '/?hoy=' + LUNES + '#ajustes/asig/Llenguatges de marques'); await titulo(p, 'Llenguatges');
  await p.getByText('Contar sus faltas').click();
  ok(((await estado(p)).config.nocount || []).includes('Llenguatges de marques'), 'quitar «Contar sus faltas»');
  await p.goto(BASE + '/?hoy=' + LUNES + '#hoy'); await titulo(p, 'Hoy');
  ok(!/Llenguatges de marques/.test(await p.locator('.stack').innerText()), 'y ya no sale en Hoy');
  sinErrores(p);
  await c.close();
}

// ---------- H · cambiar reglas, horario (fallo 7), calendario y pasar la lista, con los pasos del alta ----------
console.log('H · cambiar sin rehacer el alta');
{
  const u = conFaltas(); u.config.schedule['2'][0] = { start: '15:00', end: '17:00', subject: 'Bases de dades', hours: 2, cuenta: 'Entorns' };
  const { c, p } = await abrir(u, null, '/?hoy=' + LUNES + '#ajustes');
  const antes = await estado(p);
  await p.getByRole('link', { name: /^Reglas de faltas/ }).click();
  ok((await titulo(p, '¿Cómo cuentan')) === '¿Cómo cuentan las faltas en tu centro?', 'abre las reglas del alta');
  ok(await p.locator('.prog').count() === 0 && /Cambiar reglas/.test(await p.locator('.top').innerText()), 'sin «paso X de 5»: dice «Cambiar reglas»');
  await p.getByRole('radio', { name: /Solo las que no justificas/ }).click();
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.getByRole('button', { name: 'Sí, es así' }).click();
  await p.waitForURL(/#ajustes/); await titulo(p, 'Ajustes');
  let st = await estado(p);
  ok(JSON.stringify(st.settings.limites) === '[{"pct":20,"sin":1,"just":0}]', 'reglas nuevas: 20 % solo sin justificante');
  ok(st.faltas.length === antes.faltas.length && JSON.stringify(st.config.schedule) === JSON.stringify(antes.config.schedule), 'no toca ni faltas ni horario');
  ok(/20 %/.test(await p.locator('#app').innerText()), 'Ajustes ya dice el 20 %');
  // horario: entrar y guardar sin tocar (fallo 7)
  await p.getByRole('button', { name: /^Horario/ }).click();
  await p.getByRole('link', { name: 'Cambiar horario' }).click();
  ok((await titulo(p, 'Pinta')) === 'Pinta tu horario', 'abre la rejilla con tu horario');
  await shot(p, 'cambiar-horario');
  await p.getByRole('button', { name: 'Siguiente' }).click();
  ok((await titulo(p, 'Desde cuándo')) === '¿Desde cuándo vale este horario?', 'pregunta desde cuándo vale');
  await p.getByRole('radio', { name: /Desde siempre/ }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.waitForURL(/#ajustes/); await titulo(p, 'Ajustes');
  st = await estado(p);
  ok(JSON.stringify(st.config.schedule) === JSON.stringify(antes.config.schedule), 'fallo 7: guardar sin tocar deja el horario igual (también «cuenta dentro de»)');
  // horario: cambiar desde hoy → el de antes queda para las faltas de antes
  await p.goto(BASE + '/alta.html?editar=horario&hoy=' + LUNES); await titulo(p, 'Pinta');
  await p.getByRole('radio', { name: /^PROG/ }).first().click().catch(async () => { await p.locator('.pal .fi').first().click(); });
  await p.locator('#tt [data-v="4:0"]').click();
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.getByRole('radio', { name: /Desde hoy/ }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.waitForURL(/#ajustes/);
  st = await estado(p);
  ok((st.config.history || []).length === 1 && st.config.history[0].to === '2026-11-15', '«desde hoy»: el horario de antes vale hasta ayer');
  // cambiar el nombre de una asignatura: sus faltas y ajustes la siguen
  await p.goto(BASE + '/alta.html?editar=horario&hoy=' + LUNES); await titulo(p, 'Pinta');
  const fiP = p.locator('.pal .fi', { has: p.locator('small', { hasText: /^Programació$/ }) });
  await fiP.click(); await fiP.click();
  await p.fill('#rn', 'Programació DAW'); await p.press('#rn', 'Enter');
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.getByRole('radio', { name: /Desde siempre/ }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.waitForURL(/#ajustes/);
  st = await estado(p);
  ok(!JSON.stringify(st.config.schedule).includes('"Programació"') && st.faltas.filter((f) => f.subject === 'Programació DAW').length === 2, 'nombre nuevo en el horario y en sus faltas');
  // calendario: abrir y guardar sin tocar
  const hol = JSON.stringify(st.config.holidays), ter = JSON.stringify(st.config.terms);
  await p.goto(BASE + '/alta.html?editar=calendario&hoy=' + LUNES); await titulo(p, 'calendario');
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.waitForURL(/#ajustes/);
  st = await estado(p);
  ok(JSON.stringify(st.config.holidays) === hol && JSON.stringify(st.config.terms) === ter, 'calendario: guardar sin tocar lo deja igual');
  // pasar la lista desde Faltas
  await p.goto(BASE + '/alta.html?editar=faltas&hoy=' + LUNES); await titulo(p, '¿Cómo quieres');
  ok(!(await p.getByRole('button', { name: 'En realidad, no he faltado' }).count()), 'sin «no he faltado» al pasar más');
  await p.getByRole('button', { name: /Con una IA/ }).click();
  await p.fill('#imp', '2026-11-12 ; Bases de dades ; 1 ; falta\n2026-11-09 ; Programació DAW ; 2 ; falta');
  await p.getByRole('button', { name: 'Leer la respuesta' }).click();
  await p.getByRole('button', { name: 'Guardar estas faltas' }).click();
  await p.waitForURL(/#faltas/);
  st = await estado(p);
  const p9 = st.faltas.filter((f) => f.date === '2026-11-09' && f.subject === 'Programació DAW');
  ok(p9.length === 2 && p9.reduce((a, f) => a + f.hours, 0) === 2, 'la lista nueva sustituye lo del mismo día y asignatura (sin sumar de más)');
  ok(st.faltas.some((f) => f.date === '2026-11-12' && f.subject === 'Bases de dades') && st.comprobado === LUNES, 'y añade lo nuevo; «comprobado» hoy');
  ok((await titulo(p, 'Faltas')) === 'Faltas', 'vuelve a Faltas');
  sinErrores(p);
  await c.close();
}

// ---------- I · enlace de clase (1.7) ----------
console.log('I · enlace de clase');
{
  const u = F.estado();
  const { c, p } = await abrir(u, null, '/?hoy=' + LUNES + '#ajustes/clase');
  ok((await titulo(p, 'Pásalo')) === 'Pásalo a tu clase', 'pantalla del enlace');
  const url = await p.locator('#url').inputValue();
  ok(/\/alta\.html\?unirse=/.test(url), 'enlace con el grupo');
  await shot(p, 'pasalo');
  // como lo haría el alta al acabar: el horario del grupo, compartido (sin faltas)
  const k = AJ.claves(u.config.catalog.centre, u.config.catalog.cycle, u.config.catalog.turno);
  await p.evaluate(async ([k, data]) => { await fetch('/api/plantilla', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tipo: 'grupo', k, dev: 'a'.repeat(32), data }) }); }, [k.grupo, AJ.datosGrupo(Object.assign({}, u.config, { vigencia: { Sistemes: { desde: '2027-01-08' } } }))]);
  // un compañero sin NoVoy
  const b = await abrir(null, null, url.replace(/^https?:\/\/[^/]+/, '') + '&hoy=' + LUNES);
  ok((await titulo(b.p, '¿Es este')) === '¿Es este tu horario?', 'el compañero cae directo en «¿Es este tu horario?»');
  ok(/Sistemes empieza el 08\/01/.test(await b.p.locator('#alta').innerText()), 'con los casos especiales del grupo');
  await shot(b.p, 'unirse');
  sinErrores(b.p); await b.c.close();
  // alguien que ya usa NoVoy: no se le toca nada
  const conDatos = conFaltas();
  const x = await abrir(conDatos, null, url.replace(/^https?:\/\/[^/]+/, '') + '&hoy=' + LUNES);
  ok((await titulo(x.p, 'Ya usas')) === 'Ya usas NoVoy', 'quien ya la usa: «Ya usas NoVoy»');
  ok((await estado(x.p)).faltas.length === conDatos.faltas.length, 'fallo 1: sus faltas siguen ahí');
  await x.c.close();
  sinErrores(p); await c.close();
}

// ---------- J · cuenta (1.8): crear, recuperar en otro móvil y borrar ----------
console.log('J · cuenta');
{
  const { c, p } = await abrir(conFaltas(), null, '/?hoy=' + LUNES + '#ajustes/cuenta');
  ok((await titulo(p, 'Tu cuenta')) === 'Tu cuenta', 'pantalla de la cuenta');
  const usuario = await p.locator('#cu').inputValue();
  ok(/^[A-Z][a-z]+[A-Z][a-z]+\d{2}$/.test(usuario), 'usuario de frutas ya puesto (' + usuario + ')');
  await p.fill('#cp', 'corta');
  ok(await p.locator('#checks .ok').count() === 0, 'requisitos en vivo');
  await p.fill('#cp', 'Contrasena123'); await p.fill('#cp2', 'Contrasena123');
  ok(await p.locator('#checks .ok').count() === 3, 'los tres requisitos en verde');
  await shot(p, 'cuenta-crear');
  await p.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await p.locator('.kv', { hasText: 'Usuario' }).waitFor();
  ok((await estado(p)).acct && (await estado(p)).acct.u === usuario, 'cuenta creada');
  await p.getByRole('button', { name: 'Guardar ahora' }).click();
  await p.waitForTimeout(800);
  // otro móvil, sin nada: «Ya tengo cuenta» en el alta
  const b = await abrir(null, null, '/?hoy=' + LUNES);
  await b.p.waitForURL(/alta\.html/);
  await b.p.getByRole('button', { name: 'Ya tengo cuenta' }).click();
  await b.p.fill('#eu', usuario); await b.p.fill('#ep', 'Contrasena123');
  await b.p.getByRole('button', { name: 'Entrar' }).click();
  await b.p.waitForURL((u) => !/alta/.test(u.pathname), { timeout: 15000 }).catch(async () => console.log('    (alta dice: ' + (await b.p.locator('#alta').innerText()).replace(/\s+/g, ' ').slice(0, 200) + ')'));
  await titulo(b.p, 'Hoy');
  const st2 = await estado(b.p);
  const stA = await estado(p);
  ok(st2.config && st2.faltas.length === stA.faltas.length && JSON.stringify(st2.config.schedule) === JSON.stringify(stA.config.schedule) && st2.acct.u === usuario, 'en otro móvil: horario y faltas recuperados');
  sinErrores(b.p); await b.c.close();
  // borrar la cuenta
  await p.getByRole('button', { name: 'Borrar mi cuenta' }).click();
  await p.getByRole('button', { name: 'Borrar la cuenta' }).click();
  await p.getByRole('radio', { name: 'Crear cuenta' }).waitFor();
  ok(!(await estado(p)).acct, 'cuenta borrada; los datos siguen en el móvil');
  const r = await p.evaluate(async (u) => (await fetch('/api/acct', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'get', id: '0'.repeat(32), auth: '0'.repeat(32) }) })).json(), usuario);
  ok(r.error === 'no-existe', 'el servidor ya no la tiene');
  sinErrores(p); await c.close();
}

// ---------- K · aviso legal, consejo de la cuenta y borrar todo; oscuro y 320 px ----------
console.log('K · legal, consejo y borrar');
{
  const { c, p } = await abrir(F.estado({ since: '2026-11-02' }), { colorScheme: 'dark', viewport: { width: 320, height: 640 } });
  ok(/Guarda tus faltas en una cuenta/.test(await p.locator('#app').innerText()), 'tras una semana: consejo de crear cuenta');
  await p.getByRole('button', { name: 'Ahora no' }).click();
  ok(!/Guarda tus faltas en una cuenta/.test(await p.locator('#app').innerText()), '«Ahora no» lo esconde');
  await tab(p, 'Faltas'); await titulo(p, 'Faltas'); await shot(p, 'faltas-oscuro-320');
  await tab(p, 'Ajustes'); await titulo(p, 'Ajustes'); await shot(p, 'ajustes-oscuro-320');
  await p.getByRole('link', { name: /Aviso legal/ }).click();
  ok((await titulo(p, 'Aviso legal')) === 'Aviso legal y privacidad' && /La cifra oficial es siempre la de tu centro/.test(await p.locator('main').innerText()), 'aviso legal');
  await shot(p, 'legal');
  await p.goto(BASE + '/?hoy=' + LUNES + '#ajustes/borrar'); await titulo(p, 'Borrar todo');
  await p.getByRole('button', { name: 'Borrar todo' }).click();
  await p.waitForURL(/alta\.html/);
  ok(!(await estado(p)), 'borrar todo: vuelve al alta sin datos');
  sinErrores(p); await c.close();
}

await browser.close();
srv.kill();
console.log(fallos.length ? '\n' + fallos.length + ' FALLOS' : '\nTodo correcto');
process.exit(fallos.length ? 1 : 0);
