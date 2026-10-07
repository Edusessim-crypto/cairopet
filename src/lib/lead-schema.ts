/**
 * Schema do lead — usado pelo formulário (navegador) e pela rota /api/lead
 * (servidor). Qualquer mudança de campo ou opção deve ser feita aqui.
 *
 * Formulário em 3 etapas (pedido da CairoPet, out/2026):
 *  1 Sua agropecuária — nome da loja · cidade + UF · tipo de estabelecimento
 *  2 Seu negócio      — faturamento · o que impede de vender mais (até 2) · quando
 *                       quer começar · poder de decisão
 *  3 Seus dados       — nome · WhatsApp · Instagram (opcional)
 * A pergunta sobre quanto investir na agência foi removida de propósito: a
 * qualificação financeira é feita pelo faturamento, e a classificação do lead
 * acontece só no Apps Script (nada disso fica exposto no navegador).
 */

export const UFS = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
] as const;

export const TIPO_ESTABELECIMENTO_OPTIONS = [
  'Agropecuária',
  'Casa de ração',
  'Agropecuária e pet shop',
  'Agropecuária e materiais de construção',
  'Outro',
] as const;

/**
 * Faixas de faturamento mensal. Só os rótulos vivem aqui: o valor de referência de
 * cada faixa e o faturamento mínimo ficam no Apps Script (FATURAMENTO_MINIMO), que
 * classifica o lead no servidor. Mudou um rótulo? Atualize também FAIXAS_FATURAMENTO
 * em integrations/google-sheets/Code.gs.
 */
export const FATURAMENTO_OPTIONS = [
  'De R$ 50 mil a R$ 79.999',
  'De R$ 80 mil a R$ 149.999',
  'De R$ 150 mil a R$ 299.999',
  'R$ 300 mil ou mais',
] as const;

export const DIFICULDADES_OPTIONS = [
  'Poucos clientes entrando na loja',
  'Promoções que não trazem resultados',
  'Dificuldade para conquistar novos clientes',
  'Estoque parado',
  'Poucas vendas pelo WhatsApp',
  'Falta de divulgação e presença digital',
  'Quero crescer, mas não sei por onde começar',
] as const;

export const MAX_DIFICULDADES = 2;

export const URGENCIA_OPTIONS = [
  'Quero começar o quanto antes',
  'Nos próximos 30 dias',
  'Nos próximos 2 ou 3 meses',
  'Ainda estou pesquisando as possibilidades',
] as const;

export const PODER_DECISAO_OPTIONS = [
  'Sim, sou o proprietário',
  'Sim, sou responsável pelas contratações',
  'Decido junto com outra pessoa',
  'Não, mas participo da decisão',
] as const;

export const TRACKING_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'landing_page',
  'referrer',
  'page_url',
  'fbp',
  'fbc',
  'event_id',
] as const;

export type TrackingKey = (typeof TRACKING_KEYS)[number];

export interface Lead {
  loja: string;
  cidade: string;
  uf: string;
  tipo_estabelecimento: string;
  faturamento: string;
  dificuldades: string[];
  urgencia: string;
  poder_decisao: string;
  nome: string;
  whatsapp: string;
  instagram: string;
  consentimento: boolean;
  tracking: Partial<Record<TrackingKey, string>>;
}

export type LeadErrors = Partial<Record<keyof Lead, string>>;

type Raw = Record<string, unknown>;

const str = (v: unknown, max = 200): string =>
  (Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : v == null ? '' : String(v))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const list = (v: unknown): string[] =>
  (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]).map((x) => str(x)).filter(Boolean);

export const onlyDigits = (v: string) => v.replace(/\D+/g, '');

/** Normaliza WhatsApp brasileiro para DDD + número (10 ou 11 dígitos). */
export function normalizeWhatsapp(v: string): string {
  let d = onlyDigits(v);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.length > 11 && d.startsWith('0')) d = d.replace(/^0+/, '');
  return d;
}

export function formatWhatsapp(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** "@loja", "instagram.com/loja/" ou "loja" → "@loja". O que não for perfil fica como está (e não passa na validação). */
export function normalizeInstagram(v: string): string {
  const t = v.trim();
  if (!t) return '';
  const m = t.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
  if (m) return `@${m[1]}`;
  // Endereço de site (www.loja.com.br) não é perfil — a não ser que venha com @.
  const looksLikeSite = /^(https?:\/\/|www\.)|\.(com|net|org|br|site|online|shop|store)(\.br)?\/?$/i.test(t);
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(t) && (t.startsWith('@') || !looksLikeSite)) return `@${t.replace(/^@/, '')}`;
  return t;
}

const isInstagramHandle = (v: string) => /^@[A-Za-z0-9._]{1,30}$/.test(v);

