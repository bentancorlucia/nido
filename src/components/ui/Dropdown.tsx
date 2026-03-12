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
    <div className={`dropdown ${className}`} ref={ref}>
      {label && (
        <label className="dropdown__label">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`dropdown__trigger ${!selected ? 'dropdown__trigger--placeholder' : ''}`}
      >
        <span className="dropdown__selected">
          {selected?.icon}
          {selected?.color && (
            <span className="dropdown__color-dot" style={{ backgroundColor: selected.color }} />
          )}
          {selected?.label ?? placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={14} className="dropdown__chevron" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="dropdown__menu glass-strong"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`dropdown__option ${opt.value === value ? 'dropdown__option--selected' : ''}`}
              >
                {opt.icon}
                {opt.color && (
                  <span className="dropdown__color-dot" style={{ backgroundColor: opt.color }} />
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
