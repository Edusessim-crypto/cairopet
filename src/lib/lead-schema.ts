/**
 * Schema do lead — usado pelo formulário (navegador) e pela rota /api/lead
 * (servidor). Qualquer mudança de campo ou opção deve ser feita aqui.
 *
 * Ordem oficial do formulário (não alterar sem pedido da CairoPet):
 *  1 Nome · 2 WhatsApp · 3 Instagram · 4 Cidade + Estado · 5 Nome da agropecuária
 *  6 Tipo de negócio · 7 Tamanho da operação · 8 Faturamento · 9 Marketing atual
 *  10 Investimento em anúncios · 11 Dores · 12 Objetivo · 13 Momento de contratação
 *  14 Decisor · 15 Faixa de investimento · 16 LGPD (com o envio)
 *  (Contexto adicional e tela de revisão removidos a pedido da CairoPet.)
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

export const TIPO_NEGOCIO_OPTIONS = [
  'Agropecuária',
  'Agropecuária com pet shop',
  'Pet shop com linha agro',
  'Casa de ração',
  'Loja de produtos veterinários',
  'Outro',
] as const;

export const TAMANHO_OPTIONS = [
  'Loja pequena / local',
  'Loja estruturada, com equipe',
  'Loja de médio porte',
  'Loja de grande porte',
  'Mais de uma unidade',
] as const;

/** [AJUSTAR] faixas de faturamento mensal conforme o processo comercial da CairoPet. */
export const FATURAMENTO_OPTIONS = [
  'Até R$ 50 mil',
  'De R$ 50 mil a R$ 150 mil',
  'De R$ 150 mil a R$ 500 mil',
  'De R$ 500 mil a R$ 1 milhão',
  'Acima de R$ 1 milhão',
  'Prefiro não informar',
] as const;

export const MARKETING_OPTIONS = [
  'Eu mesmo',
  'Alguém da loja',
  'Freelancer',
  'Agência',
  'Ninguém cuida hoje',
  'Outro',
] as const;

/** [AJUSTAR] faixas de investimento mensal atual em anúncios. */
export const INVESTIMENTO_ANUNCIOS_OPTIONS = [
  'Não invisto em anúncios',
  'Até R$ 500 por mês',
  'De R$ 500 a R$ 1.500 por mês',
  'De R$ 1.500 a R$ 5.000 por mês',
  'Mais de R$ 5.000 por mês',
  'Não sei informar',
] as const;

export const DORES_OPTIONS = [
  'Pouco movimento',
  'Poucos clientes novos',
  'Instagram parado',
  'Marketing sem resultado',
  'Produtos encalhados',
  'Promoções com pouca repercussão',
  'Concorrência aparecendo mais',
  'Poucas mensagens e pedidos de orçamento',
  'Quero crescer, mas não sei como estruturar o marketing',
] as const;

export const OBJETIVO_OPTIONS = [
  'Aumentar o movimento na loja',
  'Trazer clientes novos',
  'Fazer as promoções chegarem em mais gente',
  'Girar produto parado no estoque',
  'Receber mais mensagens e pedidos',
  'Organizar o marketing da loja',
] as const;

export const MOMENTO_OPTIONS = [
  'Quero começar o quanto antes',
  'Nos próximos 2 ou 3 meses',
  'Estou pesquisando opções',
  'Por enquanto, só quero saber se minha cidade está livre',
] as const;

export const DECISOR_OPTIONS = [
  'Sou eu quem decide',
  'Decido junto com sócio ou família',
  'Outra pessoa decide',
] as const;

/** [AJUSTAR] faixas de investimento total (serviço + anúncios) conforme o comercial. */
export const FAIXA_INVESTIMENTO_OPTIONS = [
  'Até R$ 2.000 por mês',
  'De R$ 2.000 a R$ 4.000 por mês',
  'De R$ 4.000 a R$ 8.000 por mês',
  'Acima de R$ 8.000 por mês',
  'Ainda não sei, quero entender primeiro',
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
  nome: string;
  whatsapp: string;
  instagram: string;
  cidade: string;
  uf: string;
  loja: string;
  tipo_negocio: string;
  tamanho: string;
  faturamento: string;
  marketing_atual: string;
  investimento_anuncios: string;
  dores: string[];
  objetivo: string;
  momento: string;
  decisor: string;
  faixa_investimento: string;
  contexto: string;
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

/** "@loja", "instagram.com/loja/" ou "loja" → "@loja". Sites ficam como estão. */
export function normalizeInstagram(v: string): string {
  const t = v.trim();
  if (!t) return '';
  const m = t.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (m) return `@${m[1]}`;
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(t)) return `@${t.replace(/^@/, '')}`;
  return t;
}

