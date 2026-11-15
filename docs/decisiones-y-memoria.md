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
- Preguntas de sí/no que muestran opciones solo si hacen falta.
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
- Criterios acordados: denominador = horas del horario × semanas del curso; catálogo
  solo como comprobación; lo provisional pasa al catálogo compartido con una segunda
  confirmación; registrar de forma anónima lo que entra por «Otro»; foto con cuota y,
  si falla, pasar a pintar sin mostrar el error; catálogo a mano de Pedralbes DAW
  primero, directorio por API, resto a demanda; validar con el tutor la unidad de
  cálculo y si cuenta la tutoría.

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
