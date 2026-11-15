"""Pack approved painted map sprites; keep source PNGs and their transparency.

Usage: python3 scripts/build-map-atlases.py /path/to/generated_images
Only crop gutters, fit proportionally and encode WebP. No repainting or stretching.
"""
from pathlib import Path
import argparse
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    ('exec-3462054e-c7fa-4fb4-91a1-dc71ebf388d0.png', 'palace-map-buildings.webp', 3, 2, 512, 352),
    ('exec-43bd6936-b1a8-4b7b-a901-ba3c3b357f5f.png', 'palace-map-buildings-winter.webp', 3, 2, 512, 352),
    ('exec-45da9d4c-dfcd-46d0-9f60-552ad3faf3a4.png', 'palace-map-flora.webp', 4, 3, 288, 288),
    ('exec-d8090f8b-3704-4817-8c4b-f7eb6931b215.png', 'palace-map-figures.webp', 4, 3, 224, 336),
]

def pack(folder, spec):
    name, output, cols, rows, width, height = spec
    source = Image.open(folder / name).convert('RGBA')
    atlas = Image.new('RGBA', (cols * width, rows * height))
    for row in range(rows):
        for col in range(cols):
            if cols == 3:
                # The painted halls have wider first two silhouettes than the pavilion.
                xs = [0, 628, 1212, 1738] if row == 0 else [0, 586, 1220, 1738]
                ys = [0, 490, 905]
                box = (round(xs[col] / 1738 * source.width), round(ys[row] / 905 * source.height),
                       round(xs[col + 1] / 1738 * source.width), round(ys[row + 1] / 905 * source.height))
            else:
                box = (round(col * source.width / cols), round(row * source.height / rows),
                       round((col + 1) * source.width / cols), round((row + 1) * source.height / rows))
            tile = source.crop(box)
            bounds = tile.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Empty sprite: {name}, {row}, {col}')
            tile = ImageOps.contain(tile.crop(bounds), (width - 12, height - 12), Image.Resampling.LANCZOS)
            atlas.alpha_composite(tile, (col * width + (width - tile.width) // 2,
                                         row * height + height - 6 - tile.height))
    dest = ROOT / 'assets' / 'images' / output
    atlas.save(dest, 'WEBP', quality=92, method=6, exact=True)
    print(f'{output}: {atlas.width}×{atlas.height}, {dest.stat().st_size:,} bytes')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    args = parser.parse_args()
    for spec in SOURCES:
        pack(args.source_folder, spec)
