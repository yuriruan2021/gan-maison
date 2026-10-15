import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ApiError,
  entrar,
  lerSessao,
  listarVouchers,
  marcarUso,
  sair,
  statusVouchers,
  temAcessoRecepcao,
  type RegistroVoucher,
} from '../api'
import { Logo } from '../components/Logo'
import { formatarTelefone, soDigitos } from '../telefone'
import './recepcao.css'

/** Área da recepção: login e lista dos vouchers gerados, com o "usado" marcado na hora do resgate. */
export default function Recepcao() {
  const [logged, setLogged] = useState(() => !!lerSessao())

  useEffect(() => {
    document.documentElement.classList.add('is-recepcao')
    document.title = 'Recepção · Gan Maison'
  }, [])

  return logged ? <Panel onLogout={() => setLogged(false)} /> : <Login onLogin={() => setLogged(true)} />
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!usuario.trim() || !senha) return setError('Preencha usuário e senha.')
    setSending(true)
    setError(null)
    try {
      await entrar(usuario, senha)
      onLogin()
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      setError(
        status === 400 || status === 401
          ? 'Usuário ou senha incorretos.'
          : status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : 'Não foi possível entrar agora. Confira a internet e tente de novo.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="rc rc--login">
      <form className="rc-card rc-login" onSubmit={submit} noValidate>
        <Logo className="rc-login__logo" />
        <p className="rc-eyebrow">Recepção</p>
        <h1 className="rc-title">Presentes do jardim</h1>
        <label className="rc-field">
          <span>Usuário</span>
          <input autoComplete="username" autoCapitalize="none" spellCheck={false} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label className="rc-field">
          <span>Senha</span>
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {error && (
          <p className="rc-error" role="alert">
            {error}
          </p>
        )}
        <button className="rc-btn rc-btn--primary" disabled={sending}>
          {sending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

type Filter = 'todos' | 'disponiveis' | 'usados'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
const formatDate = (iso: string) => dateFmt.format(new Date(iso))

/** minúsculas e sem acento, para a busca achar "joao" em "João" */
const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function Panel({ onLogout }: { onLogout: () => void }) {
  const [list, setList] = useState<RegistroVoucher[] | null>(null)
  const [limit, setLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [busy, setBusy] = useState<number | null>(null)

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return onLogout()
      console.error(err)
      setError('Não foi possível falar com o servidor. Confira a internet e toque em Atualizar.')
    },
    [onLogout],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, status, allowed] = await Promise.all([listarVouchers(), statusVouchers(), temAcessoRecepcao()])
      setList(rows)
      setLimit(status.limite)
      setError(
        allowed
          ? null
          : `A conta ${lerSessao()?.email ?? ''} entrou, mas não tem acesso à lista. Cadastre esse e-mail na tabela recepcao_usuarios do Supabase.`,
      )
    } catch (err) {
      handle(err)
    } finally {
      setLoading(false)
    }
  }, [handle])

  // carrega ao abrir e sempre que a aba volta a ficar visível
  useEffect(() => {
    load()
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const toggle = async (v: RegistroVoucher) => {
    const used = !v.usado_em
    if (!used && !window.confirm(`Desfazer o uso do código ${v.codigo}?`)) return
    setBusy(v.id)
    try {
      const updated = await marcarUso(v.id, used)
      setList((cur) => cur?.map((x) => (x.id === v.id ? updated : x)) ?? cur)
    } catch (err) {
      handle(err)
    } finally {
      setBusy(null)
    }
  }

  const logout = async () => {
    await sair()
    onLogout()
  }

  const total = list?.length ?? 0
  const used = list?.filter((v) => v.usado_em).length ?? 0

  const shown = useMemo(() => {
    const q = plain(query.trim())
    const digits = soDigitos(query)
    return (list ?? []).filter((v) => {
      if (filter === 'usados' && !v.usado_em) return false
      if (filter === 'disponiveis' && v.usado_em) return false
      if (!q) return true
      return plain(v.nome).includes(q) || v.codigo.toLowerCase().includes(q) || (digits.length >= 3 && v.telefone.includes(digits))
    })
  }, [list, query, filter])

  return (
    <main className="rc">
      <header className="rc-top">
        <div className="rc-top__brand">
          <Logo />
          <span className="rc-top__label">Recepção</span>
        </div>
        <div className="rc-top__actions">
          <button className="rc-btn" onClick={load} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
          <button className="rc-btn rc-btn--ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <section className="rc-stats" aria-label="Resumo">
        <div className="rc-stat">
          <strong>
            {total}
            {limit !== null && <small> / {limit}</small>}
          </strong>
          <span>gerados</span>
        </div>
        <div className="rc-stat">
          <strong>{used}</strong>
          <span>usados na loja</span>
        </div>
        <div className="rc-stat">
          <strong>{limit !== null ? Math.max(0, limit - total) : '–'}</strong>
          <span>ainda disponíveis</span>
        </div>
      </section>

      <section className="rc-card rc-list">
        <div className="rc-tools">
          <input
            className="rc-search"
            type="search"
            placeholder="Buscar por nome, código ou telefone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar"
          />
          <div className="rc-filter" role="group" aria-label="Filtrar">
            {(
              [
                ['todos', 'Todos'],
                ['disponiveis', 'A usar'],
                ['usados', 'Usados'],
              ] as const
            ).map(([key, label]) => (
              <button key={key} className={filter === key ? 'is-on' : ''} onClick={() => setFilter(key)} aria-pressed={filter === key}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rc-error" role="alert">
            {error}
          </p>
        )}

        {list === null ? (
          <p className="rc-empty">{loading ? 'Carregando…' : ''}</p>
        ) : shown.length === 0 ? (
          <p className="rc-empty">{total === 0 ? 'Nenhum voucher gerado ainda.' : 'Nada encontrado.'}</p>
        ) : (
          <ul className="rc-rows">
            {shown.map((v) => (
              <li key={v.id} className={`rc-row ${v.usado_em ? 'is-used' : ''}`}>
                <div className="rc-row__code">{v.codigo}</div>
                <div className="rc-row__who">
                  <strong>{v.nome}</strong>
                  <a href={`https://api.whatsapp.com/send?phone=55${v.telefone}`} target="_blank" rel="noreferrer">
                    {formatarTelefone(v.telefone)}
                  </a>
                </div>
                <div className="rc-row__dates">
                  <span>Gerado em {formatDate(v.criado_em)}</span>
                  {v.usado_em && <span className="rc-row__used">Usado em {formatDate(v.usado_em)}</span>}
                </div>
                <button
                  className={`rc-btn ${v.usado_em ? 'rc-btn--ghost' : 'rc-btn--primary'}`}
                  onClick={() => toggle(v)}
                  disabled={busy === v.id}
                >
                  {busy === v.id ? '…' : v.usado_em ? 'Desfazer' : 'Marcar como usado'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
