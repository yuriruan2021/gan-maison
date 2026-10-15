import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'

/**
 * Jardim procedural em SVG: hastes crescem do chão, folhas se abrem
 * e as hastes terminam em flores que desabrocham.
 *
 * Para nenhuma flor aparecer cortada:
 *  - a altura das hastes é limitada (a flor sempre cabe no topo do canteiro);
 *  - cada canteiro nunca é mais largo que a proporção do desenho (sem corte em cima);
 *  - só nascem flores dentro da faixa visível de cada canteiro (nas bordas ficam só hastes e folhas).
 */

const W = 420
const H = 280
const ASPECT = W / H

type Pt = { x: number; y: number }
type Leaf = { x: number; y: number; angle: number; size: number; delay: number; tone: number }
type Stem = {
  d: string
  delay: number
  dur: number
  width: number
  tip: Pt
  tipAngle: number
  leaves: Leaf[]
  top: 'flower' | 'bud' | 'none'
  flowerSize: number
  tone: number
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const qPoint = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
})
const qAngle = (p0: Pt, p1: Pt, p2: Pt, t: number) => {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

type Band = [number, number]

function makeStem(r: () => number, x0: number, h: number, lean: number, band: Band, opts: { flowerChance: number; small?: boolean }): Stem {
  const p0 = { x: x0, y: H + 4 }
  const p1 = { x: x0 + lean * 0.2, y: H - h * 0.55 }
  const p2 = { x: x0 + lean, y: H - h }
  const delay = (opts.small ? 0.6 : 0.15) + r() * 0.9
  const dur = (opts.small ? 0.9 : 1.3) + r() * 0.8
  const leaves: Leaf[] = []
  const nLeaves = opts.small ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3)
  for (let k = 0; k < nLeaves; k++) {
    const t = 0.25 + (k / nLeaves) * 0.6 + r() * 0.06
    const pt = qPoint(p0, p1, p2, t)
    const side = k % 2 === 0 ? 1 : -1
    leaves.push({
      ...pt,
      angle: qAngle(p0, p1, p2, t) + side * (48 + r() * 18),
      size: (opts.small ? 0.5 : 0.7) + r() * 0.5 - t * 0.2,
      delay: delay + dur * t,
      tone: Math.floor(r() * 3),
    })
  }
  const roll = r()
  const inBand = p2.x >= band[0] && p2.x <= band[1]
  const top: Stem['top'] = !inBand ? 'none' : roll < opts.flowerChance ? 'flower' : 'bud'
  return {
    d: `M${p0.x.toFixed(1)} ${p0.y} Q${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    delay,
    dur,
    width: opts.small ? 1.2 + r() * 0.6 : 1.6 + r() * 1.2,
    tip: p2,
    tipAngle: qAngle(p0, p1, p2, 1) + 90,
    leaves,
    top,
    flowerSize: opts.small ? 0.5 + r() * 0.3 : 0.75 + r() * 0.5,
    tone: Math.floor(r() * 4),
  }
}

function buildGarden(seed: number, band: Band): { back: Stem[]; front: Stem[] } {
  const r = rng(seed)
  const back: Stem[] = []
  const count = 17
  for (let i = 0; i < count; i++) {
    const x0 = (W / (count - 1)) * i + (r() - 0.5) * 18
    // mais altas nas laterais, mais baixas no centro (deixa espaço para o card)
    const edge = Math.abs(i / (count - 1) - 0.5) * 2 // 0 centro → 1 borda
    const h = 60 + edge * 140 + r() * 40 // máx. 240: a flor sempre cabe dentro do desenho
    const lean = (x0 < W / 2 ? 1 : -1) * (6 + r() * 20) * (r() > 0.25 ? 1 : -1)
    back.push(makeStem(r, x0, h, lean, band, { flowerChance: 0.78 }))
  }
  // flores baixas na frente, preenchendo sem poluir
  const front: Stem[] = []
  const nFront = 9
  for (let i = 0; i < nFront; i++) {
    const x0 = band[0] + ((band[1] - band[0]) / (nFront - 1)) * i + (r() - 0.5) * 14
    const h = 34 + r() * 46
    const lean = (r() - 0.5) * 16
    front.push(makeStem(r, x0, h, lean, band, { flowerChance: 0.85, small: true }))
  }
  return { back, front }
}

function buildGrass(seed = 3) {
  const r = rng(seed)
  return Array.from({ length: 46 }, (_, i) => {
    const x = (W / 45) * i + (r() - 0.5) * 8
    const h = 14 + r() * 26
    const bend = (r() - 0.5) * 14
    return {
      d: `M${x.toFixed(1)} ${H + 2} Q${(x + bend * 0.3).toFixed(1)} ${(H - h * 0.6).toFixed(1)} ${(x + bend).toFixed(1)} ${(H - h).toFixed(1)}`,
      delay: r() * 0.6,
    }
  })
}

const LEAF = 'M0 0 C 5 -7, 17 -8, 24 -2 C 17 5, 6 5, 0 0 Z'

function Flower({ size, tone }: { size: number; tone: number }) {
  const petals = 6
  return (
    <g transform={`scale(${size})`}>
      {Array.from({ length: petals }, (_, i) => (
        <ellipse
          key={i}
          className={`g-petal g-petal--${tone}`}
          cx="0"
          cy="-7"
          rx="4.2"
          ry="7.5"
          transform={`rotate(${(360 / petals) * i})`}
        />
      ))}
      <circle r="3.4" className="g-center" />
    </g>
  )
}

/** Mede o canteiro: quantos desenhos lado a lado e qual faixa de cada um fica visível. */
function useLayout(ref: RefObject<HTMLDivElement | null>) {
  const [layout, setLayout] = useState({ tiles: 1, band: [60, W - 60] as Band })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight || 1
      // cada canteiro no máximo na proporção do desenho → nunca corta o topo das flores
      const tiles = Math.min(4, Math.max(1, Math.ceil(w / (h * ASPECT) - 0.05)))
      const tileAspect = w / tiles / h
      const visible = Math.min(W, H * tileAspect) // largura visível em unidades do desenho
      const margin = (W - visible) / 2
      const pad = 22 // raio da maior flor
      setLayout({ tiles, band: [margin + pad, W - margin - pad] })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return layout
}

function StemView({ s }: { s: Stem }) {
  return (
    <g>
      <path
        className="g-stem"
        pathLength={1}
        d={s.d}
        strokeWidth={s.width}
        style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
      />
      {s.leaves.map((l, k) => (
        <g key={k} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.angle.toFixed(1)}) scale(${l.size.toFixed(2)})`}>
          <path className={`g-leaf g-leaf--${l.tone}`} d={LEAF} style={{ animationDelay: `${l.delay.toFixed(2)}s` }} />
        </g>
      ))}
      {s.top !== 'none' && (
        <g transform={`translate(${s.tip.x.toFixed(1)} ${s.tip.y.toFixed(1)}) rotate(${s.tipAngle.toFixed(1)})`}>
          <g className="g-bloom" style={{ animationDelay: `${(s.delay + s.dur * 0.92).toFixed(2)}s` }}>
            {s.top === 'flower' ? <Flower size={s.flowerSize} tone={s.tone} /> : <ellipse className="g-bud" cx="0" cy="-3" rx="3" ry="5" />}
          </g>
        </g>
      )}
    </g>
  )
}

function GardenTile({ seed, band }: { seed: number; band: Band }) {
  const { back, front } = useMemo(() => buildGarden(seed, band), [seed, band[0], band[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  const grass = useMemo(() => buildGrass(seed + 11), [seed])
  const gid = `soil-${seed}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sage-light)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--sage-light)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="-2" y={H - 60} width={W + 4} height="60" fill={`url(#${gid})`} />

      {grass.map((g, i) => (
        <path key={`g${i}`} className="g-grass" pathLength={1} d={g.d} style={{ animationDelay: `${g.delay}s` }} />
      ))}
      {back.map((s, i) => (
        <StemView key={`b${i}`} s={s} />
      ))}
      {front.map((s, i) => (
        <StemView key={`f${i}`} s={s} />
      ))}
    </svg>
  )
}

const SEEDS = [7, 23, 41, 59]

export function Garden({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { tiles, band } = useLayout(ref)
  return (
    <div ref={ref} className={`garden ${active ? 'is-active' : ''}`} aria-hidden>
      {SEEDS.slice(0, tiles).map((seed) => (
        <GardenTile key={seed} seed={seed} band={band} />
      ))}
    </div>
  )
}
