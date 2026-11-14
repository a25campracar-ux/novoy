const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p,errs,go,shot,st,txt}=await L.open({w:375,h:667,dir:'shots/join'});
const s0=JSON.parse(fs.readFileSync('state_f2.json'));s0.since='2026-09-14';
const T=async()=>{await p.waitForTimeout(900);return (await txt()).replace(/\n+/g,' | ')};
const share=fs.readFileSync('share_link.txt','utf8').match(/file:\S+/)[0], bk=fs.readFileSync('backup_link.txt','utf8').trim();
// compañero que YA usa la app con 14 faltas abre el enlace de clase
await go('2026-11-18',s0);await p.goto('about:blank');await p.goto(share.replace('index.html','index.html?d=2026-11-18'));console.log('SHARE con datos:',await T());await shot('share-con-datos');
await p.evaluate(()=>document.querySelector('[data-act=join-yes]').click());await p.waitForTimeout(500);
console.log('toast',await p.evaluate(()=>document.querySelector('#toast').innerText),'faltas tras aceptar:',(await st()).faltas.length);console.log((await T()).slice(0,200));
// deshacer?
// usuario nuevo abre enlace de clase
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('ft.intro','1')});await p.goto('about:blank');await p.goto(share.replace('index.html','index.html?d=2026-11-18'));console.log('\nSHARE nuevo:',await T());
await p.evaluate(()=>document.querySelector('[data-act=join-yes]').click());await p.waitForTimeout(600);console.log('tras aceptar:',(await T()).slice(0,400));await shot('share-nuevo-tras');
const s=await st();console.log('settings',JSON.stringify(s.settings),'since',s.since,'catalog',JSON.stringify(s.config.catalog));
// copia: restaurar en móvil nuevo
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('ft.intro','1')});await p.goto('about:blank');await p.goto(bk.replace('index.html','index.html?d=2026-11-18'));console.log('\nBACKUP nuevo:',(await T()).slice(0,300));
await p.evaluate(()=>document.querySelector('[data-act=join-yes]').click());await p.waitForTimeout(600);const s2=await st();console.log('restaurado faltas',s2.faltas.length,'just',s2.faltas.filter(f=>f.justified).length,'retrasos',s2.faltas.filter(f=>f.type==='retraso').length,JSON.stringify(s2.settings),s2.since,s2.okDay);
// enlace roto
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('ft.intro','1')});await p.goto('about:blank');await p.goto(bk.slice(0,bk.length-200).replace('index.html','index.html?d=2026-11-18'));console.log('\nROTO:',await T());await shot('roto');
// tema no persiste
await go('2026-11-18',s0);await p.evaluate(()=>{document.querySelector('[data-tab=ajustes]').click()});await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-aj=app]').click());await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('#theme').click());
const t1=await p.evaluate(()=>document.documentElement.dataset.theme);await p.reload();await p.waitForTimeout(500);console.log('\nTEMA antes',t1,'tras recargar',await p.evaluate(()=>document.documentElement.dataset.theme||'(sistema)'));
// teclado: tab order y foco tras render
await go('2026-11-18',s0,{'ft.accx':String(Date.now())});
const seq=[];for(let i=0;i<8;i++){await p.keyboard.press('Tab');seq.push(await p.evaluate(()=>{const e=document.activeElement;return e.tagName+':'+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,18)}));}
console.log('\nTAB order',seq.join(' > '));
await p.keyboard.press('Enter');await p.waitForTimeout(400);console.log('foco tras Enter:',await p.evaluate(()=>document.activeElement.tagName+':'+(document.activeElement.innerText||'').slice(0,20)));
console.log('aria:',await p.evaluate(()=>({main:document.querySelector('#app').getAttribute('aria-live'),tabs:[...document.querySelectorAll('#tabs button')].map(b=>b.getAttribute('aria-current')),svgHidden:[...document.querySelectorAll('#tabs svg')].map(s=>s.getAttribute('aria-hidden')),mascot:(document.querySelector('.verdict svg')||{getAttribute(){return 'no-svg'}}).getAttribute('aria-hidden'),mascotRole:(document.querySelector('.verdict svg')||{getAttribute(){return ''}}).getAttribute('role'),h1:document.querySelectorAll('h1').length,h2:[...document.querySelectorAll('h2')].map(h=>h.innerText),bar:document.querySelector('.bar').getAttribute('aria-label'),segRole:null,lang:document.documentElement.lang})));
await p.evaluate(()=>document.querySelector('[data-tab=resumen]').click());await p.waitForTimeout(300);console.log('seg terms aria:',await p.evaluate(()=>[...document.querySelectorAll('.seg.terms button')].map(b=>[b.getAttribute('aria-pressed'),b.getAttribute('aria-selected'),b.getAttribute('role')].join('/'))));
console.log(errs);await b.close();})().catch(e=>{console.log('FAIL',e.message.slice(0,500));process.exit(1)});
