# Informe a2 — 1º CFGM Cures Auxiliars d'Infermeria, Lleida (centro y ciclo fuera del catálogo)

Probado con Playwright sobre `site/index.html?d=2026-11-13` (también 14/11, 16/11, 24/09, 29/09 y 21/06/2027). Scripts, estados y capturas en `/tmp/nvtest/a2` (`w/`). Marco con **[E]** lo comprobado ejecutando y con **[C]** lo deducido leyendo código.

## 1. Caso y verdad

- Alumna de 17 años, 1º de CAI en un instituto público de Lleida, turno de tarde, Android barato, no sabe qué es un JSON ni ha usado ChatGPT.
- Horario: 30 sesiones de 55 min (15:00–20:50), recreo 17:45–18:05, bloques de 2 y 3 h (uno partido por el recreo). 10 módulos + Tutoria = 11 nombres.
- Calendario: 14/09/2026–18/06/2027; festivos de Lleida (29/09 Sant Miquel, 11/05 Sant Anastasi) y 3 días de libre disposición. La Mercè y Segona Pasqua no son suyos.
- Reglas: 20 % por módulo sobre el curso entero, justificadas no cuentan, 3 retrasos = 1 h, tutoría no cuenta. Horas del módulo = h/semana × 33 (supuesto del caso: no tiene el papel oficial).
- Faltas hasta el 13/11: 57 horas en 20 días (17 justificadas) + 10 retrasos (1 justificado).

Verdad (`verdad.js`, independiente de la app):

| Módulo | Total curso | Límite | Cuentan | % | Quedan |
|---|---|---|---|---|---|
| Benestar | 99 | 19,8 | 3 | 3,0 | 16,8 |
| Cures | 198 | 39,6 | 10 (9 + 1 por retrasos) | 5,1 | 29,6 |
| FOL | 66 | 13,2 | 2 | 3,0 | 11,2 |
| Higiene | 99 | 19,8 | 2 | 2,0 | 17,8 |
| OADS | 66 | 13,2 | 3 | 4,5 | 10,2 |
| Odonto | 66 | 13,2 | 5 (4 + 1 por retrasos) | 7,6 | 8,2 |
| Primers auxilis | 66 | 13,2 | 2 | 3,0 | 11,2 |
| Relacions | 66 | 13,2 | 0 | 0 | 13,2 |
| Suport | 66 | 13,2 | 11 | 16,7 | 2,2 |
| Ésser humà | 165 | 33,0 | 3 | 1,8 | 30,0 |

## 2. Tiempo y toques

Estimación con la regla del BRIEF (2 s toque, 4 s campo, 8 s decisión); el "realista" añade buscar el horario, los selectores de fecha de Android y pensar.

| Tarea | Vía | Toques | Campos de teclado | Decisiones | Mecánico | Realista |
|---|---|---|---|---|---|---|
| Alta | Pintando (la que acabaría usando) | 73 | 30 (centro, ciclo, 11 nombres, hora de inicio, 6 fechas de trimestre, 10 campos de festivos) | 5 | ≈5 min, 7 pantallas | 9–12 min |
| Alta | Con tu IA (yo hice de IA) | 9 | 3 en la app + unas 15 respuestas en el chat | — | ≈1 min en la app | 6–10 min y necesita cuenta en una IA |
| Alta | Foto | no probada (OCR sin red) | | | | |
| Faltas | A. Contadores | 41 | 0 | — | ≈1,5 min | 5 min o más: antes hay que sumar a mano por módulo |
| Faltas | B. Rejilla semanal, 65 casillas en 9 semanas | 165 | 0 | — | ≈5,5 min | 8–10 min |
| Faltas | C. Con tu IA | 6 | 1 (pegar) | — | ≈30 s en la app | 3–5 min si tiene las faltas en texto |

## 3. Exactitud

Horas totales: la app da exactamente h/semana × 33 en los 10 módulos **[E]**. Con ámbito "Todo el curso" los festivos no cambian los totales: con la plantilla de Barcelona sin tocar sale lo mismo **[E]**.

