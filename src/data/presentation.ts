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
    { name: 'João', role: 'Fundador da CairoPet', photo: fundadorJoao },
    { name: 'Eduardo', role: 'Fundador da CairoPet', photo: fundadorEduardo },
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
export interface Plan {
  id: string;
  name: string;
  text: string;
  price: string;
  period: string;
  badge?: string;
  /** Plano anterior: "Tudo do <plano>, mais:" */
  extends?: string;
  items: string[];
}

export const PLANS: { title: string; more: string; plans: Plan[] } = {
  title: 'Escolha o seu <em>plano</em>.',
  more: 'Ver tudo o que está incluso',
  plans: [
    {
      id: 'presenca',
      name: 'Presença',
      text: 'Para a agropecuária que precisa começar a aparecer com estratégia e consistência.',
      price: '597',
      period: '/mês',
      items: [
        'Gestão de tráfego pago',
        '4 criativos estratégicos para Feed/mês',
        'Até 4 Stories informativos/mês',
        'Datas comemorativas e avisos da loja',
        'Atualização inicial do Google Meu Negócio',
        'Relatório semanal de resultados',
        'Suporte via WhatsApp',
      ],
    },
    {
      id: 'crescimento',
      name: 'Crescimento',
      text: 'Para quem quer transformar presença digital em campanhas, oportunidades e vendas.',
      price: '1.197',
      period: '/mês',
      badge: 'Mais escolhido',
      extends: 'presenca',
      items: [
        '6 criativos estratégicos para Feed/mês',
        'Stories informativos sem limite*',
        'Reestruturação e otimização do Google Meu Negócio',
        'Landing Page incluída',
        '1 consultoria comercial/mês',
        'Scripts de atendimento',
        'Estratégia de ofertas e campanhas',
      ],
    },
    {
      id: 'performance',
      name: 'Performance',
      text: 'Para a agropecuária que quer uma operação de marketing mais completa, integrada à venda.',
      price: '1.997',
      period: '/mês',
      extends: 'crescimento',
      items: [
        '8 criativos estratégicos para Feed/mês',
        'Gestão contínua do Google Meu Negócio',
        'Site institucional incluído',
        '2 consultorias comerciais/mês',
        'Análise do atendimento dos leads',
        'Landing Page incluída',
        'Estratégia e otimização contínuas',
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
