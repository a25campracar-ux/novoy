const { chromium } = require('playwright');
const fs=require('fs');
exports.open=async function(opts={}){
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
  const ctx=await b.newContext({viewport:{width:opts.w||375,height:opts.h||667},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:opts.dark?'dark':'light',locale:'es-ES',permissions:['clipboard-read','clipboard-write']});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|CORS/.test(m.text()))errs.push('console: '+m.text().slice(0,200))});
  await p.route('**/fonts.googleapis.com/**',r=>r.abort());await p.route('**/analisi.transparenciacatalunya.cat/**',r=>r.abort());
  const base=(d)=>'file:///home/claude/novoy/site/index.html?d='+d;
  const go=async(d,state,extra)=>{await p.goto(base(d));await p.evaluate(([s,extra])=>{if(s!==undefined){localStorage.clear();if(s)localStorage.setItem('ft.v2',JSON.stringify(s));}localStorage.setItem('ft.intro','1');sessionStorage.setItem('ft.sp','1');if(extra)Object.keys(extra).forEach(k=>localStorage.setItem(k,extra[k]));},[state,extra||null]);await p.goto(base(d));await p.waitForTimeout(450);};
  const dir=opts.dir||'shots';fs.mkdirSync(dir,{recursive:true});
  const shot=async(n,full=true)=>{await p.waitForTimeout(450);await p.screenshot({path:dir+'/'+n+'.png',fullPage:full});};
  const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('ft.v2')));
  const txt=()=>p.evaluate(()=>document.querySelector('#app').innerText);
  return {b,ctx,p,errs,go,shot,st,txt};
};
