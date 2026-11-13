"""Repack the ORIGINAL source paintings at 2x resolution; never redraw people.

Usage: python3 scripts/rebuild-legacy-portraits.py /path/to/generated_images
Requires Pillow. Source PNGs are read only. Preserve the original chroma key,
proportions, bottom alignment, stable IDs and separate empress crown. Only the
packing resolution changes, from 112x140 to 224x280 per cell. No face generation,
retouching, recoloring, sharpening or stretching is applied.
"""
from pathlib import Path
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LADIES = 'exec-b6452db6-c6ae-4d08-bef4-b7c4c80d5982.png'
COURT = 'exec-d16946bf-617e-48a9-a8f7-798fe998019a.png'
FAMILY = 'exec-e61e9dcb-d018-4697-b3be-808a2286862e.png'
DESCENDANTS = [
    ('exec-32f8bfca-02c3-489c-953e-5befbf444a65.png', 3),
    ('exec-f282add6-979e-4a48-8fdd-681899ef4dfd.png', 3),
    ('exec-67ff0515-09c7-4d18-a2b7-a974a7baa4d5.png', 3),
    ('exec-6ff5c789-27a0-4d7f-b865-b1ddef2283a3.png', 3),
    ('exec-572e91ef-dce7-476a-a261-0fc77a9c0931.png', 4),
]
PRINCESS_BABIES = [
    ('exec-8386ecad-18b4-489e-ace9-65c13f530184.png', 3),
    ('exec-929c9418-9222-4ac2-a4ab-1db4f59d55e0.png', 3),
    ('exec-58ddc48e-612b-431e-bc9f-5bb6476a366a.png', 4),
]


def keyed(source, court=False):
    source = source.convert('RGBA')
    def pixel(p):
        r, g, b, a = p
        remove = (r > 90 and b > 90 and min(r, b)-g > 55 and b > r*.8) if court else (
            r > 130 and b > 105 and min(r, b)-g > 70 and b > r*.79)
        return (0, 0, 0, 0) if remove else (r, g, b, a)
    source.putdata([pixel(p) for p in source.getdata()])
    return source


def borders(counts, count):
    """The same gutter detection used by the original descendants packer."""
    step = len(counts)/count
    result = [0]
    for i in range(1, count):
        a, b = round((i-.20)*step), round((i+.20)*step)
        lowest = min(counts[a:b])
        result.append(min((p for p in range(a, b) if counts[p] <= lowest+1),
                          key=lambda p: abs(p-i*step)))
    return result + [len(counts)]


def trim(tile):
    box = tile.getbbox()
    assert box, 'Empty source portrait'
    return tile.crop(box)


def court_tiles(path, xs, ys):
    with Image.open(path) as source:
        return [trim(keyed(source.crop((x0, y0, x1, y1)), court=True))
                for y0, y1 in zip(ys, ys[1:]) for x0, x1 in zip(xs, xs[1:])]


def growing_tiles(path, cols, rows=3, court=False):
    with Image.open(path) as source:
        art = keyed(source, court=court)
    counts = list(art.getchannel('A').resize((1, art.height), Image.Resampling.BOX).getdata())
    ys = borders(counts, rows)
    result = []
    for y0, y1 in zip(ys, ys[1:]):
        row = art.crop((0, y0, art.width, y1))
        counts = list(row.getchannel('A').resize((row.width, 1), Image.Resampling.BOX).getdata())
        xs = borders(counts, cols)
        result.append([trim(row.crop((x0, 0, x1, row.height))) for x0, x1 in zip(xs, xs[1:])])
    return result


def contain(tile, width, height, scale):
    factor = min(width/tile.width, height/tile.height)
    # Double the original rounded dimensions, so the visible composition is stable.
    size = (round(tile.width*factor)*scale, round(tile.height*factor)*scale)
    return tile.resize(size, Image.Resampling.LANCZOS if scale > 1 else Image.Resampling.BOX)


def atlas(tiles, rows, scale):
    result = Image.new('RGBA', (448*scale, rows*140*scale))
    for cell, tile in enumerate(tiles):
        if tile is None:
            continue
        im = contain(tile, 110, 131, scale)
        x = (cell % 4*112 + (112-im.width//scale)//2)*scale
        result.paste(im, (x, (cell//4+1)*140*scale-im.height))
    return result


def build(folder, output=ROOT, scale=2):
    ladies = court_tiles(folder/LADIES, [0, 315, 630, 946, 1261], [0, 312, 624, 936, 1247])
    court = court_tiles(folder/COURT, [0, 444, 887, 1331, 1774], [0, 444, 887])
    portraits = atlas(ladies[:12] + court + [None] + ladies[12:], 7, scale)
    with Image.open(folder/LADIES) as source:
        crown = source.convert('RGBA').crop((111, 3, 216, 55))
    crown.putdata([(r, g, b, 255) if r > 145 and r >= g*1.01 and g >= b*1.15 and r-b > 44
                   else (0, 0, 0, 0) for r, g, b, _ in crown.getdata()])
    crown = contain(trim(crown), 58, 26, scale)
    portraits.paste(crown, ((26+(60-crown.width//scale)//2)*scale, 702*scale))
    family = atlas([tile for row in growing_tiles(folder/FAMILY, 4, 4, court=True) for tile in row], 4, scale)
    sheets = [growing_tiles(folder/name, cols) for name, cols in DESCENDANTS]
    # The princess hairstyle update kept the earlier baby portraits intact.
    for sheet, (name, cols) in zip(sheets[2:], PRINCESS_BABIES):
        sheet[0] = growing_tiles(folder/name, cols)[0]
    descendants = [tile for group in (sheets[:2], sheets[2:])
                   for row in range(3) for sheet in group for tile in sheet[row]]
    assert len(descendants) == 48
    output.mkdir(parents=True, exist_ok=True)
    for name, art in [('palace-portraits-b.webp', portraits), ('palace-family.webp', family),
                      ('palace-descendants.webp', atlas(descendants, 12, scale))]:
        path = output/name
        art.save(path, 'WEBP', lossless=True, exact=True, method=6)
        print(f'{name}: {art.width}x{art.height}, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT)
    parser.add_argument('--scale', type=int, choices=[1, 2], default=2,
                        help='1 reproduces legacy packing for identity verification; game uses 2')
    args = parser.parse_args()
    build(args.source_folder, args.output, args.scale)
