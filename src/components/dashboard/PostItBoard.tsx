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
    <div className="postitboard-layout">
      {/* Header */}
      <FadeIn>
        <div className="postitboard-header" style={{ padding: '20px 28px 16px' }}>
          <div className="postitboard-header-left">
            <div className="postitboard-icon-wrap">
              <StickyNote size={16} className="postitboard-icon" />
            </div>
            <div>
              <h1 className="postitboard-title">Post-its</h1>
              <p className="postitboard-subtitle">{postIts.length} notas</p>
            </div>
          </div>

          <div className="postitboard-add-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="postitboard-add-btn"
            >
              <Plus size={18} />
            </motion.button>

            <AnimatePresence>
              {showColorPicker && (
                <>
                  <div className="postitboard-color-overlay" onClick={() => setShowColorPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    className="postitboard-color-picker glass-strong"
                  >
                    <p className="postitboard-color-label">Color del post-it</p>
                    <div className="postitboard-color-options">
                      {colors.map((c) => (
                        <motion.button
                          key={c.name}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCreate(c.value)}
                          className="postitboard-color-btn"
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
      <div className="postitboard-canvas glass" style={{ margin: '0 28px 24px' }}>
        {/* Cork board texture */}
        <div
          className="postitboard-texture"
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
            className="postitboard-empty"
          >
            <StickyNote size={40} className="postitboard-empty-icon" />
            <p className="postitboard-empty-text">
              Creá tu primer post-it con el botón <span className="postitboard-empty-highlight">+</span>
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
