"""Pack the six approved jeweled consorts without repainting their artwork.

Usage: python3 scripts/build-consort-jeweled.py /path/to/generated_images
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
SOURCE = 'exec-826864b7-00bd-4f91-998b-2b662009d7a5.png'
ATLAS = 'palace-consorts-jeweled.webp'
LABELS = ['金粉牡丹', '蓝翎珠华', '绛玫金凤', '紫藤银蝶', '翡翠金莲', '月白玉笛']


def build(folder):
    source_path = folder / SOURCE
    source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
    manifest = {'frame': [448, 560], 'columns': 4, 'styleReference': 472,
                'approved': 'All six ornate headdress and costume portraits, retaining the approved face style and varied upper-body poses',
                'portraits': []}
    atlas = Image.new('RGBA', (1792, 1120))
    with Image.open(source_path) as source:
        assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
        ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
        for cell, label in enumerate(LABELS):
            col, row = cell % 3, cell // 3
            strip = source.crop((0, ys[row], source.width, ys[row + 1]))
            xs = expanded.grid_edges(strip.getchannel('A'), 3)
            box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
            tile = source.crop(box)
            bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
            assert bounds
            frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
            x = cell % 4 * 448 + (448 - frame.width) // 2
            y = (cell // 4 + 1) * 560 - frame.height
            atlas.paste(frame, (x, y))
            manifest['portraits'].append({'id': 515 + cell, 'atlas': ATLAS,
                'source': SOURCE, 'sourceSha256': source_hash, 'sourceSize': list(source.size),
                'cell': cell, 'tile': cell, 'crop': list(box), 'bounds': list(bounds),
                'placed': [x, y, *frame.size], 'label': label})
    dest = ROOT / 'assets/images' / ATLAS
    atlas.save(dest, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/consort-jeweled-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{ATLAS}: 6 portraits, {atlas.size}, {dest.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
