import { useMemo } from 'react'

/** Pétalas que sobem e flutuam depois que a flor abre. */
export function FloatingPetals({ active }: { active: boolean }) {
  const petals = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: 8 + Math.random() * 84,
        delay: Math.random() * 1.6,
        dur: 4.5 + Math.random() * 4,
        size: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
        tone: i % 3,
      })),
    [],
  )

  if (!active) return null

  return (
    <div className="petals" aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className={`petal petal--${p.tone}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--drift' as string]: `${p.drift}px`,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}
