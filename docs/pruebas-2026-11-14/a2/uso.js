const {open}=require('./lib.js');const fs=require('fs');const cmp=require('./cmp.js');
const T=async(x,l,n=1400)=>console.log('\n['+l+']',(await x.txt()).replace(/\n+/g,' | ').slice(0,n));
(async()=>{const sB=JSON.parse(fs.readFileSync('w/state_B.json'));
let x=await open({state:sB});let {p,tap,shot}=x;
await p.waitForTimeout(2500);await T(x,'HOY tras 2,5s (¿% final?)',700);
// apuntar Suport hoy -> se pasa a 1,2 ; quitar
await p.click('.card.slot:has-text("Suport") [data-miss]');await p.waitForTimeout(1500);await shot('u01_falte_suport');await T(x,'tras Falté Suport',900);
let u=await x.st();console.log('falta nueva',JSON.stringify(u.faltas[u.faltas.length-1]));
await p.click('[data-unmiss]');await p.waitForTimeout(600);u=await x.st();console.log('tras quitar, nº',u.faltas.length);
// falté todo el día
await p.click('.day-btn');await p.waitForTimeout(1500);await shot('u02_todo_el_dia');await T(x,'tras todo el día',1100);
u=await x.st();console.log('nº',u.faltas.length,'hoy:',JSON.stringify(u.faltas.filter(f=>f.date==='2026-11-13').map(f=>[f.subject,f.start,f.type,f.hours])));
cmp(u,'tras faltar todo hoy');
// simulador
await p.click('[data-tab=resumen]');await p.click('.sim-entry');await p.waitForTimeout(800);await shot('u03_sim');await T(x,'SIMULADOR',1500);
const simBtns=await p.$$eval('#app button',bs=>bs.map(b=>(b.dataset.act||Object.keys(b.dataset).join(','))+':'+b.innerText.replace(/\n/g,' ').slice(0,30)));console.log(simBtns.join(' ; '));
await x.b.close();
// Ajustes
x=await open({state:sB});({p,tap,shot}=x);
await p.click('[data-tab=ajustes]');await shot('u04_ajustes');await T(x,'AJUSTES');
await p.click('[data-aj=faltas]');await p.waitForTimeout(400);await shot('u05_reglas');await T(x,'AJ REGLAS');
await p.click('[data-sset="ambito|trimestre"]');await p.waitForTimeout(300);u=await x.st();cmp(u,'ambito trimestre (solo para ver efecto)');
await p.click('[data-tab=resumen]');await p.waitForTimeout(1800);await shot('u06_resumen_trimestre');await T(x,'RESUMEN trimestre',900);
await p.click('[data-tab=ajustes]');await p.click('[data-sset="ambito|curso"]');await p.click('[data-sset="justModo|juntas"]');await p.waitForTimeout(300);u=await x.st();cmp(u,'justificadas cuentan igual');
await p.click('[data-sset="justModo|separadas"]');await p.waitForTimeout(300);await p.click('[data-tab=resumen]');await p.waitForTimeout(1800);await shot('u07_resumen_separadas');await T(x,'RESUMEN separadas',700);
await p.click('[data-tab=ajustes]');await p.click('[data-sset="justModo|nocuentan"]');
await p.click('[data-aj=""]');await p.click('[data-aj=horario]');await p.waitForTimeout(300);await shot('u08_aj_horario');await T(x,'AJ HORARIO');
await p.click('[data-act=edit]');await p.waitForTimeout(500);await shot('u09_editar_horario');await T(x,'EDITAR HORARIO',1300);
console.log('labels editor:',await p.$$eval('.rl',e=>e.map(x=>x.innerText.replace('\n','-')).join(' ')));
await x.b.close();
// Lunes 16 y sábado 14
for(const d of ['2026-11-14','2026-11-16','2026-09-24','2027-06-21']){x=await open({state:sB,d});await x.p.waitForTimeout(1200);await x.shot('u10_hoy_'+d);await T(x,'HOY '+d,650);
 if(d==='2026-11-16'&&await x.p.$('[data-yno]')){await x.p.click('[data-yno]');await x.p.waitForTimeout(500);await T(x,'tras "Falté a alguna"',300);await x.shot('u11_yno');}
 await x.b.close();}
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
