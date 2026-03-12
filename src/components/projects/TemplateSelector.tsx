import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookTemplate,
  GraduationCap,
  CalendarRange,
  Briefcase,
  ChevronRight,
  X,
  FolderTree,
} from 'lucide-react'
import { loadTemplates, applyTemplate, extractVariables } from '../../lib/templates'
import { useProjectStore } from '../../stores/useProjectStore'
import { modalVariants, overlayVariants } from '../../lib/animations'
import type { Template } from '../../types'

const TEMPLATE_ICONS: Record<string, typeof BookTemplate> = {
  'Nueva Materia': GraduationCap,
  'Semestre Completo': CalendarRange,
  'Proyecto Personal': Briefcase,
}

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
}

export function TemplateSelector({ open, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [variableKeys, setVariableKeys] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  const { loadProjects } = useProjectStore()

  useEffect(() => {
    if (open) {
      loadTemplates().then(setTemplates)
      setSelected(null)
      setVariables({})
    }
  }, [open])

  const handleSelectTemplate = (template: Template) => {
    setSelected(template)
    const keys = extractVariables(template.structure)
    setVariableKeys(keys)
    const defaults: Record<string, string> = {}
    for (const k of keys) defaults[k] = ''
    setVariables(defaults)
  }

  const handleApply = async () => {
    if (!selected) return

    // Validate all variables filled
    const hasEmpty = variableKeys.some((k) => !variables[k]?.trim())
    if (hasEmpty) return

    setApplying(true)
    try {
      await applyTemplate(selected.id, variables)
      await loadProjects()
      onClose()
    } catch {
      // handle error silently
    } finally {
      setApplying(false)
    }
  }

  const variableLabels: Record<string, string> = {
    nombre_materia: 'Nombre de la materia',
    periodo: 'Período (ej: 1er 2026)',
    nombre_proyecto: 'Nombre del proyecto',
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="tmpl-overlay">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="tmpl-backdrop"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="tmpl-modal"
          >
            {/* Header */}
            <div className="tmpl-header">
              <div className="tmpl-header-left">
                <div className="tmpl-header-icon">
                  <BookTemplate size={16} className="tmpl-header-icon-svg" />
                </div>
                <div>
                  <h2 className="tmpl-header-title">
                    {selected ? selected.name : 'Crear desde template'}
                  </h2>
                  <p className="tmpl-header-subtitle">
                    {selected ? 'Completá los datos para crear el proyecto' : 'Elegí una plantilla para empezar'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="tmpl-close-btn"
              >
                <X size={15} className="tmpl-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="tmpl-content">
              {!selected ? (
                /* Template list */
                <div className="tmpl-list">
                  {templates.map((template) => {
                    const Icon = TEMPLATE_ICONS[template.name] ?? FolderTree
                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectTemplate(template)}
                        className="tmpl-list-item"
                      >
                        <div className="tmpl-list-item-icon">
                          <Icon size={18} className="tmpl-list-item-icon-svg" />
                        </div>
                        <div className="tmpl-list-item-info">
                          <p className="tmpl-list-item-name">{template.name}</p>
                          <p className="tmpl-list-item-desc">{template.description}</p>
                        </div>
                        <ChevronRight size={14} className="tmpl-list-item-arrow" />
                      </motion.button>
                    )
                  })}

                  {templates.length === 0 && (
                    <p className="tmpl-empty">No hay templates disponibles</p>
                  )}
                </div>
              ) : (
                /* Variable inputs */
                <div className="tmpl-var-form">
                  {/* Preview structure */}
                  <div className="tmpl-preview-box">
                    <p className="tmpl-preview-label">
                      Estructura del template
                    </p>
                    <TemplatePreview structure={selected.structure} variables={variables} />
                  </div>

                  {/* Variable fields */}
                  {variableKeys.length > 0 && (
                    <div className="tmpl-var-fields">
                      {variableKeys.map((key) => (
                        <div key={key}>
                          <label className="tmpl-var-label">
                            {variableLabels[key] ?? key.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={variables[key] ?? ''}
                            onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                            placeholder={`Ingresá ${(variableLabels[key] ?? key).toLowerCase()}`}
                            className="tmpl-var-input"
                            autoFocus={variableKeys.indexOf(key) === 0}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="tmpl-form-actions">
                    <button
                      onClick={() => setSelected(null)}
                      className="tmpl-back-btn"
                    >
                      Volver
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApply}
                      disabled={applying || variableKeys.some((k) => !variables[k]?.trim())}
                      className="tmpl-apply-btn"
                    >
                      {applying ? 'Creando...' : 'Crear proyecto'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Mini tree preview of the template structure */
function TemplatePreview({ structure, variables }: { structure: string; variables: Record<string, string> }) {
  try {
    const data = JSON.parse(structure)
    return <TreeNode node={data} variables={variables} depth={0} />
  } catch {
    return <p className="tmpl-tree-error">Error al leer estructura</p>
  }
}

function TreeNode({ node, variables, depth }: { node: { name: string; children?: unknown[]; tasks?: string[] }; variables: Record<string, string>; depth: number }) {
  const name = node.name.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key]?.trim() || `{{${key}}}`)
  const hasValue = !name.includes('{{')

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="tmpl-tree-row">
        <FolderTree size={10} className="tmpl-tree-folder-icon" />
        <span className={`tmpl-tree-name ${!hasValue ? 'tmpl-tree-name--placeholder' : ''}`}>
          {name}
        </span>
      </div>
      {node.tasks?.map((t, i) => (
        <div key={i} className="tmpl-tree-row" style={{ paddingLeft: (depth + 1) * 12 }}>
          <span className="tmpl-tree-task-dot" />
          <span className="tmpl-tree-task-name">{t}</span>
        </div>
      ))}
      {node.children?.map((child, i) => {
        if (typeof child === 'string') return null
        return <TreeNode key={i} node={child as { name: string; children?: unknown[]; tasks?: string[] }} variables={variables} depth={depth + 1} />
      })}
    </div>
  )
}
