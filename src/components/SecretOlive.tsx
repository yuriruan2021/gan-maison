import { useId, useMemo } from 'react'

/**
 * O "segredo": uma oliveira, como a da recepção do novo espaço.
 * Fechada: tronco retorcido e poucas folhas, a copa pulsa.
 * Ao tocar: a copa se enche de folhas prateadas, surgem flores e azeitonas.
 */

type Pt = { x: number; y: number }
type Branch = { d: string; p: [Pt, Pt, Pt, Pt]; w: number; leaves: number; order: number }

// tronco: duas tiras retorcidas que se separam em galhos (típico da oliveira)
const TRUNK =
  'M-36 73 C-23 69 -15 61 -16 49 C-17 37 -8 29 -10 17 C-11 7 -16 -5 -24 -20 L-16 -26 C-10 -18 -4 -10 0 -3 C4 -11 9 -20 17 -31 L25 -25 C16 -14 10 -3 9 7 C8 19 18 29 16 43 C14 57 21 67 36 73 C22 75 10 71 1 72 C-10 73 -23 76 -36 73 Z'
// fenda escura e veios que dão o aspecto retorcido
const TRUNK_HOLLOW = 'M-3 62 C1 50 -5 40 -1 27 C3 36 7 47 5 60 Z'
const TRUNK_LIGHT = ['M-12 64 C-9 52 -13 42 -8 29 C-5 20 -8 12 -9 4', 'M10 60 C8 52 12 44 10 36']
const TRUNK_DARK = ['M4 22 C7 14 6 6 4 -2', 'M-20 70 C-14 66 -11 60 -12 54']

const BRANCHES: Omit<Branch, 'd'>[] = [
  { p: [{ x: -15, y: -14 }, { x: -40, y: -30 }, { x: -52, y: -50 }, { x: -86, y: -50 }], w: 9, leaves: 16, order: 0 },
  { p: [{ x: -15, y: -14 }, { x: -24, y: -48 }, { x: -42, y: -62 }, { x: -44, y: -92 }], w: 9, leaves: 15, order: 1 },
  { p: [{ x: 0, y: 2 }, { x: -4, y: -34 }, { x: 8, y: -58 }, { x: 2, y: -104 }], w: 7.5, leaves: 17, order: 2 },
  { p: [{ x: 15, y: -18 }, { x: 28, y: -48 }, { x: 44, y: -60 }, { x: 48, y: -92 }], w: 9, leaves: 15, order: 3 },
  { p: [{ x: 15, y: -18 }, { x: 44, y: -32 }, { x: 58, y: -48 }, { x: 90, y: -46 }], w: 9, leaves: 16, order: 4 },
  { p: [{ x: -54, y: -48 }, { x: -60, y: -62 }, { x: -70, y: -68 }, { x: -76, y: -84 }], w: 3.2, leaves: 10, order: 1 },
  { p: [{ x: 52, y: -44 }, { x: 62, y: -58 }, { x: 70, y: -62 }, { x: 82, y: -76 }], w: 3.2, leaves: 10, order: 3 },
  { p: [{ x: 3, y: -56 }, { x: -12, y: -70 }, { x: -16, y: -88 }, { x: -26, y: -108 }], w: 3.2, leaves: 10, order: 2 },
  { p: [{ x: 4, y: -46 }, { x: 18, y: -64 }, { x: 22, y: -84 }, { x: 26, y: -110 }], w: 3.2, leaves: 10, order: 2 },
  { p: [{ x: -34, y: -40 }, { x: -40, y: -56 }, { x: -30, y: -66 }, { x: -32, y: -80 }], w: 2.6, leaves: 7, order: 1 },
  { p: [{ x: 32, y: -40 }, { x: 40, y: -52 }, { x: 34, y: -66 }, { x: 36, y: -78 }], w: 2.6, leaves: 7, order: 3 },
].map((b) => ({ ...b, p: b.p as [Pt, Pt, Pt, Pt] }))

