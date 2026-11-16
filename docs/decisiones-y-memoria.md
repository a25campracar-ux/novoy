# NoVoy · Decisiones y memoria del autor

Todo lo que C33 ha decidido, pedido o contado sobre NoVoy, en orden. Solo recoge lo
que él ha dicho; el análisis y las recomendaciones están en `estado-y-traspaso.md`.
Las decisiones nuevas se añaden al final con fecha.

## Origen

- Empezó con un sistema en Notion para seguir sus faltas por asignatura y trimestre
  (2º CFGS DAW, Institut Pedralbes), con dos bases de datos: «Asignaturas por trimestre»
  y «Faltas».
- Su calendario: 1r trimestre 14/09–27/11/2026, 2n 30/11/2026–05/03/2027, 3r 08/03–26/05/2027.
- En su centro no puede superar el 25% de faltas por asignatura o suspende.
- En su centro hay un único porcentaje que incluye justificadas y no justificadas:
  las justificadas cuentan igual.
- En su centro el límite se calcula por módulo y por trimestre.
- Los PROJ los dan tres profesores distintos; no sabe si cuentan como una asignatura o
  tres. Reparto en semanas normales: PROJ (Álvaro) cuenta como E.CLI; PROJ (Pol), una
  hora E.CLI y otra CTR; PROJ (Ermengol) cuenta como DAW.
- Quiso una web que pudieran usar compañeros de cualquier instituto, construida con
  Claude sin tocar él el código, supervisando.

## Producto y distribución

- Nombre: NoVoy (antes «¿Puedo faltar?»). Lo eligió porque se puede escribir a mano
  como ambigrama; no hace falta que el logo lo sea.
- Web instalable y gratuita. Tiene Mac, pero no quiere pagar cuentas de Apple o Google.
- Publicada primero en Netlify (novoy.netlify.app) y después en Cloudflare Pages
  (novoy-72h.pages.dev), conectada al repositorio a25campracar-ux/novoy.
- Quiere que los cambios se suban con push a GitHub desde la conversación.
- Más adelante: versión nativa y aviso a las 21:00–21:30 solo si mañana toca una
  asignatura en rojo.
- Le interesa que cada usuario pueda configurar y actualizar faltas con su propia IA.

## Cuentas

- Sin correo: «es agresivo y da palo».
- Usuario y contraseña. Usuario aleatorio de frutas encadenadas («PlatanoMelon34»).
- Contraseña con tres requisitos: más de 8 caracteres, una mayúscula y un número.

## Promoción

- Difusión orgánica por grupos de clase, con enlace que lleva el horario configurado.
- Anuncio animado, estilo «Noir y luz verde», chaval de pelo largo rizado y esponjado.
  Gancho: lunes a las 7:00 con resaca; NoVoy dice «puedes faltar».
- Lema: «Con NoVoy, hoy no voy.» Versiones de 30 y 15 segundos. Voz en off grave y
  cálida, generada con ElevenLabs.

## Configuración (primeras decisiones)

- Rápida y universal: el horario suele estar en el Moodle y cada centro es distinto.
- Empezar por la rejilla de pintar y un calendario con plantilla.
- Un único campo para crear módulos (Enter crea uno sin cerrar el teclado).
- Preguntas de sí/no que muestran opciones solo si hacen falta (semanas de proyecto,
  asignaturas bloqueadas hasta mitad de curso).
- Poder marcar en cualquier momento semana de proyecto o festivo.
- Apuntar una falta tocando la asignatura en la rejilla: 1 h por defecto, fecha
  editable, justificada y retraso.
- Casi nadie sabe las horas oficiales de cada módulo.

## 13/11/2026 · Rediseño

- Objetivo: configurar el curso en unos 2 minutos, preguntando lo mínimo necesario.
- Usar los datos publicados de Cataluña (centros, ciclos, módulos) para no preguntar.
- Siempre una opción «Otro» (centro, ciclo o curso, módulo) para que nadie quede fuera.
- «Otro» comprueba mientras se escribe si ya existe en el catálogo; si no existe, entra
  con doble verificación, y los datos se guardan siempre.
