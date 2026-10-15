import { useCallback, useEffect, useRef, useState } from 'react'
import { config } from './config'
import { FloatingPetals } from './components/FloatingPetals'
import { Butterflies } from './components/Butterflies'
import { Ferns } from './components/Ferns'
import { Garden } from './components/Garden'
import { GiftCard } from './components/GiftCard'
import { Header } from './components/Header'
import { Loader } from './components/Loader'
import { PhotoBackdrop } from './components/PhotoBackdrop'
import { SecretOlive } from './components/SecretOlive'
import { useFitToHeight } from './useFitToHeight'
import { useReducedMotion } from './useReducedMotion'

/**
 * Fases da experiência:
 *  loading  → broto + logo (só na 1ª visita da sessão; decidido no <head> do index.html)
 *  garden   → o jardim cresce e a oliveira pulsa ("toque para descobrir")
 *  blooming → a copa da oliveira se enche de folhas, flores e azeitonas; luz e pétalas
 *  revealed → o presente aparece
 */
type Phase = 'loading' | 'garden' | 'blooming' | 'revealed'

const hasIntro = () => typeof document !== 'undefined' && document.documentElement.classList.contains('has-intro')

/** Tempo restante até `ms` contados desde a navegação (um bundle atrasado não empurra o prazo). */
const fromNavigation = (ms: number) => Math.max(0, ms - performance.now())

export default function App() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(() => (reduced ? 'revealed' : hasIntro() ? 'loading' : 'garden'))
  const [loaderGone, setLoaderGone] = useState(() => !hasIntro())

  // Preloader: espera a animação do logo (mín.) e as fontes, com teto; nunca passa de 6 s.
  useEffect(() => {
    if (phase !== 'loading') return
    let done = false
    const leave = () => {
      if (done) return
      done = true
      setPhase('garden')
    }
    const hardStop = setTimeout(leave, fromNavigation(6000))
    const minShow = new Promise((r) => setTimeout(r, config.loaderMin))
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve()
    const cap = new Promise((r) => setTimeout(r, config.loaderMax))
    Promise.race([Promise.all([minShow, fonts]), cap]).then(leave, leave)
    return () => clearTimeout(hardStop)
  }, [phase])

  // remove o loader depois do fade de saída
  useEffect(() => {
    if (phase === 'loading' || loaderGone) return
    const t = setTimeout(() => {
      document.documentElement.classList.remove('has-intro')
      setLoaderGone(true)
    }, 2400) // folhas surgem, a folha do centro vira janela e dá zoom; as outras voam
    return () => clearTimeout(t)
  }, [phase, loaderGone])

  // Movimento reduzido ligado no meio da visita: mostra o presente direto.
  useEffect(() => {
    if (reduced) {
      setPhase('revealed')
      setLoaderGone(true)
      document.documentElement.classList.remove('has-intro')
    }
  }, [reduced])

  const bloom = useCallback(() => {
    setPhase((p) => (p === 'garden' ? 'blooming' : p))
  }, [])

  // floresce sozinho se ninguém tocar
  useEffect(() => {
    if (phase !== 'garden') return
    const t = setTimeout(bloom, config.autoBloomAfter)
    return () => clearTimeout(t)
  }, [phase, bloom])

  // blooming → revealed
  useEffect(() => {
    if (phase !== 'blooming') return
    const t = setTimeout(() => setPhase('revealed'), 2000)
    return () => clearTimeout(t)
  }, [phase])

  const stageRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useFitToHeight(stageRef, contentRef)

  const afterLoading = phase !== 'loading'
  const opened = phase === 'blooming' || phase === 'revealed'
  const revealed = phase === 'revealed'

  return (
    <div className={`page phase-${phase}`}>
      {!loaderGone && <Loader leaving={afterLoading} />}

      <div className="frame">
        <PhotoBackdrop />
        <span className={`frame__light ${opened && !reduced ? 'is-on' : ''}`} aria-hidden />
        <Header visible={afterLoading} />

        <main className="stage" ref={stageRef}>
          <div className="stage__content" ref={contentRef}>
            <div className="stage__flower">
              <SecretOlive open={opened} compact={revealed} onOpen={bloom} />
              {/* o texto também abre o segredo (o nome acessível fica na oliveira, por isso aria-hidden e fora do Tab) */}
              <button
                type="button"
                className={`hint ${phase === 'garden' ? 'is-visible' : ''}`}
                onClick={bloom}
                disabled={phase !== 'garden'}
                tabIndex={-1}
                aria-hidden
              >
                Toque para descobrir o segredo
              </button>
            </div>
            <GiftCard visible={revealed} />
          </div>
        </main>

        <FloatingPetals active={opened && !reduced} />
        <Garden active={afterLoading} />
        <Ferns active={afterLoading} />
        <Butterflies active={afterLoading} />
      </div>
    </div>
  )
}
