# Plan de Implementación — Nido

6 fases ordenadas de menor a mayor complejidad. **Cada fase debe funcionar completamente antes de pasar a la siguiente.**

---

## Fase 1: Fundación

**Objetivo**: Proyecto corriendo con Electron + React + DB + layout base + tema.

**Archivos a leer antes**: `docs/STACK.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DESIGN_SYSTEM.md`

### Pasos:
1. Inicializar proyecto con Electron + React + Vite + TypeScript + pnpm
2. Configurar Tailwind CSS con la paleta de colores completa (light + dark)
3. Configurar SQLite + Drizzle ORM + crear todas las tablas del schema
4. Crear migraciones y seed de datos iniciales (tags default, templates, settings, dashboard layout)
5. Setup Electron IPC: preload script con `contextBridge`, funciones base de CRUD genérico
6. Implementar layout base:
   - `MainLayout.tsx` con sidebar + content area
   - `Sidebar.tsx` con navegación y toggle
   - `TopBar.tsx` con título de página
7. Sistema de routing (react-router o simple state-based)
8. Sistema de temas dark/light con toggle y persistencia en settings
9. Componentes UI base: `Button`, `Input`, `Modal`, `Checkbox`, `Badge`, `Toggle`, `Tooltip`, `ProgressBar`
10. Configurar Framer Motion y crear wrappers de animación reutilizables

**Criterio de completitud**: La app abre en Electron, muestra sidebar con navegación funcional, toggle de tema funciona, DB tiene tablas creadas con seed data.

---

## Fase 2: Core Features

**Objetivo**: CRUD completo de proyectos, tareas, tags, y Kanban funcional.

**Archivos a leer antes**: `docs/SCREENS.md` (secciones 4: Kanban y 6: Proyectos), `docs/DATABASE.md`

### Pasos:
1. Zustand stores: `useProjectStore`, `useTaskStore`
2. CRUD de Proyectos con jerarquía ilimitada:
   - Crear, editar, eliminar, archivar proyectos
   - Mover proyecto dentro de otro (cambiar parent_id)
   - `ProjectTree.tsx` recursivo con expand/collapse
   - `ProjectNode.tsx` individual con context menu
3. Generación automática de 3 columnas default al crear proyecto
4. CRUD de columnas custom
5. CRUD de Tareas con todas las propiedades:
   - Título, descripción, prioridad, importante, fecha, hora, tiempo estimado
   - Asignar a proyecto y columna
6. Sistema de Tags:
   - CRUD de tags con colores
   - Asignar/desasignar tags a tareas
   - `TagManager.tsx` en settings
7. Kanban Board:
   - `KanbanBoard.tsx` con columnas del proyecto seleccionado
   - `KanbanColumn.tsx` con drag & drop via @dnd-kit
   - `KanbanCard.tsx` con toda la info visual
   - Drag & drop entre columnas que actualiza `column_id`
   - Selector de proyecto arriba (dropdown)
8. Modal de detalle de tarea (`CardDetail.tsx`):
   - Todos los campos editables
   - Subtareas con checkbox y agregar inline
   - Progress bar de subtareas
9. Filtros y ordenamiento en Kanban
10. Crear tarea rápida (inline en columna)

**Criterio de completitud**: Puedo crear proyectos anidados, crear tareas con todos los campos, arrastrar tareas entre columnas del Kanban, usar tags, ver y editar detalles de tarea.

---

## Fase 3: Calendario

**Objetivo**: Las 4 vistas de calendario funcionales con CRUD de eventos.

**Archivos a leer antes**: `docs/SCREENS.md` (sección 5: Calendario), `docs/DESIGN_SYSTEM.md`

### Pasos:
1. Zustand store: `useCalendarStore`
2. CRUD de Eventos (crear, editar, eliminar)
3. `CalendarView.tsx` wrapper con tabs de vistas
4. Vista Mensual (`MonthView.tsx`):
   - Grilla 7×N con días del mes
   - Mostrar eventos y tareas con deadline como chips
   - Navegación entre meses
   - Hover y click en eventos
5. Vista Semanal (`WeekView.tsx`):
   - 7 columnas con timeline de horas
   - Bloques de eventos posicionados por hora
   - Línea de "ahora"
   - Sección "Todo el día" arriba
6. Vista Anual (`YearView.tsx`):
   - 12 mini calendarios en grilla
   - Heatmap de actividad por día
   - Click en mes → navega a mensual
7. Vista Semestral (`SemesterView.tsx`):
   - Timeline horizontal con barras de proyectos
   - Mini calendarios debajo
   - Selector de rango del semestre
8. Modal de crear/editar evento (`EventModal.tsx`)
9. Drag & drop de eventos en vista mensual (cambiar fecha)
10. `DayCell.tsx`, `EventChip.tsx` con estilos y animaciones

**Criterio de completitud**: Las 4 vistas de calendario renderizan correctamente, puedo crear y editar eventos, puedo navegar entre meses/semanas/años, la vista semestral muestra timeline + mini cals.

---

## Fase 4: Productividad

**Objetivo**: Vista de Hoy, Pomodoro, Post-its, y Tareas recurrentes.

**Archivos a leer antes**: `docs/SCREENS.md` (secciones 3, 7), `docs/FEATURES.md` (secciones 1: Recurrencia)

