"""Pack 24 approved official portraits without repainting the source images.

Usage: python3 scripts/build-official-portraits.py /path/to/generated_images
Requires Pillow; records each original source cell, crop, role and stable ID.
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
    ('exec-d917a5a2-ecf2-45ae-b934-130b605d8d05.png', 'civil', {3, 5}),
    ('exec-bf4af560-9c73-486a-9595-620e4504faf5.png', 'army', {3, 5}),
    ('exec-db227d87-30d4-47ac-9476-ed5153292089.png', 'civil', set()),
    ('exec-c1ad7235-72e6-487e-b9c1-439a80f7a7fc.png', 'army', set()),
]
ATLAS = 'palace-officials-expanded.webp'
# The approved green-cloaked general needed a background-removal pass.
CUTOUTS = {408: 'exec-2cc750c0-462a-4922-b075-ccd73a7d7eac.png'}
# Exclude the preceding row's one-pixel fringe and adjacent sleeves. These are
# source extraction insets, not changes to the character artwork.
CROP_INSETS = {401: (0, 2, 0, 0), 402: (0, 2, 0, 0), 403: (0, 2, 0, 0),
               413: (0, 2, 1, 0), 414: (6, 2, 0, 0), 415: (0, 2, 0, 0),
               419: (0, 3, 0, 0), 420: (0, 3, 0, 0), 421: (0, 3, 0, 0)}


def build(folder):
    atlas = Image.new('RGBA', (1792, 3360))
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for filename, bloc, mature in SOURCES:
        with Image.open(folder / filename) as source:
            assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
            ys = expanded.grid_edges(source.getchannel('A'), 2, vertical=True)
            for row in range(2):
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = expanded.grid_edges(strip.getchannel('A'), 3)
                for col in range(3):
                    cell = row * 3 + col
                    index = len(manifest['portraits'])
                    portrait_id = 398 + index
                    box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                    left, top, right, bottom = CROP_INSETS.get(portrait_id, (0, 0, 0, 0))
                    box = (box[0] + left, box[1] + top, box[2] - right, box[3] - bottom)
                    tile = source.crop(box)
                    if portrait_id in CUTOUTS:
                        with Image.open(folder / CUTOUTS[portrait_id]) as cutout:
                            tile = cutout.copy()
                    bounds = tile.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                    assert bounds, (filename, cell)
                    frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                    atlas.paste(frame, (index % 4 * 448 + (448 - frame.width) // 2,
                                       (index // 4 + 1) * 560 - frame.height))
                    manifest['portraits'].append({'id': 398 + index, 'atlas': ATLAS,
                        'source': filename, 'cell': cell, 'crop': list(box), 'bloc': bloc,
                        'ageGroup': 'mature' if cell in mature else 'young'})
                    if portrait_id in CUTOUTS:
                        manifest['portraits'][-1]['transparentSource'] = CUTOUTS[portrait_id]
    assert [p['id'] for p in manifest['portraits']] == list(range(398, 422))
    path = ROOT / 'assets/images' / ATLAS
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    (ROOT / 'docs/official-portrait-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{ATLAS}: 24 portraits, {atlas.size}, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