/** DDDs em uso no Brasil (Anatel). */
const DDDS = new Set(
  '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(
    ' ',
  ),
);

/**
 * WhatsApp brasileiro: DDD válido + celular (11 dígitos, começa com 9) ou fixo
 * (10 dígitos, começa de 2 a 5 — WhatsApp Business aceita fixo). Recusa número
 * com todos os dígitos iguais.
 */
export function isValidWhatsapp(v: string): boolean {
  const d = normalizeWhatsapp(v);
  if (!DDDS.has(d.slice(0, 2))) return false;
  const n = d.slice(2);
  if (/^(\d)\1+$/.test(n)) return false;
  return (n.length === 9 && n[0] === '9') || (n.length === 8 && /[2-5]/.test(n[0]));
}

export const firstName = (nome: string) => nome.trim().split(/\s+/)[0] ?? '';

const oneOf = (value: string, options: readonly string[]) => options.includes(value);
const choose = (options: readonly string[], message: string) => (value: string) =>
  oneOf(value, options) ? null : message;

/** Validação por campo — mensagens escritas para o dono da loja, não para dev. */
export const validators: Partial<Record<keyof Lead, (lead: Lead) => string | null>> = {
  loja: (l) => (l.loja.length >= 2 ? null : 'Informe o nome da sua agropecuária.'),
  uf: (l) => (oneOf(l.uf, UFS.map(([uf]) => uf)) ? null : 'Escolha o estado.'),
  cidade: (l) => (l.cidade.length >= 2 ? null : 'Informe a cidade.'),
  tipo_estabelecimento: (l) => choose(TIPO_ESTABELECIMENTO_OPTIONS, 'Escolha o tipo do estabelecimento.')(l.tipo_estabelecimento),
  faturamento: (l) => choose(FATURAMENTO_OPTIONS, 'Escolha uma faixa de faturamento.')(l.faturamento),
  dificuldades: (l) => {
    if (l.dificuldades.length === 0) return 'Marque pelo menos uma opção.';
    if (l.dificuldades.length > MAX_DIFICULDADES) return `Marque no máximo ${MAX_DIFICULDADES} opções.`;
    return l.dificuldades.every((d) => oneOf(d, DIFICULDADES_OPTIONS)) ? null : 'Marque pelo menos uma opção.';
  },
  urgencia: (l) => choose(URGENCIA_OPTIONS, 'Escolha quando você pretende começar.')(l.urgencia),
  poder_decisao: (l) => choose(PODER_DECISAO_OPTIONS, 'Escolha a opção que mais combina com você.')(l.poder_decisao),
  nome: (l) => (l.nome.length >= 2 ? null : 'Escreva seu nome para a gente saber com quem vai falar.'),
  whatsapp: (l) => (isValidWhatsapp(l.whatsapp) ? null : 'Confira o WhatsApp com DDD. Ex.: (34) 99999-1234'),
  instagram: (l) =>
    !l.instagram || isInstagramHandle(l.instagram) ? null : 'Informe o @ do Instagram ou o link do perfil — ou deixe em branco.',
  consentimento: (l) => (l.consentimento ? null : 'Para enviar, é preciso concordar com a Política de Privacidade.'),
};

export function parseLead(raw: Raw): Lead {
  const tracking: Partial<Record<TrackingKey, string>> = {};
  const rawTracking = (raw.tracking && typeof raw.tracking === 'object' ? raw.tracking : raw) as Raw;
  for (const key of TRACKING_KEYS) {
    const value = str(rawTracking[key], 500);
    if (value) tracking[key] = value;
  }
  const consent = raw.consentimento;
  return {
    loja: str(raw.loja, 120),
    cidade: str(raw.cidade, 80),
    uf: str(raw.uf, 2).toUpperCase(),
    tipo_estabelecimento: str(raw.tipo_estabelecimento),
    faturamento: str(raw.faturamento),
    dificuldades: [...new Set(list(raw.dificuldades))],
    urgencia: str(raw.urgencia),
    poder_decisao: str(raw.poder_decisao),
    nome: str(raw.nome, 80),
    whatsapp: str(raw.whatsapp, 30),
    instagram: normalizeInstagram(str(raw.instagram, 200)),
    consentimento: consent === true || consent === 'true' || consent === 'on' || consent === 'sim',
    tracking,
  };
}

export function validateLead(lead: Lead, fields?: (keyof Lead)[]): LeadErrors {
  const errors: LeadErrors = {};
  const keys = fields ?? (Object.keys(validators) as (keyof Lead)[]);
  for (const key of keys) {
    const message = validators[key]?.(lead);
    if (message) errors[key] = message;
  }
  return errors;
}
