import type { ImageMetadata } from 'astro';
import hero from '../assets/photos/temporarias/hero-loja-balcao.jpg';
import loja from '../assets/photos/temporarias/dor-lojista-balcao.jpg';
import conteudo from '../assets/photos/temporarias/conteudo-celular.jpg';

/**
 * FOTOS DO SITE — todas TEMPORÁRIAS (domínio público / CC0, sem atribuição
 * obrigatória). A legenda "Imagem temporária" aparece até a troca.
 *
 * Para substituir: salve a foto real em src/assets/photos/, troque o import
 * acima e mude `temporary` para false.
 */
export interface PhotoSlot {
  src: ImageMetadata;
  alt: string;
  focus?: string;
  temporary: boolean;
  /** Legenda da foto temporária: o que a foto definitiva deve mostrar. */
  brief: string;
  credit?: string;
}

export const PHOTOS = {
  hero: {
    src: hero,
    alt: 'Balcão de loja com prateleiras cheias de produtos',
    focus: '60% 50%',
    temporary: true,
    brief: 'Foto final: balcão e prateleiras de uma agropecuária cliente.',
    credit: 'Carol M. Highsmith / Library of Congress — domínio público',
  },
  loja: {
    src: loja,
    alt: 'Dono de loja atrás do balcão',
    focus: '50% 35%',
    temporary: true,
    brief: 'Foto final: dono de agropecuária no balcão da própria loja.',
    credit: 'U.S. National Archives — domínio público',
  },
  conteudo: {
    src: conteudo,
    alt: 'Pessoa de chapéu gravando um vídeo com o celular',
    focus: '55% 40%',
    temporary: true,
    brief: 'Foto final: equipe da loja gravando conteúdo de produto.',
    credit: 'National Park Service — domínio público',
  },
} satisfies Record<string, PhotoSlot>;
