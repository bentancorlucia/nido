import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface AddColumnProps {
  onAdd: (name: string) => void
}

export function AddColumn({ onAdd }: AddColumnProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName('')
    setAdding(false)
  }

  return (
    <div className="flex-shrink-0" style={{ width: 296 }}>
      <AnimatePresence mode="wait">
        {adding ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-xl"
            style={{ padding: '16px 18px' }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setName('') }
              }}
              placeholder="Nombre de la columna..."
              className="w-full text-[13px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/45 pb-2.5 border-b border-border"
              autoFocus
            />
            <div className="flex gap-2 mt-3.5">
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-[12px] font-semibold disabled:opacity-40 transition-opacity"
              >
                Agregar
              </button>
              <button
                onClick={() => { setAdding(false); setName('') }}
                className="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => setAdding(true)}
            className="w-full py-10 rounded-2xl border-2 border-dashed border-border hover:border-primary/25 text-text-muted hover:text-primary transition-all flex items-center justify-center gap-2 text-[13px] font-medium"
          >
            <Plus size={16} />
            Agregar columna
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
