# CairoPet — site oficial

Landing page de conversão da CairoPet (marketing só para agropecuárias).
Objetivo único: o dono da agropecuária preencher o formulário **"Minha cidade ainda está livre?"**.

**Stack:** Astro 7 (HTML estático, ~17 KB de JS, sem framework) + 1 rota de servidor (`/api/lead`) na Vercel.
Lighthouse (build de produção): mobile 98 · acessibilidade 100 · boas práticas 100 · SEO 100 (desktop 100 em tudo).

**Páginas:** `/` (landing, 8 seções) · `/formulario/` (10 perguntas, uma por tela, em 3 etapas: Sua agropecuária · Seu negócio · Seus dados) · `/obrigado/` (confirmação + botão para falar no WhatsApp) · `/politica-de-privacidade/`.

**Conceito visual — "Os objetos do balcão":** etiqueta de gôndola (a loja tem estoque, preço, equipe; falta movimento), cupom (a prova do case AgroUnião) e carimbo com o símbolo oficial ("uma agropecuária por cidade").

**Fluxo de envio (não alterar sem motivo):** enviar → botão desabilitado → `fetch` POST com `keepalive` (até 25 s) → espera a API responder `{ ok: true, saved: true }` (só depois de a planilha confirmar) → `dataLayer.push({ event: 'lead', event_id })` → GTM dispara GA4 `generate_lead` + Meta `Lead` (aguardado por `eventCallback` até 2 s) → `/obrigado/` → WhatsApp `5551995757018` com mensagem pronta. Se falhar: fica no formulário, respostas mantidas, botão liberado, mensagem de erro + botão do WhatsApp; um novo envio reaproveita o mesmo `event_id`. As situações marcadas na home chegam pré-marcadas em "O que impede de vender mais" (no máximo 2).

```bash
npm install
npm run dev      # http://localhost:4321  (leads aparecem no terminal)
npm run build    # gera .vercel/output
npm run check    # checagem de tipos
```

---

## Antes de publicar — checklist

| # | O quê | Onde |
|---|---|---|
| 1 | **Destino dos leads** (n8n, Make, Zapier, CRM, Apps Script…). Sem isso o formulário **falha em produção de propósito** — nenhum lead se perde em silêncio. | `LEAD_WEBHOOK_URL` |
| 2 | Domínio canônico | `PUBLIC_SITE_URL` (padrão provisório: `https://cairopet.com.br` — confirmar) |
| 3 | Razão social, CNPJ e e-mail de privacidade (aparecem destacados em preto na política até serem preenchidos) | `PUBLIC_COMPANY_LEGAL_NAME`, `PUBLIC_COMPANY_CNPJ`, `PUBLIC_CONTACT_EMAIL` |
| 4 | Instagram / WhatsApp (sem valor, os botões simplesmente não aparecem) | `PUBLIC_INSTAGRAM_URL`, `PUBLIC_WHATSAPP_NUMBER` |
| 5 | GA4 e Meta Pixel (no GTM) · Conversions API (opcional) | ver **Tracking** |
| 6 | **Fotos reais** de agropecuária (hoje todas temporárias) | ver **Fotos** |
| 7 | Revisão jurídica da Política de Privacidade | `src/pages/politica-de-privacidade.astro` |

Todas as variáveis estão documentadas em [`.env.example`](.env.example). Na Vercel: *Settings → Environment Variables*.

---

## Tracking

O site só faz `dataLayer.push`. O **GTM (`GTM-MQPCCFFG`) é a única camada do navegador** que carrega e dispara GA4 e Meta Pixel — não existe `gtag()`/`fbq()` no código (instalar GA4 ou Pixel fora do GTM duplicaria os eventos).

| Evento (dataLayer) | Quando dispara | No GTM (configurado fora do código) |
|---|---|---|
| — | carregamento | GA4 `page_view` / Meta `PageView` |
| `cta_click` | clique em qualquer CTA (com `location`) | — |
| `form_start` | primeira resposta de verdade no formulário (1× por preenchimento; abrir e sair não conta) | GA4 `form_start` / Meta `InicioFormulario` |
| `form_step_view` | chegada a cada etapa (`step` 1–3, `step_name`), 1× por preenchimento — `step: 3` = chegou à última etapa | — (criar no GTM se quiser o funil no GA4) |
| `form_step` | etapa 1 ou 2 concluída (`step`, `step_name`), 1× por preenchimento | — (criar no GTM se quiser o funil no GA4) |
| `form_submit` | tentativa de envio já validada, **antes** da API (não é conversão) | — |
| `form_error` | envio falhou: `error_type` = `network` · `timeout` · `server` (com `status`) · `validation` (422, com `fields`) | — (criar no GTM se quiser) |
| **`lead`** + `event_id` | **no formulário, só depois de a API responder `saved: true`**, e antes de abrir `/obrigado/` | GA4 `generate_lead` + Meta `Lead` (eventID = `event_id`) |
| `whatsapp_click` + `location` | clique em link de WhatsApp | GA4 `whatsapp_click` / Meta `Contact` |

