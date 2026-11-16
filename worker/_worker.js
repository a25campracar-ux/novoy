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

  // catálogo compartido: lo que alguien mete con "Otro" (centro, ciclo, módulo). Se publica cuando lo confirman 2 alumnos distintos.
  // Solo nombres de centros/ciclos/módulos: nunca horarios ni faltas. cid es un número al azar del móvil, no identifica a nadie.
  if (b.op === 'cat-add' || b.op === 'cat-get') {
    const KIND = ['centro', 'ciclo', 'modulo'], kind = String(b.kind || '');
    if (KIND.indexOf(kind) < 0) return J(400, { error: 'bad' });
    const nrm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
    const scope = nrm(b.scope || '').slice(0, 60); // p. ej. el centro de un ciclo, o el ciclo de un módulo
    if (b.op === 'cat-add') {
      const v = String(b.value || '').trim().slice(0, 80), n = nrm(v), cid = String(b.cid || '').slice(0, 24);
      if (n.length < 2 || !/^[a-z0-9]{8,24}$/.test(cid)) return J(400, { error: 'bad' });
      const k = 'cat:' + kind + ':' + scope + ':' + n, cur = (await kv.get(k, { type: 'json' })) || { v, ids: [] };
      if (cur.ids.indexOf(cid) < 0 && cur.ids.length < 20) { cur.ids.push(cid); await kv.put(k, JSON.stringify(cur), { metadata: { v: cur.v, n: cur.ids.length } }); }
      try { await bump(kv, 'otro-' + kind); } catch (e) {}
      return J(200, { ok: 1, confirmed: cur.ids.length >= 2 });
    }
    const q = nrm(b.q || ''), out = []; let cursor;
    do {
      const r = await kv.list({ prefix: 'cat:' + kind + ':' + scope + ':' + q, limit: 100, cursor });
      r.keys.forEach((x) => { if (x.metadata && x.metadata.n >= 2) out.push(x.metadata.v); });
      cursor = r.list_complete || out.length >= 20 ? null : r.cursor;
    } while (cursor);
    return J(200, { ok: 1, items: out.slice(0, 20) }, { 'cache-control': 'public, max-age=300' });
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

/* ---------- Plantillas compartidas (v2) ----------
   Lo que configura el primero de una clase para que los demás solo confirmen:
   - grupo (centro + ciclo + turno): el horario semanal.
   - centro: fechas del curso, trimestres, días de libre disposición y reglas de faltas.
   NUNCA faltas ni nada del alumno. `dev` es un número al azar del móvil (se guarda resumido)
   y sirve solo para que un mismo móvil no confirme dos veces.
   Cada clave guarda hasta 4 versiones distintas; se sirve la más confirmada. */
const TPL_MAX_VERSIONES = 4, TPL_MAX_BYTES = 12000, TPL_ESCRITURAS_IP_DIA = 40;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/, YMD = /^\d{4}-\d{2}-\d{2}$/;
const KEYTXT = /^[a-z0-9@|. -]{3,160}$/;
const limpio = (t, max) => typeof t === 'string' && t.trim().length > 0 && t.length <= max && !/[<>{}]|https?:|www\./i.test(t);
async function sha(t) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** JSON con las claves ordenadas: dos plantillas iguales dan la misma huella. */
const canon = (v) => (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v));

function validaGrupo(d) {
  if (!d || typeof d.schedule !== 'object') return null;
  const out = {}; let total = 0;
  for (const k of Object.keys(d.schedule)) {
    if (!/^[1-5]$/.test(k) || !Array.isArray(d.schedule[k])) return null;
    const l = d.schedule[k];
    if (l.length > 14) return null;
    out[k] = [];
    for (const b of l) {
      if (!b || !HHMM.test(b.start) || !HHMM.test(b.end) || b.start >= b.end || !limpio(b.subject, 40)) return null;
      const h = +b.hours; if (!(h >= 1 && h <= 8 && Number.isInteger(h))) return null;
      out[k].push({ start: b.start, end: b.end, subject: b.subject.trim(), hours: h }); total++;
    }
  }
  return total ? { schedule: out } : null;
}
function validaCentro(d) {
  if (!d || typeof d !== 'object') return null;
  const out = {};
  if (d.inicio != null) { if (!YMD.test(d.inicio)) return null; out.inicio = d.inicio; }
  if (d.fin != null) { if (!YMD.test(d.fin)) return null; out.fin = d.fin; }
  if (d.libres != null) { if (!Array.isArray(d.libres) || d.libres.length > 6 || !d.libres.every((x) => YMD.test(x))) return null; out.libres = d.libres.slice().sort(); }
  if (d.terms != null) {
    if (!Array.isArray(d.terms) || d.terms.length < 1 || d.terms.length > 4) return null;
    out.terms = [];
    for (const t of d.terms) { if (!t || !/^[0-9a-z]{1,4}$/.test(t.id) || !limpio(t.label, 30) || !YMD.test(t.from) || !YMD.test(t.to) || t.from > t.to) return null; out.terms.push({ id: t.id, label: t.label, from: t.from, to: t.to }); }
  }
  if (d.reglas != null) {
    const r = d.reglas, T = ['todas', 'sin', 'dos', 'mitad'], A = ['trimestre', 'curso', 'ra'], RT = ['no', '1', '2', '3'];
    if (!r || T.indexOf(r.tipo) < 0 || A.indexOf(r.ambito) < 0 || RT.indexOf(String(r.retrasos)) < 0) return null; // «No lo sé» no se comparte
    const pc = (x) => { const v = +x; return v > 0 && v <= 100 ? Math.round(v * 10) / 10 : null; };
    const o = { tipo: r.tipo, ambito: r.ambito, retrasos: String(r.retrasos) };
    if (r.tipo === 'dos') { o.pctSin = pc(r.pctSin); o.pctJust = pc(r.pctJust); o.segundo = r.segundo === 'todas' ? 'todas' : 'aparte'; if (!o.pctSin || !o.pctJust) return null; }
    else { o.pct = pc(r.pct); if (r.tipo !== 'mitad') o.cuenta = r.cuenta === 'sin' ? 'sin' : 'todas'; if (!o.pct) return null; }
    out.reglas = o;
  }
  return Object.keys(out).length ? out : null;
}
const publica = (v) => ({ h: v.h, conf: v.conf, t: v.t, data: v.data });

