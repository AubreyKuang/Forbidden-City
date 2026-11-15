"""Pack approved princess and prince sets, preserving all three growth stages.

Usage: python3 scripts/build-royal-growth.py /path/to/generated_images
Each source row is one identity: infant, child, grown. Only crop extraction,
proportional resizing and transparent packing are used.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    ('exec-4f7e7073-2bce-450f-930a-e9927bb36237.png', 'f', 33),
    ('exec-5bd022bd-093f-4864-ac65-012cbedab20b.png', 'm', 29),
]
ATLAS = 'palace-royal-growth.webp'


def build(folder):
    atlas = Image.new('RGBA', (1792, 1680))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, sex, first_variant in SOURCES:
        with Image.open(folder / filename) as source:
            assert source.mode == 'RGBA' and source.size == (1536, 1024)
            assert source.getchannel('A').getextrema()[0] == 0
            for row in range(2):
                for stage in range(3):
                    box = (stage * 512, row * 512, (stage + 1) * 512, (row + 1) * 512)
                    tile = source.crop(box)
                    bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                    assert bounds
                    tile = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                    index = len(manifest['portraits'])
                    atlas.paste(tile, (index % 4 * 448 + (448 - tile.width) // 2,
                                       (index // 4 + 1) * 560 - tile.height))
                    manifest['portraits'].append({'id': 380 + index, 'atlas': ATLAS,
                        'source': filename, 'cell': row * 3 + stage, 'crop': list(box),
                        'sex': sex, 'variant': first_variant + row, 'stage': stage})
    assert len(manifest['portraits']) == 12
    path = ROOT / 'assets/images' / ATLAS
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/royal-growth-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{ATLAS}: 12 portraits in four growth sets, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