- La foto con IA siempre ofrecida y visible.
- Flujo ordenado, claro y directo.
- Quitar la pregunta del curso (se deduce de los módulos).
- Flujo acordado: demo → centro → ciclo → horario (foto principal, pintar secundario)
  → revisar → faltas que ya lleva → resultado.
- Criterios acordados:
  - denominador = horas del horario × semanas del curso; el catálogo, solo como comprobación;
  - lo provisional pasa al catálogo compartido con una segunda confirmación;
  - registrar de forma anónima lo que entra por «Otro»;
  - foto con cuota y, si falla, pasar a pintar sin mostrar el error;
  - primero el catálogo a mano de Pedralbes DAW, después el directorio por API y el resto a demanda;
  - validar con el tutor la unidad de cálculo y si cuenta la tutoría.

## 13/11/2026 · Interfaz

- Lo más importante: interfaces muy intuitivas, entendibles y simples. De un vistazo se
  entiende qué se puede hacer y qué hay que hacer.
- Títulos clave, directos y muy descriptivos. Poco texto, escogido para que lo entienda
  «hasta un niño, hasta un tonto».
- Pidió hacer las ocho mejoras propuestas, guardar la versión anterior en otra rama
  (`v1-novoy`) y subir la nueva al acabar.
- Volver a poner el simulador.
- El porcentaje es importante: mostrarlo como dato secundario.

## 13–14/11/2026 · Funciones

- Guiar mejor paso a paso, aunque sea solo la primera vez.
- Opciones de porcentaje para justificadas y para no justificadas. Hay centros con un
  porcentaje para cada una y otros donde las justificadas no cuentan.
- La app debe poder calcular por módulo y trimestre y por módulo y curso entero.
- Tutoría: dejarla como está (se excluye sola y se puede cambiar).
- Catálogo: Pedralbes DAW más el directorio de centros.
- Comprobar que la fórmula que funciona esté implementada.
- Configuración con IA: un prompt que haga una encuesta preguntando todo lo necesario y
  devuelva un JSON.
- Paso a paso mejor explicado, sin saturar.
- Una descripción de cuándo usar cada vía (a mano, foto o IA): «que la web decida por ti».
- Cargar las faltas también con un prompt para la IA, explicado como a un niño: copia
  las faltas del Moodle, pégaselas a la IA.

## 14/11/2026 · Pruebas y traspaso

- Pidió cinco probadores simulados, todos distintos, cada uno con su centro, curso,
  módulos, horas, porcentajes y faltas desde septiembre, para saber en qué flojea la
  app, qué fallos tiene y qué mejoras caben.
- Pidió guardar los informes y un estado completo para entregar a un diseñador de
  software, de UI/UX y desarrollador senior que tome el control, con todas las ideas
  y más.
- Pidió un prompt para que otra IA, con rol de desarrollador y diseñador, haga un
  análisis total y prepare un rediseño «como piensa una empresa de desarrollo profesional».

## 15/11/2026 · Proyecto

- Pidió que toda la memoria y los archivos sobre la app permanezcan en el proyecto
  «novoy», bien apuntados.

## 15–16/11/2026 · Faltas al día, avisos y centros

- Propuso leer la web o plataforma donde los profesores anotan las faltas para que
  NoVoy se actualice solo. Quiere que actualizar las faltas cueste segundos o minutos;
  lo importante es mantenerlas al día.
- No quiere que la app avise mucho: una sola notificación al día, discreta,
  «¿Has faltado hoy?», con botones «Sí, todo el día» y «Falté a…».
