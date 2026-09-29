import {
  PUBLIC_CALENDLY_URL,
  PUBLIC_CONTACT_EMAIL,
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

/** Agendamento do briefing (depois do lead salvo). */
export const CALENDLY_URL = PUBLIC_CALENDLY_URL || 'https://calendly.com/cairopet/briefing-cairopet';

const whatsappDigits = (PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D+/g, '');

/** Canais oficiais: só aparecem no site quando configurados no ambiente. */
export const CONTACT = {
  instagram: PUBLIC_INSTAGRAM_URL || null,
  whatsapp: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
  email: PUBLIC_CONTACT_EMAIL || null,
  legalName: PUBLIC_COMPANY_LEGAL_NAME || null,
  cnpj: PUBLIC_COMPANY_CNPJ || null,
} as const;
