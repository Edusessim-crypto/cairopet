/**
 * CAIROPET — SISTEMA DE LEADS V3
 *
 * Formulário atualizado
 * Classificação automática
 * Faturamento mínimo: R$ 50.000
 * Notificações por e-mail (na hora ou em fila — ver instalarAvisos)
 * Proteção contra duplicidades
 *
 * ABA ANTIGA: Leads
 * ABA NOVA: Novos contatos
 *
 * Propriedades do script (Configurações do projeto → Propriedades do script):
 *   TOKEN                = senha usada na URL do webhook (?token=...)
 *   NOTIFICATION_EMAILS  = e-mail(s) que recebem o aviso de lead, separados por vírgula
 *   AVISOS_*             = criadas automaticamente pelo script (não mexer)
 *
 * VELOCIDADE DO ENVIO (automático, nada para rodar):
 *   No primeiro lead, o script liga sozinho a fila de avisos: o lead é salvo e
 *   confirmado na hora, e o e-mail sai em até 1 minuto — o site não espera mais
 *   o e-mail para mostrar o "obrigado". Se o Google não permitir, o e-mail
 *   continua saindo na hora (como antes) e o script tenta de novo no dia seguinte.
 *   Para voltar ao e-mail imediato de vez: executar desinstalarAvisos.
 *
 * Depois de editar: Implantar → Gerenciar implantações → editar → Nova versão
 * (a URL continua a mesma).
 */

const CAIRO_CONFIG = {
  SHEET_NAME: 'Novos contatos',
  TIMEZONE: 'America/Sao_Paulo',
  FATURAMENTO_MINIMO: 50000,
  NOME_REMETENTE: 'CairoPet Leads'
};

const CAIRO_HEADERS = [
  'Recebido em',
  'Agropecuária',
  'Cidade',
  'UF',
  'Tipo de negócio',
  'Faturamento',
  'Dores',
  'Momento',
  'Decisor',
  'Nome',
  'WhatsApp',
  'Link WhatsApp',
  'Instagram',
  'Perfil financeiro',
  'Classificação',
  'Pontuação',
  'Motivo da classificação',
  'LGPD aceita',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'Página de entrada',
  'Origem (referrer)',
  'ID do envio'
];

/**
 * RECEBE OS LEADS
 */

function doPost(e) {

  // Uma leitura só das propriedades (token + fila de avisos).
  const props = PropertiesService
    .getScriptProperties()
    .getProperties();

  const token = props.TOKEN;

  if (
    !token ||
    !e ||
    !e.parameter ||
    e.parameter.token !== token
  ) {
    return respostaJson_({
      ok: false,
      error: 'unauthorized'
    });
  }

  let payload;

  try {

    payload = JSON.parse(
      e.postData && e.postData.contents
    );

    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      return respostaJson_({
        ok: false,
        error: 'invalid_payload'
      });
    }

  } catch (error) {

    console.error('JSON inválido:', error);

    return respostaJson_({
      ok: false,
      error: 'invalid_json'
    });

  }

  let lead;

  try {

    lead = normalizarLead_(payload);

    if (
      !lead.nome ||
      !lead.whatsapp ||
      !lead.agropecuaria
    ) {

      console.error(
        'Payload incompleto. Verificar campos.'
      );

      return respostaJson_({
        ok: false,
        error: 'missing_required_fields'
      });

    }

  } catch (error) {

    console.error(
      'Erro ao normalizar lead:',
      error
    );

    return respostaJson_({
      ok: false,
      error: 'invalid_payload'
    });

  }

  const lock = LockService.getScriptLock();

  let bloqueado = false;

  try {

    lock.waitLock(20000);

    bloqueado = true;

  } catch (error) {

    return respostaJson_({
      ok: false,
      error: 'lock_timeout'
    });

  }

  let classificacao;

  try {

    const sheet = obterAbaLeads_();

    const headers = garantirCabecalhos_(sheet);

    if (
      lead.eventId &&
      jaRegistrado_(
        sheet,
        headers,
        lead.eventId
      )
    ) {

      return respostaJson_({
        ok: true,
        duplicate: true
      });

    }

    classificacao = classificarLead_(lead);

    const dados = montarDadosDaLinha_(
      lead,
      classificacao
    );

    const row = headers.map(
      titulo => protegerCelula_(dados[titulo])
    );

    // SALVA PRIMEIRO (appendRow já grava; sem flush para não atrasar a resposta)

    sheet.appendRow(row);

  } catch (error) {

    console.error(
      'Erro ao salvar lead:',
      error
    );

    return respostaJson_({
      ok: false,
      error: 'save_error'
    });

  } finally {

    if (bloqueado) {
      lock.releaseLock();
    }

  }

  // NOTIFICA DEPOIS — fora da trava, para não segurar outros envios.
  // Com a fila ligada, o site não espera o e-mail.

  const filaLigada =
    props.AVISOS_EM_FILA === '1' ||
    ligarFilaAutomaticamente_(props);

  const enfileirado =
    filaLigada &&
    enfileirarAviso_(lead, classificacao);

  if (!enfileirado) {

    try {

      notificarNovoLead_(
        lead,
        classificacao
      );

    } catch (erroEmail) {

      console.error(
        'Lead salvo, mas e-mail falhou:',
        erroEmail
      );

    }

  }

  return respostaJson_({
    ok: true
  });

}

