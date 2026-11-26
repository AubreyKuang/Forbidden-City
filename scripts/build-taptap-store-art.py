#!/usr/bin/env python3
"""TapTap store art made only from the game's own images (no fonts needed):

  docs/taptap/icon-1024.png, icon-512.png   1:1 icon, square corners, opaque
  docs/taptap/banner-1920x1080.jpg          16:9 promo image with the game name
  docs/taptap/banner-1440x1440.jpg          1:1 promo image (required with a portrait video)

The title is the gold 「宸宫纪」 calligraphy already painted on palace-painted-cover.webp,
lifted off its teal wall. The emperor is the yellow-robed portrait holding a memorial
scroll; the background is the cover's golden roofs and vermilion pillars.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'assets/images'
OUT = ROOT / 'docs/taptap'
S = 1024


def calligraphy():
    """Alpha mask of the cover's title, without willow leaves or cloud swirls."""
    cover = Image.open(ART / 'palace-painted-cover.webp').convert('RGB')
    a = np.asarray(cover.crop((150, 110, 440, 640))).astype(float)
    mask = np.clip(((a[..., 0] - a[..., 2]) - 10) / 50, 0, 1)  # gold has far more red than blue
    labels, n = ndimage.label(mask > 0.35)
    idx = range(1, n + 1)
    sizes = ndimage.sum(np.ones_like(mask), labels, idx)
    centres = ndimage.center_of_mass(np.ones_like(mask), labels, idx)
    keep = np.zeros(n + 1, bool)
    for i, (size, (_, cx)) in enumerate(zip(sizes, centres), 1):
        keep[i] = size > 400 and 45 < cx < 240
    core = ndimage.binary_dilation(keep[labels], iterations=3)
    return Image.fromarray((mask * core * 255).astype('uint8')).crop((20, 15, 225, 490))


def icon():
    cover = Image.open(ART / 'palace-painted-cover.webp').convert('RGB')
    bg = cover.crop((1010, 150, 1672, 812)).resize((S, S), Image.LANCZOS)
    bg = ImageEnhance.Brightness(ImageEnhance.Color(bg).enhance(1.15)).enhance(0.78)
    arr = np.asarray(bg).astype(float)
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt(((xx - S * .55) / S) ** 2 + ((yy - S * .45) / S) ** 2)
    v = np.clip(1 - (d - .25) * 1.5, .35, 1)[..., None]
    arr = arr * v + np.array([120, 22, 18], float) * (1 - v)  # vermilion vignette
    bg = Image.fromarray(arr.clip(0, 255).astype('uint8'))

    emperor = Image.open(ART / 'palace-emperors-expanded.webp').convert('RGBA').crop((0, 0, 448, 560))
    emperor = emperor.crop(emperor.getbbox())
    h = int(S * .92)
    w = int(emperor.width * h / emperor.height)
    emperor = emperor.resize((w, h), Image.LANCZOS)
    ex, ey = S - w + int(S * .06), S - h + int(S * .02)
    glow = Image.new('L', (S, S), 0)
    glow.paste(emperor.split()[3], (ex, ey))
    glow = glow.filter(ImageFilter.GaussianBlur(18)).point(lambda p: int(p * .75))
    bg = Image.composite(Image.new('RGB', (S, S), (30, 8, 6)), bg, glow)
    bg.paste(emperor, (ex, ey), emperor)

    title = calligraphy()
    th = int(S * .86)
    title = title.resize((int(title.width * th / title.height), th), Image.LANCZOS)
    full = Image.new('L', (S, S), 0)
    full.paste(title, (int(S * .04), (S - th) // 2))
    layers = [
        (full.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(14)).point(lambda p: int(p * .8)), (20, 6, 4)),
        (full.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(2)), (236, 190, 92)),  # gold outline
        (full.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(3)), (26, 12, 8)),     # ink outline
    ]
    for mask, colour in layers:
        bg = Image.composite(Image.new('RGB', (S, S), colour), bg, mask)
    g = Image.linear_gradient('L').resize((S, S))
    fill = Image.merge('RGB', [g.point(lambda p: int(255 - p * .05)), g.point(lambda p: int(236 - p * .35)), g.point(lambda p: int(150 - p * .4))])
    bg = Image.composite(fill, bg, full)
    bg.save(OUT / 'icon-1024.png', optimize=True)
    bg.resize((512, 512), Image.LANCZOS).save(OUT / 'icon-512.png', optimize=True)


def banner():
    cover = Image.open(ART / 'palace-painted-cover.webp').convert('RGB')
    cover.resize((1920, 1080), Image.LANCZOS).save(OUT / 'banner-1920x1080.jpg', quality=90)
    # The square keeps the painted title on the left and the palace on the right.
    cover.crop((60, 0, 1001, 941)).resize((1440, 1440), Image.LANCZOS).save(OUT / 'banner-1440x1440.jpg', quality=90)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    icon()
    banner()
    for f in ('icon-1024.png', 'icon-512.png', 'banner-1920x1080.jpg', 'banner-1440x1440.jpg'):
        p = OUT / f
        print(f, Image.open(p).size, f'{p.stat().st_size / 1024:.0f}KB')
