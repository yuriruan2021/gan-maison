import { useEffect, useState } from 'react'
import { config } from '../config'

/**
 * Foto do jardim ao fundo, tratada como peça da marca (vale para qualquer foto em config.backgroundPhoto):
 *  1. Duotone: a foto é recolorida só com as cores da Gan (verde-escuro → sálvia → creme), no navegador.
 *  2. Profundidade: duas camadas da mesma foto — bem desfocada no alto, mais nítida perto do prado.
 *  3. Movimento: um zoom lento e quase imperceptível (para quando o movimento reduzido está ligado).
 */

// paleta do duotone: sombras → meios-tons → luzes
const STOPS: [number, [number, number, number]][] = [
  [0, [0x2f, 0x4a, 0x36]], // --green-800
  [0.55, [0xa7, 0xb2, 0x8a]], // --sage
  [1, [0xf5, 0xf3, 0xea]], // --paper-2
]

function colorAt(t: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i]
    const [p0, c0] = STOPS[i - 1]
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0)
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k]
    }
  }
  return STOPS[STOPS.length - 1][1]
}

async function toDuotone(src: string): Promise<string> {
  const img = new Image()
  img.src = src
  await img.decode()
  const max = 1200 // basta: a foto fica desfocada
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const px = data.data
  // tabela pronta (256 tons) para ficar rápido
  const lut = Array.from({ length: 256 }, (_, i) => colorAt(i / 255))
  for (let i = 0; i < px.length; i += 4) {
    const l = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2])
    // contraste suave: abre as luzes, preserva as sombras
    const t = Math.min(255, Math.round(255 * Math.pow(l / 255, 0.85)))
    const c = lut[t]
    px[i] = c[0]
    px[i + 1] = c[1]
    px[i + 2] = c[2]
  }
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function PhotoBackdrop() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    toDuotone(config.backgroundPhoto)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(config.backgroundPhoto)) // se algo falhar, usa a foto original
    return () => {
      alive = false
    }
  }, [])

  const style = url ? { backgroundImage: `url("${url}")` } : undefined

  return (
    <div className={`photo ${url ? 'is-ready' : ''}`} aria-hidden>
      <div className="photo__drift">
        <div className="photo__layer photo__layer--far" style={style} />
        <div className="photo__layer photo__layer--near" style={style} />
      </div>
    </div>
  )
}
