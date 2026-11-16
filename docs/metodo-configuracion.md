# NoVoy · Método de configuración de horario, calendario y reglas

16/11/2026. Es la propuesta que aceptó el autor y ya está construida en la rama `v2`. Mockup: filas 2 (alta) y 3 (reglas) del lienzo https://claude.ai/artifact/NUPztnjbkyAuREcXd1raFj

## Principio

Una persona configura por grupo; los demás confirman. El calendario sale de datos oficiales; el horario lo construyen los alumnos al usar la app. El alumno no sale de NoVoy salvo, como mucho, una vez para hacer la captura del horario.

## Dónde vive cada dato

| Dato | Ámbito | Fuente | Qué hace el alumno |
| --- | --- | --- | --- |
| Inicio, fin, vacaciones | Cataluña | Ordre EDF/66/2026 (cursos 26-27, 27-28, 28-29) | Nada |
| Festivos locales | Municipio | Datos abiertos Generalitat, dataset b4eh-r8up | Nada (o añadir los que falten) |
| 4 días de libre disposición | Centro (a veces municipio, por acuerdo del consejo municipal) | Primer alumno del centro | Confirmar |
| Inicio y fin de la FP, trimestres | Centro | Catálogo, primer alumno o propuesta (marcada «revísalo») | Confirmar |
| Porcentaje y reglas | Centro | Primer alumno del centro | Confirmar |
| Horario | Grupo (centro + ciclo + turno; hasta 3 versiones, se elige) | Primer alumno: galería, foto o pintar | Confirmar |
| Módulos matriculados | Alumno | Él | Quitar los que no cursa (cruz en la ficha) |
| Módulos o proyectos que empiezan a mitad de curso | Grupo | Primer alumno (pendiente: tarea 1.11) | Confirmar |
| Faltas desde septiembre | Alumno | Lista pegada, capturas, respuesta de una IA o a mano | Revisar y guardar |

No hay acuerdo con los centros (decisión del 16/11/2026): la verificación viene de confirmaciones entre alumnos.

El curso no se pregunta. Si en un mismo centro, ciclo y turno hay horarios de 1º y 2º, salen como «Opción 1 / Opción 2» y el alumno elige el suyo.

## Flujo de alta

1. **«¿En qué instituto estudias?»** Busca en el catálogo y en el directorio oficial. «No está mi instituto» pide nombre y ciudad.
2. **«¿Qué estudias?»** Ciclos del catálogo o «No está mi ciclo». Después, «¿De mañana o de tarde?».
3. **Horario.**
   - **Con plantilla:** «¿Es este tu horario?», con quién lo confirmó. Botones [Sí, es este] y [No, es otro], y «No voy a todos: quitar alguno».
   - **Sin plantilla:** «¿Tienes una captura de tu horario?» → [Elegir de la galería] [Hacer una foto] [Lo pinto yo]. La captura se lee en el móvil. Si no se leen bien las horas, se piden antes de pintar.
   - **Pintar:** hora de inicio, duración de la clase (45–120 min), clases al día y recreo. Se pinta tocando o arrastrando el dedo. Una sesión cuenta 1 h aunque dure 55 min.
   - **Fichas de asignatura** (16/11): tienen la forma de las casillas del horario, con la sigla y el nombre completo. No se repiten: un mismo módulo con dos nombres sale una vez. Tienen una cruz para quitar la asignatura y sus casillas, con «Deshacer», y cada una conserva su color.
4. **Calendario.** Muestra clases, vacaciones, festivos de Catalunya, festivos del municipio, trimestres y días de libre disposición [Los sé] [Ponlos luego].
   - Los festivos locales del segundo año del curso (2027) se publican en diciembre: la pantalla lo avisa y deja añadirlos.
   - «Ponlos luego» no cambia el cálculo. El motor usa 33 semanas por normativa y el calendario tiene más, así que 4 días menos no mueven el total. Queda apuntado como pendiente (`settings.libresPendientes`).
5. **Reglas** (abajo), **faltas de antes** (abajo) y pantalla final con el semáforo de hoy.

Objetivo: menos de 60 s con plantilla; menos de 5 min sin ella.

## Reglas de faltas

### Modelo (en el motor: `settings.limites`)

`limites: [{ pct, sin, just }]`, más `ambito` y `retrasosPorFalta`.

