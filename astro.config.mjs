// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// Domínio canônico. Defina PUBLIC_SITE_URL no ambiente de deploy.
const SITE = env.PUBLIC_SITE_URL || 'https://cairopet.com.br';

/** @param {string} path */
const fontsource = (path) => `./node_modules/@fontsource${path}`;

export default defineConfig({
  site: SITE,
  output: 'static',
  // /api/lead espera a planilha (até 15 s) e, se ativa, a Conversions API (até 4 s).
  // Limite explícito para a Vercel nunca encerrar a função antes desse orçamento
  // (o padrão varia por plano). O navegador espera 25 s — sempre mais que a API.
  adapter: vercel({ maxDuration: 30 }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/obrigado') && !page.includes('/formulario') && !page.includes('/apresentacao'),
    }),
  ],
  prefetch: false,
  // Landing de página única: CSS inline elimina requisições que bloqueiam a renderização.
  build: { inlineStylesheets: 'always' },
  // Preserva espaços entre texto e <strong>/<a> (o gzip/brotli compensa o tamanho).
  compressHTML: false,
  devToolbar: { enabled: false },
  image: {
    // Fotos são servidas em AVIF/WebP pelo componente <Photo>.
    responsiveStyles: false,
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Archivo Black',
      cssVariable: '--font-display',
      fallbacks: ['Arial Black', 'sans-serif'],
      options: {
        variants: [
          {
            src: [fontsource('/archivo-black/files/archivo-black-latin-400-normal.woff2')],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-body',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: [fontsource('-variable/inter/files/inter-latin-wght-normal.woff2')],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Space Mono',
      cssVariable: '--font-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: [fontsource('/space-mono/files/space-mono-latin-400-normal.woff2')],
            weight: 400,
            style: 'normal',
          },
          {
            src: [fontsource('/space-mono/files/space-mono-latin-700-normal.woff2')],
            weight: 700,
            style: 'normal',
          },
        ],
      },
    },
  ],
  env: {
    schema: {
      // Públicas (vão para o navegador) ------------------------------------
      // GA4 e Meta Pixel do navegador vêm só pelo GTM (sem variáveis próprias).
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_INSTAGRAM_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_WHATSAPP_NUMBER: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_CONTACT_EMAIL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_COMPANY_LEGAL_NAME: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_COMPANY_CNPJ: envField.string({ context: 'client', access: 'public', optional: true }),
      // Secretas (somente servidor) -----------------------------------------
      LEAD_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_WEBHOOK_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Conversions API: só servidor. Ativa com META_PIXEL_ID + META_CAPI_ACCESS_TOKEN.
      META_PIXEL_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      META_CAPI_ACCESS_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      META_CAPI_TEST_EVENT_CODE: envField.string({ context: 'server', access: 'secret', optional: true }),
      META_GRAPH_API_VERSION: envField.string({ context: 'server', access: 'public', default: 'v23.0' }),
    },
  },
});
