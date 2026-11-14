# Cómo probar NoVoy (léelo entero antes de empezar)

NoVoy es una web app (PWA, móvil) para estudiantes de FP: dice cuántas horas puedes faltar a cada
asignatura sin pasar el límite de faltas del centro. Código: /home/claude/novoy/site (SOLO LECTURA:
no edites nada ahí, no hagas git commit ni push). Producción: https://novoy-72h.pages.dev (no hace falta).

## Entorno
- Se prueba en local con Playwright (ya instalado global) y Chrome:
  `NODE_PATH=$(npm root -g) node tu_script.js`  con  `chromium.launch({executablePath:'/usr/bin/google-chrome'})`
- URL: `file:///home/claude/novoy/site/index.html?d=2026-11-13`  (?d= fija "hoy"; usa viernes 2026-11-13,
  y prueba también otro día si te sirve, p. ej. un lunes o un sábado).
- Viewport móvil: `{width:390,height:844}`, `isMobile:true`, `deviceScaleFactor:2`.
- No hay red: bloquea `**/fonts.googleapis.com/**` y `**/analisi.transparenciacatalunya.cat/**` con route.abort().
  (El directorio oficial de centros y el catálogo compartido no responderán: es normal; anótalo solo como límite de la prueba.)
- Para saltar la intro animada: `localStorage.setItem('ft.intro','1'); sessionStorage.setItem('ft.sp','1')` y recargar.
- Estado guardado en localStorage `ft.v2` (léelo para verificar qué se guardó).
- Ejemplos que FUNCIONAN: /tmp/nvtest/ejemplo_alta.js (alta completa pintando la rejilla) y
  /tmp/nvtest/ejemplo_importar.js (pasar faltas con la respuesta de una IA). Copia sus selectores.
- La foto con OCR (Tesseract) no funciona sin red: no la pruebes en vivo; puedes criticar el flujo leyendo el código.
- «Con tu IA»: tú haces de IA. Lee el mensaje que la app copia (SU.buildPrompt / buildImportPrompt en site/setup.js),
  valora si un estudiante y una IA gratuita lo entenderían, redacta la respuesta JSON que daría la IA para TU caso
  y pégala en la app para ver si la acepta.
- Trabaja SOLO en tu carpeta (te la indico). Haz capturas (`page.screenshot({fullPage:true})`) y MÍRALAS con Read:
  la crítica de UI tiene que salir de lo que se ve, no solo del código.
- Motor de cálculo: site/core.js (se puede cargar en node: `require('/home/claude/novoy/site/core.js')`).
  Fórmula actual: horas de la asignatura = horas semanales × semanas del curso (33 por defecto), repartidas por
  trimestre según el calendario; límite = % de esas horas; por trimestre o curso entero; justificadas: cuentan igual /
  no cuentan / su propio %.

## Tu trabajo, en este orden
1. ANTES de tocar la app, escribe en tu carpeta `caso.md`: tu centro, ciclo y curso, horario semanal completo
   (días, horas, módulos, recreo), calendario (trimestres, festivos), reglas del centro (límite %, por trimestre o
   curso, justificadas, retrasos, tutoría, casos raros) y TUS FALTAS reales desde septiembre hasta hoy (13/11/2026),
   con fechas. Calcula A MANO (o con un script tuyo independiente de la app) cuántas horas totales tiene cada módulo
   según tu centro, tu % actual y las horas que te quedan. Eso es tu "verdad" para comparar.
2. Haz el alta completa como ese estudiante, de cero, por el camino que tu personaje elegiría (y luego prueba los
   otros caminos). Cuenta toques, pantallas, campos de teclado y estima el tiempo real de un humano
   (≈2 s por toque, ≈4 s por campo corto, ≈8 s por decisión que haya que pensar).
3. Mete tus faltas desde septiembre: prueba las vías que haya (contadores, rejilla semanal, con IA) y compara.
4. Compara lo que dice la app (Hoy, Resumen, %, horas que quedan) con tu verdad. Cuantifica la diferencia y di
   si el error va hacia el lado peligroso (la app dice que puedes faltar más de lo real) o el seguro.
5. Usa la app unos "días": apunta una falta, quítala, retraso, justificada, simulador, cambiar reglas en Ajustes,
   cambiar horario, la pregunta "¿ayer fuiste a todo?". Busca bugs, textos confusos, callejones sin salida.
6. Crítica de UI/UX como lo haría un crítico de producto exigente: qué es lento, qué sobra, qué no se entiende de un
   vistazo, qué texto cambiarías (da el texto nuevo), qué falta.

## Qué entregar (tu respuesta final, en español, y guárdala también en tu carpeta como informe.md)
- Caso (5 líneas) y verdad calculada.
- Tiempo y nº de toques del alta y de importar faltas, por cada vía probada.
- Exactitud: tabla módulo · verdad · app · diferencia · ¿lado peligroso?
- BUGS (reproducibles: pasos, qué esperabas, qué pasó, archivo/función si lo localizas), ordenados por gravedad.
- Fricciones y pasos lentos, ordenados por impacto.
- Mejoras de UI/UX concretas (con el texto o el cambio exacto).
- "Me gustaría poder…": lo que tu tipo de estudiante echa en falta.
- Qué NO pudiste probar.
Sé concreto y honesto: distingue lo que has comprobado ejecutando de lo que deduces leyendo el código. No inventes resultados.