/**
 * VERIFICAÇÃO DO SERVIÇO
 * O site também chama isto (sem gravar nada) para "acordar" o script
 * quando a pessoa chega na última etapa do formulário.
 */

function doGet() {

  return respostaJson_({
    ok: true,
    service: 'leads-cairopet'
  });

}

/**
 * BUSCA VALORES NO PAYLOAD
 */

function primeiro_(obj, caminhos, fallback) {

  for (let i = 0; i < caminhos.length; i++) {

    const valor = caminhos[i]
      .split('.')
      .reduce(
        (atual, parte) =>
          atual != null
            ? atual[parte]
            : undefined,
        obj
      );

    if (
      valor !== undefined &&
      valor !== null &&
      valor !== ''
    ) {
      return valor;
    }

  }

  return fallback === undefined
    ? ''
    : fallback;

}

/**
 * NORMALIZA OS DADOS
 */

function normalizarLead_(p) {

  const nome = texto_(primeiro_(p, [
    'contato.nome',
    'nome',
    'contact.name',
    'name'
  ]));

  const whatsapp = texto_(primeiro_(p, [
    'contato.whatsapp',
    'whatsapp',
    'telefone',
    'contact.phone'
  ]));

  const numeroE164 = telefoneE164_(
    primeiro_(p, [
      'contato.whatsapp_e164',
      'whatsapp_e164',
      'whatsappE164'
    ], whatsapp)
  );

  const brutoDores = primeiro_(p, [
    'qualificacao.dores',
    'dores',
    'dificuldades',
    'qualificacao.dificuldades',
    'principais_dificuldades'
  ]);

  const dores = Array.isArray(brutoDores)
    ? brutoDores.map(texto_).filter(Boolean)
    : (
        texto_(brutoDores)
          ? [texto_(brutoDores)]
          : []
      );

  const dataRecebida = primeiro_(p, [
    'recebido_em',
    'recebidoEm'
  ]);

  const tentativaData = dataRecebida
    ? new Date(dataRecebida)
    : new Date();

  const dataValida = isNaN(
    tentativaData.getTime()
  )
    ? new Date()
    : tentativaData;

  const origem = {

    utm_source: texto_(primeiro_(p, [
      'origem.utm_source',
      'utm_source'
    ])),

    utm_medium: texto_(primeiro_(p, [
      'origem.utm_medium',
      'utm_medium'
    ])),

    utm_campaign: texto_(primeiro_(p, [
      'origem.utm_campaign',
      'utm_campaign'
    ])),

    utm_content: texto_(primeiro_(p, [
      'origem.utm_content',
      'utm_content'
    ])),

    utm_term: texto_(primeiro_(p, [
      'origem.utm_term',
      'utm_term'
    ])),

    fbclid: texto_(primeiro_(p, [
      'origem.fbclid',
      'fbclid'
    ])),

    gclid: texto_(primeiro_(p, [
      'origem.gclid',
      'gclid'
    ])),

    landing_page: texto_(primeiro_(p, [
      'origem.landing_page',
      'landing_page'
    ])),

    referrer: texto_(primeiro_(p, [
      'origem.referrer',
      'referrer'
    ]))

  };

  return {

    recebidoEm: Utilities.formatDate(
      dataValida,
      CAIRO_CONFIG.TIMEZONE,
      'dd/MM/yyyy HH:mm:ss'
    ),

    nome: nome,

    whatsapp: whatsapp,

    whatsappE164: numeroE164,

    linkWhatsApp: numeroE164
      ? 'https://wa.me/' + numeroE164
      : '',

    instagram: texto_(primeiro_(p, [
      'loja.instagram',
      'instagram',
      'instagram_loja'
    ])),

    cidade: texto_(primeiro_(p, [
      'loja.cidade',
      'cidade'
    ])),

    uf: texto_(primeiro_(p, [
      'loja.uf',
      'uf',
      'estado'
    ])),

    agropecuaria: texto_(primeiro_(p, [
      'loja.nome',
      'agropecuaria',
      'nome_agropecuaria',
      'nome_loja',
      'empresa'
    ])),

    // O site manda em loja.tipo_estabelecimento. Não usar o campo "tipo" da raiz:
    // nele vem "lead_site_cairopet" (identificador do envio), não o tipo da loja.
    tipo: texto_(primeiro_(p, [
      'loja.tipo_estabelecimento',
      'loja.tipo_negocio',
      'tipo_estabelecimento',
      'tipo_negocio'
    ])),

    tamanho: texto_(primeiro_(p, [
      'loja.tamanho',
      'tamanho'
    ])),

    faturamento: texto_(primeiro_(p, [
      'loja.faturamento',
      'loja.faturamento_mensal',
      'qualificacao.faturamento',
      'faturamento',
      'faturamento_mensal',
      'faturamentoMensal'
    ])),

    marketingAtual: texto_(primeiro_(p, [
      'qualificacao.marketing_atual',
      'marketing_atual'
    ])),

    investimentoAnuncios: texto_(primeiro_(p, [
      'qualificacao.investimento_anuncios',
      'investimento_anuncios'
    ])),

    dores: dores,

    objetivo: texto_(primeiro_(p, [
      'qualificacao.objetivo',
      'objetivo'
    ])),

    momento: texto_(primeiro_(p, [
      'qualificacao.momento',
      'qualificacao.urgencia',
      'momento',
      'urgencia',
      'prazo_contratacao'
    ])),

    decisor: texto_(primeiro_(p, [
      'qualificacao.decisor',
      'qualificacao.poder_decisao',
      'decisor',
      'poder_decisao',
      'responsavel_contratacao'
    ])),

    faixaInvestimento: texto_(primeiro_(p, [
      'qualificacao.faixa_investimento',
      'faixa_investimento'
    ])),

    contexto: texto_(primeiro_(p, [
      'qualificacao.contexto',
      'contexto'
    ])),

    lgpd: primeiro_(p, [
      'consentimento_lgpd.aceito',
      'lgpd_aceita',
      'lgpd_aceito'
    ], null),

    origem: origem,

    eventId: texto_(primeiro_(p, [
      'origem.event_id',
      'origem.eventId',
      'event_id',
      'eventId'
    ]))

  };

}

