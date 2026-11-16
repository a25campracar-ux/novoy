/* NoVoy v2 · Cuenta (1.8): crear y entrar. Lo usan Ajustes y el alta («Ya tengo cuenta»).
   El cifrado está en acct.js: la contraseña nunca sale del móvil y el servidor solo ve un blob cifrado. */
(function (root) {
  'use strict';
  const A = () => root.FTAcct, AJ = () => root.NVAjustes;
  const fallo = (e) => (e && e.message === 'red' ? 'Sin conexión. Inténtalo con internet.' : e && e.message === 'sin-servidor' ? 'Este despliegue no tiene el servidor de cuentas.' : 'Algo ha fallado. Prueba otra vez.');

  /** Comprueba usuario y contraseñas. Devuelve un texto de error o ''. */
  function revisar(usuario, pass, pass2) {
    if (!A().userOk(usuario)) return 'El usuario: solo letras y números, de 3 a 24.';
    if (A().passChecks(A().cleanPass(pass)).some((c) => !c[1])) return 'La contraseña no cumple los 3 requisitos.';
    if (pass2 != null && A().cleanPass(pass) !== A().cleanPass(pass2)) return 'Las dos contraseñas no son iguales.';
    return '';
  }
  /** Crea la cuenta con el estado de este móvil. → { acct } o { error } */
  async function crear(usuario, pass, estado) {
    const e = revisar(usuario, pass, null); if (e) return { error: e };
    try {
      const k = await A().derive(usuario, A().cleanPass(pass)), kb = await A().expKey(k.key);
      const r = await A().api({ op: 'new', id: k.id, auth: k.auth, u: usuario, data: await A().seal(k.key, AJ().paraCuenta(estado)) });
      if (r.ok) return { acct: { u: usuario, id: k.id, auth: k.auth, k: kb, t: Date.now() } };
      return { error: r.error === 'existe' ? 'Ese usuario ya existe. Toca «Otro» para elegir otro.' : /^(sin-kv|almacen-caido)$/.test(r.error) ? 'El servidor de cuentas no está listo.' : 'No se ha podido crear. Prueba otra vez.' };
    } catch (er) { return { error: fallo(er) }; }
  }
  /** v1 guardaba otro formato: se convierte si está cargado setup.js. */
  function deV1(txt) {
    const SU = root.FTSetup; if (!SU) return null;
    const j = SU.parseImport(txt); if (!j || !j.ok) return null;
    return { config: j.config, settings: Object.assign({}, j.reglas || {}, { limite: j.limite || 25, unificar: Object.keys(j.config.alias || {}).length > 0 }), faltas: j.hasFaltas ? j.faltas : [] };
  }
  /** Entra y abre la copia. → { estado, acct, t } o { error } */
  async function entrar(usuario, pass) {
    usuario = String(usuario || '').trim();
    if (!usuario || !pass) return { error: 'Escribe tu usuario y tu contraseña.' };
    try {
      let r = null, k = null;
      for (const v of A().passVariants(pass)) { k = await A().derive(usuario, v); r = await A().api({ op: 'get', id: k.id, auth: k.auth }); if (r.ok || r.error !== 'clave') break; }
      if (!r.ok) return { error: r.error === 'no-existe' ? 'Ese usuario no existe. Revisa las mayúsculas.' : r.error === 'clave' ? 'Contraseña incorrecta.' : r.error === 'bloqueada' ? 'Esta cuenta está bloqueada.' : 'No se ha podido entrar. Prueba otra vez.' };
      const txt = await A().open(k.key, r.data), estado = AJ().deCuenta(txt) || deV1(txt);
      const acct = { u: usuario, id: k.id, auth: k.auth, k: await A().expKey(k.key), t: r.t || Date.now() };
      if (!estado) return { error: 'La copia de la cuenta no se puede leer.', acct };
      return { estado, acct, t: r.t || null };
    } catch (er) { return { error: fallo(er) }; }
  }
  root.NVCuenta = { revisar, crear, entrar };
})(this);
