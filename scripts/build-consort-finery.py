"""Pack the twelve approved refined and ancient-painting-inspired consorts.

Usage: python3 scripts/build-consort-finery.py /path/to/generated_images
Only extract cells, scale proportionally and pack; never repaint approved art.
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
ATLAS = 'palace-consorts-ancient-finery.webp'
SOURCES = [
    ('exec-88ec8ed5-9c60-417d-b8fe-676d70a824f1.png',
     ['鹅黄春杏', '湖青兰书', '胭脂海棠', '月白清霜', '藕紫流萤', '黛蓝银鹊']),
    ('exec-41c7c9bf-7b90-4626-b2ce-579556fefafc.png',
     ['榴红金缕', '粉翠蝶钗', '青碧玉梳', '宝蓝凤钗', '珊瑚金梳', '月白紫玉']),
]


def build(folder):
    atlas = Image.new('RGBA', (1792, 1680))
    manifest = {'frame': [448, 560], 'columns': 4, 'styleReference': 472,
                'approved': 'Twelve consorts: the corrected six-person revision and all six ancient-painting-inspired designs',
                'portraits': []}
    for source_name, labels in SOURCES:
        source_path = folder / source_name
        source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
        with Image.open(source_path) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
            for cell, label in enumerate(labels):
                col, row = cell % 3, cell // 3
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), 3)
                box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                tile = source.crop(box)
                bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                assert bounds
                frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                index = len(manifest['portraits'])
                x = index % 4 * 448 + (448 - frame.width) // 2
                y = (index // 4 + 1) * 560 - frame.height
                atlas.paste(frame, (x, y))
                manifest['portraits'].append({'id': 503 + index, 'atlas': ATLAS,
                    'source': source_name, 'sourceSha256': source_hash, 'sourceSize': list(source.size),
                    'cell': cell, 'tile': index, 'crop': list(box), 'bounds': list(bounds),
                    'placed': [x, y, *frame.size], 'label': label})
    assert [p['id'] for p in manifest['portraits']] == list(range(503, 515))
    dest = ROOT / 'assets/images' / ATLAS
    atlas.save(dest, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/consort-finery-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{ATLAS}: 12 portraits, {atlas.size}, {dest.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