`/obrigado/` não dispara conversão nenhuma (só PageView pelo GTM): recarregar ou visitar direto não gera `lead`.

**`event_id`** — um por preenchimento: criado (UUID aleatório) na primeira tentativa de envio, gravado no rascunho do formulário (`cp_lead_draft_v3`, 24 h), reaproveitado em qualquer novo envio (erro de rede, timeout, 5xx, 422, recarregar a página) e apagado só quando a API confirma o lead. Vai para a planilha (deduplicação no Apps Script), para o `dataLayer` (`lead`) e, se ativa, para a Conversions API.

**Contrato de `/api/lead` (JSON):** `{ ok: true, saved: true }` = lead salvo (a planilha respondeu `ok`, inclusive `duplicate`) → único caso que dispara `lead`. `{ ok: true }` sem `saved` = envio descartado pelo filtro anti-robô → vai para `/obrigado/`, sem conversão. `{ ok: false }` (4xx/5xx) = erro → fica no formulário.

**Tempos:** navegador espera 25 s · API espera a planilha 15 s (+ Conversions API 4 s, se ativa) · função da Vercel com `maxDuration: 30`.

**Conversions API (opcional, desativada até configurar):** só servidor, ativada com `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`. É chamada **depois** de a planilha confirmar, com o mesmo `event_id` do `lead` (a Meta deduplica com o Pixel do GTM); dados pessoais vão com hash SHA-256 no servidor. Falha da CAPI não derruba o lead. Para testar: `META_CAPI_TEST_EVENT_CODE` com o código da aba *Eventos de teste* do Gerenciador de Eventos.

UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), `fbclid`, `gclid`, página de entrada e referrer ficam salvos por 30 dias (`cp_attr`; a última visita com parâmetros de campanha vence) e vão junto com cada lead.

### Payload enviado ao webhook

```json
{
  "tipo": "lead_site_cairopet",
  "versao_formulario": 3,
  "recebido_em": "…",
  "contato": { "nome": "…", "whatsapp": "(34) 99999-8888", "whatsapp_e164": "+5534999998888" },
  "loja": { "nome": "…", "cidade": "Uberaba", "uf": "MG", "instagram": "@…", "tipo_estabelecimento": "…", "faturamento": "…" },
  "qualificacao": { "dificuldades": ["…"], "urgencia": "…", "poder_decisao": "…" },
  "consentimento_lgpd": { "aceito": true, "em": "…", "forma": "aviso junto ao botão de envio" },
  "origem": { "utm_source": "…", "utm_campaign": "…", "fbclid": "…", "landing_page": "…", "event_id": "…", "ip": "…", "user_agent": "…" }
}
```

### Planilha e classificação (Apps Script — `integrations/google-sheets/Code.gs`)

- Grava **pelo nome do cabeçalho** (não por posição). Colunas que faltam são criadas só no final; nenhuma coluna existente é apagada, renomeada ou reordenada, e linhas antigas não são reescritas.
- Colunas do formulário anterior que não são mais perguntadas (Tamanho, Marketing atual, Investimento em anúncios, Tipo de negócio, Dores, Objetivo, Momento, Decisor, **Faixa de investimento**, Contexto) ficam vazias nos leads novos.
- Colunas novas no fim: Tipo de estabelecimento · Dificuldades (separadas por vírgula) · Urgência · Poder de decisão · **Classificação**.
- O formulário não oferece faixa abaixo de R$ 50 mil (a menor é "De R$ 50 mil a R$ 79.999", mais "Prefiro não informar").
- **Classificação** é calculada só no Apps Script (nunca no navegador), nesta ordem: faturamento abaixo de `FATURAMENTO_MINIMO` (hoje 50000; só acontece se o mínimo subir) → `ABAIXO DO PERFIL FINANCEIRO`; "Prefiro não informar" ou tipo "Outro" → `EM AVALIAÇÃO`; dono/responsável + "o quanto antes"/"30 dias" → `QUENTE`; resto → `MORNO`. Para mudar o corte, altere só a constante (vale 50000, 80000, 150000 ou 300000) e publique nova versão — o site não muda.
- Aviso por e-mail a cada lead novo (propriedade `NOTIFY_EMAIL`, ou o dono do script), com a classificação no assunto. No editor: `testarEmail()` e `testarClassificacao()`.

