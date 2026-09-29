/**
 * Meta Conversions API — evento Lead enviado do servidor.
 * Usa o mesmo event_id do Pixel (disparado em /obrigado) para a Meta deduplicar.
 * Dados pessoais vão com hash SHA-256, normalizados conforme a documentação da Meta.
 */
import { PUBLIC_META_PIXEL_ID } from 'astro:env/client';
import { META_CAPI_ACCESS_TOKEN, META_CAPI_TEST_EVENT_CODE, META_GRAPH_API_VERSION } from 'astro:env/server';
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

export const capiEnabled = () => Boolean(PUBLIC_META_PIXEL_ID && META_CAPI_ACCESS_TOKEN);

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

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${PUBLIC_META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN!)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`CAPI ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
