import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, StickyNote } from 'lucide-react'
import { FadeIn } from '../../lib/animations'
import { usePostItStore } from '../../stores/usePostItStore'
import { dbQuery } from '../../lib/ipc'
import { PostIt } from './PostIt'
import type { Task } from '../../types'

export function PostItBoard() {
  const { postIts, loading, colors, loadPostIts, createPostIt, movePostIt } = usePostItStore()
  const [linkedTasks, setLinkedTasks] = useState<Record<string, string>>({})
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    loadPostIts()
  }, [])

  // Load linked task titles
  useEffect(() => {
    loadLinkedTasks()
  }, [postIts])

  async function loadLinkedTasks() {
    const linkedIds = postIts.filter((p) => p.linked_task_id).map((p) => p.linked_task_id!)
    if (linkedIds.length === 0) return

    const placeholders = linkedIds.map(() => '?').join(',')
    const tasks = await dbQuery<Task>(
      `SELECT id, title FROM tasks WHERE id IN (${placeholders})`,
      linkedIds
    )
    const map: Record<string, string> = {}
    tasks.forEach((t) => { map[t.id] = t.title })
    setLinkedTasks(map)
  }

  const handleCreate = async (color?: string) => {
    await createPostIt('', color)
    setShowColorPicker(false)
  }

  const handleDragEnd = (id: string, x: number, y: number) => {
    // Clamp to positive values
    movePostIt(id, Math.max(0, x), Math.max(0, y))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between" style={{ padding: '20px 28px 16px' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-postit-cyan/30 to-postit-lime/30 flex items-center justify-center">
              <StickyNote size={16} className="text-text-secondary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-text-primary tracking-tight">Post-its</h1>
              <p className="text-[11px] text-text-muted">{postIts.length} notas</p>
            </div>
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center shadow-sm"
            >
              <Plus size={18} />
            </motion.button>

            <AnimatePresence>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    className="absolute right-0 top-full mt-2 z-50 glass-strong rounded-xl shadow-lg p-3"
                  >
                    <p className="text-[11px] text-text-muted mb-2 font-medium">Color del post-it</p>
                    <div className="flex gap-2">
                      {colors.map((c) => (
                        <motion.button
                          key={c.name}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCreate(c.value)}
                          className="w-7 h-7 rounded-lg shadow-sm border border-black/5 transition-shadow hover:shadow-md"
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </FadeIn>

      {/* Board area */}
      <div className="flex-1 rounded-2xl glass relative overflow-hidden" style={{ margin: '0 28px 24px' }}>
        {/* Cork board texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-text-muted) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {postIts.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <StickyNote size={40} className="text-text-muted/30 mb-3" />
            <p className="text-[14px] text-text-muted">
              Creá tu primer post-it con el botón <span className="text-primary font-medium">+</span>
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {postIts.map((postIt) => (
            <PostIt
              key={postIt.id}
              postIt={postIt}
              linkedTaskTitle={postIt.linked_task_id ? linkedTasks[postIt.linked_task_id] ?? null : null}
              onDragEnd={(x, y) => handleDragEnd(postIt.id, x, y)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
