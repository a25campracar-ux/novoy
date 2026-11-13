/* NoVoy en Cloudflare Pages: sirve la web y atiende /api.
   Las faltas van cifradas con la contraseña del alumno: el servidor NUNCA puede abrirlas,
   tampoco desde el panel de admin. Lo único en claro es el nombre de usuario y cuándo
   sincronizó, que es lo que necesita el panel para listar cuentas.
   Necesita un KV enlazado con el nombre CUENTAS (Settings › Bindings › KV namespace).
   Opcional: la variable ADMIN_USER si el admin no se llama "c33". */
const J = (s, o, h) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json' }, h || {}) });
const HEX = /^[0-9a-f]{32}$/;
const USER = /^[A-Za-z0-9]{3,24}$/;
const KEY = (id) => 'c:' + id;
const today = () => new Date().toISOString().slice(0, 10);
/* El id de una cuenta se deriva SOLO del nombre, así que se puede comprobar que el nombre
   que dice el cliente es de verdad el suyo. Sin esto, cualquiera podría declararse "c33". */
async function idOf(u) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('novoy/id/1|' + String(u).trim().toLowerCase()));
  return Array.from(new Uint8Array(h)).slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Los datos que el panel puede ver de una cuenta. Nunca incluyen las faltas. */
const card = (id, m) => ({ id, u: (m && m.u) || '', t: (m && m.t) || 0, c: (m && m.c) || 0, n: (m && m.n) || 0, blocked: !!(m && m.b), note: (m && m.note) || '', adm: !!(m && m.adm) });
const mainName = (env) => String(env.ADMIN_USER || 'c33').toLowerCase();

