# NoVoy · Estado completo y traspaso

Nov 14, 2026 · @c33

## 1. Resumen para quien llega

NoVoy funciona y calcula bien cuando los datos entran bien, pero tiene un fallo que borra faltas, tres vías que dan margen de más y un alta que tarda de 7 a 12 minutos en vez de 2. No está lista para difundirse fuera de una clase.

**Qué es.** Una web instalable (PWA) para móvil que responde a «¿puedo faltar hoy a clase sin perder la evaluación continua?». Muestra un semáforo y las horas de margen por asignatura.

**Para quién.** Estudiantes de FP y bachillerato de 16 a 20 años, en el móvil, sin paciencia. Hoy el público real es una clase de unas 30 personas de 2º de DAW en el Institut Pedralbes (Barcelona).

**Quién la ha hecho.** Un estudiante de 2º de DAW, dirigiendo a un asistente de IA que ha escrito todo el código. No hay equipo, ni diseñador, ni presupuesto. No quiere pagar cuentas de desarrollador ni pedir correo a los usuarios.

| Dato | Valor |
| --- | --- |
| Producción | https://novoy-72h.pages.dev (Cloudflare Pages) |
| Despliegue antiguo | https://novoy.netlify.app (sin las funciones nuevas de servidor) |
| Repositorio | github.com/a25campracar-ux/novoy, público, rama `main` con despliegue automático |
| Versión anterior | rama `v1-novoy` |
| Tamaño | unas 3.200 líneas: `app.js` 1.597, `core.js` 394, `setup.js` 351, `style.css` 283, `worker` 202 |
| Tecnología | JavaScript sin framework ni compilación, `localStorage`, service worker, Cloudflare Worker + KV |
| Usuarios reales | sin medir; solo el autor la usa con datos reales |

### Qué arreglar antes que nada

1. El enlace «Pásalo a tu clase» borra las faltas de quien lo abre (sección 8, fallo 1).
2. Importar faltas con IA descarta horas repetidas del mismo día (fallo 2).
3. El semáforo cuenta dos veces lo ya apuntado hoy (fallo 4).
4. Se aceptan faltas en festivos, días sin esa clase y fuera de curso (fallo 5).
5. Los contadores de «faltas de antes» no admiten retrasos ni justificadas (fallo 3).

### Lo que no se sabe todavía

- Si la fórmula «horas semanales × 33 semanas» coincide con lo que calcula cada centro. Está contrastada con una sola hoja de planificación.
- Cómo se comporta la lectura de horarios por foto, el directorio oficial de centros y las cuentas en móviles reales: las pruebas se hicieron sin red.
- Si alguien, aparte del autor, la abre cada día.

## 2. Producto, usuario y dominio

El producto entero es una función: dada una fecha, qué clases tiene el alumno y de qué asignatura. Si esa función falla un día, fallan el porcentaje, el margen y el semáforo.

### El hueco que cubre

Moodle, Alexia o Clickedu dicen cuántas faltas llevas. Ninguna dice cuántas horas te quedan antes de pasarte. Un verde equivocado puede costar un módulo; un rojo de más solo molesta. Por eso todo error debe caer del lado estricto.

### El usuario

- Tiene entre 16 y 20 años (hay adultos en nocturno), usa el móvil y no lee.
- Momento de uso principal: en la cama, a las 7:45, decide en diez segundos.
- No conoce con precisión las reglas de su centro. Sabe «es el 25%», pero no si es por trimestre o por curso, y contesta con seguridad lo que le suena.
- Casi nunca sabe las horas totales de cada módulo.
- Si la primera pantalla pide esfuerzo, cierra y no vuelve.

### Vocabulario del dominio

| Término | Qué significa aquí |
| --- | --- |
| Falta | Una hora de clase no asistida. Se cuenta por horas, no por días |
| Justificada | Falta con justificante. Cada centro la trata distinto |
| Retraso | Llegar tarde. Muchos centros convierten 2, 3 o 4 retrasos en una hora de falta |
| Límite | Porcentaje máximo de horas que se pueden faltar por asignatura: 15, 20 o 25% según el centro |
| Pérdida de evaluación continua | Consecuencia de pasarse: examen final o suspenso |
| Módulo | Asignatura de FP. El límite se calcula por separado en cada uno |
| Ciclo | Titulación de FP de grado medio o superior, normalmente dos cursos |
| Estancia en empresa (antes FCT) | Periodo sin clases en el centro. Con el currículo nuevo se reparte entre módulos |
| Horas totales del módulo | Denominador del porcentaje. Es el dato crítico y el más difícil de conseguir |
| Semanas lectivas | En Cataluña la norma estandariza el curso en 33 |
| Tutoría | Obligatoria, pero fuera del currículum del ciclo en Cataluña |
| Horas de libre disposición | Horas que cada centro añade a los mínimos del decreto |
| Semana de proyecto | Semana en que se suspende el horario normal |

### Variantes de reglas vistas en centros reales

| Qué varía | Variantes encontradas | ¿Lo admite la app? |
| --- | --- | --- |
| Límite | 15%, 20%, 25%; «mínimo 85% de asistencia» | Sí: 15, 20, 25, 30 (o cualquier número por importación) |
| Sobre qué se calcula | Por trimestre o evaluación; curso entero; por unidad formativa o resultado de aprendizaje | Trimestre y curso sí; por unidad no |
| Justificadas | Cuentan igual; no cuentan; porcentaje propio; cuentan la mitad; dos límites a la vez (25% sin justificar y 40% en total) | Las tres primeras sí; «la mitad» y «dos límites sobre la suma» no |
| Retrasos | No cuentan; 2, 3 o 4 = 1 hora | Sí |
| Tutoría | Cuenta o no cuenta | Sí; se excluye sola por el nombre |
| Proyecto | Módulo propio; repartido entre los módulos de cada profesor | Sí, con «unificar» (poco visible) |
| Horario | Fijo; cambia a mitad de curso; semanas alternas; desdobles; semanas de proyecto | Fijo, cambios con fecha y proyecto sí; alternas y desdobles no |
| Duración de la clase | 60 min; 55 min; bloques de 2 y 3 horas | Solo una duración igual para todas, y con fallos si no es 60 |

### Por qué el horario es el problema difícil

Casi nadie tiene una semana que se repite todo el curso. Hay módulos concentrados en unas semanas, semanas alternas, estancia en empresa, semanas de exámenes, optativas, desdobles y reajustes por bajas. Cada caso afecta a una minoría, pero juntos afectan a la mayoría.

## 3. Historia y decisiones tomadas

El proyecto ha cambiado de dirección ocho veces, y cada giro dejó una lección que condiciona el diseño actual.

### Giros del proyecto

| Giro | Qué pasó | Lección |
| --- | --- | --- |
| De Notion a app propia | El primer sistema era un panel en Notion configurado conversando | La configuración que funciona es una conversación, no un formulario |
| «Configurar con mi IA» (v1) | Un mensaje generaba el JSON; se descartó por lento | Lo lento era copiar y pegar entre apps, no la IA |
| La captura de pantalla | Lector con Tesseract en el móvil: 86% de casillas y 72–73% de nombres sobre 48 horarios sintéticos y 5 reales | La foto es buen camino si hay pantalla de revisión |
| La rejilla de pintar | Tocar casillas en vez de escribir | Escribir es donde se abandona |
| Cuentas sin correo | Usuario generado y contraseña; claves derivadas en el móvil | Sin correo no hay datos personales; a cambio no hay recuperación |
| El horario cambia | Se añadieron tramos, historial, semanas de proyecto y asignaturas desactivadas | Un concepto nuevo por cada caso: siete palabras que nadie entiende |
| El denominador | La app contaba días; los centros usan una cifra nominal | Era un problema de definición, no de estimación |
| Cataluña y el 33 | Las horas oficiales son múltiplos de 33 (33, 66, 99, 198) | Acotando a una comunidad, el número puede ser el oficial |

### Decisiones del autor (vigentes)

