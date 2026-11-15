"""Pack the 42 approved consort cutouts; preserve source art and stable IDs.

Usage: python3 scripts/build-consort-gallery.py /path/to/generated_images
Uses Pillow. Sources remain unchanged; only grid extraction, proportional
resizing and transparent atlas packing are performed.
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
    'exec-9d5ad0e1-7b84-4ef4-ba82-4e00c157b02a.png',
    'exec-9d20719f-68b5-4532-b464-ce344349d370.png',
    'exec-68120277-4c45-4622-9016-d2070403670c.png',
    'exec-5d209746-aaf5-4e1b-ba9b-328d1b59d891.png',
    'exec-1a3849ce-af0e-424f-ab54-480977a89b0d.png',
    'exec-fd33752e-eee6-4937-be76-28591c232721.png',
    'exec-f374d3a7-7e7e-45de-9749-7e7656c3fc0b.png',
]
SHEETS = [(316, 'palace-consorts-legends.webp', range(4)),
          (340, 'palace-consorts-foreign.webp', [4]),
          (346, 'palace-consorts-finery.webp', [5, 6])]
# Exclude tiny fragments of adjacent sleeves at three source-grid edges.
CROP_INSETS = {(1, 1): (0, 0, 7, 0), (2, 1): (0, 0, 3, 0), (2, 5): (3, 0, 0, 0)}


def build(folder):
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for start, filename, groups in SHEETS:
        atlas = Image.new('RGBA', (1792, ((len(groups) * 6 + 3) // 4) * 560))
        index = 0
        for group in groups:
            with Image.open(folder / SOURCES[group]) as source:
                assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
                ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
                for row in range(2):
                    strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                    xs = expanded.grid_edges(strip.getchannel('A'), 3)
                    for col in range(3):
                        box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                        left, top, right, bottom = CROP_INSETS.get((group, row * 3 + col), (0, 0, 0, 0))
                        box = (box[0] + left, box[1] + top, box[2] - right, box[3] - bottom)
                        tile = source.crop(box)
                        bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                        assert bounds, (group, row, col)
                        cutout = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                        atlas.paste(cutout, ((index % 4) * 448 + (448 - cutout.width) // 2,
                                            (index // 4 + 1) * 560 - cutout.height))
                        manifest['portraits'].append({'id': start + index, 'atlas': filename,
                            'source': SOURCES[group], 'cell': row * 3 + col, 'crop': list(box)})
                        index += 1
        path = ROOT / 'assets/images' / filename
        atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
        print(f'{filename}: {index} frames, {atlas.size}, {path.stat().st_size:,} bytes')
    assert [p['id'] for p in manifest['portraits']] == list(range(316, 358))
    (ROOT / 'docs/consort-gallery-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
