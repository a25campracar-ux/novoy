const L=require('./lib');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/alta'});
await go('2026-11-13',null);
await shot('00inicio');console.log(await txt());
await p.fill('#ct-q','Institut Vidal i Barraquer');await p.waitForTimeout(900);await shot('01centro');console.log('---',await p.$eval('#ct-res',e=>e.innerText));
await p.click('[data-ct]');await shot('02ciclo');console.log('---',await txt());
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
