# NoVoy · Hoja de ruta y lista de tareas

Actualizada el 16/11/2026 por la noche (Fase 1 hecha salvo publicar). Es una lista viva: se actualiza al acabar cada sesión.

- **Quién:** **Tú** = C33 · **Claude** = código, pruebas y documentación.
- **Estados:** ✅ hecho · 🟡 en curso · ⬜ pendiente · ⏸ aparcado.

## 1. Dónde estamos

**La v2 está completa: alta, Hoy, Faltas y Ajustes nuevos. Solo falta que la pruebes y digas «publica».**
Nadie aparte de ti ha probado la v2, y el aviso legal espera tu visto bueno.

| Pieza | Estado | Dónde |
| --- | --- | --- |
| App publicada (v1) | Sin cambios. Tiene los 19 fallos de las pruebas | novoy-72h.pages.dev · rama `main` |
| v2 en pruebas | Todo nuevo: tres pestañas Hoy · Faltas · Ajustes. La v1 (`clasica.html`) solo abre los enlaces `#c=` antiguos | v2.novoy-72h.pages.dev · rama `v2` |
| Motor | Reglas con 1 o 2 límites, «Solo con justificante», clases que cuentan dentro de otra asignatura (PROJ), fechas por asignatura, semanas con otro horario y regla propia por asignatura | `site/core.js` |
| Alta v2 | Instituto, ciclo y turno; plantilla de clase, captura o pintar; calendario oficial con festivos locales reales; reglas con ramas; faltas de antes (pegar, capturas, IA, a mano) | `site/alta.html`, `site/v2/` |
| Servidor | Cuentas cifradas, catálogo «Otro», plantillas compartidas `/api/plantilla` | `worker/_worker.js` |
| Faltas y Ajustes v2 | Faltas por asignatura (justificar, borrar); Ajustes con horario, asignaturas (casos especiales), reglas, calendario, pasar lista, enlace de clase, cuenta, instalar, aviso legal | `site/v2/pantalla-faltas.js`, `pantalla-ajustes.js`, `lista.js`, `ajustes.js`, `cuenta.js` |
| Pantalla Hoy v2 | Semáforo, tarjeta por asignatura con «Fui» y «Falté», «Falté todo el día», «Falté a…» (hoy o días pasados, horas sueltas, retraso, justificante), pregunta por días sin apuntar | `site/index.html`, `site/v2/hoy.js`, `site/v2/app.js` |
| Pruebas | 12 archivos de pruebas de lógica y 16 recorridos en Chrome en cada push (GitHub Actions). Cloudflare no publica si fallan las de lógica | `tests/`, `scripts/e2e-alta.mjs`, `e2e-hoy.mjs`, `e2e-ajustes.mjs` |
| Probado con datos reales | Tu lista de iEduca y tu captura del horario: 6 fallos encontrados y arreglados. Festivos de 5 municipios | — |
| Probado con personas | Nadie aparte de ti | — |

### Hecho el 17/11: semanas de proyecto

- **Método:** fuera de las semanas de proyecto, una falta puesta en PROJ es del módulo de esa hora (el lector usa la fecha y la hora). En las semanas de proyecto, todas las clases son de PROJ y sus faltas cuentan en PROJ.
- **Activar:** Ajustes → Horario → «Mi centro hace semanas de proyecto» → nombre (PROJ) → Activar.
- **Marcar semanas sin saberse las fechas:** una lista con todas las semanas del curso; un toque marca o desmarca. Las faltas con hora de esa semana se mueven solas (al proyecto, o de vuelta a su módulo).
- **Botón en Hoy:** «Esta semana es de PROJ» (un toque, con «Deshacer»). Cuando está activa, sale «Semana de proyecto» debajo del semáforo, con «No es de proyecto».
- **PROJ ya no se añade como asignatura.** La opción «cuenta dentro de» por hora ya no se ofrece (solo se ve si ya estaba puesta). En Faltas, una asignatura que ya no está en el horario (p. ej. «PROJ Álvaro») sale aparte con «Pasarlas a su clase» o «Borrar».
- **Riesgo:** el total de PROJ y de los demás módulos se calcula con las semanas marcadas. Mientras falten semanas futuras por marcar, PROJ sale con menos margen (lado seguro) y los demás módulos con algo más (unas 5–6 semanas de 33, lado peligroso). Si sabes cuántas semanas habrá, márcalas aunque sea aproximado.

