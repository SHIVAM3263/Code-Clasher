export default function HealthBar({ current, max = 100, label, reversed = false, color }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100))

  let barClass = 'health-high'
  let barColor = color
  if (!color) {
    if (pct > 60) barColor = 'var(--green)'
    else if (pct > 30) barColor = 'var(--gold)'
    else barColor = 'var(--red)'
  }

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: reversed ? 'flex-end' : 'flex-start',
          marginBottom: 4,
          gap: 8, alignItems: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11, letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
          }}>
            {label}
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14, fontWeight: 700,
            color: barColor,
            textShadow: `0 0 10px ${barColor}`,
          }}>
            {current}<span style={{ color: 'var(--text-muted)', fontSize: 10 }}>/{max}</span>
          </span>
        </div>
      )}

      {/* Track */}
      <div style={{
        width: '100%', height: 18,
        background: 'var(--dark-4)',
        border: `1px solid ${pct < 30 ? 'rgba(255,45,85,0.3)' : 'var(--border-subtle)'}`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: pct < 30 ? '0 0 12px rgba(255,45,85,0.2)' : 'none',
        transition: 'box-shadow 0.5s',
      }}>
        {/* Fill */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: `${pct}%`,
          left: reversed ? 'auto' : 0,
          right: reversed ? 0 : 'auto',
          background: barColor,
          boxShadow: `0 0 12px ${barColor}`,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 2s infinite',
          }} />
        </div>

        {/* Tick marks */}
        {[25, 50, 75].map(tick => (
          <div key={tick} style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${tick}%`,
            width: 1,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1,
          }} />
        ))}
      </div>
    </div>
  )
}
