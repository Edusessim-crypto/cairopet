import type { APIRoute } from 'astro';
import { LEAD_WEBHOOK_TOKEN, LEAD_WEBHOOK_URL } from 'astro:env/server';
import { formatWhatsapp, normalizeWhatsapp, parseLead, validateLead, type Lead } from '../../lib/lead-schema';
import { sendLeadToCapi } from '../../lib/meta-capi';

export const prerender = false;

const MAX_BODY = 32 * 1024;

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const redirect = (to: string) => new Response(null, { status: 303, headers: { Location: to } });

async function readBody(request: Request): Promise<{ raw: Record<string, unknown>; isJson: boolean }> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return { raw: (await request.json()) as Record<string, unknown>, isJson: true };
  // Envio sem JavaScript (form HTML comum)
  const form = await request.formData();
  const raw: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).map(String);
    raw[key] = key === 'problemas' ? values : values[0];
  }
  return { raw, isJson: false };
}

/** Formato enviado ao webhook (CRM, n8n, Make, Zapier, planilha…). */
function toWebhookPayload(lead: Lead, meta: { ip?: string; userAgent?: string }) {
  const phone = normalizeWhatsapp(lead.whatsapp);
  const now = new Date().toISOString();
  return {
    tipo: 'lead_site_cairopet',
    recebido_em: now,
    contato: {
      nome: lead.nome,
      whatsapp: formatWhatsapp(phone),
      whatsapp_e164: `+55${phone}`,
    },
    loja: {
      nome: lead.loja,
      cidade: lead.cidade,
      uf: lead.uf,
      instagram: lead.instagram || null,
      tipo_negocio: lead.tipo_negocio,
      tamanho: lead.tamanho,
      faturamento: lead.faturamento,
    },
    qualificacao: {
      marketing_atual: lead.marketing_atual,
      investimento_anuncios: lead.investimento_anuncios,
      dores: lead.dores,
      objetivo: lead.objetivo,
      momento: lead.momento,
      decisor: lead.decisor,
      faixa_investimento: lead.faixa_investimento,
      contexto: lead.contexto || null,
    },
    consentimento_lgpd: { aceito: lead.consentimento, em: now },
    origem: { ...lead.tracking, ip: meta.ip ?? null, user_agent: meta.userAgent ?? null },
  };
}

async function forwardToWebhook(payload: unknown) {
  const url = new URL(LEAD_WEBHOOK_URL!);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      // text/plain evita preflight e é aceito pelo Google Apps Script
      'Content-Type': url.hostname === 'script.google.com' ? 'text/plain;charset=utf-8' : 'application/json',
      ...(LEAD_WEBHOOK_TOKEN ? { Authorization: `Bearer ${LEAD_WEBHOOK_TOKEN}` } : {}),
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);

  // Destinos que respondem JSON (ex.: planilha Google) precisam confirmar {"ok": true}.
  const text = await res.text();
  let data: { ok?: boolean; error?: string } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (url.hostname === 'script.google.com' && data?.ok !== true) {
    throw new Error(`Planilha não confirmou o lead: ${data?.error ?? text.slice(0, 120)}`);
  }
  if (data && data.ok === false) throw new Error(`Webhook recusou o lead: ${data.error ?? ''}`);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) return json(413, { ok: false, message: 'Envio grande demais.' });

  let body: Awaited<ReturnType<typeof readBody>>;
  try {
    body = await readBody(request);
  } catch {
    return json(400, { ok: false, message: 'Não foi possível ler o envio.' });
  }
  const { raw, isJson } = body;
  const fail = (status: number, message: string, query: string) =>
    isJson ? json(status, { ok: false, message }) : redirect(`/formulario/?erro=${query}`);

  // Honeypot: robôs preenchem o campo invisível. Responde "ok" e descarta.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return isJson ? json(200, { ok: true }) : redirect('/obrigado/');
  }

  const lead = parseLead(raw);
  const errors = validateLead(lead);
  if (Object.keys(errors).length > 0) {
    return isJson ? json(422, { ok: false, errors }) : redirect('/formulario/?erro=formulario');
  }

  let ip: string | undefined;
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress;
  } catch {
    ip = undefined;
  }
  const meta = { ip, userAgent: request.headers.get('user-agent') ?? undefined };
  const payload = toWebhookPayload(lead, meta);

  // 1) Registrar o lead. Se falhar, nenhuma conversão é registrada.
  if (LEAD_WEBHOOK_URL) {
    try {
      await forwardToWebhook(payload);
    } catch (err) {
      console.error('[lead] Webhook falhou:', err);
      return fail(502, 'Falha ao registrar o envio.', 'envio');
    }
  } else if (import.meta.env.DEV) {
    console.info('[lead] LEAD_WEBHOOK_URL não configurada — lead recebido em dev:\n', JSON.stringify(payload, null, 2));
  } else {
    // Falha visível de propósito: nenhum lead pode ser descartado em silêncio.
    console.error('[lead] LEAD_WEBHOOK_URL não configurada. Lead NÃO foi armazenado.');
    return fail(503, 'Formulário temporariamente indisponível.', 'envio');
  }

  // 2) Só depois do lead salvo: evento Lead na Conversions API (falha aqui não bloqueia o lead).
  try {
    await sendLeadToCapi(lead, meta);
  } catch (err) {
    console.error('[lead] Conversions API falhou:', err);
  }

  return isJson ? json(200, { ok: true }) : redirect('/obrigado/');
};

export const ALL: APIRoute = () => json(405, { ok: false, message: 'Método não permitido.' });
