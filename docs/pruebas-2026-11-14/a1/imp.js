exports.resp=(variant)=>{const F=require('./faltas.json');const key=variant==='naive'?'fig':'cuenta';
// la IA (yo) agrupa por dia+asignatura, como pide el mensaje ("Cada falta es UNA asignatura en UN dia")
const m=new Map();for(const f of F){const k=f.fecha+'|'+f[key]+'|'+f.tipo+'|'+f.just;const o=m.get(k)||{fecha:f.fecha,asignatura:f[key],horas:0,tipo:f.tipo,justificada:f.just};o.horas+=f.h;m.set(k,o);}
return 'He encontrado '+m.size+' faltas. No he dejado nada fuera.\n```json\n'+JSON.stringify({faltas:[...m.values()]},null,1)+'\n```';};
exports.importar=async(X,variant,pre)=>{const {p,tap,type,shot}=X;
await tap('[data-act=start-import]');await shot(pre+'i1');
await tap('[data-act=copy-prompt]');await p.waitForTimeout(300);
const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(e=>'ERR '+e));
require('fs').writeFileSync('/tmp/nvtest/a1/prompt_import_'+variant+'.txt',clip);
if(await p.$('[data-act=copy-prompt]')){await shot(pre+'i2');await tap('[data-act=copy-prompt]');}
if(await p.$('[data-act=next]'))await tap('[data-act=next]');await shot(pre+'i3');
await type('#paste',exports.resp(variant));
await tap('[data-act=review]');await shot(pre+'i4');const t=await X.txt();
await tap('[data-act=save-setup]');await shot(pre+'i5');return t;};
