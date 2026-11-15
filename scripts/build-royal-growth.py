"""Pack approved princess and prince sets, preserving all three growth stages.

Usage: python3 scripts/build-royal-growth.py /path/to/generated_images
Use --petite to pack the two additional small-face princess growth sets.
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


def build(folder, petite=False):
    sources = [('exec-d4760c48-4151-4559-ab2b-d3ca403bce86.png', 'f', 35)] if petite else SOURCES
    atlas_name = 'palace-princess-petite-growth.webp' if petite else ATLAS
    manifest_name = 'princess-petite-growth-sources.json' if petite else 'royal-growth-sources.json'
    first_id = 392 if petite else 380
    count = len(sources) * 6
    atlas = Image.new('RGBA', (1792, ((count + 3) // 4) * 560))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, sex, first_variant in sources:
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
                    manifest['portraits'].append({'id': first_id + index, 'atlas': atlas_name,
                        'source': filename, 'cell': row * 3 + stage, 'crop': list(box),
                        'sex': sex, 'variant': first_variant + row, 'stage': stage})
    assert len(manifest['portraits']) == count
    path = ROOT / 'assets/images' / atlas_name
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs' / manifest_name).write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{atlas_name}: {count} portraits in {count // 3} growth sets, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    parser.add_argument('--petite', action='store_true')
    args = parser.parse_args()
    build(args.source_folder, petite=args.petite)
