# Banco de pruebas local

Levanta la web con el mismo servidor que en Cloudflare (worker/_worker.js), pero con un
KV en memoria, para poder probar cuentas y panel de admin sin desplegar nada.

```sh
npm run build                       # o: SITE_URL=http://localhost ./scripts/build.sh
node harness/serve.js 8800 share    # app vacía, sin configurar
node harness/serve.js 8801 preview  # app ya configurada, con datos de ejemplo
```

Cada instancia tiene su propio KV, así que se pueden levantar varias a la vez en puertos
distintos sin que se mezclen las cuentas. Al parar el proceso se pierde todo: es a propósito,
cada prueba empieza limpia.

Sirve también para probar la app en el móvil dentro de la misma wifi, apuntando al
`http://<ip-del-portatil>:8800` — ojo: las cuentas necesitan HTTPS o localhost para poder
cifrar (`crypto.subtle`), así que desde el móvil funcionará todo menos crear cuenta.
