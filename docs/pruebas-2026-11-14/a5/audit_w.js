const L=require('./lib');const fs=require('fs');
const SIZES=[[320,568],[375,667],[390,844]];
const METRICS=()=>{
  const vw=window.innerWidth,vh=window.innerHeight,out={vw,docW:document.documentElement.scrollWidth,overflowX:[],small:[],clipped:[],noName:[],contrast:[],tiny:[]};
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05};
  const sig=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):'')+' "'+(e.getAttribute('aria-label')||e.innerText||e.value||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,28)+'"';
  const hidden=e=>{for(let x=e;x;x=x.parentElement){if(x.id==='splash'||x.hidden)return true;}return false};
  document.querySelectorAll('body *').forEach(e=>{if(!vis(e)||hidden(e))return;const r=e.getBoundingClientRect();if(r.right>vw+1.5&&r.width<vw*1.5&&getComputedStyle(e).position!=='fixed'){let p=e.parentElement,sc=false;for(;p;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){sc=true;break}}if(!sc)out.overflowX.push(sig(e)+' right='+Math.round(r.right))}});
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,label[for]').forEach(e=>{if(!vis(e)||hidden(e))return;const r=e.getBoundingClientRect();if(e.tagName==='INPUT'&&e.type==='checkbox'){const p=e.closest('.switch');if(p){const pr=p.getBoundingClientRect();if(pr.height>=44)return;}}
    if(r.height<43.5||r.width<43.5)out.small.push(sig(e)+' '+Math.round(r.width)+'x'+Math.round(r.height));
    const name=(e.getAttribute('aria-label')||e.innerText||e.title||'').trim();let lab=name;
    if(/INPUT|SELECT|TEXTAREA/.test(e.tagName)){lab=e.getAttribute('aria-label')||(e.id&&document.querySelector('label[for="'+e.id+'"]'))||e.closest('label')||(e.closest('.field')&&e.closest('.field').querySelector('label')&&'~field-label-sin-for');}
    if(!lab)out.noName.push(sig(e));else if(lab==='~field-label-sin-for')out.noName.push('(label sin for) '+sig(e));});
  // texto cortado
  document.querySelectorAll('#app *,#tabs *').forEach(e=>{if(!vis(e))return;const s=getComputedStyle(e);if((s.overflow==='hidden'||s.textOverflow==='ellipsis')&&e.scrollWidth>e.clientWidth+1&&e.innerText&&e.children.length===0)out.clipped.push(sig(e))});
  // contraste
  const parse=c=>{let m=/rgba?\(([^)]+)\)/.exec(c);if(m){const p=m[1].split(/[, /]+/).map(Number);return [p[0],p[1],p[2],p[3]==null||isNaN(p[3])?1:p[3]]}m=/color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/.exec(c);if(m)return [m[1]*255,m[2]*255,m[3]*255,m[4]==null?1:+m[4]];return null};
  const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
  const over=(a,b)=>[a[0]*a[3]+b[0]*(1-a[3]),a[1]*a[3]+b[1]*(1-a[3]),a[2]*a[3]+b[2]*(1-a[3]),1];
  const bgOf=e=>{const st=[];for(let x=e;x;x=x.parentElement){const s=getComputedStyle(x);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c&&c[3]>0){st.push(c);if(c[3]>=1)break}}let b=[255,255,255,1];const root=parse(getComputedStyle(document.body).backgroundColor);if(root&&root[3]>0)b=root;for(let i=st.length-1;i>=0;i--)b=over(st[i],b);return b};
  const seen=new Set();
  document.querySelectorAll('#app *,#tabs *').forEach(e=>{if(!vis(e))return;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;const s=getComputedStyle(e);const fs=parseFloat(s.fontSize);if(fs<11.5){const k='tiny '+sig(e).split(' "')[0]+' '+fs;if(!seen.has(k)){seen.add(k);out.tiny.push(sig(e)+' '+fs+'px')}}
    const fg0=parse(s.color),bg=bgOf(e);if(!fg0||!bg)return;const fg=over(fg0,bg);const l1=lum(fg),l2=lum(bg),cr=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);const big=fs>=24||(fs>=18.66&&+s.fontWeight>=700);if(cr<(big?3:4.5)){const k=sig(e).split(' "')[0]+cr.toFixed(1);if(!seen.has(k)){seen.add(k);out.contrast.push(cr.toFixed(2)+' '+sig(e)+' '+fs+'px')}}});
  // barra fija tapa el final
  const fixed=[...document.querySelectorAll('#tabs,.cta,#warnbar')].filter(vis).map(e=>e.getBoundingClientRect().top);const topFixed=Math.min(vh,...fixed);
  window.scrollTo(0,document.documentElement.scrollHeight);
  const kids=[...document.querySelectorAll('#app > *')].filter(e=>vis(e)&&getComputedStyle(e).position!=='fixed');const last=kids[kids.length-1];
  out.lastBottom=last?Math.round(last.getBoundingClientRect().bottom):null;out.fixedTop=Math.round(topFixed);out.covered=last?Math.round(last.getBoundingClientRect().bottom-topFixed):0;
  window.scrollTo(0,0);return out;};