- `sin` y `just` son el peso de cada hora sin justificar y justificada en ese límite: 1 = entera, 0,5 = media, 0 = no cuenta.
- Cada límite tiene su margen: `pct × horas del ámbito − Σ peso × horas`.
- Las horas del ámbito se calculan con el horario semanal y el calendario.

| Caso real | `limites` |
| --- | --- |
| 25 %, cuentan todas | `[{25, sin:1, just:1}]` |
| 20 %, solo sin justificar | `[{20, sin:1, just:0}]` |
| 10 % sin justificar y 15 % justificadas, aparte | `[{10, sin:1, just:0}, {15, sin:0, just:1}]` |
| 10 % sin justificar y 15 % de todas juntas | `[{10, sin:1, just:0}, {15, sin:1, just:1}]` |
| Justificadas cuentan la mitad («Otra forma») | `[{25, sin:1, just:0.5}]` |

### Qué dice el semáforo

- «¿Puedo faltar hoy?» supone que hoy **no** habrá justificante (el lado estricto).
- Si sin justificante no llega pero con justificante sí: «Solo con justificante.»
- El simulador acepta «Tendré justificante».

### Flujo con ramas (decisión del autor, 16/11/2026)

1. **«¿Cómo cuentan las faltas en tu centro?»** → [Todas cuentan igual] · [Solo las que no justificas] · [Un límite para cada tipo] · «No lo sé» (salta a la 3) · «Otra forma».
2. **Según la respuesta:**
   - **2a:** un porcentaje (25 % ya puesto) con [Todas] marcado.
   - **2b:** un porcentaje (20 % ya puesto) con [Solo sin justificante] marcado.
   - **2c:** dos porcentajes (10 % y 15 %) y «¿Ese 15 % es solo de las justificadas, o de todas juntas?».
   - **Otra forma:** un porcentaje y «Cada hora justificada cuenta como media hora».
   - «Otro» deja escribir cualquier porcentaje (acepta coma).
3. **«Dos preguntas más»:** trimestre / curso / RA, y retrasos (No / cada una / 2 = 1 / 3 = 1).
4. **Resumen** en una frase, con la nota de las justificadas, los retrasos y un ejemplo en horas del módulo con más horas. [Sí, es así] [Cambiar algo]. Con reglas de un compañero, solo se ve esta pantalla.

### «No lo sé» (decidido el 16/11/2026)

Todas cuentan juntas y 15 %, marcado «aproximado». No se comparte con la clase.

### Límite por RA

Las horas de cada RA no salen del horario: las fija la programación del módulo. Por ahora se calcula por trimestre y se avisa en ámbar de que es aproximado.

### Proyectos y módulos que empiezan a mitad de curso (pedido el 16/11/2026, sin hacer)

Ahora mismo la v2 cuenta cada módulo desde el primer día del curso, y eso da margen de más.

El plan es la tarea 1.11 de `hoja-de-ruta.md`:

- **Pregunta en el alta:** «¿Alguna asignatura empieza más tarde o solo dura unas semanas?».
- **Tres casos por asignatura:** empieza el…, solo unas semanas, acaba el….
- **Normas solo en su periodo:** su total y su límite se calculan con las horas de ese periodo.
- **Regla propia** si el centro la tiene.
- **Plantilla:** todo esto viaja en la plantilla del grupo.

El motor de la v1 ya tiene la base (`disabled` con fecha, `project`, `periods` e `history`), pero falta comprobarlo con pruebas.

## Faltas de antes (petición del autor, 16/11/2026)

Desde septiembre mucha gente lleva muchas faltas, y contarlas a mano es demasiado. Tras «¿Has faltado alguna vez desde septiembre?» → «Sí»:

1. **«¿Cómo quieres pasarlas?»** → **Copiar y pegar** (lo más rápido) · **Con capturas** (varias a la vez, se leen en el móvil) · **Con una IA** (para listas raras o PDF) · **Contarlas a mano**.
2. **Pegar:** tres pasos («abre tu asistencia», «Seleccionar todo» y «Copiar», «pégalo») y un botón «Pegar lo que he copiado».
3. **IA:** NoVoy genera el mensaje con las asignaturas del alumno y el formato `AAAA-MM-DD ; asignatura ; horas ; falta | justificada | retraso`. Se pega la respuesta, en líneas o en JSON.
4. **Revisión:**
   - Muestra «He encontrado 8 h de faltas», los totales por asignatura y «Ver una por una».
   - Las líneas que no entiende salen siempre, con su motivo («Ese día no tienes Programació», «La fecha no es de este curso», «No sé de qué asignatura es»), y no se cuentan.
   - «Añadir otra lista» suma sin repetir; si una lista vuelve a traer el mismo día, asignatura y tipo, manda la lectura nueva (16/11).
   - Las faltas se guardan con su fecha real.

