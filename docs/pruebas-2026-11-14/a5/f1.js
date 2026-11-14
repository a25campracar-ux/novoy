const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/f1'});
const s0=JSON.parse(fs.readFileSync('state_alta_sin_faltas.json'));s0.since='2026-09-14';
await go('2026-11-13',s0);await shot('hoy-sin-faltas');console.log(await txt());
let taps=0;const tap=async(s)=>{await p.waitForSelector(s);await p.evaluate(s=>document.querySelector(s).click(),s);taps++;await p.waitForTimeout(200);};
await tap('[data-act=prv-open]');
// probar "Listo" con todo a 0
await tap('[data-act=prv-save]');await shot('previas-aviso0');
const V={MAT:4,CAT:1,FIL:2,ANG:2,FIQ:3,TEC:1};
for(const k of Object.keys(V))for(let i=0;i<V[k];i++)await tap(`[data-pv="${k}|1"]`);
await shot('previas-llenas');
await tap('[data-act=prv-save]');await shot('hoy-viernes');console.log('---HOY',await txt());
await tap('[data-tab=resumen]');await shot('resumen');console.log('---RES',await txt());
await tap('[data-tab=faltas]');await shot('faltas');console.log('---FAL',await txt());
console.log('taps',taps);fs.writeFileSync('state_f1.json',JSON.stringify(await st(),null,1));
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
