import { motion } from 'framer-motion'
import type { AttendanceStats } from '../../types'

interface AttendanceProgressBarProps {
  stats: AttendanceStats
}

export function AttendanceProgressBar({ stats }: AttendanceProgressBarProps) {
  const pct = Math.min(100, Math.max(0, stats.percentage))
  const isOk = !stats.atRisk

  return (
    <div className="attendance-progress">
      <div className="attendance-progress-header">
        <span className={`attendance-progress-percentage ${isOk ? 'attendance-progress-percentage--ok' : 'attendance-progress-percentage--risk'}`}>
          {stats.total - stats.cancelled - stats.pending > 0 ? `${Math.round(pct)}%` : '—'}
        </span>
        <span className="attendance-progress-label">
          {stats.attended} de {stats.total - stats.cancelled - stats.pending} clases
        </span>
      </div>

      <div className="attendance-progress-bar">
        <motion.div
          className="attendance-progress-fill"
          style={{
            background: isOk
              ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
              : 'linear-gradient(90deg, var(--color-danger), var(--color-warning))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
        <div
          className="attendance-progress-threshold"
          style={{ left: `${stats.threshold}%` }}
        >
          <span className="attendance-progress-threshold-label">{stats.threshold}%</span>
        </div>
      </div>

      <div className="attendance-stats-row">
        <div className="attendance-stat-chip">
          <span className="attendance-stat-dot attendance-stat-dot--asisti" />
          Asistí: {stats.attended}
        </div>
        <div className="attendance-stat-chip">
          <span className="attendance-stat-dot attendance-stat-dot--falte" />
          Falté: {stats.absent}
        </div>
        <div className="attendance-stat-chip">
          <span className="attendance-stat-dot attendance-stat-dot--cancelada" />
          Canceladas: {stats.cancelled}
        </div>
        <div className="attendance-stat-chip">
          <span className="attendance-stat-dot attendance-stat-dot--pendiente" />
          Pendientes: {stats.pending}
        </div>
      </div>
    </div>
  )
}
