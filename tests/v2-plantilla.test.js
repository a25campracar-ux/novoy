// v2 · /api/plantilla del worker, con un KV en memoria.
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nv-')), 'worker.mjs');
  fs.copyFileSync(path.join(__dirname, '../worker/_worker.js'), tmp);
  const W = (await import(pathToFileURL(tmp).href)).default;
  const kv = new Map();
  const CUENTAS = { get: async (k, o) => { const v = kv.get(k); return v == null ? null : o && o.type === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { kv.set(k, v); } };
  const env = { CUENTAS, ASSETS: { fetch: async () => new Response('asset') } };
  const call = async (method, q, body, ip) => {
    const r = await W.fetch(new Request('http://x/api/plantilla' + (q || ''), { method, headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip || '1.1.1.1' }, body: body ? JSON.stringify(body) : undefined }), env);
    return { status: r.status, j: await r.json() };
  };
  const dev = (n) => String(n).padStart(32, 'a');
  const G = 'pedralbes|icc0|tarde';
  const sched = { schedule: { 1: [{ start: '15:00', end: '17:00', subject: 'Programació', hours: 2 }] } };

  // vacío
  let r = await call('GET', '?g=' + encodeURIComponent(G) + '&c=pedralbes');
  assert.deepStrictEqual(r.j, { grupo: [], centro: null });
  // publica el primero
  r = await call('POST', '', { tipo: 'grupo', k: G, dev: dev(1), data: sched });
  assert.strictEqual(r.status, 200); assert.strictEqual(r.j.conf, 1);
  // el mismo móvil no suma dos veces; otro sí
  r = await call('POST', '', { tipo: 'grupo', k: G, dev: dev(1), data: sched }); assert.strictEqual(r.j.conf, 1);
  r = await call('POST', '', { tipo: 'grupo', k: G, dev: dev(2), data: JSON.parse(JSON.stringify(sched)) }); assert.strictEqual(r.j.conf, 2);
  // una versión distinta no pisa la otra; se sirve la más confirmada
  const otro = { schedule: { 1: [{ start: '15:00', end: '16:00', subject: 'FOL', hours: 1 }] } };
  r = await call('POST', '', { tipo: 'grupo', k: G, dev: dev(3), data: otro }); assert.strictEqual(r.j.conf, 1);
  r = await call('GET', '?g=' + encodeURIComponent(G));
  assert.deepStrictEqual(r.j.grupo.map((v) => v.conf), [2, 1]);
  assert.strictEqual(r.j.grupo[0].data.schedule[1][0].subject, 'Programació');
  assert.ok(!('dev' in r.j.grupo[0]), 'no se enseñan los móviles');

  // validación: nada de faltas, enlaces ni HTML
  for (const bad of [
    { schedule: { 1: [{ start: '15:00', end: '17:00', subject: '<script>', hours: 2 }] } },
    { schedule: { 1: [{ start: '15:00', end: '17:00', subject: 'https://spam', hours: 2 }] } },
    { schedule: { 6: [{ start: '15:00', end: '17:00', subject: 'X', hours: 2 }] } },
    { schedule: { 1: [{ start: '17:00', end: '15:00', subject: 'X', hours: 2 }] } },
    { schedule: {} }
  ]) { r = await call('POST', '', { tipo: 'grupo', k: G, dev: dev(4), data: bad }); assert.strictEqual(r.status, 400, JSON.stringify(bad)); }
  r = await call('POST', '', { tipo: 'grupo', k: 'MAL<', dev: dev(4), data: sched }); assert.strictEqual(r.status, 400);
  r = await call('POST', '', { tipo: 'grupo', k: G, dev: 'corto', data: sched }); assert.strictEqual(r.status, 400);

  // centro: reglas y fechas; «No lo sé» no se comparte; lo que sobra se descarta
  r = await call('POST', '', { tipo: 'centro', k: 'pedralbes', dev: dev(1), data: { libres: ['2026-11-02', '2026-12-07'], reglas: { tipo: 'todas', pct: 25, cuenta: 'todas', ambito: 'trimestre', retrasos: 'no' }, faltas: [1, 2] } });
  assert.strictEqual(r.status, 200);
  r = await call('GET', '?c=pedralbes');
  assert.deepStrictEqual(Object.keys(r.j.centro.data).sort(), ['libres', 'reglas'], 'sin faltas');
  r = await call('POST', '', { tipo: 'centro', k: 'pedralbes', dev: dev(1), data: { reglas: { tipo: 'nose', ambito: 'trimestre', retrasos: 'no' } } });
  assert.strictEqual(r.status, 400);

  // límite de escrituras por IP
  let last;
  for (let i = 0; i < 45; i++) last = await call('POST', '', { tipo: 'grupo', k: 'x|y|' + i, dev: dev(9), data: sched }, '9.9.9.9');
  assert.strictEqual(last.status, 429);
  console.log('v2 plantilla OK');
})().catch((e) => { console.error(e); process.exit(1); });
