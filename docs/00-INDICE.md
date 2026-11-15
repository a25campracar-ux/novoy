# NoVoy · Índice del proyecto

Última revisión: 15/11/2026. Este índice dice qué hay, dónde está y en qué estado.
Empieza por aquí en cualquier conversación nueva sobre NoVoy.

## Qué es

NoVoy es una web instalable (PWA) para móvil que dice a un estudiante si puede faltar
hoy a clase sin pasar el límite de faltas de su centro. Muestra un semáforo y las horas
de margen por asignatura. Autor: C33, estudiante de 2º de DAW en el Institut Pedralbes
(Barcelona). El código lo escribe un asistente de IA bajo su dirección.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| App en producción | https://novoy-72h.pages.dev (Cloudflare Pages) |
| Despliegue antiguo | https://novoy.netlify.app (sin las funciones nuevas de servidor) |
| Código | github.com/a25campracar-ux/novoy, rama `main`; cada push despliega |
| Versión anterior | rama `v1-novoy` |
| Estado completo (documento vivo) | https://claude.ai/artifact/4GyPx8edEdMZ8JoMzqnHTY |
| Dosier de rediseño (13/11) | https://claude.ai/artifact/Vx1sRNY2HGchsNdAG8mp8Z |
| Briefing completo (13/11) | https://claude.ai/artifact/KiGekJKXFCcpQJtj5RUyMX |
| Control de faltas del autor en Notion | bases «Asignaturas por trimestre» y «Faltas» |

## Documentos de este proyecto

| Documento | Contenido | Fecha |
| --- | --- | --- |
| `claude/00-INDICE.md` | Este índice | 15/11/2026 |
| `claude/estado-y-traspaso.md` | Estado completo: producto, dominio, decisiones, pantallas, arquitectura, fórmula, datos externos, 19 fallos, deuda técnica, más de 90 ideas, hoja de ruta | 14/11/2026 |
| `claude/decisiones-y-memoria.md` | Todo lo que el autor ha decidido y pedido, en orden | 15/11/2026 |
| `claude/prompt-rediseno.md` | Prompt para encargar a otra IA el análisis y el rediseño | 14/11/2026 |
| `claude/origen/plan-de-decisiones.md` | Plan de decisiones del rediseño | 13/11/2026 |
| `claude/pruebas/BRIEF.md` | Instrucciones y entorno de las pruebas | 14/11/2026 |
| `claude/pruebas/informe-a2-lleida-grado-medio.md` | Informe completo: centro y ciclo fuera del catálogo, tarde, 55 min | 14/11/2026 |
| `claude/pruebas/informe-a5-tarragona-nocturno.md` | Informe completo: uso diario y auditoría visual | 14/11/2026 |
| `claude/pruebas/casos.md` | Los cinco casos de prueba (horarios, reglas y faltas simuladas) | 14/11/2026 |

Los mismos archivos están en el repositorio, carpeta `docs/`, junto con los guiones de
Playwright y 482 capturas reducidas que no caben aquí.

## Estado a 15/11/2026

- **En producción:** alta guiada de 6 pasos, catálogo DAW, fórmula horas semanales × 33,
  justificadas en 3 modos, importar faltas con IA, simulador, porcentaje secundario.
- **Sin corregir:** los 19 fallos de las pruebas. El más grave: el enlace «Pásalo a tu
  clase» borra las faltas de quien lo abre. No compartir ese enlace hasta arreglarlo.
- **Sin validar:** que la fórmula coincida con lo que calcula cada centro.
- **A medias:** tres perfiles de prueba (DAW Pedralbes, ASIX dual, vía IA).
- **Sin probar con personas reales.**

## Siguiente paso recomendado

1. Corregir los fallos 1 a 5 (sección 8 del estado).
2. Preguntar al tutor cómo se calcula el límite y comparar con el Moodle de 3 o 4 alumnos.
3. Probar con 5 a 8 compañeros, con cronómetro.

## Cómo mantener este proyecto

- Cada documento nuevo sobre NoVoy se guarda aquí y se añade a la tabla de arriba.
- Cuando cambie la app, se actualiza «Estado a…» en este índice y la sección afectada
  de `estado-y-traspaso.md`.
- Las decisiones nuevas del autor se añaden al final de `decisiones-y-memoria.md` con fecha.
