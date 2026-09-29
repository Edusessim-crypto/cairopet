"""
Gera os derivados dos arquivos oficiais em brand/originais/.

Nenhum desenho é alterado: os scripts apenas
  - recortam a margem transparente (bounding box do alfa);
  - extraem o preenchimento chapado do símbolo (versão "flat" que já aparece
    no painel SÍMBOLO dos brand boards), sem o contorno/sombra do sticker;
  - geram favicons e a imagem de Open Graph.

Uso: python3 scripts/prepare-brand-assets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "brand" / "originais"
OUT = ROOT / "src" / "assets" / "brand"
PUBLIC = ROOT / "public"
FONTS = ROOT / "node_modules" / "@fontsource"

OUT.mkdir(parents=True, exist_ok=True)


def crop_alpha(img: Image.Image, pad: int = 0) -> Image.Image:
    alpha = np.array(img.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + 1 + pad, img.width)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + 1 + pad, img.height)
    return img.crop((x0, y0, x1, y1))


def flat_fill(img: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Mantém só o preenchimento branco do sticker (descarta contorno preto)."""
    a = np.array(img.convert("RGBA")).astype(np.float32)
    lum = a[..., :3].mean(-1) / 255.0
    alpha = (a[..., 3] / 255.0) * np.clip((lum - 0.15) / 0.7, 0, 1)
    out = np.zeros_like(a)
    out[..., 0], out[..., 1], out[..., 2] = rgb
    out[..., 3] = alpha * 255
    return Image.fromarray(out.astype(np.uint8), "RGBA")


# Wordmarks -------------------------------------------------------------------
wm_white = crop_alpha(Image.open(SRC / "wordmark-branco.png").convert("RGBA"))
wm_black = crop_alpha(Image.open(SRC / "wordmark-preto.png").convert("RGBA"))
wm_sticker = crop_alpha(Image.open(SRC / "wordmark-sticker.png").convert("RGBA"))
wm_white.save(OUT / "cairopet-wordmark-branco.png", optimize=True)
wm_black.save(OUT / "cairopet-wordmark-preto.png", optimize=True)
wm_sticker.save(OUT / "cairopet-wordmark-sticker.png", optimize=True)

# Símbolo ---------------------------------------------------------------------
sym_sticker = crop_alpha(Image.open(SRC / "simbolo-sticker.png").convert("RGBA"))
sym_sticker.save(OUT / "cairopet-simbolo-sticker.png", optimize=True)
sym_white = crop_alpha(flat_fill(sym_sticker, (255, 255, 255)))
sym_black = crop_alpha(flat_fill(sym_sticker, (0, 0, 0)))
sym_white.save(OUT / "cairopet-simbolo-branco.png", optimize=True)
sym_black.save(OUT / "cairopet-simbolo-preto.png", optimize=True)

# Favicons (sticker: legível em aba clara e escura) ----------------------------
def square(img: Image.Image, size: int, pad_ratio: float = 0.04, bg=None) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    inner = int(size * (1 - pad_ratio * 2))
    ratio = min(inner / img.width, inner / img.height)
    resized = img.resize((round(img.width * ratio), round(img.height * ratio)), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


square(sym_sticker, 32).save(PUBLIC / "favicon-32.png", optimize=True)
square(sym_sticker, 192).save(PUBLIC / "icon-192.png", optimize=True)
square(sym_sticker, 512).save(PUBLIC / "icon-512.png", optimize=True)
square(sym_white, 180, 0.16, (0, 0, 0, 255)).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
square(sym_sticker, 64).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# Open Graph 1200x630 ---------------------------------------------------------
W, H = 1200, 630
og = Image.new("RGB", (W, H), (0, 0, 0))
draw = ImageDraw.Draw(og)
archivo = FONTS / "archivo-black" / "files" / "archivo-black-latin-400-normal.woff"
mono = FONTS / "space-mono" / "files" / "space-mono-latin-400-normal.woff"
f_small = ImageFont.truetype(str(mono), 22)
f_kicker = ImageFont.truetype(str(mono), 18)
f_mid = ImageFont.truetype(str(archivo), 44)

M = 72
# "VENDER ANTES" ocupa toda a largura útil
size = 100
while ImageFont.truetype(str(archivo), size + 2).getlength("VENDER ANTES") < W - 2 * M:
    size += 2
f_huge = ImageFont.truetype(str(archivo), size)
draw.text((M, 70), "CAIROPET · ESPECIALISTAS EM MARKETING PARA AGROPECUÁRIAS", font=f_kicker, fill=(200, 200, 200))
draw.line((M, 108, W - M, 108), fill=(60, 60, 60), width=1)
draw.text((M, 168), "Marketing para sua agropecuária", font=f_mid, fill=(255, 255, 255))
draw.text((M - 4, 232), "VENDER ANTES", font=f_huge, fill=(255, 255, 255))
draw.text((M, 400), "da concorrência.", font=f_mid, fill=(255, 255, 255))
draw.line((M, 500, W - M, 500), fill=(60, 60, 60), width=1)
draw.text((M, 548), "UMA AGROPECUÁRIA POR CIDADE", font=f_small, fill=(200, 200, 200))
logo_w = 200
logo = wm_white.resize((logo_w, round(wm_white.height * logo_w / wm_white.width)), Image.LANCZOS)
og.paste(logo, (W - M - logo_w, 530), logo)
og.save(PUBLIC / "og-cairopet.jpg", quality=88, optimize=True, progressive=True)

for p in sorted(OUT.iterdir()):
    print(p.name, Image.open(p).size)
print("public:", sorted(x.name for x in PUBLIC.iterdir()))
