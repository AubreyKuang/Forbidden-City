"""Pack five colorful busts plus four white medium portraits and four white busts.

Usage: python3 scripts/build-consort-closeups.py /path/to/generated_images
The centered 4:5 crop retains the approved upper-body framing. The white
full-length alternatives are deliberately excluded.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [('exec-18ac34e0-90f8-45c1-be2d-1413c18b6aad.png', (1536, 1024), 3, [0, 2, 3, 4, 5]),
           ('exec-c722316b-2d03-47c2-91e6-74784eb0d5cf.png', (1312, 1199), 2, [0, 1, 2, 3]),
           ('exec-cd8a972e-c7eb-4491-aec9-cbda05b29ab4.png', (1312, 1199), 2, [0, 1, 2, 3])]
ATLAS = 'palace-consorts-closeups.webp'


def build(folder):
    atlas = Image.new('RGBA', (1792, 2240))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, size, columns, cells in SOURCES:
        with Image.open(folder / filename) as source:
            assert source.mode == 'RGBA' and source.size == size
            assert source.getchannel('A').getextrema()[0] == 0
            for cell in cells:
                x = cell % columns * (source.width // columns)
                y = round(cell // columns * source.height / 2)
                bottom = round((cell // columns + 1) * source.height / 2)
                width = round((bottom - y) * 4 / 5)
                left = x + (source.width // columns - width) // 2
                box = (left, y, left + width, bottom)
                tile = ImageOps.contain(source.crop(box), (440, 552), Image.Resampling.LANCZOS)
                index = len(manifest['portraits'])
                atlas.paste(tile, (index % 4 * 448 + (448 - tile.width) // 2,
                                  (index // 4 + 1) * 560 - tile.height))
                manifest['portraits'].append({'id': 358 + index, 'atlas': ATLAS,
                    'source': filename, 'cell': cell, 'crop': list(box)})
    path = ROOT / 'assets/images' / ATLAS
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/consort-closeup-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{ATLAS}: 13 portraits, {atlas.size}, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
