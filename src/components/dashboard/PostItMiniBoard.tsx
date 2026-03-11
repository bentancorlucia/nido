import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, StickyNote, X } from 'lucide-react'
import { usePostItStore } from '../../stores/usePostItStore'

export function PostItMiniBoard() {
  const { postIts, loading, colors, loadPostIts, createPostIt, updatePostIt, deletePostIt } = usePostItStore()

  useEffect(() => {
    loadPostIts()
  }, [])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleCreate = async () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)].value
    await createPostIt('', randomColor)
  }

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const handleSaveEdit = async () => {
    if (editingId) {
      await updatePostIt(editingId, { content: editContent })
      setEditingId(null)
    }
  }

  // Random subtle rotation for each post-it
  const getRotation = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
    return (hash % 5) - 2 // ±2.5°
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {postIts.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <StickyNote size={28} className="text-text-muted/25 mb-2" />
          <p className="text-xs text-text-muted mb-3">Sin notas aún</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="text-xs text-primary font-medium hover:underline"
          >
            Crear post-it
          </motion.button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-2 p-1">
              <AnimatePresence mode="popLayout">
                {postIts.slice(0, 12).map((postIt) => (
                  <motion.div
                    key={postIt.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: getRotation(postIt.id) }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="relative group cursor-pointer"
                    style={{ width: 'calc(50% - 4px)', minWidth: 80 }}
                    onClick={() => handleStartEdit(postIt.id, postIt.content)}
                  >
                    <div
                      className="rounded-md shadow-sm p-2 min-h-[60px] relative overflow-hidden"
                      style={{ backgroundColor: postIt.color }}
                    >
                      {/* Folded corner */}
                      <div
                        className="absolute top-0 right-0 w-4 h-4"
                        style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)' }}
                      />
                      {/* Delete btn */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePostIt(postIt.id) }}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-[#304B42]" />
                      </button>

                      {editingId === postIt.id ? (
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => e.key === 'Escape' && handleSaveEdit()}
                          className="w-full bg-transparent outline-none resize-none text-[10px] leading-snug"
                          style={{ color: '#304B42', minHeight: 40 }}
                        />
                      ) : (
                        <p className="text-[10px] leading-snug line-clamp-4 whitespace-pre-wrap" style={{ color: postIt.content ? '#304B42' : '#304B4266' }}>
                          {postIt.content || 'Click para escribir...'}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-2 flex justify-center border-t border-border/30">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="flex items-center gap-1 text-[10px] text-primary font-medium"
            >
              <Plus size={12} /> Nuevo
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}
