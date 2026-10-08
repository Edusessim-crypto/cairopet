/**
 * Apresentação comercial (/apresentacao).
 *
 * Slides 01–04: copy transcrita do PPT oficial. v2 (08/10/2026, aprovada pelo Eduardo):
 * saem Diagnóstico, Entrega, Método, Implementação e Dia a dia; entram investimento,
 * contrato sem fidelidade, um slide por plano, comparativo com o mercado, próximos 15 dias
 * e fechamento. Não reescrever nem resumir: mudança de texto só com aprovação.
 * Fotos recortadas do próprio PPT (src/assets/presentation).
 *
 * Títulos aceitam <em> (palavra em cinza, como no PPT) e são renderizados com set:html.
 */
import capaCachorro from '../assets/presentation/capa-cachorro.jpg';
import fundadorJoao from '../assets/presentation/fundador-joao.jpg';
import fundadorEduardo from '../assets/presentation/fundador-eduardo.jpg';
import custoCliente from '../assets/presentation/custo-cliente.jpg';
import custoInstagram from '../assets/presentation/custo-instagram.jpg';
import custoRua from '../assets/presentation/custo-rua.jpg';

/** Ordem dos slides e rótulo de seção ("02 • EXPERIÊNCIA"). Contador, rótulo e ?slide=N saem daqui. */
export const SLIDES = [
  { id: 'capa', label: 'Capa' },
  { id: 'experiencia', label: 'Experiência' },
  { id: 'fundadores', label: 'Os fundadores' },
  { id: 'custo', label: 'O custo' },
  { id: 'verba', label: 'Seu investimento' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'fidelidade', label: 'Contrato' },
  { id: 'plano-presenca', label: 'Planos' },
  { id: 'plano-crescimento', label: 'Planos' },
  { id: 'plano-performance', label: 'Planos' },
  { id: 'mercado', label: 'Comparativo' },
  { id: 'investimento', label: 'Investimento' },
  { id: 'proximos-dias', label: 'Próximos passos' },
  { id: 'fechamento', label: 'Fechamento' },
] as const;

export type SlideId = (typeof SLIDES)[number]['id'];

export const brl = (n: number) => n.toLocaleString('pt-BR');

// 01 ---------------------------------------------------------------------------
export const COVER = {
  tagline: 'Especialistas em marketing para agropecuárias',
  title: ['Sua agropecuária', 'não precisa de', 'mais posts.'],
  highlight: 'Precisa vender mais.',
  text: 'Estratégia, conteúdo e tráfego feitos exclusivamente para agropecuárias.',
  action: 'Conheça nossa apresentação',
  footer: 'CairoPet — Especialistas em marketing para agropecuárias',
  photo: { src: capaCachorro, alt: '' },
};

// 02 ---------------------------------------------------------------------------
interface Stat {
  value: string;
  text: string;
  /** Número que conta ao entrar no slide: {prefix}{to}{suffix}. */
  count?: { prefix?: string; to: number; suffix?: string };
}

export const EXPERIENCE: { title: string; stats: Stat[] } = {
  title: 'Experiência em <em>números</em>.',
  stats: [
    { value: '+300', count: { prefix: '+', to: 300 }, text: 'empresas atendidas' },
    { value: 'Desde 2018', text: 'trabalhando com tráfego, marketing, conteúdo e estratégias para aumentar vendas.' },
    { value: '+8 anos', count: { prefix: '+', to: 8, suffix: ' anos' }, text: 'no mercado' },
    { value: '+R$1 milhão', text: 'em anúncios gerenciados' },
  ],
};

