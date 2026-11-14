const {H,NOMS,TERMS,FEST,F}=require('./datos.js');
const WD=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const isF=d=>FEST.some(f=>d>=f[0]&&d<=f[1]);
const ymd=d=>d.toISOString().slice(0,10);
function hours(from,to){const o={};for(let d=new Date(from+'T12:00Z');ymd(d)<=to;d.setUTCDate(d.getUTCDate()+1)){const k=ymd(d);if(isF(k))continue;(H[WD[d.getUTCDay()]]||[]).forEach(b=>{const h=(+b[1].slice(0,2)*60+ +b[1].slice(3)-(+b[0].slice(0,2)*60+ +b[0].slice(3)))/60;o[b[2]]=(o[b[2]]||0)+h;});}return o;}
const T=hours(TERMS[0][2],TERMS[0][3]); const rest=hours('2026-11-14',TERMS[0][3]);
const out={};
console.log('mod | h trimestre | A | J | R | %A | %A+J | queda inj (25%) | queda total (40%) | margen real = min');
let sa=0,sj=0;
Object.keys(NOMS).forEach(m=>{const A=F.filter(f=>f.mod===m&&f.estado==='A').reduce((a,f)=>a+f.horas,0),J=F.filter(f=>f.mod===m&&f.estado==='J').reduce((a,f)=>a+f.horas,0),R=F.filter(f=>f.mod===m&&f.estado==='R').length;
 sa+=A;sj+=J;const t=T[m],l25=Math.floor(t*0.25),l40=Math.floor(t*0.40);
 out[m]={total:t,A,J,R,pA:+(A/t*100).toFixed(1),pAJ:+((A+J)/t*100).toFixed(1),lim25:t*0.25,lim40:t*0.4,q25:+(t*0.25-A).toFixed(1),q40:+(t*0.4-A-J).toFixed(1),real:+Math.min(t*0.25-A,t*0.4-A-J).toFixed(1),quedan:rest[m]};
 console.log([m,t,A,J,R,out[m].pA,out[m].pAJ,out[m].q25,out[m].q40,out[m].real].join(' | '));});
console.log('TOTAL A',sa,'J',sj,'suma',sa+sj);
require('fs').writeFileSync(__dirname+'/verdad.json',JSON.stringify(out,null,1));
