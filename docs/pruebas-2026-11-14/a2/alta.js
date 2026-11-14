const {open}=require('./lib.js');const {H}=require('./caso_data.js');const fs=require('fs');
(async()=>{const x=await open();const {p,tap,type,shot,cnt}=x;
await shot('a00_inicio');
// Paso 1 centro
await type('#ct-q','guindavols');await p.waitForTimeout(900);await shot('a01_centro');cnt.screens++;
console.log('CENTRO:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-ct]');await shot('a02_ciclo');cnt.screens++;
console.log('CICLO:',(await x.txt()).replace(/\n+/g,' | '));
await type('#cy-other input[name=n]','Cures auxiliars d\'infermeria');await tap('#cy-other button');await shot('a03_metodo');cnt.screens++;
console.log('METODO:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-act=how-paint]');await shot('a04_rejilla_vacia');cnt.screens++;
console.log('REJILLA0:',(await x.txt()).replace(/\n+/g,' | '));
const subs=['Cures','Ésser humà','FOL','Higiene','Benestar','Primers auxilis','Tutoria','Suport','Odonto','OADS','Relacions'];
for(const s of subs){await type('#q-sub input[name=s]',s);cnt.taps++;await p.press('#q-sub input[name=s]','Enter');await p.waitForTimeout(80);}
await shot('a05_asignaturas');
await tap('[data-act=q-add-done]');
// cambiar horas
await tap('details.more >> text=Cambiar las horas');await shot('a06_horas_abierto');
await type('[data-qf=start]','15:00');await p.dispatchEvent('[data-qf=start]','change');
await shot('a06b_tras_inicio');
console.log('labels tras cambiar inicio:',await p.$$eval('.rl',e=>e.map(x=>x.innerText.replace('\n','-')).join(' ')));
cnt.taps+=2;await p.selectOption('[data-qf=dur]','55');
console.log('labels tras dur:',await p.$$eval('.rl',e=>e.map(x=>x.innerText.replace('\n','-')).join(' ')));
// rows 6 ok, brk 3 ok, brkMin 20 ok
await shot('a07_horas');
const pal=async(name)=>{const bs=await p.$$('[data-pal]');for(const b of bs){if((await b.innerText()).trim().startsWith(name)){cnt.taps++;await b.click();return;}}throw new Error('no pal '+name)};
for(const s of subs){await pal(s);for(const d of [1,2,3,4,5])for(let r=0;r<6;r++)if(H[d][r]===s)await tap(`.gc[data-d="${d}"][data-r="${r}"]`);}
await shot('a08_rejilla');
console.log('REJILLA:',(await x.txt()).replace(/\n+/g,' | ').slice(0,1500));
fs.writeFileSync('w/cnt_rejilla.json',JSON.stringify(cnt));
await tap('[data-act=q-next]');await shot('a09_calendario');cnt.screens++;
console.log('CAL:',(await x.txt()).replace(/\n+/g,' | '));
await p.context().storageState();
// guardar qk no es posible; seguimos en alta2 dentro del mismo script
// Trimestres
const T=[['2026-09-14','2026-12-04'],['2026-12-09','2027-03-12'],['2027-03-15','2027-06-18']];
for(let i=0;i<3;i++){await type(`[data-qt="${i}|from"]`,T[i][0]);await p.dispatchEvent(`[data-qt="${i}|from"]`,'change');await type(`[data-qt="${i}|to"]`,T[i][1]);await p.dispatchEvent(`[data-qt="${i}|to"]`,'change');}
// quitar Mercè y Segona Pasqua
for(const lab of ['La Mercè','Segona Pasqua']){const it=await p.$(`.item:has-text("${lab}") .x`);if(!it)console.log('NO ENCUENTRO',lab);else{cnt.taps++;await it.click();await p.waitForTimeout(100);}}
const addH=async(f,t,l)=>{await type('#q-hol [name=from]',f);if(t&&t!==f)await type('#q-hol [name=to]',t);await type('#q-hol [name=label]',l);await tap('#q-hol button');await p.waitForTimeout(100);};
await addH('2026-09-29','','Sant Miquel');await addH('2026-11-02','','Lliure disposició');await addH('2026-12-07','','Lliure disposició');await addH('2027-02-15','','Lliure disposició');await addH('2027-05-11','','Sant Anastasi');
await shot('a10_calendario_ok');
console.log('CAL2:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-act=q-next]');await shot('a11_reglas');cnt.screens++;
console.log('REGLAS:',(await x.txt()).replace(/\n+/g,' | '));
await tap('[data-qset="limite|20"]');await tap('[data-qset="justModo|nocuentan"]');await tap('[data-qset="ambito|curso"]');await tap('[data-qset="retrasos|3"]');cnt.decisions+=5;
await shot('a12_reglas_ok');
await tap('[data-act=q-next]');await shot('a13_previas');cnt.screens++;
console.log('PREVIAS:',(await x.txt()).replace(/\n+/g,' | '));
const st=await x.st();fs.writeFileSync('w/state_alta_sin_faltas.json',JSON.stringify(st,null,1));
console.log(JSON.stringify(cnt),'errs',x.errs);
console.log(JSON.stringify(st.config.schedule));console.log(JSON.stringify(st.settings),JSON.stringify(st.config.nocount),JSON.stringify(st.config.catalog),JSON.stringify(st.config.holidays.map(h=>h.label+' '+h.from)));
await x.b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
