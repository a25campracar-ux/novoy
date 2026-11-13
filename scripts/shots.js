const { chromium } = require('playwright'); const S = require('../site/setup.js'); const st = require('../private/estado-camilo.json');
const OUT = '/tmp/claude-0/-home-claude/05616b81-7d0b-5650-b659-d4c30cb74d36/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (name) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, permissions: ['clipboard-read', 'clipboard-write'] }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); return p; };
  const base = 'file:///home/claude/puedo-faltar/build/';
  let p = await mk('preview');
  for (const [d, tab, n] of [['2026-11-12', 'hoy', 'hoy-jue'], ['2026-11-13', 'hoy', 'hoy-vie'], ['2026-11-14', 'hoy', 'hoy-sab'], ['2026-11-16', 'hoy', 'hoy-lun'], ['2026-11-12', 'resumen', 'resumen'], ['2026-11-12', 'faltas', 'faltas'], ['2026-11-12', 'ajustes', 'ajustes']]) {
    await p.goto(base + 'preview/index.html?d=' + d); await p.evaluate(() => localStorage.clear()); await p.goto(base + 'preview/index.html?d=' + d); await p.click('[data-tab=' + tab + ']'); await p.waitForTimeout(1100); await p.screenshot({ path: OUT + n + '.png' });
  }
  // flujo de un usuario nuevo (versión para compartir, sin datos)
  p = await mk('share'); await p.goto(base + 'share/index.html?d=2026-11-12'); await p.screenshot({ path: OUT + 'setup1.png' });
  await p.click('[data-act=copy-prompt]'); const clip = await p.evaluate(() => navigator.clipboard.readText()); console.log('prompt copiado:', clip.includes('puedo-faltar/1'), clip.length);
  await p.click('[data-act=copy-prompt]'); await p.screenshot({ path: OUT + 'setup2.png' });
  await p.click('[data-act=next]'); await p.fill('#paste', 'Aquí tienes:\n```json\n' + S.toExport({ ...st.config, settings: st.settings, faltas: [] }) + '\n```'); await p.screenshot({ path: OUT + 'setup3.png' });
  await p.click('[data-act=review]'); await p.screenshot({ path: OUT + 'setup4.png', fullPage: true });
  await p.click('[data-act=save-setup]'); await p.screenshot({ path: OUT + 'tras-guardar.png' });
  // editor manual desde cero
  p = await mk('editor'); await p.goto(base + 'share/index.html?d=2026-11-12'); await p.click('[data-act=edit]'); await p.screenshot({ path: OUT + 'ed0.png' });
  const dis = await p.$eval('[data-act=ed-save]', (b) => b.disabled); console.log('guardar deshabilitado al inicio:', dis);
  await p.fill('#f-term [name=label]', '1r trimestre'); await p.fill('#f-term [name=from]', '2026-09-14'); await p.fill('#f-term [name=to]', '2026-11-27'); await p.click('#f-term button');
  await p.selectOption('#f-blk [name=day]', '4'); await p.fill('#f-blk [name=start]', '08:00'); await p.fill('#f-blk [name=end]', '10:00'); console.log('horas sugeridas:', await p.inputValue('#f-blk [name=hours]'));
  await p.fill('#f-blk [name=subject]', 'Matemáticas'); await p.click('#f-blk button');
  await p.fill('#f-hol [name=label]', 'Puente'); await p.fill('#f-hol [name=from]', '2026-11-19'); await p.click('#f-hol button');
  await p.screenshot({ path: OUT + 'ed1.png', fullPage: true });
  console.log('guardar habilitado:', !(await p.$eval('[data-act=ed-save]', (b) => b.disabled)));
  await p.click('[data-act=ed-save]'); await p.screenshot({ path: OUT + 'ed-hoy.png' });
  await p.goto(base + 'share/index.html?d=2026-11-19'); await p.waitForTimeout(300); console.log('jueves festivo →', (await p.textContent('.verdict')).replace(/\s+/g, ' '));
  // editor sobre datos existentes: quitar una clase y comprobar recalculo
  p = await mk('editor2'); await p.goto(base + 'preview/index.html?d=2026-11-12'); await p.click('[data-tab=ajustes]'); await p.click('[data-act=edit]');
  await p.click('[data-ed^="blk|5|1"]'); console.log('aviso recalculo:', (await p.textContent('#app')).includes('se recalculan')); await p.click('[data-act=ed-save]'); await p.click('[data-tab=resumen]'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'resumen2.png' });
  // respuesta con errores
  p = await mk('err'); await p.goto(base + 'share/index.html'); await p.click('[data-act=copy-prompt]'); await p.click('[data-act=copy-prompt]'); await p.click('[data-act=next]');
  const bad = JSON.parse(S.toExport({ ...st.config, settings: st.settings, faltas: [] })); bad.horario.lunes[1].inicio = '08:30';
  await p.fill('#paste', JSON.stringify(bad)); await p.click('[data-act=review]'); await p.screenshot({ path: OUT + 'setup-err.png' });
  console.log('errores JS:', JSON.stringify(errs)); await b.close();
})();
