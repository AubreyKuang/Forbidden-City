"""Pack eighteen approved Gouyi-style consorts, without repainting the source art.

Usage: python3 scripts/build-consort-colors.py /path/to/generated_images
The ruqun sheet uses the approved pink-and-green revision, not its orange draft.
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
SHEETS = [
    (459, 'palace-consorts-colors-one.webp', 'exec-a0bcd610-ccee-4ec8-b183-7c37b6048c03.png',
     ['绛红牡丹', '青玉兰香', '孔雀蓝鹤', '杏金银杏', '紫藤书韵', '海棠粉绣']),
    (465, 'palace-consorts-colors-two.webp', 'exec-15b6c334-8bbc-4ba7-87d7-b1d22b0a2e6e.png',
     ['墨绿竹影', '浅蓝梅雪', '橘红回眸', '玄金菊华', '藕紫莲影', '黛蓝书信']),
    (471, 'palace-consorts-ruqun-pink-green.webp', 'exec-dc140b52-ccdc-408b-ae4d-cb38c1b17ca0.png',
     ['冰蓝扶花', '粉绿回眸', '紫藤香囊', '绣球蓝扇', '绿粉捧桃', '青莲披帛']),
]


def build(folder):
    manifest = {'frame': [448, 560], 'columns': 4, 'styleReference': 422,
                'approved': 'Three sheets, eighteen consorts including the pink-and-green ruqun revision', 'portraits': []}
    for start, filename, source_name, labels in SHEETS:
        source_path = folder / source_name
        source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
        atlas = Image.new('RGBA', (1792, 1120))
        with Image.open(source_path) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
            for cell, label in enumerate(labels):
                col, row = cell % 3, cell // 3
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), 3)
                box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                tile = source.crop(box)
                bounds = tile.getchannel('A').getbbox()
                assert bounds
                frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                x = cell % 4 * 448 + (448 - frame.width) // 2
                y = (cell // 4 + 1) * 560 - frame.height
                atlas.paste(frame, (x, y))
                manifest['portraits'].append({'id': start + cell, 'atlas': filename,
                    'source': source_name, 'sourceSha256': source_hash, 'sourceSize': list(source.size),
                    'cell': cell, 'crop': list(box), 'bounds': list(bounds), 'placed': [x, y, *frame.size],
                    'label': label})
        dest = ROOT / 'assets/images' / filename
        atlas.save(dest, 'WEBP', quality=96, method=6, exact=True)
        print(f'{filename}: 6 portraits, {atlas.size}, {dest.stat().st_size:,} bytes')
    assert [p['id'] for p in manifest['portraits']] == list(range(459, 477))
    (ROOT / 'docs/consort-colors-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
