/**
 * Copy da home. Editado a partir da biblioteca de copy da CairoPet:
 * só o que ajuda o dono da loja a entender, confiar e agir.
 */

/** Situações reais — cada uma já marca as dores correspondentes no formulário. */
export const SITUATIONS = [
  { text: 'Fez promoção de ração e quase ninguém ficou sabendo.', dores: ['Promoções com pouca repercussão'] },
  {
    text: 'Viu a concorrência aparecer enquanto seu Instagram parou.',
    dores: ['Concorrência aparecendo mais', 'Instagram parado'],
  },
  { text: 'Tem produto encostado no estoque há meses.', dores: ['Produtos encalhados'] },
  { text: 'Depende dos mesmos clientes de sempre.', dores: ['Poucos clientes novos'] },
  {
    text: 'Já contratou agência que entregou post, mas não mostrou impacto nas vendas.',
    dores: ['Marketing sem resultado'],
  },
  {
    text: 'O marketing depende de alguém tirar foto entre um atendimento e outro.',
    dores: ['Quero crescer, mas não sei como estruturar o marketing'],
  },
];

/** O que a especialização já traz vs. o que é estudado em cada loja. */
export const KNOWN = [
  'Qual produto chama atenção',
  'Que oferta movimenta estoque',
  'Que comunicação gera interesse',
  'Que campanha gera conversa',
  'Quais sazonalidades importam',
  'Como chegar em quem mora perto da loja',
];

export const STUDIED = [
  'A comunicação e a presença digital da sua loja',
  'O momento comercial: estoque, promoções, datas fortes',
  'A concorrência na sua cidade',
  'As campanhas que fazem sentido para você',
];

export const FRONTS = [
  {
    n: '01',
    title: 'Estratégia',
    what: 'O que comunicar, quando, para quem e com qual objetivo.',
    for: 'Promoção e estoque entram no planejamento — não só a data comemorativa.',
  },
  {
    n: '02',
    title: 'Conteúdo',
    what: 'Peças, vídeos e campanhas com a cara da sua loja.',
    for: 'A loja aparece com constância, sem depender de alguém lembrar de postar.',
  },
  {
    n: '03',
    title: 'Tráfego pago',
    what: 'Anúncios para quem mora na região da agropecuária.',
    for: 'Sua oferta chega em quem pode passar no seu balcão.',
  },
  {
    n: '04',
    title: 'Campanhas comerciais',
    what: 'Promoções, giro de estoque, sazonalidades e clientes que sumiram.',
    for: 'Produto parado vira pauta; promoção deixa de ser segredo.',
  },
];

/** Objeções + FAQ, sem repetição ("deve ser caro" e "quanto custa" viraram uma só). */
export const QUESTIONS = [
  {
    q: 'Já tive agência e só fizeram post.',
    a: 'Por isso a gente não mede sucesso em curtida. Post é ferramenta, não objetivo: cada ação precisa gerar atenção, conversa ou oportunidade de venda — e você acompanha isso nos relatórios.',
  },
  {
    q: 'Aqui todo mundo já conhece minha loja.',
    a: 'Conhecer não é o mesmo que lembrar na hora de comprar. Se a concorrência aparece para o cliente toda semana e você não, é dela que ele lembra primeiro.',
  },
  {
    q: 'Meu cliente não compra por Instagram.',
    a: 'Ele compra no balcão. Mas é no celular que ele descobre a promoção, lembra do que precisa e decide em qual loja passar.',
  },
  {
    q: 'Vocês nem estão na minha cidade.',
    a: 'Os anúncios são feitos para aparecer na região da sua loja, de onde quer que a campanha seja operada. Quando precisa de material próprio, usamos o que a sua equipe grava ou organizamos a captação conforme o projeto.',
  },
  {
    q: 'Quanto custa?',
    a: 'Depende da cidade, da loja e do trabalho necessário. Por isso o investimento aparece depois da análise, na proposta — e não numa tabela de pacotes igual para todo mundo.',
  },
  {
    q: 'Preciso aparecer em vídeos?',
    a: 'Não necessariamente. Isso depende da estratégia e do formato de produção definido para a sua loja.',
  },
  {
    q: 'Quanto do meu tempo isso toma?',
    a: 'A gente precisa principalmente de informação comercial, aprovações e alinhamento sobre estoque, promoções e prioridades. A execução fica com a equipe CairoPet.',
  },
  {
    q: 'Serve para loja pequena?',
    a: 'Serve para agropecuárias em funcionamento que querem estruturar o marketing e crescer. O tamanho, sozinho, não define se faz sentido.',
  },
  {
    q: 'Atendem pet shop ou loja mista?',
    a: 'Sim, principalmente quando a loja tem operação relevante em pet e agro.',
  },
  {
    q: 'Como acompanho os resultados?',
    a: 'Pelos indicadores das campanhas e pelos relatórios que a CairoPet apresenta.',
  },
];

export const NEXT_STEPS = [
  { n: '01', text: 'Você responde algumas perguntas rápidas sobre a loja.' },
  { n: '02', text: 'A gente confere se a sua cidade está livre e analisa a sua agropecuária.' },
  { n: '03', text: 'Você agenda um briefing e recebe a proposta com escopo e investimento.' },
];
