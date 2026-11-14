const {open}=require('./lib.js');const fs=require('fs');const cmp=require('./cmp.js');
(async()=>{const sB=JSON.parse(fs.readFileSync('w/state_B.json'));
const x=await open({state:sB});const {p,shot}=x;
await p.click('[data-tab=ajustes]');await p.click('[data-aj=horario]');await p.click('[data-act=edit]');await p.waitForTimeout(500);await shot('e01_editor_rejilla');
await p.click('[data-act=q-next]');await p.waitForTimeout(300);await p.click('[data-act=q-next]');await p.waitForTimeout(300);await shot('e02_reglas');
await p.click('[data-act=q-next]');await p.waitForTimeout(600);await shot('e03_tras_guardar');
console.log((await x.txt()).replace(/\n+/g,' | ').slice(0,700));
// puede pedir "desde qué día"
const btns=await p.$$eval('#app button',bs=>bs.map(b=>(b.dataset.act||Object.keys(b.dataset).join(','))+':'+b.innerText.replace(/\n/g,' ').slice(0,40)));console.log(btns.join(' ; '));
await p.click('[data-act=desde-all]');await p.waitForTimeout(600);await shot('e03b_tras_corregir');console.log((await x.txt()).replace(/\n+/g,' | ').slice(0,600));const u=await x.st();console.log(JSON.stringify(u.config.schedule[1]),'history',(u.config.history||[]).length);
cmp(u,'tras abrir Cambiar mi horario y guardar SIN tocar nada');
fs.writeFileSync('w/state_editbug.json',JSON.stringify(u,null,1));
await p.click('[data-tab=faltas]').catch(()=>{});await p.waitForTimeout(500);await shot('e04_faltas_tras_editar');
console.log('errs',x.errs.filter(e=>!/CORS/.test(e)));await x.b.close();})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