/**
 * UTILITÁRIOS
 */

function texto_(valor) {

  return valor === null ||
    valor === undefined
    ? ''
    : String(valor).trim();

}

function telefoneE164_(numero) {

  const digitos = texto_(numero)
    .replace(/\D/g, '');

  if (
    (digitos.length === 12 ||
      digitos.length === 13) &&
    digitos.startsWith('55')
  ) {
    return digitos;
  }

  if (
    digitos.length === 10 ||
    digitos.length === 11
  ) {
    return '55' + digitos;
  }

  return '';

}

function semAcentos_(valor) {

  return texto_(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

}

/**
 * QUALIFICAÇÃO FINANCEIRA
 */

function perfilFinanceiro_(faixa) {

  const s = semAcentos_(faixa);

  if (
    !s ||
    /prefiro|nao inform|nao sei|indefin|nao declarado/.test(s)
  ) {
    return 'INDETERMINADO';
  }

  const exp =
    /(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*(milhoes|milhao|mil|k)?/g;

  const achados = [];

  let match;

  while ((match = exp.exec(s)) !== null) {

    const numero = match[1];
    const unidade = match[2] || '';

    let valor;

    if (unidade) {

      valor = Number(
        numero
          .replace(/\./g, '')
          .replace(',', '.')
      ) * (
        /milhao/.test(unidade)
          ? 1000000
          : 1000
      );

    } else {

      valor = Number(
        numero
          .replace(/\./g, '')
          .replace(',', '.')
      );

    }

    if (isFinite(valor)) {
      achados.push(valor);
    }

  }

  if (achados.length === 0) {
    return 'INDETERMINADO';
  }

  if (
    /\bmil\b|\bk\b/.test(s) &&
    achados.some(n => n >= 1000)
  ) {

    for (let i = 0; i < achados.length; i++) {

      if (achados[i] < 1000) {
        achados[i] *= 1000;
      }

    }

  }

  const minimo =
    CAIRO_CONFIG.FATURAMENTO_MINIMO;

  const menor = Math.min.apply(null, achados);
  const maior = Math.max.apply(null, achados);

  const abaixo =
    /menos de|abaixo de|inferior a/.test(s);

  const ate =
    /\bate\b|no maximo/.test(s);

  const acima =
    /acima de|mais de|a partir de|no minimo|ou mais|\+/.test(s);

  if (abaixo) {
    return maior <= minimo
      ? 'ABAIXO'
      : 'INDETERMINADO';
  }

  if (ate) {
    return maior < minimo
      ? 'ABAIXO'
      : 'INDETERMINADO';
  }

  if (acima) {
    return menor >= minimo
      ? 'DENTRO'
      : 'INDETERMINADO';
  }

  if (menor >= minimo) {
    return 'DENTRO';
  }

  if (maior < minimo) {
    return 'ABAIXO';
  }

  return 'INDETERMINADO';

}

/**
 * URGÊNCIA
 */

function tipoDeUrgencia_(resposta) {

  const s = semAcentos_(resposta);

  if (
    /quanto antes|imediat|agora|urgente|esta semana|o mais rapido/.test(s)
  ) {
    return 'IMEDIATA';
  }

  if (
    /30 dias|proximo mes|ate um mes|ate 1 mes|em um mes/.test(s)
  ) {
    return 'ATE_30_DIAS';
  }

  if (
    /2 ou 3|dois ou tres|2 meses|3 meses|60 dias|90 dias|futuramente/.test(s)
  ) {
    return 'FUTURA';
  }

  if (
    /pesquis|avali|nao sei|indefin|sem previsao/.test(s)
  ) {
    return 'PESQUISANDO';
  }

  return 'NAO_INFORMADA';

}

/**
 * PODER DE DECISÃO
 */

function tipoDeDecisor_(resposta) {

  const s = semAcentos_(resposta);

  if (
    /decido junto|junto com|outra pessoa|compartilh|com socios|socios/.test(s)
  ) {
    return 'CONJUNTO';
  }

  if (
    /nao,|nao sou|participo|influenc/.test(s)
  ) {
    return 'PARTICIPANTE';
  }

  if (
    /sou o propriet|sou a propriet|proprietari|sou o dono|sou a dona|responsavel pelas contrat|sou responsavel|eu decido|^sim$/.test(s)
  ) {
    return 'DECISOR';
  }

  return 'NAO_INFORMADO';

}

/**
 * TIPO DE ESTABELECIMENTO
 */

function tipoDeEstabelecimento_(resposta) {

  const s = semAcentos_(resposta);

  if (
    /agropecu|casa de racao|casa de racoes/.test(s)
  ) {
    return 'COMPATIVEL';
  }

  return 'AVALIAR';

}

/**
 * CLASSIFICAÇÃO AUTOMÁTICA
 */

function classificarLead_(lead) {

  const perfil = perfilFinanceiro_(
    lead.faturamento
  );

  const urgencia = tipoDeUrgencia_(
    lead.momento
  );

  const decisor = tipoDeDecisor_(
    lead.decisor
  );

  const estabelecimento =
    tipoDeEstabelecimento_(lead.tipo);

  let pontos = 0;

  if (perfil === 'DENTRO') {
    pontos += 40;
  }

  if (urgencia === 'IMEDIATA') {
    pontos += 30;
  } else if (urgencia === 'ATE_30_DIAS') {
    pontos += 25;
  } else if (urgencia === 'FUTURA') {
    pontos += 10;
  }

  if (decisor === 'DECISOR') {
    pontos += 20;
  } else if (decisor === 'CONJUNTO') {
    pontos += 12;
  } else if (decisor === 'PARTICIPANTE') {
    pontos += 5;
  }

  if (estabelecimento === 'COMPATIVEL') {
    pontos += 10;
  }

  let classe;
  let motivo;

  if (perfil === 'ABAIXO') {

    classe = 'ABAIXO DO PERFIL FINANCEIRO';

    motivo =
      'Faturamento inferior a R$ 50 mil/mês.';

  } else if (perfil === 'INDETERMINADO') {

    classe = 'EM AVALIAÇÃO';

    motivo =
      'Faturamento não informado ou indeterminado.';

  } else if (estabelecimento !== 'COMPATIVEL') {

    classe = 'EM AVALIAÇÃO';

    motivo =
      'Confirmar tipo de estabelecimento.';

  } else if (
    decisor === 'DECISOR' &&
    (
      urgencia === 'IMEDIATA' ||
      urgencia === 'ATE_30_DIAS'
    )
  ) {

    classe = 'QUENTE';

    motivo =
      'Faturamento compatível, decisor direto e intenção de começar em até 30 dias.';

  } else {

    classe = 'MORNO';

    motivo =
      'Faturamento compatível; acompanhar prazo ou responsável pela decisão.';

  }

  return {
    perfil: perfil,
    classe: classe,
    pontos: pontos,
    motivo: motivo
  };

}

/**
 * ORGANIZA DADOS PARA A PLANILHA
 */

function montarDadosDaLinha_(lead, resultado) {

  return {

    'Recebido em': lead.recebidoEm,

    'Agropecuária': lead.agropecuaria,

    'Cidade': lead.cidade,

    'UF': lead.uf,

    'Tipo de negócio': lead.tipo,

    'Faturamento': lead.faturamento,

    'Dores': lead.dores.join(' | '),

    'Momento': lead.momento,

    'Decisor': lead.decisor,

    'Nome': lead.nome,

    'WhatsApp': lead.whatsapp,

    'Link WhatsApp': lead.linkWhatsApp,

    'Instagram': lead.instagram,

    'Perfil financeiro': resultado.perfil,

    'Classificação': resultado.classe,

    'Pontuação': resultado.pontos,

    'Motivo da classificação': resultado.motivo,

    'LGPD aceita':
      lead.lgpd === null
        ? ''
        : (
            /^(true|1|sim|yes|aceito)$/i.test(
              String(lead.lgpd)
            )
              ? 'Sim'
              : 'Não'
          ),

    'utm_source': lead.origem.utm_source,

    'utm_medium': lead.origem.utm_medium,

    'utm_campaign': lead.origem.utm_campaign,

    'utm_content': lead.origem.utm_content,

    'utm_term': lead.origem.utm_term,

    'fbclid': lead.origem.fbclid,

    'gclid': lead.origem.gclid,

    'Página de entrada':
      lead.origem.landing_page,

    'Origem (referrer)':
      lead.origem.referrer,

    'ID do envio': lead.eventId

  };

}

/**
 * PROTEGE CONTRA FÓRMULAS INDEVIDAS
 */

function protegerCelula_(valor) {

  if (
    valor === undefined ||
    valor === null
  ) {
    return '';
  }

  if (
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return valor;
  }

  const texto = String(valor);

  return /^\s*[=+\-@]/.test(texto)
    ? "'" + texto
    : texto;

}

/**
 * LOCALIZA A ABA NOVOS CONTATOS
 */

function obterAbaLeads_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Script não vinculado à planilha.'
    );
  }

  const aba = ss.getSheetByName(
    CAIRO_CONFIG.SHEET_NAME
  );

  if (!aba) {
    throw new Error(
      'Aba Novos contatos não encontrada.'
    );
  }

  return aba;

}

