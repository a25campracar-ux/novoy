const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/f3'});
const s0=JSON.parse(fs.readFileSync('state_alta_sin_faltas.json'));s0.since='2026-09-14';
await go('2026-11-13',s0);
let taps=0;const tap=async(s)=>{await p.waitForSelector(s);await p.evaluate(s=>document.querySelector(s).click(),s);taps++;await p.waitForTimeout(300);};
await tap('[data-act=start-import]');await shot('i1');console.log(await txt());
await tap('[data-act=copy-prompt]');await p.waitForTimeout(300);await shot('i2');console.log('---',await txt());
const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(e=>'ERR '+e.message));fs.writeFileSync('prompt_importar.txt',clip);console.log('CLIP len',clip.length);
if(await p.$('[data-act=copy-prompt]')){await tap('[data-act=copy-prompt]');}
console.log(await p.$$eval('[data-act]',els=>els.map(e=>e.dataset.act+': '+e.innerText.replace(/\n/g,' | ').slice(0,60))));
await tap('[data-act=next]');await shot('i3');console.log('---',await txt());
const resp='He encontrado 13 faltas y 1 retraso. No he dejado nada fuera.\n```json\n'+JSON.stringify({faltas:[
{fecha:'2026-09-22',asignatura:'FIQ',horas:2,tipo:'falta',justificada:false},
{fecha:'2026-10-05',asignatura:'MAT',horas:2,tipo:'falta',justificada:true},
{fecha:'2026-10-05',asignatura:'Català',horas:1,tipo:'falta',justificada:true},
{fecha:'2026-10-05',asignatura:'filosofia',horas:1,tipo:'falta',justificada:true},
{fecha:'2026-10-15',asignatura:'ANG',horas:1,tipo:'falta',justificada:true},
{fecha:'2026-10-21',asignatura:'TEC',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-10-26',asignatura:'MAT',horas:1,tipo:'falta',justificada:true},
{fecha:'2026-10-29',asignatura:'FIQ',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-11-03',asignatura:'ANG',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-11-09',asignatura:'FIL',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-11-11',asignatura:'MAT',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-11-12',asignatura:'ANG',horas:0,tipo:'retraso',justificada:false},
{fecha:'2026-11-13',asignatura:'MAT',horas:1,tipo:'falta',justificada:false},
{fecha:'2026-10-12',asignatura:'MAT',horas:2,tipo:'falta',justificada:false}
]},null,1)+'\n```';
await p.fill('#paste',resp);
await tap('[data-act=review]');await shot('i4');console.log('---REV',await txt());
if(await p.$('[data-act=save-setup]')){await tap('[data-act=save-setup]');await shot('i5');console.log('---SAVED',(await txt()).slice(0,400));}
const s=await st();console.log(s.faltas.length,s.faltas.map(f=>[f.date,f.subject,f.start,f.hours,f.type,f.justified?'J':''].join(' ')).join(' ; '));
fs.writeFileSync('state_f3.json',JSON.stringify(s,null,1));
console.log('taps',taps,errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
