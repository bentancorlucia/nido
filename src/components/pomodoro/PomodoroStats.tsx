import { motion } from 'framer-motion'
import { Flame, Clock, Target } from 'lucide-react'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { FadeIn } from '../../lib/animations'

export function PomodoroStats() {
  const { sessionsToday, totalFocusToday, streak, weeklyData } = usePomodoroStore()

  const maxCount = Math.max(1, ...weeklyData.map((d) => d.count))

  return (
    <div className="pstats-root">
      {/* Stats cards */}
      <div className="pstats-cards">
        <FadeIn delay={0.05}>
          <div className="glass pstats-card">
            <div className="pstats-card-icon pstats-card-icon--sessions">
              <Target size={16} />
            </div>
            <p className="pstats-card-value">{sessionsToday}</p>
            <p className="pstats-card-label">Sesiones hoy</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="glass pstats-card">
            <div className="pstats-card-icon pstats-card-icon--focus">
              <Clock size={16} />
            </div>
            <p className="pstats-card-value">{totalFocusToday}</p>
            <p className="pstats-card-label">Min enfoque</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="glass pstats-card">
            <div className="pstats-card-icon pstats-card-icon--streak">
              <Flame size={16} />
            </div>
            <p className="pstats-card-value">{streak}</p>
            <p className="pstats-card-label">Días de racha</p>
          </div>
        </FadeIn>
      </div>

      {/* Weekly chart */}
      <FadeIn delay={0.2}>
        <div className="glass pstats-chart">
          <p className="section-label pstats-chart-title">Historial semanal</p>
          <div className="pstats-chart-bars">
            {weeklyData.map((item, i) => (
              <div key={i} className="pstats-chart-bar-col">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (item.count / maxCount) * 80)}px` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 + i * 0.05 }}
                  className="pstats-chart-bar"
                  style={{
                    background: item.count > 0
                      ? 'linear-gradient(to top, var(--color-primary), var(--color-primary-hover))'
                      : 'var(--color-surface-alt)',
                  }}
                />
                <span className="pstats-chart-day">{item.day}</span>
                {item.count > 0 && (
                  <span className="pstats-chart-count">{item.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
