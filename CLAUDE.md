# CLAUDE.md — Nido: Sistema de Organización Personal

## 🎯 Visión

**Nido** es una aplicación de escritorio para macOS (principal, Apple Silicon M2) y Windows (secundario), construida con Electron + React, para organizar la vida universitaria y diaria de una sola persona. Combina gestión de tareas con drag & drop, calendario multi-vista, proyectos con jerarquía ilimitada, post-its, pomodoro timer, y un dashboard personalizable con widgets movibles.

> **IMPORTANTE**: Sistema de USO PERSONAL. No requiere autenticación, login, ni sistema de usuarios. Se abre y se usa directo.

---

## 📚 Documentación del Proyecto

Este proyecto está dividido en specs modulares. **Leé SOLO los archivos que necesitás según la fase en la que estés trabajando.**

| Archivo | Contenido | Cuándo leerlo |
|---|---|---|
| `docs/STACK.md` | Stack tecnológico, dependencias, reglas de dependencias | **Siempre** al inicio |
| `docs/ARCHITECTURE.md` | Estructura de carpetas completa del proyecto | **Siempre** al inicio |
| `docs/DATABASE.md` | Modelo de datos SQLite completo (10 tablas, relaciones) | Fase 1 y cuando toques datos |
| `docs/DESIGN_SYSTEM.md` | Colores, tipografía, animaciones, espaciado, sombras | **Antes de cualquier UI** |
| `docs/SCREENS.md` | Especificación detallada de las 9 pantallas | Cuando implementes cada pantalla |
| `docs/FEATURES.md` | Features transversales: recurrencia, templates, búsqueda, shortcuts, Google Calendar sync | Fases 4-6 |
| `docs/PHASES.md` | Plan de implementación con 6 fases ordenadas | Para saber qué hacer y en qué orden |

---

## ⚠️ Reglas Obligatorias para el Agente

1. **LEER SIEMPRE** `/mnt/skills/public/frontend-design/SKILL.md` antes de escribir CUALQUIER componente visual. Esto es **NO NEGOCIABLE**.
2. **LEER** el archivo de spec correspondiente antes de implementar cualquier cosa (ver tabla arriba).
3. **TypeScript estricto**: no usar `any`, tipar todo correctamente.
4. **Componentes pequeños**: máximo ~150 líneas por componente, dividir si crece más.
5. **Nombres en inglés** para código, **textos de UI en español** (la app se usa en español).
6. **Cada feature debe funcionar antes de pasar a la siguiente** — no dejar cosas rotas.
7. **Animaciones al final de cada componente**: primero funcionalidad, después polish visual.
8. **SQLite es la fuente de verdad**: todo cambio de estado se persiste inmediatamente, no solo en memory.
9. **Electron IPC seguro**: usar `contextBridge` + `ipcRenderer.invoke`, nunca exponer `ipcRenderer` directo.
10. **Responsive dentro de Electron**: la ventana puede redimensionarse, el layout debe adaptarse.
11. **Performance**: virtualizar listas largas (>50 items) con `@tanstack/react-virtual`.
12. **Accesibilidad básica**: roles ARIA, focus management en modales, navegación por teclado.

---

## 🚀 Cómo Empezar

1. Leé `docs/STACK.md` + `docs/ARCHITECTURE.md` + `docs/PHASES.md`
2. Arrancá por **Fase 1: Fundación**
3. Antes de cualquier componente visual, leé `docs/DESIGN_SYSTEM.md` + el skill de frontend-design
4. Cuando llegues a una pantalla específica, leé la sección correspondiente en `docs/SCREENS.md`
5. Avanzá fase por fase, verificando que todo compila y funciona antes de seguir