// 03 ---------------------------------------------------------------------------
export const FOUNDERS = {
  title: 'Quem vai cuidar do seu <em>negócio</em>.',
  people: [
    // Fotos originais enviadas pelo usuário, coloridas (exceção aprovada ao P&B em 01/10/2026)
    { name: 'João', role: 'Fundador da CairoPet', photo: fundadorJoao, focus: '62% 38%' },
    { name: 'Eduardo', role: 'Fundador da CairoPet', photo: fundadorEduardo, focus: '74% 50%' },
  ],
  paragraphs: [
    'Trabalhamos com marketing digital, tráfego pago e criação de conteúdos para empresas desde 2018. Foram mais de 300 empresas atendidas nesse período — de criação de conteúdo a gerenciamento de campanhas completas, movimentando mais de R$1 Milhão de reais em anúncios.',
    'Nosso trabalho acontece onde o marketing encontra a venda: não basta postar, aparecer ou deixar o Instagram bonito. <strong>Precisa colocar mais clientes dentro da sua agropecuária.</strong>',
    'Na CairoPet, conteúdo, tráfego e campanhas são pensados como ferramentas para gerar movimento, oportunidades e vendas — <strong>não apenas presença nas redes sociais.</strong>',
  ],
};

// 04 ---------------------------------------------------------------------------
export const COST = {
  title: 'O que um marketing parado <em>custa</em>.',
  items: [
    {
      title: 'O cliente não espera.',
      text: 'Quando ele precisa de ração, medicamento, antipulgas ou qualquer outro produto, ele compra de quem lembra primeiro. Se não lembra da sua agropecuária, compra em outra.',
      photo: custoCliente,
      alt: 'Cliente escolhendo ração na prateleira de uma loja.',
    },
    {
      title: 'Quem não aparece, não é escolhido.',
      text: 'Enquanto sua loja fica em silêncio, outra agropecuária aparece no Instagram, anuncia ofertas e ocupa espaço na cabeça do cliente. Na hora da compra, é dela que ele lembra.',
      photo: custoInstagram,
      alt: 'Celular mostrando um anúncio de ofertas da semana de uma agropecuária no Instagram.',
    },
    {
      title: 'Depender só da rua custa caro.',
      text: 'Sem conteúdo, campanhas e tráfego, sua loja depende de quem passa na frente. Você deixa de alcançar todos os clientes da região que poderiam estar comprando de você.',
      photo: custoRua,
      alt: 'Fachada de uma agropecuária com um carro passando na rua.',
    },
  ],
  statement: ['Não é sobre ter um Instagram.', 'É sobre fazer sua agropecuária ser lembrada, escolhida e vender.'],
};

// 05 ---------------------------------------------------------------------------
/** Mensalidade + verba de anúncios. Não citar valor mínimo de verba. */
export const BUDGET = {
  title: 'Duas partes. <em>Um resultado.</em>',
  sources: [
    { label: 'Mensalidade CairoPet', name: 'Estratégia', text: 'O time que planeja, cria e ajusta toda semana.' },
    { label: 'Verba de anúncios', name: 'Alcance', text: 'Vai direto para Meta e Google, no cartão da sua loja.' },
  ],
  seal: '100% da verba vira anúncio. A gente não toca nesse dinheiro.',
  result: 'Cliente novo no balcão.',
  statement: ['Anúncio sem estratégia queima dinheiro.', 'Estratégia sem anúncio ninguém vê.'],
};

// 06 ---------------------------------------------------------------------------
export const CONTRACT = {
  kicker: 'A pergunta que todo lojista faz:',
  title: 'Quanto tempo eu fico <em>preso</em>?',
  options: ['6 meses', '12 meses', '24 meses'],
};

// 07 ---------------------------------------------------------------------------
export const NO_LOCK_IN = {
  /** Conta de `from` até `value` ao entrar no slide. */
  value: 0,
  from: 24,
  label: 'meses de fidelidade',
  statement: ['Quem fica com a CairoPet fica pelo resultado.', 'Ele prende muito mais do que qualquer contrato.'],
  note: 'Quer sair? Avise com 30 dias. Simples assim.',
};

