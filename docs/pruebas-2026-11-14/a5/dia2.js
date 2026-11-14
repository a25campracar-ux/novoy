const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/dia2'});
const s0=JSON.parse(fs.readFileSync('state_f2.json'));s0.since='2026-09-14';
const T=async()=>{await p.waitForTimeout(1300);return (await txt()).replace(/\n+/g,' | ')};
const click=async(sel,i=0)=>{const ok=await p.evaluate(([s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)return false;e.click();return true},[sel,i]);await p.waitForTimeout(350);return ok;};
const toast=()=>p.evaluate(()=>document.querySelector('#toast').innerText.replace(/\n/g,' '));
const log=(...a)=>console.log(...a,'\n');
const X={'ft.accx':String(Date.now())};
// a) doble "Falté todo el día"
await go('2026-11-16',s0,X);
await click('.day-btn');await p.waitForTimeout(300);const r2=await click('.day-btn');log('a) segundo todo el día',r2,await toast(),(await st()).faltas.filter(f=>f.date==='2026-11-16').length);
// toast duración
const t0=Date.now();await click('[data-unmiss]');let vis=true;while(vis&&Date.now()-t0<15000){await p.waitForTimeout(250);vis=await p.evaluate(()=>{const t=document.querySelector('#toast');return t.classList.contains('show')||getComputedStyle(t).opacity!=='0'&&t.innerText!==''&&getComputedStyle(t).visibility!=='hidden'&&t.className!==''});}
log('toast visible ms',Date.now()-t0,await p.evaluate(()=>document.querySelector('#toast').className));
// b) falta fuera de curso por la rejilla
await go('2027-06-08',s0,X);await click('[data-tab=faltas]');
await click('[data-fc]',0);await click('[data-fc-add]');log('b) fuera de curso',await toast(),JSON.stringify((await st()).faltas.filter(f=>f.date>'2027-06-05')));
await click('[data-tab=resumen]');log((await T()).slice(0,500));
// festivo en rejilla: semana 7 dic
await go('2026-12-09',s0,X);await click('[data-tab=faltas]');await shot('rejilla-festivos',false);log('rejilla 7-11 dic',(await T()).slice(0,260));
// navidad
await go('2026-12-28',s0,X);await click('[data-tab=faltas]');await shot('rejilla-navidad',false);log('rejilla navidad',(await T()).slice(0,260));
// c) estados de resumen: pasar FIL
await go('2026-11-25',s0,X);await click('[data-tab=faltas]');
for(const [d,h] of [['2026-11-23','21:00'],['2026-11-25','20:00']]){await p.evaluate(([d,h])=>{const e=[...document.querySelectorAll('[data-fc]')].find(e=>{const o=JSON.parse(e.dataset.fc);return o.d===d&&o.st===h});e.click()},[d,h]);await p.waitForTimeout(250);await click('[data-fc-add]');}
// CAT: +2 → sin margen? CAT limit 3.8, lleva 1
await click('[data-tab=resumen]');log('c) RES 25 nov',await T());await shot('resumen-estados');
await click('[data-tab=hoy]');log('HOY 25 nov',await T());await shot('hoy-rojo',false);await shot('hoy-rojo-full');
await go('2026-11-27');await click('[data-tab=resumen]');log('RES 27 nov (último día 1a)',await T());await shot('resumen-asalvo');
// cambiar de evaluación
await click('[data-term]',1);log('RES 2a',(await T()).slice(0,300));
// d) simulador
await go('2026-11-18',s0,X);await click('[data-tab=resumen]');await click('[data-act=open-sim]');log('d) SIM',await T());await shot('sim0');
await click('[data-act=sim-all]');log('SIM all',await T());await shot('sim-all');await shot('sim-all-vp',false);
await p.fill('#simday','2026-11-20');await p.dispatchEvent('#simday','change');log('SIM viernes',await T());
await p.fill('#simday','2026-12-01');await p.dispatchEvent('#simday','change');await p.waitForTimeout(300);await click('[data-sim]',0);log('SIM 1 dic',await T());
await click('.btn.primary.block[data-miss]');log('anotar futuro',await toast(),JSON.stringify((await st()).faltas.filter(f=>f.date==='2026-12-01')),(await T()).slice(0,200));
// e) editar una falta
await go('2026-11-18',s0,X);await click('[data-tab=faltas]');await click('[data-edit]',1);log('e) EDIT',(await T()).slice(0,120));await shot('editar');
await p.evaluate(()=>{const e=document.querySelector('#edf');e.scrollIntoView()});await shot('editar-vp',false);
log(await p.$eval('#edf',e=>e.innerText.replace(/\n+/g,' | ')));
await click('#eju');await p.evaluate(()=>document.querySelector('#edf').requestSubmit());await p.waitForTimeout(300);log(await toast(),JSON.stringify((await st()).faltas[1]));
// borrar
await click('[data-del]',0);log('borrar',await toast(),(await st()).faltas.length);
// apuntar a mano
await p.evaluate(()=>{document.querySelector('details.more').open=true});await shot('amano');log(await p.$eval('#add',e=>e.innerText.replace(/\n+/g,' | ')));
await p.fill('#add [name=date]','2026-11-20');await p.dispatchEvent('#add [name=date]','change');await p.waitForTimeout(300);log('a mano viernes',await p.$eval('#add',e=>e.innerText.replace(/\n+/g,' | ')));
await p.evaluate(()=>document.querySelector('#add').requestSubmit());await p.waitForTimeout(300);log(await toast(),JSON.stringify((await st()).faltas.filter(f=>f.date==='2026-11-20')));
// celda ya apuntada: abrir y cambiar a justificada/retraso
await click('[data-fc].miss',0);await shot('celda-apuntada',false);log(await p.$eval('.fcard',e=>e.innerText.replace(/\n+/g,' | ')));
log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
