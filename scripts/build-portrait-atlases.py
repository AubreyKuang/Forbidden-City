"""Pack the approved portrait sheets into stable game atlases (requires Pillow).

Usage: python3 scripts/build-portrait-atlases.py /path/to/generated_images
Source art stays untouched. Uniform grid crops are scaled proportionally to fill
224 x 280 game frames; only the outer shoulder margins are cropped, never stretched.
The original three atlases and their IDs 0–91 are not modified.
"""
from pathlib import Path
import argparse
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSET_DIR = ROOT / 'assets' / 'images'
SHEETS = [
    ('exec-2bc5533a-3894-4550-ac0d-36ee12b875c6.png', 4, 3),
    ('exec-41a70740-8c99-47aa-8eae-d5ce91d198cf.png', 4, 2),
    ('exec-d870ad0a-08eb-4413-919c-6395b5a5e3c1.png', 4, 3),
    ('exec-af5c68f0-096b-4894-a6fb-dccfa72627db.png', 4, 3),
    ('exec-3ac8d9b8-3fba-4d5e-b087-1f0e656612fe.png', 6, 3),
    ('exec-4ed181ad-901c-4137-9689-bc872691e6d6.png', 6, 3),
    ('exec-bff22fb7-e2bf-408c-ab50-e10ee2e370fb.png', 6, 3),
    ('exec-54b1f9ee-b883-4c43-adf1-8bc4fb7313dd.png', 6, 3),
    ('exec-25d889b3-6ed6-4e04-ae7d-87e19d1b8358.png', 4, 2),
    ('exec-cd1d2665-9834-45b9-99a2-605aee937741.png', 4, 3),
    ('exec-578dfbd9-27f9-47e3-bac3-c3fc44da0961.png', 4, 3),
]

def tiles(folder, specs):
    for filename, cols, rows in specs:
        with Image.open(folder / filename) as source:
            source = source.convert('RGBA')
            edges = {
                'exec-cd1d2665-9834-45b9-99a2-605aee937741.png': [0, 327, 640, 1086],
                'exec-578dfbd9-27f9-47e3-bac3-c3fc44da0961.png': [0, 378, 746, 1448],
            }.get(filename, [round(r * source.height / rows) for r in range(rows + 1)])
            for row in range(rows):
                for col in range(cols):
                    box = (round(col * source.width / cols), edges[row],
                           round((col + 1) * source.width / cols), edges[row + 1])
                    yield ImageOps.fit(source.crop(box), (224, 280), Image.Resampling.LANCZOS, centering=(.5, 0))

def pack(folder, specs, output, count):
    frames = list(tiles(folder, specs))
    assert len(frames) == count and count % 4 == 0
    atlas = Image.new('RGBA', (896, count // 4 * 280))
    for index, frame in enumerate(frames):
        atlas.paste(frame, ((index % 4) * 224, (index // 4) * 280))
    dest = ASSET_DIR / output
    dest.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(dest, 'WEBP', quality=95, method=6, exact=True)
    print(f'{output}: {count} portraits, {atlas.width}×{atlas.height}, {dest.stat().st_size:,} bytes')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    args = parser.parse_args()
    pack(args.source_folder, SHEETS[:4], 'palace-beauties.webp', 44)
    pack(args.source_folder, SHEETS[4:6], 'palace-young-royals.webp', 36)
    pack(args.source_folder, SHEETS[6:8], 'palace-young-royals-2.webp', 36)
    pack(args.source_folder, SHEETS[8:9], 'palace-regalia.webp', 8)
    pack(args.source_folder, SHEETS[9:], 'palace-royal-regalia.webp', 24)
