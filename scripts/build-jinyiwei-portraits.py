"""Pack the approved corrected guards and four selected earlier portraits.

Usage: python3 scripts/build-jinyiwei-portraits.py /path/to/generated_images
Sources remain untouched. Only grid extraction, proportional scaling and
transparent atlas placement are performed. Never substitute the two batches.
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
SHEETS = [
    (423, 'palace-jinyiwei.webp', 'exec-365cbf96-f794-4fa0-bb92-9561cfa9c56c.png',
     [0, 1, 2, 3, 4, 5], 'jinyiwei', ['玄黑金绣', '朱红金绣', '藏青银绣', '墨绿金绣', '月白金绣', '绛紫金绣']),
    (429, 'palace-officials-selected.webp', 'exec-a0e084cb-7206-4c65-a8ca-1bfd2d3ba03c.png',
     [0, 1, 2, 4], 'official-brother', ['玄黑束发', '朱红官帽', '藏青披发', '月白披发']),
]


def build(folder):
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for start, filename, source_name, cells, usage, labels in SHEETS:
        atlas = Image.new('RGBA', (1792, ((len(cells) + 3) // 4) * 560))
        with Image.open(folder / source_name) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
            for index, cell in enumerate(cells):
                col, row = cell % 3, cell // 3
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), 3)
                box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                tile = source.crop(box)
                bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                assert bounds, (source_name, cell)
                frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                atlas.paste(frame, (index % 4 * 448 + (448 - frame.width) // 2,
                                   (index // 4 + 1) * 560 - frame.height))
                manifest['portraits'].append({'id': start + index, 'atlas': filename,
                    'source': source_name, 'cell': cell, 'crop': list(box),
                    'usage': usage, 'label': labels[index]})
        path = ROOT / 'assets/images' / filename
        atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
        print(f'{filename}: {len(cells)} portraits, {atlas.size}, {path.stat().st_size:,} bytes')
    assert [p['id'] for p in manifest['portraits']] == list(range(423, 433))
    (ROOT / 'docs/jinyiwei-portrait-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
