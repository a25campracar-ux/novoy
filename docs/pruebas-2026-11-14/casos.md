# NoVoy · Casos de prueba (14/11/2026)

Los cinco perfiles simulados, tal como cada probador los escribió antes de abrir la app. Solo a2 y a5 terminaron con informe.

---

## Caso A1 — alumno "caso feliz" (escrito ANTES de tocar la app)

- Centro: Institut Pedralbes (Barcelona). Ciclo: CFGS DAW. Curso: 2º. Grupo de mañana.
- Hoy: viernes 13/11/2026. Lo configura en el móvil, en el pasillo, con prisa.

## Horario semanal (17 h en el centro; hoja de planificación: 561 h ÷ 17 h/sem = 33 semanas)
Clases de 60 min. 08:00–11:00, recreo 11:00–11:30, 11:30–12:30.

| Hora | L | M | X | J | V |
|---|---|---|---|---|---|
| 08:00 | E.SER | E.CLI | DAW | DIW | IPO II |
| 09:00 | E.SER | E.CLI | DAW | E.CLI | OPT |
| 10:00 | DIW | IPO II | E.SER | PROJ (prof. DIW) | TUT |
| 11:30 | PROJ (prof. E.SER) | PROJ (prof. E.CLI) | — | — | — |

Horas a la semana tal como figuran: E.CLI 3, E.SER 3, DAW 2, DIW 2, IPO II 2, OPT 1, PROJ 3, TUT 1 = 17.

PROJ lo dan 3 profesores (los de E.SER, E.CLI y DIW). En semanas normales cada hora de PROJ cuenta
DENTRO del módulo de su profesor (faltas y horas). Así, para el centro:
E.CLI 4 h/sem (132 h), E.SER 4 h/sem (132 h), DIW 3 h/sem (99 h), DAW 2 (66 h), IPO II 2 (66 h), OPT 1 (33 h),
TUT 1 (33 h, fuera del currículum: no tiene % ni cuenta faltas). Suma 17 × 33 = 561 h.
Hay además 2 semanas de proyecto intensivo (una en el 2º trimestre y otra en el 3º; ninguna en el 1º).

## Calendario
- 1r trimestre 14/09/2026–27/11/2026 · 2n 30/11/2026–05/03/2027 · 3r 08/03/2027–26/05/2027.
- Festivos: 24/09 (Mercè), 12/10, 08/12, Navidad 22/12–07/01, Semana Santa 20–29/03, 17/05 (Segona Pasqua).
- Días lectivos: 53 + 56 + 51 = 160 (32,0 semanas reales, no 33).

## Reglas del centro
- Límite 25 %, POR MÓDULO y POR TRIMESTRE.
- Justificadas cuentan igual que las no justificadas.
- Retrasos: 3 retrasos = 1 h de falta en ese módulo.
- Tutoría no cuenta. PROJ cuenta dentro del módulo del profesor.

## Mis faltas del 14/09 al 13/11 (22 apuntes; ver faltas.json)
| Fecha | Qué | Cuenta en | h |
|---|---|---|---|
| ma 22/09 | retraso E.CLI 08:00 | E.CLI | R |
| lu 28/09 | día entero, JUSTIFICADO (médico): E.SER 2, DIW 1, PROJ 1 | E.SER 3, DIW 1 | 4 |
| mi 07/10 | DAW 08–10 | DAW | 2 |
| vi 09/10 | día entero: IPO II, OPT, TUT | IPO II 1, OPT 1, (TUT 1 no cuenta) | 3 |
| ma 13/10 | retraso E.CLI | E.CLI | R |
| mi 21/10 | DAW 08–10 | DAW | 2 |
| ju 29/10 | día entero: DIW, E.CLI, PROJ(DIW) | DIW 2, E.CLI 1 | 3 |
| lu 02/11 | E.SER 08–10 | E.SER | 2 |
| mi 04/11 | DAW 08:00 (1 h) | DAW | 1 |
| vi 06/11 | IPO II 08:00 | IPO II | 1 |
| ma 10/11 | retraso E.CLI 08:00 + falta PROJ 11:30 (prof. E.CLI) | E.CLI | R + 1 |

## Verdad calculada a mano (verdad.js, independiente de la app) — 1r trimestre
Dos métodos posibles para el total del trimestre:
- A "×33 repartido": h/sem × 33 × (53 días del trimestre / 160 del curso).
- B "días reales": contar las sesiones que de verdad caen en el trimestre (lo que pasa lista el profesor).

