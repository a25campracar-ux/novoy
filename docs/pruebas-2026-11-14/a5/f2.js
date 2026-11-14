const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/f2'});
const s0=JSON.parse(fs.readFileSync('state_alta_sin_faltas.json'));s0.since='2026-09-14';
await go('2026-11-13',s0);
let taps=0;const ev=async(fn,arg)=>{const r=await p.evaluate(fn,arg);taps++;await p.waitForTimeout(160);return r;};
await ev(()=>document.querySelector('[data-tab=faltas]').click());
// [fecha, hora, just, retraso]
const F=[['2026-11-12','17:30',0,1],['2026-11-11','17:30',0,0],['2026-11-09','21:00',0,0],['2026-11-03','18:30',0,0],['2026-10-29','20:00',0,0],['2026-10-26','17:30',1,0],['2026-10-21','21:00',0,0],['2026-10-15','17:30',1,0],
['2026-10-05','17:30',1,0],['2026-10-05','18:30',1,0],['2026-10-05','20:00',1,0],['2026-10-05','21:00',1,0],['2026-09-22','20:00',0,0],['2026-09-22','21:00',0,0]];
const monday=k=>{const d=new Date(k+'T12:00');d.setDate(d.getDate()-(d.getDay()-1));return d.toISOString().slice(0,10)};
let cur='2026-11-09',n=0;
for(const [d,h,j,r] of F){
  while(monday(d)<cur){await ev(()=>document.querySelector('[data-fw="-7"]').click());const x=new Date(cur+'T12:00');x.setDate(x.getDate()-7);cur=x.toISOString().slice(0,10);}
  const ok=await ev(([d,h])=>{const e=[...document.querySelectorAll('[data-fc]')].find(e=>{const o=JSON.parse(e.dataset.fc);return o.d===d&&o.st===h});if(!e)return false;e.click();return true},[d,h]);
  if(!ok)throw new Error('no cell '+d+' '+h);
  if(n===0){await shot('celda-abierta',false);}
  if(r)await ev(()=>document.querySelector('#fc-l').click());
  if(j)await ev(()=>document.querySelector('#fc-j').click());
  if(n===5)await shot('celda-just',false);
  await ev(()=>document.querySelector('[data-fc-add]').click());n++;
  if(n===1)await shot('tras-apuntar',false);
}
await shot('semana-sept');console.log(await txt());
console.log('taps rejilla',taps);
const s=await st();console.log(s.faltas.length,JSON.stringify(s.faltas.slice(0,2)));
fs.writeFileSync('state_f2.json',JSON.stringify(s,null,1));
await ev(()=>document.querySelector('[data-tab=resumen]').click());await shot('resumen');console.log('---RES',await txt());
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