- **Nombre:** NoVoy. Se puede escribir a mano como ambigrama; el logo no tiene por qué serlo. Antes se llamó «¿Puedo faltar?».
- **Distribución:** web instalable y gratuita. Sin tiendas de apps.
- **Cuentas:** solo usuario y contraseña, sin correo. Usuario aleatorio de frutas encadenadas («PlatanoMelon34»). Contraseña con tres requisitos: más de 8 caracteres, una mayúscula y un número.
- **Interfaz:** muy intuitiva y simple. De un vistazo se entiende qué se puede hacer. Títulos directos y poco texto, «que lo entienda hasta un niño».
- **Alta:** flujo ordenado, una pregunta por pantalla, guiado paso a paso al menos la primera vez.
- **«Otro» siempre disponible:** en centro, ciclo y módulo. Comprueba mientras se escribe si ya existe; si no, vale al momento para ese alumno y pasa al catálogo compartido con una segunda confirmación.
- **Curso:** no se pregunta; se deduce de los módulos pintados.
- **Foto del horario:** siempre ofrecida y visible.
- **Tres vías de alta:** foto, pintar o IA, con una línea que diga cuál conviene en cada caso.
- **Porcentaje:** visible como dato secundario; las horas son el dato principal.
- **Simulador:** se mantiene.
- **Tutoría:** se excluye sola del cálculo; el alumno puede revertirlo.
- **Justificadas:** tres modos (cuentan igual, no cuentan, porcentaje propio).
- **Ámbito:** por trimestre y por curso entero, las dos.
- **Faltas acumuladas:** contadores a mano o con un mensaje para la IA explicado «como a un niño».
- **Despliegue:** cada cambio se sube con push a `main`.

### Decisiones de diseño del cálculo

- Denominador: horas semanales del horario × semanas del curso. El catálogo oficial sirve para comprobar, no para calcular.
- Si el calendario da menos horas que la fórmula, se usa el calendario. Nunca se escala al alza.
- Ante un «no lo sé», se elige la opción más estricta.
- La app guarda siempre si una falta fue justificada, sea cual sea el modo, para poder recalcular.

### Ideas descartadas o aparcadas

| Idea | Estado | Motivo |
| --- | --- | --- |
| Publicar en tiendas de apps | Descartada | Cuesta dinero |
| Pedir correo | Descartada | «Es agresivo y da palo» |
| Servidor propio (VPS) | Descartada | No aporta nada que Cloudflare no dé gratis |
| Extraer los \~150 ciclos de los decretos | Aparcada | Mucho trabajo; el público actual es una clase |
| IA dentro del servidor | Aparcada | Coste, clave que mantener y privacidad; pendiente de ver dónde se atasca la gente |
| Notificación a las 21:00 si mañana toca una asignatura en rojo | Pendiente | En iPhone exige tener la app instalada |
| Versión nativa iOS/Android | Aparcada | Coste de publicación |

### Promoción prevista

Difusión orgánica por grupos de clase con un anuncio animado de 30 y 15 segundos. Estilo «noir y luz verde», un chaval de pelo largo rizado, lema «Con NoVoy, hoy no voy.» y voz en off grave y cálida.

## 4. Estado funcional: pantallas y flujos

La app tiene 16 pantallas, 4 pestañas de uso diario y unas 88 acciones distintas en la interfaz. Todo lo descrito aquí está en producción en la rama `main`.

### Primera vez: alta guiada en 6 pasos

Arriba se muestra «Paso X de 6» con barra de progreso.

1. **Intro animada.** Escenas con el semáforo y un botón para empezar. Dice «25%» y «Cada mañana», que no vale para todos.
2. **«¿Dónde estudias?»** Buscador. Mira el catálogo propio (solo Institut Pedralbes), el directorio oficial de la Generalitat y los centros añadidos por otros alumnos. Desde 3 letras ofrece «No está mi centro». Enlace «Prefiero no decirlo».
3. **«¿Qué estudias?»** Lista de ciclos (solo DAW) y un formulario «¿No está tu ciclo?».
4. **«Tu horario».** Tres tarjetas, cada una con su «Mejor si…»:
   - Con una foto (principal): OCR en el móvil, la foto no sale del dispositivo.
   - Pintándolo: rejilla semanal; con ciclo de catálogo la paleta ya trae los módulos y se ordena por el curso deducido.
   - Con tu IA: tres pantallas (copiar mensaje, abrir IA, pegar respuesta) y revisión.
5. **«Tu calendario».** Trimestres y festivos. Con Pedralbes 2º se rellena solo; en el resto sale una plantilla con festivos de Cataluña y dos de Barcelona.
6. **«Reglas de tu centro».** Botones para límite (15/20/25/30%), justificadas (3 modos), trimestre o curso, retrasos y semanas del curso (33).
7. **«¿Cuántas horas has faltado ya?»** Contadores +/− por asignatura, o «¿Las tienes en el Moodle?» para pasarlas con IA. Si todo queda a 0, pide confirmación.

La cuenta no se pide en el alta. Se ofrece después como aviso en Hoy.

Debajo de la rejilla hay un desplegable «Casos especiales» con tutoría, proyectos, asignaturas que empiezan tarde y cambios de horario.

### Uso diario

| Pestaña | Qué muestra | Acciones |
| --- | --- | --- |
| Hoy | Semáforo con frase («Puedes faltar», «Mejor no», «Hoy no»); una tarjeta por asignatura del día con «te quedan X h» y el porcentaje de ahora y de después; un solo aviso inferior | «Falté todo el día», «Falté», «Falté a todo», «Solo 08:00», «Quitar»; pregunta «Ayer, ¿fuiste a todas las clases?» |
| Resumen | Selector de trimestre; por asignatura «te quedan X h», «Llevas A de B h», porcentaje y barra; frases «A salvo», «Sin margen», «Te has pasado»; comprobación con horas oficiales | Abrir Simulador; cambiar qué asignaturas no cuentan |
| Faltas | Rejilla de la semana con navegación; lista de faltas | Tocar una casilla para apuntar (retraso, justificada); importar con IA; «Apuntar a mano»; editar o borrar |
| Ajustes | Seis apartados: Horario, Reglas de tu centro, Pásalo a tu clase, Cuenta y copia, App, Empezar de cero | Cambiar horario, foto nueva, IA, centro y ciclo, faltas de antes, reglas, enlace de clase, cuenta, copia, tema, borrar |

### Otras pantallas

- **Simulador:** como Hoy, pero eligiendo fecha.
- **Unirse (enlace de clase o de copia):** carga un horario o una copia completa. Tiene el fallo más grave de la app.
- **«¿Desde cuándo vale este horario?»:** al cambiar el horario, pregunta si el cambio vale desde hoy o desde siempre.
- **Instalar:** instrucciones para añadirla a la pantalla de inicio.
- **Editor avanzado:** unir asignaturas, nombre del centro, edición detallada.
- **Panel de administración:** estadísticas anónimas y avisos, solo para la cuenta del autor.

### Orden del aviso único de Hoy

Solo se muestra el primero que aplique, y todos se pueden cerrar:

1. Riesgo de borrado en iPhone sin instalar.
2. «¿Ya has faltado antes de hoy?».
3. «Guarda tu horario» (crear cuenta); pospuesto 7 días si se cierra.
4. «Ponla en tu pantalla de inicio».
5. «Guarda tu copia».
6. Enlace de recuperación para quien ya tiene cuenta.

### Reglas del semáforo

- **Rojo:** el margen de alguna asignatura de hoy quedaría por debajo de 0.
- **Ámbar:** quedarían 2 h o menos (umbral fijo, configurable en Ajustes).
- **Verde:** el resto.

### Vías para meter faltas acumuladas

| Vía | Cómo | Limitación conocida |
| --- | --- | --- |
| Contadores | Un total de horas por asignatura, sin fecha | Sin retrasos ni justificadas |
| Rejilla semanal | Tocar cada hora, semana a semana | Lenta: unos 3 toques por hora |
| Con IA | Copiar mensaje, pegar tabla del Moodle en la IA, pegar respuesta | Descarta horas repetidas del mismo día |

