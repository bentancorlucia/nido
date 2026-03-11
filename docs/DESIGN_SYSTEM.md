# Sistema de Diseño — Nido

## ⚠️ INSTRUCCIÓN CRÍTICA
**OBLIGATORIO: Antes de escribir CUALQUIER código de UI, el agente DEBE leer `/mnt/skills/public/frontend-design/SKILL.md` y seguir rigurosamente sus principios de diseño.**

---

## Filosofía Visual

- **NO** debe parecer "otra app de tareas más" o un template genérico de dashboard
- **SÍ** debe tener personalidad, calidez, y sentirse como algo hecho con cariño
- Inspiración: la elegancia de Notion + la calidez de un bullet journal + la fluidez de Linear
- Cada interacción debe sentirse satisfactoria (micro-animaciones, feedback visual)

---

## Paleta de Colores

### 5 Colores Ancla (identidad de marca)
```
Pacific Blue:     #01A7C2   → Acción principal, energía, CTAs
Lemon Lime:       #DDF45B   → Highlight, éxito, acento vibrante
Dark Raspberry:   #7E1946   → Profundidad, urgencia, énfasis fuerte
Dark Slate Grey:  #304B42   → Base oscura, textos, estabilidad
Lavender Mist:    #F7F0F5   → Fondo claro, suavidad, espacio
```

Todos los colores del sistema se derivan de estos 5. La app debe sentirse cohesiva: el Pacific Blue y el Lemon Lime dominan la experiencia, con Dark Raspberry para momentos de énfasis.

### Light Mode
```
-- Fondos --
background:       #F7F0F5  (Lavender Mist — fondo principal)
surface:          #FFFFFF  (cards, modales)
surface-alt:      #EDE6EB  (Lavender Mist oscurecido — cards secundarias)
sidebar-bg:       #304B42  (Dark Slate Grey — sidebar oscura, contraste fuerte)
sidebar-text:     #F7F0F5  (texto claro sobre sidebar oscura)
sidebar-active:   #01A7C2  (Pacific Blue — item activo en sidebar)

-- Colores de acción --
primary:          #01A7C2  (Pacific Blue — botones primarios, links, selección)
primary-hover:    #018FA6  (Pacific Blue oscurecido para hover)
primary-light:    #D4F2F8  (Pacific Blue al 15% — fondos seleccionados, badges suaves)
accent:           #DDF45B  (Lemon Lime — highlights, badges de éxito, "completado")
accent-dark:      #B8CC3A  (Lemon Lime oscurecido — texto sobre fondo accent si es necesario)

-- Colores semánticos --
success:          #DDF45B  (Lemon Lime — tarea completada, progreso lleno)
success-bg:       #F5FBDC  (Lemon Lime al 15% — fondo sutil de éxito)
danger:           #7E1946  (Dark Raspberry — eliminar, overdue, errores)
danger-light:     #F2D4E0  (Dark Raspberry al 15% — fondo de alerta)
danger-hover:     #651538  (Dark Raspberry oscurecido)
warning:          #E8A830  (Ámbar derivado — deadline cercano, prioridad media)
warning-light:    #FDF3DC  (Ámbar al 15%)
info:             #01A7C2  (Pacific Blue — información, tips)

-- Prioridades de tareas --
priority-alta:    #7E1946  (Dark Raspberry — urgente, grave)
priority-media:   #E8A830  (Ámbar — atención moderada)
priority-baja:    #5B8A72  (Slate verde claro derivado — relajado, puede esperar)

-- Textos --
text-primary:     #1E2D27  (Dark Slate Grey profundizado — máxima legibilidad)
text-secondary:   #5A6B63  (Dark Slate Grey aclarado)
text-muted:       #94A09A  (Dark Slate Grey muy aclarado)
text-on-primary:  #FFFFFF  (texto sobre Pacific Blue)
text-on-accent:   #304B42  (Dark Slate Grey sobre Lemon Lime — máximo contraste)
text-on-danger:   #FFFFFF  (texto sobre Dark Raspberry)

-- Bordes --
border:           #DED6DC  (Lavender Mist oscurecido)
border-strong:    #C4BAC1  (más visible)
border-focus:     #01A7C2  (Pacific Blue — focus rings)
```