### Hecho el 17/11: el lector usa la fecha y la hora

- **«16/11/2026 08:00 PROJ No justificada» va a la clase que tienes el lunes a las 8:00**, aunque la plataforma la apunte en PROJ o con otro nombre. Solo cuando la asignatura viene en la línea o no viene ninguna: si sale de la cabecera de la lista y ese día no la tienes, sigue como dudosa. La revisión dice cuántas se han colocado así.

### Hecho el 17/11: rejilla del horario (lo que pediste)

- **Sin arrastrar:** se toca la ficha y luego cada casilla. Hacer scroll por la rejilla ya no pinta nada.
- **Nueva asignatura:** Intro la crea y el campo sigue abierto para la siguiente; «Ya están todas» lo cierra.
- **Cambiar el nombre:** tocar otra vez la ficha elegida. Si el nombre ya existe, se unen. En «Cambiar horario», el nombre nuevo pasa también a las faltas, las fechas, las reglas propias y el horario de antes.

### Hecho el 16/11 (noche): el resto de la Fase 1

- **Tres pestañas: Hoy · Faltas · Ajustes.** Faltas hace también de Resumen; el simulador está dentro de Hoy.
- **Faltas (1.3).** Cada asignatura con «te quedan X h», «llevas Y %» y sus barras, la más justa arriba. Al tocarla salen sus faltas por día, con «Justificar» y «Borrar» (con «Deshacer»). Justificar una falta concreta: 3 toques. Elige trimestre. «Apuntar otro día» (cualquier día del curso, nunca un festivo) y «Pasar mi lista».
- **Ajustes (1.4).** Horario, Asignaturas, Reglas de faltas, Calendario, Pasar mi lista, Pásalo a tu clase, Tu cuenta, Ponla en tu pantalla de inicio, Aviso legal y Borrar todo. Cambiar el horario, las reglas, el calendario o pasar más faltas usa **los mismos pasos del alta**, sin barra de pasos y volviendo a Ajustes. El horario pregunta «¿Desde cuándo vale?» (desde hoy, otro día o desde siempre): con «desde hoy», las faltas de antes siguen con el horario de antes.
- **Fallo 7 en la v2, arreglado.** Abrir el horario y guardarlo sin tocar lo cambiaba si un día tenía recreo y otro no (el viernes de 17:00 a 19:00 pasaba de 2 h a 3 h). Con prueba.
- **PROJ por clase (1.5).** Ajustes → Asignaturas → PROJ → «¿Sus clases cuentan dentro de otra asignatura?»: cada hora elige su módulo (E.CLI, CTR, DAW…). Las horas y las faltas de esa hora cuentan en ese módulo, y en Hoy salen dentro de su tarjeta («incluye PROJ»). Se conserva al cambiar el horario.
- **Mitad de curso (1.11).**
  - En el alta, tras el horario: «¿Tu horario cambia durante el curso?» (un toque si no). Si dices que sí, al acabar te lleva a Ajustes → Asignaturas.
  - Por asignatura: «Empieza el…», «Acaba el…» y «Mientras no empieza, sus horas son de…». Fuera de su periodo no tiene horas ni margen; en Hoy sale «Empiezan más tarde: Sistemes (8 ene)».
  - Semanas con otro horario (Ajustes → Horario): del día X al Y todo es de una asignatura.
  - Regla propia por asignatura (por ejemplo, el proyecto al 10 %).
  - Todo viaja en la plantilla del grupo: el compañero lo ve en «¿Es este tu horario?» («con sus casos especiales»).
  - Pruebas de los cuatro casos (módulo que empieza en el 2º trimestre, semana de proyecto, curso que acaba en marzo, reparto de PROJ): el margen nunca sale de más.
- **Simulador (1.6).** Botón «Simular» en Hoy: los próximos 10 días de clase y «Tendré justificante». No apunta nada.
- **Enlace de clase (1.7).** Ajustes → Pásalo a tu clase: el enlace lleva instituto, ciclo y turno, nunca faltas ni horario. El compañero cae en «¿Es este tu horario?». Si quien lo abre ya usa NoVoy, ve «Ya usas NoVoy» y no se le toca nada (fallo 1).
- **Cuenta (1.8).** Crear (usuario de frutas, requisitos de la contraseña en vivo), guardado automático y cifrado, «Ya tengo cuenta» en la primera pantalla del alta para recuperar en otro móvil, cerrar sesión y **borrar la cuenta** del servidor. A la semana de uso, Hoy propone guardarla (una vez, con «Ahora no»).
- **Aviso legal (1.9).** Página `legal.html` y una línea al acabar el alta: «La cifra oficial es siempre la de tu centro» y qué datos salen del móvil. **Espera tu visto bueno.**

