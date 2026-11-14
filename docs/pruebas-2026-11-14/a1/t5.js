const L=require('./lib.js');const fs=require('fs');(async()=>{
const state=JSON.parse(fs.readFileSync('state_fiel_ia.json'));
const dump=async(X,l)=>{console.log('=====',l,'\n'+(await X.txt()).replace(/\n+/g,' ¦ '))};
const attrs=p=>p.evaluate(()=>[...document.querySelectorAll('#app button,#app [data-act],#app input,#app select,#app a')].map(x=>x.tagName[0]+'['+Object.entries(x.dataset).map(([k,v])=>k+'='+String(v).slice(0,50)).join(',')+(x.id?'#'+x.id:'')+']'+(x.innerText||x.value||'').replace(/\n/g,' ').slice(0,30)).join(' ¦ '));
// A. viernes: falté OPT
let X=await L.open({state});let {b,p,tap,shot,st,txt,errs}=X;
console.log(await attrs(p));
await p.click('.card:has-text("OPT") button:has-text("Falté")');await p.waitForTimeout(1200);await shot('e01-falte-opt');await dump(X,'tras Falté OPT');console.log(await attrs(p));
let s=await st();console.log('nfaltas',s.faltas.length,JSON.stringify(s.faltas[s.faltas.length-1]));
await p.click('[data-tab=faltas]');await p.waitForTimeout(600);await shot('e02-faltas');await dump(X,'Faltas');console.log(await attrs(p));
await p.click('[data-tab=resumen]');await p.waitForTimeout(1200);await dump(X,'Resumen tras OPT');await shot('e03-resumen-rojo');
await p.click('[data-act=open-sim]');await p.waitForTimeout(600);await shot('e04-sim');await dump(X,'Sim');console.log(await attrs(p));
console.log(errs.filter(e=>!/CORS/.test(e)));await b.close();
})().catch(e=>{console.log('FAIL',e);process.exit(1)});