### Dark Mode
```
-- Fondos --
background:       #1A1F1D  (Dark Slate Grey profundizado)
surface:          #252D29  (Dark Slate Grey levemente aclarado)
surface-alt:      #2F3935  (un paso más claro)
sidebar-bg:       #141A17  (más oscuro que el fondo)
sidebar-text:     #D4CDD2  (Lavender Mist atenuado)
sidebar-active:   #01A7C2  (Pacific Blue — se mantiene vibrante)

-- Colores de acción (más luminosos en dark) --
primary:          #1CBDD6  (Pacific Blue más luminoso)
primary-hover:    #38CFEA  (aún más claro en hover)
primary-light:    #0E3A40  (Pacific Blue al 20% sobre dark — fondos seleccionados)
accent:           #DDF45B  (Lemon Lime — se mantiene vibrante, destaca en dark)
accent-dark:      #C8DF42  (Lemon Lime levemente ajustado)

-- Colores semánticos --
success:          #DDF45B  (Lemon Lime se mantiene)
success-bg:       #2A3020  (Lemon Lime al 10% sobre dark)
danger:           #A83265  (Dark Raspberry aclarado para legibilidad en dark)
danger-light:     #3A1A2A  (Dark Raspberry al 15% sobre dark)
danger-hover:     #C44080  (más claro en hover)
warning:          #F0B840  (Ámbar más luminoso)
warning-light:    #3A3020  (Ámbar al 10% sobre dark)
info:             #1CBDD6  (Pacific Blue luminoso)

-- Prioridades --
priority-alta:    #C44080  (Raspberry aclarado)
priority-media:   #F0B840  (Ámbar luminoso)
priority-baja:    #7AAE90  (Verde slate aclarado)

-- Textos --
text-primary:     #ECE7EA  (Lavender Mist atenuado — máxima legibilidad)
text-secondary:   #9BA59F  (gris verdoso claro)
text-muted:       #6B756F  (gris verdoso)
text-on-primary:  #FFFFFF
text-on-accent:   #1A1F1D  (Dark sobre Lemon Lime)
text-on-danger:   #FFFFFF

-- Bordes --
border:           #3A4440  (Dark Slate Grey aclarado)
border-strong:    #4A5650  (más visible)
border-focus:     #1CBDD6  (Pacific Blue luminoso)
```

### Colores de Post-Its
Derivados de la paleta ancla, con variaciones vibrantes:
```
postit-cyan:      #A8E8F0  (Pacific Blue pastel — default)
postit-lime:      #EEFAAA  (Lemon Lime pastel)
postit-rose:      #E8A0BC  (Dark Raspberry pastel)
postit-mint:      #A0D4B8  (Dark Slate Grey cálido)
postit-lavender:  #E0D4EA  (Lavender Mist saturado)
postit-peach:     #F8D0B0  (complementario cálido)
```

### Colores de Tags
Los tags usan variantes de los colores ancla como fondo + texto oscuro del mismo hue:
```
-- Paleta predefinida de tags --
tag-cyan:      bg: #D4F2F8, text: #016A7A   (de Pacific Blue)
tag-lime:      bg: #F0FACC, text: #5A6B10   (de Lemon Lime)
tag-berry:     bg: #F2D4E0, text: #7E1946   (de Dark Raspberry)
tag-forest:    bg: #D0E4DA, text: #304B42   (de Dark Slate Grey)
tag-lavender:  bg: #E8DAF0, text: #6B3A80   (de Lavender Mist saturado)
tag-amber:     bg: #FDF3DC, text: #8A6410   (del warning)
tag-coral:     bg: #F8DCD4, text: #A04030   (complementario)
tag-slate:     bg: #D8E0DC, text: #3A5048   (neutro)
```
El usuario elige de esta paleta al crear un tag.

### Uso de Colores por Contexto
```
Botón primario:         bg: primary, text: text-on-primary
Botón secundario:       bg: transparent, border: primary, text: primary
Botón peligroso:        bg: danger, text: text-on-danger
Tarea completada:       checkbox: accent (Lemon Lime), texto: strikethrough + text-muted
Tarea overdue:          badge: danger con pulso, texto: danger
Tarea hoy:              badge: warning
Estrella "importante":  color: accent (Lemon Lime)
Sidebar item activo:    bg: sidebar-active (Pacific Blue), text: white
Kanban columna header:  border-bottom: primary
Progress bar llena:     gradient de primary → accent (Pacific Blue → Lemon Lime)
Progress bar vacía:     bg: surface-alt
Post-it hover:          shadow crece + borde sutil de primary
Pomodoro ring:          stroke: primary, completado: accent
Calendar hoy:           bg: primary-light, border: primary
Calendar evento:        bg: color del proyecto o primary-light
```