### Hecho el 16/11 (tarde): tareas 1.1 y 1.2

- **Pantalla Hoy nueva** en la dirección principal de la v2. El semáforo solo mira las clases que aún no has apuntado, así que ya no cuenta dos veces lo de hoy (fallo 4). Nombra la asignatura más justa (fallo 15). Si te has pasado dice «te pasas X h», nunca «0 h» (fallo 9). Con dos límites: «Solo con justificante» y dos barras con su nombre. Debajo, «Comprobado con tu lista hace X días» (cuenta desde el día que pegaste tu lista en el alta).
- **«Fui» y «Falté» en cada asignatura** (lo que pediste): «Fui» en verde. Tras «Fui», la tarjeta deja de enseñar lo que pasaría si faltas y enseña lo que tienes ahora: «Fuiste · te quedan X h · llevas Y %» y «Llevas A h de B h que puedes faltar». Con 2 h o más ese día: «Fui», «Falté 2 h» y «Solo a las 15:00 / 16:00». Todo con «Deshacer», y «Cambiar» o «Quitar» después.
- **«Falté todo el día»** (1 toque) y **«Falté a…»**: lista de las clases del día, un toque por clase, horas sueltas en bloques de 2 h o más, «Llegué tarde a una», «Tengo justificante», y una fila de días para apuntar un día pasado. Lo que no marcas queda como «fui». Un día entero en 3 toques. Solo salen días con clase: ni festivos ni fuera de curso (fallo 5).
- **«El viernes, ¿fuiste a todo?»**: pregunta por los días de la última semana sin nada apuntado, saltando festivos.
- **Resumen, Faltas y Ajustes** abren la v1 (`clasica.html`) hasta las tareas 1.3 y 1.4. Los enlaces antiguos de clase o de copia también van ahí.

### Hecho el 16/11 (tarde)

- **Volver a pegar la lista ya no suma encima.** Al repetir la lectura salían 82 h con justificadas que no existían: era la primera lectura, la del fallo, sumada a la nueva. Ahora una lectura nueva sustituye a la anterior del mismo día, asignatura y tipo. Hay una prueba con ese caso.
- **Fichas de asignatura nuevas en «Pinta tu horario»:**
  - Ya no se repiten: un mismo módulo con dos nombres sale una vez.
  - Tienen una cruz en la esquina para quitarlas, junto con sus casillas, y un aviso con «Deshacer».
  - Tienen la forma de las casillas del horario, con la sigla en grande y el nombre completo debajo.
  - Cada asignatura conserva su color.
- **Horario desde una captura.** Salía «undefined a undefined · 4 clases» y no se podía seguir: el lector y el alta llamaban distinto a las horas de cada fila. Arreglado; si las horas no se leen bien, se piden antes de pintar. Hay un recorrido nuevo en Chrome con el formato real del lector.
- **Tu horario real recibido.** El martes a las 9:00 está vacío, pero iEduca pone DAW a esa hora el 3/11. Por eso DAW daba 3 h en vez de 4.

### Lo que todavía puede dar un número equivocado

1. La fórmula (horas semanales × 33) no se ha comparado con el porcentaje que da ningún centro.
2. El límite por RA se calcula por trimestre (aproximado).
3. La vaga se cuenta como falta sin justificar mientras no se sepa cómo la cuenta cada centro.
4. En tu centro, las horas de PROJ cuentan dentro de E.CLI, CTR o DAW según el profesor. Ya se puede repartir hora a hora, pero **tienes que ponerlo tú** en Ajustes → Asignaturas → PROJ. → tarea 1.5
5. Módulos y proyectos que empiezan a mitad de curso: resuelto (1.11), pero solo si el alumno lo indica. Quien diga «No, es igual todo el curso» sin serlo tendrá margen de más.

## 2. Hacia dónde vamos

