/**
 * CairoPet — recebe os leads do site e grava uma linha por lead nesta planilha.
 *
 * Instalação (uma vez):
 *  1. Crie uma Planilha Google (ex.: "Leads CairoPet").
 *  2. Extensões → Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve.
 *  3. Configurações do projeto (engrenagem) → Propriedades do script → Adicionar:
 *       TOKEN = uma senha longa qualquer (ex.: gere em https://1password.com/password-generator)
 *       NOTIFY_EMAIL = (opcional) e-mail(s) que recebem o aviso de lead novo, separados por vírgula.
 *                      Sem ela, o aviso vai para o e-mail da conta dona do script.
 *  4. Implantar → Nova implantação → tipo "App da Web":
 *       Executar como: Eu
 *       Quem pode acessar: Qualquer pessoa
 *     Autorize o acesso quando pedir. Copie a URL do app da Web (termina em /exec).
 *  5. Na Vercel (Settings → Environment Variables), crie:
 *       LEAD_WEBHOOK_URL = <URL do passo 4>?token=<o mesmo TOKEN do passo 3>
 *     e faça um novo deploy.
 *
 * Se editar este script depois: Implantar → Gerenciar implantações → editar → Nova versão
 * (a URL continua a mesma).
 *
 * Gravação POR CABEÇALHO: cada campo vai para a coluna com o seu nome na linha 1, não
 * para uma posição fixa. Colunas que faltam são criadas só no FINAL da planilha;
 * nenhuma coluna existente é apagada, renomeada ou reordenada, e linhas antigas nunca
 * são reescritas. Pode reordenar colunas ou acrescentar colunas próprias (ex.: "Status")
 * à vontade — basta não renomear os cabeçalhos abaixo.
 */

const SHEET_NAME = 'Leads';

/* Qualificação comercial ------------------------------------------------------------
 * Calculada só aqui, no servidor: não aparece no site nem no código da página.
 */

/**
 * Faturamento mensal mínimo do perfil financeiro desejado (R$).
 * Para mudar o critério, altere só este número e publique uma nova versão.
 * O corte só funciona nos limites das faixas: 50000, 80000, 150000 ou 300000.
 * O site não oferece faixa abaixo de R$ 50 mil (decisão comercial, out/2026): com 50000,
 * ABAIXO DO PERFIL FINANCEIRO só aparece se o mínimo for aumentado (ou em lead antigo).
 */
const FATURAMENTO_MINIMO = 50000;

/**
 * Valor de referência de cada faixa do formulário = o seu limite inferior (R$/mês).
 * null = não informado. Os rótulos precisam ser idênticos aos do site
 * (FATURAMENTO_OPTIONS em src/lib/lead-schema.ts). Faixa desconhecida = não informado.
 */
const FAIXAS_FATURAMENTO = {
  'De R$ 50 mil a R$ 79.999': 50000,
  'De R$ 80 mil a R$ 149.999': 80000,
  'De R$ 150 mil a R$ 299.999': 150000,
  'R$ 300 mil ou mais': 300000,
  'Prefiro não informar': null,
  // Faixas do formulário anterior (até out/2026): só para leads enviados durante a troca de versão.
  'Até R$ 50 mil': 0,
  'De R$ 50 mil a R$ 150 mil': 50000,
  'De R$ 150 mil a R$ 500 mil': 150000,
  'De R$ 500 mil a R$ 1 milhão': 500000,
  'Acima de R$ 1 milhão': 1000000,
};

const DECISORES = ['Sim, sou o proprietário', 'Sim, sou responsável pelas contratações'];
const URGENTES = ['Quero começar o quanto antes', 'Nos próximos 30 dias'];

const CLASSIFICACAO = {
  abaixo: 'ABAIXO DO PERFIL FINANCEIRO',
  avaliacao: 'EM AVALIAÇÃO',
  quente: 'QUENTE',
  morno: 'MORNO',
};

/** Valor de referência do faturamento informado, ou null (não informado / faixa desconhecida). */
function faturamentoReferencia(faixa) {
  return Object.prototype.hasOwnProperty.call(FAIXAS_FATURAMENTO, faixa) ? FAIXAS_FATURAMENTO[faixa] : null;
}

/** Regras em ordem: a primeira que bater define a classificação. */
function classificar(lead) {
  const loja = lead.loja || {};
  const q = lead.qualificacao || {};
  const valor = faturamentoReferencia(loja.faturamento);
  const tipo = loja.tipo_estabelecimento || loja.tipo_negocio;

  if (valor !== null && valor < FATURAMENTO_MINIMO) return CLASSIFICACAO.abaixo;
  if (valor === null || tipo === 'Outro') return CLASSIFICACAO.avaliacao;
  if (DECISORES.indexOf(q.poder_decisao) !== -1 && URGENTES.indexOf(q.urgencia) !== -1) return CLASSIFICACAO.quente;
  return CLASSIFICACAO.morno;
}

