import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useTagStore, TAG_COLORS } from '../../stores/useTagStore'
import { Button } from '../ui/Button'
import type { Tag } from '../../types'

export function TagManager() {
  const { tags, loadTags, createTag, updateTag, deleteTag } = useTagStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0].text)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createTag(newName.trim(), newColor)
    setNewName('')
    setNewColor(TAG_COLORS[0].text)
    setShowCreate(false)
  }

  const handleEdit = async () => {
    if (!editingId || !editName.trim()) return
    await updateTag(editingId, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteTag(deleteId)
    setDeleteId(null)
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  return (
    <div>
      <div className="tags-header">
        <h3 className="tags-title">Etiquetas</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="tags-add-btn"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="tags-create-form glass"
            style={{ padding: '16px 18px' }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la etiqueta..."
              className="tags-create-input"
              autoFocus
            />
            <div className="tags-color-grid">
              {TAG_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setNewColor(c.text)}
                  className={`tags-color-swatch ${newColor === c.text ? 'tags-color-swatch--selected' : ''}`}
                  style={{ backgroundColor: c.bg, border: `2px solid ${c.text}` }}
                />
              ))}
            </div>
            <div className="tags-create-actions">
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Crear</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag list */}
      <div className="tags-list">
        {tags.map((tag) => (
          <div key={tag.id}>
            {editingId === tag.id ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass tags-edit-form"
                style={{ padding: '14px 16px' }}
              >
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  className="tags-edit-input"
                  autoFocus
                />
                <div className="tags-edit-colors">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setEditColor(c.text)}
                      className={`tags-color-swatch-sm ${editColor === c.text ? 'tags-color-swatch-sm--selected' : ''}`}
                      style={{ backgroundColor: c.bg, border: `2px solid ${c.text}` }}
                    />
                  ))}
                </div>
                <div className="tags-edit-actions">
                  <button onClick={handleEdit} className="tags-edit-save"><Check size={12} /></button>
                  <button onClick={() => setEditingId(null)} className="tags-edit-cancel"><X size={12} /></button>
                </div>
              </motion.div>
            ) : (
              <div className="tags-item">
                <span
                  className="tags-item-badge"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                >
                  {tag.name}
                </span>
                <div className="tags-item-spacer" />
                <div className="tags-item-actions">
                  <button
                    onClick={() => startEdit(tag)}
                    className="tags-item-action-btn tags-item-action-btn--edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteId(tag.id)}
                    className="tags-item-action-btn tags-item-action-btn--delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <p className="tags-empty">Sin etiquetas</p>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tags-delete-overlay"
          >
            <div className="tags-delete-backdrop" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass-strong tags-delete-modal"
            >
              <p className="tags-delete-text">
                ¿Eliminar la etiqueta <strong>{tags.find((t) => t.id === deleteId)?.name}</strong>? Se quitará de todas las tareas.
              </p>
              <div className="tags-delete-actions">
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
