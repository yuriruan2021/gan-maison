import { config } from '../config'
import { InstagramIcon, WhatsAppIcon } from './Icons'
import { Logo } from './Logo'

export function Header({ visible }: { visible: boolean }) {
  return (
    <header className={`header ${visible ? 'is-visible' : ''}`}>
      <a href="/" className="header__brand" aria-label="Gan Maison — início">
        <Logo />
      </a>
      <nav className="header__social" aria-label="Redes sociais">
        <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Instagram da Gan Maison">
          <InstagramIcon />
        </a>
        <a href={config.whatsappUrl} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Falar com a Gan Maison no WhatsApp">
          <WhatsAppIcon />
        </a>
      </nav>
    </header>
  )
}
