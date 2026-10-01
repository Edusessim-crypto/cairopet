import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_GTM_ID,
  PUBLIC_COMPANY_CNPJ,
  PUBLIC_COMPANY_LEGAL_NAME,
  PUBLIC_INSTAGRAM_URL,
  PUBLIC_WHATSAPP_NUMBER,
} from 'astro:env/client';

export const SITE = {
  name: 'CairoPet',
  title: 'CairoPet | Marketing para Agropecuárias',
  description:
    'Estratégia, conteúdo, tráfego e campanhas só para agropecuárias — para a sua loja aparecer para quem compra na sua região. Uma agropecuária por cidade.',
  positioning: 'Especialistas em Marketing para Agropecuárias',
  locale: 'pt_BR',
  ogImage: '/og-cairopet.jpg',
} as const;

export const CTA = {
  primary: 'Minha cidade ainda está livre?',
  secondary: 'Quero analisar minha agropecuária',
  target: '/formulario/',
} as const;

export const NAV = [
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Resultado', href: '/#resultado' },
  { label: 'Perguntas', href: '/#perguntas' },
] as const;

/** Google Tag Manager (container da CairoPet). Pode ser trocado por PUBLIC_GTM_ID. */
export const GTM_ID = (PUBLIC_GTM_ID || 'GTM-MQPCCFFG').trim();

/** WhatsApp oficial da CairoPet — usado na página de obrigado e no erro de envio do formulário. */
export const WHATSAPP_NUMBER = '5551995757018';
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

const whatsappDigits = (PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D+/g, '');

/** Canais oficiais: só aparecem no site quando configurados no ambiente. */
export const CONTACT = {
  instagram: PUBLIC_INSTAGRAM_URL || null,
  whatsapp: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
  email: PUBLIC_CONTACT_EMAIL || null,
  legalName: PUBLIC_COMPANY_LEGAL_NAME || null,
  cnpj: PUBLIC_COMPANY_CNPJ || null,
} as const;