// 08–10 e 12 -------------------------------------------------------------------
/**
 * Planos (reformulados em 01/10/2026 a pedido do usuário — preços do PPT).
 *
 * Cada plano tem PILARES; cada pilar se desdobra nas ATIVIDADES que já existem
 * dentro do serviço (nada de entrega inventada ou duplicada).
 * Mesmo `key` em um plano seguinte = o pilar EVOLUI (substitui a versão anterior),
 * não soma. Ex.: Google Meu Negócio: atualização inicial → reestruturação → gestão contínua.
 * Pilar que evolui sem `activities` herda as atividades da versão anterior.
 *
 * Slides 08–10 (um por plano, sem preço): promessa, perfil e 4 destaques; os demais
 * pilares viram "Também inclui".
 * Slide 12, card: só os pilares do plano ("Tudo do <anterior>, mais:").
 * "Ver tudo o que está incluso": a soma consolidada, com todas as atividades.
 */
export interface Pillar {
  key: string;
  title: string;
  /** Escopo/quantidade nesta versão (aparece em cinza no card). */
  short?: string;
  /** Escopo por extenso no detalhamento. */
  detail?: string;
  activities?: string[];
}

export interface Plan {
  id: string;
  name: string;
  text: string;
  /** Papel do plano na evolução Presença → Crescimento → Performance. */
  role: string;
  price: string;
  period: string;
  badge?: string;
  /** Plano anterior: "Tudo do <plano>, mais:" */
  extends?: string;
  pillars: Pillar[];
  /** A promessa do plano, numa frase. */
  promise: string;
  /** "Ideal se: …" */
  fit: string;
  /** Exatamente 4. `pillar` = key de um pilar; `from` = valor no plano anterior (conta até `value`). */
  highlights: Highlight[];
  /** Total mensal de contratar por fora (slide 11). Tem que bater com MARKET. */
  market: { monthly: string };
}

export interface Highlight {
  pillar: string;
  value: string;
  label: string;
  from?: number;
}

const CONTEUDO = [
  'Planejamento mensal de pautas',
  'Copy de cada publicação',
  'Design dos criativos',
  'Aprovação com você antes de publicar',
  'Agendamento e publicação',
];

const CONSULTORIA = [
  'Análise do processo de vendas da loja',
  'Alinhamento entre marketing e atendimento',
  'Plano de ação comercial para o período',
];

const ESTRUTURA = [
  'Copy orientada à conversão',
  'Desenvolvimento responsivo (celular e computador)',
  'Integração com WhatsApp e formulário',
  'Configuração de rastreamento de conversões',
];