| Módulo | Verdad (quedan) | B rejilla | C IA, 1 entrada por clase | A contadores | C IA, 1 entrada por hora | ¿Lado peligroso? |
|---|---|---|---|---|---|---|
| Benestar | 16,8 | 16,8 | 16,8 | 16,8 | 17,8 (+1) | sí en C por hora |
| Cures | 29,6 | 29,6 | 29,6 | 30,6 (+1) | 35,6 (+6) | sí en A y en C por hora |
| FOL | 11,2 | 11,2 | 11,2 | 11,2 | 11,2 | no |
| Higiene | 17,8 | 17,8 | 17,8 | 17,8 | 18,8 (+1) | sí en C por hora |
| OADS | 10,2 | 10,2 | 10,2 | 10,2 | 10,2 | no |
| Odonto | 8,2 | 8,2 | 8,2 | 9,2 (+1) | 10,2 (+2) | sí en A y en C por hora |
| Primers auxilis | 11,2 | 11,2 | 11,2 | 11,2 | 12,2 (+1) | sí en C por hora |
| Relacions | 13,2 | 13,2 | 13,2 | 13,2 | 13,2 | no |
| Suport | 2,2 | 2,2 | 2,2 | 2,2 | 2,2 | no |
| Ésser humà | 30,0 | 30,0 | 30,0 | 30,0 | 31,0 (+1) | sí en C por hora |

- B y C (una entrada por clase) clavan la verdad, incluidos justificadas y retrasos.
- A (contadores) y el alta con IA dejan fuera los retrasos: +1 h de margen falso en Cures y Odonto.
- C con una entrada por hora pierde 20 de 57 horas: +13 h de margen falso en total (ver bug 1).
- Si en contadores mete también las justificadas (la pantalla no dice que no), el error va al lado seguro (hasta −5 h en Cures), salvo Odonto (+1, retrasos).
- Si deja "Cada trimestre" (valor por defecto), Suport sale en rojo ("te pasas 6,7 h") y Odonto también: lado seguro, pero la app sería inútil para ella.

## 4. Bugs, por gravedad

1. **Importar con IA descarta horas en silencio y lo explica mal (lado peligroso) [E].** Pasos: Faltas → "Pásalas de golpe con tu IA" → pegar una respuesta con una entrada por hora (dos entradas `2026-10-19 · Cures · 1 h`, que es como lista la asistencia cualquier plataforma). Esperaba 57 h; la app dice "He encontrado 37 h" y "20 ya las tenías apuntadas: no se repiten", con 0 faltas previas. Causa: `parseFaltas` en `setup.js` usa la clave `fecha|asignatura|tipo` y mete en `seen` las del propio lote. Arreglo: sumar las horas de entradas repetidas del mismo lote (con tope en las horas de esa clase ese día) y deduplicar solo contra `existing`. El prompt dice "cada falta es UNA asignatura en UN día", pero no se puede confiar en que una IA gratuita lo cumpla.
2. **"Cambiar mi horario" sin tocar nada corrompe un horario de 55 min [E].** Ajustes → Horario → Cambiar mi horario → Siguiente → Siguiente → Guardar. La rejilla pasa de 6 a 9 filas (15:00–16:00, 16:00–16:50, 16:50–17:00, 17:00–17:45, 19:00–19:05…), pregunta "¿Desde cuándo vale este horario?" aunque no cambió nada y, al "Corregir desde el principio", las horas pasan a minutos reales: Cures lunes 3 h → 2,75 h, total 198 → 181,5, tarjetas con "0,92 h" y Suport pasa de 2,2 a 1,0 h de margen. Lado seguro, pero deja el horario roto. Causa: `hourSlots` en `core.js` trocea siempre a 60 min y `qFromCfg` en `app.js` reconstruye las filas con esos cortes, ve que no cuadran y pone `unit: 'real'`. Arreglo: guardar las filas de la rejilla (`rows`, `unit`) en la configuración y reutilizarlas.
3. **Horas de clase falsas en toda la app con sesiones que no duran 60 min [E].** Hoy: "Benestar 15:00 y 16:00", "Solo 16:00" (la real es 15:55); Cures "15:00, 16:00 y 17:00" (reales 15:55 y 16:50); Relacions "19:00 y 20:00" (19:55). Lo mismo en la rejilla de Faltas, en el simulador ("16:00–16:50") y en el campo `start` de las faltas guardadas. Misma causa: `hourSlots`. No cambia el cálculo, pero ella no reconoce su horario y duda de a qué hora ha tocado.
4. **Contadores de "faltas de antes" sin retrasos ni justificadas [E].** La pantalla "¿Cuántas horas has faltado ya?" solo tiene +/− de horas. Con "3 = 1 h" activado no hay dónde poner los retrasos (+1 h falso en Cures y Odonto) y con "No cuentan" no dice si incluir las justificadas. El mensaje del alta con IA (paso 6 de `buildPrompt`) tampoco pregunta por los retrasos ya acumulados.
5. **Cambiar "1ª clase empieza" no actualiza la rejilla [E].** "Cambiar las horas" → poner 15:00: las filas siguen en 08:00–14:20 hasta tocar otro control. Causa: en el manejador de `data-qf` (`app.js`, línea ~1575) solo se llama a `render()` para `rows`, `brk`, `dur` y `brkMin`, no para `start`.
6. **Falta en un día que la app cree festivo [E].** Con La Mercè en el calendario, la columna del jueves 24/09 sale vacía con "La Mercè (Barcelona)" y no hay forma de apuntar su falta de Odonto desde la rejilla; Hoy diría "Día libre". Al revés: el 29/09 (Sant Miquel) la app le dice "Puedes faltar" y le ofrece "Falté todo el día" en un festivo real.
7. **Mensajes falsos o descuidados [E].** "Ya tenemos sus módulos y sus horas" cuando su ciclo no está; el aviso "Mensaje copiado" sigue visible en la pantalla de revisión; "Retraso apuntada" (género); "El texto pegado no es un JSON válido"; en revisión "He encontrado 57 h de faltas" mezcla justificadas y Tutoria (que no cuentan) sin decirlo.
8. **Menor [E].** El nombre del centro se guarda como lo teclea ("guindavols") y sale así en Ajustes; con el alta por IA quedan dos nombres distintos (`center` y `catalog.centre.name`). En el calendario, a 390 px, el segundo campo de fecha de cada trimestre se sale de la tarjeta. Los % de Hoy y Resumen se animan unos 2 s: una captura rápida enseña 15,1 % en vez de 16,7 %.