| Módulo | h/sem | Oficial curso | A: T1 ×33 | B: T1 real | Cuenta (faltas+retr.) | Límite A / B | % A / B | Me quedan A / B |
|---|---|---|---|---|---|---|---|---|
| E.SER | 4 | 132 | 43,73 | 41 | 5 | 10,93 / 10,25 | 11,4 / 12,2 | 5,93 / 5,25 |
| E.CLI | 4 | 132 | 43,73 | 43 | 2 + 3R = 3 | 10,93 / 10,75 | 6,9 / 7,0 | 7,93 / 7,75 |
| DIW | 3 | 99 | 32,79 | 30 | 3 | 8,20 / 7,50 | 9,1 / 10,0 | 5,20 / 4,50 |
| DAW | 2 | 66 | 21,86 | 22 | 5 | 5,47 / 5,50 | 22,9 / 22,7 | 0,47 / 0,50 |
| IPO II | 2 | 66 | 21,86 | 22 | 2 | 5,47 / 5,50 | 9,1 / 9,1 | 3,47 / 3,50 |
| OPT | 1 | 33 | 10,93 | 11 | 1 | 2,73 / 2,75 | 9,1 / 9,1 | 1,73 / 1,75 |
| TUT | 1 | (33) | — | — | no cuenta | — | — | — |

Mi "verdad" de referencia = método B (lo que el profesor tiene en su lista del trimestre). En horas enteras:
E.SER me quedan 5, E.CLI 7, DIW 4, DAW 0 (una hora más y me paso: 6/22 = 27,3 %), IPO II 3, OPT 1.

---

## Caso a2 — 1º CFGM Cures Auxiliars d'Infermeria (CAI), instituto público de Lleida

(Escrito ANTES de tocar la app. Datos en caso_data.js; verdad calculada con verdad.js, independiente de la app.)

## Quién soy
17 años, Android barato, no sé qué es un JSON, nunca he usado ChatGPT. Centro: "Institut Guindàvols" (Lleida) — nombre
de trabajo para un instituto público de Lleida; no está en el catálogo de la app. Ciclo: CFGM Cures Auxiliars d'Infermeria,
1º (el ciclo es un solo curso largo en el centro). Turno de tarde.

## Horario semanal (30 sesiones; cada sesión de 55 min cuenta como 1 hora de falta)
Franjas: P1 15:00-15:55 · P2 15:55-16:50 · P3 16:50-17:45 · RECREO 17:45-18:05 · P4 18:05-19:00 · P5 19:00-19:55 · P6 19:55-20:50

| | Lunes | Martes | Miércoles | Jueves | Viernes |
|---|---|---|---|---|---|
| P1 | Cures | Higiene | Ésser humà | Odonto | Benestar |
| P2 | Cures | Higiene | Ésser humà | Odonto | Benestar |
| P3 | Cures | Benestar | Cures | OADS | Ésser humà |
| P4 | Ésser humà | Primers auxilis | Cures | Higiene | FOL |
| P5 | Ésser humà | Primers auxilis | Cures | Relacions | Suport |
| P6 | FOL | Tutoria | Suport | Relacions | OADS |

Bloques: Cures 3 h el lunes; Cures 3 h el miércoles PARTIDO por el recreo (P3 + P4-P5); varios de 2 h.
Horas/semana: Cures 6, Ésser humà 5, Benestar 3, Higiene 3, OADS 2, Odonto 2, Primers auxilis 2, Relacions 2, Suport 2, FOL 2, Tutoria 1 = 30.
(11 nombres a escribir. No conozco las horas oficiales de los módulos.)

## Calendario 2026-27
- Trimestres: 1r 14/09/2026–04/12/2026 · 2n 09/12/2026–12/03/2027 · 3r 15/03/2027–18/06/2027
- Festivos/no lectivos: 29/09 Sant Miquel (Lleida) · 12/10 · 02/11 lliure disposició · 07/12 lliure disposició · 08/12 ·
  22/12–07/01 Navidad · 15/02 lliure disposició · 20–29/03 Semana Santa · 11/05 Sant Anastasi (Lleida)
- NO son festivos míos: 24/09 La Mercè (jueves, tuve clase) ni 17/05 Segona Pasqua.

