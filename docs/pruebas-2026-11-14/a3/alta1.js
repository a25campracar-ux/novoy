const {open}=require('./lib');
(async()=>{const {b,p,errs,shot,st,txt}=await open();
await shot('a01-inicio');console.log('--',(await txt()).slice(0,300));
await p.fill('#ct-q','Sabadell');await p.waitForTimeout(900);await shot('a02-centro');console.log('--',(await txt()).slice(0,400));
await p.click('[data-ct]');await shot('a03-ciclo');console.log('--',(await txt()).slice(0,500));
await p.fill('#cy-other input[name=n]','ASIX');await p.click('#cy-other button');await shot('a04-metodo');console.log('--',(await txt()).slice(0,700));
console.log(await p.evaluate(()=>[...document.querySelectorAll('#app [data-act]')].map(x=>x.dataset.act+':'+x.innerText.replace(/\n/g,' / ').slice(0,60))));
await p.click('[data-act=how-paint]');await shot('a05-rejilla-vacia');console.log('--',(await txt()).slice(0,700));
console.log('errs',errs);await b.close()})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