export const PLANS: { title: string; more: string; plans: Plan[] } = {
  title: 'Tudo isso, <em>num time só</em>.',
  more: 'Ver tudo o que está incluso',
  plans: [
    {
      id: 'presenca',
      name: 'Presença',
      text: 'Para a agropecuária que precisa começar a aparecer com estratégia e consistência.',
      role: 'A base da operação de marketing.',
      price: '597',
      period: '/mês',
      promise: 'Sua loja aparecendo, toda semana, para quem mora perto.',
      fit: 'Ideal se: você ainda não anuncia ou posta sem frequência.',
      highlights: [
        { pillar: 'conteudo', value: '4', label: 'criativos por mês' },
        { pillar: 'trafego', value: 'Local', label: 'anúncio só para quem mora perto da loja' },
        { pillar: 'gmn', value: 'Google', label: 'perfil da loja revisado e atualizado' },
        { pillar: 'relatorio', value: 'Semanal', label: 'relatório em linguagem simples' },
      ],
      market: { monthly: '3.000' },
      pillars: [
        {
          key: 'trafego',
          title: 'Gestão de tráfego pago',
          activities: [
            'Planejamento de mídia e distribuição da verba',
            'Estruturação das campanhas',
            'Segmentação de público na região da loja',
            'Gestão e otimização dos anúncios',
            'Monitoramento de performance',
          ],
        },
        {
          key: 'conteudo',
          title: 'Produção de conteúdo',
          short: '4 criativos/mês',
          detail: '4 criativos estratégicos para Feed/mês',
          activities: CONTEUDO,
        },
        {
          key: 'stories',
          title: 'Stories informativos',
          short: 'até 4/mês',
          detail: 'Até 4 Stories informativos/mês',
          activities: ['Roteiro e design de cada story', 'Divulgação de produtos e novidades da loja'],
        },
        {
          key: 'calendario',
          title: 'Calendário comercial',
          short: 'datas e avisos',
          detail: 'Datas comemorativas e avisos da loja',
          activities: [
            'Mapeamento das datas comerciais do ano',
            'Peças para datas comemorativas',
            'Comunicados de horários, feriados e avisos',
          ],
        },
        {
          key: 'gmn',
          title: 'Google Meu Negócio',
          short: 'atualização inicial',
          detail: 'Atualização inicial do Perfil da Empresa no Google',
          activities: [
            'Revisão do perfil da loja no Google',
            'Padronização de endereço, horários e contatos',
            'Atualização de categorias e fotos',
          ],
        },
        {
          key: 'relatorio',
          title: 'Relatório semanal de resultados',
          activities: [
            'Consolidação dos números da semana',
            'Leitura dos resultados em linguagem simples',
            'Pontos de ajuste para a semana seguinte',
          ],
        },
        {
          key: 'suporte',
          title: 'Suporte via WhatsApp',
          activities: ['Grupo direto com a equipe CairoPet', 'Alinhamentos e aprovações no dia a dia'],
        },
      ],
    },
    {
      id: 'crescimento',
      name: 'Crescimento',
      text: 'Para quem quer transformar presença digital em campanhas, oportunidades e vendas.',
      role: 'Estrutura de aquisição, campanhas, ofertas e apoio comercial.',
      price: '1.197',
      period: '/mês',
      badge: 'Mais escolhido',
      extends: 'presenca',
      promise: 'Ofertas que tiram o cliente de casa e trazem até o balcão.',
      fit: 'Ideal se: você já posta, mas as promoções não geram movimento.',
      highlights: [
        { pillar: 'conteudo', value: '6', from: 4, label: 'criativos por mês' },
        { pillar: 'estrutura', value: 'Página', label: 'própria para as suas campanhas' },
        { pillar: 'ofertas', value: 'Ofertas', label: 'com motivo real para comprar agora' },
        { pillar: 'scripts', value: 'WhatsApp', label: 'scripts para a equipe fechar mais' },
      ],
      market: { monthly: '4.000' },
      pillars: [
        {
          key: 'estrutura',
          title: 'Estrutura digital de conversão',
          short: 'landing page',
          detail: 'Página de conversão para as campanhas (landing page)',
          activities: ['Estrutura estratégica da página', ...ESTRUTURA],
        },
        {
          key: 'ofertas',
          title: 'Estratégia de ofertas e campanhas',
          activities: [
            'Construção de ofertas com motivo real para comprar agora',
            'Escolha dos produtos e condições de cada ação',
            'Planejamento das campanhas promocionais',
            'Divulgação das ofertas no conteúdo e nos anúncios',
          ],
        },
        {
          key: 'consultoria',
          title: 'Consultoria comercial',
          short: '1 por mês',
          detail: '1 consultoria comercial/mês',
          activities: CONSULTORIA,
        },
        {
          key: 'scripts',
          title: 'Scripts de atendimento',
          activities: [
            'Roteiros de resposta para o WhatsApp',
            'Respostas para dúvidas e objeções frequentes',
            'Mensagens de retomada de contato',
          ],
        },
        { key: 'conteudo', title: 'Produção de conteúdo', short: '6 criativos/mês', detail: '6 criativos estratégicos para Feed/mês' },
        { key: 'stories', title: 'Stories informativos', short: 'sem limite*', detail: 'Stories informativos sem limite*' },
        {
          key: 'gmn',
          title: 'Google Meu Negócio',
          short: 'reestruturação',
          detail: 'Reestruturação e otimização do Perfil da Empresa no Google',
          activities: [
            'Otimização completa do perfil',
            'Otimização de categorias, produtos e serviços',
            'Padronização das informações comerciais',
            'Estratégia de presença nas buscas locais',
          ],
        },
      ],
    },
    {
      id: 'performance',
      name: 'Performance',
      text: 'Para a agropecuária que quer uma operação de marketing mais completa, integrada à venda.',
      role: 'Uma operação de marketing e vendas completa.',
      price: '1.997',
      period: '/mês',
      extends: 'crescimento',
      promise: 'Marketing e atendimento trabalhando juntos para vender mais.',
      fit: 'Ideal se: você tem equipe no atendimento e quer crescer com controle.',
      highlights: [
        { pillar: 'conteudo', value: '8', from: 6, label: 'criativos por mês' },
        { pillar: 'estrutura', value: 'Site', label: 'institucional da loja, ligado às campanhas' },
        { pillar: 'atendimento', value: 'Leads', label: 'análise das conversas: onde o cliente se perde' },
        { pillar: 'consultoria', value: '2×', label: 'consultorias comerciais por mês' },
      ],
      market: { monthly: '5.500' },
      pillars: [
        {
          key: 'otimizacao',
          title: 'Estratégia e otimização contínuas',
          activities: [
            'Revisão da estratégia com base em resultado',
            'Testes de criativos, públicos e ofertas',
            'Ajuste de verba e prioridades entre campanhas',
          ],
        },
        {
          key: 'atendimento',
          title: 'Análise do atendimento dos leads',
          activities: [
            'Análise das conversas com os contatos gerados',
            'Identificação de onde os contatos se perdem',
            'Recomendações de melhoria para a equipe',
          ],
        },
        {
          key: 'estrutura',
          title: 'Estrutura digital completa',
          short: 'com site institucional',
          detail: 'Site institucional integrado às páginas de conversão',
          activities: ['Site institucional da loja', 'Páginas de conversão para as campanhas', ...ESTRUTURA],
        },
        { key: 'consultoria', title: 'Consultoria comercial', short: '2 por mês', detail: '2 consultorias comerciais/mês' },
        {
          key: 'gmn',
          title: 'Google Meu Negócio',
          short: 'gestão contínua',
          detail: 'Gestão contínua do Perfil da Empresa no Google',
          activities: [
            'Gestão de conteúdos e atualizações do perfil',
            'Otimização contínua de categorias e serviços',
            'Acompanhamento da presença nas buscas locais',
          ],
        },
        { key: 'conteudo', title: 'Produção de conteúdo', short: '8 criativos/mês', detail: '8 criativos estratégicos para Feed/mês' },
      ],
    },
  ],
};

