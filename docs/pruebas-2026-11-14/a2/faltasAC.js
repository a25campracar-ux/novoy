const {open}=require('./lib.js');const {F,R,H}=require('./caso_data.js');const fs=require('fs');const cmp=require('./cmp.js');
const wd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).getDay()};
const st0=JSON.parse(fs.readFileSync('w/state_alta_sin_faltas.json'));
const truth=JSON.parse(fs.readFileSync('verdad.json'));
(async()=>{
// ---- Vía A: contadores (solo injustificadas, que es lo que "cuenta")
for(const variant of ['injust','todas']){
 const x=await open({state:st0});const {p,tap,shot,cnt}=x;
 await tap('[data-act=prv-open]');
 for(const t of truth){const n=variant==='injust'?t.injust:t.injust+t.just;for(let i=0;i<n;i++)await tap(`[data-pv="${t.modulo}|1"]`);}
 if(variant==='injust')await shot('c01_contadores');
 await tap('[data-act=prv-save]');await p.waitForTimeout(300);
 const u=await x.st();console.log('Vía A',variant,JSON.stringify(cnt),'faltas',u.faltas.length);cmp(u,'Vía A contadores ('+variant+')');
 if(variant==='injust'){fs.writeFileSync('w/state_A.json',JSON.stringify(u,null,1));await tap('[data-tab=faltas]');await shot('c02_faltas_previas');console.log((await x.txt()).replace(/\n+/g,' | ').slice(600,1500));}
 await x.b.close();
}
// ---- Vía C: con IA
const mk=(perHour)=>{const out=[];
 F.forEach(([d,ps,j])=>{const by={};ps.forEach(pp=>{const m=H[wd(d)][pp-1];by[m]=(by[m]||0)+1;});
  Object.keys(by).forEach(m=>{if(perHour)for(let i=0;i<by[m];i++)out.push({fecha:d,asignatura:m,horas:1,tipo:'falta',justificada:j});else out.push({fecha:d,asignatura:m,horas:by[m],tipo:'falta',justificada:j});});});
 R.forEach(([d,pp,j])=>out.push({fecha:d,asignatura:H[wd(d)][pp-1],horas:0,tipo:'retraso',justificada:j}));return out;};
for(const variant of ['porClase','porHora']){
 const x=await open({state:st0});const {p,tap,shot,cnt}=x;
 await tap('[data-act=start-import]');await shot('c10_import1_'+variant);
 if(variant==='porClase')console.log('IMPORT1:',(await x.txt()).replace(/\n+/g,' | '));
 await tap('[data-act=copy-prompt]');await p.waitForTimeout(300);
 if(variant==='porClase'){const clip=await p.evaluate(()=>navigator.clipboard.readText()).catch(e=>'ERR '+e.message);fs.writeFileSync('w/prompt_import.txt',clip);console.log('prompt chars',clip.length);await shot('c11_import_copiado');console.log('IMPORT1b:',(await x.txt()).replace(/\n+/g,' | '));}
 if(await p.$('[data-act=copy-prompt]'))await tap('[data-act=copy-prompt]');
 await shot('c12_import2_'+variant);if(variant==='porClase')console.log('IMPORT2:',(await x.txt()).replace(/\n+/g,' | '));
 if(await p.$('[data-act=next]'))await tap('[data-act=next]');
 const resp='He encontrado tus faltas.\n```json\n'+JSON.stringify({faltas:mk(variant==='porHora')},null,1)+'\n```';
 cnt.fields++;await p.fill('#paste',resp);await shot('c13_pegado_'+variant);
 await tap('[data-act=review]');await shot('c14_revision_'+variant);console.log('REVISION '+variant+':',(await x.txt()).replace(/\n+/g,' | ').slice(0,1800));
 await tap('[data-act=save-setup]');await shot('c15_guardado_'+variant);
 const u=await x.st();console.log('Vía C',variant,JSON.stringify(cnt),'faltas',u.faltas.length,'retr',u.faltas.filter(f=>f.type==='retraso').length);cmp(u,'Vía C IA ('+variant+')');
 fs.writeFileSync('w/state_C_'+variant+'.json',JSON.stringify(u,null,1));
 console.log('errs',x.errs.filter(e=>!/CORS/.test(e)));await x.b.close();
}
})().catch(e=>{console.log('FAIL',e.stack);process.exit(1)});