### Pasos:
1. Vista de Hoy (`TodayView.tsx`):
   - Timeline vertical del día con eventos
   - Línea de "ahora" en tiempo real
   - Panel lateral con tareas del día
   - Resumen del día
2. Pomodoro completo:
   - `usePomodoroStore` con timer state
   - `PomodoroFull.tsx` con timer circular animado
   - `PomodoroTimer.tsx` con anillo de progreso
   - Controles: play/pause/skip/reset
   - Selector de tarea asociada
   - Tracking de tiempo en `actual_minutes`
   - Estadísticas: sesiones hoy, tiempo total, racha
   - `PomodoroStats.tsx` con gráfico semanal
   - Sonido y notificación al completar
3. Post-its:
   - `usePostItStore`
   - CRUD de post-its
   - Post-its arrastrables con @dnd-kit (posición libre)
   - Colores seleccionables
   - Edición inline del contenido
   - Vinculación opcional a tarea existente
   - Efecto visual: rotación sutil, sombra
4. Tareas Recurrentes:
   - `src/lib/recurrence.ts` con funciones de cálculo
   - UI en modal de tarea (toggle + config de recurrencia)
   - Al completar tarea recurrente → genera próxima instancia
   - Vista de recurrencias activas en Settings

**Criterio de completitud**: Vista de Hoy muestra timeline con eventos y tareas, Pomodoro funciona con timer y tracking, puedo crear post-its y moverlos libremente, las tareas recurrentes generan próximas instancias.

---

## Fase 5: Dashboard y Polish

**Objetivo**: Dashboard con widgets movibles, búsqueda global, templates, y todas las animaciones.

**Archivos a leer antes**: `docs/SCREENS.md` (secciones 2, 8), `docs/FEATURES.md` (secciones 2, 3, 4), `docs/DESIGN_SYSTEM.md` (animaciones)

### Pasos:
1. Dashboard:
   - `useDashboardStore` con layout persistido
   - `WidgetGrid.tsx` con sistema de grilla 12 columnas
   - Drag & drop de widgets para reordenar
   - Redimensionar widgets
   - Implementar los 6 widgets:
     - `TodayWidget.tsx`
     - `DeadlinesWidget.tsx`
     - `ProgressWidget.tsx`
     - `PostItBoard.tsx` (mini board dentro del widget)
     - `MiniCalendar.tsx`
     - `PomodoroWidget.tsx`
   - Botón reset layout
   - Menú "..." en cada widget (ocultar, configurar)
2. Búsqueda Global:
   - `useSearch` hook con Fuse.js
   - `CommandPalette.tsx` con `cmdk`
   - Indexar tareas, proyectos, eventos, post-its, tags
   - Resultados categorizados
   - Acciones rápidas
   - Atajo Ctrl+K
3. Templates:
   - `src/lib/templates.ts`
   - Templates predefinidos en seed
   - `TemplateSelector.tsx` UI
   - Guardar proyecto como template
   - Aplicar template con variables
4. Animaciones completas:
   - Revisar CADA componente y agregar las animaciones de `docs/DESIGN_SYSTEM.md`
   - Completar tarea: confetti sutil
   - Transiciones de página
   - Hover effects
   - Drag & drop lift
   - Post-it effects
   - Loading states
5. Atajos de teclado: `useKeyboardShortcuts.ts` con todos los atajos

**Criterio de completitud**: Dashboard muestra todos los widgets, puedo mover y redimensionar widgets, búsqueda global funciona con Ctrl+K, puedo crear proyectos desde templates, todas las animaciones funcionan.

---

## Fase 6: Integración y Distribución

**Objetivo**: Google Calendar, export/import, build del .dmg y .exe.

**Archivos a leer antes**: `docs/FEATURES.md` (secciones 5, 6)

### Pasos:
1. Google Calendar:
   - OAuth flow en main process
   - Almacenamiento seguro de tokens
   - Listar calendarios
   - Sync bidireccional de eventos
   - Badge "G" en eventos sincronizados
   - UI en Settings
   - Auto-sync cada 5 min + botón manual
2. Sistema de notificaciones:
   - Notificaciones nativas de Electron
   - Toasts in-app
   - Alertas de deadline próximo y overdue
3. Export/Import:
   - Exportar toda la DB como JSON
   - Importar JSON (con validación)
   - Reset de datos
4. Build multiplataforma:
   - Configurar `electron-builder.yml`
   - **macOS (principal)**: build para Apple Silicon (arm64), generar `.dmg`
   - **Windows (secundario)**: generar `.exe` installer
   - Ícono personalizado: `.icns` para macOS, `.ico` para Windows
   - Nombre "Nido" en la barra de título, dock/taskbar
   - Firmado de app en macOS si es posible
5. Testing final:
   - Verificar todas las pantallas
   - Performance con muchos datos
   - Edge cases (sin datos, muchos datos, textos largos)
   - Tema dark/light en todas las pantallas

**Criterio de completitud**: Google Calendar sincroniza eventos, puedo exportar e importar datos, el .dmg se instala y funciona correctamente en macOS (Apple Silicon), opcionalmente el .exe en Windows, la app se siente pulida y completa.
