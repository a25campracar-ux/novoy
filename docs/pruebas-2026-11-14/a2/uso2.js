const {open}=require('./lib.js');const fs=require('fs');const cmp=require('./cmp.js');
const T=async(x,l,n=1400)=>console.log('\n['+l+']',(await x.txt()).replace(/\n+/g,' | ').slice(0,n));
(async()=>{const sB=JSON.parse(fs.readFileSync('w/state_B.json'));
let x,p,tap,shot,u;
// Ajustes
x=await open({state:sB});({p,tap,shot}=x);
await p.click('[data-tab=ajustes]');await shot('u04_ajustes');await T(x,'AJUSTES');
await p.click('[data-aj=faltas]');await p.waitForTimeout(400);await shot('u05_reglas');await T(x,'AJ REGLAS');
await p.click('[data-sset="ambito|trimestre"]');await p.waitForTimeout(300);u=await x.st();cmp(u,'ambito trimestre (solo para ver efecto)');
await p.click('[data-tab=resumen]');await p.waitForTimeout(1800);await shot('u06_resumen_trimestre');await T(x,'RESUMEN trimestre',900);
await p.click('[data-tab=ajustes]');if(!(await p.$('[data-sset]')))await p.click('[data-aj=faltas]');await p.click('[data-sset="ambito|curso"]');await p.click('[data-sset="justModo|juntas"]');await p.waitForTimeout(300);u=await x.st();cmp(u,'justificadas cuentan igual');
await p.click('[data-sset="justModo|separadas"]');await p.waitForTimeout(300);await p.click('[data-tab=resumen]');await p.waitForTimeout(1800);await shot('u07_resumen_separadas');await T(x,'RESUMEN separadas',700);
await p.click('[data-tab=ajustes]');if(!(await p.$('[data-sset]')))await p.click('[data-aj=faltas]');await p.click('[data-sset="justModo|nocuentan"]');
await p.click('[data-aj=""]');await p.click('[data-aj=horario]');await p.waitForTimeout(300);await shot('u08_aj_horario');await T(x,'AJ HORARIO');
await p.click('[data-act=edit]');await p.waitForTimeout(500);await shot('u09_editar_horario');await T(x,'EDITAR HORARIO',1300);
console.log('labels editor:',await p.$$eval('.rl',e=>e.map(x=>x.innerText.replace('\n','-')).join(' ')));
await x.b.close();
// Lunes 16 y sábado 14
for(const d of ['2026-11-14','2026-11-16','2026-09-24','2027-06-21']){x=await open({state:sB,d});await x.p.waitForTimeout(1200);await x.shot('u10_hoy_'+d);await T(x,'HOY '+d,650);
 if(d==='2026-11-16'&&await x.p.$('[data-yno]')){await x.p.click('[data-yno]');await x.p.waitForTimeout(500);await T(x,'tras "Falté a alguna"',300);await x.shot('u11_yno');}
 await x.b.close();}
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
