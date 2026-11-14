// Cálculo independiente de la app (no usa core.js)
const terms=[['1r','2026-09-14','2026-11-27'],['2n','2026-11-30','2027-03-05'],['3r','2027-03-08','2027-05-26']];
const hol=[['2026-09-24','2026-09-24'],['2026-10-12','2026-10-12'],['2026-12-08','2026-12-08'],['2026-12-22','2027-01-07'],['2027-03-20','2027-03-29'],['2027-05-17','2027-05-17']];
// horario: día -> lista [módulo que figura, módulo al que cuenta]
const H={1:[['E.SER','E.SER'],['E.SER','E.SER'],['DIW','DIW'],['PROJ','E.SER']],
2:[['E.CLI','E.CLI'],['E.CLI','E.CLI'],['IPO II','IPO II'],['PROJ','E.CLI']],
3:[['DAW','DAW'],['DAW','DAW'],['E.SER','E.SER']],
4:[['DIW','DIW'],['E.CLI','E.CLI'],['PROJ','DIW']],
5:[['IPO II','IPO II'],['OPT','OPT'],['TUT','TUT']]};
const p=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
const f=d=>d.toISOString().slice(0,10);
const isHol=k=>hol.some(h=>k>=h[0]&&k<=h[1]);
const weekly={};Object.values(H).flat().forEach(([a,b])=>weekly[b]=(weekly[b]||0)+1);
const cal={},days={};let allDays=0;
for(const[id,a,b]of terms){cal[id]={};days[id]=0;for(let d=p(a);f(d)<=b;d.setUTCDate(d.getUTCDate()+1)){const k=f(d),w=d.getUTCDay();if(w<1||w>5||isHol(k))continue;days[id]++;allDays++;H[w].forEach(([x,m])=>cal[id][m]=(cal[id][m]||0)+1);}}
console.log('semanal',weekly,'dias lectivos',days,allDays,'semanas=',(allDays/5).toFixed(1));
const faltas=require('./faltas.json');
const mods=Object.keys(weekly);
const out={};
for(const m of mods){
  const of=weekly[m]*33; const calTot=terms.reduce((s,t)=>s+(cal[t[0]][m]||0),0);
  const A=of*days['1r']/allDays;           // oficial × días T1 / días curso
  const B=cal['1r'][m];                     // sesiones reales T1
  const fa=faltas.filter(x=>x.cuenta===m&&x.tipo==='falta').reduce((s,x)=>s+x.h,0);
  const re=faltas.filter(x=>x.cuenta===m&&x.tipo==='retraso').length;
  const abs=fa+Math.floor(re/3);
  const rest=faltas.length?0:0;
  out[m]={sem:weekly[m],oficial:of,calCurso:calTot,T1_33:+A.toFixed(2),T1_cal:B,faltas:fa,retr:re,cuenta:abs,
   lim33:+(A*.25).toFixed(2),limCal:+(B*.25).toFixed(2),pct33:+(abs/A*100).toFixed(1),pctCal:+(abs/B*100).toFixed(1),queda33:+(A*.25-abs).toFixed(2),quedaCal:+(B*.25-abs).toFixed(2)};
}
console.table(out);
require('fs').writeFileSync('verdad.json',JSON.stringify({weekly,days,allDays,out},null,1));
