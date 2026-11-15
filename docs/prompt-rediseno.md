# Prompt para encargar el análisis y el rediseño de NoVoy

Escrito el 14/11/2026. Se pega en una IA junto con `estado-y-traspaso.md`
(y, si la herramienta lo permite, con el repositorio clonado).

```
ROL
Actúas como el equipo de una consultora de producto digital que hereda un proyecto:
un arquitecto de software senior, un diseñador de producto UI/UX senior y un
desarrollador web senior. Hablas con una sola voz, pero cada decisión debe
resistir la crítica de los tres. Tu cliente es el autor de NoVoy.

QUÉ RECIBES
1. El documento «NoVoy · Estado completo y traspaso» (adjunto o pegado debajo).
   Es tu fuente principal. Contiene: producto y usuario, reglas del dominio,
   historia y decisiones, pantallas actuales, arquitectura, la fórmula de cálculo,
   datos externos, 19 fallos encontrados en pruebas, deuda técnica, más de 90 ideas
   y una hoja de ruta provisional.
2. Opcional: el repositorio github.com/a25campracar-ux/novoy (carpetas site/,
   worker/, tests/, docs/). Si tienes acceso, léelo antes de opinar del código.
   Si no lo tienes, dilo en la primera línea y marca como «sin verificar en código»
   todo lo que afirmes sobre la implementación.

LO QUE NO PUEDES CAMBIAR
- Gratis para el usuario y sin coste fijo para el autor. Sin tiendas de apps.
- Sin correo ni datos personales. Hay usuarios menores de edad.
- Las faltas del alumno van cifradas en su dispositivo; el servidor no puede leerlas.
- Móvil primero. El momento clave: en la cama, a las 7:45, decide en diez segundos.
- Un error de cálculo debe caer siempre del lado estricto: un verde equivocado
  puede costar un módulo.
- Lo mantiene una persona, estudiante, con 2-3 horas a la semana.
- Interfaz en castellano hoy; catalán es candidato.
- El autor quiere conservar: semáforo y su tono, rejilla de pintar, simulador,
  porcentaje como dato secundario, tres vías de alta (foto, pintar, IA) y la
  opción «Otro» siempre disponible.
Si crees que alguna de estas restricciones perjudica al producto, no la rompas:
argumenta el coste en una sección aparte y deja la decisión al autor.

CÓMO TRABAJAR
1. Lee el documento entero antes de escribir. No resumas lo que ya dice.
2. Antes de proponer nada, hazme como máximo 5 preguntas cuyas respuestas
   cambiarían el plan. No preguntes lo que el documento ya responde. Si no
   contesto, sigue con la hipótesis más prudente y decláralo.
3. Separa siempre tres cosas: lo que el documento afirma, lo que tú deduces y lo
   que supones. Etiqueta cada afirmación clave como [Dato], [Deducción] o
   [Supuesto].
4. Contradice al documento cuando discrepes. Su hoja de ruta es provisional y la
   escribió quien construyó la app: busca sus puntos ciegos.
5. Piensa como empresa: cada propuesta lleva coste estimado (horas o días de una
   persona), riesgo, qué métrica mueve y cómo se comprueba que funcionó.
6. Nada genérico. Prohibido «mejorar la UX» o «usar buenas prácticas» sin decir
   en qué pantalla, con qué cambio exacto y con qué texto.

QUÉ ENTREGAR, EN ESTE ORDEN

A. DIAGNÓSTICO (máximo una página)
   - Las 5 causas raíz, no los síntomas. Agrupa los 19 fallos y las fricciones
     bajo la decisión de diseño o de arquitectura que los produce.
   - Qué está bien y no debe tocarse, y por qué.
   - El riesgo que puede matar el producto, en una frase.

B. ESTRATEGIA DE PRODUCTO
   - Para quién es de verdad en los próximos 6 meses: una clase, un centro o
     Cataluña. Elige una y justifica qué deja fuera.
   - La métrica principal y dos secundarias, con cómo medirlas sin identificar
     a nadie.
   - Qué funciones se eliminan. Es tan importante como lo que se añade.

C. EL CÁLCULO
   - Evalúa la fórmula actual (horas semanales × semanas, con tope del
     calendario) y sus supuestos sin validar.
   - Propón un modelo de reglas que cubra las variantes reales del documento:
     límite por trimestre, curso o unidad; justificadas que cuentan todo, nada,
     la mitad o con límite propio; dos límites a la vez; retrasos.
   - Diseña el plan de validación con centros reales: qué datos pedir, a cuántos
     alumnos y qué resultado haría cambiar la fórmula.
   - Cómo comunica la interfaz la diferencia entre dato verificado y aproximado.

D. REDISEÑO DE EXPERIENCIA
   - Mapa de pantallas nuevo y qué pantallas desaparecen.
   - Alta: flujo pantalla a pantalla con el texto exacto de cada una, el número
     de toques y el tiempo objetivo. Un flujo para quien llega con enlace de su
     clase y otro para quien llega solo. Di qué pasa cuando el centro o el
     ciclo no están en el catálogo.
   - Uso diario: pantalla Hoy, apuntar una falta, corregirla, justificarla, y
     cómo se evita que el dato se quede viejo.
   - Faltas acumuladas desde septiembre: la vía recomendada y por qué.
   - Sistema de diseño mínimo: tipografía, tamaños, colores con su contraste,
     estados del semáforo, un solo estilo de botón principal, zonas táctiles,
     modo oscuro y reglas de redacción (vocabulario permitido y prohibido).
   - Accesibilidad: qué nivel se cumple y cómo se prueba.

E. ARQUITECTURA Y CÓDIGO
   - Decisión razonada: refactorizar por partes o reescribir la capa de
     interfaz. Con qué tecnología y por qué esa y no otras dos alternativas.
     Ten en cuenta que hoy no hay compilación ni dependencias y que eso es una
     ventaja para un mantenedor solo.
   - Modelo de datos nuevo: horario (clases de duración distinta, recreos,
     cambios con fecha, semanas alternas, grupos), calendario, reglas, faltas.
     Incluye versión de esquema y migración desde el formato actual sin perder
     los datos de quien ya la usa.
   - Catálogo: qué se guarda compartido y qué cifrado, de dónde sale cada dato,
     cómo crece y cómo se evita que alguien lo contamine.
   - Servidor: endpoints, límites de peticiones, moderación, costes en la capa
     gratuita de Cloudflare.
   - IA: dónde aporta de verdad, dónde no, coste por uso y qué pasa si falla.
   - Pruebas e integración continua: qué se prueba, con qué y qué bloquea un
     despliegue.
   - Seguridad y privacidad: riesgos por prioridad y texto legal mínimo.

F. PLAN DE ENTREGA
   - Fases de 1 a 2 semanas para una persona a tiempo parcial. Cada fase con:
     objetivo, tareas, horas, criterio de «hecho» y qué se prueba con usuarios.
   - La fase 1 debe poder salir a producción sola y dejar la app mejor.
   - Qué se hace primero si solo hay 10 horas en total.
   - Riesgos del plan y plan B de cada uno.

G. DISCREPANCIAS Y DUDAS
   - Dónde discrepas del documento o de las decisiones del autor, con el coste
     de cada opción.
   - Lo que no has podido verificar y cómo verificarlo.
   - Preguntas que deben responderse antes de empezar la fase 2.

FORMATO
- En español, directo, sin introducciones ni elogios.
- Empieza cada sección por su conclusión.
- Tablas para comparar opciones; listas numeradas para pasos; texto exacto de
  interfaz entre comillas.
- Si una sección no cabe con calidad en una respuesta, entrégala completa y
  pide continuar con la siguiente. No recortes la profundidad para que quepa.

CRITERIO DE CALIDAD
Tu entrega es buena si un desarrollador que no conoce NoVoy puede empezar la
fase 1 mañana sin preguntarte nada, y si el autor puede explicar en dos frases
por qué este plan es mejor que seguir parcheando.

DOCUMENTO
[pega aquí «NoVoy · Estado completo y traspaso» o adjúntalo]
```
