const L=require('./lib.js');(async()=>{const {b,p,errs,shot,txt,els}=await L.open();
await p.fill('#ct-q','bell-lloc girona');await p.waitForTimeout(800);await p.click('[data-ct]');
await p.fill('#cy-other input','Màrqueting i Publicitat');await p.click('#cy-other button');await shot('a4metodo');await txt('metodo');
await p.click('[data-act=how-ai]');await shot('a5ai1');await txt('ai1');
await p.click('[data-act=copy-prompt]');await p.waitForTimeout(300);console.log('toast',await p.innerText('#toast'));await shot('a5ai1b');
const clip=await p.evaluate(()=>navigator.clipboard.readText());console.log('clip len',clip.length, clip===require('fs').readFileSync('/tmp/nvtest/a4/prompt_setup.txt','utf8'));
await p.click('[data-act=copy-prompt]');await shot('a6ai2');await txt('ai2');
await p.click('[data-act=next]');await shot('a7ai3');await txt('ai3');
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