| Hito | Qué significa | Cuándo se da por hecho |
| --- | --- | --- |
| **H1 · La v2 sustituye a la v1** | Alta, Hoy, Faltas y Ajustes nuevos, publicados en la dirección de siempre | Tú dices «publica» tras probarla una semana con tus faltas reales |
| **H2 · Tu clase la usa** | 5–8 compañeros de 2º DAW con sus datos | El 40 % responde «¿Has faltado hoy?» 3 días por semana en la semana 4 |
| **H3 · El número es fiable** | La cifra de NoVoy coincide con la del centro | 3–4 alumnos de centros distintos: diferencia de ≤ 1 h por módulo |
| **H4 · Tu instituto** | Otros ciclos de Pedralbes, con plantillas confirmadas | Al menos 3 grupos con plantilla confirmada por 3 alumnos |
| **H5 · Cataluña** | Cualquier FP catalana entra en menos de 5 min | La mitad de las altas llegan con enlace de clase |

Decidido el 15–16/11: sin acuerdos con centros, sin servidor de pago y sin leer las plataformas del centro con la contraseña del alumno.

## 3. Lista de tareas

### Fase 0 · Ahora mismo (tú, unos 15 min)

| # | Tarea | Quién | Estado | Cómo | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Bloquear publicaciones rotas | Tú | ✅ 16/11 | Comando de compilación en Cloudflare Pages: `( [ ! -f tests/run.js ] \|\| node tests/run.js ) && mkdir -p dist && cp -r site/* dist/ && cp worker/_worker.js dist/ && sed -i "s#__SITE__#https://novoy-72h.pages.dev#g" dist/index.html` (salida: `dist`) | `v2` y `main` compilan en verde |
| 0.2 | **Enlazar el KV `CUENTAS` a la vista previa** (sin esto, en la v2 no van ni la cuenta ni las plantillas: «El servidor de cuentas no está listo», visto el 17/11) | Tú | ⬜ | Cloudflare → Workers y Pages → novoy → Configuración → Enlaces → **Vista previa** → Añadir → Espacio de nombres KV: variable `CUENTAS`, el mismo espacio que producción. Después, volver a desplegar la última de `v2` | Crear cuenta funciona en la v2, y al repetir el alta en una ventana privada sale «¿Es este tu horario?» |
| 0.3 | Repetir tus faltas con el lector arreglado | Tú | 🟡 | Arreglado el 16/11. Tú: pinta el martes a las 9:00 (DAW si lo es), luego en la revisión pulsa «Empezar de nuevo» y vuelve a pegar tu lista de iEduca | Salen 35 h sin justificar, 0 justificadas, 4 h de vaga y 9 retrasos (DAW: 4 h) |
| 0.4 | Mandar tu horario real pintado | Tú | ✅ 16/11 | Recibido. Hallazgo: el martes a las 9:00 está vacío | — |

### Fase 1 · Terminar la v2 y publicarla (Claude, 3 sesiones) → H1

