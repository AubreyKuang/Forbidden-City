"""Pack the approved character art without repainting or replacing older portraits.

Usage: python3 scripts/build-expanded-portraits.py /path/to/generated_images
Requires Pillow. Each source stays untouched. Grid extraction, proportional
resizing and bottom alignment only; original RGBA pixels retain their alpha.
The manifest records the source cell for every stable game portrait ID.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    'consorts': ('exec-7f368ff0-d865-4621-bb4a-44080e601092.png', 4, 2),
    'consorts-varied': ('exec-79fe2255-8432-4d68-ae94-3d7b2fc4f76d.png', 3, 2),
    'consorts-regional': ('exec-327d7436-8f65-437c-9f5b-7f200f36c8cb.png', 3, 2),
    'relatives': ('exec-289b78a1-0a99-486a-90f3-4e2eba7d0620.png', 4, 2),
    'relatives-court': ('exec-e25c4541-2da7-42ad-aa3b-ff21ccb70a83.png', 3, 2),
    'relatives-martial': ('exec-311e84f0-e17d-4677-8146-4a47aa918726.png', 3, 2),
    'relatives-civilian': ('exec-fe5bf13e-f878-4025-a98b-0bc2525de12e.png', 3, 2),
    'princes': ('exec-a3ecdf04-b824-43d5-8d8b-030ac3f7b268.png', 3, 2),
    'princesses': ('exec-5986af5a-ed05-4f47-82d3-621b09a6f266.png', 3, 2),
    'infants': ('exec-15265987-6376-4e82-976b-fbb0838b0091.png', 3, 2),
    'emperors': ('exec-68e4b348-a012-4b90-a5a4-a06231db9363.png', 2, 2),
}


def all_cells(*groups):
    return [(group, i) for group in groups
            for i in range(SOURCES[group][1] * SOURCES[group][2])]


def royal_cells():
    # Each sex has three identities, each with its own infant, child and grown art.
    return [(group, index)
            for sex, group in enumerate(('princes', 'princesses'))
            for group, indices in [('infants', range(sex * 3, sex * 3 + 3)),
                                   (group, range(6))]
            for index in indices]


def grid_edges(alpha, count, vertical=False):
    """Locate actual transparent gutters; generated rows are not equal height."""
    mask = alpha.point(lambda value: 255 if value > 100 else 0)
    counts = list(mask.resize((1, mask.height) if vertical else (mask.width, 1), Image.Resampling.BOX).getdata())
    step = len(counts) / count
    edges = [0]
    for index in range(1, count):
        candidates = range(round((index - .18) * step), round((index + .18) * step))
        lowest = min(counts[pos] for pos in candidates)
        edges.append(min((pos for pos in candidates if counts[pos] == lowest), key=lambda pos: abs(pos - index * step)))
    return edges + [len(counts)]


SHEETS = [
    (248, 'palace-consorts-expanded.webp', all_cells('consorts', 'consorts-varied', 'consorts-regional')),
    (268, 'palace-relatives-expanded.webp', all_cells('relatives', 'relatives-court', 'relatives-martial', 'relatives-civilian')),
    (294, 'palace-royals-expanded.webp', royal_cells()),
    (312, 'palace-emperors-expanded.webp', all_cells('emperors')),
]

# A few sleeves/props cross a nominal cell boundary. Narrow only the outer crop
# to omit the adjacent portrait's sliver; never repaint the approved character.
CROP_INSETS = {('consorts-varied', 0): (0, 0, 11, 0),
               ('consorts-varied', 3): (0, 9, 0, 0),
               ('consorts-varied', 5): (18, 0, 0, 0)}


def build(folder):
    output = ROOT / 'assets' / 'images'
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': []}
    for start, filename, cells in SHEETS:
        atlas = Image.new('RGBA', (1792, ((len(cells) + 3) // 4) * 560))
        for index, (group, cell) in enumerate(cells):
            source_name, cols, rows = SOURCES[group]
            with Image.open(folder / source_name) as source:
                assert source.mode == 'RGBA' and source.getextrema()[3][0] == 0, source_name
                col, row = cell % cols, cell // cols
                ys = grid_edges(source.getchannel('A'), rows, vertical=True)
                strip = source.crop((0, ys[row], source.width, ys[row + 1]))
                xs = grid_edges(strip.getchannel('A'), cols)
                box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
                left, top, right, bottom = CROP_INSETS.get((group, cell), (0, 0, 0, 0))
                box = (box[0] + left, box[1] + top, box[2] - right, box[3] - bottom)
                tile = source.crop(box)
                bounds = tile.getchannel('A').point(lambda value: 255 if value > 8 else 0).getbbox()
                assert bounds, (source_name, cell)
                # Contain the entire approved silhouette, including props and headwear.
                frame = ImageOps.contain(tile.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
                atlas.paste(frame, ((index % 4) * 448 + (448 - frame.width) // 2,
                                   (index // 4 + 1) * 560 - frame.height))
            manifest['portraits'].append({'id': start + index, 'atlas': filename,
                                         'source': source_name, 'cell': cell, 'crop': list(box)})
        path = output / filename
        atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
        print(f'{filename}: {len(cells)} portraits, {atlas.size}, {path.stat().st_size:,} bytes')
    assert [item['id'] for item in manifest['portraits']] == list(range(248, 316))
    (ROOT / 'docs' / 'expanded-portrait-sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
