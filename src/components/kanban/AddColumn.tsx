import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface AddColumnProps {
  onAdd: (name: string) => void
}

export function AddColumn({ onAdd }: AddColumnProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [adding])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
    setAdding(false)
  }

  return (
    <div className="kcol-add">
      <AnimatePresence mode="wait">
        {adding ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="kcol-add__form glass"
          >
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setName('') }
              }}
              placeholder="Nombre de columna..."
              className="kcol-add__input"
            />
            <div className="kcol-add__actions">
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="kcol-add__submit"
              >
                Agregar
              </button>
              <button
                onClick={() => { setAdding(false); setName('') }}
                className="kcol-add__cancel icon-button"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAdding(true)}
            className="kcol-add__trigger"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Agregar columna</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
