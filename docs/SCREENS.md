# Pantallas — Nido

Especificación detallada de cada pantalla de la aplicación.

---

## 1. SIDEBAR (Navegación Principal)

- Logo/nombre de la app arriba ("Nido" con un ícono custom tipo nido/hogar)
- Links de navegación con iconos Lucide:
  - 🏠 Dashboard
  - 📅 Hoy
  - 📋 Tareas (Kanban)
  - 📆 Calendario
  - 📁 Proyectos
  - 🍅 Pomodoro
  - ⚙️ Configuración
- Sección inferior:
  - Toggle dark/light mode (ícono sol/luna con animación de rotación)
  - Botón colapsar sidebar
- **Árbol de proyectos rápido**: debajo de la nav, mostrar el árbol de proyectos colapsable para navegar rápido
- Click derecho en cualquier proyecto del sidebar → context menu: renombrar, archivar, eliminar, cambiar color
- El item activo se resalta con el color `primary` (Pacific Blue) de fondo suave + indicador lateral

---

## 2. DASHBOARD (Home)

Layout de **grilla de widgets movibles y redimensionables** usando un sistema de grid de 12 columnas.

### Widget: Tareas Urgentes de Hoy
- Lista de tareas con deadline hoy o overdue
- Checkbox para completar inline
- Color-coded por prioridad (danger/raspberry = alta, warning/ámbar = media, priority-baja/verde = baja)
- Las overdue tienen un badge rojo pulsante
- Click en tarea → abre detalle

### Widget: Próximos Deadlines
- Lista de próximos 7 días de deadlines
- Agrupados por día con header de fecha
- Muestra proyecto asociado como badge de color
- Indicador visual de cuánto falta (barra de progreso temporal)

### Widget: Progreso de Proyectos
- Cards de cada proyecto activo (no archivado)
- Barra de progreso circular o lineal
- Porcentaje basado en tareas completadas / total
- Color del proyecto
- Click → navega al proyecto

### Widget: Post-Its / Notas Rápidas
- Área tipo corkboard donde se ven los post-its
- Los post-its son arrastrables y posicionables libremente DENTRO del widget
- Cada post-it tiene:
  - Color de fondo (elegible de la paleta de post-its)
  - Texto editable inline (click para editar)
  - Opción de vincular a una tarea existente (se muestra link)
  - Botón pin para fijar arriba
  - Botón eliminar (con confirmación)
  - Efecto visual: sombra suave, rotación aleatoria sutil (±2°), como pegados en un tablero
- Botón "+" para crear nuevo post-it con animación pop
- Los post-its vinculados a tarea muestran un ícono de link y el estado de la tarea

### Widget: Mini Calendario
- Calendario del mes actual compacto
- Los días con eventos/tareas tienen dots de color
- Click en un día → navega a vista de ese día en el calendario
- Hoy resaltado con el color primary (Pacific Blue)

### Widget: Pomodoro Rápido
- Timer circular con la cuenta regresiva
- Botón play/pause/reset
- Selector rápido de tarea asociada
- Muestra sesiones completadas hoy
- Al completar una sesión: efecto celebratorio sutil

### Comportamiento del Dashboard
- Los widgets se pueden arrastrar para reordenar
- Los widgets se pueden redimensionar (drag desde esquina)
- El layout se guarda automáticamente en `dashboard_layout`
- Botón "Reset layout" para volver al default
- Cada widget tiene un header con ícono, título, y botón "..." con opciones (ocultar, configurar)

---

## 3. VISTA DE HOY (Today View)

Pantalla enfocada en el día actual.

- **Header**: Fecha de hoy con formato friendly ("Miércoles 12 de Marzo, 2026")
- **Timeline vertical** del día (6:00 - 23:00):
  - Franja horaria cada 1 hora
  - Eventos del calendario como bloques de color posicionados por hora
  - Línea roja horizontal indicando "ahora" que se mueve en tiempo real
- **Panel lateral**: Lista de tareas del día (sin hora específica)
  - Separadas en: "Por hacer", "En proceso", "Completadas"
  - Drag & drop entre secciones
  - Checkbox para completar
- **Resumen del día**:
  - Cantidad de tareas pendientes
  - Horas de eventos
  - Pomodoros completados
