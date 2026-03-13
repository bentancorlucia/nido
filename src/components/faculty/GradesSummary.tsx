import type { WeightedAverageResult } from '../../types'

interface GradesSummaryProps {
  result: WeightedAverageResult | null
  approvalThreshold: number
}

export function GradesSummary({ result, approvalThreshold }: GradesSummaryProps) {
  if (!result || result.categories.length === 0) {
    return null
  }

  const overallPct = result.overall !== null ? Math.round(result.overall * 100) : null
  const overallGrade = result.overall !== null ? (result.overall * 10).toFixed(1) : null

  return (
    <div className="grades-summary">
      <div className="grades-summary-main">
        {overallGrade !== null ? (
          <>
            <span className={`grades-summary-value ${result.meetsThreshold ? 'grades-summary-value--ok' : 'grades-summary-value--risk'}`}>
              {overallGrade}
            </span>
            <span className="grades-summary-label">
              {overallPct}% · Mínimo: {approvalThreshold}%
            </span>
          </>
        ) : (
          <>
            <span className="grades-summary-value grades-summary-value--none">Sin notas aún</span>
            <span className="grades-summary-label">Agregá evaluaciones</span>
          </>
        )}
      </div>
      <div className="grades-summary-cats">
        {result.categories.map((cat) => {
          const catPct = cat.average !== null ? Math.round(cat.average * 100) : 0
          return (
            <div key={cat.id} className="grades-summary-cat">
              <span className="grades-summary-cat-name">{cat.name}</span>
              <div className="grades-summary-cat-bar">
                <div
                  className="grades-summary-cat-fill"
                  style={{
                    width: cat.average !== null ? `${catPct}%` : '0%',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                  }}
                />
              </div>
              <span className="grades-summary-cat-value">
                {cat.average !== null ? (cat.average * 10).toFixed(1) : '—'}
              </span>
              <span className="grades-summary-cat-weight">{cat.weight}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