/* Colunas ----------------------------------------------------------------------------
 * [cabeçalho, leitura do payload]. As 30 primeiras são as originais da planilha e
 * continuam com os mesmos nomes. As que o formulário atual não pergunta mais
 * (Tamanho, Marketing atual, Investimento em anúncios, Tipo de negócio, Dores,
 * Objetivo, Momento, Decisor, Faixa de investimento, Contexto) ficam vazias nos
 * leads novos. Colunas novas entram sempre no fim desta lista.
 */
const COLUMNS = [
  ['Recebido em', (l) => Utilities.formatDate(new Date(l.recebido_em), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss')],
  ['Nome', (l) => l.contato.nome],
  ['WhatsApp', (l) => l.contato.whatsapp],
  ['Link WhatsApp', (l) => 'https://wa.me/' + String(l.contato.whatsapp_e164 || '').replace(/\D/g, '')],
  ['Instagram', (l) => l.loja.instagram || ''],
  ['Cidade', (l) => l.loja.cidade],
  ['UF', (l) => l.loja.uf],
  ['Agropecuária', (l) => l.loja.nome],
  ['Tipo de negócio', (l) => l.loja.tipo_negocio],
  ['Tamanho', (l) => l.loja.tamanho],
  ['Faturamento', (l) => l.loja.faturamento],
  ['Marketing atual', (l) => l.qualificacao.marketing_atual],
  ['Investimento em anúncios', (l) => l.qualificacao.investimento_anuncios],
  ['Dores', (l) => (l.qualificacao.dores || []).join(' | ')],
  ['Objetivo', (l) => l.qualificacao.objetivo],
  ['Momento', (l) => l.qualificacao.momento],
  ['Decisor', (l) => l.qualificacao.decisor],
  ['Faixa de investimento', (l) => l.qualificacao.faixa_investimento],
  ['Contexto', (l) => l.qualificacao.contexto || ''],
  ['LGPD aceita', (l) => (l.consentimento_lgpd && l.consentimento_lgpd.aceito ? 'Sim' : 'Não')],
  ['utm_source', (l) => l.origem.utm_source || ''],
  ['utm_medium', (l) => l.origem.utm_medium || ''],
  ['utm_campaign', (l) => l.origem.utm_campaign || ''],
  ['utm_content', (l) => l.origem.utm_content || ''],
  ['utm_term', (l) => l.origem.utm_term || ''],
  ['fbclid', (l) => l.origem.fbclid || ''],
  ['gclid', (l) => l.origem.gclid || ''],
  ['Página de entrada', (l) => l.origem.landing_page || ''],
  ['Origem (referrer)', (l) => l.origem.referrer || ''],
  ['ID do envio', (l) => l.origem.event_id || ''],
  // Formulário de 3 etapas (out/2026)
  ['Tipo de estabelecimento', (l) => l.loja.tipo_estabelecimento],
  ['Dificuldades', (l) => (l.qualificacao.dificuldades || []).join(', ')],
  ['Urgência', (l) => l.qualificacao.urgencia],
  ['Poder de decisão', (l) => l.qualificacao.poder_decisao],
  ['Classificação', (l, ctx) => ctx.classificacao],
];

const ID_COLUMN = 'ID do envio';

function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || (e.parameter && e.parameter.token) !== token) return json({ ok: false, error: 'unauthorized' });

  let lead;
  try {
    lead = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'invalid_json' });
  }

  const result = salvarLead(lead);
  if (result.duplicate) return json({ ok: true, duplicate: true });
  // Aviso por e-mail só depois de a linha estar gravada; falha no e-mail não derruba o lead.
  notificar(lead, result);
  return json({ ok: true });
}

function doGet() {
  return json({ ok: true, service: 'leads-cairopet' });
}

/** Grava o lead (ou reconhece o reenvio pelo ID do envio). */
function salvarLead(lead) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet();
    const headers = ensureHeaders(sheet);
    const id = lead.origem && lead.origem.event_id;
    // Um reenvio do mesmo formulário (mesmo ID) não duplica a linha.
    if (id && alreadySaved(sheet, headers, id)) return { duplicate: true };
    const ctx = { classificacao: classificar(lead) };
    sheet.appendRow(buildRow(headers, lead, ctx));
    SpreadsheetApp.flush();
    return { duplicate: false, classificacao: ctx.classificacao, row: sheet.getLastRow() };
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(([name]) => name));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Cabeçalhos atuais da linha 1; os que faltarem são criados depois da última coluna usada. */
function ensureHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((h) => String(h).trim()) : [];
  const missing = COLUMNS.map(([name]) => name).filter((name) => headers.indexOf(name) === -1);
  if (missing.length) {
    const extra = headers.length + missing.length - sheet.getMaxColumns();
    if (extra > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), extra);
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    headers.push(...missing);
  }
  return headers;
}