/**
 * VERIFICA CABEÇALHOS
 */

function garantirCabecalhos_(sheet) {

  if (sheet.getLastRow() === 0) {

    garantirQuantidadeColunas_(
      sheet,
      CAIRO_HEADERS.length
    );

    sheet
      .getRange(
        1,
        1,
        1,
        CAIRO_HEADERS.length
      )
      .setValues([CAIRO_HEADERS]);

    sheet.setFrozenRows(1);

    sheet
      .getRange(
        1,
        1,
        1,
        CAIRO_HEADERS.length
      )
      .setFontWeight('bold');

    return CAIRO_HEADERS.slice();

  }

  const quantidade = Math.max(
    sheet.getLastColumn(),
    1
  );

  const headers = sheet
    .getRange(1, 1, 1, quantidade)
    .getValues()[0]
    .map(valor => texto_(valor));

  const faltantes = CAIRO_HEADERS.filter(
    header => headers.indexOf(header) === -1
  );

  if (faltantes.length) {

    const primeiraColunaNova =
      headers.length + 1;

    garantirQuantidadeColunas_(
      sheet,
      headers.length + faltantes.length
    );

    sheet
      .getRange(
        1,
        primeiraColunaNova,
        1,
        faltantes.length
      )
      .setValues([faltantes]);

    sheet
      .getRange(
        1,
        primeiraColunaNova,
        1,
        faltantes.length
      )
      .setFontWeight('bold');

    headers.push.apply(
      headers,
      faltantes
    );

  }

  return headers;

}

