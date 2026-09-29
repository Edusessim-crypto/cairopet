import type { ImageMetadata } from 'astro';

/**
 * PROVA SOCIAL
 * Conjunto oficial: briefing CairoPet (case AgroUnião, período 28/08/2026 a
 * 28/09/2026, fonte Gerenciador de Anúncios Meta). Não há print do relatório
 * no projeto ainda. Não extrapolar:
 * "20 conversas" ≠ "20 clientes"; "R$ 5,67" é custo de mídia, não preço do serviço.
 */
export interface Metric {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export const AGROUNIAO = {
  name: 'AgroUnião',
  summary: 'Um mês de campanha no Meta',
  periodStart: '28/08/2026',
  periodEnd: '28/09/2026',
  periodStartIso: '2026-08-28',
  periodEndIso: '2026-09-28',
  platform: 'Meta Ads',
  source: 'Gerenciador de Anúncios Meta',
  metrics: [
    { value: 20201, label: 'Pessoas alcançadas' },
    { value: 20, label: 'Conversas iniciadas' },
    { value: 5.67, decimals: 2, prefix: 'R$ ', label: 'Custo de mídia por conversa' },
    { value: 17.5, decimals: 1, suffix: '%', label: 'Cliques que viraram conversa' },
  ] satisfies Metric[],
  /**
   * [PRINT DO RELATÓRIO AGROUNIÃO] — use o print oficial do relatório CairoPet,
   * sem redesenhar. Ex.: import report from '../assets/photos/relatorio-agrouniao.png'
   */
  reportImage: undefined as ImageMetadata | undefined,
};

/**
 * DEPOIMENTOS E NOVOS CASES
 * Nada é exibido enquanto a lista estiver vazia. Adicione somente com
 * autorização real do cliente.
 */
export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  store: string;
  city?: string;
}

export const TESTIMONIALS: Testimonial[] = [];