/** Linha na ordem dos cabeçalhos da planilha; colunas sem campo correspondente ficam vazias. */
function buildRow(headers, lead, ctx) {
  const row = headers.map(() => '');
  COLUMNS.forEach(([name, get]) => {
    const i = headers.indexOf(name);
    if (i === -1) return;
    let v;
    try {
      v = get(lead, ctx);
    } catch (err) {
      v = '';
    }
    row[i] = cell(v);
  });
  return row;
}

/** Texto digitado no site nunca vira fórmula na planilha. */
function cell(v) {
  if (v == null) return '';
  return typeof v === 'string' && v.charAt(0) === '=' ? "'" + v : v;
}

function alreadySaved(sheet, headers, id) {
  const col = headers.indexOf(ID_COLUMN) + 1;
  const last = sheet.getLastRow();
  if (!col || last < 2) return false;
  const from = Math.max(2, last - 199);
  const values = sheet.getRange(from, col, last - from + 1, 1).getValues();
  return values.some((r) => r[0] === id);
}

/* Aviso de lead novo -------------------------------------------------------------- */

function notificar(lead, result) {
  try {
    const to =
      PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
    if (!to) return;
    const loja = lead.loja || {};
    const q = lead.qualificacao || {};
    const contato = lead.contato || {};
    const origem = lead.origem || {};
    const linhas = [
      'Classificação: ' + (result.classificacao || ''),
      '',
      'Agropecuária: ' + (loja.nome || ''),
      'Cidade: ' + (loja.cidade || '') + '/' + (loja.uf || ''),
      'Tipo: ' + (loja.tipo_estabelecimento || loja.tipo_negocio || ''),
      'Faturamento: ' + (loja.faturamento || ''),
      'Dificuldades: ' + (q.dificuldades || q.dores || []).join(', '),
      'Quando quer começar: ' + (q.urgencia || q.momento || ''),
      'Decisão: ' + (q.poder_decisao || q.decisor || ''),
      '',
      'Nome: ' + (contato.nome || ''),
      'WhatsApp: ' + (contato.whatsapp || '') + '  →  https://wa.me/' + String(contato.whatsapp_e164 || '').replace(/\D/g, ''),
      'Instagram: ' + (loja.instagram || '—'),
      '',
      'Origem: ' + ([origem.utm_source, origem.utm_medium, origem.utm_campaign].filter(Boolean).join(' / ') || 'direto'),
      'Planilha: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + (result.row ? ' (linha ' + result.row + ')' : ''),
    ];
    MailApp.sendEmail({
      to: to,
      subject: '[' + (result.classificacao || 'LEAD') + '] Novo lead CairoPet — ' + (loja.nome || '') + ' (' + (loja.cidade || '') + '/' + (loja.uf || '') + ')',
      body: linhas.join('\n'),
    });
  } catch (err) {
    console.error('Aviso por e-mail falhou:', err);
  }
}

/* Utilitários para rodar no editor (Executar) --------------------------------------- */

/** Envia um aviso de exemplo, sem gravar nada na planilha. */
function testarEmail() {
  notificar(
    {
      contato: { nome: 'Teste CairoPet', whatsapp: '(34) 99999-1234', whatsapp_e164: '+5534999991234' },
      loja: { nome: 'Agropecuária Teste', cidade: 'Uberaba', uf: 'MG', tipo_estabelecimento: 'Agropecuária', faturamento: 'De R$ 80 mil a R$ 149.999' },
      qualificacao: { dificuldades: ['Estoque parado'], urgencia: 'Nos próximos 30 dias', poder_decisao: 'Sim, sou o proprietário' },
      origem: { utm_campaign: 'TESTE' },
    },
    { classificacao: 'TESTE' },
  );
}

/** Mostra no log a classificação de um exemplo de cada categoria, sem gravar nada. */
function testarClassificacao() {
  const base = (loja, q) => ({ loja: Object.assign({ tipo_estabelecimento: 'Agropecuária' }, loja), qualificacao: q });
  const casos = [
    [CLASSIFICACAO.abaixo, base({ faturamento: 'Até R$ 50 mil' }, { poder_decisao: DECISORES[0], urgencia: URGENTES[0] })],
    [CLASSIFICACAO.avaliacao, base({ faturamento: 'Prefiro não informar' }, { poder_decisao: DECISORES[0], urgencia: URGENTES[0] })],
    [CLASSIFICACAO.avaliacao, base({ faturamento: 'R$ 300 mil ou mais', tipo_estabelecimento: 'Outro' }, { poder_decisao: DECISORES[0], urgencia: URGENTES[0] })],
    [CLASSIFICACAO.quente, base({ faturamento: 'De R$ 50 mil a R$ 79.999' }, { poder_decisao: DECISORES[1], urgencia: URGENTES[1] })],
    [CLASSIFICACAO.morno, base({ faturamento: 'De R$ 150 mil a R$ 299.999' }, { poder_decisao: 'Decido junto com outra pessoa', urgencia: URGENTES[0] })],
  ];
  casos.forEach(([esperado, lead]) => console.log((classificar(lead) === esperado ? 'OK   ' : 'ERRO ') + esperado + ' ← ' + JSON.stringify(lead)));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
