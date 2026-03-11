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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[14px] font-display font-semibold text-text-primary">Etiquetas</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light/40 transition-colors"
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
            className="mb-5 glass rounded-xl overflow-hidden"
            style={{ padding: '16px 18px' }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la etiqueta..."
              className="w-full text-[13px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/45 mb-4"
              autoFocus
            />
            <div className="flex gap-2.5 flex-wrap mb-4">
              {TAG_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setNewColor(c.text)}
                  className={`w-6 h-6 rounded-full transition-all ${newColor === c.text ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-solid scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c.bg, border: `2px solid ${c.text}` }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Crear</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag list */}
      <div className="space-y-1.5">
        {tags.map((tag) => (
          <div key={tag.id}>
            {editingId === tag.id ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl"
                style={{ padding: '14px 16px' }}
              >
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  className="w-full text-[13px] bg-transparent outline-none text-text-primary mb-2"
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap mb-3">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setEditColor(c.text)}
                      className={`w-5 h-5 rounded-full transition-all ${editColor === c.text ? 'ring-2 ring-primary ring-offset-1 scale-110' : ''}`}
                      style={{ backgroundColor: c.bg, border: `2px solid ${c.text}` }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEdit} className="p-1 rounded-md bg-primary text-white"><Check size={12} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded-md text-text-muted hover:bg-surface-alt/60"><X size={12} /></button>
                </div>
              </motion.div>
            ) : (
              <div className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-surface-alt/35 transition-colors">
                <span
                  className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                >
                  {tag.name}
                </span>
                <div className="flex-1" />
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button
                    onClick={() => startEdit(tag)}
                    className="p-1 rounded text-text-muted hover:text-primary transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteId(tag.id)}
                    className="p-1 rounded text-text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-center text-text-muted text-xs italic py-4">Sin etiquetas</p>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/20" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="relative glass-strong rounded-2xl shadow-lift p-5 max-w-sm mx-4"
            >
              <p className="text-[13px] text-text-primary mb-4">
                ¿Eliminar la etiqueta <strong>{tags.find((t) => t.id === deleteId)?.name}</strong>? Se quitará de todas las tareas.
              </p>
              <div className="flex justify-end gap-2">
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