## Reglas del centro
- Límite 20 % por módulo sobre el CURSO ENTERO (no por trimestre).
- Horas del módulo según el centro: horas semanales × 33 semanas (supuesto del caso; no tengo el papel oficial).
- Justificadas NO cuentan. 3 retrasos (no justificados) en un módulo = 1 falta de 1 h. Tutoría no cuenta.

## Mis faltas del 14/09 al 13/11/2026 (57 horas-sesión en 20 días + 10 retrasos)
Injustificadas: 22/09 día entero · 24/09 P1-P2 (Odonto; día que la app cree festivo) · 30/09 P6 · 02/10 P5 · 09/10 P5 · 14/10 P6 ·
16/10 P5-P6 · 19/10 P1-P3 · 21/10 día entero · 23/10 P5 · 28/10 P6 · 30/10 día entero · 04/11 P3-P5 · 06/11 P4-P6 · 11/11 P6 · 12/11 P1-P2
Justificadas (médico): 05/10 día entero · 06/10 día entero · 27/10 P4-P5 · 09/11 P1-P3
Retrasos (1ª hora): 21/09, 28/09, 26/10 (Cures) · 23/09, 07/10 (Ésser humà) · 15/10, 22/10, 05/11 (Odonto) · 10/11 (Higiene, justificado) · 13/11 (Benestar)

## Verdad (verdad.js → verdad.json)
| Módulo | h/sem | Total curso | Límite 20% | Injust. | Just. | Retrasos | Cuentan | % | Me quedan |
|---|---|---|---|---|---|---|---|---|---|
| Benestar | 3 | 99 | 19,8 | 3 | 1 | 1 | 3 | 3,0 | 16,8 |
| Cures | 6 | 198 | 39,6 | 9 | 6 | 3 | 10 | 5,1 | 29,6 |
| FOL | 2 | 66 | 13,2 | 2 | 1 | 0 | 2 | 3,0 | 11,2 |
| Higiene | 3 | 99 | 19,8 | 2 | 2 | 0 (1 just.) | 2 | 2,0 | 17,8 |
| OADS | 2 | 66 | 13,2 | 3 | 0 | 0 | 3 | 4,5 | 10,2 |
| Odonto | 2 | 66 | 13,2 | 4 | 0 | 3 | 5 | 7,6 | 8,2 |
| Primers auxilis | 2 | 66 | 13,2 | 2 | 4 | 0 | 2 | 3,0 | 11,2 |
| Relacions | 2 | 66 | 13,2 | 0 | 0 | 0 | 0 | 0 | 13,2 |
| Suport | 2 | 66 | 13,2 | 11 | 0 | 0 | 11 | 16,7 | 2,2 |
| Ésser humà | 5 | 165 | 33,0 | 3 | 2 | 2 | 3 | 1,8 | 30,0 |
Tutoria: no cuenta (1 falta el 22/09 y 1 justificada el 06/10, irrelevantes).

---

## Caso a3 — 2º CFGS ASIX en FP dual, instituto de Sabadell (personaje ficticio)

## Centro, ciclo y curso
- Institut (ficticio) de Sabadell. CFGS ASIX (Administració de Sistemes Informàtics en Xarxa), 2º curso, FP dual, grupo B.
- Clases en el centro del 14/09/2026 al 12/02/2027 (~21 semanas con clase). Desde el 15/02/2027: estancia en empresa, sin clase.

## Franjas (iguales todos los días)
08:00-09:00 · 09:00-10:00 · 10:00-11:00 · recreo 11:00-11:20 · 11:20-12:20 · 12:20-13:20 · 13:20-14:20

## Horario A (14/09/2026 → 30/10/2026)
| | 1ª | 2ª | 3ª | 4ª | 5ª | 6ª |
|---|---|---|---|---|---|---|
| Lun | ASO | ASO | ASO | SAD | SAD | — |
| Mar | SXI | SXI | SXI | IAW | IAW | IAW |
| Mié | ASGBD | ASGBD | ASGBD | EIE | EIE | TUT |
| Jue | SAD | SAD | ASO | IAW | DIG* | DIG* |
| Vie | SXI | SXI | — | ASGBD (lab grupo B) | ASGBD (lab B) | — |

