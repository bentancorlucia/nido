import { type ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ContextMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  children: ReactNode
}

export function ContextMenu({ items, children }: ContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
              style={{ left: pos.x, top: pos.y }}
              className="absolute glass-strong rounded-xl shadow-lg p-1.5 min-w-[190px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((item, i) => (
                <div key={i}>
                  {item.divider && <div className="h-px bg-border my-1 mx-1" />}
                  <button
                    onClick={() => {
                      item.onClick()
                      setOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg
                      transition-colors duration-120
                      ${item.danger
                        ? 'text-danger hover:bg-danger-light/50'
                        : 'text-text-primary hover:bg-surface-alt/50'
                      }
                    `}
                  >
                    {item.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
                    {item.label}
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
