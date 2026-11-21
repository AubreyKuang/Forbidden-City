#!/usr/bin/env python3
"""Build the TapTap H5 package: only the playable game, images recompressed, one zip.

    python3 scripts/build-taptap.py                 # dist/taptap/chengongji-h5-V1.0.0.zip
    python3 scripts/build-taptap.py --version 1.0.1 --quality 78
    python3 scripts/build-taptap.py --flat          # index.html at the zip root

TapTap's own uploader zips one ASCII-named folder that holds index.html, so that is
the default layout; --flat is there in case the console asks for index.html at the root.
Docs, tests, screenshots, dev.html and dev tools stay out of the package.
"""
import argparse, hashlib, io, json, os, re, shutil, sys, zipfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDER = 'chengongji'
TOTAL_LIMIT = 60 * 1024 * 1024
TEXT_FILES = ['index.html', 'palace.css', 'ui-layout.css']
SKIP_JS = {'dev-tools.js'}
TEXT_SUFFIXES = {'.html', '.css', '.js'}


def game_scripts():
    html = (ROOT / 'index.html').read_text('utf8')
    return [m.split('?')[0] for m in re.findall(r'<script defer src="\./([^"]+)"></script>', html)]


def used_images(sources):
    """Images the game can request: named in code, or built from a prefix such as story-${key}."""
    text = '\n'.join(sources)
    used = []
    base = ROOT / 'assets/images'
    for path in sorted(p for p in base.rglob('*') if p.is_file() and p.suffix in ('.webp', '.png')):
        if path.parent != base:
            # Folders such as story-cast/ are addressed by folder name plus a key.
            if f'images/{path.parent.relative_to(base).as_posix()}/' in text:
                used.append(path)
            continue
        stem = path.stem
        key = stem[len('story-'):] if stem.startswith('story-') else stem
        if path.name in text or key in text:
            used.append(path)
    return used


def encode(job):
    src, quality, cache_dir = job
    from PIL import Image
    data = src.read_bytes()
    digest = hashlib.sha1(data + f'q{quality}'.encode()).hexdigest()[:16]
    cached = Path(cache_dir) / f'{digest}.webp'
    if cached.exists():
        return str(src), str(cached)
    im = Image.open(io.BytesIO(data))
    im.load()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=quality, method=4)
    # A PNG always becomes WebP; a WebP is replaced only when the new copy is smaller.
    best = out.getvalue() if src.suffix == '.png' or len(out.getvalue()) < len(data) else data
    cached.write_bytes(best)
    return str(src), str(cached)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--version', default='1.0.0')
    ap.add_argument('--quality', type=int, default=80)
    ap.add_argument('--flat', action='store_true')
    args = ap.parse_args()
    if not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
        sys.exit('version must look like 1.0.0')

    out_dir = ROOT / 'dist/taptap'
    stage = out_dir / FOLDER
    cache = ROOT / 'dist/.image-cache'
    shutil.rmtree(stage, ignore_errors=True)
    stage.mkdir(parents=True)
    cache.mkdir(parents=True, exist_ok=True)

    scripts = [s for s in game_scripts() if Path(s).name not in SKIP_JS]
    texts = {name: (ROOT / name).read_text('utf8') for name in TEXT_FILES + scripts}
    images = used_images(texts.values())
    renamed = {p.name: p.stem + '.webp' for p in images if p.suffix == '.png' and p.parent == ROOT / 'assets/images'}

    with ProcessPoolExecutor() as pool:
        encoded = dict(pool.map(encode, [(p, args.quality, str(cache)) for p in images]))

    for name, text in texts.items():
        for old, new in renamed.items():
            text = text.replace(old, new)
        if name == 'index.html':
            text = text.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
        target = stage / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, 'utf8')
    img_dir = stage / 'assets/images'
    img_dir.mkdir(parents=True, exist_ok=True)
    for src in images:
        rel = src.relative_to(ROOT / 'assets/images')
        target = img_dir / rel.parent / renamed.get(src.name, src.name)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(encoded[str(src)], target)
    (stage / 'version.json').write_text(json.dumps({'version': args.version}) + '\n', 'utf8')

    # Every local reference in the package must resolve.
    missing = []
    for name in texts:
        body = (stage / name).read_text('utf8')
        for ref in re.findall(r'\./((?:js|assets)/[^"\'`?)\s$]+)', body):
            # Template prefixes such as story-${key} are checked by used_images().
            if not ref.endswith(('-', '/', '.')) and not (stage / ref).exists():
                missing.append(f'{name}: {ref}')
    if missing:
        sys.exit('missing files:\n' + '\n'.join(sorted(set(missing))))

    zip_path = out_dir / f'chengongji-h5-V{args.version}.zip'
    zip_path.unlink(missing_ok=True)
    files = sorted(p for p in stage.rglob('*') if p.is_file())
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            rel = p.relative_to(stage if args.flat else out_dir)
            kind = zipfile.ZIP_DEFLATED if p.suffix in TEXT_SUFFIXES | {'.json'} else zipfile.ZIP_STORED
            z.write(p, rel.as_posix(), compress_type=kind)

    groups = {}
    for p in files:
        key = 'images' if p.suffix in ('.webp', '.png') else p.suffix.lstrip('.') or 'other'
        groups.setdefault(key, [0, 0])
        groups[key][0] += 1
        groups[key][1] += p.stat().st_size
    source_images = sum(p.stat().st_size for p in images)
    mb = lambda n: f'{n / 1024 / 1024:.1f}MB'
    print(f'TapTap H5 V{args.version}  ->  {zip_path.relative_to(ROOT)}')
    for key, (count, size) in sorted(groups.items(), key=lambda kv: -kv[1][1]):
        print(f'  {key:<7}{count:>5} files  {mb(size):>8}')
    print(f'  images before recompression {mb(source_images)}, after {mb(groups["images"][1])}')
    unpacked = sum(p.stat().st_size for p in files)
    print(f'  unpacked {mb(unpacked)}, zip {mb(zip_path.stat().st_size)}, limit {mb(TOTAL_LIMIT)}')
    if zip_path.stat().st_size > TOTAL_LIMIT or unpacked > TOTAL_LIMIT:
        sys.exit('package is over the 60MB limit')


if __name__ == '__main__':
    main()