## Horario B (desde el 02/11/2026): ASO y SAD se reordenan, IAW pierde 1 h y entra CIB (antes no se daba)
| | 1ª | 2ª | 3ª | 4ª | 5ª | 6ª |
|---|---|---|---|---|---|---|
| Lun | SAD | SAD | SAD | ASO | ASO | — |
| Mar | SXI | SXI | SXI | IAW | IAW | CIB |
| Mié | ASGBD | ASGBD | ASGBD | EIE | EIE | TUT |
| Jue | ASO | ASO | SAD | IAW | DIG* | DIG* |
| Vie | SXI | SXI | CIB | ASGBD (lab B) | ASGBD (lab B) | CIB |

- `DIG*` = quincenal: solo los jueves de semana ISO PAR (17/09, 01/10, 15/10, 29/10, 12/11, 26/11, …). En semana impar esas dos horas quedan libres.
- Desdoble: viernes 4ª-5ª el grupo B tiene laboratorio de ASGBD mientras el A tiene teoría de SXI (el horario del A es distinto del mío).
- Semanas de proyecto (sin clase normal, 6 h/día de PRJ, las 6 franjas): 19-23/10/2026 y 18-22/01/2027.
- TUT (tutoría): no cuenta faltas.

## Calendario
- Bloque 1 (RA/UF del 1r trimestre): 14/09/2026 → 04/12/2026. Bloque 2: 07/12/2026 → 12/02/2027.
- Festivos: 12/10/2026; 07/12 (libre disposición) y 08/12/2026; Navidad 22/12/2026 → 07/01/2027. (La Mercè 24/09 NO es festivo en Sabadell.)

## Reglas del centro
- Límite 15 % de faltas injustificadas por módulo y por bloque (trimestre), sobre las horas realmente programadas del bloque.
- Justificadas: porcentaje propio, hasta un 10 % adicional.
- Retrasos: 2 retrasos = 1 falta (1 h) del mismo módulo.

## Mis faltas (14/09 → 13/11/2026)
| Fecha | Módulo | Horas | Tipo |
|---|---|---|---|
| lun 21/09 | ASO | – | retraso |
| mar 22/09 | IAW | 3 | falta |
| lun 28/09 | ASO | 3 | justificada |
| lun 05/10 | ASO | – | retraso |
| mié 07/10 | ASGBD | – | retraso |
| jue 08/10 | SAD 2 + ASO 1 | 3 | falta |
| mié 14/10 | ASGBD | – | retraso |
| jue 15/10 | DIG | 2 | falta |
| vie 16/10 | ASGBD | 2 | justificada |
| mié 21/10 (semana de proyecto) | PRJ | 2 | falta |
| lun 02/11 (1er día del horario B) | SAD | 3 | falta |
| vie 06/11 | CIB 2 + ASGBD 2 (just.) | 4 | falta / justificada |
| mar 10/11 | CIB | – | retraso |
| jue 12/11 | DIG 2 + IAW 1 | 3 | falta |

## Verdad (script independiente verdad.js; bloque 1, a 13/11/2026)
| Módulo | Horas bloque 1 | Límite 15 % | Cuentan (inj. + retrasos/2) | % | Margen | Just. | Margen just. (10 %) | Clase que queda |
|---|---|---|---|---|---|---|---|---|
| ASO | 41 | 6,15 | 2 | 4,9 | 4,15 | 3 | 1,1 | 12 |
| SAD | 42 | 6,3 | 5 | 11,9 | 1,3 | 0 | 4,2 | 12 |
| SXI | 55 | 8,25 | 0 | 0 | 8,25 | 0 | 5,5 | 15 |
| IAW | 39 | 5,85 | 4 | 10,3 | 1,85 | 0 | 3,9 | 9 |
| ASGBD | 55 | 8,25 | 1 | 1,8 | 7,25 | 4 | 1,5 | 15 |
| EIE | 22 | 3,3 | 0 | 0 | 3,3 | 0 | 2,2 | 6 |
| DIG | 12 | 1,8 | 4 | 33,3 | −2,2 (PASADO) | 0 | 1,2 | 2 |
| PRJ | 30 | 4,5 | 2 | 6,7 | 2,5 | 0 | 3 | 0 |
| CIB | 15 | 2,25 | 2 | 13,3 | 0,25 | 0 | 1,5 | 9 |
Bloque 2 (horas): ASO 24, SAD 24, SXI 29, IAW 16, ASGBD 32, EIE 12, DIG 8, CIB 19, PRJ 30. 94 días lectivos, 21 semanas con clase.

