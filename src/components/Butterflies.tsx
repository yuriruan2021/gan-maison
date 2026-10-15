/**
 * Borboletas sobrevoando o prado. Cada uma tem um voo próprio (CSS) e asas batendo.
 * Ficam atrás do card e não recebem clique.
 */

// voo horizontal atravessando o prado; 'lr' = da esquerda para a direita, 'rl' = o contrário
const BUTTERFLIES = [
  { tone: 'cream', size: 42, flight: 'lr', dur: 22, delay: -4, bottom: '22%' },
  { tone: 'sage', size: 34, flight: 'rl', dur: 26, delay: -15, bottom: '34%' },
  { tone: 'gold', size: 38, flight: 'lr', dur: 19, delay: -13, bottom: '12%' },
  { tone: 'cream', size: 30, flight: 'rl', dur: 28, delay: -2, bottom: '16%' },
  { tone: 'sage', size: 32, flight: 'lr', dur: 24, delay: -20, bottom: '40%' },
]

function ButterflySvg() {
  return (
    <svg viewBox="-20 -16 40 32" aria-hidden>
      <g className="bf__wing bf__wing--l">
        <path className="bf__upper" d="M-1 -1 C-6 -14, -19 -15, -18 -6 C-17 0, -8 1, -1 0 Z" />
        <path className="bf__lower" d="M-1 0 C-7 2, -14 6, -12 11 C-9 15, -3 8, -1 2 Z" />
        <circle className="bf__dot" cx="-12" cy="-7" r="1.6" />
      </g>
      <g className="bf__wing bf__wing--r">
        <path className="bf__upper" d="M1 -1 C6 -14, 19 -15, 18 -6 C17 0, 8 1, 1 0 Z" />
        <path className="bf__lower" d="M1 0 C7 2, 14 6, 12 11 C9 15, 3 8, 1 2 Z" />
        <circle className="bf__dot" cx="12" cy="-7" r="1.6" />
      </g>
      <path className="bf__body" d="M0 -6 C1.2 -3, 1.2 6, 0 10 C-1.2 6, -1.2 -3, 0 -6 Z" />
      <path className="bf__antenna" d="M0 -6 C-1 -10, -3 -12, -5 -13 M0 -6 C1 -10, 3 -12, 5 -13" />
    </svg>
  )
}

export function Butterflies({ active }: { active: boolean }) {
  return (
    <div className={`butterflies ${active ? 'is-active' : ''}`} aria-hidden>
      {BUTTERFLIES.map((b, i) => (
        <span
          key={i}
          className={`bf bf--${b.tone} bf--flight-${b.flight}`}
          style={{
            bottom: b.bottom,
            width: b.size,
            height: b.size * 0.8,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <span className="bf__bob" style={{ animationDelay: `${i * -0.7}s` }}>
            <ButterflySvg />
          </span>
        </span>
      ))}
    </div>
  )
}
