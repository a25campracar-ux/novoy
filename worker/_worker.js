/* NoVoy en Cloudflare Pages: sirve la web y atiende /api/acct.
   El servidor solo guarda un blob cifrado: nunca ve la contraseña ni puede leer los datos.
   Necesita un KV enlazado con el nombre CUENTAS (Settings › Bindings › KV namespace). */
const J = (s, o) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const HEX = /^[0-9a-f]{32}$/;

async function acct(req, env) {
  if (req.method !== 'POST') return J(405, { error: 'method' });
  let b; try { b = await req.json(); } catch (e) { return J(400, { error: 'json' }); }
  const kv = env.CUENTAS;
  if (b.op === 'ping') return J(200, { ok: 1, kv: !!kv });
  if (!HEX.test(b.id || '') || !HEX.test(b.auth || '')) return J(400, { error: 'bad' });
  if (!kv) return J(500, { error: 'sin-kv' });
  const okData = typeof b.data === 'string' && b.data.length > 0 && b.data.length <= 300000;
  try {
    const cur = await kv.get('c:' + b.id, { type: 'json' });
    if (b.op === 'new') {
      if (cur) return J(409, { error: 'existe' });
      if (!okData) return J(400, { error: 'bad-data' });
      await kv.put('c:' + b.id, JSON.stringify({ a: b.auth, d: b.data, t: Date.now() }));
      return J(200, { ok: 1 });
    }
    if (!cur) return J(404, { error: 'no-existe' });
    if (cur.a !== b.auth) return J(403, { error: 'clave' });
    if (b.op === 'get') return J(200, { ok: 1, data: cur.d, t: cur.t });
    if (b.op === 'put') {
      if (!okData) return J(400, { error: 'bad-data' });
      const t = Date.now();
      await kv.put('c:' + b.id, JSON.stringify({ a: cur.a, d: b.data, t }));
      return J(200, { ok: 1, t });
    }
    return J(400, { error: 'op' });
  } catch (e) { return J(502, { error: 'almacen-caido' }); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/acct') return acct(req, env);
    return env.ASSETS.fetch(req);
  }
};
