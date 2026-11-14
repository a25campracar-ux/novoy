# Caso A1 — alumno "caso feliz" (escrito ANTES de tocar la app)

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
