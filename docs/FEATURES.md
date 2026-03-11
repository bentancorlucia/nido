# Features Transversales — Nido

Features que cruzan múltiples pantallas y requieren lógica especial.

---

## 1. Tareas Recurrentes

### Comportamiento
Cuando una tarea recurrente se completa:
1. Se marca como completada la instancia actual
2. Se genera automáticamente la próxima instancia basada en `recurrence_rule`
3. La nueva instancia hereda: título, descripción, proyecto, tags, prioridad, tiempo estimado
4. La nueva instancia tiene nueva `due_date` calculada
5. Si `recurrence_end` se alcanzó, no se genera más

### Formatos de `recurrence_rule`
```
"daily"                → todos los días
"weekly:1,3,5"         → lunes, miércoles, viernes (0=domingo, 1=lunes, ..., 6=sábado)
"monthly:15"           → día 15 de cada mes
"yearly:3-15"          → 15 de marzo cada año
"weekdays"             → lunes a viernes
"custom:every_2_weeks" → cada 2 semanas
```

### UI de Recurrencia (en modal de tarea)
- Toggle "Tarea recurrente"
- Si activo, selector:
  - Tipo: Diaria / Semanal / Mensual / Anual / Días hábiles / Custom
  - Si Semanal: checkboxes de L M M J V S D
  - Si Mensual: selector de día del mes
  - Si Custom: input "cada N días/semanas"
- Fecha fin de recurrencia (date picker, opcional)

### Implementación
- La lógica de recurrencia vive en `src/lib/recurrence.ts`
- Función `calculateNextOccurrence(rule: string, currentDate: Date): Date | null`
- Función `generateNextInstance(task: Task): Task` (crea la nueva tarea)
- Se ejecuta al marcar como completada una tarea con `is_recurring = true`

---

## 2. Templates de Proyecto

### Templates Predefinidos

#### Template: "Nueva Materia"
```json
{
  "name": "{{nombre_materia}}",
  "children": [
    {
      "name": "Teóricos",
      "tasks": ["Resumen Tema 1", "Resumen Tema 2"]
    },
    {
      "name": "Prácticos",
      "tasks": ["Práctico 1", "Práctico 2"]
    },
    {
      "name": "Parciales",
      "children": [
        { "name": "Parcial 1", "tasks": ["Estudiar", "Hacer ejercicios", "Repasar"] },
        { "name": "Parcial 2", "tasks": ["Estudiar", "Hacer ejercicios", "Repasar"] }
      ]
    },
    {
      "name": "Final",
      "tasks": ["Estudiar", "Integrar temas", "Repasar"]
    }
  ]
}
```

#### Template: "Semestre Completo"
```json
{
  "name": "Semestre {{periodo}}",
  "children": [
    "// El usuario elige cuántas materias y se usa 'Nueva Materia' para cada una"
  ]
}
```

#### Template: "Proyecto Personal"
```json
{
  "name": "{{nombre_proyecto}}",
  "children": [
    { "name": "Planificación", "tasks": ["Definir objetivos", "Research", "Timeline"] },
    { "name": "Desarrollo", "tasks": [] },
    { "name": "Revisión", "tasks": ["Testing", "Feedback", "Ajustes finales"] }
  ]
}
```

### Templates Custom
- El usuario puede guardar cualquier proyecto existente como template
- Se serializa la estructura completa (subproyectos + tareas) a JSON
- Se guarda en tabla `templates`
- Al aplicar, se reemplaza `{{variables}}` con inputs del usuario

### UI de Templates
- Al crear proyecto → botón "Crear desde template"
- Modal con cards visuales de cada template
- Preview de la estructura antes de crear
- Inputs para las variables (nombre de materia, etc.)

### Implementación
- Lógica en `src/lib/templates.ts`
- Función `applyTemplate(templateId: string, variables: Record<string, string>): Project`
- Crea recursivamente proyectos, subproyectos, columnas default, y tareas

---

## 3. Búsqueda Global (⌘K / Ctrl+K)

### Configuración de Fuse.js
```typescript
const fuseOptions = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'content', weight: 1 },  // post-its
  ],
  threshold: 0.3,  // tolerancia a typos
  includeScore: true,
  includeMatches: true,  // para highlight
}
```

### Índice de búsqueda
Combina en un solo índice:
- Tareas: `{ type: 'task', id, title, description }`
- Proyectos: `{ type: 'project', id, name, description }`
- Eventos: `{ type: 'event', id, title, description }`
- Post-its: `{ type: 'postit', id, content }`
- Tags: `{ type: 'tag', id, name }`

