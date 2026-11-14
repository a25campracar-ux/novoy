[Verificado](#verificado) [Supuestos](#supuestos) [Decisiones](#decisiones) [El flujo](#flujo) [Lo que se elimina](#elimina) [Orden y pruebas](#orden) [Riesgos](#riesgos)

NoVoy · plan de decisiones · noviembre 2026

# Cómo rehacer NoVoy, decisión por decisión

Plan redactado por una sesión independiente a partir del briefing y el dosier, cotejado contra el código y los datos reales. Las comprobaciones posteriores están marcadas donde cambian algo.

## 00Lo comprobado después

Dos afirmaciones del plan se verificaron ejecutando el motor con los datos reales. Una se confirma y obliga a corregir una idea anterior; la otra es falsa.

#### CONFIRMADO · Las semanas lectivas no se pueden contar del calendario

Un curso catalán completo (14/09/2026 → 19/06/2027), descontando Navidad, Semana Santa y los festivos autonómicos, da **38 semanas naturales con clase y 178 días lectivos**. La normativa y las horas oficiales de los módulos asumen **33**.

Son **cinco semanas de diferencia, un 15%**. El 33 es una convención normativa, no un recuento. Esto invalida la idea de «derivar las semanas lectivas del calendario» que aparecía en el dosier: el denominador sale del catálogo o de la convención, **nunca de contar días**.

#### FALSO · «La fórmula ×33 no vale para segundo curso»

El plan deduce que el curso del alumno real dura 24 semanas y que ×33 le inflaría el denominador un 37%. Viene de leer los trimestres que hay cargados en la app, que acaban el 05/03/2027 — pero esa configuración está **incompleta**: le falta el tercer trimestre.

Su hoja de planificación real dice 561 h ÷ 17 h/semana = **33 semanas exactas**, de septiembre a finales de mayo, con la FCT después. La fórmula sí vale para su segundo curso.

La cautela de fondo sigue valiendo para otros centros: donde la FCT empiece antes, las semanas en el instituto son menos y el denominador hay que ajustarlo. **Lo que no se puede es suponer 33 a ciegas sin saber cuándo acaba el curso.**

#### CONFIRMADO · La tutoría está contando faltas y produce un ámbar indebido

En la configuración real, TUT tiene totales fijados a mano y ningún marcado de «no cuenta»:

TUT · 2 h de 10 h = 20% · margen 0,5 h · ÁMBAR

La normativa catalana dice que la tutoría es obligatoria pero **no forma parte del currículum del ciclo**. Es un aviso de alarma por una asignatura que no puede suspenderle. Y es la prueba de que una opción que el alumno tiene que descubrir en un desplegable es una opción que nadie activa.

## 01Supuestos de partida

Las preguntas cuya respuesta cambiaría el plan, con la hipótesis asumida.

| Pregunta | Hipótesis | Si fuese otra |
| --- | --- | --- |
| ¿El objetivo es tu clase o toda Cataluña? | Tu clase, \~30 personas | El catálogo compartido sube de la fase 7 a la 2, y «mi ciclo no está» necesita un camino digno desde el día uno |
| ¿Puedes conseguir la captura del Moodle de un compañero con el porcentaje que le da el centro? | Sí, una o dos | Si el centro cuenta horas reales impartidas, se cae la palabra «oficial» de toda la interfaz |
| ¿Quién mantiene esto en junio? | Tú solo, 2-3 h semanales | Con una segunda persona, el lector de IA y el catálogo pueden ir en paralelo |
| ¿Aceptas que la foto salga del móvil una vez, sin guardarse? | Sí, diciéndolo | Si no, Tesseract sigue de camino principal y la pantalla de revisión necesita el doble de cuidado |

## 02Las decisiones

### El horario que cambia durante el curso

Tres opciones: tramos con fechas (lo actual), un diario día a día, o **un horario vigente más versiones anteriores con fecha**.

Se elige la tercera, pero lo que importa es el porqué: **los tramos existían únicamente porque el denominador recorría el calendario**. Si el denominador es una cifra nominal del módulo, un cambio de horario deja de afectar al porcentaje y solo afecta a «¿qué tengo hoy?».

Ese razonamiento desinfla cuatro conceptos de golpe. **Tramos, asignaturas desactivadas y semanas de proyecto desaparecen**, y en su lugar queda una sola pregunta que el alumno ya entiende: «¿desde cuándo vale este horario?». La FCT pasa a ser «mi semana está vacía desde el 9 de marzo».

### El denominador, por orden de preferencia

1. **Horas oficiales del catálogo** → se marca *oficial*.
2. **Horas semanales × las semanas que de verdad dura su curso** → se marca *aproximado*.
3. **Nunca el recuento día a día**: es infiel y, sobre el curso entero, más laxo.

Comprobado que inyectar el denominador en el motor es gratis: `summary()` ya prefiere los totales fijados sobre el cálculo propio, y tarda 0,3 ms.

**Y un aviso que hay que decir en voz alta:** el cambio *relaja* el número. En los datos reales, IPO II pasa de 20,0% a 18,2%. Si la hipótesis nominal fuese falsa, el error apuntaría al lado peligroso.

### La casilla guarda un módulo, no un texto

El lector acierta el 86% de casillas pero solo el 72% de nombres. En vez de pelear por ese 72%, se cambia la pregunta: la casilla no guarda texto, guarda **un módulo del ciclo**. El alumno toca una casilla y elige de una lista de seis.

Eso elimina tres conceptos a la vez:

- Varias casillas al mismo módulo es gratis → **«unificar» desaparece**.
- La tutoría viene marcada fuera del currículum desde el catálogo → **«clases que no cuentan» desaparece**.
- Las horas oficiales entran con el módulo → **el formulario de horas totales desaparece**.

Añadido barato: las horas semanales de cada casilla son una huella que, contra las horas oficiales del ciclo, **propone** el reparto. Propone; el alumno confirma.

### La IA pasa a ser el camino principal

Se invierte lo que decía el dosier. Motivo: el lector local **se descarga 10 MB la primera vez**, con datos móviles, justo en el minuto en que la gente abandona; y falla precisamente en los nombres, que es lo que un modelo de visión hace bien y además puede cruzar con el catálogo.

Precio a pagar, en una línea en pantalla: la foto sale del móvil una vez y no se guarda. Tesseract se queda intacto como red de seguridad cuando no hay red, falla la llamada o se agota la cuota. La rejilla de pintar sigue siendo la salida que nunca falla.

### Qué va compartido y qué va cifrado

| Compartido, en claro | Cifrado con su contraseña |
| --- | --- |
| Ciclos, módulos, horas oficiales, tutoría fuera de currículum | Sus faltas |
| Calendario de la comunidad, directorio de centros | **Su** rejilla y su mapeo de casillas |
| Reglas del centro, como votos | Sus ajustes y sus respuestas |

Dos cautelas que no estaban en los documentos:

- **Un «horario tipo» de un solo alumno no es anónimo.** Con optativas y desdoblamientos identifica a un grupo de cinco personas. Solo se publica cuando dos alumnos independientes han pintado lo mismo, y se publica el esqueleto, nunca la rejilla de nadie.
- **Las reglas del centro se muestran con dos votos iguales**, y con la forma «en tu insti dicen que…», nunca como dato. Un alumno con prisa contesta mal con total seguridad.

La foto no entra en ninguna columna: se manda al lector y se olvida.

### Las reglas no se preguntan al configurar

Se preguntan cuando el alumno ya tiene la respuesta en la mano: la justificación, la primera vez que marca una falta como justificada; los retrasos, la primera vez que apunta uno; el día libre del centro, el jueves antes del puente. Mientras no contesta, lo estricto y dicho. **Eso quita una pantalla entera del alta.**

## 03El flujo definitivo

Seis pantallas. Las palabras contadas son las de la interfaz; los nombres de centros, ciclos y módulos son datos.

P0**Demo**14 palabras

Puedes faltarTe quedan 11 horas en ProgramaciónFalté hoyHacerlo con mi horario

Se mueve solo: toca «Falté hoy», el número baja, se pone ámbar. Sin una palabra de explicación.

P1**Centro**11 palabras

¿Dónde estudias?escribe tu insti…Con tres letras basta · Se puede cambiar luego

P2**Ciclo y curso**12 palabras

¿Qué estudias?1r DAW · 2n DAW · 1r SMX…Ya tengo tus módulos y sus horas · No está lo mío

P3**Horario**16 palabras

Tu horarioUna foto y lo relleno yoElegir fotoPrefiero pintarloLa foto no se guarda

P4**Revisar**13 + 5 palabras

¿Está bien?Toca lo que esté malEstá bien

Al tocar una casilla: **¿Qué toca aquí?** con la lista de sus módulos y «Ninguna». Al tocar una hora: **¿A qué hora empieza?** con un reloj.

Las horas se corrigen en la misma pantalla, no detrás de un desplegable: es el único momento en que están mal.

P5**Comprobar**19 palabras

¿Te cuadra?Programación · **198 horas** este curso\
Puedes faltar 4925% · cambiarMe cuadraNo me suena

Se valida con la cifra oficial anual, que es la que el alumno reconoce, aunque el día a día se calcule por trimestre. «No me suena» no abre un formulario: baja el número al lado estricto, lo marca *aproximado* y deja la pregunta para después.

#### Preguntas tardías, cada una su hoja y un toque

- **¿Y si traes justificante?** · Es como no faltar · Cuenta igual · No lo sé 13 palabras
- **¿Los retrasos suman?** · Tres hacen una falta · No cuentan · No lo sé 12 palabras
- **¿Mañana hay clase?** · Sí · No · No lo sé 8 palabras
- **¿Tu semana ha cambiado?** · Desde hoy · Desde siempre 9 palabras

## 04Lo que se elimina

Punto de partida medido: 82 acciones distintas, 14 pantallas y tres caminos para configurar lo mismo.

| Se va | Por qué |
| --- | --- |
| Tramos | Existían para que el denominador recorriera el calendario. Con horas nominales no compran nada |
| Asignaturas desactivadas | Se resuelve repintando la casilla: el alumno sabe quién le da clase esa hora |
| Semanas de proyecto | Ya no mueven el denominador. Es un cambio de horario que se deshace |
| Unificar asignaturas | La casilla guarda un módulo: varias al mismo es gratis |
| «Clases que no cuentan» | Lo dice el catálogo. Y lo demuestra el ámbar indebido de la tutoría |
| Horas totales a mano + ajustes avanzados | Diez campos numéricos al final del alta. Ahí se abandona |
| Pantalla de calendario | Está publicado. Y nadie teclea seis festivos en un móvil |
| «Configurar con mi IA» de copiar y pegar | Lo que mató la v1 fue el copia-pega, no la IA |
| Los dos prompts de importar y actualizar faltas | Dos textos que mantener para algo que la rejilla semanal hace de un toque |
| Editor manual aparte | Tercera forma de editar lo mismo. Se queda la que elogiaste: pintar |
| Simulador como pantalla | Hoy ya enseña el efecto hora a hora. No puede competir por la atención de las 7:45 |
| El recuento día a día como denominador | Calculaba una cosa distinta de la que calcula el instituto |

**Se queda sin tocar:** el motor, la rejilla de pintar, el cifrado, el semáforo con su tono, el cálculo de horas que quedan por delante —que sí es legítimamente un recuento de días— y el enlace «pásalo a tu clase», que resulta ser el arranque en frío del catálogo por otros medios.

## 05Orden de construcción

1. **Que el número sea verdad.** Denominador oficial o aproximado, nunca recuento, con la etiqueta visible. Incluye sacar la tutoría del cálculo. Sin esto, lo demás da igual.
2. **Hoy y apuntar.** Ya funcionan. Solo quitar el simulador y las burbujas sobrantes.
3. **Catálogo a mano de un centro.** Pedralbes, DAW 1º y 2º, y el calendario de los tres cursos publicados. Un JSON, sin base de datos.
4. **El alta nueva P0-P5**, con la rejilla como camino y la foto detrás.
5. **Preguntas tardías.**
6. **Lector de IA dentro de la app.**
7. **El catálogo que crece**, con votos y dos confirmaciones.

### Lo que se prueba con gente real en una semana

**Prueba A · el número.** Enseñarle a un usuario real su pantalla de hoy con el denominador viejo y con el nuevo, y una captura de su Moodle al lado. La pregunta no es cuál le gusta: es cuál coincide con lo que le dice el centro. Una tarde.

**Prueba B · el alta.** P0-P5 con el catálogo metido a fuego, en el móvil de cinco u ocho compañeros, sin ayuda y con cronómetro. Tres medidas: segundos hasta terminar, en qué toque dudan, y si al llegar a P5 dicen «me cuadra» sin pensarlo.

Criterio de éxito de B, uno solo: **noventa segundos y ningún teclado.**

## 06Riesgos que este plan no resuelve

1. **La hipótesis del denominador descansa en un solo centro.** Toda la palabra «oficial» viene de una hoja de planificación. Si ese centro es la excepción, el cambio vuelve el número más laxo —medido: 20,0% → 18,2%—, que es la única dirección que no se puede permitir.
2. **El segundo curso con FCT.** Donde las prácticas empiecen antes, las semanas en el instituto son menos y hay que ajustar el denominador. La fecha de inicio de la FCT no está publicada en ninguna parte.
3. **El dato se queda viejo.** Sin resolver. El alumno deja de apuntar y el número se separa de la realidad sin que nadie se entere.
4. **El primer alumno de cada centro se lleva la peor versión**, y es justo quien necesitas para que el catálogo arranque.
5. **Alternancia quincenal y desdoblamientos** quedan fuera del modelo a sabiendas. A quien le toque, le damos un número mal.
6. **La foto sale del móvil**, lo que rompe una promesa que hoy se puede sostener tal cual, y depende de una cuota y una clave que alguien paga.
7. **Retención y contraseñas.** Sin cambios: la app muere en julio y sin correo no hay recuperación.
8. **Que el número no cuadre con el del tutor.** Un alumno que ve dos cifras distintas no se queda con la nuestra.

Tercer documento del conjunto, junto al [dosier de rediseño](https://claude.ai/artifact/Vx1sRNY2HGchsNdAG8mp8Z) y el [briefing completo](https://claude.ai/artifact/KiGekJKXFCcpQJtj5RUyMX).

Las cifras se midieron ejecutando el motor de la app sobre el horario y las faltas reales de un alumno de 2º de DAW en Barcelona.