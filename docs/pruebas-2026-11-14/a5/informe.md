# Informe a5 — Bachillerato nocturno (Tarragona), uso diario y auditoría visual

Todo lo de abajo está comprobado ejecutando la app con Playwright, salvo donde pone "(código)". Capturas en `/tmp/nvtest/a5/shots/` (las rutas citadas son relativas a esa carpeta).

## 1. Caso y verdad

- 1º de Bachillerato nocturno para adultos, instituto de Tarragona. 29 años, trabaja, cursa 6 de 9 asignaturas.
- Lunes a jueves, 17:30–22:00 (4 clases de 1 h, descanso 19:30–20:00). Viernes sin clase. 15 h/semana: MAT 4, FIQ 3, CAT 2, FIL 2, ANG 2, TEC 2.
- 3 evaluaciones (14/09–27/11, 30/11–05/03, 08/03–04/06). Festivos propios: Santa Tecla 23/09 y tres días de libre disposición.
- Regla: se pierde la evaluación continua con más del 20 % de las horas reales de cada asignatura en cada evaluación. Justificada por trabajo = media falta. Retrasos no cuentan.
- Faltas hasta el 13/11: 13 h (6 justificadas) y 1 retraso. Detalle en `caso.md`; cálculo independiente en `verdad.js`.

Verdad de la 1ª evaluación (horas reales · límite · computables · margen): MAT 39 · 7,8 · 2,5 · 5,3 | CAT 19 · 3,8 · 0,5 · 3,3 | FIL 19 · 3,8 · 1,5 · 2,3 | ANG 22 · 4,4 · 1,5 · 2,9 | FIQ 33 · 6,6 · 3 · 3,6 | TEC 21 · 4,2 · 1 · 3,2.

## 2. Tiempo y toques

| Tarea | Vía | Toques | Campos | Tiempo estimado |
|---|---|---|---|---|
| Alta completa | "No está mi centro" → "¿No está tu ciclo?" → Pintándolo | 50 | 26 (13 son fechas) | 4,5 min teóricos; 7–9 min reales por las fechas |
| Faltas | Contadores | 18 | 0 | ~40 s, pero sin fechas ni justificadas |
| Faltas | Rejilla semanal (14 apuntes, 7 semanas atrás) | 43 | 0 | ~1,5 min más recordar |
| Faltas | Con tu IA | 6 en la app | 1 pegado | 2–3 min con el cambio de app |

La foto con OCR no se probó (sin red).

## 3. Exactitud (1ª evaluación, margen en horas)

| Asig | Verdad | App "Cuentan igual" | Dif. | App "No cuentan" | Dif. | ¿Peligroso? |
|---|---|---|---|---|---|---|
| MAT | 5,3 | 3,8 | −1,5 | 6,8 | +1,5 | Sí con "No cuentan" |
| CAT | 3,3 | 2,8 | −0,5 | 3,8 | +0,5 | Sí con "No cuentan" |
| FIL | 2,3 | 1,8 | −0,5 | 2,8 | +0,5 | Sí con "No cuentan" |
| ANG | 2,9 | 2,3 | −0,6 | 3,3 | +0,4 | Sí con "No cuentan" |
| FIQ | 3,6 | 3,5 | −0,1 | 3,5 | −0,1 | No |
| TEC | 3,2 | 3,1 | −0,1 | 3,1 | −0,1 | No |

- La app no puede expresar "justificada = media falta". Con "Cuentan igual" se equivoca hacia el lado seguro (hasta 1,5 h en MAT); con "No cuentan", hacia el peligroso por la misma cantidad. "Su propio %" tampoco equivale: son dos límites separados, no una suma ponderada.
- Las horas totales salen casi exactas (39/19/19 clavadas; ANG 21,67 frente a 22, FIQ 32,67 frente a 33, TEC 20,69 frente a 21) porque "33 semanas" recorta un 1–1,5 % las asignaturas de martes y jueves. Lado seguro.
- La vía de contadores da los mismos márgenes que "Cuentan igual", pero pierde fechas y justificadas.

## 4. Bugs, por gravedad

