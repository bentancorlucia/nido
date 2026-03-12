import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { WidgetGrid } from './WidgetGrid'

export function Dashboard() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const dateStr = format(now, "EEEE d 'de' MMMM, yyyy", { locale: es })

  return (
    <div className="dashboard-layout">
      {/* Header with decorative orbs */}
      <div className="dashboard-header" style={{ padding: '28px 32px 12px' }}>
        {/* Decorative background orbs */}
        <div className="dashboard-orb dashboard-orb-1" />
        <div className="dashboard-orb dashboard-orb-2" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="dashboard-header-inner"
        >
          <div className="dashboard-greeting-row">
            <h1 className="dashboard-greeting">
              {greeting}
            </h1>
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Sparkles size={22} className="dashboard-sparkle-icon" />
            </motion.div>
          </div>
          <p className="dashboard-date dashboard-date-cap">{dateStr}</p>
        </motion.div>
      </div>

      {/* Widget Grid */}
      <div className="dashboard-widget-area" style={{ padding: '4px 32px 16px' }}>
        <WidgetGrid />
      </div>
    </div>
  )
}