/**
 * GARANTE COLUNAS SUFICIENTES
 */

function garantirQuantidadeColunas_(
  sheet,
  minimo
) {

  const disponiveis =
    sheet.getMaxColumns();

  if (disponiveis < minimo) {

    sheet.insertColumnsAfter(
      disponiveis,
      minimo - disponiveis
    );

  }

}

/**
 * VERIFICA DUPLICIDADES
 */

function jaRegistrado_(sheet, headers, id) {

  const idColuna =
    headers.indexOf('ID do envio') + 1;

  if (!idColuna) {
    throw new Error(
      'Coluna ID do envio não encontrada.'
    );
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const encontrados = sheet
    .getRange(
      2,
      idColuna,
      lastRow - 1,
      1
    )
    .createTextFinder(String(id))
    .matchEntireCell(true)
    .findNext();

  return encontrados !== null;

}

/**
 * FILA DE AVISOS (e-mail fora do envio)
 *
 * Cada aviso pendente vira uma propriedade do script (AVISO_...). Um gatilho
 * de 1 em 1 minuto (processarAvisos) envia e apaga. Se não for possível
 * enfileirar, o doPost manda o e-mail na hora, como antes.
 */

function enfileirarAviso_(lead, classificacao) {

  try {

    const chave =
      'AVISO_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 8);

    PropertiesService
      .getScriptProperties()
      .setProperty(
        chave,
        JSON.stringify({
          lead: lead,
          classificacao: classificacao
        })
      );

    return true;

  } catch (error) {

    console.error(
      'Não foi possível enfileirar o aviso:',
      error
    );

    return false;

  }

}

/**
 * Liga a fila sozinho (no máximo 1 tentativa por dia, para não atrasar todo
 * envio se faltar autorização). Respeita quem desligou com desinstalarAvisos.
 */

function ligarFilaAutomaticamente_(props) {

  if (props.AVISOS_DESLIGADOS === '1') {
    return false;
  }

  const hoje = Utilities.formatDate(
    new Date(),
    CAIRO_CONFIG.TIMEZONE,
    'yyyy-MM-dd'
  );

  if (props.AVISOS_TENTATIVA === hoje) {
    return false;
  }

  try {

    PropertiesService
      .getScriptProperties()
      .setProperty('AVISOS_TENTATIVA', hoje);

    instalarAvisos();

    return true;

  } catch (error) {

    console.error(
      'Fila de avisos não ligada (e-mail segue na hora):',
      error
    );

    return false;

  }

}

/**
 * Rodado pelo gatilho a cada minuto: envia os avisos pendentes
 * (cada um no máximo uma vez).
 */

function processarAvisos() {

  // Trava própria (não a do doPost), para não atrasar envios do site.
  const lock = LockService.getDocumentLock();

  if (!lock.tryLock(1000)) {
    return;
  }

  try {

    const props =
      PropertiesService.getScriptProperties();

    const todas = props.getProperties();

    Object.keys(todas)
      .filter(chave => chave.indexOf('AVISO_') === 0)
      .sort()
      .forEach(chave => {

        props.deleteProperty(chave);

        try {

          const aviso = JSON.parse(todas[chave]);

          notificarNovoLead_(
            aviso.lead,
            aviso.classificacao
          );

        } catch (error) {

          console.error(
            'Aviso não enviado:',
            chave,
            error
          );

        }

      });

  } finally {

    lock.releaseLock();

  }

}

/**
 * Liga a fila de avisos (gatilho de 1 em 1 minuto). O doPost chama sozinho;
 * também pode ser rodado no editor. Rodar de novo não duplica o gatilho.
 */

function instalarAvisos() {

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processarAvisos')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('processarAvisos')
    .timeBased()
    .everyMinutes(1)
    .create();

  const props =
    PropertiesService.getScriptProperties();

  props.setProperty('AVISOS_EM_FILA', '1');

  props.deleteProperty('AVISOS_DESLIGADOS');

  console.log(
    'Fila de avisos ligada: os e-mails saem em até 1 minuto.'
  );

}

/**
 * Volta ao e-mail imediato: desliga o gatilho
 * e envia o que estiver pendente.
 */

function desinstalarAvisos() {

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processarAvisos')
    .forEach(t => ScriptApp.deleteTrigger(t));

  const props =
    PropertiesService.getScriptProperties();

  props.deleteProperty('AVISOS_EM_FILA');

  props.setProperty('AVISOS_DESLIGADOS', '1');

  processarAvisos();

  console.log(
    'Fila de avisos desligada: os e-mails voltam a sair na hora.'
  );

}

/**
 * NOTIFICAÇÃO POR E-MAIL
 */

function notificarNovoLead_(lead, resultado) {

  const emails = PropertiesService
    .getScriptProperties()
    .getProperty('NOTIFICATION_EMAILS');

  if (!emails) {

    console.log(
      'E-mails não configurados.'
    );

    return;

  }

  const rotulo =
    resultado.classe === 'QUENTE'
      ? '🔥 LEAD QUENTE'
      : resultado.classe === 'MORNO'
        ? '🟡 LEAD MORNO'
        : resultado.classe ===
          'ABAIXO DO PERFIL FINANCEIRO'
          ? '⚪ ABAIXO DO PERFIL'
          : '🔵 LEAD EM AVALIAÇÃO';

  const assunto = (
    rotulo +
    ' — ' +
    lead.agropecuaria
  )
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 180);

  const linha = (campo, valor) => {

    if (!valor && valor !== 0) {
      return '';
    }

    return `
      <tr>
        <td style="
          padding:11px 10px;
          border-bottom:1px solid #eee;
          color:#777;
          width:40%;
        ">
          ${escaparHtml_(campo)}
        </td>

        <td style="
          padding:11px 0;
          border-bottom:1px solid #eee;
          font-weight:600;
        ">
          ${escaparHtml_(valor)}
        </td>
      </tr>
    `;

  };

  const tabela = [

    linha(
      'WhatsApp',
      lead.whatsapp
    ),

    linha(
      'Instagram',
      lead.instagram
    ),

    linha(
      'Tipo de negócio',
      lead.tipo
    ),

    linha(
      'Faturamento',
      lead.faturamento || 'Não informado'
    ),

    linha(
      'Perfil financeiro',
      resultado.perfil
    ),

    linha(
      'Urgência',
      lead.momento || 'Não informada'
    ),

    linha(
      'Poder de decisão',
      lead.decisor || 'Não informado'
    ),

    linha(
      'Pontuação comercial',
      resultado.pontos + '/100'
    ),

    linha(
      'Dificuldades',
      lead.dores.join(' • ')
    ),

    linha(
      'Origem',
      lead.origem.utm_source || 'Direto'
    ),

    linha(
      'Campanha',
      lead.origem.utm_campaign
    )

  ].join('');

  const botao = lead.linkWhatsApp
    ? `
      <p style="margin-top:28px;">
        <a
          href="${escaparHtml_(lead.linkWhatsApp)}"
          style="
            display:block;
            background:#111;
            color:#fff;
            text-decoration:none;
            text-align:center;
            padding:15px;
            border-radius:8px;
            font-weight:bold;
          "
        >
          Chamar lead no WhatsApp →
        </a>
      </p>
    `
    : '';

  const html = `

    <div style="
      background:#f4f4f4;
      padding:28px 10px;
      font-family:Arial,sans-serif;
      color:#111;
    ">

      <div style="
        max-width:650px;
        margin:auto;
        background:#fff;
        border:1px solid #e5e5e5;
        border-radius:12px;
        overflow:hidden;
      ">

        <div style="
          background:#000;
          color:#fff;
          padding:26px 28px;
        ">

          <div style="
            font-size:12px;
            letter-spacing:2px;
            opacity:.7;
          ">
            CAIROPET
          </div>

          <div style="
            font-size:25px;
            font-weight:700;
            margin-top:10px;
          ">
            ${escaparHtml_(rotulo)}
          </div>

          <div style="
            font-size:12px;
            opacity:.7;
            margin-top:8px;
          ">
            ${escaparHtml_(lead.recebidoEm)}
          </div>

        </div>

        <div style="padding:26px 28px;">

          <div style="
            font-size:24px;
            font-weight:700;
          ">
            ${escaparHtml_(lead.nome)}
          </div>

          <div style="
            color:#666;
            margin:6px 0 18px;
          ">

            ${escaparHtml_(lead.agropecuaria)}

            ·

            ${escaparHtml_(lead.cidade)}

            ${lead.uf
              ? '/' + escaparHtml_(lead.uf)
              : ''}

          </div>

          <div style="
            padding:12px 14px;
            background:#f5f5f5;
            border-radius:7px;
            margin-bottom:22px;
          ">

            <strong>
              ${escaparHtml_(resultado.classe)}
            </strong>

            <br>

            <span style="
              color:#555;
              font-size:13px;
              line-height:1.6;
            ">
              ${escaparHtml_(resultado.motivo)}
            </span>

          </div>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              border-collapse:collapse;
              font-size:14px;
            "
          >

            ${tabela}

          </table>

          ${botao}

        </div>

      </div>

    </div>
  `;

  const textoSimples =
    rotulo +
    '\n' +
    lead.nome +
    ' — ' +
    lead.agropecuaria +
    '\nFaturamento: ' +
    (lead.faturamento || 'Não informado') +
    '\nMomento: ' +
    (lead.momento || 'Não informado') +
    '\nPontuação: ' +
    resultado.pontos +
    '/100' +
    '\nWhatsApp: ' +
    lead.whatsapp;

  MailApp.sendEmail({

    to: emails,

    subject: assunto,

    body: textoSimples,

    htmlBody: html,

    name: CAIRO_CONFIG.NOME_REMETENTE

  });

}

