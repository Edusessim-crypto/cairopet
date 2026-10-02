/**
 * Meta Conversions API — evento Lead enviado do servidor, depois de a planilha
 * confirmar o lead. Usa o mesmo event_id do evento `lead` que o formulário manda
 * ao dataLayer (o GTM o repassa ao Pixel como eventID), para a Meta deduplicar.
 * Dados pessoais vão com hash SHA-256, aqui no servidor, normalizados conforme a
 * documentação da Meta.
 *
 * Ativação só no servidor: META_PIXEL_ID + META_CAPI_ACCESS_TOKEN (ambas secretas,
 * lidas em runtime e fora do bundle do navegador). Não depende de nenhuma
 * variável PUBLIC_* — o Pixel do navegador é carregado exclusivamente pelo GTM.
 */
import { META_CAPI_ACCESS_TOKEN, META_CAPI_TEST_EVENT_CODE, META_GRAPH_API_VERSION, META_PIXEL_ID } from 'astro:env/server';
import { normalizeWhatsapp, type Lead } from './lead-schema';

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const plain = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

export const capiEnabled = () => Boolean(META_PIXEL_ID && META_CAPI_ACCESS_TOKEN);

interface Context {
  ip?: string;
  userAgent?: string;
}

export async function sendLeadToCapi(lead: Lead, ctx: Context): Promise<void> {
  if (!capiEnabled()) return;
  const t = lead.tracking;
  const [first, ...rest] = lead.nome.trim().split(/\s+/);
  const phone = normalizeWhatsapp(lead.whatsapp);

  const hashed = async (v: string | undefined) => (v ? [await sha256(v)] : undefined);
  const user_data: Record<string, unknown> = {
    ph: await hashed(phone ? `55${phone}` : undefined),
    fn: await hashed(first ? plain(first) : undefined),
    ln: await hashed(rest.length ? plain(rest[rest.length - 1]) : undefined),
    ct: await hashed(plain(lead.cidade) || undefined),
    st: await hashed(lead.uf.toLowerCase() || undefined),
    country: [await sha256('br')],
    client_ip_address: ctx.ip,
    client_user_agent: ctx.userAgent,
    fbp: t.fbp,
    fbc: t.fbc,
  };
  for (const k of Object.keys(user_data)) if (user_data[k] === undefined) delete user_data[k];

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: t.event_id,
        action_source: 'website',
        event_source_url: t.page_url,
        user_data,
        custom_data: { content_name: 'Verificar cidade' },
      },
    ],
  };
  if (META_CAPI_TEST_EVENT_CODE) body.test_event_code = META_CAPI_TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(META_PIXEL_ID!)}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN!)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`CAPI ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