const CANOPY = [
  { cx: -58, cy: -54, rx: 34, ry: 22 },
  { cx: -30, cy: -82, rx: 34, ry: 26 },
  { cx: 2, cy: -92, rx: 34, ry: 26 },
  { cx: 36, cy: -80, rx: 34, ry: 26 },
  { cx: 62, cy: -52, rx: 32, ry: 21 },
  { cx: 0, cy: -60, rx: 50, ry: 30 },
]

// folha de oliveira: longa e estreita
const LEAF = 'M0 0 C3 -2.4 12 -3 19 0 C12 3 3 2.4 0 0 Z'

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const cubic = ([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}
const cubicAngle = ([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number) => {
  const u = 1 - t
  const dx = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x)
  const dy = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/** galho afinando da base à ponta, como polígono preenchido */
function taperedPath(p: [Pt, Pt, Pt, Pt], w0: number, w1: number) {
  const n = 18
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const pt = cubic(p, t)
    const a = (cubicAngle(p, t) * Math.PI) / 180
    const w = (w0 * (1 - t) + w1 * t) / 2
    const nx = -Math.sin(a)
    const ny = Math.cos(a)
    left.push({ x: pt.x + nx * w, y: pt.y + ny * w })
    right.push({ x: pt.x - nx * w, y: pt.y - ny * w })
  }
  const f = (q: Pt) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`
  return `M${left.map(f).join(' L')} L${right.reverse().map(f).join(' L')} Z`
}

function buildTree() {
  const r = rng(11)
  const leaves: { x: number; y: number; a: number; s: number; tone: number; delay: number; seed: boolean }[] = []
  const olives: { x: number; y: number; tone: number; delay: number }[] = []
  const blossoms: { x: number; y: number; delay: number }[] = []

  BRANCHES.forEach((b) => {
    for (let k = 0; k < b.leaves; k++) {
      const t = 0.18 + (k / b.leaves) * 0.82 + r() * 0.03
      const pt = cubic(b.p, Math.min(t, 1))
      const base = cubicAngle(b.p, Math.min(t, 1))
      const side = k % 2 === 0 ? 1 : -1
      leaves.push({
        x: pt.x,
        y: pt.y,
        a: base + side * (28 + r() * 32),
        s: 0.75 + r() * 0.5,
        tone: Math.floor(r() * 4),
        delay: 120 + b.order * 70 + t * 520 + r() * 160,
        seed: k % 3 === 1,
      })
      // folha na ponta do galho
      if (k === b.leaves - 1) {
        const tip = cubic(b.p, 1)
        leaves.push({ x: tip.x, y: tip.y, a: cubicAngle(b.p, 1), s: 0.9, tone: 1, delay: 140 + b.order * 70 + 560, seed: true })
      }
      if (t > 0.45 && r() > 0.72) {
        olives.push({ x: pt.x + side * 2, y: pt.y + 4.5, tone: r() > 0.45 ? 0 : 1, delay: 900 + r() * 450 })
      }
      if (t > 0.35 && r() > 0.83) {
        blossoms.push({ x: pt.x - side * 3, y: pt.y - 3, delay: 650 + r() * 450 })
      }
    }
  })
  // folhagem extra dentro da copa, para ela ficar cheia
  CANOPY.forEach((c, ci) => {
    for (let k = 0; k < 9; k++) {
      const ang = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 0.85
      const x = c.cx + Math.cos(ang) * c.rx * rad
      const y = c.cy + Math.sin(ang) * c.ry * rad
      const out = (Math.atan2(y - c.cy, x - c.cx) * 180) / Math.PI
      leaves.push({ x, y, a: out + (r() - 0.5) * 70, s: 0.7 + r() * 0.45, tone: Math.floor(r() * 4), delay: 300 + ci * 60 + rad * 500 + r() * 200, seed: false })
    }
  })
  return {
    branches: BRANCHES.map((b) => ({
      ...b,
      d: taperedPath(b.p, b.w, b.w > 4 ? 1.4 : 0.9),
    })) as Branch[],
    leaves,
    olives,
    blossoms,
  }
}

type Props = {
  open: boolean
  compact: boolean
  onOpen: () => void
}

export function SecretOlive({ open, compact, onOpen }: Props) {
  const tree = useMemo(buildTree, [])
  const gid = `bark-${useId().replace(/:/g, '')}`

  return (
    <button
      type="button"
      className={`secret olive ${open ? 'is-open' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onOpen}
      disabled={open}
      aria-label="Tocar na oliveira para descobrir o segredo"
    >
      <span className="secret__glow" />
      <svg viewBox="-112 -132 224 214" className="secret__svg" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--bark-light)" />
            <stop offset="0.45" stopColor="var(--bark)" />
            <stop offset="1" stopColor="var(--bark-dark)" />
          </linearGradient>
        </defs>
        <ellipse className="olive__shadow" cx="0" cy="73" rx="52" ry="6" />

        <g className="olive__canopy">
          {CANOPY.map((c, i) => (
            <ellipse key={i} {...c} style={{ ['--d' as string]: `${80 + i * 60}ms` }} />
          ))}
        </g>

        <g className="olive__wood">
          {tree.branches.map((b, i) => (
            <path
              key={i}
              className="olive__branch"
              d={b.d}
              style={{
                ['--d' as string]: `${(b.w > 4 ? 0 : 0.4) + b.order * 0.08}s`,
                transformOrigin: `${b.p[0].x}px ${b.p[0].y}px`,
              }}
            />
          ))}
          <g className="olive__trunk">
            <path d={TRUNK} fill={`url(#${gid})`} />
            <path className="olive__hollow" d={TRUNK_HOLLOW} />
            {TRUNK_LIGHT.map((d, i) => (
              <path key={`l${i}`} className="olive__grain" d={d} />
            ))}
            {TRUNK_DARK.map((d, i) => (
              <path key={`d${i}`} className="olive__grain olive__grain--dark" d={d} />
            ))}
          </g>
        </g>

        <g className="olive__crown">
          {tree.leaves.map((l, i) => (
            <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.a.toFixed(1)}) scale(${l.s.toFixed(2)})`}>
              <path
                className={`olive__leaf olive__leaf--${l.tone} ${l.seed ? 'is-seed' : ''}`}
                d={LEAF}
                style={{ ['--d' as string]: `${Math.round(l.delay)}ms`, ['--sd' as string]: `${(1.2 + (i % 9) * 0.05).toFixed(2)}s` }}
              />
            </g>
          ))}
          {tree.blossoms.map((b, i) => (
            <g key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
              <g className="olive__blossom" style={{ ['--d' as string]: `${Math.round(b.delay)}ms` }}>
                <circle cx="-1.6" cy="0" r="1.3" />
                <circle cx="1.6" cy="0" r="1.3" />
                <circle cx="0" cy="-1.6" r="1.3" />
                <circle cx="0" cy="1.6" r="1.3" />
                <circle className="olive__blossom-c" r="0.9" />
              </g>
            </g>
          ))}
          {tree.olives.map((o, i) => (
            <g key={`o${i}`} transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})`}>
              <ellipse
                className={`olive__fruit olive__fruit--${o.tone}`}
                rx="2.6"
                ry="3.4"
                style={{ ['--d' as string]: `${Math.round(o.delay)}ms` }}
              />
            </g>
          ))}
        </g>

        <g className="secret__pollen" transform="translate(0 -60)">
          {Array.from({ length: 18 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 18 + (i % 2) * 0.2
            const dist = 80 + (i % 4) * 16
            return (
              <circle
                key={i}
                r={i % 3 === 0 ? 2 : 1.4}
                style={{
                  ['--x' as string]: `${(Math.cos(a) * dist).toFixed(1)}px`,
                  ['--y' as string]: `${(Math.sin(a) * dist).toFixed(1)}px`,
                  ['--d' as string]: `${500 + (i % 5) * 40}ms`,
                }}
              />
            )
          })}
        </g>
      </svg>
    </button>
  )
}
