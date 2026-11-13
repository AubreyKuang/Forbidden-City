"""Pack eight approved transparent portraits, without rewriting any existing atlas.
Run: python3 scripts/build-gentle-portraits.py /path/to/generated_images
Cells 240–243: consorts. Cells 244–247: adult princesses. 448×560 per cell.
"""
from pathlib import Path
import argparse
from PIL import Image, ImageOps
ASSET_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'images'
SOURCES = [
    'exec-4b5c3ed3-b6e8-4ad1-92ce-2246a4210d1f.png',
    'exec-3a1b979d-eb63-4840-8378-dafb57681d13.png',
    'exec-1c731e41-cdef-4e3a-9f04-714df340dbb8.png',
    'exec-c86113ba-f162-431f-9fad-203328d1f62a.png',
    'exec-b8ddeb04-f28c-4e18-bd5e-b922dedee66b.png',
    'exec-1e5c4add-83a5-4f87-9c48-73d5bd225f68.png',
    'exec-58bce3d8-9ce4-4a8a-8284-72293bb9ca5d.png',
    'exec-0e54c67c-693b-42c0-a73b-371df03ccdc7.png',
]
if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_folder',type=Path)
    args=parser.parse_args()
    atlas=Image.new('RGBA',(1792,1120))
    for i,name in enumerate(SOURCES):
        with Image.open(args.source_folder/name) as original:
            assert original.mode=='RGBA' and original.getextrema()[3][0]==0, name+' needs real alpha'
            # Asset packing only; background extraction was done by the image editor.
            frame=ImageOps.contain(original,(448,560),Image.Resampling.LANCZOS)
            atlas.paste(frame,((i%4)*448+(448-frame.width)//2,(i//4)*560+560-frame.height))
    output=ASSET_DIR/'palace-gentle-portraits.webp'
    output.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(output,'WEBP',quality=96,method=6,exact=True)
    print(f'{output.name}: {atlas.width}×{atlas.height}; eight transparent portraits; {output.stat().st_size:,} bytes')