---

## Caso a4 — «Júlia», 1r CFGS Màrqueting i Publicitat (concertado, Girona)

- Centro: Escola concertada de Girona (ficticia: "Escola Bell-lloc Girona FP"). Ciclo: CFGS Màrqueting i Publicitat, 1r curso. Turno de mañana.
- Usa ChatGPT gratis para todo; elige siempre la opción «Con tu IA».
- 30 h/semana, 08:00–14:30, recreo 11:00–11:30, sesiones de 60 min.

## Horario
| | Lunes | Martes | Miércoles | Jueves | Viernes |
|---|---|---|---|---|---|
| 08-09 | MD | PM | GEF | ANG | MD |
| 09-10 | MD | PM | GEF | ANG | MD |
| 10-11 | GEF | IC | MD | PM | PM |
| 11:00-11:30 | recreo | | | | |
| 11:30-12:30 | GEF | IC | ACU | PM | GEF |
| 12:30-13:30 | ANG | FOL | ACU | IC | FOL |
| 13:30-14:30 | ANG | FOL | TUT | IC | ACU |

MD Màrqueting digital 5 h · GEF Gestió econòmica i financera 5 h · PM Polítiques de màrqueting 5 h · IC Investigació comercial 4 h ·
ACU Atenció al client, consumidor i usuari 3 h · FOL 3 h · ANG Anglès 4 h · TUT Tutoria 1 h = 30 h.

## Calendario
- 1r trimestre 14/09/2026–04/12/2026 · 2n 09/12/2026–12/03/2027 · 3r 15/03/2027–11/06/2027
- Festivos: 12/10, 29/10 (Sant Narcís, local Girona), 2/11 (lliure disposició), 7-8/12, Nadal 23/12–07/01, 15/02, Setmana Santa 22–29/03, 17/05.

## Reglas del centro
- Por módulo y por trimestre, sobre las horas REALES impartidas en el trimestre (las sesiones del registro de Moodle).
- Límite 1: faltas NO justificadas ≤ 25 %.
- Límite 2 (a la vez): justificadas + no justificadas ≤ 40 %.
- Retrasos (R) no cuentan. Tutoría: se pasa lista pero no hay pérdida de evaluación (se quiere excluir). Anglès cuenta como un módulo más.

## Faltas reales 14/09–13/11/2026 (41 h: 27 no justificadas + 14 justificadas; 3 retrasos)
- 21/09 lun: MD 2 A, GEF 2 A (2 sesiones de 1 h), ANG 2 A
- 28/09 lun: MD retard
- 01/10 jue: ANG 2 J, PM 2 J (2 sesiones de 1 h), IC 2 J (grip)
- 02/10 vie: MD 2 J, PM 1 J, GEF 1 J, FOL 1 J, ACU 1 J (grip)
- 13/10 mar: PM 2 A, IC 2 A (2 sesiones), FOL 2 A
- 15/10 jue: ANG retard
- 19/10 lun: MD 2 A
- 28/10 mié: ACU 2 A, TUT 1 A
- 30/10 vie: MD 2 A, PM 1 A, GEF 1 A, FOL 1 A, ACU 1 A
- 04/11 mié: GEF 2 A
- 05/11 jue: IC 2 J (metge)
- 09/11 lun: MD 2 A
- 11/11 mié: GEF retard

## Verdad (script propio verdad.js, independiente de la app; 1r trimestre)
| mod | h trim. | A | J | %A | %A+J | margen 25 % (A) | margen 40 % (A+J) | margen real (mín.) |
|---|---|---|---|---|---|---|---|---|
| MD | 56 | 8 | 2 | 14,3 | 17,9 | 6 | 12,4 | 6 |
| GEF | 56 | 5 | 1 | 8,9 | 10,7 | 9 | 16,4 | 9 |
| PM | 58 | 3 | 3 | 5,2 | 10,3 | 11,5 | 17,2 | 11,5 |
| IC | 46 | 2 | 4 | 4,3 | 13,0 | 9,5 | 12,4 | 9,5 |
| ACU | 36 | 3 | 1 | 8,3 | 11,1 | 6 | 10,4 | 6 |
| FOL | 36 | 3 | 1 | 8,3 | 11,1 | 6 | 10,4 | 6 |
| ANG | 42 | 2 | 2 | 4,8 | 9,5 | 8,5 | 12,8 | 8,5 |
| TUT | 12 | 1 | 0 | (no cuenta) | | | | |

