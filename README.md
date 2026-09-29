# CairoPet — site oficial

Landing page de conversão da CairoPet (marketing só para agropecuárias).
Objetivo único: o dono da agropecuária preencher o formulário **"Minha cidade ainda está livre?"**.

**Stack:** Astro 7 (HTML estático, ~17 KB de JS, sem framework) + 1 rota de servidor (`/api/lead`) na Vercel.
Lighthouse (build de produção): mobile 98 · acessibilidade 100 · boas práticas 100 · SEO 100 (desktop 100 em tudo).

**Páginas:** `/` (landing, 8 seções) · `/formulario/` (18 etapas, uma pergunta por tela, na ordem oficial) · `/obrigado/` (confirmação + convite ao briefing no Calendly) · `/politica-de-privacidade/`.

**Conceito visual — "Os objetos do balcão":** etiqueta de gôndola (a loja tem estoque, preço, equipe; falta movimento), cupom (a prova do case AgroUnião) e carimbo com o símbolo oficial ("uma agropecuária por cidade").

**Fluxo:** formulário = captura e qualificação; o lead é salvo (webhook) antes de ir para `/obrigado/`. Calendly = agendamento opcional (`PUBLIC_CALENDLY_URL`, padrão `https://calendly.com/cairopet/briefing-cairopet`, com nome e UTMs pré-preenchidos). As situações marcadas na home chegam pré-marcadas na etapa "Dores".

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
| 5 | Meta Pixel + Conversions API + GA4 | ver **Tracking** |
| 6 | **Fotos reais** de agropecuária (hoje todas temporárias) | ver **Fotos** |
| 7 | Revisão jurídica da Política de Privacidade | `src/pages/politica-de-privacidade.astro` |

Todas as variáveis estão documentadas em [`.env.example`](.env.example). Na Vercel: *Settings → Environment Variables*.

---

## Tracking

| Evento | Quando dispara | Destino |
|---|---|---|
| `PageView` | carregamento | Meta Pixel, GA4 |
| `cta_click` | clique em qualquer CTA (com `location`) | GA4, dataLayer |
| `form_start` | primeira interação no formulário | GA4, dataLayer |
| `form_step` | cada etapa concluída (`step`, `step_name`) | GA4, dataLayer |
| `form_submit` | tentativa de envio já validada | GA4, dataLayer |
| **`Lead`** | **só depois que o servidor confirma o lead salvo** | Pixel (em `/obrigado/`) + Conversions API (servidor), mesmo `event_id` → a Meta deduplica |
| `generate_lead` | idem acima | GA4 (marcar como *evento-chave*) |
| `whatsapp_click` / `Contact` | clique em link de WhatsApp | GA4 / Pixel |

Garantias testadas: o `Lead` não dispara no clique, não duplica ao recarregar `/obrigado/`, e não dispara em visita direta a `/obrigado/`.
A Conversions API só é chamada **depois** do webhook responder com sucesso.

UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), `fbclid`, `gclid`, página de entrada e referrer ficam salvos por 30 dias e vão junto com cada lead.

Para testar a CAPI: defina `META_CAPI_TEST_EVENT_CODE` com o código da aba *Eventos de teste* do Gerenciador de Eventos.

### Payload enviado ao webhook

```json
{
  "tipo": "lead_site_cairopet",
  "recebido_em": "…",
  "contato": { "nome": "…", "whatsapp": "(34) 99999-8888", "whatsapp_e164": "+5534999998888" },
  "loja": { "nome": "…", "cidade": "Uberaba", "uf": "MG", "instagram": "@…", "tipo_negocio": "…", "tamanho": "…", "faturamento": "…" },
  "qualificacao": { "marketing_atual": "…", "investimento_anuncios": "…", "dores": ["…"], "objetivo": "…", "momento": "…", "decisor": "…", "faixa_investimento": "…", "contexto": "…" },
  "consentimento_lgpd": { "aceito": true, "em": "…" },
  "origem": { "utm_source": "…", "utm_campaign": "…", "fbclid": "…", "landing_page": "…", "event_id": "…", "ip": "…", "user_agent": "…" }
}
```

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
- Pergunta de qualificação (Etapa 7 — "Momento") em [`src/lib/lead-schema.ts`](src/lib/lead-schema.ts), marcada `[AJUSTAR]`: trocar por faixa de investimento se o comercial precisar.
- E-mail é opcional no formulário (WhatsApp é obrigatório) para reduzir atrito.

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

## Opções do formulário a validar com o comercial

Faixas de **faturamento**, **investimento em anúncios** e **faixa de investimento** foram propostas por mim e estão marcadas `[AJUSTAR]` em `src/lib/lead-schema.ts`.