## 5. Arquitectura y código

Son archivos estáticos que el navegador abre tal cual, más una función de servidor para cuentas y catálogo compartido. No hay framework, compilación, `package.json` ni dependencias en ejecución salvo Tesseract.js para el OCR.

### Archivos

| Ruta | Líneas | Qué contiene |
| --- | --- | --- |
| `site/index.html` | — | Página única; carga los scripts en orden |
| `site/app.js` | 1.597 | Toda la interfaz: estado, 16 vistas, manejadores de eventos. Renderiza concatenando cadenas y rehace `#app` entero en cada acción |
| `site/core.js` | 394 | Motor de cálculo puro. Se puede cargar en Node |
| `site/setup.js` | 351 | Formato de intercambio, mensajes para la IA, validación de lo importado |
| `site/catalog.js` | 80 | Catálogo: ciclo DAW, Institut Pedralbes, calendario 2026-27, consulta al directorio oficial |
| `site/shot.js` | 199 | Lectura del horario desde una foto (Tesseract.js, hasta 3 pasadas) |
| `site/acct.js` | 79 | Cuentas: derivación de claves, cifrado, llamadas al servidor, catálogo compartido |
| `site/style.css` | 283 | Estilos, tema claro y oscuro |
| `site/sw.js` | 7 | Service worker: red primero, caché si no hay conexión. Versión actual `pf-v39` |
| `site/seed.js` | 1 | Vacío en producción; en local puede precargar datos |
| `worker/_worker.js` | 202 | Cloudflare Worker: `/api/acct` y `/api/notice`, y sirve los estáticos |
| `netlify/functions/acct.mjs` | — | Versión antigua del servidor para Netlify; sin catálogo compartido |
| `tests/` | 5 archivos | Pruebas del motor con `assert` de Node |
| `harness/serve.js` | — | Servidor local con KV en memoria para probar cuentas |
| `scripts/build.sh` | — | Genera los zip para Netlify y Cloudflare |
| `docs/` | — | Informes de pruebas y documentos de origen (añadidos con este traspaso) |
| `private/` | — | Datos reales del autor. Ignorado por git; dos tests dependen de él |

### Estado en el móvil

Todo vive en `localStorage`, clave `ft.v2`:

```
{ config, settings, faltas, since, okDay, acct, skipCfg }
```

| Parte | Campos |
| --- | --- |
| `config` | `center`, `terms[{id,label,from,to}]`, `holidays[{from,to,label}]`, `schedule{1..5:[{start,end,subject,hours}]}`, `periods` (tramos), `history` (horarios anteriores con fecha), `alias` (asignaturas unificadas), `subjects`, `disabled`, `project`, `nocount`, `ask`, `tutChecked`, `totals`, `totalsUnified`, `catalog{centre,cycle,course}` |
| `settings` | `limite`, `aviso` (2 h), `ambito` (`trimestre` o `curso`), `justModo` (`juntas`, `nocuentan`, `separadas`), `limiteJust`, `retrasosPorFalta`, `semanas` (33), `unificar`, `formula` |
| `faltas[]` | `id`, `date` (vacío en las «de antes»), `term`, `subject`, `hours`, `type` (`falta` o `retraso`), `justified`, `note` (`previas`), `start` |
| `since` | Día en que empezó a usar la app; limita la pregunta de ayer |
| `okDay` | Último día confirmado como «fui a todo» |

Otras claves: `ft.intro`, `ft.accx`, `ft.bk`, `ft.hint`, `ft.iosx`, `ft.cid` (identificador aleatorio para el catálogo compartido).

### Motor (`core.js`)

Funciones principales: `dayClasses` (clases de una fecha), `computeTotals` (horas por trimestre), `nominalFactors` y `weeksFactor` (escalado a 33 semanas), `summary` (totales, faltas, límite, margen y estado por asignatura), `verdict` (semáforo del día), `simulate`, `remaining`, `scope` (trimestre o curso), `withHistory` (cambios de horario con fecha), `normalize`, `canon` (alias).

### Formato de intercambio

`puedo-faltar/2`, en JSON con campos en español (`horario`, `trimestres`, `festivos`, `reglas`, `faltas`, `tramos`, `unificar`, `no_cuentan`, `catalogo`). Lo usan el enlace de clase, la copia de seguridad, el archivo exportado y la respuesta de la IA. `parseImport` valida la configuración completa; `parseFaltas` solo una lista de faltas.

### Servidor

`POST /api/acct` con un campo `op`:

| `op` | Qué hace |
| --- | --- |
| `new`, `get`, `put`, `rekey` | Crear cuenta, leer, guardar y cambiar contraseña. El dato es un blob cifrado de hasta 300.000 caracteres |
| `stat` | Contador anónimo del resultado del OCR |
| `cat-add`, `cat-get` | Catálogo compartido: guarda lo que entra por «Otro» y devuelve lo confirmado por 2 móviles distintos |
| `admin` | Panel: lista de cuentas (sin contenido), estadísticas, exportar, bloquear, aviso global |
| `ping` | Comprobación |

`GET /api/notice` devuelve el aviso global. El almacén es un KV de Cloudflare enlazado como `CUENTAS`: claves `c:<id>` para cuentas, `cat:<tipo>:<ámbito>:<nombre>` para el catálogo, `sys:notice` para el aviso.

### Cuentas y cifrado

De usuario y contraseña se derivan en el móvil, con PBKDF2 de 250.000 iteraciones, un identificador, una prueba de autenticación y una clave AES-GCM. El servidor solo ve el identificador, la prueba y el blob cifrado. No hay recuperación de contraseña. El administrador principal es la cuenta de nombre `c33`; el rol se guarda en la cuenta, no en el nombre.

### Enlaces

- **De clase:** `#c=…` con el horario y el calendario comprimidos en la propia URL.
- **De copia:** igual, pero con las faltas.
- **Parámetro `?d=AAAA-MM-DD`:** fija la fecha de «hoy». Útil para pruebas; está activo en producción.

### Despliegue

Cloudflare Pages está conectado al repositorio: cada push a `main` publica. La configuración del proyecto (directorio de salida, enlace del KV, variable del administrador) vive en el panel de Cloudflare, no en el repositorio: no hay `wrangler.toml`. Hay que subir a mano la constante `V` de `sw.js` en cada cambio para invalidar la caché.

### Pruebas

```
node tests/formula.test.js
node tests/reglas.test.js
node tests/unidades.test.js
```

`core.test.js` y `setup.test.js` necesitan `private/` y fallan sin él; además esperan que la tutoría cuente, así que están desactualizados. No hay pruebas de interfaz en el repositorio ni integración continua. Los guiones de Playwright usados en las pruebas de noviembre están en `docs/pruebas-2026-11-14/`.

## 6. La fórmula y su exactitud

La app calcula las horas de cada asignatura como horas semanales × semanas del curso, y esa hipótesis solo está contrastada con un centro. Es el mayor riesgo de fondo del producto.

### Qué calcula hoy

```latex
\text{horas del módulo} = \min\big(\text{horas semanales} \times \text{semanas},\ \text{horas que da el calendario}\big)
```

1. Cuenta las clases día a día con el horario y el calendario (trimestres menos festivos).
2. Calcula, por asignatura, el cociente entre horas semanales × semanas (33 por defecto) y lo que da el calendario en todo el curso.
3. Si el cociente es menor que 1, escala a la baja las horas de cada trimestre. Nunca escala al alza.
4. Límite = porcentaje × horas. Margen = límite − faltas que cuentan.
5. Con ámbito «curso», suma todos los trimestres en uno.

Si el alumno fija totales a mano (`config.totals`), esos mandan sobre el cálculo.

### De dónde sale el 33

- La normativa catalana estandariza el curso en 33 semanas; las horas oficiales son múltiplos de 33.
- La hoja de planificación del autor (2º DAW, Pedralbes) da 561 h ÷ 17 h semanales = 33 semanas exactas.
- Un curso catalán completo contado por calendario da 38 semanas y 178 días lectivos. Contar días sobrestima un 15%.
- En el calendario real de 2º en Pedralbes salen 160 días lectivos, es decir 32 semanas. Ahí el calendario da algo menos que la fórmula y la app usa el calendario.