Se o webhook pedir autenticação, defina `LEAD_WEBHOOK_TOKEN` (enviado como `Authorization: Bearer …`).

---

## Fotos — todas são temporárias

Nenhuma foto real de agropecuária foi fornecida. Para o site não ficar com caixas vazias, usei fotos de **domínio público / CC0** (uso comercial liberado, sem atribuição obrigatória), em preto e branco. Cada uma exibe a etiqueta **"Imagem temporária"** até ser trocada. Elas mostram lojas e ambientes rurais americanos — servem de referência de enquadramento, não representam clientes.

Para trocar: salve a foto real em `src/assets/photos/`, troque o import em [`src/data/photos.ts`](src/data/photos.ts) e mude `temporary` para `false` (a etiqueta some). O site gera AVIF/WebP automaticamente.

| Slot | Onde aparece | Foto definitiva ideal | Temporária atual |
|---|---|---|---|
| `hero` | Hero | Agropecuária real: balcão, prateleiras, sacaria | Armazém antigo — Carol M. Highsmith / Library of Congress |
| `dor` | "A realidade de muita loja" | Balcão em momento de pouco movimento | Dono de mercearia — U.S. National Archives |
| `especializacao` | Comparação de agências | Prateleira: vermífugos, sal mineral, ferramentas | Loja do interior — Carol M. Highsmith / LoC |
| `racao`, `sacaria`, `sela` | Mosaico "Cada campanha ensina…" | Produtos reais da loja em close | CC0 (rawpixel) |
| `conteudo` | Como trabalhamos | Funcionário gravando conteúdo na loja | Pessoa filmando com celular — National Park Service |
| `beneficios` | Benefícios | Cliente sendo atendido no balcão | Produtor rural — USDA |
| `cta` | CTA final | Ambiente de agropecuária / animal de cliente | Cavalo na baia — CC0 (rawpixel) |

## Conteúdo que ainda não existe (não inventar)

Em [`src/data/cases.ts`](src/data/cases.ts). Enquanto vazios, aparecem **só em `npm run dev`** e nunca em produção:

- `[PRINT DO RELATÓRIO AGROUNIÃO]` — usar o print oficial do relatório, sem redesenhar.
- `[DEPOIMENTO AGROUNIÃO]`, `[CASE 2]`, `[DEPOIMENTO 3]` — preencher e marcar `published: true` quando houver autorização.

Outros pontos marcados no código:
- O formulário não pergunta quanto o cliente quer investir na agência (decisão comercial): a qualificação financeira é pelo faturamento; valores e planos ficam para o atendimento.

---

## Onde editar

| O quê | Arquivo |
|---|---|
| Textos de dor, comparação, aprendizados, método, benefícios, objeções, processo, FAQ | `src/data/content.ts` |
| Case e depoimentos | `src/data/cases.ts` |
| Fotos | `src/data/photos.ts` |
| Opções e validação do formulário (cliente **e** servidor) | `src/lib/lead-schema.ts` |
| CTA, navegação, canais | `src/lib/site.ts` |
| Ordem das seções | `src/pages/index.astro` |
| Formulário completo | `src/pages/formulario.astro` + `src/components/form/LeadForm.astro` |
| Cores, tipografia, botões | `src/styles/global.css` |

## Identidade visual

- Arquivos oficiais intactos em `brand/originais/` (logos + 3 brand boards).
- `scripts/prepare-brand-assets.py` só **recorta a margem transparente**, extrai a versão chapada do símbolo (a mesma do painel *Símbolo* do brand board) e gera favicons e a imagem de Open Graph. Nenhuma letra é redesenhada; a logo nunca é recriada com fonte.
- Paleta: `#000000 #FFFFFF #111111 #E8E8E8 #262626`, com off-white `#F7F7F5` como fundo principal. Fontes: Archivo Black, Inter, Space Mono (servidas pelo próprio site).