1. **El enlace "Pásalo a tu clase" borra las faltas del compañero.** Pasos: usuario con 14 faltas abre el enlace de clase de otro → la pantalla se titula "Copia de tus datos", dice "Incluye 0 falta(s) apuntadas" y el botón es "Restaurar mis datos" → al pulsarlo quedan 0 faltas, sin "Deshacer". Esperado: "Usar este horario" conservando las faltas. Causa: `SU.toExport` siempre escribe `faltas: []` y `parseImport` hace `hasFaltas = Array.isArray(j.faltas)` (setup.js); `fillShare` y `viewJoin` en app.js. Captura `join/share-con-datos.png`.
2. **El semáforo cuenta dos veces lo que ya has apuntado hoy.** Lunes 16/11: antes de apuntar dice "Mejor no"; tras "Falté todo el día" pasa a "Hoy no · MAT: Hoy toca ir", aunque todos los márgenes siguen ≥ 0,8 h. `C.verdict` (core.js) suma las clases de hoy sin descontar las ya registradas. Además siguen visibles "Falté todo el día" (responde "Esa hora ya estaba apuntada") y el título "Si faltas hoy". Captura `dia/lun16-todo.png`.
3. **Se aceptan faltas en días sin clase y en festivos.** La importación con IA admitió MAT el viernes 13/11 (1 h) y MAT el 12/10, festivo (2 h): MAT pasó a 7 h y "te pasas 1,2 h". "Apuntar a mano" hace lo mismo ("Ese día no hay clase: salen todas" y la suma). `parseFaltas` (setup.js) y el formulario `#add`.
4. **La rejilla de Faltas deja apuntar fuera de curso.** El 07/06/2027 (curso acabado el 04/06) muestra clases; al apuntar dice "Falta apuntada" y guarda `term: null`: no cuenta en ningún sitio. `weekGrid` no mira los trimestres.
5. **Paso "Tu calendario" desborda a 320 y 375 px.** La página se maqueta a 390 px y el campo "Hasta" queda cortado por la derecha. `.qt .two` con dos `input[type=date]`. Captura `audit/320l/w4-calendario.png`.
6. **"Claro / oscuro" no se guarda.** Tras recargar vuelve al tema del sistema (solo cambia `dataset.theme`, app.js ~1474). Tampoco hay forma de volver a "automático".
7. **Tarjeta ya apuntada y pasada del límite dice "Te quedan 0 h"** en vez de "Te has pasado 0,2 h" (`Math.max(0, margin)` en `subjectCards`). Captura `dia2/hoy-rojo-full.png`.
8. **A 320 px, el selector de evaluación de Resumen se corta** ("3a evaluac…") y en "¿Cuántas horas has faltado ya?" el nombre se monta sobre el botón "−". En la intro, "25 %" pisa la base del semáforo. Capturas `audit/320l/resumen.png`, `w6-previas.png`, `intro.png`.
9. Menores: "1 retrasos"; el retraso importado por IA se guarda sin hora y no sale como "R" en la rejilla; la copia restaurada pierde el umbral de aviso; "Semanas = 0" se acepta pese a `min=1`; el semáforo nombra la primera asignatura en ámbar, no la más justa (dice CAT con 1,8 h cuando FIL tiene 0,8 h); 7 acciones con manejador y sin botón (`ai-go`, `go-reg`, `q-start`, `share-app`, `start-setup`, `start-update`, `acct-out`) (código).

## 5. Uso diario: qué pasa cada día

- **"¿Ayer fuiste a todas las clases?"** Sale cuando toca: viernes y sábado preguntan por el jueves ("Ayer" / "El jueves"), el lunes también por el jueves, y no sale si ese día ya tiene algo apuntado. Tras Navidad no pregunta (solo mira 7 días atrás). Problemas: solo pregunta por el último día de clase, así que si no contestas el martes, el jueves ya solo pregunta por el miércoles y el martes se pierde en silencio; sigue saliendo en festivos, entre evaluaciones y con el curso terminado; "Falté a alguna" te lleva a Faltas pero si no apuntas nada la pregunta vuelve.
- **Aviso único.** Orden (código, `oneHint`): riesgo de iPhone sin instalar → "¿Ya has faltado antes?" → "Guarda tu horario" → "Ponla en tu pantalla de inicio" → "Guarda tu copia" → enlace de recuperación. Todos se pueden cerrar. Vi "Guarda tu horario" y "Guarda tu copia"; el primero y el quinto dicen casi lo mismo con dos mecanismos distintos.
- **Viernes sin clase.** "Día libre" y debajo "Si faltas el lunes…": bien. Pero la columna V ocupa una quinta parte de las dos rejillas, siempre vacía.
- **Primer día de la 2ª evaluación.** Todo vuelve a 0 sin ningún mensaje; un sábado entre evaluaciones pone "Fuera de curso".
- **Fuera de curso.** Antes de septiembre y después de junio: "Día libre. Hoy no es día de curso." y nada más. Ni "empiezas el 14 sep" ni resumen final.
- **Semáforo siempre en ámbar.** El aviso salta a 2 h o menos, pero el límite de CAT, FIL, ANG y TEC es ~4 h por evaluación: tras una sola falta ya dice "Mejor no" casi cada día. Se puede cambiar en Ajustes → Reglas, pero nadie lo encontrará.
- **Resumen.** "A salvo" aparece bien a final de evaluación y desaparece el último día. Una asignatura pasada dice lo mismo tres veces ("Llevas 4 de 3,8 h", "te pasas 0,2 h", "Te has pasado 0,2 h del límite").
- **Simulador.** Funciona, pero repite las tarjetas de Hoy y deja anotar faltas en fechas futuras sin avisar.
- **Cuenta sin red.** "Sin conexión. Inténtalo con internet": claro, y no se pierde lo escrito. Contraseña corta: "La contraseña no cumple los 3 requisitos". Enlace cortado: mensaje correcto.

