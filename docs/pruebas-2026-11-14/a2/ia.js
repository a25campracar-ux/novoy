const {open}=require('./lib.js');const {H,P,FEST,TERMS,F,R}=require('./caso_data.js');const fs=require('fs');const cmp=require('./cmp.js');
const C=require('/home/claude/novoy/site/core.js');
const T=async(x,l,n=1500)=>console.log('\n['+l+']',(await x.txt()).replace(/\n+/g,' | ').slice(0,n));
const truth=JSON.parse(fs.readFileSync('verdad.json'));
const DN={1:'lunes',2:'martes',3:'miercoles',4:'jueves',5:'viernes'};
// JSON que daría una IA tras la encuesta (bloques partidos en el recreo, horas = sesiones)
const horario={};for(const d of [1,2,3,4,5]){const bl=[];let cur=null;H[d].forEach((m,i)=>{if(cur&&cur.asignatura===m&&cur.fin===P[i][0]){cur.fin=P[i][1];cur.horas++;}else{cur={inicio:P[i][0],fin:P[i][1],asignatura:m,horas:1};bl.push(cur);}});horario[DN[d]]=bl;}
const J={formato:'puedo-faltar/2',centro:'Institut Guindàvols (Lleida) · 1r CAI',limite:20,
 trimestres:TERMS.map(t=>({id:t[0],nombre:t[0]+' trimestre',desde:t[1],hasta:t[2]})),
 festivos:FEST.map(f=>({desde:f[0],hasta:f[1],nombre:f[2]})),horario,tramos:[],unificar:[],no_cuentan:['Tutoria'],
 reglas:{ambito:'curso',justificadas:'no_cuentan',limite_justificadas:20,semanas_curso:33,retrasos_por_falta:3},
 faltas:truth.filter(t=>t.injust).map(t=>({fecha:null,asignatura:t.modulo,horas:t.injust,tipo:'falta',justificada:false})),
 dudas:['No sabe las horas oficiales de cada módulo']};
fs.writeFileSync('w/respuesta_ia_alta.json',JSON.stringify(J,null,1));
(async()=>{
const x=await open();const {p,tap,type,shot,cnt}=x;
await type('#ct-q','guindavols');await p.waitForTimeout(700);await tap('[data-ct]');
await type('#cy-other input[name=n]','Cures auxiliars d\'infermeria');await tap('#cy-other button');
await tap('[data-act=how-ai]');await shot('i01_ia1');await T(x,'IA paso 1');
await tap('[data-act=copy-prompt]');await p.waitForTimeout(300);const clip=await p.evaluate(()=>navigator.clipboard.readText()).catch(e=>'ERR '+e.message);fs.writeFileSync('w/prompt_alta.txt',clip);console.log('prompt alta chars',clip.length,'| menciona centro/ciclo elegidos:',/guindavols|infermeria/i.test(clip));
if(await p.$('[data-act=copy-prompt]'))await tap('[data-act=copy-prompt]');await shot('i02_ia2');await T(x,'IA paso 2');
const bt=async()=>{const a=await p.$$eval('#app button, #app a.btn',bs=>bs.map(b=>(b.dataset.act||Object.keys(b.dataset).join(','))+':'+b.innerText.replace(/\n/g,' ').slice(0,30)));console.log(a.join(' ; '));};await bt();
if(await p.$('[data-act=next]'))await tap('[data-act=next]');await shot('i03_ia3');await T(x,'IA paso 3');
// primero: pegar algo roto (se cortó al copiar)
const full='Resumen: horario de tarde, 20% curso entero.\n```json\n'+JSON.stringify(J,null,1)+'\n```';
cnt.fields++;await p.fill('#paste',full.slice(0,900));await tap('[data-act=review]');await shot('i04_error');await T(x,'IA pegado cortado',600);await bt();
await p.click('[data-act=again]');await p.waitForTimeout(300);
if(!(await p.$('#paste'))){console.log('no vuelvo a #paste; botones:');await bt();}
await p.fill('#paste',full);await tap('[data-act=review]');await shot('i05_revision');await T(x,'IA revisión',2500);await bt();
await tap('[data-act=save-setup]');await p.waitForTimeout(700);await shot('i06_guardado');await T(x,'tras guardar',900);
const u=await x.st();fs.writeFileSync('w/state_IA.json',JSON.stringify(u,null,1));
console.log(JSON.stringify(cnt),JSON.stringify(u.settings),JSON.stringify(u.config.nocount),JSON.stringify(u.config.catalog),u.config.center);
cmp(u,'Alta con IA (faltas previas sin fecha, sin retrasos)');
console.log('errs',x.errs.filter(e=>!/CORS/.test(e)));await x.b.close();
// ---- Escenario "no toco el calendario" (plantilla Barcelona tal cual)
const sB=JSON.parse(fs.readFileSync('w/state_B.json'));const tpl=JSON.parse(JSON.stringify(sB));
tpl.config.terms=[{id:'1rtrimestre0',label:'1r trimestre',from:'2026-09-08',to:'2026-12-22'},{id:'2ntrimestre1',label:'2n trimestre',from:'2027-01-08',to:'2027-03-19'},{id:'3rtrimestre2',label:'3r trimestre',from:'2027-03-30',to:'2027-06-21'}];
tpl.config.holidays=[['2026-09-11','2026-09-11','Diada'],['2026-09-24','2026-09-24','La Mercè (Barcelona)'],['2026-10-12','2026-10-12','Fiesta Nacional'],['2026-12-08','2026-12-08','Inmaculada'],['2026-12-22','2027-01-07','Vacaciones de Navidad'],['2027-03-20','2027-03-29','Semana Santa'],['2027-05-17','2027-05-17','Segona Pasqua (Barcelona)']].map(h=>({from:h[0],to:h[1],label:h[2]}));
cmp(tpl,'Calendario de plantilla sin tocar, ámbito curso');
const t2=JSON.parse(JSON.stringify(tpl));t2.settings.ambito='trimestre';cmp(t2,'Plantilla sin tocar + por trimestre (por defecto)');
const y=await open({state:tpl});await y.p.click('[data-tab=faltas]');for(let i=0;i<7;i++)await y.p.click('[data-fw="-7"]');await y.shot('m01_semana_merce');await T(y,'SEMANA MERCÈ (plantilla)',500);
await y.b.close();
const z=await open({state:tpl,d:'2026-09-24'});await z.p.waitForTimeout(800);await z.shot('m02_hoy_merce');await T(z,'HOY 24/09 con plantilla',400);await z.b.close();
const w=await open({state:tpl,d:'2026-09-29'});await w.p.waitForTimeout(800);await T(w,'HOY 29/09 (Sant Miquel, festivo real) con plantilla',300);await w.b.close();
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
