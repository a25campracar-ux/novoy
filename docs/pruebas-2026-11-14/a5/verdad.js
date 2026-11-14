// Verdad independiente de la app: cuenta sesiones reales por evaluación (lun-jue, sin festivos)
const H={1:['MAT','MAT','CAT','FIL'],2:[null,'ANG','FIQ','FIQ'],3:['MAT','CAT','FIL','TEC'],4:['ANG','MAT','FIQ','TEC']};
const evals=[['1a','2026-09-14','2026-11-27'],['2a','2026-11-30','2027-03-05'],['3a','2027-03-08','2027-06-04']];
const fest=[['2026-09-23','2026-09-23'],['2026-10-12','2026-10-12'],['2026-11-02','2026-11-02'],['2026-12-07','2026-12-08'],['2026-12-22','2027-01-07'],['2027-02-15','2027-02-15'],['2027-03-22','2027-03-29']];
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const isF=k=>fest.some(([a,b])=>k>=a&&k<=b);
// faltas: [fecha, asignatura, horas, justificada(trabajo)]
const faltas=[['2026-09-22','FIQ',2,false],['2026-10-05','MAT',2,true],['2026-10-05','CAT',1,true],['2026-10-05','FIL',1,true],
['2026-10-15','ANG',1,true],['2026-10-21','TEC',1,false],['2026-10-26','MAT',1,true],['2026-10-29','FIQ',1,false],
['2026-11-03','ANG',1,false],['2026-11-09','FIL',1,false],['2026-11-11','MAT',1,false]];
const hoy='2026-11-13';
for(const [id,a,b] of evals){const tot={},rest={};
 for(let d=new Date(a+'T12:00');ymd(d)<=b;d.setDate(d.getDate()+1)){const k=ymd(d);if(isF(k))continue;(H[d.getDay()]||[]).forEach(s=>{if(!s)return;tot[s]=(tot[s]||0)+1;if(k>=hoy)rest[s]=(rest[s]||0)+1;});}
 console.log('\nEvaluación',id,a,'→',b);
 console.log('asig | horas | límite 20% | faltas brutas | computables (just=½) | % | margen (h sin justificar) | clases que quedan');
 for(const s of Object.keys(tot)){const fs=faltas.filter(f=>f[1]===s&&f[0]>=a&&f[0]<=b);const bru=fs.reduce((n,f)=>n+f[2],0),comp=fs.reduce((n,f)=>n+f[2]*(f[3]?0.5:1),0);
  const lim=tot[s]*0.2;console.log(s,'|',tot[s],'|',lim.toFixed(1),'|',bru,'|',comp,'|',(comp/tot[s]*100).toFixed(1)+'%','|',(lim-comp).toFixed(1),'|',rest[s]||0);}
}
