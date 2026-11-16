# NoVoy · Índice del proyecto

Última revisión: 16/11/2026, noche (Fase 1 hecha salvo publicar). Este índice dice qué hay, dónde está y en qué estado. Empieza por aquí en cualquier conversación nueva sobre NoVoy.

**Lo siguiente que toca está en `claude/hoja-de-ruta.md`, apartado 6 «Próximas sesiones».**

## Qué es

NoVoy es una web instalable (PWA) para móvil que dice a un estudiante si puede faltar hoy a clase sin pasar el límite de faltas de su centro. Muestra un semáforo y las horas de margen por asignatura.

- **Autor:** C33, estudiante de 2º de DAW en el Institut Pedralbes (Barcelona).
- **Quién escribe el código:** un asistente de IA bajo su dirección. El autor no escribe ni revisa código.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| App en producción (v1) | https://novoy-72h.pages.dev (Cloudflare Pages, rama `main`) |
| v2 en pruebas | https://v2.novoy-72h.pages.dev (Hoy · Faltas · Ajustes; el alta en /alta.html; aviso legal en /legal.html). Rama `v2`, se publica sola en cada push si pasan las pruebas |
| Despliegue antiguo | https://novoy.netlify.app (sin las funciones nuevas de servidor) |
| Código | github.com/a25campracar-ux/novoy (público). Pruebas y recorridos en Chrome en GitHub Actions y en la compilación de Cloudflare |
| Versión anterior | rama `v1-novoy` |
| Estado completo de la v1 (documento vivo) | https://claude.ai/artifact/4GyPx8edEdMZ8JoMzqnHTY |
| Dosier de rediseño (13/11) | https://claude.ai/artifact/Vx1sRNY2HGchsNdAG8mp8Z |
| Briefing completo (13/11) | https://claude.ai/artifact/KiGekJKXFCcpQJtj5RUyMX |
| Mockup del nuevo flujo (16/11): uso diario, alta y reglas | https://claude.ai/artifact/NUPztnjbkyAuREcXd1raFj |
| Control de faltas del autor en Notion | Bases «Asignaturas por trimestre» y «Faltas» |

## Documentos de este proyecto

| Documento | Contenido | Fecha |
| --- | --- | --- |
| `claude/00-INDICE.md` | Este índice | 16/11/2026 |
| `claude/hoja-de-ruta.md` | **Lista de tareas**: dónde estamos, lo hecho hoy, hitos, tareas por fase (quién, cómo y cuándo está hecho), decisiones pendientes, cómo trabajamos y próximas sesiones | 16/11/2026 |
| `claude/decisiones-y-memoria.md` | Todo lo que el autor ha decidido y pedido, en orden | 16/11/2026 |
| `claude/metodo-configuracion.md` | Método de alta, reglas y faltas de antes, y cómo está hecho en la v2 | 16/11/2026 |
| `claude/estado-y-traspaso.md` | Estado completo de la **v1**: producto, dominio, pantallas, arquitectura, fórmula, datos externos, 19 fallos, deuda técnica, más de 90 ideas. Para la v2, la hoja de ruta | 14/11/2026 |
| `claude/prompt-rediseno.md` | Prompt para encargar a otra IA el análisis y el rediseño | 14/11/2026 |
| `claude/origen/plan-de-decisiones.md` | Plan de decisiones del rediseño | 13/11/2026 |
| `claude/pruebas/BRIEF.md` | Instrucciones y entorno de las pruebas | 14/11/2026 |
| `claude/pruebas/informe-a2-lleida-grado-medio.md` | Informe completo: centro y ciclo fuera del catálogo, tarde, 55 min | 14/11/2026 |
| `claude/pruebas/informe-a5-tarragona-nocturno.md` | Informe completo: uso diario y auditoría visual | 14/11/2026 |
| `claude/pruebas/casos.md` | Los cinco casos de prueba (horarios, reglas y faltas simuladas) | 14/11/2026 |

Los mismos archivos están en el repositorio, en la carpeta `docs/`. Allí están también los guiones de Playwright y 482 capturas reducidas que no caben aquí.

## Estado a 16/11/2026 (noche)

- **En producción (v1, rama `main`):** sin cambios. No compartir el enlace «Pásalo a tu clase» de la v1, porque borra las faltas de quien lo abre.
- **Versión 2 (rama `v2`): la Fase 1 está hecha salvo publicar.**
  - Alta completa, con «¿Tu horario cambia durante el curso?» y «Ya tengo cuenta».
  - Hoy con «Fui» y «Falté», «Falté a…» y Simular.
  - Faltas por asignatura: justificar y borrar.
  - Ajustes: horario, asignaturas con casos especiales (PROJ por clase, fechas, semanas especiales, regla propia), reglas, calendario, pasar la lista, enlace de clase, cuenta, instalar, aviso legal y borrar todo.
- **Pendiente del autor:** poner su reparto de PROJ, probar con sus faltas reales, aprobar el aviso legal y decir «publica».
- **Sin validar:** que la fórmula coincida con lo que calcula cada centro. **Sin probar con personas reales.**

## Cómo mantener este proyecto

- Cada documento nuevo sobre NoVoy se guarda aquí y se añade a la tabla de arriba.
- Al acabar cada sesión se actualizan `hoja-de-ruta.md` (estados de las tareas) y el apartado «Estado a…» de este índice.
- Las decisiones nuevas del autor se añaden al final de `decisiones-y-memoria.md`, con fecha.
- Los datos reales del autor (su lista de faltas) nunca se suben al repositorio.
