# Modelo de Datos — Nido

Base de datos: **SQLite** via **better-sqlite3** + **Drizzle ORM**

---

## Tabla: `projects`
Soporta jerarquía ilimitada mediante `parent_id` auto-referencial.

```sql
id              TEXT PRIMARY KEY (uuid)
name            TEXT NOT NULL
description     TEXT
parent_id       TEXT REFERENCES projects(id) ON DELETE CASCADE
color           TEXT
icon            TEXT  -- Emoji o nombre de ícono Lucide
is_archived     BOOLEAN DEFAULT false
is_template     BOOLEAN DEFAULT false
template_name   TEXT
sort_order      INTEGER DEFAULT 0
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Tabla: `kanban_columns`
Cada proyecto tiene sus propias columnas. Al crear un proyecto se generan las 3 default.

```sql
id              TEXT PRIMARY KEY (uuid)
name            TEXT NOT NULL
project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE
color           TEXT
sort_order      INTEGER DEFAULT 0
is_default      BOOLEAN DEFAULT false  -- Las 3 default: Por hacer, En proceso, Realizado
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

**Reglas:**
- Las columnas `is_default = true` NO se pueden eliminar, pero SÍ renombrar
- Al eliminar una columna custom, sus tareas se mueven a la primera columna default ("Por hacer")
- Al crear un proyecto, se generan automáticamente las 3 columnas default

## Tabla: `tasks`
Soporta subtareas via `parent_task_id` y recurrencia.

```sql
id                 TEXT PRIMARY KEY (uuid)
title              TEXT NOT NULL
description        TEXT
project_id         TEXT REFERENCES projects(id) ON DELETE SET NULL
column_id          TEXT REFERENCES kanban_columns(id) ON DELETE SET NULL
parent_task_id     TEXT REFERENCES tasks(id) ON DELETE CASCADE
priority           TEXT CHECK(priority IN ('alta', 'media', 'baja')) DEFAULT 'media'
is_important       BOOLEAN DEFAULT false
due_date           DATETIME
due_time           TEXT
estimated_minutes  INTEGER
actual_minutes     INTEGER DEFAULT 0
is_completed       BOOLEAN DEFAULT false
completed_at       DATETIME
is_archived        BOOLEAN DEFAULT false
sort_order         INTEGER DEFAULT 0
-- Recurrencia
is_recurring       BOOLEAN DEFAULT false
recurrence_rule    TEXT  -- Ver docs/FEATURES.md para formatos
recurrence_end     DATETIME
recurrence_parent  TEXT REFERENCES tasks(id)
created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Tabla: `tags`

```sql
id              TEXT PRIMARY KEY (uuid)
name            TEXT NOT NULL UNIQUE  -- Ej: "facultad", "personal", "fútbol"
color           TEXT NOT NULL         -- Color hex del tag
```

## Tabla: `task_tags` (many-to-many)

```sql
task_id         TEXT REFERENCES tasks(id) ON DELETE CASCADE
tag_id          TEXT REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (task_id, tag_id)
```

## Tabla: `events`
Eventos de calendario. Soporta sync con Google Calendar.

```sql
id                 TEXT PRIMARY KEY (uuid)
title              TEXT NOT NULL
description        TEXT
start_datetime     DATETIME NOT NULL
end_datetime       DATETIME NOT NULL
is_all_day         BOOLEAN DEFAULT false
color              TEXT
location           TEXT
project_id         TEXT REFERENCES projects(id) ON DELETE SET NULL
-- Recurrencia
is_recurring       BOOLEAN DEFAULT false
recurrence_rule    TEXT
recurrence_end     DATETIME
-- Google Calendar sync
google_event_id    TEXT
google_calendar_id TEXT
last_synced        DATETIME
created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Tabla: `post_its`
Notas libres o vinculadas a tareas. Posicionables libremente en el board.

```sql
id              TEXT PRIMARY KEY (uuid)
content         TEXT NOT NULL
color           TEXT DEFAULT '#A8E8F0'  -- postit-cyan (Pacific Blue pastel)
linked_task_id  TEXT REFERENCES tasks(id) ON DELETE SET NULL
position_x      REAL DEFAULT 0
position_y      REAL DEFAULT 0
width           REAL DEFAULT 200
height          REAL DEFAULT 200
z_index         INTEGER DEFAULT 0
is_pinned       BOOLEAN DEFAULT false
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Tabla: `pomodoro_sessions`

```sql
id               TEXT PRIMARY KEY (uuid)
task_id          TEXT REFERENCES tasks(id) ON DELETE SET NULL
duration_minutes INTEGER DEFAULT 25
break_minutes    INTEGER DEFAULT 5
started_at       DATETIME NOT NULL
ended_at         DATETIME
was_completed    BOOLEAN DEFAULT false
created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Tabla: `dashboard_layout`
Persiste la posición y tamaño de widgets del dashboard.

```sql
id              TEXT PRIMARY KEY (uuid)
widget_type     TEXT NOT NULL  -- 'today', 'deadlines', 'progress', 'postits', 'mini_calendar', 'pomodoro'
grid_x          INTEGER DEFAULT 0
grid_y          INTEGER DEFAULT 0
grid_w          INTEGER DEFAULT 1
grid_h          INTEGER DEFAULT 1
is_visible      BOOLEAN DEFAULT true
config          TEXT  -- JSON con config específica del widget
```

## Tabla: `settings`
Key-value store para configuraciones de la app.

```sql
key             TEXT PRIMARY KEY
value           TEXT  -- JSON stringified
```

**Settings conocidos:**
- `theme`: `"light"` | `"dark"`
- `pomodoro_work_minutes`: `25`
- `pomodoro_break_minutes`: `5`
- `pomodoro_long_break_minutes`: `15`
- `pomodoro_auto_start`: `true` | `false`
- `pomodoro_sound`: `true` | `false`
- `reduce_animations`: `false`
- `google_calendar_connected`: `false`
- `google_calendar_ids`: `[]` (JSON array)
- `semester_start_month`: `3` (Marzo)
- `semester_end_month`: `7` (Julio)

## Tabla: `templates`
Templates de estructura de proyecto.

```sql
id              TEXT PRIMARY KEY (uuid)
name            TEXT NOT NULL
description     TEXT
structure       TEXT NOT NULL  -- JSON con la estructura (ver docs/FEATURES.md)
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## Relaciones Clave

```
projects ←(parent_id)→ projects           # Jerarquía ilimitada
projects ←(project_id)→ kanban_columns    # Columnas por proyecto
projects ←(project_id)→ tasks             # Tareas pertenecen a proyecto
projects ←(project_id)→ events            # Eventos pueden asociarse a proyecto
tasks ←(parent_task_id)→ tasks            # Subtareas ilimitadas
tasks ←(column_id)→ kanban_columns        # Tarea en una columna
tasks ←→ tags (via task_tags)             # Many-to-many
tasks ←(linked_task_id)→ post_its         # Post-it vinculado a tarea
tasks ←(task_id)→ pomodoro_sessions       # Sesiones de pomodoro por tarea
```

## Datos Seed Iniciales

Al primer arranque, crear:
1. **Tags default**: `facultad` (tag-cyan / Pacific Blue), `personal` (tag-forest / Slate), `urgente` (tag-berry / Raspberry)
2. **Templates predefinidos**: ver `docs/FEATURES.md`
3. **Dashboard layout default**: todos los 6 widgets visibles en posiciones default
4. **Settings default**: tema light, pomodoro 25/5/15, animaciones on
