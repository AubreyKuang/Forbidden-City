"""Pack the nine approved floral consort portraits with stable appended IDs.

Usage: python3 scripts/build-flower-consorts.py /path/to/generated_images
Only source-grid extraction, proportional resizing and transparent atlas
packing are performed; the approved faces, costumes and framing are preserved.
"""
import argparse
import importlib.util
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('expanded', ROOT / 'scripts/build-expanded-portraits.py')
expanded = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expanded)
SOURCES = [
    ('exec-b585dfcb-67fe-450f-8716-b277976e9001.png', 3, 2),
    ('exec-80e7110c-58fb-412a-84df-4d07a502c9f3.png', 1, 1),
    ('exec-99514c14-0a21-4bde-867b-04a2b6916e16.png', 2, 1),
]
ATLAS = 'palace-consorts-flowers.webp'


def build(folder):
    atlas = Image.new('RGBA', (1792, 1680))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, columns, rows in SOURCES:
        with Image.open(folder / filename) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), rows, vertical=True)
            for row in range(rows):
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), columns)
                for col in range(columns):
                    box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                    # Omit the faint bottom edge of the preceding source row.
                    if rows == 2 and row == 1:
                        box = (box[0], box[1] + 6, box[2], box[3])
                    tile = source.crop(box)
                    bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                    assert bounds, (filename, row, col)
                    tile = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                    index = len(manifest['portraits'])
                    atlas.paste(tile, (index % 4 * 448 + (448 - tile.width) // 2,
                                       (index // 4 + 1) * 560 - tile.height))
                    manifest['portraits'].append({'id': 371 + index, 'atlas': ATLAS,
                        'source': filename, 'cell': row * columns + col, 'crop': list(box)})
    assert len(manifest['portraits']) == 9
    path = ROOT / 'assets/images' / ATLAS
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/flower-consort-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{ATLAS}: 9 portraits, {atlas.size}, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
