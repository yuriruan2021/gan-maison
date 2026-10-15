import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// a área da recepção vem num arquivo separado: quem escaneia o QR Code não baixa nada dela
const Recepcao = lazy(() => import('./recepcao/Recepcao'))
const isRecepcao = location.pathname.replace(/\/+$/, '') === '/recepcao'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRecepcao ? (
      <Suspense fallback={null}>
        <Recepcao />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