---

## Tipografía

- **Headings**
- **Body**: Inter Regular / Medium
- **Monospace** (para tiempos, contadores): JetBrains Mono
- Escala modular: 12, 14, 16, 18, 20, 24, 30, 36, 48

---

## Animaciones y Transiciones (Framer Motion)

**TODO debe animarse de forma sutil y satisfactoria.**

### Catálogo de Animaciones

| Acción | Animación | Timing |
|---|---|---|
| Abrir modal | Fade in + scale 0.95→1 | 200ms, spring |
| Cerrar modal | Fade out + scale→0.95 | 150ms, ease-out |
| Drag & drop card | Lift (scale 1.03, shadow↑), snap con spring | spring |
| Completar tarea | Checkbox bounce + strikethrough slide + confetti sutil | 300ms |
| Cambio de página | Slide horizontal + fade | 200ms |
| Hover en card | translateY -2px + shadow grow | 150ms |
| Agregar item | SlideDown + fadeIn desde arriba | 200ms |
| Eliminar item | SlideUp + fadeOut + height collapse | 200ms |
| Toggle sidebar | Slide lateral con spring | 300ms |
| Toggle dark/light | Crossfade suave de colores | 400ms, CSS transitions |
| Post-it drag | Rotación sutil aleatoria (±2°) al soltar | spring |
| Pomodoro tick | Pulso sutil en el borde del timer | 1s loop |
| Pomodoro complete | Ring animation + glow effect | 600ms |
| Hover post-it | Lift + sombra crece | 150ms |
| Nuevo post-it | Pop in con bounce (scale 0→1) | 300ms, spring |
| Widget drag | Ghost transparente + outline del destino | spring |
| Progress bar | Animate width con spring | spring |
| Badge/tag | Pop in individual con stagger | 50ms delay entre tags |
| Notificación | Slide in desde la derecha + auto dismiss slide out | 300ms in, 200ms out |

### Reglas de Animación
- Duración máxima: 400ms para la mayoría, 600ms para transiciones de página
- Usar `spring` para movimientos orgánicos (drag, bounce)
- Usar `ease-out` para entradas, `ease-in` para salidas
- **NUNCA** bloquear interacción durante animación
- Las animaciones deben poder desactivarse en settings (accesibilidad via setting `reduce_animations`)

---

## Espaciado y Layout

### Dimensiones Clave
- **Sidebar**: 260px expandida, colapsable a 60px (solo iconos)
- **Content area**: fluida con max-width 1400px para listas, full-width para kanban y calendario
- **Padding**: 16px en cards, 24px en secciones, 32px en páginas

### Border Radius
```
cards:          8px
modales:        12px
containers:     16px
badges/tags:    full (9999px)
```

### Sombras (cálidas, no grises fríos)
```
shadow-sm:    0 1px 3px rgba(45, 43, 46, 0.06)
shadow-md:    0 4px 12px rgba(45, 43, 46, 0.08)
shadow-lg:    0 8px 24px rgba(45, 43, 46, 0.12)
shadow-lift:  0 12px 32px rgba(45, 43, 46, 0.16)   /* para drag states */
```

---

## Iconografía

Usar **Lucide React** exclusivamente. Iconos principales por sección:

| Sección | Ícono |
|---|---|
| Dashboard | `Home` |
| Hoy | `CalendarCheck` |
| Tareas | `LayoutList` o `Kanban` |
| Calendario | `Calendar` |
| Proyectos | `FolderTree` |
| Pomodoro | `Timer` |
| Configuración | `Settings` |
| Búsqueda | `Search` |
| Dark mode | `Moon` |
| Light mode | `Sun` |
| Importante | `Star` |
| Prioridad alta | `AlertTriangle` (danger / Dark Raspberry) |
| Completado | `CheckCircle2` (accent / Lemon Lime) |
| Post-it | `StickyNote` |
