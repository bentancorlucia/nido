import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { useNotificationStore } from '../../stores/useNotificationStore'

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

export function ToastContainer() {
  const { toasts, removeToast, initListener } = useNotificationStore()

  useEffect(() => {
    const cleanup = initListener()
    return cleanup
  }, [])

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`toast toast-${toast.variant}`}
            >
              <Icon size={16} className="toast-icon" />
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
