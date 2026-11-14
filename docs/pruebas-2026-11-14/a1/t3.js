const L=require('./lib.js');(async()=>{const X=await L.open({state:JSON.parse(require('fs').readFileSync('state_naive_nofaltas.json'))});const {b,p,errs,c,tap,type,shot,st,txt}=X;
await shot('c00-hoy-sin-faltas');console.log(await txt());
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-act],[data-tab]')].map(x=>(x.dataset.act||'tab:'+x.dataset.tab)+':'+x.innerText.replace(/\n/g,' | ').slice(0,60)).join('\n')));
// abrir contadores
const how=await p.$('[data-act=prv-open]');console.log('prv-open?',!!how);
if(how){await tap('[data-act=prv-open]');}
await shot('c01-previas');
const V={'DAW':5,'DIW':2,'E.CLI':1,'E.SER':4,'IPO II':2,'OPT':1,'PROJ':3};
for(const k in V)for(let i=0;i<V[k];i++)await tap(`[data-pv="${k}|1"]`);
await shot('c02-previas-llenas');
await tap('[data-act=prv-save]');await shot('c03-hoy');console.log('=====HOY\n'+await txt());
await tap('[data-tab=resumen]');await shot('c04-resumen');console.log('=====RESUMEN\n'+await txt());
await tap('[data-tab=faltas]');await shot('c05-faltas');console.log('=====FALTAS\n'+await txt());
await tap('[data-tab=ajustes]');await shot('c06-ajustes');console.log('=====AJUSTES\n'+await txt());
console.log(c);const s=await st();require('fs').writeFileSync('state_naive_contadores.json',JSON.stringify(s));console.log(JSON.stringify(s.faltas));
console.log(errs.filter(e=>!/CORS/.test(e)));await b.close()})().catch(e=>{console.log('FAIL',e);process.exit(1)});
