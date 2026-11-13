/* NoVoy: cuentas con usuario y contraseña. El servidor solo guarda un blob cifrado:
   nunca ve la contraseña ni puede leer los datos. Sin dependencias (deploy por arrastre). */
const J = (s, o) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

function blobs() {
  const raw = process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  let c; try { c = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch (e) { return null; }
  const edge = c.uncachedEdgeURL || c.edgeURL;
  if (!edge || !c.token || !c.siteID) return null;
  const url = (k) => edge + '/' + c.siteID + '/cuentas/' + k;
  const H = { authorization: 'Bearer ' + c.token };
  return {
    get: async (k) => { const r = await fetch(url(k), { headers: H }); if (r.status === 404) return null; if (!r.ok) throw new Error('get ' + r.status); return r.json(); },
    put: async (k, v) => { const r = await fetch(url(k), { method: 'PUT', headers: H, body: JSON.stringify(v) }); if (!r.ok) throw new Error('put ' + r.status); }
  };
}

export default async (req) => {
  if (req.method !== 'POST') return J(405, { error: 'method' });
  let b; try { b = await req.json(); } catch (e) { return J(400, { error: 'json' }); }
  if (b.op === 'ping') return J(200, { ok: 1, blobs: !!blobs() });
  const hex = /^[0-9a-f]{32}$/;
  if (!hex.test(b.id || '') || !hex.test(b.auth || '')) return J(400, { error: 'bad' });
  const st = blobs();
  if (!st) return J(500, { error: 'sin-blobs' });
  const okData = typeof b.data === 'string' && b.data.length > 0 && b.data.length <= 300000;
  try {
    const cur = await st.get(b.id);
    if (b.op === 'new') {
      if (cur) return J(409, { error: 'existe' });
      if (!okData) return J(400, { error: 'bad-data' });
      await st.put(b.id, { a: b.auth, d: b.data, t: Date.now() });
      return J(200, { ok: 1 });
    }
    if (!cur) return J(404, { error: 'no-existe' });
    if (cur.a !== b.auth) return J(403, { error: 'clave' });
    if (b.op === 'get') return J(200, { ok: 1, data: cur.d, t: cur.t });
    if (b.op === 'put') {
      if (!okData) return J(400, { error: 'bad-data' });
      const t = Date.now();
      await st.put(b.id, { a: cur.a, d: b.data, t });
      return J(200, { ok: 1, t });
    }
    return J(400, { error: 'op' });
  } catch (e) { return J(502, { error: 'blobs-caido' }); }
};
export const config = { path: '/api/acct' };
