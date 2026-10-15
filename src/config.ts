// Tudo que a cliente pode querer trocar fica aqui.

const WHATSAPP_NUMBER = '5561999791090'

const WHATSAPP_MESSAGE =
  'Olá! Encontrei o segredo do jardim da Gan Maison 🌿 Quero usar meu presente de boas-vindas de 10% OFF.'

export const config = {
  brand: 'Gan Maison',
  instagramUrl: 'https://www.instagram.com/ganmaison/',
  // Foto do fundo (fica em /public). Para trocar pela foto da Gan, substitua o arquivo ou mude o caminho:
  // o duotone, o desfoque e o movimento são aplicados automaticamente.
  backgroundPhoto: '/jardim-fundo.jpg',
  // api.whatsapp.com (e não wa.me): o redirecionamento do wa.me quebra emojis como 🌿 e eles chegam como "�"
  whatsappUrl: `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,

  gift: {
    eyebrow: 'Gan Maison · Nova casa',
    // O trecho entre {chaves} vira a "segunda voz" (serifa itálica).
    title: 'Você encontrou o {segredo} do nosso jardim.',
    subtitle: 'E todo jardim tem algo especial reservado para quem chega.',
    discount: '10%',
    discountLabel: 'OFF',
    discountCaption: 'presente de boas-vindas',
    body: 'Para você viver sua primeira experiência na nossa nova casa.',
    cta: 'Resgatar meu presente',
    // Defina um código (ex.: 'JARDIM15') para exibir um cupom no card. null = não exibe.
    couponCode: null as string | null,
    footnote: 'Válido para a primeira experiência na nova casa.',
  },

  // Tempos (ms)
  loaderMin: 2300, // tempo mínimo para o broto e o logo terminarem de nascer
  loaderMax: 2700, // teto: sai mesmo se as fontes ainda não chegaram
  autoBloomAfter: 9000, // floresce sozinho se a pessoa não tocar
}
