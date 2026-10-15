// Vercel Cron (ver vercel.json): uma chamada por dia ao Supabase.
// O plano grátis pausa o projeto depois de ~7 dias sem acesso — e aí a página não conseguiria gerar vouchers.
export default async function handler(req, res) {
  const url = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.VITE_SUPABASE_KEY
  if (!url || !key) return res.status(500).json({ ok: false, erro: 'Supabase não configurado' })

  const r = await fetch(`${url}/rest/v1/rpc/vouchers_status`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: '{}',
  })
  res.status(r.ok ? 200 : 502).json({ ok: r.ok })
}