## 6. Auditoría visual (320×568, 375×667, 390×844, claro y oscuro; 6 pasadas, ~56 capturas cada una)

- **Zonas táctiles.** `.btn.small` mide 38 px de alto en toda la app, incluida la acción diaria "Falté" (63×38) y "Sí, a todas". Flechas de semana 36×38, "×" de festivos 34×34, "‹ Atrás" 59×34, enlaces de texto 27 px ("Quitar", "Prefiero no decirlo"). A 320 px las casillas de la rejilla miden 42×46.
- **Contraste, modo claro.** El gris `--mute` (#64748B) sobre el fondo da 4,34:1 y se usa en casi todo el texto secundario. Etiquetas: ámbar 3,34 y verde 3,94. Iniciales de los avatares 2,2–3,7. Texto blanco sobre casillas CAT y FIL 2,5–2,8. El modo oscuro está mucho mejor (10 fallos frente a 70).
- **Texto diminuto.** 10–11 px en horas y casillas de las rejillas; todo en px, no responde al tamaño de letra del sistema.
- **Barras fijas.** El contenido no queda tapado al final del scroll, pero: a 320 px, al tocar una casilla de Faltas la tarjeta "¿Retraso? / ¿Justificada? / Apuntar" aparece bajo la barra de pestañas y no se ve nada (`audit/320l/faltas-celda.png`); el aviso "Falta apuntada" tapa esos interruptores 5 s (`f2/celda-just.png`) y "Falté todo el día" (`audit/320l/hoy-toast.png`); la barra es translúcida y se lee el texto de debajo.
- **Jerarquía.** A 320 px, con la pregunta de ayer, la primera pantalla de Hoy son pregunta + semáforo + "Falté todo el día": ni una asignatura ni una hora visible (`audit/320l/hoy-clase.png`).
- **Botones.** "primary" es verde en el alta y negro en el resto; "Falté" es gris pizarra; "Borrar" es fantasma. Tres primarios distintos.
- **Vocabulario.** "te quedan X h" significa "ahora" en Resumen y "después de faltar" en Hoy. Conviven "apuntada/anotada/registradas", "te pasas/Te has pasado", "trimestre" (Resumen, Ajustes, enlace) con mis "evaluaciones", y "módulo" ("Toca un módulo…") con "asignatura".
- **Accesibilidad.** Cada acción rehace todo `#app` (que es `aria-live`): el foco cae a `body` y el lector relee la pantalla. Los cuatro "Falté" se llaman igual. Casi ninguna etiqueta está asociada a su campo (`label` sin `for`). Hay foco visible y `aria-current` en pestañas.

## 7. Alta para alguien que no es de FP

No expulsa, pero se nota que no es para él: "¿Qué estudias?" solo ofrece DAW y dice "Elige tu ciclo. Ya tenemos sus módulos"; hay que encontrar "¿No está tu ciclo?". Luego: festivos de Barcelona precargados (La Mercè, Segona Pasqua) para un centro de Tarragona; "Si no sabes alguna, déjala como está: es lo más seguro" con el 25 % por defecto, que es lo menos seguro; "Semanas de clase: lo normal son 33" no significa nada en bachillerato; "Cambiar las horas" se cierra tras cada cambio (3 reaperturas); la intro dice "25 %" y "Cada mañana". El horario de tarde con viernes vacío queda bien pintado.

## 8. Inventario y qué quitaría

16 pantallas, 88 acciones `data-act` en el marcado (101 manejadores) y otros 58 tipos de atributo de acción. Quitaría: el Simulador como pantalla (es Hoy con fecha); "Apuntar a mano (otra forma)"; el Editor avanzado; dos de los cuatro modos de cambiar el horario en Ajustes; "Exportar archivo / Importar" (ya hay cuenta y enlace); "Actualizar app"; el panel de admin fuera del bundle; los 7 manejadores muertos; uno de los tres accesos a "Faltas de antes".

## 9. Los 15 cambios, por prioridad

1. **Enlace de clase.** Problema: borra faltas (bug 1). Evidencia: `join/share-con-datos.png`. Cambio: no exportar `faltas` en `fillShare`; `hasFaltas = faltas.length > 0`; título "Te han pasado un horario", botón "Usar este horario", y "Deshacer" siempre.
2. **Semáforo tras apuntar.** Problema: bug 2. Evidencia: `dia/lun16-todo.png`. Cambio: `verdict` ignora las horas ya apuntadas; con todo apuntado, "Hoy ya está apuntado · te quedan X h en la más justa", sin "Falté todo el día" y con título "Hoy".
3. **Media falta.** Problema: mi regla no existe. Evidencia: tabla de exactitud. Cambio: cuarta opción en "Las faltas justificadas…": "Cuentan la mitad".
4. **Validar fecha.** Problema: bugs 3 y 4. Cambio: rechazar en importación, a mano y rejilla lo que caiga en festivo, día sin esa clase o fuera de evaluación: "El 12 oct fue festivo: no la he puesto".
5. **Calendario a 320/375.** Evidencia: `audit/320l/w4-calendario.png`. Cambio: `.qt .two{grid-template-columns:1fr}` por debajo de 400 px y `min-width:0` en los `input[type=date]`.
6. **Tarjeta de celda visible.** Evidencia: `audit/320l/faltas-celda.png`. Cambio: abrirla como hoja inferior sobre la barra de pestañas (o `scrollIntoView`), con "Apuntar falta" a la vista.
7. **Un solo "te quedan".** Evidencia: `f1/hoy-viernes.png` frente a `f1/resumen.png`. Cambio: en Hoy, "si faltas, te quedarán 1,8 h"; en Resumen, "te quedan 3,8 h"; un solo verbo, "apuntar".
8. **Botones de 44 px.** Evidencia: lista de la sección 6. Cambio: `.btn.small{min-height:44px}`, `.x` y flechas de semana 44×44, enlaces con `padding:10px 0`.
9. **Contraste claro.** Cambio: `--mute:#55637A` (≥ 5:1), texto de etiquetas ámbar `#8A5A00` y verde `#0B7A4B`, iniciales de avatar y de casillas en `--ink`.
10. **Umbral de ámbar proporcional.** Evidencia: `dia/lun16-a.png`. Cambio: ámbar cuando quede ≤ 25 % del límite de esa asignatura (mínimo 1 h), en vez de 2 h fijas.
11. **Pregunta de ayer.** Cambio: preguntar por todos los días de clase sin contestar de los últimos 7 ("Martes y miércoles, ¿fuiste a todo?"), no mostrarla fuera de curso, y añadir "No me acuerdo".
12. **Vocabulario por tipo de estudios.** Evidencia: `alta/02b-ciclo-otro.png`, `alta/08rejilla.png`. Cambio: "¿Qué estudias?" con "FP · Bachillerato · Otro"; fuera de FP usar "asignatura", llamar a los periodos como los haya escrito el usuario, y ocultar "Semanas de clase" (contar el calendario real).
13. **Reglas por defecto.** Evidencia: `audit/320d/w5-reglas.png`. Cambio: sin preselección en el %, o texto "Si no lo sabes, elige el más bajo: es lo más seguro"; quitar festivos de Barcelona si el centro no es de Barcelona.
14. **Tema.** Cambio: selector "Automático · Claro · Oscuro" guardado en `localStorage`.
15. **Limpieza y pequeños.** Columna V oculta si no hay clase ningún viernes; faltas "de antes" agrupadas ("MAT · 4 h" en una tarjeta, no 4); selector de evaluación con "1ª · 2ª · 3ª" a 320 px; mensaje al cambiar de evaluación ("Empieza la 2ª evaluación: contador a 0") y al acabar el curso; `aria-label="Falté a MAT"`; no rehacer todo `#app` en cada toque.

## 10. Me gustaría poder…

- Marcar "justificada por trabajo" con un toque desde Hoy, y que cuente media.
- Ver de un vistazo "esta semana puedes saltarte: MAT 1 h, FIQ 1 h" en vez de seis tarjetas.
- Un aviso el día de clase a las 16:30, no "cada mañana".
- Ver las evaluaciones cerradas con su resultado final.
- Apuntar "salí a las 21:00" (falté a la última) con un toque.

## 11. Qué no pude probar

Foto con OCR; directorio oficial de centros y catálogo compartido; crear cuenta, entrar y sincronizar de verdad; aviso de riesgo en iPhone e instalación (requieren https y Safari); Safari real (los campos de fecha y la barra translúcida pueden verse distinto); letra grande del sistema (la app usa px: no debería cambiar, no verificado en iOS); lector de pantalla real; "Con tu IA" para el alta completa (solo leí el mensaje; sí probé la importación de faltas). Nota de método: `since` se guarda con la fecha real, no con `?d=`, así que lo fijé a mano para simular semanas.
