const L=require('./lib.js');const fs=require('fs');(async()=>{
const state=JSON.parse(fs.readFileSync('state_fiel_ia.json'));
const nofaltas=Object.assign({},JSON.parse(fs.readFileSync('state_fiel_ia.json')),{faltas:[]});
const D=async(X,l)=>{console.log('=====',l,'\n'+(await X.txt()).replace(/\n+/g,' ¦ ').slice(0,1500))};
const E=x=>x.errs.filter(e=>!/CORS/.test(e));
// B. rejilla semanal para meter faltas antiguas (sin faltas)
let X=await L.open({state:nofaltas});let {p,tap,shot,st,c}=X;
await tap('[data-tab=faltas]');
// ir a la semana del 28/09: 6 semanas atrás desde 9-13 nov -> 28 sep es 6 semanas
for(let i=0;i<6;i++)await tap('[data-fw="-7"]');
await D(X,'semana 28sep');
const cell=(d,stt)=>`[data-fc*='"d":"${d}","st":"${stt}"']`;
await tap(cell('2026-09-28','08:00'));await shot('f01-celda');await D(X,'celda abierta');
await tap('[data-fc-t=just]');await tap('[data-fc-add]');await D(X,'tras apuntar justificada');await shot('f02-celda-apuntada');
// ¿la tarjeta sigue abierta? siguiente celda
await tap(cell('2026-09-28','09:00'));await tap('[data-fc-t=just]');await tap('[data-fc-add]');
console.log('taps para 2 justificadas (incl. 6 de navegación)',JSON.stringify(c));
// retraso en martes 22/09 (semana anterior)
await tap('[data-fw="-7"]');await tap(cell('2026-09-22','08:00'));await tap('[data-fc-t=late]');await shot('f03-retraso');await tap('[data-fc-add]');
let s=await st();console.log(JSON.stringify(s.faltas.map(f=>[f.date,f.start,f.subject,f.type,f.justified,f.hours])));
// retraso + falta en la misma casilla? tocar otra vez la casilla del retraso
await tap(cell('2026-09-22','08:00'));await D(X,'celda con retraso reabierta');
console.log('errs',E(X));await X.b.close();

// C. simulador con OPT ya apuntada hoy
X=await L.open({state});({p,tap,shot,st,c}=X);
await p.click('.card:has-text("OPT") button:has-text("Falté")');await p.waitForTimeout(500);
await tap('[data-tab=resumen]');await tap('[data-act=open-sim]');await tap('[data-sim="1"]');await p.waitForTimeout(800);await shot('g01-sim-opt');await D(X,'sim OPT ya apuntada');
await tap('[data-act=sim-all]');await p.waitForTimeout(800);await D(X,'sim todo el dia');
// cambiar día del simulador a miércoles 18/11 (DAW)
await p.fill('#simday','2026-11-18');await p.dispatchEvent('#simday','change');await p.waitForTimeout(500);await tap('[data-act=sim-all]');await p.waitForTimeout(900);await shot('g02-sim-miercoles');await D(X,'sim miercoles 18');
console.log(await p.evaluate(()=>[...document.querySelectorAll('#app button')].map(x=>JSON.stringify(x.dataset)+x.innerText.slice(0,25)).join(' ¦ ')));
console.log('errs',E(X));await X.b.close();

// D. reglas
X=await L.open({state});({p,tap,shot,st,c}=X);
await tap('[data-tab=ajustes]');await tap('[data-aj=faltas]');await shot('h01-reglas');await D(X,'Ajustes reglas');
await tap('[data-sset="justModo|nocuentan"]');await tap('[data-tab=resumen]');await p.waitForTimeout(1200);await D(X,'Resumen justificadas no cuentan');
await tap('[data-tab=ajustes]');await tap('[data-sset="justModo|juntas"]');await tap('[data-sset="ambito|curso"]');await tap('[data-tab=resumen]');await p.waitForTimeout(1200);await shot('h02-curso');await D(X,'Resumen curso entero');
await tap('[data-tab=ajustes]');await tap('[data-sset="ambito|trimestre"]');await p.fill('[data-num=semanas]','30');await p.dispatchEvent('[data-num=semanas]','change');await p.waitForTimeout(300);await tap('[data-tab=resumen]');await p.waitForTimeout(1200);await D(X,'Resumen semanas=30');
await tap('[data-tab=ajustes]');await p.fill('[data-num=semanas]','35');await p.dispatchEvent('[data-num=semanas]','change');await p.waitForTimeout(300);await tap('[data-tab=resumen]');await p.waitForTimeout(1200);await D(X,'Resumen semanas=35');
console.log('errs',E(X));await X.b.close();

// E. otros días
for(const d of ['2026-11-14','2026-11-16','2026-11-18','2026-11-30']){X=await L.open({state,d});await X.p.waitForTimeout(900);await X.shot('k-hoy-'+d);await D(X,'HOY '+d);
 if(d==='2026-11-16'){const y=await X.p.$('[data-yno]');console.log('ask?',!!y);if(y){await X.tap('[data-yno]');await X.p.waitForTimeout(500);await D(X,'tras Falté a alguna');await X.shot('k-yno');}}
 console.log('errs',E(X));await X.b.close();}
})().catch(e=>{console.log('FAIL',e);process.exit(1)});