---

## Caso a5 — Bachillerato nocturno para adultos (escrito ANTES de abrir la app)

- **Centro:** instituto público de Tarragona, régimen nocturno para adultos. No es FP: no hay ciclo ni módulos, hay asignaturas.
- **Curso:** 1º de Bachillerato (científico-tecnológico). 29 años, trabaja de día. Repetidor parcial: cursa 6 de 9 asignaturas.
- **Móvil:** iPhone pequeño (320×568 / 375×667), a veces letra grande y modo oscuro.

## Horario (lunes a jueves, 17:30–22:00; viernes SIN clase)
Franjas: 17:30–18:30 · 18:30–19:30 · descanso 19:30–20:00 · 20:00–21:00 · 21:00–22:00

|        | Lun | Mar | Mié | Jue | Vie |
|--------|-----|-----|-----|-----|-----|
| 17:30  | MAT | (libre: asignatura ya aprobada) | MAT | ANG | — |
| 18:30  | MAT | ANG | CAT | MAT | — |
| 20:00  | CAT | FIQ | FIL | FIQ | — |
| 21:00  | FIL | FIQ | TEC | TEC | — |

Horas/semana: MAT 4 · FIQ 3 · CAT 2 · FIL 2 · ANG 2 · TEC 2 = 15 h. Sin tutoría.

## Calendario 2026-27
- 1ª evaluación: 14/09/2026 – 27/11/2026
- 2ª evaluación: 30/11/2026 – 05/03/2027
- 3ª evaluación: 08/03/2027 – 04/06/2027
- Festivos/no lectivos: 23/09 (Santa Tecla, local), 12/10, 02/11 (libre disposición), 07–08/12, 22/12–07/01 (Navidad), 15/02 (libre disposición), 22–29/03 (Semana Santa).

## Reglas del centro
- Se pierde la evaluación continua de una asignatura si se falta a MÁS del 20 % de sus horas reales **en cada evaluación** (se reinicia en cada una).
- Las horas son las sesiones realmente impartidas en la evaluación (no "horas semanales × 33").
- Falta justificada por trabajo: cuenta **media falta** (0,5 h por hora). Sin justificar: 1.
- Retrasos: se anotan pero no cuentan.

## Mis faltas hasta hoy (viernes 13/11/2026)
| Fecha | Asignatura | Horas | Justificada (trabajo) |
|---|---|---|---|
| Mar 22/09 | FIQ (20:00 y 21:00) | 2 | no |
| Lun 05/10 | día entero: MAT 2, CAT 1, FIL 1 | 4 | sí |
| Jue 15/10 | ANG 17:30 | 1 | sí |
| Mié 21/10 | TEC 21:00 | 1 | no |
| Lun 26/10 | MAT 17:30 | 1 | sí |
| Jue 29/10 | FIQ 20:00 | 1 | no |
| Mar 03/11 | ANG 18:30 | 1 | no |
| Lun 09/11 | FIL 21:00 | 1 | no |
| Mié 11/11 | MAT 17:30 | 1 | no |
| Jue 12/11 | ANG 17:30 | retraso | — |

## Verdad calculada (verdad.js, independiente de la app) — 1ª evaluación
| Asig | Horas reales | Límite 20 % | Faltas brutas | Computables (just = ½) | % | Margen | Clases que quedan desde hoy |
|---|---|---|---|---|---|---|---|
| MAT | 39 | 7,8 | 4 | 2,5 | 6,4 % | 5,3 | 8 |
| CAT | 19 | 3,8 | 1 | 0,5 | 2,6 % | 3,3 | 4 |
| FIL | 19 | 3,8 | 2 | 1,5 | 7,9 % | 2,3 | 4 |
| ANG | 22 | 4,4 | 2 | 1,5 | 6,8 % | 2,9 | 4 |
| FIQ | 33 | 6,6 | 3 | 3 | 9,1 % | 3,6 | 6 |
| TEC | 21 | 4,2 | 1 | 1 | 4,8 % | 3,2 | 4 |

2ª evaluación (totales reales): MAT 42, CAT 21, FIL 21, ANG 21, FIQ 31, TEC 22. 3ª: MAT 46, CAT 23, FIL 23, ANG 24, FIQ 36, TEC 24.
