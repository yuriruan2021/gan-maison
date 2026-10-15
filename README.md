# Gan Maison · O segredo do jardim (v1)

Página que abre ao escanear o QR Code na nova casa da Gan Maison.

**Fluxo:** loading (broto nasce + logo "gan", só na 1ª visita da sessão) → folhas de oliveira surgem espalhadas pela tela; a folha do centro vira uma janela que dá zoom até revelar o site, enquanto as outras voam para fora → fundo em gradiente da marca, com o prado de flores e samambaias crescendo → a oliveira pulsa ("Toque na oliveira…") → a copa se enche de folhas prateadas, flores e azeitonas, com pólen e um clarão de luz, pétalas caem → aparece o presente de 15% OFF com botão para o WhatsApp.

Direção e checagens seguem o pack `premium-web-design` do Brainforge (nível **Premium**): moldura com borda de luz e grão, tipografia editorial com segunda voz em itálico, um momento-assinatura (a oliveira, como a da recepção), CTA com letter roll, preloader com failsafe, movimento reduzido ao vivo e fallback sem JavaScript.

## Rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173 (e na rede local, para testar no celular)
npm run build    # gera /dist para publicar (Vercel, Netlify, etc.)
```

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Textos, % de desconto, cupom, WhatsApp, Instagram, tempos | `src/config.ts` |
| Logo (trocar pelo SVG oficial) | `src/components/Logo.tsx` |
| Prévia ao compartilhar o link | `public/og-image.png` + metas `og:` no `index.html` (use URL absoluta após o deploy) |
| Cores, gradiente de fundo e animações | `src/styles.css` (tokens no topo; gradiente em `.frame`) |
| Foto do jardim ao fundo (duotone da marca, profundidade, zoom lento) | `public/jardim-fundo.jpg` (caminho em `config.backgroundPhoto`), `src/components/PhotoBackdrop.tsx` e `.photo` no CSS |
| Prado com flores, samambaias e borboletas | `src/components/Garden.tsx`, `src/components/Ferns.tsx`, `src/components/Butterflies.tsx` |
| Transição das folhas (saída do loading) | `src/components/Loader.tsx` + `.loader.is-leaving`, `.loader__hero-leaf` e `.burst-leaf` no CSS |
| Ajuste para nunca ter scroll | `src/useFitToHeight.ts` |
| Oliveira secreta (o botão que floresce) | `src/components/SecretOlive.tsx` |

Sem dependências além de React — todas as animações são CSS + SVG. Respeita `prefers-reduced-motion` (mostra o presente direto).

## Créditos

Foto de fundo (olival com flores brancas): Elisabeth Jurenka / Unsplash — uso livre pela Licença Unsplash (https://unsplash.com/pt-br/licen%C3%A7a). Recortada e suavizada para o fundo.
