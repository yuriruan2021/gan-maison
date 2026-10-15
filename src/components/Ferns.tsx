import { useMemo } from 'react'

/** Samambaias em primeiro plano (nítidas), nos cantos de baixo, para dar profundidade. */

type Frond = { d: string; pinnae: { x: number; y: number; a: number; len: number; tone: number }[] }

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function frond(seed: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, size: number): Frond {
  const r = rng(seed)
  const pinnae: Frond['pinnae'] = []
  const n = 26
  for (let i = 1; i < n; i++) {
    const t = i / n
    const u = 1 - t
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1
    const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx)
    const dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy)
    const base = (Math.atan2(dy, dx) * 180) / Math.PI
    const len = size * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.85 + r() * 0.3) + 4
    pinnae.push({ x, y, a: base - 62, len, tone: Math.floor(r() * 3) })
    pinnae.push({ x, y, a: base + 62, len: len * 0.92, tone: Math.floor(r() * 3) })
  }
  return { d: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, pinnae }
}

function FernSvg({ side }: { side: 'l' | 'r' }) {
  const fronds = useMemo(
    () => [
      frond(side === 'l' ? 3 : 7, 20, 300, 60, 120, 230, 60, 30),
      frond(side === 'l' ? 5 : 9, 30, 300, 140, 200, 300, 170, 26),
      frond(side === 'l' ? 11 : 13, 10, 300, 10, 160, 90, 20, 22),
    ],
    [side],
  )
  return (
    <svg className={`fern fern--${side}`} viewBox="0 0 320 300" aria-hidden>
      <g className="fern__sway">
        {fronds.map((f, i) => (
          <g key={i}>
            {f.pinnae.map((p, k) => (
              <g key={k} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.a.toFixed(1)})`}>
                <path
                  className={`fern__pinna--${p.tone}`}
                  d={`M0 0 C${(p.len * 0.3).toFixed(1)} -3.2 ${(p.len * 0.75).toFixed(1)} -2.6 ${p.len.toFixed(1)} 0 C${(p.len * 0.75).toFixed(1)} 2.6 ${(p.len * 0.3).toFixed(1)} 3.2 0 0 Z`}
                />
              </g>
            ))}
            <path className="fern__rachis" d={f.d} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function Ferns({ active }: { active: boolean }) {
  return (
    <div className={`ferns ${active ? 'is-active' : ''}`} aria-hidden>
      <FernSvg side="l" />
      <FernSvg side="r" />
    </div>
  )
}