async function readAll(kv) {
  const out = []; let cursor;
  do {
    const r = await kv.list({ prefix: 'c:', limit: 1000, cursor });
    r.keys.forEach((k) => out.push(card(k.name.slice(2), k.metadata)));
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  return out;
}

/** Suma 1 a un contador del día. Un par de escrituras al día, no por usuario. */
async function bump(kv, what) {
  const k = 'stat:' + today();
  const cur = (await kv.get(k, { type: 'json' })) || {};
  cur[what] = (cur[what] || 0) + 1;
  await kv.put(k, JSON.stringify(cur), { expirationTtl: 60 * 60 * 24 * 400 });
}

async function stats(kv) {
  const all = await readAll(kv), now = Date.now(), d = 86400000;
  const days = []; let cursor;
  do {
    const r = await kv.list({ prefix: 'stat:', limit: 1000, cursor });
    for (const k of r.keys) days.push({ day: k.name.slice(5), v: (await kv.get(k.name, { type: 'json' })) || {} });
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  days.sort((a, b) => (a.day < b.day ? 1 : -1));
  return {
    cuentas: all.length,
    bloqueadas: all.filter((x) => x.blocked).length,
    activas7: all.filter((x) => now - x.t < 7 * d).length,
    activas24: all.filter((x) => now - x.t < d).length,
    altas7: all.filter((x) => x.c && now - x.c < 7 * d).length,
    lectura: days.slice(0, 30),
    bytes: all.reduce((a, x) => a + x.n, 0)
  };
}

/** Comprueba la contraseña como en un inicio de sesión normal y que la cuenta sea admin.
 *  Admin principal: la del nombre ADMIN_USER (c33). Otras: las que el principal marca como admin
 *  desde el panel (metadata.adm). El rol va en la cuenta, no en el nombre: registrarse como
 *  "admin" no da nada. Devuelve { who, main } o null. */
async function asAdmin(kv, env, b) {
  if (!HEX.test(b.id || '') || !HEX.test(b.auth || '')) return null;
  const { value, metadata } = await kv.getWithMetadata(KEY(b.id), { type: 'json' });
  if (!value || value.a !== b.auth || (metadata && metadata.b)) return null;
  const who = (metadata && metadata.u) || value.u || '', main = !!who && who.toLowerCase() === mainName(env);
  return main || (metadata && metadata.adm) ? { who, main } : null;
}

async function api(req, env, url) {
  const kv = env.CUENTAS;

  // aviso global: lectura pública y cacheada en el borde
  if (url.pathname === '/api/notice') {
    if (!kv) return J(200, { text: '' });
    const n = (await kv.get('sys:notice', { type: 'json' })) || {};
    const live = n.text && (!n.until || n.until >= today()) ? n : {};
    return J(200, { text: live.text || '', until: live.until || '', ts: live.ts || 0 }, { 'cache-control': 'public, max-age=45' });
  }

  if (req.method !== 'POST') return J(405, { error: 'method' });
  let b; try { b = await req.json(); } catch (e) { return J(400, { error: 'json' }); }
  if (b.op === 'ping') return J(200, { ok: 1, kv: !!kv });
  if (!kv) return J(500, { error: 'sin-kv' });

  // contador anónimo de cómo le fue al lector de capturas: sin id, sin nada del alumno
  if (b.op === 'stat') {
    if (['ocr-ok', 'ocr-editado', 'ocr-fallo', 'manual'].indexOf(b.what) < 0) return J(400, { error: 'bad' });
    try { await bump(kv, b.what); } catch (e) {}
    return J(200, { ok: 1 });
  }

  if (b.op === 'admin') {
    const me = await asAdmin(kv, env, b);
    if (!me) return J(403, { error: 'no-admin' });
    if (b.what === 'list') return J(200, { ok: 1, users: (await readAll(kv)).sort((x, y) => y.t - x.t) });
    if (b.what === 'stats') return J(200, { ok: 1, stats: await stats(kv) });
    if (b.what === 'export') {
      const out = []; let cursor;
      do {
        const r = await kv.list({ prefix: 'c:', limit: 1000, cursor });
        for (const k of r.keys) out.push({ id: k.name.slice(2), meta: k.metadata || {}, rec: await kv.get(k.name, { type: 'json' }) });
        cursor = r.list_complete ? null : r.cursor;
      } while (cursor);
      return J(200, { ok: 1, exportado: new Date().toISOString(), cuentas: out });
    }
    if (b.what === 'notice') {
      const text = String(b.text || '').slice(0, 300), until = /^\d{4}-\d\d-\d\d$/.test(b.until || '') ? b.until : '';
      await kv.put('sys:notice', JSON.stringify({ text, until, ts: Date.now() }));
      return J(200, { ok: 1 });
    }
    if (!HEX.test(b.target || '')) return J(400, { error: 'bad-target' });
    if (b.target === b.id && (b.what === 'del' || b.what === 'block' || b.what === 'role')) return J(400, { error: 'eres-tu' });
    const { value, metadata } = await kv.getWithMetadata(KEY(b.target), { type: 'json' });
    if (!value) return J(404, { error: 'no-existe' });
    const tAdmin = !!(metadata && (metadata.adm || String(metadata.u || '').toLowerCase() === mainName(env)));
    // solo el admin principal da o quita el rol, y toca a otros admins; al principal no lo toca nadie
    if (String((metadata && metadata.u) || '').toLowerCase() === mainName(env) && b.what !== 'note') return J(403, { error: 'principal' });
    if ((b.what === 'role' || (tAdmin && (b.what === 'del' || b.what === 'block'))) && !me.main) return J(403, { error: 'solo-principal' });
    if (b.what === 'role') { const m = Object.assign({}, metadata, { adm: !(metadata && metadata.adm) }); await kv.put(KEY(b.target), JSON.stringify(value), { metadata: m }); return J(200, { ok: 1, user: card(b.target, m) }); }
    if (b.what === 'del') { await kv.delete(KEY(b.target)); return J(200, { ok: 1 }); }
    if (b.what === 'block' || b.what === 'note') {
      const m = Object.assign({}, metadata);
      if (b.what === 'block') m.b = !m.b; else m.note = String(b.note || '').slice(0, 120);
      await kv.put(KEY(b.target), JSON.stringify(value), { metadata: m });
      return J(200, { ok: 1, user: card(b.target, m) });
    }
    return J(400, { error: 'op' });
  }

  // --- cuentas de alumno
  if (!HEX.test(b.id || '') || !HEX.test(b.auth || '')) return J(400, { error: 'bad' });
  const okData = typeof b.data === 'string' && b.data.length > 0 && b.data.length <= 300000;
  try {
    const got = await kv.getWithMetadata(KEY(b.id), { type: 'json' });
    const cur = got.value, meta = got.metadata || {};
    if (b.op === 'new') {
      if (cur) return J(409, { error: 'existe' });
      if (!okData) return J(400, { error: 'bad-data' });
      if (!USER.test(b.u || '')) return J(400, { error: 'bad-user' });
      if ((await idOf(b.u)) !== b.id) return J(400, { error: 'nombre-no-cuadra' });
      const now = Date.now();
      await kv.put(KEY(b.id), JSON.stringify({ a: b.auth, d: b.data, t: now }), { metadata: { u: b.u, t: now, c: now, n: b.data.length } });
      return J(200, { ok: 1 });
    }
    if (!cur) return J(404, { error: 'no-existe' });
    if (cur.a !== b.auth) return J(403, { error: 'clave' });
    if (meta.b) return J(423, { error: 'bloqueada' });
    if (b.op === 'get') return J(200, { ok: 1, data: cur.d, t: cur.t, adm: !!(meta.adm || String(meta.u || '').toLowerCase() === mainName(env)) });
    if (b.op === 'rekey') { // nueva contraseña: nueva prueba y datos recifrados con la clave nueva
      if (!HEX.test(b.newAuth || '') || !okData) return J(400, { error: 'bad' });
      const t = Date.now();
      await kv.put(KEY(b.id), JSON.stringify({ a: b.newAuth, d: b.data, t }), { metadata: Object.assign({}, meta, { t, n: b.data.length }) });
      return J(200, { ok: 1, t });
    }
    if (b.op === 'put') {
      if (!okData) return J(400, { error: 'bad-data' });
      const t = Date.now();
      const m = Object.assign({}, meta, { t, n: b.data.length });
      if (!m.u && USER.test(b.u || '') && (await idOf(b.u)) === b.id) m.u = b.u; // cuentas creadas antes de guardar el nombre
      if (!m.c) m.c = cur.t || t;
      await kv.put(KEY(b.id), JSON.stringify({ a: cur.a, d: b.data, t }), { metadata: m });
      return J(200, { ok: 1, t });
    }
    return J(400, { error: 'op' });
  } catch (e) { return J(502, { error: 'almacen-caido' }); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/acct' || url.pathname === '/api/notice') return api(req, env, url);
    return env.ASSETS.fetch(req);
  }
};
