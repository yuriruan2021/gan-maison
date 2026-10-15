import { useEffect, useState, type FormEvent } from 'react'
import { gerarVoucher, statusVouchers, type Voucher } from '../api'
import { config } from '../config'
import { formatarTelefone, normalizarTelefone, telefoneValido } from '../telefone'
import { ArrowIcon, InstagramIcon, LockIcon, UserIcon, WhatsAppIcon } from './Icons'

/** 'Você encontrou o {segredo} do nosso jardim.' → texto com <em> na parte entre chaves */
function withEmphasis(text: string) {
  return text.split(/(\{[^}]+\})/).map((part, i) =>
    part.startsWith('{') ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>,
  )
}

/**
 * Passos do card:
 *  form     → nome + WhatsApp
 *  codigo   → o voucher GAN-XXXXXX e o botão do WhatsApp
 *  resgatado → o telefone já tem cupom: só o botão para falar no WhatsApp
 *  esgotado → os vouchers acabaram
 */
type Step = { kind: 'form' } | { kind: 'codigo'; voucher: Voucher } | { kind: 'resgatado' } | { kind: 'esgotado' }

// o código fica guardado no aparelho: quem volta à página vê o presente direto
const STORED = 'gan-voucher'

function readStored(): Voucher | null {
  try {
    const v = JSON.parse(localStorage.getItem(STORED) ?? 'null')
    return v?.codigo ? v : null
  } catch {
    return null
  }
}

function store(v: Voucher) {
  try {
    localStorage.setItem(STORED, JSON.stringify(v))
  } catch {
    /* sem storage: o código aparece agora e segue no banco */
  }
}

const firstName = (nome: string) => nome.trim().split(/\s+/)[0].replace(/[{}]/g, '')

