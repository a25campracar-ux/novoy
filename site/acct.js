/* Cuentas NoVoy: todo el cifrado pasa aquí, en el móvil. Al servidor solo viaja
   un identificador y un blob cifrado; la contraseña nunca sale del dispositivo. */
(function (root) {
  'use strict';
  const te = new TextEncoder();
  const hex = (u) => Array.from(u).map((b) => b.toString(16).padStart(2, '0')).join('');
  const b64u = (u) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (x) => Uint8Array.from(atob(x), (c) => c.charCodeAt(0));

  /** usuario+contraseña -> {id, auth, key}. id localiza el cajón, auth demuestra que es tuyo, key cifra. */
  async function derive(user, pass) {
    const u = String(user).trim().toLowerCase();
    // id: solo del usuario (así "contraseña mal" y "usuario no existe" se distinguen)
    const idb = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode('novoy/id/1|' + u)));
    const km = await crypto.subtle.importKey('raw', te.encode(u + '\n' + pass), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode('novoy/acct/1|' + u), iterations: 250000 }, km, 512));
    const key = await crypto.subtle.importKey('raw', bits.slice(32, 64), 'AES-GCM', true, ['encrypt', 'decrypt']);
    return { id: hex(idb.slice(0, 16)), auth: hex(bits.slice(0, 16)), key };
  }
  async function seal(key, txt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(txt)));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
    return b64u(out);
  }
  async function open(key, b) {
    const u = unb64(b);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12)));
  }
  const expKey = async (key) => b64u(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
  const impKey = (b) => crypto.subtle.importKey('raw', unb64(b), 'AES-GCM', true, ['encrypt', 'decrypt']);

  /** Llama a la función del servidor. Devuelve el JSON; lanza Error('red') si no hay conexión. */
  async function api(body) {
    let r;
    try { r = await fetch('/api/acct', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('red'); }
    const ct = r.headers.get('content-type') || '';
    if (ct.indexOf('json') < 0) throw new Error('sin-servidor'); // página estática sin funciones
    return r.json();
  }

  const FRUTAS = ['Platano', 'Melon', 'Kiwi', 'Sandia', 'Fresa', 'Mango', 'Pera', 'Manzana', 'Uva', 'Cereza', 'Limon', 'Naranja', 'Coco', 'Papaya', 'Mora', 'Higo', 'Datil', 'Caqui', 'Ciruela', 'Granada'];
  function genUser() {
    const a = Math.floor(Math.random() * FRUTAS.length);
    let b = Math.floor(Math.random() * (FRUTAS.length - 1)); if (b >= a) b++;
    return FRUTAS[a] + FRUTAS[b] + (10 + Math.floor(Math.random() * 90));
  }
  /** Los 3 requisitos de la contraseña, para pintarlos en vivo. */
  const passChecks = (p) => [
    ['Más de 8 caracteres', p.length > 8],
    ['Una mayúscula', /[A-ZÁÉÍÓÚÜÑ]/.test(p)],
    ['Un número', /\d/.test(p)]
  ];
  const userOk = (u) => /^[A-Za-z0-9]{3,24}$/.test(u);

  root.FTAcct = { derive, seal, open, expKey, impKey, api, genUser, passChecks, userOk };
})(window);
