const L=require('./lib');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/alta'});
let taps=0,fields=0;const tap=async(s)=>{await p.click(s);taps++;};
await go('2026-11-13',null);
await p.fill('#ct-q','Institut Vidal i Barraquer');fields++;await p.waitForTimeout(900);
await tap('[data-ct]');
await p.fill('#cy-other input[name=n]','Batxillerat nocturn');fields++;
await tap('#cy-other button');
await tap('[data-act=how-paint]');
for(const s of ['MAT','CAT','FIL','ANG','FIQ','TEC']){await p.fill('#q-sub input[name=s]',s);fields++;await p.press('#q-sub input[name=s]','Enter');taps++;await p.waitForTimeout(120);}
await shot('05asignaturas');
await tap('[data-act=q-add-done]');await shot('06rejilla-vacia');
// cambiar horas
await p.click('details.more summary:has-text("Cambiar las horas")');taps++;
await p.fill('[data-qf=start]','17:30');fields++;await p.dispatchEvent('[data-qf=start]','change');await p.waitForTimeout(200);
console.log('open after start?',await p.$eval('details.more',d=>d.open));
const selq=async(k,v)=>{ if(!(await p.isVisible('[data-qf='+k+']'))){await p.click('details.more summary:has-text("Cambiar las horas")');taps++;console.log('reopen for',k);} await p.selectOption('[data-qf='+k+']',String(v));taps+=2;await p.waitForTimeout(200);};
await selq('rows',4);await selq('brk',2);await selq('brkMin',30);
await shot('07horas');
const pal=async(name)=>{const bs=await p.$$('[data-pal]');for(const x of bs){if((await x.innerText()).trim().startsWith(name)){await x.click();taps++;return;}}throw new Error('no pal '+name)};
const H={MAT:[[1,0],[1,1],[3,0],[4,1]],CAT:[[1,2],[3,1]],FIL:[[1,3],[3,2]],ANG:[[2,1],[4,0]],FIQ:[[2,2],[2,3],[4,2]],TEC:[[3,3],[4,3]]};
for(const s of Object.keys(H)){await pal(s);for(const [d,r] of H[s]){await p.click(`.gc[data-d="${d}"][data-r="${r}"]`);taps++;}}
await shot('08rejilla');console.log(await txt());
await tap('[data-act=q-next]');await shot('09calendario');console.log('---CAL',await txt());
console.log(await p.$$eval('[data-qt]',e=>e.map(x=>x.dataset.qt+'='+x.value)));
console.log('taps',taps,'fields',fields,errs);
await p.evaluate(()=>0);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
