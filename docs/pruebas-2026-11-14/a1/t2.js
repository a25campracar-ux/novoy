const L=require('./lib.js'),A=require('./alta.js');(async()=>{const X=await L.open();const {b,p,errs,c,tap,type,shot,st,txt}=X;
await A.alta(X,'naive',{shots:true,brk:true});
console.log(await txt());console.log(c);
const s=await st();console.log(JSON.stringify(s.config.catalog),JSON.stringify(s.settings),JSON.stringify(s.config.nocount),JSON.stringify(s.config.ask),s.config.terms.map(t=>t.from+'>'+t.to).join(' '));
console.log(JSON.stringify(s.config.schedule));
require('fs').writeFileSync('state_naive_nofaltas.json',JSON.stringify(s));
console.log(errs.filter(e=>!/CORS/.test(e)));await b.close()})().catch(e=>{console.log('FAIL',e);process.exit(1)});
