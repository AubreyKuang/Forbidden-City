"""Pack the approved Gouyi consort portrait as reserved game ID 422.

Usage: python3 scripts/build-gouyi-portrait.py /path/to/generated_images
Only proportional scaling and transparent atlas placement are performed.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = 'exec-3f04e16c-396b-419b-8119-510234ffe1bd.png'
ATLAS = 'palace-consort-gouyi.webp'


def build(folder):
    atlas = Image.new('RGBA', (1792, 560))
    with Image.open(folder / SOURCE) as source:
        assert source.mode == 'RGBA' and source.getchannel('A').getextrema()[0] == 0
        bounds = source.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        frame = ImageOps.contain(source.crop(bounds), (440, 552), Image.Resampling.LANCZOS)
        atlas.paste(frame, ((448 - frame.width) // 2, 560 - frame.height))
    path = ROOT / 'assets/images' / ATLAS
    atlas.save(path, 'WEBP', quality=96, method=6, exact=True)
    manifest = {'frame': [448, 560], 'columns': 4, 'portraits': [
        {'id': 422, 'key': 'gouyi', 'name': '钩弋夫人', 'atlas': ATLAS,
         'source': SOURCE, 'cell': 0, 'crop': list(bounds), 'storyOnly': True}]}
    (ROOT / 'docs/gouyi-portrait-source.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'{ATLAS}: ID 422, {atlas.size}, {path.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder', type=Path)
    build(parser.parse_args().source_folder)
