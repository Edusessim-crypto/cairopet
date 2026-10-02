/**
 * Apresentação comercial (/apresentacao).
 *
 * Copy transcrita do PPT oficial "CairoPet_Apresentacao_Comercial.pptx" (10 slides),
 * na mesma ordem. Não reescrever nem resumir: mudança de texto só com aprovação.
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

/** Rótulo de seção de cada slide ("02 • EXPERIÊNCIA"), na ordem do PPT. */
export const SLIDES = [
  { id: 'capa', label: 'Capa' },
  { id: 'experiencia', label: 'Experiência' },
  { id: 'fundadores', label: 'Os fundadores' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'custo', label: 'O custo' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'metodo', label: 'O método' },
  { id: 'implementacao', label: 'Implementação' },
  { id: 'dia-a-dia', label: 'O dia a dia' },
  { id: 'investimento', label: 'Investimento' },
] as const;

export type SlideId = (typeof SLIDES)[number]['id'];

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
export const EXPERIENCE = {
  title: 'Experiência em <em>números</em>.',
  stats: [
    { value: '+300', text: 'empresas atendidas' },
    { value: 'Desde 2018', text: 'trabalhando com tráfego, marketing, conteúdo e estratégias para aumentar vendas.' },
    { value: '+8 anos', text: 'no mercado' },
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
export const DIAGNOSIS = {
  title: 'Vamos olhar para a SUA&nbsp;EMPRESA <em>agora</em>.',
  text: 'Vamos marcar e analisar juntos o que acontece com sua empresa hoje.',
  items: [
    'Pouco movimento',
    'Poucos clientes novos',
    'Instagram parado',
    'Marketing sem resultado',
    'Produtos encalhados',
    'Promoções com pouca repercussão',
    'Concorrência aparecendo mais',
    'Poucas mensagens e pedidos de orçamento',
    'Quero crescer, mas não sei como estruturar o marketing',
  ],
};

// 05 ---------------------------------------------------------------------------
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

// 06 ---------------------------------------------------------------------------
export const DELIVERABLES = {
  title: 'O que você <em>recebe</em>.',
  items: [
    { title: 'Estratégia', text: 'Planejamento de marketing pensado para a realidade, objetivos e momento da sua agropecuária.' },
    { title: 'Conteúdo', text: 'Criativos, copies e conteúdos feitos para chamar atenção, gerar desejo e levar o cliente até a loja.' },
    { title: 'Tráfego pago', text: 'Anúncios para colocar sua agropecuária na frente de quem realmente pode comprar na sua região.' },
    { title: 'Campanhas', text: 'Ações comerciais para datas, produtos, oportunidades e momentos estratégicos de venda.' },
    { title: 'Ofertas', text: 'Construção e comunicação de ofertas que dão ao cliente um motivo real para comprar agora.' },
    { title: 'Otimização', text: 'Acompanhamento do que funciona para ajustar campanhas, conteúdos e decisões com base em resultado.' },
  ],
  statement: ['Não entregamos “posts”.', 'Construímos um marketing pensado para fazer sua agropecuária vender.'],
};

// 07 ---------------------------------------------------------------------------
export const METHOD = {
  title: 'Como <em>será feito</em>.',
  text: 'Do diagnóstico à agropecuária vendendo com estratégia.',
  steps: [
    {
      title: 'Diagnóstico',
      text: 'Primeiro, entendemos a sua agropecuária, a sua cidade, o seu momento e os seus objetivos. O que você vende, para quem vende, como vende hoje e onde estão os gargalos.',
    },
    {
      title: 'Estratégia',
      text: 'Com isso, definimos o plano: posicionamento, linha de comunicação, ofertas, campanhas e o caminho certo para transformar marketing em venda.',
    },
    {
      title: 'Produção',
      text: 'Aqui entra a execução: conteúdos, criativos, copies, campanhas e materiais pensados para chamar atenção, gerar desejo e levar o cliente até a sua loja.',
    },
    {
      title: 'Tráfego e campanhas',
      text: 'Colocamos sua agropecuária na frente das pessoas certas, na sua região, com anúncios e ações comerciais voltadas para gerar alcance, movimento e oportunidade de venda.',
    },
    {
      title: 'Otimização contínua',
      text: 'Acompanhamos o que performa, ajustamos o que for preciso e evoluímos a estratégia com base em resultado — para o marketing não ficar parado e a operação continuar girando.',
    },
  ],
};

// 08 ---------------------------------------------------------------------------
export const IMPLEMENTATION = {
  title: 'Sua agropecuária com o marketing rodando em <em>7 dias úteis</em>.',
  text: 'Do diagnóstico à primeira campanha no ar.',
  days: 7,
  milestones: [
    { day: 1, title: 'Diagnóstico e direcionamento definidos', text: 'Entendemos sua loja, região, público, produtos e objetivos.' },
    { day: 3, title: 'Estratégia e plano de ação prontos', text: 'Definimos posicionamento, comunicação, conteúdos, ofertas e campanhas prioritárias.' },
    { day: 5, title: 'Primeiros conteúdos e campanhas para aprovação', text: 'Criativos, copies e estrutura de anúncios preparados para começar.' },
    { day: 7, title: 'Operação no ar', text: 'Conteúdo organizado, campanhas ativas e sua agropecuária começando a aparecer para quem realmente pode comprar.' },
  ],
  note: [
    'O prazo começa após o recebimento dos acessos, informações e materiais necessários.',
    'A partir daí, a CairoPet assume a estratégia, produção e implantação para colocar sua operação de marketing para rodar.',
  ],
};

// 09 ---------------------------------------------------------------------------
export const DAY_TO_DAY = {
  title: 'Depois que você <em>fecha</em>.',
  steps: [
    { title: 'Contrato e pagamento', text: 'Formalizamos a parceria e liberamos o início da operação.' },
    { title: 'Grupo no WhatsApp', text: 'Criamos um canal direto com a CairoPet para alinhamentos, aprovações e acompanhamento do projeto.' },
    {
      title: 'Briefing e acessos',
      text: 'Você envia as informações da agropecuária, materiais, redes sociais e acessos necessários. É aqui que começamos a mergulhar no negócio.',
    },
    { title: 'Estratégia inicial', text: 'Definimos posicionamento, comunicação, campanhas, ofertas e prioridades para os primeiros conteúdos.' },
    {
      title: 'Produção e ativação',
      text: 'Criamos os primeiros conteúdos, anúncios e campanhas. Após a aprovação, colocamos a operação para rodar.',
    },
    {
      title: 'Rotina e otimização',
      text: 'A partir daí, entramos no ciclo contínuo de produção, campanhas, acompanhamento de resultados e ajustes estratégicos.',
    },
  ],
};

// 10 ---------------------------------------------------------------------------
/**
 * Planos (reformulados em 01/10/2026 a pedido do usuário — preços do PPT).
 *
 * Cada plano tem PILARES; cada pilar se desdobra nas ATIVIDADES que já existem
 * dentro do serviço (nada de entrega inventada ou duplicada).
 * Mesmo `key` em um plano seguinte = o pilar EVOLUI (substitui a versão anterior),
 * não soma. Ex.: Google Meu Negócio: atualização inicial → reestruturação → gestão contínua.
 * Pilar que evolui sem `activities` herda as atividades da versão anterior.
 *
 * Card: só os pilares do plano ("Tudo do <anterior>, mais:").
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
  title: 'Escolha o seu <em>plano</em>.',
  more: 'Ver tudo o que está incluso',
  plans: [
    {
      id: 'presenca',
      name: 'Presença',
      text: 'Para a agropecuária que precisa começar a aparecer com estratégia e consistência.',
      role: 'A base da operação de marketing.',
      price: '597',
      period: '/mês',
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
