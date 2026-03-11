# Arquitectura del Proyecto — Nido

## Estructura de Carpetas

```
nido/
├── electron/
│   ├── main.ts                    # Proceso principal de Electron
│   ├── preload.ts                 # Preload script (bridge seguro)
│   └── database/
│       ├── schema.ts              # Schema Drizzle (todas las tablas)
│       ├── migrations/            # Migraciones de DB
│       ├── seed.ts                # Datos iniciales y templates
│       └── db.ts                  # Conexión SQLite
├── src/
│   ├── main.tsx                   # Entry point React
│   ├── App.tsx                    # Router principal + layout
│   ├── assets/
│   │   └── fonts/                 # Tipografía custom (Inter, JetBrains Mono)
│   ├── components/
│   │   ├── ui/                    # Componentes base reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Navegación lateral
│   │   │   ├── TopBar.tsx         # Barra superior con búsqueda
│   │   │   └── MainLayout.tsx     # Layout wrapper
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx      # Vista principal
│   │   │   ├── WidgetGrid.tsx     # Grilla de widgets movibles
│   │   │   ├── TodayWidget.tsx    # Tareas urgentes de hoy
│   │   │   ├── DeadlinesWidget.tsx # Próximos deadlines
│   │   │   ├── ProgressWidget.tsx # Progreso de proyectos
│   │   │   ├── PostItBoard.tsx    # Área de post-its
│   │   │   ├── PostIt.tsx         # Post-it individual
│   │   │   ├── MiniCalendar.tsx   # Mini calendario widget
│   │   │   └── PomodoroWidget.tsx # Pomodoro rápido
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx    # Board completo
│   │   │   ├── KanbanColumn.tsx   # Columna individual
│   │   │   ├── KanbanCard.tsx     # Tarjeta de tarea
│   │   │   ├── AddColumn.tsx      # Agregar columna custom
│   │   │   └── CardDetail.tsx     # Modal detalle de tarea
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx   # Vista wrapper con tabs
│   │   │   ├── MonthView.tsx      # Vista mensual
│   │   │   ├── WeekView.tsx       # Vista semanal
│   │   │   ├── SemesterView.tsx   # Vista semestral (timeline + mini cals)
│   │   │   ├── YearView.tsx       # Vista anual
│   │   │   ├── DayCell.tsx        # Celda de día
│   │   │   ├── EventChip.tsx      # Chip de evento en calendario
│   │   │   ├── EventModal.tsx     # Modal crear/editar evento
│   │   │   └── TimelineBar.tsx    # Barra de timeline semestral
│   │   ├── projects/
│   │   │   ├── ProjectTree.tsx    # Árbol de proyectos (sidebar/vista)
│   │   │   ├── ProjectNode.tsx    # Nodo individual (recursivo)
│   │   │   ├── ProjectDetail.tsx  # Vista detalle de proyecto
│   │   │   ├── ProjectProgress.tsx # Barra de progreso
│   │   │   └── TemplateSelector.tsx # Selector de templates
│   │   ├── today/
│   │   │   ├── TodayView.tsx      # Vista "Hoy" completa
│   │   │   ├── TimelineHour.tsx   # Bloque de hora en timeline
│   │   │   └── TodayTask.tsx      # Tarea en vista de hoy
│   │   ├── pomodoro/
│   │   │   ├── PomodoroFull.tsx   # Vista completa del pomodoro
│   │   │   ├── PomodoroTimer.tsx  # Timer circular animado
│   │   │   └── PomodoroStats.tsx  # Estadísticas de sesiones
│   │   ├── search/
│   │   │   ├── CommandPalette.tsx # Barra Ctrl+K
│   │   │   └── SearchResults.tsx  # Resultados de búsqueda
│   │   └── settings/
│   │       ├── Settings.tsx       # Página de configuración
│   │       ├── ThemeToggle.tsx    # Toggle dark/light
│   │       ├── TagManager.tsx     # Gestión de etiquetas
│   │       └── GoogleSync.tsx     # Config de Google Calendar
│   ├── stores/
│   │   ├── useTaskStore.ts        # Estado de tareas
│   │   ├── useProjectStore.ts     # Estado de proyectos
│   │   ├── useCalendarStore.ts    # Estado del calendario
│   │   ├── usePostItStore.ts      # Estado de post-its
│   │   ├── usePomodoroStore.ts    # Estado del pomodoro
│   │   ├── useUIStore.ts          # Estado de UI (tema, sidebar, etc)
│   │   └── useDashboardStore.ts   # Layout de widgets del dashboard
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useGoogleCalendar.ts
│   │   ├── useRecurrence.ts
│   │   └── useSearch.ts
│   ├── lib/
│   │   ├── recurrence.ts          # Motor de tareas recurrentes
│   │   ├── templates.ts           # Templates de proyectos
│   │   ├── dateUtils.ts           # Utilidades de fecha en español
│   │   ├── colors.ts              # Sistema de colores y paletas
│   │   └── ipc.ts                 # Comunicación Electron IPC
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript globales
│   └── styles/
│       └── globals.css            # Estilos globales + Tailwind config
├── tailwind.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite como bundler para React
└── README.md
```

## Principios de Arquitectura

### Separación Electron Main vs Renderer
- **Main process** (`electron/`): SQLite, file system, Google OAuth, notificaciones del sistema, IPC handlers
- **Renderer process** (`src/`): toda la UI React, Zustand stores, componentes
- **Preload** (`electron/preload.ts`): bridge seguro con `contextBridge`, expone API tipada

### Flujo de Datos
```
UI Component → Zustand Store → IPC invoke → Main Process → SQLite
                                              ↓
UI Component ← Zustand Store ← IPC response ←┘
```

### Reglas de Componentes
- Máximo ~150 líneas por componente
- Si crece más, dividir en subcomponentes
- Cada carpeta de feature contiene sus propios componentes
- Componentes en `ui/` son genéricos y reutilizables, sin lógica de negocio
- Stores en `stores/` manejan estado global y comunicación con IPC
- Hooks en `hooks/` para lógica reutilizable entre componentes
- Utilidades puras en `lib/`
