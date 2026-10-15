import { useState } from 'react'
import { config } from '../config'
import { ArrowIcon, WhatsAppIcon } from './Icons'

/** 'Você encontrou o {segredo} do nosso jardim.' → texto com <em> na parte entre chaves */
function withEmphasis(text: string) {
  return text.split(/(\{[^}]+\})/).map((part, i) =>
    part.startsWith('{') ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>,
  )
}

export function GiftCard({ visible }: { visible: boolean }) {
  const { gift } = config
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!gift.couponCode) return
    try {
      await navigator.clipboard.writeText(gift.couponCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard indisponível: o código continua visível para copiar à mão */
    }
  }

  const tab = visible ? 0 : -1

  return (
    <section className={`gift ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <p className="gift__eyebrow">{gift.eyebrow}</p>
      <h1 className="gift__title">{withEmphasis(gift.title)}</h1>
      <p className="gift__subtitle">{gift.subtitle}</p>

      <div className="gift__discount" aria-label={`${gift.discount} ${gift.discountLabel}, ${gift.discountCaption}`}>
        <div className="gift__amount" aria-hidden>
          <strong>{gift.discount}</strong>
          <span>{gift.discountLabel}</span>
        </div>
        <p className="gift__caption" aria-hidden>
          {gift.discountCaption}
        </p>
      </div>

      <p className="gift__body">{gift.body}</p>

      {gift.couponCode && (
        <button type="button" className="gift__coupon" onClick={copy} tabIndex={tab}>
          <span>{gift.couponCode}</span>
          <small aria-live="polite">{copied ? 'Copiado' : 'Toque para copiar'}</small>
        </button>
      )}

      <a className="gift__cta" href={config.whatsappUrl} target="_blank" rel="noreferrer" tabIndex={tab}>
        <span className="gift__cta-icon">
          <WhatsAppIcon size={18} />
        </span>
        <span>{gift.cta}</span>
        <span className="gift__cta-arrow">
          <ArrowIcon />
        </span>
      </a>
      <p className="gift__footnote">{gift.footnote}</p>
    </section>
  )
}