## 5. Caminos "No está mi centro" y "¿No está tu ciclo?"

- **Centro: digno pero frío.** Un toque en "No está mi centro · Usar «guindavols»" y sigue. Falta decirle qué pierde ("no tengo tu calendario: lo pondrás tú en el paso 4").
- **Ciclo: funciona, pero la deja sola.** Ve una única opción, "DAW · CFGS · 16 módulos", que no es de su centro ni de su nivel, y debajo un formulario pequeño con ejemplo "ASIX". No hay lista de familias ni ciclos de grado medio. Escribir el ciclo no le da nada a cambio: ni módulos ni horas.
- **Consecuencia:** teclea 11 nombres a mano (el campo acepta varios separados por comas, pero no lo dice), no hay comprobación de horas oficiales y hereda un calendario de Barcelona.
- **Calendario [E]:** el texto dice "Los festivos de Catalunya ya están", pero trae "La Mercè (Barcelona)" y "Segona Pasqua (Barcelona)" y los trimestres son "de ejemplo". Tuvo que quitar 2 festivos, añadir 5 y cambiar 6 fechas. No hay botón "no soy de Barcelona" ni festivos por municipio.

## 6. Fricciones, por impacto

1. Paso 4 (calendario): 11 fechas con el selector nativo, en formato mm/dd/yyyy en mi navegador de prueba, sin etiquetas "Desde/Hasta" en los trimestres. A ella, con el límite sobre el curso entero, los trimestres le dan igual; bastaría "empieza el / acaba el".
2. Rejilla de mañana por defecto (08:00, 60 min) con "Cambiar las horas" escondido debajo. Una alumna de tarde pinta primero y descubre después que las horas no son las suyas. Solo admite una duración igual para todas las sesiones y un único recreo.
3. Paleta de asignaturas en una fila con desplazamiento lateral: con 11 nombres se ven 4 y "Borrar" y "+ Otra asignatura" quedan fuera de pantalla.
4. El recreo no se ve en la rejilla de pintar (17:45 → 18:05 sin separación).
5. Importar faltas da por hecho Moodle ("entra en Asistencia de cada asignatura, selecciona la tabla y cópiala"): son 10 módulos, 10 copias, en móvil. Muchos institutos públicos pasan lista en otra plataforma.
6. Rejilla semanal de Faltas: 3 toques por hora (casilla, apuntar, cerrar) y no hay "falté todo el día" para días pasados; un día entero son 12–18 toques.
7. "Con tu IA" en el alta vuelve a preguntar centro y ciclo, que ya escribió (el mensaje no los lleva), y exige cuenta en un servicio que no conoce.
8. La lista de Faltas tras los contadores son 39 tarjetas idénticas "Cures · de antes de usar NoVoy".
9. Resumen no enseña las justificadas cuando "no cuentan": no puede comprobar que las 17 están bien apuntadas.

## 7. Palabras que no entendería

"ciclo", "CFGS", "módulos" (mezclado con "asignaturas" en la misma pantalla), "Moodle" si su centro no lo usa, "tu IA", "ChatGPT, Gemini o Claude", "JSON", "Su propio %", "El límite se mira…", "2 = 1 h", "Semanas de clase del curso · Lo normal son 33", "Casos especiales", "tramo", "franjas", "unificar asignaturas", "ámbar", "Editor avanzado", "caché", "enlace de copia", "Curso entero" como etiqueta suelta en Hoy, "16,7% de 20%".

