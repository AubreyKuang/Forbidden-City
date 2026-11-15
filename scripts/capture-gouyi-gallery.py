"""Capture the published, isolated demo pages with a remote browser screenshot API.

Only public fictional demo data is sent. These are rendered screenshots, not an
interactive Playwright acceptance run. Inspect every image before documenting it.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request
import argparse

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--gallery', choices=['gouyi', 'royal-heart'], default='gouyi')
args = parser.parse_args()
NAMES = ['meeting', 'profile', 'inquiry', 'lamplight', 'friendship', 'rivalry', 'chronicle', 'reading'] if args.gallery == 'gouyi' else ['young', 'adult', 'refusal', 'marriage', 'chronicle', 'check']
REVISION = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
DEST = ROOT / 'docs/screenshots' / args.gallery
DEST.mkdir(parents=True, exist_ok=True)

def capture(name):
    target = f'https://aubreykuang.github.io/Forbidden-City/docs/qa/{args.gallery}-gallery/{name}.html?revision={REVISION}'
    request = urllib.request.Request('https://image.thum.io/get/noanimate/allowJPG/width/1200/crop/1200/' + target,
                                     headers={'User-Agent': 'Forbidden-City-Documentation'})
    with urllib.request.urlopen(request, timeout=55) as response:
        data = response.read()
        mime = response.headers.get('Content-Type', '')
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        suffix = 'png'
    elif data.startswith(b'\xff\xd8\xff'):
        suffix = 'jpg'
    else:
        raise ValueError(f'{name}: response is not a screenshot ({mime})')
    file = DEST / f'{name}.{suffix}'
    file.write_bytes(data)
    print(f'{name}: {len(data)} bytes -> {file.name}', flush=True)
    return {'scene': name, 'url': target, 'file': str(file.relative_to(ROOT)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(), 'visualReview': 'pending'}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        captures = list(pool.map(capture, NAMES))
    report = {'revision': REVISION, 'capturedAt': datetime.now(timezone.utc).isoformat(),
              'method': 'Remote browser rendering of the real game with disposable public demo saves',
              'provider': 'https://www.thum.io/documentation/api/url',
              'interactiveAcceptance': False, 'captures': captures}
    (ROOT / f'docs/qa/{args.gallery}-screenshots.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
