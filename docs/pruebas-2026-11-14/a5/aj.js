const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/aj'});
const s0=JSON.parse(fs.readFileSync('state_f2.json'));s0.since='2026-09-14';
const T=async()=>{await p.waitForTimeout(700);return (await txt()).replace(/\n+/g,' | ')};
const click=async(sel,i=0)=>{const ok=await p.evaluate(([s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)return false;e.click();return true},[sel,i]);await p.waitForTimeout(400);return ok;};
const toast=()=>p.evaluate(()=>document.querySelector('#toast').innerText.replace(/\n/g,' '));
const log=(...a)=>console.log(...a,'\n');
await go('2026-11-18',s0);
await click('[data-tab=ajustes]');log('AJUSTES',await T());await shot('00lista');
for(const k of ['horario','faltas','clase','cuenta','app','borrar']){await click(`[data-aj="${k}"]`);log('== '+k,await T());await shot('sec-'+k);
  log(await p.$$eval('#app [data-act],#app [data-acx],#app button[id],#app label.btn,#app a.btn',els=>els.map(e=>(e.dataset.act||e.dataset.acx||e.id||e.getAttribute('for'))+'='+e.innerText.trim().slice(0,30))));
  await click('[data-aj=""]');}
// reglas
const sec=async(k)=>{await click('[data-tab=ajustes]');if(!(await p.$(`[data-aj="${k}"]`)))await click('[data-aj=""]');await click(`[data-aj="${k}"]`);};
const sset=async(v)=>{await sec('faltas');const ok=await click(`[data-sset="${v}"]`);if(!ok)throw new Error('no sset '+v);};
await sset('justModo|nocuentan');log('nocuentan toast',await toast());
await sset('justModo|separadas');log('separadas',await T());await shot('reglas-separadas');
await sset('limiteJust|30');
await click('[data-tab=resumen]');log(await T());await shot('resumen-separadas');
await sset('justModo|juntas');
await sset('ambito|curso');await click('[data-tab=resumen]');log('CURSO',await T());await shot('resumen-curso');
await click('[data-tab=hoy]');log('HOY curso',(await T()).slice(0,400));await shot('hoy-curso',false);
await sset('ambito|trimestre');
await sset('retrasosPorFalta|2');await click('[data-tab=resumen]');log('RETRASOS 2',(await T()).slice(-420));
await click('[data-tab=faltas]');log('label retraso',await p.$eval('#add',e=>e.innerText.replace(/\n+/g,' | ').slice(-120)));
await sset('retrasosPorFalta|0');
await sec('faltas');
await p.fill('[data-num=aviso]','0.5');await p.dispatchEvent('[data-num=aviso]','change');await click('[data-tab=hoy]');log('AVISO 0.5',(await T()).slice(0,260));
await sec('faltas');
await p.fill('[data-num=aviso]','');await p.dispatchEvent('[data-num=aviso]','change');log('aviso vacío',JSON.stringify((await st()).settings));
await sec('faltas');await p.fill('[data-num=aviso]','-3');await p.dispatchEvent('[data-num=aviso]','change');log('aviso -3',JSON.stringify((await st()).settings.aviso));
await sec('faltas');await p.fill('[data-num=semanas]','0');await p.dispatchEvent('[data-num=semanas]','change');log('semanas 0',JSON.stringify((await st()).settings),await toast());
await sec('faltas');await p.fill('[data-num=semanas]','20');await p.dispatchEvent('[data-num=semanas]','change');await click('[data-tab=resumen]');log('semanas 20',(await T()).slice(100,420));
await sec('faltas');await p.fill('[data-num=semanas]','33');await p.dispatchEvent('[data-num=semanas]','change');await sec('faltas');await p.fill('[data-num=aviso]','2');await p.dispatchEvent('[data-num=aviso]','change');
await click('[data-tab=ajustes]');
// cuenta
await sec('cuenta');
await p.fill('#ac-p','hola');await p.fill('#ac-p2','hola');await p.waitForTimeout(300);await shot('cuenta-pass-corta');log('CUENTA corta',await p.$eval('#acf',e=>e.innerText.replace(/\n+/g,' | ')));
await p.evaluate(()=>document.querySelector('#acf').requestSubmit());await p.waitForTimeout(600);log('submit corta',await toast(),(await T()).slice(0,500));
await p.fill('#ac-p','Tarragona2026');await p.fill('#ac-p2','Tarragona2026');await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#acf').requestSubmit());await p.waitForTimeout(2500);log('submit sin red',await toast(),await T());await shot('cuenta-sin-red');
await click('[data-act=ac-mode][data-m=login]');log('LOGIN',await T());await shot('cuenta-login');
await p.fill('#ac-u','pepito');await p.fill('#ac-p','Tarragona2026');await p.evaluate(()=>document.querySelector('#acf').requestSubmit());await p.waitForTimeout(2500);log('login sin red',await toast(),(await T()).slice(0,400));
// copia
await click('[data-act=backup-link]');await p.waitForTimeout(600);log('backup-link',await toast());const link=await p.evaluate(()=>navigator.clipboard.readText().catch(e=>'ERR'));log('link len',link.length,link.slice(0,90));fs.writeFileSync('backup_link.txt',link);
// compartir
await sec('clase');await p.waitForTimeout(500);log('wa href',await p.$eval('#sh-wa',e=>(e.getAttribute('href')||'').slice(0,200)));
await click('[data-act=share]');await p.waitForTimeout(600);log('share',await toast());const sl=await p.evaluate(()=>navigator.clipboard.readText().catch(e=>'ERR'));log('share link',sl.length,sl.slice(0,120));fs.writeFileSync('share_link.txt',sl);
// app
await sec('app');await click('[data-act=open-install]');log('INSTALL',await T());await shot('instalar');
log(await p.$$eval('#app button',els=>els.map(e=>(e.dataset.act||e.dataset.it||e.className)+'='+e.innerText.trim().slice(0,20))));
await click('[data-act=inst-close]');await sec('app');
await click('#theme');log('theme',await p.evaluate(()=>[document.documentElement.dataset.theme,document.documentElement.className,localStorage.getItem('ft.theme')]),await toast());await shot('tema-toggle',false);
await click('#theme');log('theme2',await p.evaluate(()=>[document.documentElement.dataset.theme,localStorage.getItem('ft.theme')]));await click('#theme');log('theme3',await p.evaluate(()=>[document.documentElement.dataset.theme,localStorage.getItem('ft.theme')]));
// borrar
await sec('borrar');await click('[data-act=wipe-faltas]');log('WIPE',await T());await shot('borrar-confirm');
await click('[data-act=wipe-yes]');log(await toast(),(await st()).faltas.length,(await T()).slice(0,200));
log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