export const firstName = (nome: string) => nome.trim().split(/\s+/)[0] ?? '';

const oneOf = (value: string, options: readonly string[]) => options.includes(value);
const choose = (options: readonly string[], message: string) => (value: string) =>
  oneOf(value, options) ? null : message;

/** Validação por campo — mensagens escritas para o dono da loja, não para dev. */
export const validators: Partial<Record<keyof Lead, (lead: Lead) => string | null>> = {
  nome: (l) => (l.nome.length >= 2 ? null : 'Escreva seu nome para a gente saber com quem vai falar.'),
  whatsapp: (l) => {
    const d = normalizeWhatsapp(l.whatsapp);
    return d.length === 10 || d.length === 11 ? null : 'Informe o WhatsApp com DDD. Ex.: (34) 99999-9999';
  },
  cidade: (l) => (l.cidade.length >= 2 ? null : 'Informe a cidade da sua agropecuária.'),
  uf: (l) => (oneOf(l.uf, UFS.map(([uf]) => uf)) ? null : 'Escolha o estado.'),
  loja: (l) => (l.loja.length >= 2 ? null : 'Informe o nome da agropecuária.'),
  tipo_negocio: (l) => choose(TIPO_NEGOCIO_OPTIONS, 'Escolha o tipo de negócio.')(l.tipo_negocio),
  tamanho: (l) => choose(TAMANHO_OPTIONS, 'Escolha a opção mais próxima da sua operação.')(l.tamanho),
  faturamento: (l) => choose(FATURAMENTO_OPTIONS, 'Escolha uma faixa — ou "Prefiro não informar".')(l.faturamento),
  marketing_atual: (l) => choose(MARKETING_OPTIONS, 'Escolha quem cuida do marketing hoje.')(l.marketing_atual),
  investimento_anuncios: (l) =>
    choose(INVESTIMENTO_ANUNCIOS_OPTIONS, 'Escolha a opção mais próxima.')(l.investimento_anuncios),
  dores: (l) =>
    l.dores.length > 0 && l.dores.every((d) => oneOf(d, DORES_OPTIONS)) ? null : 'Marque pelo menos uma opção.',
  objetivo: (l) => choose(OBJETIVO_OPTIONS, 'Escolha o que você mais quer melhorar.')(l.objetivo),
  momento: (l) => choose(MOMENTO_OPTIONS, 'Escolha a opção que mais combina com o seu momento.')(l.momento),
  decisor: (l) => choose(DECISOR_OPTIONS, 'Escolha quem decide a contratação.')(l.decisor),
  faixa_investimento: (l) =>
    choose(FAIXA_INVESTIMENTO_OPTIONS, 'Escolha uma faixa — pode ser "Ainda não sei".')(l.faixa_investimento),
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
    nome: str(raw.nome, 80),
    whatsapp: str(raw.whatsapp, 30),
    instagram: normalizeInstagram(str(raw.instagram, 200)),
    cidade: str(raw.cidade, 80),
    uf: str(raw.uf, 2).toUpperCase(),
    loja: str(raw.loja, 120),
    tipo_negocio: str(raw.tipo_negocio),
    tamanho: str(raw.tamanho),
    faturamento: str(raw.faturamento),
    marketing_atual: str(raw.marketing_atual),
    investimento_anuncios: str(raw.investimento_anuncios),
    dores: list(raw.dores),
    objetivo: str(raw.objetivo),
    momento: str(raw.momento),
    decisor: str(raw.decisor),
    faixa_investimento: str(raw.faixa_investimento),
    contexto: str(raw.contexto, 1000),
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
