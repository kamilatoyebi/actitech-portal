export function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={120} height={12} />
        <Skeleton width={60} height={20} radius={99} />
      </div>
      <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={12} />
    </div>
  )
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ background: 'var(--navy)', padding: '10px 14px', display: 'flex', gap: 40 }}>
        {[100, 200, 80, 80, 100].map((w, i) => (
          <Skeleton key={i} width={w} height={10} style={{ opacity: 0.3 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px', borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 40, alignItems: 'center' }}>
          {[100, 200, 80, 80, 100].map((w, j) => (
            <Skeleton key={j} width={w} height={12} />
          ))}
        </div>
      ))}
    </div>
  )
}