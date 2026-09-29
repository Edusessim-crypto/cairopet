/**
 * Tracking — Meta Pixel, GA4 e dataLayer (para quem quiser plugar GTM).
 *
 * IDs vêm do ambiente (PUBLIC_META_PIXEL_ID, PUBLIC_GA4_ID). Sem ID, nada é
 * carregado. Os stubs (fbq/gtag) enfileiram chamadas na hora; os arquivos
 * dos fornecedores só são baixados depois do carregamento da página, para
 * não competir com o conteúdo.
 *
 * Eventos:
 *   cta_click, form_start, form_step, form_submit, whatsapp_click → dataLayer + GA4
 *   Lead (Meta) / generate_lead (GA4) → SOMENTE após envio bem-sucedido
 *   (disparado na página /obrigado, com o mesmo event_id enviado à Conversions API
 *   para deduplicação).
 */
import { PUBLIC_GA4_ID, PUBLIC_META_PIXEL_ID } from 'astro:env/client';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
    __cpTracking?: boolean;
  }
}

function loadScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function whenIdle(fn: () => void) {
  const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200));
  if (document.readyState === 'complete') run();
  else addEventListener('load', run, { once: true });
}

export function initTracking() {
  if (window.__cpTracking) return;
  window.__cpTracking = true;
  window.dataLayer = window.dataLayer || [];

  const ga4 = PUBLIC_GA4_ID;
  if (ga4) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', ga4);
    whenIdle(() => loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`));
  }

  if (PUBLIC_META_PIXEL_ID) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as NonNullable<Window['fbq']> & { queue: unknown[]; loaded: boolean; version: string; push: unknown };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq('init', PUBLIC_META_PIXEL_ID);
    fbq('track', 'PageView');
    whenIdle(() => loadScript('https://connect.facebook.net/en_US/fbevents.js'));
  }
}

/** Evento de interação (não é conversão). */
export function track(event: string, params: Params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  window.gtag?.('event', event, params);
  if (event === 'whatsapp_click') window.fbq?.('track', 'Contact');
}

/** Conversão principal. Chamar SOMENTE depois do envio confirmado pelo servidor. */
export function trackLead(eventId: string, params: Params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'lead', event_id: eventId, ...params });
  window.gtag?.('event', 'generate_lead', { ...params, event_id: eventId });
  window.fbq?.('track', 'Lead', { content_name: 'Verificar cidade', ...params }, { eventID: eventId });
}

/** Rastreia cliques em CTAs e links de WhatsApp declarados no HTML. */
export function bindClickTracking(root: Document | HTMLElement = document) {
  root.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cta], [data-track="whatsapp"]');
    if (!el) return;
    if (el.dataset.track === 'whatsapp') track('whatsapp_click', { location: el.dataset.location });
    else track('cta_click', { location: el.dataset.cta, label: el.textContent?.trim().slice(0, 80) });
  });
}
