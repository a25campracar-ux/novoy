const L=require('./lib.js');(async()=>{const {b,p,errs,c,tap,type,shot,st,txt}=await L.open();
await shot('a00-inicio');console.log(await txt());
await type('#ct-q','pedr');await p.waitForTimeout(500);await shot('a01-centro');console.log('---\n'+await txt());
await tap('[data-ct]');await shot('a02-ciclo');console.log('---\n'+await txt());
await tap('[data-cy="ICC0"]');await shot('a03-metodo');console.log('---\n'+await txt());
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-act]')].map(x=>x.dataset.act+':'+x.innerText.replace(/\n/g,' | ')).join('\n')));
await tap('[data-act=how-paint]');await shot('a04-rejilla0');console.log('---\n'+await txt());
console.log(c,errs);await b.close()})().catch(e=>{console.log('FAIL',e);process.exit(1)});
