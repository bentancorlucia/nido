# Stack Tecnológico — Nido

## Dependencias Principales

| Capa | Tecnología |
|---|---|
| Runtime Desktop | **Electron** (última versión estable) |
| Frontend | **React 18+** con **TypeScript** |
| State Management | **Zustand** (liviano, simple, efectivo) |
| Estilos | **Tailwind CSS** + **Framer Motion** (animaciones) |
| Drag & Drop | **@dnd-kit/core** + **@dnd-kit/sortable** |
| Calendario | **Custom** (construir desde cero para control total del diseño) |
| Base de Datos | **SQLite** via **better-sqlite3** (local, embebida, sin servidor) |
| ORM / Query | **Drizzle ORM** (type-safe, liviano) |
| Iconos | **Lucide React** |
| Fechas | **date-fns** (en español, locale `es`) |
| Búsqueda | **Fuse.js** (fuzzy search client-side) |
| Command Palette | **cmdk** (barra tipo Cmd+K) |
| Google Calendar | **googleapis** (Google APIs Node.js Client) |
| Build | **electron-builder** para generar .dmg (macOS) y .exe (Windows) |
| Bundler | **Vite** |
| Package Manager | **pnpm** |
| Virtualización | **@tanstack/react-virtual** (listas largas) |

## Reglas Estrictas de Dependencias

| ❌ NO usar | ✅ Usar en su lugar | Motivo |
|---|---|---|
| `moment.js` | `date-fns` | Pesado y deprecado |
| `react-beautiful-dnd` | `@dnd-kit` | Deprecado, sin mantenimiento |
| `FullCalendar` / `react-big-calendar` | Calendario 100% custom | Control total del diseño |
| `Redux` / `Context API` (global) | `Zustand` | Más simple y performante |
| `styled-components` / `emotion` | `Tailwind CSS` | Consistencia con el design system |
| `axios` | `fetch` nativo | No necesitamos interceptors complejos |

## Configuración de Electron

- Usar `contextBridge` + `ipcRenderer.invoke` para comunicación segura
- NUNCA exponer `ipcRenderer` directo al renderer process
- El proceso main maneja: SQLite, file system, Google OAuth, notificaciones del sistema
- El proceso renderer maneja: toda la UI React
- Preload script como bridge entre ambos mundos
