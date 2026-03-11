import { type ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  icon?: ReactNode
  color?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  label,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={ref}>
      {label && (
        <label className="text-[13px] font-display font-medium text-text-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          relative w-full flex items-center justify-between gap-2
          px-4 py-2.5 rounded-xl border text-[13.5px]
          bg-surface-solid/40 text-text-primary
          border-border hover:border-border-strong
          focus:border-border-focus focus:ring-2 focus:ring-border-focus/12
          outline-none transition-all duration-200 shadow-inner
          ${!selected ? 'text-text-muted/50' : ''}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon}
          {selected?.color && (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
          )}
          {selected?.label ?? placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={14} className="text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-50 w-full mt-1.5 glass-strong rounded-xl shadow-lg py-1.5 max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2 text-[13px] rounded-lg
                  transition-colors duration-120
                  ${opt.value === value
                    ? 'bg-primary-light/50 text-primary font-medium'
                    : 'text-text-primary hover:bg-surface-alt/50'
                  }
                `}
              >
                {opt.icon}
                {opt.color && (
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
