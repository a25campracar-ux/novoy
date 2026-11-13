# NoVoy

Tu semáforo de faltas. Dice si puedes faltar hoy sin pasarte del límite de asistencia.

**En producción:** [novoy.netlify.app](https://novoy.netlify.app)

La mayoría de centros aplican un límite de faltas (normalmente el 25%) por encima del
cual pierdes la evaluación continua. Moodle y las apps de los centros te dicen cuántas
faltas llevas, pero no lo que de verdad quieres saber a las siete y media de la mañana:
**cuántas horas te quedan de margen**. Eso hace NoVoy.

## Qué hace

- **Semáforo diario.** Verde, amarillo o rojo según el margen que te quede hoy, asignatura por asignatura.
- **Configuración con una foto.** Subes la foto de tu horario y lo lee con OCR en el propio móvil.
- **Faltas de antes con contadores.** Al terminar el alta pones cuántas horas llevas en cada asignatura.
- **Pregunta de un toque.** Si el último día de clase no apuntaste nada, te pregunta si fuiste a todo.
- **La tutoría no cuenta.** Se marca sola como fuera del cálculo; se puede cambiar.
- **Rejilla para pintarlo.** Si prefieres, tocas las casillas de tu semana y les pones nombre.
- **Cuentas sin correo.** Usuario y contraseña; los datos viajan cifrados y el servidor no puede leerlos.
- **Funciona sin conexión.** Es una PWA: se instala en la pantalla de inicio y abre sin internet.
- **Compartir con la clase.** Un enlace lleva tu horario (sin tus faltas) para que tus compañeros no lo configuren.
- **Reglas de tu centro.** Límite por trimestre o sobre el curso entero, y cuántos retrasos hacen una falta. Si no lo sabes, usa lo más estricto.
- **Cambios de horario sin perder nada.** Si el horario cambia a mitad de curso, eliges desde qué día vale y las faltas de antes siguen contando con el horario de entonces.

## Cómo está hecho

Sin frameworks, sin compilación y sin dependencias en tiempo de ejecución salvo el OCR.
Son archivos estáticos que un navegador abre tal cual.

| Pieza | Cómo |
|---|---|
| Interfaz | JavaScript sin framework, un render por vista |
| Datos | `localStorage`, formato de intercambio `puedo-faltar/1` |
| Offline | Service worker con caché de versión |
| OCR del horario | [Tesseract.js](https://tesseract.projectnaptha.com/) en el navegador, hasta 3 pasadas con distinto preprocesado |
| Detección de la rejilla | Análisis propio: columnas por los días, filas por las horas, bloques por color o por bordes |
| Cuentas | PBKDF2 (250k iteraciones) + AES-GCM en el cliente; el servidor solo guarda el blob cifrado |
| Servidor | Una función: Cloudflare Worker + KV, o Netlify Function + Blobs |

### Sobre el OCR

Medido contra 48 horarios generados con diseños distintos (colores, rejilla, tipo Excel,
minimalista, tema oscuro, español/catalán/inglés) más capturas reales de varios centros:

| Estilo | Casillas correctas | Nombres correctos |
|---|---|---|
| Bloques de color | 99% | 86% |
| Rejilla con bordes | 87% | 77% |
| Tipo calendario | 83% | 72% |
| Tipo Excel | 91% | 71% |
| Minimalista | 70% | 52% |
| **Total** | **86%** | **73%** |

Lo que no sale bien se corrige en la pantalla de revisión, que forma parte del flujo igualmente.

### Privacidad

No se pide correo ni ningún dato personal. Las faltas viven en el móvil.
Si creas cuenta, la contraseña **nunca sale del dispositivo**: de ella se derivan en local
un identificador, una prueba de autenticación y una clave AES. El servidor recibe un blob
cifrado que no puede abrir. El precio de esto es que **una contraseña perdida no se puede
recuperar**; por eso la app insiste en guardarla en el gestor del móvil y en conservar el
enlace de copia.

## Estructura

```
site/            la web entera (lo que se despliega)
  index.html
  core.js        cálculo de faltas, márgenes y semáforo
  setup.js       formato de intercambio, validación, prompts para IA
  shot.js        OCR y análisis de la captura del horario
  acct.js        derivación de claves y cifrado de la cuenta
  app.js         vistas y eventos
  sw.js          service worker
worker/          _worker.js para Cloudflare Pages
netlify/         función equivalente para Netlify
scripts/build.sh genera los zips de despliegue
tests/           pruebas de core.js y setup.js
```

## Desarrollo

```sh
# abrir en local (hace falta https o localhost para la criptografía de las cuentas)
npx serve site

# pruebas
node --test tests/*.test.js

# generar los zips de despliegue
SITE_URL=https://tu-dominio ./scripts/build.sh
```

Salen dos archivos en `build/`:

- `novoy-cloudflare.zip` → Cloudflare Pages
- `novoy-web.zip` → Netlify

## Desplegar en Cloudflare Pages

1. **Workers & Pages → Create → Pages → Upload assets** y arrastra `novoy-cloudflare.zip`.
2. **Storage & Databases → KV → Create**, con el nombre que quieras.
3. En el proyecto, **Settings → Bindings → Add → KV namespace**: nombre de la variable
   `CUENTAS`, y elige el KV del paso 2.
4. Vuelve a desplegar para que el binding entre en vigor.

Sin el paso 3 la web funciona entera; solo fallan las cuentas, con un aviso.

## Desplegar en Netlify

Arrastra `novoy-web.zip` a **Deploys**. Las funciones y los Blobs se detectan solos.

## Licencia

MIT.
