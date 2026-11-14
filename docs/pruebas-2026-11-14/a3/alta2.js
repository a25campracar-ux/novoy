const {open}=require('./lib');
const B={1:['SAD','SAD','SAD','ASO','ASO',null],2:['SXI','SXI','SXI','IAW','IAW','CIB'],3:['ASGBD','ASGBD','ASGBD','EIE','EIE','TUT'],4:['ASO','ASO','SAD','IAW','DIG','DIG'],5:['SXI','SXI','CIB','ASGBD','ASGBD','CIB']};
(async()=>{const {b,p,errs,shot,st,txt,pal,paint}=await open();
let taps=0,fields=0;
await p.fill('#ct-q','Sabadell');fields++;await p.waitForTimeout(700);await p.click('[data-ct]');taps++;
await p.fill('#cy-other input[name=n]','ASIX');fields++;await p.click('#cy-other button');taps++;
await p.click('[data-act=how-paint]');taps++;
for(const s of ['ASO','SAD','SXI','IAW','ASGBD','EIE','TUT','DIG','CIB']){await p.fill('#q-sub input[name=s]',s);await p.keyboard.press('Enter');fields++;await p.waitForTimeout(60)}
await shot('b01-asignaturas');
if(await p.$('[data-act=q-add-done]')){await p.click('[data-act=q-add-done]');taps++}
taps+=await paint(B);await shot('b02-rejilla-B');
// casos especiales
await p.click('details.more:has-text("Casos especiales") > summary');taps++;await shot('b03-casos');console.log('-- casos:',(await p.$eval('details.more:has-text("Casos especiales")',e=>e.innerText)));
await p.click('[data-ask="proj|1"]');await p.click('[data-ask="late|0"]');await p.click('[data-ask="nocount|1"]');taps+=3;await shot('b04-casos-resp');
console.log('-- tras responder:',(await p.$eval('details.more:has-text("Casos especiales")',e=>e.innerText)));
console.log('pals:',await p.$$eval('.pals .pal',x=>x.map(e=>e.innerText.replace(/\n/g,' '))));
// proyecto
await p.click('[data-act=q-proj]');taps++;await shot('b05-proyecto');console.log('-- proj card:',await p.$eval('.card:has(.sec:has-text("Semanas de proyecto"))',e=>e.innerText));
for(const d of [1,2,3,4,5])for(let r=0;r<6;r++){await p.click(`.gc[data-d="${d}"][data-r="${r}"]`);taps++}
await p.fill('[data-qf=projName]','PRJ');await p.fill('[data-qf=projWeeks]','2');fields+=2;await p.keyboard.press('Tab');await shot('b06-proyecto-pintado');
console.log('-- proj card2:',await p.$eval('.card:has(.sec:has-text("Semanas de proyecto"))',e=>e.innerText));
// tutoria no cuenta: tocar TUT (¿ya seleccionada -> editar?)
await pal('TUT');taps++;await shot('b07-tut1');await pal('TUT');taps++;await shot('b07-tut2');
console.log('-- tras 2 toques TUT:',(await txt()).slice(0,900));
const nc=await p.$('[data-q-nc]');if(nc){console.log('nc checked?',await nc.isChecked());}
console.log('TAPS',taps,'FIELDS',fields);
await p.click('[data-act=q-next]');taps++;await shot('b08-calendario');console.log('-- cal:',(await txt()));
console.log('errs',errs.filter(e=>!/CORS/.test(e)));await b.close()})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
