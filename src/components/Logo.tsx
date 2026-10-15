type LogoProps = {
  className?: string
  /** anima as letras entrando uma a uma */
  animated?: boolean
}

/**
 * Wordmark "gan" em serifa — aproximação do logo do Instagram.
 * Quando tiver o arquivo oficial (SVG), basta trocar o conteúdo deste componente por <img src="/logo.svg" />.
 */
export function Logo({ className = '', animated = false }: LogoProps) {
  return (
    <span className={`logo ${animated ? 'logo--animated' : ''} ${className}`} aria-label="Gan Maison">
      {'gan'.split('').map((l, i) => (
        <span key={i} className="logo__letter" style={{ ['--i' as string]: i }} aria-hidden>
          {l}
        </span>
      ))}
    </span>
  )
}