| # | Tarea | Quién | Estado | Cómo | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Pantalla Hoy nueva | Claude | ✅ 16/11 | Semáforo con su tono; una tarjeta por clase de hoy con «si faltas, te quedan X h»; dos barras si hay dos límites; «Solo con justificante»; «Comprobado hace X días»; % como dato secundario | Recorrido en Chrome; no repite los fallos 4, 9 y 15 de la v1 |
| 1.2 | «Falté a…» y «Todo el día» (más «Fui» por clase, pedido el 16/11) | Claude | ✅ 16/11 | Solo las clases de hoy (o de un día pasado), un toque por clase, retraso, deshacer | 3 toques como máximo para un día entero; no deja apuntar en festivos ni fuera de curso (fallo 5) |
| 1.3 | Faltas: lista, corregir y justificar | Claude | ✅ 16/11 | Agrupadas por asignatura; pasar a justificada con un toque; borrar con deshacer | Encontrar y justificar una falta concreta en ≤ 3 toques |
| 1.4 | Ajustes v2 | Claude | ✅ 16/11 | Cambiar reglas (mismo flujo de ramas), días de libre disposición, festivos, trimestres, horario («¿desde cuándo vale?»), módulos que no cursas, pasar más faltas | Cambiar una regla sin rehacer el alta; una prueba demuestra que el horario no se rompe al guardar sin tocar (fallo 7) |
| 1.5 | Repartir PROJ entre módulos | Claude + Tú | ✅ 17/11 rehecho como «semanas de proyecto»; falta que marques las tuyas | En Ajustes y en el alta: «Esta clase cuenta dentro de…» por bloque del horario. Tu caso: PROJ de Álvaro → E.CLI; PROJ de Pol → 1 h E.CLI y 1 h CTR; PROJ de Ermengol → DAW | Tus totales coinciden con tu hoja de Notion |
| 1.6 | Simulador dentro de Hoy | Claude | ✅ 16/11 | Selector de fecha y «Tendré justificante» | Decisión del autor: se conserva |
| 1.7 | Enlace de clase nuevo | Claude | ✅ 16/11 | «Pásalo a tu clase» lleva centro, ciclo y turno: el compañero cae directo en «¿Es este tu horario?». Nunca toca las faltas de nadie | Sustituye al enlace de la v1 que borra faltas (fallo 1) |
| 1.8 | Cuentas y copia en la v2 | Claude | ✅ 16/11 | Reutilizar `acct.js`; aviso para guardar la cuenta tras una semana de uso | Restaurar en otro móvil con usuario y contraseña |
| 1.9 | Aviso legal mínimo | Claude + Tú | 🟡 Escrito; falta tu visto bueno | Una línea en el alta y una página: «La cifra oficial es la de tu centro», qué datos salen del móvil y cuáles no | Tú lo apruebas |
| 1.10 | Publicar | Claude | ⬜ | Fusionar `v2` en `main` cuando tú digas «publica»; la v1 queda en `v1-novoy` | La dirección de siempre abre la v2 y tus datos siguen ahí |
| **1.11** | **Normas de proyectos y módulos que empiezan a mitad de curso** (pedido el 16/11) | Claude | ✅ 16/11 | Ver el detalle debajo de esta tabla | Pruebas con los 4 casos; en tu caso, PROJ y E.CLI dan lo mismo que tu Notion |

**Cómo se hace la 1.11.** El motor de la v1 ya tiene la base (`disabled` con fecha, `project` con semanas propias, `periods` e `history`). Hay que comprobar con pruebas que hace bien el recuento, conectarlo a la v2 y hacerlo fácil de entender:

1. **Pregunta en el alta**, con un solo toque si no aplica, después de pintar: «¿Alguna asignatura empieza más tarde o solo dura unas semanas?» → No / Sí.
2. **Si dice «Sí», cada asignatura afectada elige uno de tres casos:**
   - **«Empieza el…»:** fecha o trimestre, y quién da esas horas mientras tanto.
   - **«Solo unas semanas»:** semanas de proyecto con su propio horario, en las que el horario normal se suspende.
   - **«Acaba el…»:** por ejemplo, la estancia en empresa.
3. **Las normas de esa asignatura se aplican solo a su periodo:**
   - su total = sus horas reales en ese periodo;
   - su límite = el % de ese total;
   - en Hoy no sale hasta que empieza;
   - antes de empezar, una línea: «Empieza el 30/11».
4. **Una regla propia si el centro la tiene:** por ejemplo, el proyecto con otro % o con todas las faltas contando. Se reutiliza el flujo de ramas de las reglas, por asignatura.
5. **Plantilla de clase:** estas normas viajan en la plantilla del grupo, para que los compañeros solo confirmen.
6. **Pruebas:**
   - módulo que empieza en el 2º trimestre;
   - semana de proyecto;
   - curso que acaba en marzo por la estancia;
   - tu reparto de PROJ.

   En los cuatro, el margen nunca sale de más.

### Fase 2 · Probar con personas (tú + Claude, 1–2 semanas) → H2 y H3

| # | Tarea | Quién | Estado | Cómo | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Configurar tú la plantilla de tu clase | Tú | ⬜ | Alta completa con tu horario y reglas confirmadas | Tus compañeros solo confirman |
| 2.2 | 5–8 compañeros con cronómetro | Tú | ⬜ | Les pasas el enlace; mides cuánto tardan y dónde dudan, sin ayudarles | Tiempos y atascos apuntados (te doy una plantilla) |
| 2.3 | Comparar con la cifra del centro | Tú | ⬜ | Para 3–4 alumnos, de otros centros si puedes: % que da su plataforma frente al de NoVoy | Diferencia ≤ 1 h por módulo, o sé qué corregir en la fórmula |
| 2.4 | Arreglar lo que salga | Claude | ⬜ | Una sesión con tus notas | Los atascos repetidos desaparecen |
| 2.5 | Listas reales de otras plataformas | Tú | ⬜ | Pide a 2–3 amigos de otros centros que peguen su lista (o que te la pasen tapando el nombre) | El lector entiende Clickedu, Alexia y Moodle reales |

