const {open}=require('./lib.js');const {F,R}=require('./caso_data.js');const fs=require('fs');const cmp=require('./cmp.js');
(async()=>{const st0=JSON.parse(fs.readFileSync('w/state_alta_sin_faltas.json'));
const x=await open({state:st0});const {p,tap,shot,cnt}=x;
await shot('b00_hoy');console.log('HOY:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-tab=faltas]');await shot('b01_faltas');console.log('FALTAS:',(await x.txt()).replace(/\n+/g,' | ').slice(0,900));
const monOf=(k)=>{const [y,m,d]=k.split('-').map(Number);const dt=new Date(y,m-1,d);dt.setDate(dt.getDate()-(dt.getDay()-1));return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')};
let cur='2026-11-09';
const goWeek=async(k)=>{const m=monOf(k);while(cur>m){await tap('[data-fw="-7"]');const [y,mo,d]=cur.split('-').map(Number);const dt=new Date(y,mo-1,d-7);cur=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');}};
const cellSel=async(date,pi)=>{const sels=await p.$$eval('[data-fc]',(els,date)=>els.map(e=>JSON.parse(e.dataset.fc)).filter(c=>c.d===date).sort((a,b)=>a.st<b.st?-1:1).map(c=>c.st),date);return sels[pi-1];};
const items=[];F.forEach(([d,ps,j])=>ps.forEach(pp=>items.push({d,p:pp,j,late:false})));R.forEach(([d,pp,j])=>items.push({d,p:pp,j,late:true}));
items.sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:a.p-b.p);
const problems=[];let shotW=0;
for(const it of items){await goWeek(it.d);const stt=await cellSel(it.d,it.p);
 if(!stt){problems.push('sin casilla '+it.d+' P'+it.p);continue;}
 const sel=await p.evaluateHandle(([d,st])=>Array.from(document.querySelectorAll('[data-fc]')).find(e=>{const c=JSON.parse(e.dataset.fc);return c.d===d&&c.st===st}),[it.d,stt]);
 cnt.taps++;await sel.asElement().click();await p.waitForTimeout(40);
 if(!(await p.$('.fcard'))){problems.push('no abre tarjeta '+it.d+' '+stt);continue;}
 if(shotW<1){await shot('b02_tarjeta');shotW++;}
 if(it.late){await tap('#fc-l');}
 if(it.j){await tap('#fc-j');}
 if(await p.$('[data-fc-add]'))await tap('[data-fc-add]');else problems.push('ya había falta en '+it.d+' '+stt);
 await p.waitForTimeout(40);
 if(await p.$('.fcard')){cnt.taps++;const xx=await p.$('[data-fc-x]');if(xx)await xx.click();}
}
await shot('b03_semana_sep');
console.log('problemas',problems,'cnt',JSON.stringify(cnt));
const u=await x.st();fs.writeFileSync('w/state_B.json',JSON.stringify(u,null,1));
console.log('faltas guardadas',u.faltas.length,'retrasos',u.faltas.filter(f=>f.type==='retraso').length,'just',u.faltas.filter(f=>f.justified).length);
console.log('starts usados',JSON.stringify([...new Set(u.faltas.map(f=>f.start))].sort()));
cmp(u,'Vía B rejilla semanal');
await tap('[data-tab=hoy]');await shot('b04_hoy');console.log('HOY2:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-tab=resumen]');await shot('b05_resumen');console.log('RESUMEN:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-tab=faltas]');await shot('b06_faltas_lista');
console.log('errs',x.errs.filter(e=>!/CORS/.test(e)));
await x.b.close();})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
