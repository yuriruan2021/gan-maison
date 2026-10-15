import { useEffect, type RefObject } from 'react'

/**
 * Mede o conteúdo central e, se ele for mais alto que o espaço disponível,
 * aplica --fit (< 1) para encolher tudo proporcionalmente. Assim a página
 * nunca ganha scroll, em qualquer altura de tela.
 */
export function useFitToHeight(stageRef: RefObject<HTMLElement | null>, contentRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const stage = stageRef.current
    const content = contentRef.current
    if (!stage || !content) return

    const update = () => {
      const cs = getComputedStyle(stage)
      const available = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const natural = content.offsetHeight // altura sem o scale
      const fit = natural > available ? Math.max(0.6, available / natural) : 1
      content.style.setProperty('--fit', fit.toFixed(3))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(stage)
    ro.observe(content)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [stageRef, contentRef])
}
