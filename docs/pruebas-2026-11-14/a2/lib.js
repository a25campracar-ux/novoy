const { chromium } = require('playwright');
const base=(d)=>'file:///home/claude/novoy/site/index.html?d='+(d||'2026-11-13');
async function open(opts={}){
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push('console: '+m.text())});
  await p.route('**/fonts.googleapis.com/**',r=>r.abort());await p.route('**/analisi.transparenciacatalunya.cat/**',r=>r.abort());
  await p.goto(base(opts.d));
  await p.evaluate((st)=>{localStorage.clear();localStorage.setItem('ft.intro','1');sessionStorage.setItem('ft.sp','1');if(st){localStorage.setItem('ft.v2',JSON.stringify(st));localStorage.setItem('ft.accx',String(Date.now()));}},opts.state||null);
  await p.goto(base(opts.d));await p.waitForTimeout(400);
  const cnt={taps:0,fields:0,decisions:0,screens:0};
  const tap=async(sel)=>{cnt.taps++;await p.click(sel);};
  const type=async(sel,v)=>{cnt.fields++;await p.fill(sel,v);};
  const shot=async(n,full=true)=>{await p.waitForTimeout(350);await p.screenshot({path:'/tmp/nvtest/a2/w/'+n+'.png',fullPage:full});};
  const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('ft.v2')));
  const txt=()=>p.evaluate(()=>document.querySelector('#app').innerText);
  return {b,p,errs,cnt,tap,type,shot,st,txt,goto:async(d)=>{await p.goto(base(d));await p.waitForTimeout(400);}};
}
module.exports={open,base};
