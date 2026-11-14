const C=require('/home/claude/novoy/site/core.js');const u=JSON.parse(require('fs').readFileSync(process.argv[2]));
const S=Object.assign({},u.config,{settings:Object.assign({},C.DEF,u.settings),faltas:u.faltas});
console.log('lectiveDays',C.lectiveDays(S),'weeksFactor',C.weeksFactor(S),'nominal',JSON.stringify(C.nominalFactors(S)));
for(const t of S.terms){console.log(t.id);console.table(C.summary(S,t.id).map(x=>({name:x.name,total:x.total,absent:x.absent,pct:x.pct,limit:x.limit,margin:x.margin,st:x.status})));}
const tot={};S.terms.forEach(t=>{const c=C.computeTotals(S,t.id);for(const k in c)tot[k]=(tot[k]||0)+c[k]});console.log('curso',tot);