- Si no hay nada para hoy, mostrar un mensaje motivacional amigable

---

## 4. KANBAN BOARD (Gestión de Tareas)

**Selector de proyecto** arriba: dropdown/tabs para elegir qué proyecto ver (o "Todas las tareas")

### Columnas
- **Default**: "Por hacer" | "En proceso" | "Realizado"
- Las columnas default NO se pueden eliminar pero SÍ renombrar
- Botón "+" al final para agregar columnas custom
- Las columnas custom se pueden eliminar (mueve tareas a "Por hacer")
- Cada columna muestra su count de tareas

### Cards de Tarea (KanbanCard)
- Título de la tarea
- Tags como badges de color
- Prioridad: indicador lateral de color (danger/raspberry para alta, warning/ámbar para media, priority-baja/verde para baja)
- Si es importante: ícono estrella ⭐ en la esquina
- Due date si tiene (con color rojo si overdue, naranja si es hoy)
- Proyecto asociado como mini badge
- Checkbox rápido para completar
- Si tiene subtareas: indicador "3/5 subtareas"
- **Drag & drop** entre columnas con animación satisfactoria

### Modal de Detalle (al clickear card)
- Título editable inline
- Descripción (textarea con markdown básico)
- Proyecto (selector)
- Columna/estado (selector)
- Prioridad (selector visual: 3 colores)
- Importante (toggle estrella)
- Fecha límite (date picker)
- Hora (time picker, opcional)
- Tiempo estimado (input minutos)
- Tags (selector múltiple, poder crear nuevos inline)
- Subtareas:
  - Lista con checkbox
  - Agregar subtarea inline
  - Cada subtarea expandible a sus propias propiedades
  - Progress bar basada en subtareas completadas
- Recurrencia (si aplica): tipo + días + fecha fin
- Sesiones Pomodoro asociadas (historial)
- Timestamps: creada, modificada, completada
- Botones: Archivar, Eliminar (con confirmación)

### Filtros y Ordenamiento
- Filtrar por: tags, prioridad, importante, con/sin fecha, overdue
- Ordenar por: fecha, prioridad, nombre, fecha creación
- Barra de búsqueda local del board

### Crear Tarea Rápida
- Botón "+" en cada columna → input inline para título
- Enter crea la tarea, Esc cancela
- Tarea se crea con defaults, editable después

---

## 5. CALENDARIO

**Tab bar** con las 4 vistas: Mes | Semana | Semestre | Año

### Vista Mensual
- Grilla clásica 7 columnas (L-D) × semanas
- Cada celda muestra:
  - Número del día
  - Hasta 3 eventos/tareas como chips de color
  - Indicador "+N más" si hay más de 3
  - Hoy resaltado con fondo primary-light (Pacific Blue suave)
- Click en día → expande o navega a vista semanal
- Click en evento → modal de detalle
- Drag & drop de eventos entre días para mover fecha
- Header: "< Marzo 2026 >" con navegación

### Vista Semanal
- 7 columnas de días
- Cada columna: timeline vertical de horas (7:00 - 23:00)
- Eventos como bloques posicionados por hora/duración
- Tareas con deadline (sin hora) arriba en sección "Todo el día"
- Línea de "ahora" en el día actual
- Header: "Semana del 10 - 16 Marzo 2026"

### Vista Semestral
Dos partes combinadas:

**Parte superior — Timeline horizontal:**
- Eje X: meses del semestre (ej: Marzo - Julio 2026)
- Barras horizontales para proyectos/materias con su duración
- Hitos/deadlines como diamantes (♦) sobre la timeline
- Zoom con scroll del mouse
- Hover en hito → tooltip con detalle

**Parte inferior — Mini calendarios:**
- 5-6 mini calendarios mensuales lado a lado
- Días con eventos tienen dots de color
- Click en cualquier día → navega a vista semanal

- Selector de semestre: poder definir qué meses abarca (default Marzo-Julio o Agosto-Diciembre)

### Vista Anual
- 12 mini calendarios en grilla 4×3 o 3×4
- Cada día coloreado por intensidad de actividad (tipo heatmap GitHub)
- Verde claro = poco, verde fuerte = mucho
- Click en mes → navega a vista mensual

