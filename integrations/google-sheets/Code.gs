/**
 * CairoPet — recebe os leads do site e grava uma linha por lead nesta planilha.
 *
 * Instalação (uma vez):
 *  1. Crie uma Planilha Google (ex.: "Leads CairoPet").
 *  2. Extensões → Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve.
 *  3. Configurações do projeto (engrenagem) → Propriedades do script → Adicionar:
 *       TOKEN = uma senha longa qualquer (ex.: gere em https://1password.com/password-generator)
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
 */

const SHEET_NAME = 'Leads';

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
];

function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || (e.parameter && e.parameter.token) !== token) return json({ ok: false, error: 'unauthorized' });

  let lead;
  try {
    lead = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'invalid_json' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet();
    const id = lead.origem && lead.origem.event_id;
    // Um reenvio do mesmo formulário (mesmo ID) não duplica a linha.
    if (id && alreadySaved(sheet, id)) return json({ ok: true, duplicate: true });
    sheet.appendRow(COLUMNS.map(([, get]) => {
      try {
        const v = get(lead);
        return v == null ? '' : v;
      } catch (err) {
        return '';
      }
    }));
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: 'leads-cairopet' });
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

function alreadySaved(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const from = Math.max(2, last - 199);
  const values = sheet.getRange(from, COLUMNS.length, last - from + 1, 1).getValues();
  return values.some((r) => r[0] === id);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