### Qué se ha verificado

| Caso | Resultado | Cómo |
| --- | --- | --- |
| Horario sintético de 5 h semanales | 165 h exactas en el curso; los tres trimestres suman 165 | Test `formula.test.js` |
| Grado medio en Lleida, 10 módulos, curso entero | Totales iguales a horas semanales × 33; márgenes exactos con las faltas bien metidas | Prueba con Playwright |
| Bachillerato nocturno, por evaluación | Exactas o entre 1 y 1,5% por debajo, del lado seguro | Prueba con Playwright |
| 2º DAW en Pedralbes, por trimestre | Sin terminar: el cálculo a mano está hecho, la comparación con la app no | Prueba interrumpida |

En las dos pruebas completas, la «verdad» se calculó con la misma fórmula. Demuestran que el motor hace lo que dice, no que el centro calcule así.

### Qué no se sabe

- **Si los centros reparten por trimestre igual que la app.** La app reparte en proporción a los días lectivos de cada trimestre. Un centro puede usar 11 semanas por trimestre, o las horas impartidas de verdad.
- **Si el denominador del centro son horas nominales o impartidas.** Hace falta comparar con el porcentaje que el Moodle da a un alumno real.
- **Qué pasa en 2º con estancia en empresa.** Si las clases acaban en febrero, 33 semanas no vale. Hoy lo cubre el tope del calendario, pero solo si el alumno pone bien la fecha de fin.
- **Horas de libre disposición.** Las horas del catálogo de 2º suman 495 h frente a las 561 h de la hoja real.
- **Centros fuera de Cataluña,** donde las horas no son múltiplos de 33.

### Errores de cálculo conocidos

| Situación | Efecto | Lado |
| --- | --- | --- |
| Justificada cuenta media falta | Hasta 1,5 h de diferencia por asignatura | Seguro con «Cuentan igual», peligroso con «No cuentan» |
| Dos límites a la vez (sin justificar y total) | No representable | Depende de la opción elegida |
| Límite por unidad formativa | No representable; el margen real es mucho menor | Peligroso |
| Semanas alternas y desdobles | No representables | Variable |
| Clases que no duran 60 min | Tras editar el horario, las horas pasan a minutos reales | Seguro, pero rompe el horario |
| 25% preseleccionado en el alta | Si el centro usa 20% o 15%, da margen de más | Peligroso |

### Prueba pendiente más valiosa

Comparar, para tres o cuatro alumnos de centros distintos, el porcentaje de la app con el que les da su centro. Una tarde de trabajo decide si la palabra «oficial» puede usarse.

## 7. Datos externos y catálogo

Está publicado qué centros hay y qué ciclos imparten; no está publicado, en forma consultable, qué módulos y horas tiene cada ciclo en cada centro, ni ningún horario.

### Qué existe

