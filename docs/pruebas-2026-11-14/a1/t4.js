const L=require('./lib.js'),A=require('./alta.js'),I=require('./imp.js');(async()=>{
for(const v of ['naive','fiel']){
const X=await L.open();const {b,p,errs,c,tap,type,shot,st,txt}=X;
await A.alta(X,v,{brk:true});console.log(v,'alta',JSON.stringify(c));
const c0={...c};
// en Previas: ir por la IA
const rev=await I.importar(X,v,'d-'+v+'-');
console.log(v,'import taps',c.taps-c0.taps,'fields',c.fields-c0.fields);
console.log('---REVISION\n'+rev);console.log('---TRAS GUARDAR\n'+await txt());
await p.waitForTimeout(1500);
if(await p.$('[data-tab=resumen]')){await tap('[data-tab=resumen]');await p.waitForTimeout(1500);await shot('d-'+v+'-resumen');console.log('---RESUMEN\n'+await txt());}
const s=await st();require('fs').writeFileSync('state_'+v+'_ia.json',JSON.stringify(s));console.log('faltas',s.faltas.length,JSON.stringify(s.config.catalog.course),JSON.stringify(s.config.nocount));
console.log(errs.filter(e=>!/CORS/.test(e)));await b.close();}
})().catch(e=>{console.log('FAIL',e);process.exit(1)});