## 8. Mejoras concretas

- **Ciclo sin catálogo.** Cambiar el texto por: "Elige tu ciclo. Si no sale, escríbelo abajo: tardas 2 minutos más." No enseñar DAW a quien viene de "No está mi centro"; dejar el buscador de ciclo como elemento principal. Ejemplo del campo: "Ej. Cures auxiliars d'infermeria".
- **Nombres.** Bajo el campo: "Puedes escribirlas todas seguidas, separadas por comas: Cures, FOL, Higiene…". Paleta en varias líneas, no en carrusel.
- **Horas antes de pintar.** Dos preguntas encima de la rejilla: "¿A qué hora empiezas? [08:00] [15:00] [otra]" y "¿Cuánto dura cada clase? [55] [60] [otra]". Dibujar el recreo como una franja "Recreo 17:45–18:05".
- **Calendario.** Texto: "Estos son los festivos de toda Catalunya. Añade los de tu pueblo o ciudad (suelen ser 2) y los días de libre disposición de tu centro." Sacar La Mercè y Segona Pasqua de la plantilla general. Si elige "Todo el curso", pedir solo inicio y fin.
- **Reglas.** "Si no sabes alguna, déjala como está: es lo más seguro" no es cierto para retrasos ("No" es lo menos seguro) ni para el 25 %. Propuesta: "Si no sabes alguna, pregúntala a tu tutor. Mientras tanto, elige la más estricta." Reformular: "¿Qué parte de las clases puedes perderte?", "Si traes justificante…  [Cuenta igual] [No cuenta] [Tiene otro límite]", "¿El límite es de cada trimestre o de todo el curso?", "¿Llegar tarde cuenta? [No] [2 retrasos = 1 falta] [3…]".
- **Contadores.** Titular: "¿Cuántas horas has faltado ya SIN justificante?" cuando las justificadas no cuentan, y una segunda columna "Retrasos" cuando suman.
- **Revisión del import.** "He encontrado 57 h: 38 cuentan, 17 justificadas (no cuentan), 2 de Tutoria (no cuenta) y 10 retrasos." Y nunca "ya las tenías apuntadas" para repetidos del mismo pegado.
- **Errores.** "El texto pegado no es un JSON válido" → "Falta un trozo de la respuesta. Cópiala entera con el botón de copiar de tu IA y pégala otra vez."
- **Horas reales.** Mostrar siempre las horas de la rejilla que pintó (15:00, 15:55, 16:50…).
- **Aviso de festivo dudoso.** Si apunta o intenta apuntar una falta en un día marcado festivo: "¿Tuviste clase el 24 de septiembre? [Sí, quitar el festivo]".

## 9. Me gustaría poder…

- Elegir mi ciclo de una lista de grado medio y que salgan mis módulos con sus horas.
- Decir "soy de Lleida" y que salgan mis festivos.
- Poner turno de tarde de un toque y clases de distinta duración.
- Marcar "falté todo el día" en un día pasado, y "estuve mala del 5 al 6 de octubre, justificado" de una vez.
- Cambiar una falta a justificada cuando entrego el justificante, sin buscarla entre 60 tarjetas (filtro "sin justificar").
- Ver cuántas justificadas y cuántos retrasos llevo por módulo.
- Pasar las faltas con una captura de la app de asistencia de mi centro sin depender de una IA externa.
- Recibir el horario ya hecho de una compañera; el enlace de "Pásalo a tu clase" debería ofrecerse al final del alta, que es cuando tiene sentido.

## 10. Qué no pude probar

- Foto con OCR (sin red), que es la vía que la app le recomienda ("Si dudas, la de arriba"). **[C]** Con sesiones de 55 min, el horario leído pasaría por el mismo `hourSlots`.
- Directorio oficial de centros y catálogo compartido (bloqueados): no sé si su instituto de Lleida aparecería con red; si aparece, igualmente llega sin ciclo ni calendario.
- Una IA real: hice yo de IA. El mensaje de alta (4.372 caracteres) y el de faltas (2.248) son claros, pero no he medido cuántas IA gratuitas devuelven una entrada por hora (bug 1).
- Cuentas, copia de seguridad, instalación como app, enlace para la clase y comportamiento táctil real (deslizar para pintar) en un Android de gama baja.
- Las horas oficiales del currículo de CAI: la "verdad" usa h/semana × 33, igual que la fórmula de la app, así que la coincidencia de totales no prueba que sean las del centro.