### Fase 3 · Mantener las faltas al día → H2

| # | Tarea | Quién | Estado | Cómo | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Aviso diario «¿Has faltado hoy?» | Claude | ⬜ | Notificación web desde el Worker con tarea programada; al acabar la última clase; botones «Todo el día» y «Falté a…» en Android; sin sonido. El servidor solo guarda la hora y los días lectivos | Llega solo en días de clase; en iPhone requiere la app instalada |
| 3.2 | Aviso de módulo en rojo | Claude | ⬜ | Una vez, la noche antes de un día con un módulo en rojo y comprobación vieja | Como mucho 1 aviso extra |
| 3.3 | Comprobar con una captura | Claude | ⬜ | Captura o lista pegada de la asistencia → comparar con lo apuntado → «3 nuevas · 1 ahora justificada · 1 dudosa». Reutiliza el lector de faltas | Las faltas que coinciden pasan a «verificado» |
| 3.4 | «Comprobado hace X días» | Claude | ⬜ | Si pasan más de 7 días y un módulo está cerca del límite, pasa a ámbar | El error cae siempre del lado estricto |

### Fase 4 · Vigilancia con IA (apuntado el 16/11)

| # | Tarea | Quién | Estado | Cómo | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Avisos anónimos desde la app | Claude | ⬜ | Errores de JavaScript, pantalla donde se abandona, lo que entra por «Otro» y la **forma** de las líneas que el lector no entiende (nunca el texto). Límite por móvil. 3–4 h | Una prueba demuestra que no sale ningún dato personal |
| 4.2 | Botón «No me sale lo que necesito» | Claude | ⬜ | El alumno escribe en una frase qué le falta; se guarda como aviso anónimo | Llega a la revisión semanal |
| 4.3 | Revisión semanal automática | Claude | ⬜ | Tarea programada: leo los avisos, reproduzco, arreglo con prueba y subo a `v2`; te llega un resumen | Nunca se publica en `main` sin tu «publica» |

### Fase 5 · Crecer → H4 y H5

| # | Tarea | Quién | Estado | Cómo |
| --- | --- | --- | --- | --- |
| 5.1 | Más ciclos en el catálogo | Claude | ⬜ | Primero los que más entren por «Otro» (los avisos lo dirán) |
| 5.2 | Lista oficial de ciclos por centro | Claude | ⬜ | CSV anual del Departament servido como JSON propio. Permitiría quitar de la paleta los módulos del otro curso |
| 5.3 | Festivos locales de 2027 | Claude | ⬜ | Se publican en diciembre: la app vuelve a consultarlos en enero y avisa si cambian |
| 5.4 | Calendarios de centros desde sus PDF | Tú + Claude | ⬜ | Antes: revisar a mano 20 centros con FP; si 6 o más publican calendario, script (8–12 h) |
| 5.5 | Horas de cada RA | Claude | ⬜ | «Otra forma» con las horas por RA, compartidas en la plantilla del grupo |
| 5.6 | Catalán | Claude | ⬜ | Sacar los textos a un archivo y traducir |
| 5.7 | Anuncio y difusión | Tú | ⬜ | Anuncio «Noir y luz verde» (30 y 15 s) y grupos de clase, cuando H2 esté cumplido |
| 5.8 | Cambio de curso en septiembre | Claude | ⬜ | «¿Mismo centro, curso siguiente?» heredando lo que se pueda |

### Limpieza (Claude, cuando toque)

| # | Tarea | Estado |
| --- | --- | --- |
| L.1 | Retirar el despliegue de Netlify y corregir el README | ⬜ |
| L.2 | Quitar de la v2 el código de la v1 que ya no se use (`setup.js`, editor avanzado) | ⬜ |
| L.3 | Versión del service worker automática en cada despliegue | ⬜ |
| L.4 | `wrangler.toml` para que la configuración de Cloudflare esté en el repositorio | ⬜ |
| L.5 | Decidir si el repositorio sigue siendo público | ⬜ (pregunta para ti) |
| L.6 | Al publicar la v2, quitar del comando de Cloudflare el «si existe» de las pruebas | ⬜ |
| L.7 | Paleta del alta: mostrar primero los módulos del curso que se deduce de lo pintado | ⬜ |

