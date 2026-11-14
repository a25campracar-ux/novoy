// Cálculo INDEPENDIENTE de la app (no usa core.js). Verdad del centro: horas realmente programadas por bloque.
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const P=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
function isoWeek(s){const d=P(s);const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-dn);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y0)/864e5+1)/7)}
const A={1:['ASO','ASO','ASO','SAD','SAD',null],2:['SXI','SXI','SXI','IAW','IAW','IAW'],3:['ASGBD','ASGBD','ASGBD','EIE','EIE','TUT'],4:['SAD','SAD','ASO','IAW','DIG*','DIG*'],5:['SXI','SXI',null,'ASGBD','ASGBD',null]};
const B={1:['SAD','SAD','SAD','ASO','ASO',null],2:['SXI','SXI','SXI','IAW','IAW','CIB'],3:['ASGBD','ASGBD','ASGBD','EIE','EIE','TUT'],4:['ASO','ASO','SAD','IAW','DIG*','DIG*'],5:['SXI','SXI','CIB','ASGBD','ASGBD','CIB']};
const HOL=[['2026-10-12','2026-10-12'],['2026-12-07','2026-12-08'],['2026-12-22','2027-01-07']];
const PRJ=[['2026-10-19','2026-10-23'],['2027-01-18','2027-01-22']];
const TERMS=[['B1','2026-09-14','2026-12-04'],['B2','2026-12-07','2027-02-12']];
const inR=(d,rs)=>rs.some(r=>d>=r[0]&&d<=r[1]);
const ROWS=['08:00','09:00','10:00','11:20','12:20','13:20'];
function day(d){const w=P(d).getDay();if(w<1||w>5||inR(d,HOL))return[];
  if(inR(d,PRJ))return ROWS.map(()=> 'PRJ');
  const sch=(d>='2026-11-02'?B:A)[w];return sch.map(x=>x==='DIG*'?(isoWeek(d)%2===0?'DIG':null):x)}
const tot={},rem={};const TODAY='2026-11-13';let weeks=new Set(),days=0;
for(const[t,a,b]of TERMS){tot[t]={};rem[t]={};for(let d=P(a);ymd(d)<=b;d.setDate(d.getDate()+1)){const k=ymd(d);const c=day(k);if(c.length){days++;weeks.add(isoWeek(k)+'-'+d.getFullYear())}c.forEach(s=>{if(!s)return;tot[t][s]=(tot[t][s]||0)+1;if(k>TODAY)rem[t][s]=(rem[t][s]||0)+1})}}
const F=[ // fecha, modulo, horas, tipo, just
['2026-09-21','ASO',0,'retraso',0],['2026-09-22','IAW',3,'falta',0],['2026-09-28','ASO',3,'falta',1],['2026-10-05','ASO',0,'retraso',0],
['2026-10-07','ASGBD',0,'retraso',0],['2026-10-08','SAD',2,'falta',0],['2026-10-08','ASO',1,'falta',0],['2026-10-14','ASGBD',0,'retraso',0],
['2026-10-15','DIG',2,'falta',0],['2026-10-16','ASGBD',2,'falta',1],['2026-10-21','PRJ',2,'falta',0],
['2026-11-02','SAD',3,'falta',0],['2026-11-06','CIB',2,'falta',0],['2026-11-06','ASGBD',2,'falta',1],['2026-11-10','CIB',0,'retraso',0],['2026-11-12','DIG',2,'falta',0],['2026-11-12','IAW',1,'falta',0]];
// comprobación: cada falta cae en un día con ese módulo y esas horas
for(const f of F){const c=day(f[0]).filter(x=>x===f[1]).length;if(c<Math.max(1,f[2]))console.log('!! falta imposible',f,day(f[0]),'semISO',isoWeek(f[0]))}
const res={};const t='B1';
for(const m of Object.keys(tot[t])){const inj=F.filter(f=>f[1]===m&&f[3]==='falta'&&!f[4]).reduce((a,f)=>a+f[2],0);const ret=F.filter(f=>f[1]===m&&f[3]==='retraso').length;const jus=F.filter(f=>f[1]===m&&f[4]).reduce((a,f)=>a+f[2],0);
 const abs=inj+Math.floor(ret/2);const T=tot[t][m];res[m]={total:T,limite15:+(T*.15).toFixed(2),injust:inj,retrasos:ret,cuentan:abs,pct:+(abs/T*100).toFixed(1),margen:+(T*.15-abs).toFixed(2),just:jus,limJ10:+(T*.10).toFixed(2),margenJ:+(T*.10-jus).toFixed(2),quedanClase:rem[t][m]||0}}
console.log('días lectivos',days,'semanas con clase',weeks.size);
console.log('TOTALES B1',tot.B1,'\nTOTALES B2',tot.B2);
console.table(res);
require('fs').writeFileSync(__dirname+'/verdad.json',JSON.stringify({tot,rem,res,F},null,1));
