const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/alta'});
let taps=0,fields=0;const tap=async(s)=>{await p.waitForSelector(s);await p.evaluate(s=>document.querySelector(s).click(),s);taps++;await p.waitForTimeout(250);};
await go('2026-11-13',null);
await p.fill('#ct-q','Institut Vidal i Barraquer');fields++;await p.waitForTimeout(900);
await tap('[data-ct]');
await p.fill('#cy-other input[name=n]','Batxillerat nocturn');fields++;
await tap('#cy-other button');
await tap('[data-act=how-paint]');
for(const s of ['MAT','CAT','FIL','ANG','FIQ','TEC']){await p.fill('#q-sub input[name=s]',s);fields++;await p.press('#q-sub input[name=s]','Enter');taps++;await p.waitForTimeout(120);}
await tap('[data-act=q-add-done]');
await p.click('details.more summary:has-text("Cambiar las horas")');taps++;
await p.fill('[data-qf=start]','17:30');fields++;await p.dispatchEvent('[data-qf=start]','change');await p.waitForTimeout(200);
const selq=async(k,v)=>{ if(!(await p.isVisible('[data-qf='+k+']'))){await p.click('details.more summary:has-text("Cambiar las horas")');taps++;} await p.selectOption('[data-qf='+k+']',String(v));taps+=2;await p.waitForTimeout(200);};
await selq('rows',4);await selq('brk',2);await selq('brkMin',30);
const pal=async(name)=>{const bs=await p.$$('[data-pal]');for(const x of bs){if((await x.innerText()).trim().startsWith(name)){await x.click();taps++;return;}}throw new Error('no pal '+name)};
const H={MAT:[[1,0],[1,1],[3,0],[4,1]],CAT:[[1,2],[3,1]],FIL:[[1,3],[3,2]],ANG:[[2,1],[4,0]],FIQ:[[2,2],[2,3],[4,2]],TEC:[[3,3],[4,3]]};
for(const s of Object.keys(H)){await pal(s);for(const [d,r] of H[s]){await p.click(`.gc[data-d="${d}"][data-r="${r}"]`);taps++;}}
await tap('[data-act=q-next]');
console.log('ALTA hasta calendario: taps',taps,'fields',fields);
// calendario
const setqt=async(k,v)=>{await p.fill(`[data-qt="${k}"]`,v);await p.dispatchEvent(`[data-qt="${k}"]`,'change');fields++;await p.waitForTimeout(100);};
const T=[['1a evaluación','2026-09-14','2026-11-27'],['2a evaluación','2026-11-30','2027-03-05'],['3a evaluación','2027-03-08','2027-06-04']];
for(let i=0;i<3;i++){await setqt(i+'|label',T[i][0]);await setqt(i+'|from',T[i][1]);await setqt(i+'|to',T[i][2]);}
// quitar festivos de Barcelona (La Mercè, Segona Pasqua) 
const rm=async(name)=>{await p.waitForTimeout(400);const ok=await p.evaluate(n=>{const e=document.querySelector(`button[aria-label="Quitar ${n}"]`);if(!e)return false;e.click();return true},name);if(!ok)throw new Error("no hol "+name);taps++;await p.waitForTimeout(200);};
await rm('La Mercè (Barcelona)');await rm('Segona Pasqua (Barcelona)');
const addh=async(f,t,l)=>{await p.fill('#q-hol [name=from]',f);fields++;if(t){await p.fill('#q-hol [name=to]',t);fields++;}await p.fill('#q-hol [name=label]',l);fields++;await p.evaluate(()=>document.querySelector('#q-hol').requestSubmit());taps++;await p.waitForTimeout(150);};
await addh('2026-09-23','','Santa Tecla');await addh('2026-11-02','','Libre disposición');await addh('2026-12-07','','Libre disposición');await addh('2027-02-15','','Libre disposición');
await shot('10calendario-hecho');
await tap('[data-act=q-next]');await shot('11reglas');console.log('---REGLAS',await txt());
await tap('[data-qset="limite|20"]');
await shot('11b-reglas20');
await p.evaluate(()=>document.querySelector('details.more summary').click());await shot('11c-avanzado');console.log('---AV',await txt());
await tap('[data-act=q-next]');await shot('12previas');console.log('---PREV',await txt());
console.log('ALTA hasta previas: taps',taps,'fields',fields);
fs.writeFileSync('state_alta_sin_faltas.json',JSON.stringify(await st(),null,1));
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
