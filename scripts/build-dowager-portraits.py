"""Pack the eighteen approved dowagers without repainting their artwork.

Usage: python3 scripts/build-dowager-portraits.py /path/to/generated_images
Only atlas extraction, proportional fitting, and transparent placement. Source
files remain untouched; existing portrait IDs and atlases remain untouched.
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
    (441, 'palace-dowagers-ceremonial.webp', 'exec-bceb4c24-8fb6-4425-bfa2-53d9a09f5cb9.png',
     ['玄金凤仪', '朱绣牡丹', '墨翠如意', '紫金云肩', '月白凤章', '黛蓝珠华']),
    (447, 'palace-dowagers-daily.webp', 'exec-f2424f17-8926-48bf-9797-9ffa390a3723.png',
     ['海棠品茗', '松青慈颜', '香金书韵', '青黛玉兰', '藕紫团扇', '雪裘红梅']),
    (453, 'palace-dowagers-young.webp', 'exec-46dcee23-0fad-4564-8201-c064ecbf618d.png',
     ['绛红凤仪', '青玉含笑', '黛蓝端肃', '海棠温婉', '月白雍容', '紫藤清贵']),
]


def build(folder):
    manifest = {'frame': [448, 560], 'columns': 4, 'approved': 'All three sets, 18 portraits', 'portraits': []}
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
                assert bounds, (source_name, cell)
                frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                x = cell % 4 * 448 + (448 - frame.width) // 2
                y = (cell // 4 + 1) * 560 - frame.height
                atlas.paste(frame, (x, y))
                manifest['portraits'].append({'id': start + cell, 'atlas': filename,
                    'source': source_name, 'sourceSha256': source_hash, 'sourceSize': list(source.size),
                    'cell': cell, 'crop': list(box), 'bounds': list(bounds), 'placed': [x, y, *frame.size],
                    'usage': 'initial-dowager', 'label': label})
        path = ROOT / 'assets/images' / filename
        atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
        print(f'{filename}: 6 portraits, {atlas.size}, {path.stat().st_size:,} bytes')
    assert [p['id'] for p in manifest['portraits']] == list(range(441, 459))
    (ROOT / 'docs/dowager-portrait-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