### Aparcado o descartado

| Idea | Estado | Motivo |
| --- | --- | --- |
| Leer la plataforma del centro con la contraseña del alumno | Descartado (16/11) | Contraseñas de menores, condiciones de uso, verificación en dos pasos |
| Pactar con centros | Aparcado (16/11) | El autor cree que no apoyarían la app |
| IA en el servidor para leer capturas | Aparcado | El lector local ya funciona; revisar si las pruebas con personas lo piden |
| App nativa o tiendas de apps | Aparcado | Coste |
| Ganar dinero | Aparcado | Nunca de los alumnos ni con anuncios; revisar tras H4 |

## 4. Decisiones pendientes tuyas

1. Vaga: ¿cómo la cuenta tu centro? Hoy se cuenta como falta sin justificar, y se puede quitar.
2. ¿El repositorio sigue público? Tiene informes de pruebas dentro.
3. ¿Catalán antes o después de publicar?
4. ¿Quién mantiene NoVoy en junio y septiembre?
5. Para la 1.11: en tu centro, ¿hay algún módulo de 2º que empiece en el 2º o 3º trimestre, o semanas de proyecto sin horario normal? ¿Y el PROJ tiene una norma de faltas propia? (La app ya lo admite: dime o ponlo tú en Ajustes.)
6. **Aviso legal (1.9):** lee `legal.html` en la v2 y dime si lo apruebas o qué cambiar.
7. **Publicar (1.10):** cuando lo hayas probado con tus faltas reales, di «publica».
8. **Proyectos:** resuelto el 17/11 (semanas de proyecto con un toque). Falta saber si en otros centros funciona igual.

## 5. Cómo trabajamos

1. **Una conversación nueva por objetivo**, dentro del proyecto «novoy». Claude empieza leyendo el índice, las decisiones y esta hoja de ruta.
2. **Cada sesión termina con una prueba de 10 minutos para tu móvil** en v2.novoy-72h.pages.dev.
3. **Cuando algo falle, manda** la pantalla, qué esperabas, qué ha pasado y una captura. Con datos reales (como tu lista de iEduca) se encuentran los fallos que las pruebas no ven.
4. **Nada llega a la app publicada sin que digas «publica».**
5. **Ritmo semanal:** una sesión de construir, 20 min de probar y 10 min enseñándola a 1–2 compañeros.
6. **Tus datos reales nunca se suben al repositorio,** que es público. Las pruebas usan datos inventados.

## 6. Próximas sesiones

| Sesión | Tareas | Mensaje para empezar |
| --- | --- | --- |
| Siguiente | Arreglar lo que encuentres al probar, aprobar el aviso legal y publicar (1.9 y 1.10) | «Fase 1: publicar» (y lo que hayas visto) |
| Después | Fase 2: probar con 5–8 compañeros con cronómetro | «Fase 2: prueba con la clase» |

**Prueba para tu móvil (unos 15 minutos)** en v2.novoy-72h.pages.dev (entras directo en Hoy):
1. **Tu PROJ:** quita las fichas «PROJ de cada profe» en Cambiar horario y pinta el módulo normal. En Faltas, las que queden sueltas: «Pasarlas a su clase». Luego Ajustes → Horario → activa las semanas de proyecto y toca las que lo han sido. Mira en Faltas si cuadra con tu Notion.
2. **Faltas:** toca una asignatura, justifica una falta y deshazlo.
3. **Simular:** en Hoy, «Simular», elige un día y activa «Tendré justificante».
4. **Cambiar horario:** Ajustes → Horario → Cambiar horario → Siguiente → «Desde siempre» → Guardar. No debe cambiar nada.
5. **Cuenta:** créala en Ajustes → Tu cuenta. En otra ventana privada, «Ya tengo cuenta» y entra: deben salir tu horario y tus faltas.
6. **Pásalo a tu clase:** abre el enlace en una ventana privada: debe salir «¿Es este tu horario?».
7. **Lee el aviso legal** (Ajustes → Aviso legal y privacidad).