### Acciones Rápidas
Además de resultados de búsqueda, la command palette ofrece acciones:
```
"nueva tarea"     → Abre modal de crear tarea
"nuevo evento"    → Abre modal de crear evento
"nuevo proyecto"  → Abre modal de crear proyecto
"nuevo post-it"   → Crea post-it
"dark mode"       → Toggle tema
"light mode"      → Toggle tema
```

Se filtran por el texto ingresado. Aparecen en sección separada "Acciones".

---

## 4. Atajos de Teclado

> **Nota**: Se usa `Cmd` (⌘) en macOS y `Ctrl` en Windows. El hook debe detectar la plataforma y mapear automáticamente.

| Atajo (Mac / Win) | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Abrir búsqueda global |
| `⌘N` / `Ctrl+N` | Nueva tarea rápida |
| `⌘⇧N` / `Ctrl+Shift+N` | Nuevo evento |
| `⌘E` / `Ctrl+E` | Nuevo post-it |
| `⌘P` / `Ctrl+P` | Toggle pomodoro (play/pause) |
| `⌘1` / `Ctrl+1` | Ir a Dashboard |
| `⌘2` / `Ctrl+2` | Ir a Hoy |
| `⌘3` / `Ctrl+3` | Ir a Tareas (Kanban) |
| `⌘4` / `Ctrl+4` | Ir a Calendario |
| `⌘5` / `Ctrl+5` | Ir a Proyectos |
| `⌘B` / `Ctrl+B` | Toggle sidebar |
| `⌘D` / `Ctrl+D` | Toggle dark/light mode |
| `Escape` | Cerrar modal/palette |
| `⌫` / `Delete` | Eliminar item seleccionado (con confirmación) |

### Implementación
- Hook `useKeyboardShortcuts.ts` registra todos los atajos globalmente
- Detectar plataforma: `navigator.platform` o `process.platform` para mapear `Meta` (Mac) vs `Ctrl` (Win)
- Usa `useEffect` con `keydown` listener
- Verifica que no hay input/textarea en focus antes de ejecutar (excepto Escape y ⌘K/Ctrl+K)
- Los atajos se registran en el main layout, no en componentes individuales

---

## 5. Google Calendar Sync

### Setup
1. En Settings → sección "Google Calendar"
2. Botón "Conectar Google Calendar" → OAuth flow via Electron main process
3. El token se almacena seguro en el proceso main (never en renderer)

### OAuth Flow (Electron)
1. Main process abre ventana de auth de Google
2. Usuario autoriza
3. Se recibe refresh token
4. Se almacena encriptado en SQLite (tabla `settings`, key `google_tokens`)

### Sincronización
- **Dirección**: Bidireccional
  - Eventos de Google → aparecen en Nido con badge "G" (ícono de Google)
  - Eventos de Nido → opción de "Sincronizar a Google" al crear/editar
- **Frecuencia**: Automático cada 5 minutos + botón manual "Sincronizar ahora"
- **Resolución de conflictos**: Last-write-wins basado en `updated_at` vs `updated` de Google
- **Identificación**: `google_event_id` en tabla `events` vincula evento local con el de Google

### Calendarios Múltiples
- Al conectar, se listan todos los calendarios del usuario
- El usuario elige cuáles sincronizar (checkboxes)
- Cada calendario de Google puede tener un color diferente
- Se guarda en settings: `google_calendar_ids` (JSON array)

### UI
- En Settings: estado de conexión, último sync, selector de calendarios
- En Calendario: badge "G" en eventos sincronizados
- En modal de evento: toggle "Sincronizar con Google Calendar"
- Indicador de sync en topbar (ícono de nube con status)

### Implementación
- Toda la lógica de Google API vive en `electron/` (main process)
- Hook `useGoogleCalendar.ts` expone funciones via IPC:
  - `connectGoogle()` → inicia OAuth
  - `disconnectGoogle()` → revoca tokens
  - `syncNow()` → fuerza sync
  - `getGoogleCalendars()` → lista calendarios disponibles
  - `setCalendars(ids: string[])` → configura qué calendarios sincronizar

---

## 6. Sistema de Notificaciones

### Tipos de Notificación
- **Tarea overdue**: cuando una tarea pasa su deadline
- **Deadline próximo**: 1 hora antes, 1 día antes (configurable)
- **Pomodoro completado**: al terminar sesión de trabajo/descanso
- **Evento próximo**: 15 min antes de un evento del calendario

### Implementación
- Usar `Notification` API nativa de Electron
- Sonidos opcionales (configurable en settings)
- Notificaciones in-app como toasts (slide in desde la derecha)
- No molestar: poder silenciar durante pomodoro activo