| Dato | ¿Publicado? | Dónde | Forma |
| --- | --- | --- | --- |
| Calendario escolar de Cataluña | Sí | [Ordre EDF/66/2026](https://educacio.paeria.cat/ca/escolaritzacio/copy_of_calendari-escolar/ordre-edf662026-de-22-dabril-per-la-qual-sestableix-el-calendari-escolar-dels-cursos-2026-2027-2027-2028-2028-2029.pdf), tres cursos | PDF |
| Directorio de centros con enseñanzas autorizadas | Sí | [Dades obertes](https://datos.gob.es/en/catalogo/a09002970-directorio-de-centros-docentes), se actualiza en septiembre y enero | API tipo Socrata |
| Centros por ciclo formativo de grado medio y superior | Sí | [Estadística del Departament](https://educacio.gencat.cat/ca/departament/estadistiques/estadistiques-ensenyament/curs-actual/formacio-professional/index.html?st_source=ai_overview) | CSV anual |
| Oferta de grado superior por instituto | Sí | Servicios territoriales, por ejemplo [Girona 2026-27](https://educacio.gencat.cat/web/.content/home/departament/serveis-territorials/girona/centres-serveis-educatius/ensenyaments-professionals/GIR-oferta-fp-gs.pdf) | PDF |
| Módulos y horas mínimas de cada ciclo | Sí | Decretos de currículo y [DOIGC Currículum FP](https://documents.espai.educacio.gencat.cat/IPCNormativa/DOIGC/CUR_FP.pdf) | PDF, unos 150 ciclos |
| Horas reales del módulo en cada centro | No | Programación de cada centro | — |
| Límite y trato de las justificadas | No | Normas de cada centro; ejemplos en [Institut B7](https://educaciodigital.cat/iesb7/moodle/pluginfile.php/228902/mod_resource/content/4/Criteris%20Avaluacio%20Grau%20Superior%20curs%202023_2024.pdf) e [INS Guinovarda](https://agora.xtec.cat/iesguinovarda/wp-content/uploads/usu579/2023/11/CRITERIS-DAVALUACIO-2023.pdf) | PDF |
| Festivos locales y días de libre disposición | No | Cada municipio y centro | — |
| Horarios | No | Moodle o tablón de cada centro | — |

El currículo nuevo de FP elimina las unidades formativas y reparte las horas de empresa entre los módulos ([resumen del Institut Julio Antonio](https://agora.xtec.cat/iesjulioantonio/wp-content/uploads/usu942/2024/04/20240412_Infografies_ordenacio_FP.pdf)). Los centros añaden horas de libre disposición a los mínimos ([ejemplo del Institut Pere Martell](https://institutperemartell.cat/wp-content/uploads/2025/09/AFB0_Disseny_gestio.pdf)).

Los documentos de origen citan dos identificadores de datos abiertos (`5bsa-tpuh` para el catálogo de FP y `e2ef-eiqj` para el directorio). El código consulta otro (`kvmv-ahh4`). Ninguno se ha podido probar en vivo desde el entorno de desarrollo. Hay que verificar cuál es el vigente y qué columnas trae.

### Qué hay cargado en la app

| Contenido | Estado |
| --- | --- |
| Ciclo DAW (código ICC0), 16 módulos | Horas tomadas de fichas del Institut Escola del Treball y del Institut Marianao, no de Pedralbes |
| Módulos sin horas | Proyecto intermodular, Optativa, IPO I, Digitalización y Sostenibilidad |
| Institut Pedralbes | Solo los trimestres de 2º (14/09–27/11, 30/11–05/03, 08/03–26/05) |
| Calendario 2026-27 | Festivos generales, más La Mercè y Segona Pasqua, que son solo de Barcelona |
| Directorio oficial | Consulta en vivo desde el móvil; sin verificar |
| Catálogo compartido | Guarda centros y ciclos escritos en «Otro»; publica con 2 confirmaciones. Los módulos todavía no se comparten |

### Cómo debería crecer

1. Descargar una vez al año el CSV oficial de centros y ciclos y servirlo como JSON propio. Evita depender de una API externa en el móvil.
2. Extraer los decretos a demanda: primero los ciclos que más entren por «Otro». El servidor ya cuenta esas entradas de forma anónima.
3. Aprender módulos y horas semanales de los horarios que confirman los alumnos, por centro y ciclo, con dos confirmaciones.
4. Añadir festivos por municipio.

## 8. Resultados de las pruebas (14/11/2026)

Dos perfiles completaron la prueba y encontraron 19 fallos; ninguno se ha corregido todavía. Otros tres perfiles quedaron a medias por un límite de uso.

### Método

Cada probador era un agente de IA con un perfil de estudiante. Antes de abrir la app escribió su horario, calendario, reglas y faltas desde septiembre, y calculó a mano el resultado correcto. Después hizo el alta desde cero con Playwright en un móvil simulado de 390×844, metió las faltas por todas las vías y comparó.

Límites: copia local sin red (sin foto, directorio, cuentas ni instalación), sin personas reales y sin una IA real en la vía de IA.

| Perfil | Estado | Qué cubre |
| --- | --- | --- |
| 1º grado medio de enfermería, Lleida, 17 años | Completo | Centro y ciclo fuera del catálogo, tarde, clases de 55 min, 20% curso entero |
| 1º bachillerato nocturno, Tarragona, 29 años | Completo | No es FP; uso diario durante semanas; auditoría visual en 3 tamaños, claro y oscuro |
| 2º DAW, Pedralbes | A medias | Caso, cálculo a mano, alta y contadores hechos; faltan IA, uso diario e informe |
| 2º ASIX dual, Sabadell | A medias | Solo el caso y guiones iniciales |
| 1º Marketing, Girona, todo con IA | A medias | Solo el caso y respuestas de IA preparadas |

### Fallos por gravedad

| # | Fallo | Cómo reproducirlo | Dónde | Lado |
| --- | --- | --- | --- | --- |
| 1 | El enlace de clase borra las faltas de quien lo abre | Usuario con faltas abre un enlace «Pásalo a tu clase»; ve «Copia de tus datos · Restaurar mis datos»; al pulsar quedan 0 faltas, sin deshacer | `toExport` escribe siempre `faltas: []`; `parseImport` trata la lista vacía como «trae faltas»; `fillShare` y `viewJoin` | Pérdida de datos |
| 2 | Importar con IA descarta horas del mismo día | Pegar una respuesta con una entrada por hora: entran 37 h de 57 y dice «20 ya las tenías apuntadas» | `parseFaltas`: la clave `fecha\|asignatura\|tipo` incluye las del propio lote | Peligroso |
| 3 | Contadores sin retrasos ni justificadas | Con «3 retrasos = 1 h» o «No cuentan» no hay dónde indicarlo | `viewPrevias` | Peligroso |
| 4 | El semáforo cuenta dos veces lo apuntado hoy | Tras «Falté todo el día» pasa a «Hoy no» con márgenes positivos; el botón sigue visible | `verdict` no descuenta lo ya registrado | Aviso falso |
| 5 | Faltas en festivos, días sin esa clase y fuera de curso | Importar o apuntar a mano en un festivo: suma. En la rejilla, fuera de curso: guarda `term: null` y no cuenta | `parseFaltas`, formulario `#add`, `weekGrid` | Aviso falso o dato perdido |
| 6 | Festivos de Barcelona para todos | La Mercè y Segona Pasqua salen en cualquier centro; ese día no se puede apuntar una falta | `CAT_2627` en `catalog.js` | Variable |
| 7 | «Cambiar mi horario» rompe horarios de 55 min | Entrar y guardar sin tocar: la rejilla pasa de 6 a 9 filas y las horas cambian (198 h pasan a 181,5 h) | `hourSlots` trocea a 60 min; `qFromCfg` reconstruye con esos cortes | Seguro, pero rompe |
| 8 | Horas de clase mal mostradas | Clases de 55 min salen como «15:00 y 16:00» | `hourSlots` | Solo visual |
| 9 | Asignatura pasada dice «Te quedan 0 h» | Tarjeta ya apuntada y por encima del límite | `Math.max(0, margin)` en `subjectCards` | Aviso falso |
| 10 | El calendario del alta se corta a 320 y 375 px | El campo «Hasta» queda fuera de la tarjeta | `.qt .two` con dos campos de fecha | Visual |
| 11 | Tarjeta de retraso o justificada bajo la barra de pestañas | A 320 px, tocar una casilla en Faltas | Posición de la tarjeta de celda | Visual |
| 12 | Cambiar la hora de la primera clase no actualiza la rejilla | Poner 15:00: las filas siguen en 08:00 hasta tocar otro control | Manejador `data-qf` sin `render()` | Visual |
| 13 | El tema claro u oscuro no se guarda | Recargar | Solo cambia `dataset.theme` | Menor |
| 14 | «Semanas = 0» se acepta | Escribir 0 en Reglas | Sin validar el mínimo | Menor |
| 15 | El semáforo nombra la primera asignatura en ámbar, no la más justa | Dos asignaturas en ámbar | `viewHoy` | Menor |
| 16 | Retraso importado por IA sin hora | No sale como «R» en la rejilla | `parseFaltas` | Menor |
| 17 | La copia restaurada pierde el umbral de aviso | Exportar e importar | `toExport` | Menor |
| 18 | Siete acciones con manejador y sin botón | `ai-go`, `go-reg`, `q-start`, `share-app`, `start-setup`, `start-update`, `acct-out` | `app.js` | Código muerto |
| 19 | Textos falsos o descuidados | «Ya tenemos sus módulos y sus horas» sin catálogo; «Retraso apuntada»; «1 retrasos»; «no es un JSON válido»; «déjala como está: es lo más seguro» con 25% | Varios | Confianza |

### Tiempos medidos

El objetivo era 2 minutos de alta. Estimación a 2 s por toque, 4 s por campo y 8 s por decisión, más tiempo realista de buscar datos.

| Tarea | Vía | Lleida | Tarragona |
| --- | --- | --- | --- |
| Alta | Pintando | 73 toques, 30 campos, 9–12 min | 50 toques, 26 campos, 7–9 min |
| Alta | Con IA | 9 toques en la app, 6–10 min | no probada |
| Faltas | Contadores | 41 toques, 5 min o más | 18 toques, 40 s |
| Faltas | Rejilla semanal | 165 toques, 8–10 min | 43 toques, 1,5 min |
| Faltas | Con IA | 6 toques, 3–5 min | 6 toques, 2–3 min |

Lo que más tiempo consume: las 11 a 13 fechas del calendario, escribir los nombres de asignatura y ajustar una rejilla que viene de mañana y con clases de 60 min.

### Exactitud

- **Lleida:** con rejilla o IA bien formada, los 10 módulos coinciden con el cálculo a mano. Con contadores, 1 h de margen de más en 2 módulos. Con IA y una entrada por hora, 13 h de margen falso.
- **Tarragona:** horas totales exactas o hasta 1,5% por debajo. Con «justificada = media falta», error de hasta 1,5 h en el sentido que marque la opción elegida.
- **Pedralbes (parcial):** según el cálculo a mano del probador, en el primer trimestre la fórmula ×33 y el recuento de días difieren menos de 3 h por módulo. La comparación con la app no llegó a hacerse.

### Hallazgos de uso diario

- **Ámbar permanente:** el umbral fijo de 2 h es la mitad del límite en asignaturas de 2 h semanales.
- **Pregunta de ayer:** solo pregunta por el último día de clase; un día sin contestar se pierde. Sale en festivos, entre evaluaciones y con el curso acabado.
- **Cambio de evaluación:** todo vuelve a 0 sin mensaje.
- **Fuera de curso:** solo dice «Día libre».
- **«Te quedan X h»:** significa «ahora» en Resumen y «después de faltar» en Hoy.
- **Avisos:** «Guarda tu horario» y «Guarda tu copia» dicen casi lo mismo con dos mecanismos.

### Auditoría visual

- **Zonas táctiles:** `.btn.small` mide 38 px de alto, incluida la acción diaria «Falté». Flechas de semana 36×38, cierre de festivos 34×34, enlaces de texto 27 px.
- **Contraste en claro:** el gris secundario `#64748B` da 4,34:1; etiquetas ámbar 3,34 y verde 3,94; iniciales de avatar entre 2,2 y 3,7. Unos 70 fallos en claro frente a 10 en oscuro.
- **Texto:** 10–11 px en rejillas; todo en píxeles, no responde al tamaño de letra del sistema.
- **Barras fijas:** el aviso «Falta apuntada» tapa 5 s los interruptores recién abiertos; la barra de pestañas es translúcida y se lee el texto de debajo.
- **Botones:** tres estilos de botón principal (verde en el alta, negro en el resto, gris pizarra en «Falté»).
- **Vocabulario:** conviven asignatura y módulo; trimestre y evaluación; apuntada, anotada y registrada.
- **Accesibilidad:** cada acción rehace `#app`, que es `aria-live`: el foco se pierde y el lector relee todo. Los botones «Falté» se llaman igual. Casi ninguna etiqueta está asociada a su campo.

### Palabras que un usuario de 17 años no entiende

Ciclo, CFGS, módulo, Moodle (si su centro no lo usa), «tu IA», JSON, caché, enlace de copia, «Su propio %», «El límite se mira…», «2 = 1 h», «Semanas de clase del curso», «16,7% de 20%», casos especiales, tramo, franjas, unificar, editor avanzado, ámbar.

## 9. Deuda técnica, seguridad y privacidad

La deuda principal es `app.js`: 1.597 líneas con toda la interfaz en cadenas concatenadas, sin componentes ni pruebas, donde cada cambio puede romper otra pantalla.

### Deuda técnica

| Problema | Consecuencia | Qué haría |
| --- | --- | --- |
| Interfaz en un solo archivo, renderizado por cadenas | No se puede probar una pantalla sola; líneas de 500 caracteres | Reescribir la capa de interfaz con componentes pequeños; conservar el motor |
| Cada acción rehace todo `#app` | Se pierde el foco y la posición; lectores de pantalla releen todo | Actualizar solo lo que cambia |
| Un único manejador de clics con decenas de ramas `else if` | Acciones muertas, difícil de seguir | Mapa de acciones por pantalla |
| Estado global en variables sueltas (`tab`, `sx`, `qk`, `wz`, `prv`…) | Fallos al ir atrás o recargar a mitad de un flujo | Un estado de navegación explícito, con rutas |
| `hourSlots` trocea siempre a 60 min | Fallos 7 y 8 | Guardar las filas reales de la rejilla en la configuración |
| Siete conceptos de horario variable (tramos, historial, proyecto, desactivadas, no cuentan, unificar, ámbito) | Nadie los entiende; están medio escondidos | Reducir a «¿desde cuándo vale este horario?» y «esta clase cuenta dentro de…» |
| Dos formas de totales (`totals` fijados y cálculo) | Difícil saber qué denominador se usa | Mostrar siempre el origen del total |
| Sin migraciones de datos versionadas | Los campos nuevos se rellenan al vuelo en `tidy` | Versión de esquema y migraciones explícitas |
| Versión del service worker a mano | Si se olvida, los usuarios ven la versión vieja | Generarla en el despliegue |
| Sin integración continua ni pruebas de interfaz | Los fallos solo aparecen usando la app | Playwright sobre los flujos de alta, Hoy y faltas en cada push |
| Dos tests dependen de datos privados y están desactualizados | No se pueden ejecutar fuera del equipo del autor | Sustituir por un caso sintético |
| Dos servidores (Cloudflare y Netlify) | El de Netlify no tiene catálogo compartido; el README aún lo cita como producción | Retirar Netlify y corregir el README |
| Configuración de Cloudflare fuera del repositorio | No se puede reproducir el despliegue | Añadir `wrangler.toml` |
| Textos incrustados en el código, solo en castellano | No se puede traducir al catalán ni revisar la redacción en bloque | Sacar los textos a un archivo |
| Tamaños en píxeles | No respeta la letra grande del sistema | Pasar a `rem` |

### Seguridad: lo que está bien

- La contraseña no sale del móvil; el servidor guarda un blob que no puede abrir.
- El rol de administrador se guarda en la cuenta y se comprueba en el servidor.
- El nombre de usuario debe corresponder al identificador derivado: no se puede suplantar un nombre.
- Lo que viene del catálogo compartido se muestra escapado.

### Seguridad: lo que hay que revisar

| Riesgo | Detalle |
| --- | --- |
| Catálogo compartido manipulable | El identificador de móvil lo genera el cliente; dos peticiones con identificadores distintos bastan para publicar un nombre falso. No hay moderación ni forma de retirar entradas |
| Límite de peticiones | No se ha visto ninguno en el Worker para crear cuentas, contadores o catálogo. Verificar y añadir |
| `?d=` activo en producción | Cualquiera puede fijar la fecha; solo afecta a su propia vista |
| Enlaces con datos en la URL | El enlace de copia lleva horario y faltas; quien lo tenga lo ve todo. Se comparte por mensajería |
| Sin recuperación de contraseña | Ya ha pasado una vez. El enlace de copia es el único respaldo |
| Safari en iPhone | Puede borrar `localStorage` tras días sin uso si la app no está instalada |
| Nombre del administrador fijo | La cuenta `c33` es administradora por nombre, salvo variable de entorno |
| Repositorio público | El código, los informes de pruebas y este estado son visibles para cualquiera |

### Privacidad

- No se pide correo ni nombre. Hay usuarios menores de edad.
- El centro y el ciclo que se escriben en «Otro» se envían al servidor sin cuenta ni identidad.
- La foto del horario se procesa en el móvil. Si se añade IA en el servidor, la foto y quizá las faltas saldrían hacia un proveedor: hay que decirlo en pantalla y no guardarlas.
- La vía «con tu IA» hace que el alumno pegue su horario y sus faltas en un servicio externo por su cuenta.
- Un horario con optativas y desdobles identifica a un grupo de cinco personas: no publicar horarios de un solo alumno.
- No hay política de privacidad ni aviso legal publicados. Hace falta antes de difundir fuera de una clase.

### Riesgos de producto sin resolver

1. **El dato se queda viejo.** Si el alumno deja de apuntar, el número se separa de la realidad sin que nadie lo note.
2. **Dos cifras distintas.** Si el número no cuadra con el del tutor, el alumno no se queda con el de la app.
3. **Retención.** Se abre una o dos veces por semana y muere en julio; cada septiembre se empieza de cero.
4. **El primer alumno de cada centro** recibe la peor versión y es quien hace falta para que el catálogo arranque.
5. **Responsabilidad.** Si alguien suspende por fiarse de un verde equivocado, no hay ningún aviso que lo cubra.

## 10. Ideas y sugerencias

Hay más de 90 ideas reunidas aquí: las acordadas con el autor, las que salieron de las pruebas y 30 nuevas. Ninguna de las de «pendiente» o «nueva» está construida.

### Principios de diseño acordados

1. Nunca una página en blanco: la app propone y el alumno corrige.
2. Lo que está publicado no se pregunta; se trae puesto.
3. Cero escritura: el teclado solo para corregir un nombre.
4. Una decisión por pantalla, con su porqué en una línea y «se puede cambiar luego».
5. Máximo 25 palabras por pantalla.
6. Hablar en horas; el porcentaje como dato secundario.
7. «No lo sé» siempre vale, y elige lo más estricto.
8. El error, siempre hacia el lado seguro.
9. Decir si el dato es exacto o aproximado.
10. Preguntar tarde: cuando el alumno ya tiene la respuesta en la mano.
11. La app enseña sus cuentas para que el alumno las valide.
12. Prohibido el vocabulario interno: tramo, ámbito, unificar, asignatura desactivada.

### Acordadas y todavía sin construir

- Etiqueta *verificado* o *aproximado* junto a cada número.
- «Otro» también para módulos, con búsqueda en el catálogo mientras se escribe y doble confirmación.
- Contar como confirmaciones independientes solo dos cuentas de días u horarios distintos.
- Lista de ciclos reales por centro a partir del CSV oficial.
- Preguntas tardías: justificante la primera vez que se marca una falta justificada; retrasos la primera vez que se apunta uno; «¿mañana hay clase?» el jueves antes de un puente; «¿tu semana ha cambiado?».
- Reglas del centro compartidas como votos («en tu insti dicen que…»), visibles con dos votos iguales.
- Horario tipo por centro y ciclo, publicado solo cuando dos alumnos han pintado lo mismo.
- Alta de 10 segundos para la clase: enlace con todo configurado, elegir grupo y poner faltas.
- Aviso a las 21:00–21:30 solo si mañana toca una asignatura en rojo.
- IA dentro del servidor para leer foto, calendario y tabla de faltas, con tope por móvil y mensual; si falla, pasar a pintar sin mostrar error.
- Avisos que detectan contradicciones: falta en un festivo, un mes sin apuntar nada de un módulo.
- Obligar a guardar el enlace de copia antes de seguir si se repiten las contraseñas perdidas.
- Validar con el tutor y con los criterios del centro: unidad de cálculo, horas nominales o impartidas, tutoría.
- Probar con 5 a 8 compañeros reales y cronómetro antes de construir más.

### Salidas de las pruebas

**Correcciones de texto**

- Ciclo sin catálogo: «Elige tu ciclo. Si no sale, escríbelo abajo: tardas 2 minutos más.»
- Nombres: «Puedes escribirlas todas seguidas, separadas por comas.»
- Calendario: «Estos son los festivos de toda Catalunya. Añade los de tu pueblo o ciudad (suelen ser 2) y los días de libre disposición de tu centro.»
- Reglas: «Si no sabes alguna, pregúntala a tu tutor. Mientras tanto, elige la más estricta.»
- Preguntas de reglas: «¿Qué parte de las clases puedes perderte?», «Si traes justificante… \[Cuenta igual\] \[No cuenta\] \[Tiene otro límite\]», «¿El límite es de cada trimestre o de todo el curso?», «¿Llegar tarde cuenta?».
- Contadores: «¿Cuántas horas has faltado ya SIN justificante?» cuando las justificadas no cuentan.
- Revisión de importación: «He encontrado 57 h: 38 cuentan, 17 justificadas (no cuentan), 2 de Tutoria (no cuenta) y 10 retrasos.»
- Error al pegar: «Falta un trozo de la respuesta. Cópiala entera con el botón de copiar de tu IA y pégala otra vez.»
- Enlace de clase: título «Te han pasado un horario», botón «Usar este horario».
- Hoy: «si faltas, te quedarán 1,8 h»; Resumen: «te quedan 3,8 h». Un solo verbo: apuntar.

**Cambios de interfaz**

- Preguntar hora de inicio y duración de la clase antes de pintar: «\[08:00\] \[15:00\] \[otra\]», «\[55\] \[60\] \[otra\]».
- Dibujar el recreo como franja en la rejilla.
- Paleta de asignaturas en varias líneas, no en carrusel.
- No mostrar DAW a quien viene de «No está mi centro».
- «¿Qué estudias?» con «FP · Bachillerato · Otro» y vocabulario adaptado (asignatura, evaluación).
- Límite sin preselección, o «elige el más bajo».
- Con límite sobre el curso entero, pedir solo «empieza el» y «acaba el».
- Opción «justificadas cuentan la mitad».
- Columna «Retrasos» en los contadores cuando suman.
- Umbral de ámbar proporcional: cuando quede el 25% del límite o menos, mínimo 1 h.
- Pregunta de ayer para todos los días sin contestar de la última semana, con «No me acuerdo», y oculta fuera de curso.
- Con todo apuntado: «Hoy ya está apuntado», sin «Falté todo el día».
- Tarjeta de celda como hoja inferior por encima de la barra de pestañas.
- Botones de 44 px de alto como mínimo.
- Contraste: gris secundario `#55637A`, ámbar `#8A5A00`, verde `#0B7A4B`.
- Selector de tema «Automático · Claro · Oscuro» guardado.
- Ocultar la columna del viernes si nunca hay clase.
- Agrupar las faltas «de antes» en una tarjeta por asignatura.
- Mensaje al cambiar de evaluación y al acabar el curso.
- Un `aria-label` distinto en cada «Falté».
- «¿Tuviste clase el 24 de septiembre? \[Sí, quitar el festivo\]» al apuntar en un festivo dudoso.

**Lo que piden los usuarios simulados**

- Su ciclo en la lista, con sus módulos y horas.
- Decir su ciudad y que salgan sus festivos.
- Turno de tarde de un toque y clases de distinta duración.
- «Falté todo el día» en días pasados, o un rango: «del 5 al 6 de octubre, justificado».
- Pasar una falta a justificada sin buscarla entre 60 tarjetas.
- Ver justificadas y retrasos por asignatura.
- Pasar las faltas con una captura, sin depender de una IA externa.
- Recibir el horario ya hecho de un compañero al acabar el alta.
- «Salí a las 21:00»: faltar a la última hora con un toque.
- Un resumen semanal: «esta semana puedes saltarte MAT 1 h y FIQ 1 h».
- Aviso antes de su hora de clase, no «cada mañana».
- Ver las evaluaciones cerradas con su resultado.

**Qué quitar**

- El simulador como pantalla aparte (es Hoy con fecha). El autor quiere conservarlo: integrarlo como selector de fecha en Hoy cumple las dos cosas.
- «Apuntar a mano (otra forma)».
- El editor avanzado.
- Dos de las cuatro formas de cambiar el horario en Ajustes.
- Exportar e importar archivo, si ya hay cuenta y enlace.
- «Actualizar app».
- El panel de administración dentro del paquete público.

### Ideas nuevas

**Para que el número sea fiable**

1. **Calibración con el centro.** Una pantalla «¿Qué porcentaje te dice tu Moodle en esta asignatura?». Con una cifra, la app deduce el denominador real del centro y corrige el suyo.
2. **Origen del total a la vista.** Al tocar un número: «132 h = 4 h a la semana × 33 semanas». Con un toque para corregirlo.
3. **Margen con horquilla.** Si el dato es aproximado, mostrar «te quedan entre 4 y 5 h» en vez de «4,5 h».
4. **Modo estricto por defecto hasta verificar.** Mientras no haya calibración, restar una hora de colchón y decirlo.
5. **Reglas como fórmulas componibles.** Un peso por tipo de falta (justificada 0, 0,5 o 1) y uno o varios límites. Cubre «media falta» y «dos límites» sin modos nuevos.
6. **Límite por unidad dentro del módulo.** Para centros que cuentan por resultado de aprendizaje: partir el módulo en bloques con fechas.
7. **Registro de cambios de reglas.** Si el alumno cambia el límite, guardar cuándo, para explicar por qué cambió el semáforo.

**Para acortar el alta**

8. **Plantilla de clase firmada.** El primer alumno publica «2º DAW B · Pedralbes» con un código corto de 4 letras; el resto lo escribe y solo pone sus faltas.
9. **Código QR en clase.** El mismo enlace, para proyectar o imprimir.
10. **Calendario en dos toques.** «¿Tu curso acaba en mayo o en junio?» y «¿Trimestres estándar?», con las fechas oficiales ya puestas.
11. **Festivos por municipio.** Una tabla de fiestas locales de Cataluña, elegida sola por el centro.
12. **Semana tipo por turnos.** Plantillas «mañana 8:00», «tarde 15:00», «nocturno 17:30» con recreo.
13. **Pintar arrastrando.** Deslizar el dedo para llenar varias casillas seguidas.
14. **Copiar un día a otro** con un gesto visible, no dentro de un desplegable.
15. **Alta aplazable.** Dejar usar la app con el horario y pedir calendario y reglas en los días siguientes.
16. **Importar del calendario del móvil o de un archivo .ics** si el centro publica el horario así.

**Para el uso diario**

17. **Widget o acceso directo.** En Android, un acceso directo «Falté hoy» desde el icono; en iPhone, un atajo.
18. **Vista de semana.** «Esta semana puedes faltar a…», con las horas más baratas de saltarse.
19. **«Si me pongo malo».** Simular faltar dos o tres días seguidos y ver qué asignatura se rompe primero.
20. **Presupuesto de faltas.** Repartir las horas que quedan hasta fin de trimestre: «puedes faltar una vez cada dos semanas».
21. **Entrada rápida por voz o texto.** «Ayer falté a las dos primeras» interpretado en el móvil con reglas simples.
22. **Racha y cierre.** Al acabar el trimestre, un resumen compartible sin datos sensibles.
23. **Recordatorio semanal** el viernes: «¿Has apuntado todo esta semana?», en vez de depender de la pregunta diaria.
24. **Deshacer persistente.** Un historial de las últimas acciones, no solo un aviso de 5 segundos.

**Producto y crecimiento**

25. **Catalán.** El público es catalán y los centros escriben en catalán; hoy la app solo está en castellano.
26. **Modo delegado o tutor.** Un enlace de solo lectura para que el tutor o la familia vean el estado, si el alumno quiere.
27. **Panel de calidad anónimo.** Cuántas altas se completan, en qué paso se abandona y cuánto tardan, sin identificar a nadie.
28. **Reinicio de curso en septiembre.** «¿Mismo centro, curso siguiente?» con todo lo que se pueda heredar.
29. **Aviso legal y de responsabilidad** en una línea: la cifra oficial es la del centro.
30. **Página pública de cada centro** con sus reglas confirmadas, que además atrae búsquedas.

## 11. Hoja de ruta recomendada y preguntas abiertas

Primero corregir lo que borra datos o da margen de más, después validar la fórmula con centros reales, y solo entonces invertir en catálogo, IA o reescritura.

### Orden propuesto

1. **Parar el daño (días).** Fallos 1 a 5 de la sección 8. No compartir el enlace de clase hasta corregir el fallo 1.
2. **Que no engañe (días).** Quitar el 25% preseleccionado, sacar los festivos de Barcelona de la plantilla general, corregir los textos falsos, umbral de ámbar proporcional, «Te has pasado» en vez de «0 h».
3. **Validar la fórmula (una semana).** Comparar con el porcentaje del Moodle de 3 o 4 alumnos de centros distintos. Preguntar al tutor de Pedralbes por la unidad de cálculo.
4. **Probar con personas (una semana).** De 5 a 8 compañeros, con cronómetro y sin ayuda. Medir dónde se atascan.
5. **Acortar el alta para la clase.** Plantilla de clase con código o enlace: elegir grupo y poner faltas.
6. **Arreglar el uso diario.** Pregunta de ayer para varios días, «falté todo el día» en días pasados, justificar una falta con un toque, mensajes de cambio de evaluación.
7. **Accesibilidad y tamaños.** Botones de 44 px, contraste, pantallas de 320 px, foco y etiquetas.
8. **Clases que no duran 60 min** y recreo visible: cambiar el modelo de filas de la rejilla.
9. **Reescribir la capa de interfaz** con componentes y pruebas, conservando `core.js`. Aprovechar para sacar los textos y añadir catalán.
10. **Catálogo real.** CSV oficial de centros y ciclos, festivos por municipio, módulos a demanda.
11. **Reglas componibles** (pesos y varios límites) y calibración con el Moodle.
12. **IA en el servidor**, si las pruebas con personas muestran que el horario o las faltas son el atasco.

### Qué no tocar

- El motor `core.js`: rápido y con muchos casos límite resueltos. Cambiar con tests.
- El cifrado en el móvil y las cuentas sin correo.
- El semáforo y su tono («Puedes faltar. Luz verde, que no se haga costumbre»).
- La rejilla de pintar como idea; el autor la considera «fácil, intuitiva y rápida».

### Preguntas abiertas para el autor

- [ ] ¿El objetivo sigue siendo tu clase, o toda Cataluña? Cambia el orden de los pasos 5 y 10.
- [ ] ¿Puedes conseguir la programación de Pedralbes con las horas reales de cada módulo de 1º y 2º?
- [ ] ¿Qué dice tu tutor: el límite se calcula por módulo y trimestre sobre horas nominales o impartidas?
- [ ] ¿Aceptas que la foto salga del móvil si se usa IA en el servidor, diciéndolo en pantalla?
- [ ] ¿Quién mantiene esto en junio y en septiembre?
- [ ] ¿El repositorio debe seguir siendo público, con estos informes dentro?
- [ ] ¿Se añade catalán?
- [ ] ¿Se mantiene el despliegue de Netlify o se retira?

### Preguntas abiertas técnicas

- [ ] ¿Qué identificador de datos abiertos es el vigente para el directorio y qué columnas trae?
- [ ] ¿Tiene el Worker límite de peticiones? ¿Cuántas cuentas y entradas de catálogo hay en el KV?
- [ ] ¿Cómo se comporta el OCR en móviles de gama baja y con horarios de 55 min?
- [ ] ¿Funcionan los campos de fecha y la barra inferior en Safari real?
- [ ] ¿Cuántas respuestas de IA gratuitas vienen con una entrada por hora en vez de por clase?

## 12. Anexos

Todo el material de apoyo está en el repositorio, carpeta `docs/`, para que no dependa de esta conversación.

### Documentos de origen (13/11/2026)

| Documento | Dónde | Qué aporta |
| --- | --- | --- |
| [Dosier de rediseño](https://claude.ai/artifact/Vx1sRNY2HGchsNdAG8mp8Z) | Artefacto del autor | Los ocho giros del proyecto, lo que funciona, los errores, los datos que existen y la arquitectura propuesta |
| [Briefing completo y plan de diseño](https://claude.ai/artifact/KiGekJKXFCcpQJtj5RUyMX) | Artefacto del autor | Glosario, reglas del dominio, principios, mapa de pantallas y el encargo de rediseño |
| Plan de decisiones del rediseño | `docs/origen/plan-de-decisiones.md` | Decisiones una a una, flujo P0–P5, lo que se elimina, orden de construcción y riesgos |

Tres afirmaciones de esos documentos han cambiado desde entonces:

- El plan proponía usar las horas del catálogo como denominador *oficial*. Se decidió usar horario × semanas y dejar el catálogo como comprobación, porque los centros añaden horas propias.
- El plan eliminaba el simulador y la configuración con IA de copiar y pegar. El autor pidió conservar los dos.
- El plan quería la IA como camino principal de lectura. Hoy la foto se lee en el móvil con OCR y la IA es externa.

### Informes de pruebas (14/11/2026)

| Carpeta | Contenido |
| --- | --- |
| `docs/pruebas-2026-11-14/BRIEF.md` | Instrucciones comunes y entorno de prueba |
| `docs/pruebas-2026-11-14/a2/` | Lleida, grado medio: `informe.md`, `caso.md`, guiones y 482 capturas reducidas entre a2 y a5 |
| `docs/pruebas-2026-11-14/a5/` | Tarragona, nocturno: `informe.md`, `caso.md`, auditoría (`audit.json`), guiones y capturas |
| `docs/pruebas-2026-11-14/a1/` | Pedralbes, DAW: `caso.md`, `verdad.json`, guiones y estados guardados; sin informe |
| `docs/pruebas-2026-11-14/a3/` | Sabadell, ASIX dual: `caso.md` y guiones iniciales; sin informe |
| `docs/pruebas-2026-11-14/a4/` | Girona, vía IA: `caso.md` y guiones iniciales; sin informe |

Las capturas se guardaron reducidas a 390 px de ancho en JPEG. Los originales a doble resolución no se conservan.

### Cómo reproducir las pruebas

```
npm i -g playwright
NODE_PATH=$(npm root -g) node docs/pruebas-2026-11-14/a2/alta.js
```

- Abrir `site/index.html?d=2026-11-13` con Chrome en un móvil simulado de 390×844.
- Saltar la intro: `localStorage.setItem('ft.intro','1')` y `sessionStorage.setItem('ft.sp','1')`.
- El estado guardado está en `localStorage`, clave `ft.v2`.
- Los guiones tienen rutas absolutas del entorno donde se crearon; hay que ajustarlas.

### Historial de versiones

| Fecha | Cambio |
| --- | --- |
| 14/11/2026 | Importar faltas con IA: mensaje nuevo, cuatro pasos, solo añade faltas |
| 14/11/2026 | Alta guiada de 6 pasos, catálogo DAW, fórmula ×33, justificadas en 3 modos, encuesta con IA, catálogo compartido |
| 13/11/2026 | Vuelven el simulador y el porcentaje como dato secundario |
| 13/11/2026 | v2: cuenta al final, foto primero, contadores de faltas, tarjeta por asignatura, un aviso a la vez, pregunta de ayer, tutoría fuera |
| Antes | v1, conservada en la rama `v1-novoy` |
