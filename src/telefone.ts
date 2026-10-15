export const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/** Só DDD + número: tira o +55 de quem colou o número completo. */
export function normalizarTelefone(valor: string) {
  const d = soDigitos(valor)
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d
}

/** Celular com DDD (mesma regra do banco): 61 9xxxx-xxxx */
export const telefoneValido = (valor: string) => /^[1-9][1-9]9\d{8}$/.test(normalizarTelefone(valor))

/** '61999791090' → '(61) 99979-1090'. Também serve de máscara enquanto a pessoa digita. */
export function formatarTelefone(valor: string) {
  const d = normalizarTelefone(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