- Pidió un mockup para ver la idea: aviso diario, «Falté a…», Hoy, actualizar con
  captura y activar el aviso (https://claude.ai/artifact/NUPztnjbkyAuREcXd1raFj).
- Considera que lo más importante es el método de configuración de horario,
  calendario y porcentajes.
- Descarta, de momento, pedir acceso o pactar nada con ningún centro: cree que no
  apoyarían una app para ver si puedes faltar.

## 16/11/2026 · Método de configuración

- Quiere simplificar al máximo el alta de horario y calendario, sin que el usuario
  tenga que ir cambiando de app.
- Aceptó como base el método de `metodo-configuracion.md`:
  - calendario desde datos oficiales (calendario escolar y festivos por municipio);
  - plantillas de horario por grupo que confirman los compañeros;
  - captura elegida de la galería dentro de la app;
  - flujo de 5 pasos.

  Pidió el mockup de ese flujo.
- Pidió que las reglas admitan cualquier método de porcentaje, con ejemplos reales:
  - 20 % contando solo las no justificadas;
  - 25 % contando justificadas y no justificadas;
  - 10 % no justificadas y 15 % justificadas.

  Y un flujo fácil de hacer y de entender. Considera que, con esto bien hecho, la app
  estaría casi lista.
- Las unidades formativas ya no se llaman así: ahora son RA.
- Las horas totales de cada trimestre se calculan con el horario semanal y el
  calendario del curso.
- Flujo de reglas con ramas: según la respuesta de la primera pantalla, se va a una
  pantalla distinta.
  - Si cuentan todas juntas: un solo porcentaje, ya preparado para contar sin justificar y justificadas.
  - Si solo cuentan las no justificadas: un solo porcentaje con esa opción ya activada.
  - Si son dos porcentajes: los dos.

  El resto del flujo le parece bien.
- «No lo sé» usa el 15 % (sustituye al 20 % por defecto decidido el 13/11).

## 16/11/2026 · Versión 2

- Aceptó rehacer la interfaz desde cero reutilizando lo que sirve (motor `core.js`,
  cifrado `acct.js`, servidor `worker/`), en la rama `v2`, sin tocar la v1 publicada.
- Él no escribe ni revisa código: lo hace Claude. Por eso se elige Preact + htm (un
  archivo, sin compilar) en vez de Vue.
- Dio luz verde al paso 1: pruebas con datos inventados y motor con reglas de 1 o 2
  límites.
- Pidió hacer el alta y las reglas «como es debido, de forma profesional». Hechas en la
  rama `v2` (ver `metodo-configuracion.md`, apartado «Cómo está hecho»). La interfaz se
  hizo sin librerías porque en esa sesión no había red para descargar Preact.
- Para las faltas previas quiere poder copiar y pegar, hacerlo con una IA o con foto:
  desde septiembre mucha gente lleva muchas faltas y a mano es demasiado. Hecho
  (apartado «Faltas de antes» de `metodo-configuracion.md`).

## 16/11/2026 · Pruebas con sus datos y lista de tareas

- Probó el lector con su lista real de iEduca (no se guarda en el repositorio). Contó
  que en esa lista no hay ninguna falta justificada; al repetir la lectura salían 82 h
  con justificadas. Corregido: una lectura nueva sustituye a la anterior.
- Pidió apuntar en la lista de tareas una IA que vigile errores y avisos y construya lo
  que le falte a un usuario para configurar su caso (Fase 4 de `hoja-de-ruta.md`).
- Pidió una lista de tareas completa: dónde estamos, hacia dónde vamos, qué falta, qué
  hacer y cómo (`hoja-de-ruta.md`).
- Puso las pruebas antes de publicar en Cloudflare (comando de la tarea 0.1).
- Mandó su horario pintado: el martes a las 9:00 está vacío.
- No le gustaban las burbujas de asignaturas del alta:
  - había demasiadas repetidas;
  - quiere un circulito con una cruz en una esquina para borrar más fácil;
  - quiere otra forma, más cómoda y original que el óvalo.

  Hecho: fichas con la forma de las casillas del horario, sin repetidas, con cruz y «Deshacer».
- Pidió que la app pueda aplicar las normas de los proyectos y de los módulos que
  empiezan a mitad de curso. Apuntado como tarea 1.11 de `hoja-de-ruta.md`.
- Subió una captura de su horario: salía «undefined a undefined» y no avanzaba.
  Corregido el 16/11 (el alta no leía las horas que da el lector de capturas).

## 16/11/2026 · Pantalla Hoy (tareas 1.1 y 1.2)

- Pidió en cada asignatura de hoy dos opciones: «Falté» y «Fui», con «Fui» en verde,
  para marcar que asistió.
- Tras pulsar «Fui», la tarjeta no debe enseñar lo que pasaría si faltase, sino el
  porcentaje y el margen que tiene ahora mismo.
- Hecho así; con 2 h o más de una asignatura ese día se añade «Solo a las…» para
  faltar a una hora suelta.

