/**
 * Atribuição: guarda UTMs/fbclid/gclid da URL de entrada e os envia junto
 * com o lead. A última visita com parâmetros de campanha vence; sem novos
 * parâmetros, o que foi salvo continua valendo por 30 dias.
 */

const STORAGE_KEY = 'cp_attr';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const URL_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;

type Attribution = Partial<Record<(typeof URL_KEYS)[number] | 'landing_page' | 'referrer' | 'fbc', string>>;

function read(): Attribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { ts, data } = JSON.parse(raw) as { ts: number; data: Attribution };
    if (Date.now() - ts > TTL_MS) return {};
    return data ?? {};
  } catch {
    return {};
  }
}

function write(data: Attribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* armazenamento indisponível: segue só com a URL atual */
  }
}

let current: Attribution = {};

export function captureAttribution() {
  const params = new URLSearchParams(location.search);
  const fromUrl: Attribution = {};
  for (const key of URL_KEYS) {
    const value = params.get(key);
    if (value) fromUrl[key] = value.slice(0, 300);
  }

  const stored = read();
  const externalReferrer =
    document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';

  if (Object.keys(fromUrl).length > 0) {
    current = {
      ...fromUrl,
      landing_page: location.pathname + location.search,
      referrer: externalReferrer || undefined,
      fbc: fromUrl.fbclid ? `fb.1.${Date.now()}.${fromUrl.fbclid}` : stored.fbc,
    };
    write(current);
  } else if (Object.keys(stored).length > 0) {
    current = stored;
  } else {
    current = { landing_page: location.pathname + location.search, referrer: externalReferrer || undefined };
    write(current);
  }
}

function cookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Dados de atribuição + identificadores do Meta para enviar com o lead. */
export function getAttribution(): Record<string, string> {
  if (Object.keys(current).length === 0) current = read();
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(current)) if (value) out[key] = value;
  const fbp = cookie('_fbp');
  const fbc = cookie('_fbc') ?? current.fbc;
  if (fbp) out.fbp = fbp;
  if (fbc) out.fbc = fbc;
  out.page_url = location.href.split('#')[0];
  return out;
}
