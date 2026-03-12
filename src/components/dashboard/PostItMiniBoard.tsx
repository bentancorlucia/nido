import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, StickyNote, X, Pencil } from 'lucide-react'
import { usePostItStore } from '../../stores/usePostItStore'
import type { PostIt } from '../../types'

export function PostItMiniBoard() {
  const { postIts, loading, colors, loadPostIts, createPostIt, updatePostIt, deletePostIt, movePostIt, bringToFront } =
    usePostItStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPostIts()
  }, [])

  const handleCreate = async () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)].value
    await createPostIt('', randomColor)
  }

  const handleStartEdit = useCallback((id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (editingId) {
      await updatePostIt(editingId, { content: editContent })
      setEditingId(null)
      setEditContent('')
    }
  }, [editingId, editContent, updatePostIt])

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      e.preventDefault()
      deletePostIt(id)
    },
    [deletePostIt]
  )

  const getRotation = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
    return (hash % 5) - 2
  }

  if (postIts.length === 0 && !loading) {
    return (
      <div className="widget-empty">
        <div
          className="widget-empty-icon"
          style={{
            background: 'linear-gradient(135deg, rgba(248,208,176,0.3), rgba(224,212,234,0.2))',
          }}
        >
          <StickyNote size={22} style={{ color: '#D4894A' }} />
        </div>
        <p className="postitmini-empty-title">Sin notas aún</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          className="postitmini-empty-create-btn"
        >
          <Plus size={13} /> Crear post-it
        </motion.button>
      </div>
    )
  }

  const displayed = postIts.slice(0, 12)

  return (
    <div className="postitmini-container">
      {/* Header */}
      <div className="postitmini-header">
        <span className="postitmini-count">{postIts.length} notas</span>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCreate}
          className="postit-btn-add postitmini-add-btn"
        >
          <Plus size={14} />
        </motion.button>
      </div>

      {/* Free-form corkboard */}
      <div ref={boardRef} className="postit-board">
        <AnimatePresence>
          {displayed.map((postIt) => (
            <PostItCard
              key={postIt.id}
              postIt={postIt}
              boardRef={boardRef}
              rotation={getRotation(postIt.id)}
              isEditing={editingId === postIt.id}
              editContent={editContent}
              onEditChange={setEditContent}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
              onDragEnd={movePostIt}
              onDragStart={bringToFront}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface PostItCardProps {
  postIt: PostIt
  boardRef: React.RefObject<HTMLDivElement | null>
  rotation: number
  isEditing: boolean
  editContent: string
  onEditChange: (v: string) => void
  onStartEdit: (id: string, content: string) => void
  onSaveEdit: () => void
  onDelete: (e: React.MouseEvent, id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onDragStart: (id: string) => void
}

function PostItCard({
  postIt,
  boardRef,
  rotation,
  isEditing,
  editContent,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onDelete,
  onDragEnd,
  onDragStart,
}: PostItCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const didDrag = useRef(false)

  const handleDragStart = () => {
    setIsDragging(true)
    didDrag.current = true
    onDragStart(postIt.id)
  }

  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: { point: { x: number; y: number } }) => {
    setIsDragging(false)
    // Save new position relative to board
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const el = document.getElementById(`postit-${postIt.id}`)
      if (el) {
        const elRect = el.getBoundingClientRect()
        const newX = elRect.left - rect.left
        const newY = elRect.top - rect.top
        onDragEnd(postIt.id, Math.max(0, newX), Math.max(0, newY))
      }
    }
  }

  const handleClick = () => {
    if (!didDrag.current && !isEditing) {
      onStartEdit(postIt.id, postIt.content)
    }
  }

  const handlePointerDown = () => {
    didDrag.current = false
  }

  // Calculate initial position — distribute in grid-like pattern if position is default
  const CARD_W = 120

  return (
    <motion.div
      id={`postit-${postIt.id}`}
      drag
      dragConstraints={boardRef}
      dragElastic={0.05}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: isDragging ? 0 : isEditing ? 0 : rotation,
        x: 0,
        y: 0,
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileDrag={{
        scale: 1.08,
        rotate: 0,
        cursor: 'grabbing',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="postit-card-wrap"
      style={{
        zIndex: isDragging ? 100 : postIt.z_index,
        width: CARD_W,
      }}
    >
      <div
        className={`mini-postit ${isDragging ? 'dragging' : ''}`}
        style={{ backgroundColor: postIt.color }}
        onClick={handleClick}
      >
        {/* Delete button */}
        <button onClick={(e) => onDelete(e, postIt.id)} className="postit-delete-btn" tabIndex={-1}>
          <X size={10} />
        </button>

        {/* Content */}
        {isEditing ? (
          <textarea
            autoFocus
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onSaveEdit()
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="postit-textarea"
            style={{ minHeight: 52 }}
          />
        ) : (
          <p
            className="postitmini-content-text"
            style={{ color: postIt.content ? '#304B42' : '#304B4250' }}
          >
            {postIt.content || 'Escribir...'}
          </p>
        )}

        {/* Edit hint */}
        {!isEditing && !postIt.content && (
          <div className="postit-edit-hint">
            <Pencil size={9} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