export function GiftCard({ visible }: { visible: boolean }) {
  const { gift } = config
  const [step, setStep] = useState<Step>(() => {
    const v = readStored()
    return v ? { kind: 'codigo', voucher: v } : { kind: 'form' }
  })
  // o passo trocou depois que o card já estava na tela: anima a entrada do novo conteúdo
  const [swapped, setSwapped] = useState(false)

  // descobre se acabou enquanto o jardim cresce (e já acorda o banco)
  useEffect(() => {
    if (step.kind !== 'form') return
    let alive = true
    statusVouchers().then(
      (s) => {
        if (alive && s.esgotado) setStep((cur) => (cur.kind === 'form' ? { kind: 'esgotado' } : cur))
      },
      () => {}, // sem resposta: mostra o formulário e o erro aparece no envio
    )
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (next: Step) => {
    if (next.kind === 'codigo') store(next.voucher)
    setSwapped(true)
    setStep(next)
  }

  const tab = visible ? 0 : -1

  return (
    <section className={`gift ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <p className="gift__eyebrow">{gift.eyebrow}</p>
      <h1 className="gift__title">{withEmphasis(gift.title)}</h1>
      <p className="gift__subtitle">{gift.subtitle}</p>

      {(step.kind === 'form' || step.kind === 'codigo') && (
        <div className="gift__discount" aria-label={`${gift.discount} ${gift.discountLabel}, ${gift.discountCaption}`}>
          <div className="gift__amount" aria-hidden>
            <strong>{gift.discount}</strong>
            <span>{gift.discountLabel}</span>
          </div>
          <p className="gift__caption" aria-hidden>
            {gift.discountCaption}
          </p>
        </div>
      )}

      <div key={step.kind} className={`gift__step ${swapped ? 'is-swap' : ''}`}>
        {step.kind === 'form' && <VoucherForm tab={tab} onDone={go} />}
        {step.kind === 'codigo' && <VoucherCode voucher={step.voucher} tab={tab} />}
        {step.kind === 'resgatado' && <AlreadyClaimed tab={tab} />}
        {step.kind === 'esgotado' && <SoldOut tab={tab} />}
      </div>
    </section>
  )
}

function VoucherForm({ tab, onDone }: { tab: number; onDone: (s: Step) => void }) {
  const { form } = config.gift
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<{ field?: 'nome' | 'telefone'; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (nome.trim().length < 2) return setError({ field: 'nome', text: form.errors.nome })
    if (!telefoneValido(telefone)) return setError({ field: 'telefone', text: form.errors.telefone })

    setError(null)
    setSending(true)
    try {
      const r = await gerarVoucher(nome.trim(), normalizarTelefone(telefone))
      if (r.status === 'ok') onDone({ kind: 'codigo', voucher: { codigo: r.codigo, nome: r.nome } })
      else if (r.status === 'ja_cadastrado') onDone({ kind: 'resgatado' })
      else if (r.status === 'esgotado') onDone({ kind: 'esgotado' })
      else if (r.status === 'invalido') setError({ field: r.campo, text: form.errors[r.campo] })
      else throw new Error(`Resposta inesperada do banco: ${JSON.stringify(r)}`)
    } catch (err) {
      console.error(err)
      setError({ text: form.errors.falha })
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="gift__form" onSubmit={submit} noValidate>
      <div className="gift__locked" aria-hidden>
        <LockIcon />
        <span>{form.lockedCode}</span>
      </div>
      <p className="gift__prompt">{form.prompt}</p>
      <label className="gift__field">
        <span className="sr-only">{form.nameLabel}</span>
        <span className="gift__field-icon">
          <UserIcon />
        </span>
        <input
          className="gift__input"
          name="nome"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={80}
          placeholder={form.nameLabel}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-invalid={error?.field === 'nome'}
          tabIndex={tab}
        />
      </label>
      <label className="gift__field">
        <span className="sr-only">{form.phoneLabel}</span>
        <span className="gift__field-icon">
          <WhatsAppIcon size={18} />
        </span>
        <input
          className="gift__input"
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="go"
          placeholder={form.phoneLabel}
          value={telefone}
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          aria-invalid={error?.field === 'telefone'}
          tabIndex={tab}
        />
      </label>
      {error && (
        <p className="gift__error" role="alert">
          {error.text}
        </p>
      )}
      <button type="submit" className="gift__cta" disabled={sending} tabIndex={tab}>
        <span>{sending ? form.sending : form.submit}</span>
        <span className="gift__cta-arrow">
          <ArrowIcon />
        </span>
      </button>
      <p className="gift__footnote">{form.privacy}</p>
    </form>
  )
}

function VoucherCode({ voucher, tab }: { voucher: Voucher; tab: number }) {
  const { gift } = config
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard indisponível: o código continua visível para copiar à mão */
    }
  }

  return (
    <>
      <p className="gift__body">{withEmphasis(gift.body.replace('{nome}', `{${firstName(voucher.nome)}}`))}</p>
      <button type="button" className="gift__coupon" onClick={copy} tabIndex={tab}>
        <span>{voucher.codigo}</span>
        <small>{copied ? 'Copiado' : gift.couponHint}</small>
      </button>
      <a className="gift__cta" href={config.whatsappVoucherUrl(voucher.nome, voucher.codigo)} target="_blank" rel="noreferrer" tabIndex={tab}>
        <span className="gift__cta-icon">
          <WhatsAppIcon size={18} />
        </span>
        <span>{gift.cta}</span>
        <span className="gift__cta-arrow">
          <ArrowIcon />
        </span>
      </a>
      <p className="gift__footnote">{gift.footnote}</p>
    </>
  )
}

function AlreadyClaimed({ tab }: { tab: number }) {
  const { claimed } = config.gift
  return (
    <>
      <p className="gift__body gift__body--notice">{claimed.body}</p>
      <a className="gift__cta" href={config.whatsappClaimedUrl} target="_blank" rel="noreferrer" tabIndex={tab}>
        <span className="gift__cta-icon">
          <WhatsAppIcon size={18} />
        </span>
        <span>{claimed.cta}</span>
        <span className="gift__cta-arrow">
          <ArrowIcon />
        </span>
      </a>
      <p className="gift__footnote">{claimed.footnote}</p>
    </>
  )
}

function SoldOut({ tab }: { tab: number }) {
  const { soldOut } = config.gift
  return (
    <>
      <p className="gift__body gift__body--soldout">{soldOut.body}</p>
      <a className="gift__cta" href={config.instagramUrl} target="_blank" rel="noreferrer" tabIndex={tab}>
        <span className="gift__cta-icon">
          <InstagramIcon size={18} />
        </span>
        <span>{soldOut.cta}</span>
        <span className="gift__cta-arrow">
          <ArrowIcon />
        </span>
      </a>
      <p className="gift__footnote">{soldOut.footnote}</p>
    </>
  )
}
