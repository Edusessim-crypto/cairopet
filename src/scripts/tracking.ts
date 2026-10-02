/**
 * Tracking — o site só alimenta o dataLayer; o GTM (GTM-MQPCCFFG) é a única
 * camada que carrega e dispara GA4 e Meta Pixel. Não há gtag/fbq direto no
 * código: carregar GA4 ou Pixel aqui duplicaria cada evento que o GTM já envia.
 *
 * Eventos (dataLayer → GTM):
 *   cta_click, form_start, form_step, form_submit, whatsapp_click → interação (não é conversão)
 *   lead (com event_id) → conversão: no GTM vira GA4 `generate_lead` + Meta `Lead`.
 *     Disparado no formulário, SOMENTE depois de /api/lead confirmar o lead salvo
 *     (resposta `saved: true`), e só então a página vai para /obrigado/.
 *     /obrigado/ não dispara conversão nenhuma.
 *   O mesmo event_id vai à planilha (deduplicação) e, quando ativa, à Conversions API.
 */

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    __cpTracking?: boolean;
  }
}

export function initTracking() {
  if (window.__cpTracking) return;
  window.__cpTracking = true;
  window.dataLayer = window.dataLayer || [];
}

/** Evento de interação (não é conversão). */
export function track(event: string, params: Params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

/**
 * Conversão principal (`lead` → GTM → GA4 `generate_lead` + Meta `Lead`).
 * Chamar SOMENTE depois de o servidor confirmar que o lead foi salvo.
 *
 * Resolve quando o GTM termina de processar o evento (`eventCallback`) — ou em
 * no máximo ~2 s (`eventTimeout` + timer local, que cobre o GTM bloqueado, quando
 * nenhum callback chega), para nunca prender o usuário antes de /obrigado/.
 */
export function trackLead(eventId: string, params: Params = {}): Promise<void> {
  const TIMEOUT = 2000;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve();
    };
    const guard = window.setTimeout(finish, TIMEOUT + 150);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead', event_id: eventId, ...params, eventCallback: finish, eventTimeout: TIMEOUT });
  });
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