El lector (`site/v2/importar.js`) no usa IA ni servidor:

- **Fechas:** en castellano, catalán o inglés, con o sin año.
- **Asignatura:** por nombre, abreviatura del catálogo o cabecera de la página.
- **Estado:** por palabra o letra (A, F, J, E, R, L, P). «No justificada» y «Sin justificar» se leen antes que «justificada».
- **Vaga:** cuenta como sin justificar; se puede quitar.
- **Tutoría:** se cuenta aparte.
- **Horas:** por «2 h»; por tramo horario cruzado con el horario; una sola hora = 1 h; si no hay nada, la clase entera (lo seguro). Varias filas de una misma clase (una por hora) se suman, con tope en las horas de esa clase.

## Cómo está hecho (rama `v2`)

| Archivo | Qué hace |
| --- | --- |
| `site/alta.html`, `site/v2/alta.js`, `site/v2/alta.css` | Pantallas del alta, sin librerías ni compilación |
| `site/v2/reglas.js` | Respuestas → `settings.limites`, frases del resumen, ejemplo en horas |
| `site/v2/horario.js` | Franjas con recreo, rejilla ↔ horario del motor, lectura de captura (acepta filas `{s, e}` del lector) |
| `site/v2/calendario.js` | Curso 2026-27, festivos locales (consulta y lectura), trimestres |
| `site/v2/importar.js` | Lector de listas de faltas (pegadas, OCR de capturas, respuesta de IA) |
| `site/v2/estado.js` | Borrador del alta → estado `ft.v2` (el que ya lee la app) |
| `site/shot.js` · `texto()` | OCR de capturas de listas de faltas en el móvil |
| `worker/_worker.js` · `/api/plantilla` | Plantillas de grupo (horario) y de centro (fechas, libre disposición, reglas). Nunca faltas. Versiones con confirmaciones por móvil, validación estricta, 40 escrituras por IP y día |
| `scripts/serve-v2.mjs` | Servidor local con KV en memoria |
| `scripts/e2e-alta.mjs` | Cinco recorridos en Chrome, también en CI (detalle debajo) |
| `scripts/comprobar-festivos.mjs` | Festivos de varios municipios con los datos reales (en CI) |

Los cinco recorridos de `scripts/e2e-alta.mjs`:

1. Primer alumno con lista pegada e IA, quitar ficha y deshacer.
2. Compañero con plantilla.
3. Ramas en oscuro a 320 px.
4. Faltas desde una captura.
5. Horario desde una captura.

Otros detalles de cómo funciona:

- Al terminar se guarda `ft.v2` **sin borrar** faltas, cuenta ni ajustes que ya hubiera.
- Quien abre la app sin configurar va a `alta.html`.
- **Datos reales de festivos comprobados** (CI, 16/11):
  - Columnas: `any_calendari`, `data`, `ajuntament_o_nucli_municipal`, `festiu`.
  - El artículo va detrás del nombre («Hospitalet de Llobregat, l'»).
  - No trae el nombre de la fiesta.
  - Barcelona, Lleida, Girona, Tarragona y L'Hospitalet devuelven su festivo de otoño de 2026; los de 2027 aún no están.
- **OCR comprobado en CI** con una captura de una lista tipo Moodle: «He encontrado 4 h».

## Pendiente

- Probar en un iPhone y un Android reales: galería, cámara, arrastrar en la rejilla, «Pegar lo que he copiado» y capturas de listas reales de Moodle e iEduca. El autor ya probó en iPhone el alta, el pegado de iEduca y la captura del horario.
- Ajustes v2: cambiar reglas, días de libre disposición, festivos y horario sin rehacer el alta.
- Proyectos y módulos que empiezan a mitad de curso (tarea 1.11).
- Script de PDF de centros: antes, revisar a mano 20 centros con FP. Si 6 o más publican calendario, hacerlo (8–12 h).
