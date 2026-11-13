/* Servidor de pruebas: sirve la web y emula el worker de Cloudflare con un KV en memoria.
   Uso: node harness/serve.js <puerto> <share|preview> */
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=+process.argv[2]||8800, DIR='/home/claude/puedo-faltar/build/'+(process.argv[3]||'share');
const kv=new Map();
const CUENTAS={
  get:async(k,o)=>{const e=kv.get(k);return e==null?null:(o&&o.type==='json'?JSON.parse(e.v):e.v)},
  getWithMetadata:async(k,o)=>{const e=kv.get(k);return e==null?{value:null,metadata:null}:{value:o&&o.type==='json'?JSON.parse(e.v):e.v,metadata:e.m||null}},
  put:async(k,v,o)=>{kv.set(k,{v,m:(o&&o.metadata)||null})},
  delete:async(k)=>{kv.delete(k)},
  list:async({prefix})=>({keys:[...kv.keys()].filter(k=>k.startsWith(prefix)).map(n=>({name:n,metadata:kv.get(n).m})),list_complete:true})};
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json','.ico':'image/x-icon'};
(async()=>{
const W=(await import('/home/claude/puedo-faltar/build/cf/_worker.js')).default;
const ASSETS={fetch:async(req)=>{const u=new URL(req.url);let p=u.pathname==='/'?'/index.html':u.pathname;
  const f=path.join(DIR,p); if(!fs.existsSync(f)||!fs.statSync(f).isFile())return new Response('404',{status:404});
  return new Response(fs.readFileSync(f),{headers:{'content-type':T[path.extname(f)]||'application/octet-stream'}})}};
const env={CUENTAS,ASSETS};
http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);
  const body=chunks.length?Buffer.concat(chunks):undefined;
  const r=await W.fetch(new Request('http://localhost:'+PORT+req.url,{method:req.method,headers:req.headers,body}),env);
  const buf=Buffer.from(await r.arrayBuffer());
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(buf);
}).listen(PORT,()=>console.log('listo http://localhost:'+PORT+'  ('+path.basename(DIR)+')'));
})();
