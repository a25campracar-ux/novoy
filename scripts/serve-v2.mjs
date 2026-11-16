// Servidor local para probar la v2: sirve site/ y emula el worker de Cloudflare con un KV en memoria.
// Uso: node scripts/serve-v2.mjs [puerto]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import os from 'node:os';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.argv[2] || 8810, SITE = path.join(root, 'site');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nvw-')), 'worker.mjs'); fs.copyFileSync(path.join(root, 'worker/_worker.js'), tmp);
const W = (await import(pathToFileURL(tmp).href)).default;
const kv = new Map();
const CUENTAS = { get: async (k, o) => { const e = kv.get(k); return e == null ? null : o && o.type === 'json' ? JSON.parse(e.v) : e.v; }, getWithMetadata: async (k, o) => { const e = kv.get(k); return e == null ? { value: null, metadata: null } : { value: o && o.type === 'json' ? JSON.parse(e.v) : e.v, metadata: e.m || null }; }, put: async (k, v, o) => { kv.set(k, { v, m: (o && o.metadata) || null }); }, delete: async (k) => { kv.delete(k); }, list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((n) => ({ name: n, metadata: kv.get(n).m })), list_complete: true }) };
const T = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const ASSETS = { fetch: async (req) => { const u = new URL(req.url); let p = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname); const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return new Response('404', { status: 404 }); let body = fs.readFileSync(f); if (p.endsWith('.html')) body = Buffer.from(String(body).replace(/__SITE__/g, 'http://localhost:' + PORT)); return new Response(body, { headers: { 'content-type': T[path.extname(f)] || 'application/octet-stream' } }); } };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await W.fetch(new Request('http://localhost:' + PORT + req.url, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), { CUENTAS, ASSETS });
  const buf = Buffer.from(await r.arrayBuffer());
  if (req.url.startsWith('/api/') && process.env.NV_LOG) console.log(req.method, req.url, r.status, chunks.length ? Buffer.concat(chunks).toString().slice(0, 400) : '', '→', buf.toString().slice(0, 120));
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(buf);
}).listen(PORT, () => console.log('v2 en http://localhost:' + PORT + '/alta.html'));
