import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pin, Trash2, Link2 } from 'lucide-react'
import { usePostItStore } from '../../stores/usePostItStore'
import type { PostIt as PostItType } from '../../types'

interface PostItProps {
  postIt: PostItType
  onDragStart?: () => void
  onDragEnd?: (x: number, y: number) => void
  linkedTaskTitle?: string | null
}

export function PostIt({ postIt, onDragStart, onDragEnd, linkedTaskTitle }: PostItProps) {
  const { updatePostIt, deletePostIt, togglePin, bringToFront } = usePostItStore()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(postIt.content)
  const [showDelete, setShowDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Random subtle rotation for natural look
  const [rotation] = useState(() => (Math.random() - 0.5) * 4) // +/-2deg

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (content !== postIt.content) {
      updatePostIt(postIt.id, { content })
    }
  }

  const handleDelete = () => {
    if (showDelete) {
      deletePostIt(postIt.id)
    } else {
      setShowDelete(true)
      setTimeout(() => setShowDelete(false), 3000)
    }
  }

  // Determine if text should be dark or light based on bg color
  const textColor = '#304B42'

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: isEditing ? 0 : rotation,
      }}
      exit={{ scale: 0, opacity: 0, rotate: rotation * 3 }}
      whileHover={{
        scale: 1.03,
        rotate: 0,
        zIndex: 100,
        transition: { duration: 0.15 },
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      drag
      dragMomentum={false}
      onDragStart={() => {
        bringToFront(postIt.id)
        onDragStart?.()
      }}
      onDragEnd={(_, info) => {
        const newX = postIt.position_x + info.offset.x
        const newY = postIt.position_y + info.offset.y
        onDragEnd?.(newX, newY)
      }}
      className="postit-wrap"
      style={{
        left: postIt.position_x,
        top: postIt.position_y,
        width: postIt.width,
        zIndex: postIt.z_index,
      }}
    >
      <div
        className="postit-inner"
        style={{
          backgroundColor: postIt.color,
          minHeight: postIt.height,
        }}
      >
        {/* Folded corner effect */}
        <div
          className="postit-corner"
          style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)`,
          }}
        />

        {/* Pin indicator */}
        {postIt.is_pinned === 1 && (
          <div className="postit-pin">
            <div className="postit-pin-dot" />
          </div>
        )}

        {/* Actions - visible on hover */}
        <div className="postit-actions">
          <button
            onClick={(e) => { e.stopPropagation(); togglePin(postIt.id) }}
            className="postit-action-btn"
            title={postIt.is_pinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={11} style={{ color: textColor }} className={postIt.is_pinned === 1 ? 'postit-fill-current' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            className="postit-action-btn"
            title={showDelete ? 'Confirmar eliminar' : 'Eliminar'}
          >
            <Trash2 size={11} style={{ color: showDelete ? '#7E1946' : textColor }} />
          </button>
        </div>

        {/* Content */}
        <div className="postit-content-area" onClick={() => setIsEditing(true)}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              className="postit-textarea-full"
              style={{ color: textColor, minHeight: (postIt.height ?? 140) - 50 }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleBlur()
              }}
            />
          ) : (
            <p
              className="postit-display-text"
              style={{ color: content ? textColor : `${textColor}88` }}
            >
              {content || 'Click para escribir...'}
            </p>
          )}
        </div>

        {/* Linked task indicator */}
        {linkedTaskTitle && (
          <div
            className="postit-linked-task"
            style={{ color: textColor }}
          >
            <Link2 size={10} />
            <span className="postit-linked-task-text">{linkedTaskTitle}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