### Crear Evento
- Click en slot vacío → modal de evento:
  - Título, fecha/hora inicio/fin, todo el día (toggle), color, descripción, ubicación, proyecto, recurrencia
- Drag para crear: arrastrar en el calendario para seleccionar rango horario

---

## 6. PROYECTOS (Vista de Árbol)

### Panel Izquierdo: Árbol de Proyectos
- Estructura tipo file explorer con indent
- Cada nodo expandible/colapsable con click en flecha
- Drag & drop para reorganizar (mover proyecto dentro de otro)
- Ícono + color del proyecto
- Indicador de progreso (mini bar o porcentaje)
- Context menu (click derecho): Nuevo subproyecto, Renombrar, Cambiar color/ícono, Archivar, Eliminar
- Botón "+" arriba para nuevo proyecto raíz
- Botón para ver archivados
- Jerarquía ilimitada: `Facultad > Semestre 1 > Cálculo > Parcial 2 > Ejercicios > ...`

### Panel Derecho: Detalle del Proyecto Seleccionado
- Header: Nombre (editable), color, ícono
- Descripción
- **Barra de progreso** grande y visual (tareas completadas / total, incluyendo subproyectos recursivamente)
- **Estadísticas**: tareas totales, completadas, en proceso, pendientes, overdue
- **Vista de tareas del proyecto** con toggle:
  - Vista Kanban (solo tareas de este proyecto)
  - Vista lista (todas las tareas planas)
  - Vista tree (tareas organizadas jerárquicamente)
- **Subproyectos**: lista visual de hijos directos como cards
- **Timeline del proyecto**: mini timeline con tareas/hitos ordenados por fecha

### Crear desde Template
- Al crear nuevo proyecto → opción "Crear desde template"
- Selector visual de templates disponibles
- Al aplicar template se crea toda la estructura de subproyectos y columnas

---

## 7. POMODORO (Vista Completa)

- **Timer principal**: Circular grande, animado
  - Anillo de progreso que se va completando
  - Tiempo restante en grande (fuente monospace JetBrains Mono)
  - Debajo: "Sesión 3 de 4"
  - Pulso sutil en el borde cada segundo
- **Controles**: Play / Pause / Skip / Reset
- **Configuración rápida**:
  - Duración trabajo: 25 min (editable)
  - Descanso corto: 5 min
  - Descanso largo: 15 min (cada 4 sesiones)
  - Auto-start siguiente sesión: on/off
- **Tarea asociada**: Selector de tarea, tiempo se acumula en `actual_minutes`
- **Estadísticas de hoy**: Pomodoros completados, tiempo total de enfoque, racha (días consecutivos)
- **Historial semanal**: Mini gráfico de barras de pomodoros por día
- **Sonido**: Sonido sutil al completar (configurable, poder mutear)
- **Notificación**: Notificación de sistema al completar sesión

---

## 8. BÚSQUEDA GLOBAL (Ctrl+K)

- **Command Palette** centrada con overlay oscuro (usar `cmdk`)
- Input con ícono de lupa
- Busca en: tareas (título, descripción), proyectos (nombre), eventos (título), post-its (contenido), tags
- Resultados categorizados con íconos por tipo
- Navegación con flechas ↑↓ y Enter para seleccionar
- Acciones rápidas: "Nueva tarea...", "Nuevo evento...", "Nuevo proyecto..."
- Fuzzy search con Fuse.js (tolera typos)
- Animación: slide down + fade in, con blur del fondo

---

## 9. CONFIGURACIÓN

- **Apariencia**: Toggle dark/light mode, Reducir animaciones (accesibilidad)
- **Pomodoro**: Duraciones por defecto, Sonidos on/off, Auto-start on/off
- **Tags**: Crear, editar, eliminar tags, elegir color de paleta predefinida
- **Google Calendar**: Conectar/desconectar cuenta, elegir calendarios a sincronizar, frecuencia de sync
- **Datos**: Exportar todo (JSON), Importar datos, Reset (con confirmación doble)
- **Tareas recurrentes**: Vista de todas las reglas activas, poder pausar/eliminar recurrencias
