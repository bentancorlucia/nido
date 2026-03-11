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
  const [rotation] = useState(() => (Math.random() - 0.5) * 4) // ±2°

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
  const isDarkBg = postIt.color === '#E8A0BC' || postIt.color === '#A0D4B8'
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
      className="absolute cursor-grab active:cursor-grabbing group"
      style={{
        left: postIt.position_x,
        top: postIt.position_y,
        width: postIt.width,
        zIndex: postIt.z_index,
      }}
    >
      <div
        className="rounded-lg shadow-md hover:shadow-lg transition-shadow relative overflow-hidden"
        style={{
          backgroundColor: postIt.color,
          minHeight: postIt.height,
        }}
      >
        {/* Folded corner effect */}
        <div
          className="absolute top-0 right-0 w-6 h-6"
          style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)`,
          }}
        />

        {/* Pin indicator */}
        {postIt.is_pinned === 1 && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-0.5">
            <div className="w-3 h-3 rounded-full bg-danger shadow-sm" />
          </div>
        )}

        {/* Actions - visible on hover */}
        <div className="absolute top-1.5 right-7 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); togglePin(postIt.id) }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title={postIt.is_pinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={11} style={{ color: textColor }} className={postIt.is_pinned === 1 ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title={showDelete ? 'Confirmar eliminar' : 'Eliminar'}
          >
            <Trash2 size={11} style={{ color: showDelete ? '#7E1946' : textColor }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 pt-4" onClick={() => setIsEditing(true)}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              className="w-full bg-transparent outline-none resize-none text-[13px] leading-relaxed"
              style={{ color: textColor, minHeight: (postIt.height ?? 140) - 50 }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleBlur()
              }}
            />
          ) : (
            <p
              className="text-[13px] leading-relaxed whitespace-pre-wrap break-words min-h-[60px]"
              style={{ color: content ? textColor : `${textColor}88` }}
            >
              {content || 'Click para escribir...'}
            </p>
          )}
        </div>

        {/* Linked task indicator */}
        {linkedTaskTitle && (
          <div
            className="px-3 pb-2 flex items-center gap-1 opacity-60"
            style={{ color: textColor }}
          >
            <Link2 size={10} />
            <span className="text-[10px] truncate">{linkedTaskTitle}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