(async()=>{
const res={};
for(const dark of [false,true])for(const [w,h] of SIZES){
 const tag=w+(dark?'d':'l');const {b,p,errs,go,shot,st}=await L.open({w,h,dark,dir:'shots/audit/'+tag});
 const click=async(sel,i=0)=>{const ok=await p.evaluate(([s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)return false;e.click();return true},[sel,i]);await p.waitForTimeout(350);return ok;};
 const cap=async(name)=>{await p.waitForTimeout(900);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:'shots/audit/'+tag+'/'+name+'.png'});const m=await p.evaluate(METRICS);
   const H=await p.evaluate(()=>document.documentElement.scrollHeight);if(H>h+40){await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(250);await p.screenshot({path:'shots/audit/'+tag+'/'+name+'_fin.png'});await p.evaluate(()=>window.scrollTo(0,0));}
   res[tag+' '+name]=m;};
 // --- alta
 await go('2026-11-13',null);
 await p.fill('#ct-q','Institut Vidal i Barraquer');await p.waitForTimeout(700);
 await click('[data-ct]');
 await p.fill('#cy-other input[name=n]','Batxillerat nocturn');await p.evaluate(()=>document.querySelector('#cy-other').requestSubmit());await p.waitForTimeout(300);
 await click('[data-act=how-paint]');
 for(const s of ['MAT','CAT','FIL','ANG','FIQ','TEC']){await p.fill('#q-sub input[name=s]',s);await p.evaluate(()=>document.querySelector('#q-sub').requestSubmit());await p.waitForTimeout(100);}
 
 await click('[data-act=q-add-done]');
 await p.evaluate(()=>{[...document.querySelectorAll('details.more summary')].find(s=>/Cambiar las horas/.test(s.innerText)).click()});await p.waitForTimeout(200);
 await p.fill('[data-qf=start]','17:30');await p.dispatchEvent('[data-qf=start]','change');await p.waitForTimeout(150);
 for(const [k,v] of [['rows',4],['brk',2],['brkMin',30]]){await p.evaluate(([k,v])=>{const e=document.querySelector('[data-qf='+k+']');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))},[k,String(v)]);await p.waitForTimeout(150);}
 const H={0:[[1,0],[1,1],[3,0],[4,1]],1:[[1,2],[3,1]],2:[[1,3],[3,2]],3:[[2,1],[4,0]],4:[[2,2],[2,3],[4,2]],5:[[3,3],[4,3]]};
 for(const s of Object.keys(H)){await click(`[data-pal="${s}"]`);for(const [d,r] of H[s]){await p.evaluate(([d,r])=>{const e=document.querySelector(`.gc[data-d="${d}"][data-r="${r}"]`);e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();const o={bubbles:true,clientX:b.x+5,clientY:b.y+5,pointerId:1,pointerType:'touch',isPrimary:true};e.dispatchEvent(new PointerEvent('pointerdown',o));e.dispatchEvent(new PointerEvent('pointerup',o));window.dispatchEvent(new PointerEvent('pointerup',o));},[d,r]);await p.waitForTimeout(80);}}
 await cap('w3-rejilla');
 await p.evaluate(()=>{[...document.querySelectorAll('details.more summary')].find(s=>/Casos especiales/.test(s.innerText)).click()});await p.waitForTimeout(200);await cap('w3-casos');
 await click('[data-act=q-next]');await cap('w4-calendario');
 await click('[data-act=q-next]');await cap('w5-reglas');
 await click('[data-act=q-next]');await cap('w6-previas');
 res[tag+' _errs']=errs;await b.close();console.log('done',tag);
}
fs.writeFileSync('audit_w.json',JSON.stringify(res,null,1));
})().catch(e=>{console.log('FAIL',e.message.slice(0,600));process.exit(1)});
