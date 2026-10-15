import { config } from './config'

/**
 * Conversa com o Supabase direto pela API REST (sem o SDK, para a página continuar leve).
 * Tabela e funções: supabase/schema.sql. Chaves: .env.local (veja .env.example).
 */

const BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  if (!BASE || !KEY) throw new ApiError(0, 'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_KEY')
  const { token, headers, ...rest } = init
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* resposta sem JSON */
  }
  if (!res.ok) {
    const e = (data ?? {}) as { msg?: string; message?: string; error_description?: string }
    throw new ApiError(res.status, e.msg ?? e.message ?? e.error_description ?? res.statusText)
  }
  return data as T
}

// ───────── Página pública ─────────

export type Voucher = { codigo: string; nome: string }

export type ResultadoVoucher =
  | ({ status: 'ok' } & Voucher)
  | { status: 'ja_cadastrado' | 'esgotado' }
  | { status: 'invalido'; campo: 'nome' | 'telefone' }

export const statusVouchers = () =>
  request<{ esgotado: boolean; limite: number }>('/rest/v1/rpc/vouchers_status', { method: 'POST', body: '{}' })

export const gerarVoucher = (nome: string, telefone: string) =>
  request<ResultadoVoucher>('/rest/v1/rpc/gerar_voucher', {
    method: 'POST',
    body: JSON.stringify({ p_nome: nome, p_telefone: telefone }),
  })

// ───────── Recepção (login) ─────────

type Sessao = { access_token: string; refresh_token: string; expires_at: number; email: string }
type RespostaAuth = { access_token: string; refresh_token: string; expires_in: number; expires_at?: number; user?: { email?: string } }

const SESSAO = 'gan-recepcao'

export function lerSessao(): Sessao | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSAO) ?? 'null')
    return s?.access_token ? s : null
  } catch {
    return null
  }
}

function salvarSessao(r: RespostaAuth): Sessao {
  const s: Sessao = {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: r.expires_at ?? Math.floor(Date.now() / 1000) + r.expires_in,
    email: r.user?.email ?? lerSessao()?.email ?? '',
  }
  try {
    localStorage.setItem(SESSAO, JSON.stringify(s))
  } catch {
    /* sem storage: a sessão vale só enquanto a aba estiver aberta */
  }
  return s
}

function limparSessao() {
  try {
    localStorage.removeItem(SESSAO)
  } catch {
    /* nada a limpar */
  }
}

/** "gan" vira gan@<domínio da recepção>; um e-mail completo passa direto. */
export async function entrar(usuario: string, senha: string) {
  const u = usuario.trim().toLowerCase()
  const email = u.includes('@') ? u : `${u}@${config.recepcao.dominio}`
  const r = await request<RespostaAuth>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password: senha }),
  })
  return salvarSessao(r)
}

export async function sair() {
  const s = lerSessao()
  limparSessao()
  if (s) await request('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {})
}

/** Token válido, renovando quando falta menos de 1 min para expirar. */
async function token() {
  const s = lerSessao()
  if (!s) throw new ApiError(401, 'Sessão encerrada')
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token
  try {
    const r = await request<RespostaAuth>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    })
    return salvarSessao(r).access_token
  } catch (e) {
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
      limparSessao()
      throw new ApiError(401, 'Sessão expirada')
    }
    throw e
  }
}

export type RegistroVoucher = {
  id: number
  codigo: string
  nome: string
  telefone: string
  criado_em: string
  usado_em: string | null
}

/** A conta logada está liberada em recepcao_usuarios? (sem isso a lista volta vazia, sem erro) */
export async function temAcessoRecepcao() {
  return request<boolean>('/rest/v1/rpc/is_recepcao', { method: 'POST', body: '{}', token: await token() })
}

export async function listarVouchers() {
  return request<RegistroVoucher[]>('/rest/v1/vouchers?select=id,codigo,nome,telefone,criado_em,usado_em&order=criado_em.desc', {
    token: await token(),
  })
}

export async function marcarUso(id: number, usado: boolean) {
  const [r] = await request<RegistroVoucher[]>(`/rest/v1/vouchers?id=eq.${id}`, {
    method: 'PATCH',
    token: await token(),
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ usado_em: usado ? new Date().toISOString() : null }),
  })
  if (!r) throw new ApiError(403, 'Sem permissão para alterar este voucher')
  return r
}