async function plantillas(req, env, url) {
  const kv = env.CUENTAS;
  if (!kv) return J(500, { error: 'sin-kv' });
  try {
    if (req.method === 'GET') {
      const out = {};
      for (const tipo of ['grupo', 'centro']) {
        const k = url.searchParams.get(tipo === 'grupo' ? 'g' : 'c');
        if (!k) continue;
        if (!KEYTXT.test(k)) return J(400, { error: 'clave' });
        const doc = await kv.get('tpl:' + tipo + ':' + (await sha(k)), { type: 'json' });
        const vs = doc ? doc.versiones.slice().sort((a, b) => b.conf - a.conf || b.t - a.t).map(publica) : [];
        out[tipo] = tipo === 'grupo' ? vs.slice(0, 3) : vs[0] || null;
      }
      return J(200, out, { 'cache-control': 'no-store' });
    }
    if (req.method !== 'POST') return J(405, { error: 'method' });
    let b; try { b = await req.json(); } catch (e) { return J(400, { error: 'json' }); }
    const tipo = b.tipo === 'grupo' || b.tipo === 'centro' ? b.tipo : null;
    if (!tipo || !KEYTXT.test(String(b.k || '')) || !HEX.test(String(b.dev || ''))) return J(400, { error: 'bad' });
    if (JSON.stringify(b.data || null).length > TPL_MAX_BYTES) return J(413, { error: 'grande' });
    const data = tipo === 'grupo' ? validaGrupo(b.data) : validaCentro(b.data);
    if (!data) return J(400, { error: 'datos' });
    // límite de escrituras por IP y día (la capa gratuita de KV da 1.000 escrituras al día)
    const ip = req.headers.get('cf-connecting-ip') || 'local', rk = 'rl:' + (await sha(ip)) + ':' + today();
    const n = +((await kv.get(rk)) || 0);
    if (n >= TPL_ESCRITURAS_IP_DIA) return J(429, { error: 'demasiadas' });
    const key = 'tpl:' + tipo + ':' + (await sha(b.k)), h = await sha(canon(data)), dev = await sha('dev|' + b.dev);
    const doc = (await kv.get(key, { type: 'json' })) || { versiones: [] };
    let v = doc.versiones.find((x) => x.h === h);
    if (v) { if (v.dev.indexOf(dev) < 0) { v.conf++; v.dev = v.dev.concat(dev).slice(-60); v.t = Date.now(); } }
    else {
      v = { h, data, conf: 1, dev: [dev], t: Date.now() };
      doc.versiones.push(v);
      if (doc.versiones.length > TPL_MAX_VERSIONES) { doc.versiones.sort((a, c) => c.conf - a.conf || c.t - a.t); doc.versiones = doc.versiones.slice(0, TPL_MAX_VERSIONES); if (doc.versiones.indexOf(v) < 0) doc.versiones[TPL_MAX_VERSIONES - 1] = v; }
    }
    await kv.put(key, JSON.stringify(doc));
    await kv.put(rk, String(n + 1), { expirationTtl: 60 * 60 * 26 });
    return J(200, { ok: 1, h, conf: v.conf });
  } catch (e) { return J(502, { error: 'almacen-caido' }); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/acct' || url.pathname === '/api/notice') return api(req, env, url);
    if (url.pathname === '/api/plantilla') return plantillas(req, env, url);
    return env.ASSETS.fetch(req);
  }
};
