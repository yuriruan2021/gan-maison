// Tudo que a cliente pode querer trocar fica aqui.

const WHATSAPP_NUMBER = '5561999791090'

const WHATSAPP_MESSAGE = 'Olá! Encontrei o segredo do jardim da Gan Maison 🌿'

// api.whatsapp.com (e não wa.me): o redirecionamento do wa.me quebra emojis como 🌿 e eles chegam como "�"
const whatsapp = (texto: string) => `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(texto)}`

export const config = {
  brand: 'Gan Maison',
  instagramUrl: 'https://www.instagram.com/ganmaison/',
  // Foto do fundo (fica em /public). Para trocar pela foto da Gan, substitua o arquivo ou mude o caminho:
  // o duotone, o desfoque e o movimento são aplicados automaticamente.
  backgroundPhoto: '/jardim-fundo.jpg',
  whatsappUrl: whatsapp(WHATSAPP_MESSAGE),
  whatsappClaimedUrl: whatsapp('Olá! Já resgatei o presente do segredo do jardim da Gan Maison 🌿 Pode me ajudar com o meu cupom?'),
  whatsappVoucherUrl: (nome: string, codigo: string) =>
    whatsapp(`Olá! Sou ${nome} e encontrei o segredo do jardim da Gan Maison 🌿 Quero usar meu presente de 10% OFF. Meu código é ${codigo}.`),

  gift: {
    eyebrow: 'Gan Maison · Nova casa',
    // O trecho entre {chaves} vira a "segunda voz" (serifa itálica).
    title: 'Você encontrou o {segredo} do nosso jardim.',
    subtitle: 'E todo jardim tem algo especial reservado para quem chega.',
    discount: '10%',
    discountLabel: 'OFF',
    discountCaption: 'presente de boas-vindas',

    // 1º passo: a pessoa diz para quem é o presente
    form: {
      lockedCode: 'GAN-••••••', // cupom "trancado" que aparece borrado até a pessoa preencher
      prompt: 'Preencha para liberar seu cupom',
      nameLabel: 'Seu nome',
      phoneLabel: 'Seu WhatsApp com DDD',
      submit: 'Liberar meu cupom',
      sending: 'Liberando seu cupom…',
      privacy: 'Usamos seu nome e WhatsApp só para validar o presente.',
      errors: {
        nome: 'Conta pra gente o seu nome.',
        telefone: 'Confira o WhatsApp com DDD, ex.: (61) 99999-0000.',
        falha: 'Não conseguimos abrir o presente agora. Tente de novo em instantes.',
      },
    },

    // 2º passo: o código. {nome} vira o primeiro nome da pessoa, em itálico.
    body: '{nome}, este presente é seu. Mostre o código na sua primeira experiência na nossa nova casa.',
    couponHint: 'Toque para copiar',
    cta: 'Resgatar meu presente',
    footnote: 'Válido para a primeira experiência na nova casa.',

    // Quando o WhatsApp digitado já tem cupom (o código não é mostrado de novo)
    claimed: {
      body: 'Este WhatsApp já resgatou o presente de boas-vindas. Fale com a gente para usar o seu cupom.',
      cta: 'Falar no WhatsApp',
      footnote: 'Um presente por pessoa.',
    },

    // Quando os vouchers acabam (o limite fica em supabase/schema.sql → voucher_limite)
    soldOut: {
      body: 'Todos os presentes de boas-vindas já foram resgatados. Obrigado pelo carinho — o jardim sempre guarda novos segredos.',
      cta: 'Acompanhar no Instagram',
      footnote: 'Fique de olho nas próximas surpresas.',
    },
  },

  // Login da recepção (/recepcao): quem digita "gan" entra como gan@<dominio>
  recepcao: {
    dominio: 'ganmaison.com.br',
  },

  // Tempos (ms)
  loaderMin: 2300, // tempo mínimo para o broto e o logo terminarem de nascer
  loaderMax: 2700, // teto: sai mesmo se as fontes ainda não chegaram
  autoBloomAfter: 9000, // floresce sozinho se a pessoa não tocar
}
