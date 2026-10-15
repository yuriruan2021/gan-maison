import { useMemo } from 'react'
import { Logo } from './Logo'

/**
 * Loading: um broto nasce, abre duas folhas e o "gan" surge logo abaixo.
 * Na saída, folhas de oliveira surgem espalhadas pela tela inteira e uma folha maior
 * aparece no centro. Essa folha vira uma janela que dá zoom até revelar o site,
 * enquanto as outras voam do centro para fora.
 */

const LEAF = 'M0 18 C 22 -2, 70 -4, 100 18 C 70 40, 22 38, 0 18 Z'
const RIB = 'M3 18 C 35 16, 70 16, 97 18'

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Folhas espalhadas pela tela inteira (grade com variação), cada uma separada das outras. */
function useLeaves() {
  return useMemo(() => {
    const r = rng(17)
    const cols = 5
    const rows = 7
    const leaves: { x: number; y: number; rot: number; spin: number; dx: number; dy: number; inD: number; outD: number; tone: number; size: number }[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = ((col + 0.5) / cols) * 100 + (r() - 0.5) * (70 / cols)
        const y = ((row + 0.5) / rows) * 100 + (r() - 0.5) * (70 / rows)
        const vx = x - 50
        const vy = y - 50
        const len = Math.hypot(vx, vy) || 1
        if (Math.abs(vx) < 22 && Math.abs(vy) < 13) continue // espaço da folha principal
        leaves.push({
          x,
          y,
          rot: r() * 360,
          spin: (r() > 0.5 ? 1 : -1) * (40 + r() * 80),
          dx: vx / len,
          dy: vy / len,
          inD: Math.round(r() * 260),
          outD: Math.round(760 + (len / 70) * 380), // saem junto com a janela; as do meio primeiro
          tone: Math.floor(r() * 4),
          size: 0.8 + r() * 0.45,
        })
      }
    }
    return leaves
  }, [])
}

export function Loader({ leaving }: { leaving: boolean }) {
  const leaves = useLeaves()
  return (
    <>
      <div className={`loader ${leaving ? 'is-leaving' : ''}`} aria-hidden>
        <div className="loader__inner">
          <svg className="sprout" viewBox="0 0 80 90">
            <path className="sprout__stem" pathLength={1} d="M40 88 C 40 70, 38 55, 41 30" />
            <g transform="translate(40.4 52) rotate(-32)">
              <path className="sprout__leaf sprout__leaf--l" d="M0 0 C -6 -8, -20 -10, -28 -4 C -20 4, -8 4, 0 0 Z" />
            </g>
            <g transform="translate(40.6 42) rotate(28)">
              <path className="sprout__leaf sprout__leaf--r" d="M0 0 C 6 -8, 20 -10, 28 -4 C 20 4, 8 4, 0 0 Z" />
            </g>
            <circle className="sprout__seed" cx="41" cy="28" r="3.2" />
          </svg>
          <Logo animated className="loader__logo" />
          <span className="loader__maison">maison</span>
          <span className="loader__line" />
        </div>

        {/* folha principal: vira a janela que revela o site (mesmo desenho da máscara no CSS) */}
        <svg className="loader__hero-leaf" viewBox="0 0 100 100">
          <g transform="translate(50 50) rotate(-35)">
            <path d="M-48 0 C-30 -17 22 -19 48 0 C22 19 -30 17 -48 0 Z" className="loader__hero-blade" />
            <path d="M-46 0 C-12 -1.5 20 -1.5 46 0" className="loader__hero-rib" />
          </g>
        </svg>
      </div>

      {/* folhas que abrem do centro para fora (fora da máscara do loader) */}
      <div className={`leafburst ${leaving ? 'is-on' : ''}`} aria-hidden>
        {leaves.map((l, i) => (
          <span
            key={i}
            className="burst-leaf"
            style={{
              left: `${l.x.toFixed(1)}%`,
              top: `${l.y.toFixed(1)}%`,
              ['--dx' as string]: l.dx.toFixed(3),
              ['--dy' as string]: l.dy.toFixed(3),
              ['--out-d' as string]: `${l.outD}ms`,
            }}
          >
            <svg
              className={`burst-leaf__svg burst-leaf--${l.tone}`}
              viewBox="0 0 100 36"
              style={{
                ['--rot' as string]: `${l.rot.toFixed(0)}deg`,
                ['--spin' as string]: `${l.spin.toFixed(0)}deg`,
                ['--size' as string]: l.size.toFixed(2),
                ['--in-d' as string]: `${l.inD}ms`,
                ['--out-d' as string]: `${l.outD}ms`,
              }}
            >
              <path className="burst-leaf__blade" d={LEAF} />
              <path className="burst-leaf__rib" d={RIB} />
            </svg>
          </span>
        ))}
      </div>
    </>
  )
}