/**
 * PROTEÇÃO DO HTML
 */

function escaparHtml_(valor) {

  return texto_(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

/**
 * RESPOSTA JSON
 */

function respostaJson_(obj) {

  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}

/**
 * TESTE DAS NOTIFICAÇÕES
 */

function testarEmail() {

  const emails = PropertiesService
    .getScriptProperties()
    .getProperty('NOTIFICATION_EMAILS');

  if (!emails) {

    throw new Error(
      'Configure NOTIFICATION_EMAILS.'
    );

  }

  MailApp.sendEmail({

    to: emails,

    subject:
      '✅ CairoPet — teste de notificação',

    body:
      'As notificações do Apps Script estão funcionando.',

    htmlBody: `
      <div style="
        font-family:Arial;
        padding:25px;
      ">

        <h2>✅ CairoPet</h2>

        <p>
          As notificações estão funcionando.
        </p>

      </div>
    `,

    name: CAIRO_CONFIG.NOME_REMETENTE

  });

  console.log(
    'E-mail de teste enviado.'
  );

}

/**
 * TESTE DE CLASSIFICAÇÃO
 */

function testarClassificacao() {

  const exemplos = [

    {
      faturamento: 'Menos de R$ 50 mil',
      momento: 'Quero começar o quanto antes',
      decisor: 'Sim, sou o proprietário',
      tipo: 'Agropecuária'
    },

    {
      faturamento: 'De R$ 50 mil a R$ 79.999',
      momento: 'Quero começar o quanto antes',
      decisor: 'Sim, sou o proprietário',
      tipo: 'Agropecuária'
    },

    {
      faturamento: 'De R$ 80 mil a R$ 149.999',
      momento: 'Nos próximos 2 ou 3 meses',
      decisor: 'Decido junto com outra pessoa',
      tipo: 'Casa de ração'
    },

    {
      faturamento: 'Prefiro não informar',
      momento: 'Quero começar o quanto antes',
      decisor: 'Sim, sou o proprietário',
      tipo: 'Agropecuária'
    }

  ];

  exemplos.forEach(lead => {

    console.log(
      JSON.stringify({
        faturamento: lead.faturamento,
        resultado: classificarLead_(lead)
      })
    );

  });

}
