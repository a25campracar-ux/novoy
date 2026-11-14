// compara un estado guardado (ft.v2) con la verdad
const C=require('/home/claude/novoy/site/core.js');
module.exports=function(u,label){const truth=JSON.parse(require('fs').readFileSync('/tmp/nvtest/a2/verdad.json'));
 const S=C.scope(Object.assign({},u.config,{settings:Object.assign({},C.DEF,u.settings),faltas:u.faltas}));
 const tid=S.terms[0].id;const sum=Object.fromEntries(C.summary(S,tid).map(x=>[x.name,x]));
 const rows=truth.map(t=>{const a=sum[t.modulo]||{};return {modulo:t.modulo,totV:t.total,totApp:a.total,cuentV:t.cuentan,cuentApp:a.absent,quedanV:t.quedan,quedanApp:a.margin,dif:a.margin==null?null:+(a.margin-t.quedan).toFixed(1),peligro:a.margin>t.quedan?'SI':'no',estado:a.status}});
 console.log('== '+label+' (terms vista: '+S.terms.map(t=>t.id).join(',')+')');console.table(rows);return rows;};
