const { chromium } = require('playwright');
const base='file:///home/claude/novoy/site/index.html?d=';
async function open(opts={}){const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push('console:'+m.text())});
 await p.route('**/fonts.googleapis.com/**',r=>r.abort());await p.route('**/analisi.transparenciacatalunya.cat/**',r=>r.abort());await p.route('**/fonts.gstatic.com/**',r=>r.abort());
 const day=opts.day||'2026-11-13';
 await p.goto(base+day);await p.evaluate((st)=>{localStorage.clear();localStorage.setItem('ft.intro','1');sessionStorage.setItem('ft.sp','1');if(st){localStorage.setItem('ft.v2',JSON.stringify(st));localStorage.setItem('ft.accx',String(Date.now()))}},opts.state||null);await p.goto(base+day);await p.waitForTimeout(400);
 let n=0;const shot=async(name)=>{await p.waitForTimeout(350);await p.screenshot({path:__dirname+'/shots/'+name+'.png',fullPage:true})};
 const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('ft.v2')));
 const txt=()=>p.evaluate(()=>document.querySelector('#app').innerText);
 const pal=async(name)=>{const bs=await p.$$('[data-pal]');for(const x of bs){if((await x.innerText()).trim().split(/\s/)[0]===name){await x.click();return}}throw new Error('no pal '+name)};
 const paint=async(grid)=>{ // grid: {d:[sub,...]}
  const subs=new Set();Object.values(grid).forEach(a=>a.forEach(s=>s&&subs.add(s)));let taps=0;
  for(const s of subs){await pal(s);taps++;for(const d of Object.keys(grid))for(let r=0;r<grid[d].length;r++)if(grid[d][r]===s){const cur=await p.$eval(`.gc[data-d="${d}"][data-r="${r}"]`,e=>e.getAttribute('aria-label'));if(!cur.endsWith(': '+s)){await p.click(`.gc[data-d="${d}"][data-r="${r}"]`);taps++}}}
  return taps};
 return {b,p,errs,shot,st,txt,pal,paint,goto:(d)=>p.goto(base+d).then(()=>p.waitForTimeout(400))};
}
module.exports={open};
