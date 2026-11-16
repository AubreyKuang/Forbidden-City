"""Pack the twelve approved princess/prince portraits without repainting.

Usage: python3 scripts/build-royal-growth-colors.py /path/to/generated_images
Each source has two rows of three ages. Preserve alpha, crop each cell,
resize proportionally and append to a four-column game atlas.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('expanded', ROOT / 'scripts/build-expanded-portraits.py')
expanded = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expanded)
ATLAS = 'palace-royal-growth-colors.webp'
SOURCES = [
    ('exec-c35a2310-4fb7-48a1-8c88-646a45468ed5.png', 'f', 37, ['桃夭粉翠', '紫藤烟蓝']),
    ('exec-6cb41b74-4299-48e3-b765-10c6febacd7e.png', 'm', 31, ['湖青银竹', '朱砂玄锦']),
]


def build(folder):
    atlas = Image.new('RGBA', (1792, 1680))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, sex, first_variant, labels in SOURCES:
        source_path = folder / filename
        source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
        with Image.open(source_path) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
            for row in range(2):
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), 3)
                for stage in range(3):
                    box = (xs[stage], ys[row], xs[stage + 1], ys[row + 1])
                    tile = source.crop(box)
                    bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                    assert bounds
                    frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                    index = len(manifest['portraits'])
                    x = index % 4 * 448 + (448 - frame.width) // 2
                    y = (index // 4 + 1) * 560 - frame.height
                    atlas.paste(frame, (x, y))
                    manifest['portraits'].append({'id': 489 + index, 'atlas': ATLAS,
                        'source': filename, 'sourceSha256': source_hash, 'sourceSize': list(source.size),
                        'sourceCell': row * 3 + stage, 'cell': index, 'crop': list(box),
                        'bounds': list(bounds), 'placed': [x, y, *frame.size],
                        'sex': sex, 'variant': first_variant + row, 'stage': stage,
                        'label': labels[row] + '·' + ['幼年', '少年', '成年'][stage]})
    assert len(manifest['portraits']) == 12
    dest = ROOT / 'assets/images' / ATLAS
    atlas.save(dest, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/royal-growth-colors-sources.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{ATLAS}: 12 portraits, 4 growth sets, {dest.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