/** Cadeia do plano até o primeiro: [Presença, Crescimento, Performance]. */
export function planChain(plan: Plan): Plan[] {
  const chain: Plan[] = [plan];
  let current = plan;
  while (current.extends) {
    const parent = PLANS.plans.find((p) => p.id === current.extends);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export interface IncludedPillar extends Pillar {
  activities: string[];
  /** Este pilar é a evolução de uma versão de um plano anterior. */
  evolved: boolean;
}

/**
 * Tudo o que está incluso num plano, sem repetição: cada pilar aparece uma vez,
 * na versão mais alta, dentro da seção do plano que trouxe essa versão.
 */
export function planSections(plan: Plan): { plan: Plan; pillars: IncludedPillar[] }[] {
  const chain = planChain(plan);
  const latest = new Map<string, { from: string; pillar: IncludedPillar }>();
  for (const level of chain) {
    for (const pillar of level.pillars) {
      const prev = latest.get(pillar.key);
      latest.set(pillar.key, {
        from: level.id,
        pillar: { ...pillar, activities: pillar.activities ?? prev?.pillar.activities ?? [], evolved: !!prev },
      });
    }
  }
  return chain.map((level) => ({
    plan: level,
    pillars: level.pillars.filter((p) => latest.get(p.key)?.from === level.id).map((p) => latest.get(p.key)!.pillar),
  }));
}

// 11 ---------------------------------------------------------------------------
/**
 * Quanto custaria montar o mesmo time "por fora" (totais calculados no componente).
 * Fontes:
 * - Gestor de tráfego: agência, conta pequena, R$ 2.000–4.000/mês; freelancer pleno,
 *   R$ 1.500–2.500/mês (Trafius, "Preço de gestor de tráfego em 2026").
 * - Social media: 20% cobram R$ 1.000–1.500 por 12 posts/mês; exemplo de pacote completo
 *   a R$ 2.500/mês (mLabs, Panorama Profissionais de Social Media).
 * - Landing page: freelancer intermediário R$ 900–2.500; agência pequena R$ 2.500–8.000 (Wix Blog).
 * - Site sob medida: de R$ 2.000 a R$ 50.000 (Locaweb, 2026).
 */
export const MARKET = {
  title: 'Montar esse time <em>por fora</em> custaria:',
  text: 'Gestor de tráfego, social media e estrutura digital, cada um contratado separado.',
  /** Por plano: blocos mensais de baixo para cima e o pagamento único, se houver. */
  plans: [
    {
      plan: 'presenca',
      monthly: [
        { name: 'Gestor de tráfego', value: 2000 },
        { name: 'Social media', value: 1000 },
      ],
    },
    {
      plan: 'crescimento',
      monthly: [
        { name: 'Gestor de tráfego', value: 2500 },
        { name: 'Social media', value: 1500 },
      ],
      once: { name: 'landing page', value: 2500 },
    },
    {
      plan: 'performance',
      monthly: [
        { name: 'Gestor de tráfego pleno', value: 3500 },
        { name: 'Social media', value: 2000 },
      ],
      once: { name: 'site institucional', value: 5000 },
    },
  ] as { plan: string; monthly: { name: string; value: number }[]; once?: { name: string; value: number } }[],
  statement: 'E você ainda viraria o gerente de três fornecedores.',
  note: 'Valores de agências e profissionais plenos no Brasil (Trafius, mLabs, Wix, Locaweb). Sem contar Google Meu Negócio, consultorias, scripts e relatórios.',
};

// 13 ---------------------------------------------------------------------------
export const NEXT_DAYS = {
  title: 'Do sim à primeira otimização em <em>15 dias</em>.',
  text: 'Você entra em 3 momentos. O resto é com a gente.',
  who: { voce: 'Você', cairopet: 'CairoPet' },
  milestones: [
    { day: 0, who: 'voce', title: 'Você diz sim', text: 'Contrato, pagamento e grupo no WhatsApp.' },
    { day: 1, who: 'voce', title: 'Você envia os acessos', text: 'Redes sociais e informações da loja.' },
    { day: 3, who: 'cairopet', title: 'Estratégia pronta', text: 'Ofertas e campanhas prioritárias definidas.' },
    { day: 5, who: 'voce', title: 'Você aprova', text: 'Os primeiros conteúdos, pelo grupo do WhatsApp.' },
    { day: 7, who: 'cairopet', title: 'Operação no ar', text: 'Sua loja aparecendo para quem mora perto.' },
    { day: 14, who: 'cairopet', title: 'Primeiro relatório', text: 'Os números da campanha, em linguagem simples.' },
    { day: 15, who: 'cairopet', title: 'Primeira otimização', text: 'Reforço no que trouxe cliente, corte no que não trouxe.' },
  ] as { day: number; who: 'voce' | 'cairopet'; title: string; text: string }[],
  /** Dia que ganha o anel de destaque ao acender. */
  live: 7,
  note: 'Dias úteis, contados a partir do recebimento dos acessos.',
};

// 14 ---------------------------------------------------------------------------
/** Só a exclusividade real (uma loja por cidade). Nada de "últimas vagas". */
export const CLOSING = {
  kicker: 'Exclusividade',
  title: 'Uma agropecuária <em>por cidade</em>.',
  text: 'Quando uma loja fecha com a CairoPet, a cidade fica com ela. A concorrência da região não entra.',
  question: 'Vamos garantir a sua?',
  photo: { src: capaCachorro, alt: '' },
};
