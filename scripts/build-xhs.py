#!/usr/bin/env python3
"""Build the Xiaohongshu mini-tool package (小红书小工具) from the shared game source.

    python3 scripts/build-xhs.py --tools /path/to/tools        # dist/xhs/chengongji-xhs-V1.0.0.zip
    python3 scripts/build-xhs.py --tools DIR --version 1.0.1

The same pipeline builds the 易次元 package (--target yiciyuan, or scripts/build-yiciyuan.py):
full content, cloud saves through the platform SDK, dist/yiciyuan/chengongji-yiciyuan-V*.zip.
The notes below describe the xhs target; the yiciyuan differences are in TARGETS,
scripts/yiciyuan-edition.json, YC_HEAD and js/yiciyuan-host.js.

--tools is a folder outside the repository holding node_modules for the build-time
transpilers (nothing from it ships):

    mkdir -p /tmp/xhs-tools && cd /tmp/xhs-tools && npm init -y >/dev/null && \\
      npm install esbuild@0.24.2 lightningcss@1.28.2 acorn@8.14.0 sharp@0.33.5

What the build does (rules: .claude/skills/minitool-zip-builder, performance-budget.md):
- index.html is written fresh: <!DOCTYPE html>, lang/charset/viewport, a static first
  screen (title + 「正在准备…」) shown before any script runs, external defer scripts only.
- The edition config (scripts/xhs-edition.json) opens one story consort and one fenghua
  person, caps the reign line at three emperors and turns off file export and browser
  storage. It becomes js/xhs-edition-config.js, loaded before the game.
- JS is lowered to ES2017 / Chrome 61 and checked by an ES2017 parser; js/compat.js fills
  the few newer library methods the game calls. CSS is lowered to a Chrome 61 baseline
  (scripts/lib/xhs-transform.cjs).
- dev-tools, the TapTap host, docs and tests stay out; the build fails if any dev panel
  file or string reaches the package, or if a forbidden capability is found.
- Images: only files the game can request, minus the locked characters' art, resized to
  their on-screen size (2x) and re-encoded as WebP. Sizes before and after are printed.
"""
import argparse, hashlib, io, json, re, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'dist/.image-cache-xhs'  # shared: both targets encode images the same way
# 易次元 platform SDK (login, cloud saves, play time), loaded from the platform CDN as its
# docs require; the version is pinned (the CDN has no "latest").
AVG_SDK = 'https://s9.music.126.net/musicst/npm/@avgjs/ai-game-sdk/2.0.1/index.iife.js'
TARGETS = {
    'xhs': {'label': 'Xiaohongshu mini-tool', 'out': 'dist/xhs', 'edition': 'scripts/xhs-edition.json',
            'zip': 'chengongji-xhs-V{}.zip', 'host': 'js/xhs-host.js',
            # platform: zip at most 10 MB and at most 200 files; keep room for additions
            'zip_limit': 10 * 1024 * 1024, 'zip_target': 9.3 * 1024 * 1024, 'file_limit': 200, 'file_target': 150},
    'yiciyuan': {'label': '易次元 (万象笺) package', 'out': 'dist/yiciyuan', 'edition': 'scripts/yiciyuan-edition.json',
                 'zip': 'chengongji-yiciyuan-V{}.zip', 'host': 'js/yiciyuan-host.js',
                 # platform: .zip up to 4 GB; no file-count limit is documented
                 'zip_limit': 4 * 1024 ** 3, 'zip_target': None, 'file_limit': None, 'file_target': None,
                 'images': 'hi-res'},
}
TARGET = None
OUT = STAGE = GEN = EDITION = None
ZIP_LIMIT = ZIP_TARGET = FILE_LIMIT = FILE_TARGET = None


def configure(name):
    global TARGET, OUT, STAGE, GEN, EDITION, ZIP_LIMIT, ZIP_TARGET, FILE_LIMIT, FILE_TARGET
    TARGET = dict(TARGETS[name], name=name)
    OUT = ROOT / TARGET['out']
    STAGE = OUT / 'package'
    GEN = OUT / '.gen'
    EDITION = json.loads((ROOT / TARGET['edition']).read_text('utf8'))
    ZIP_LIMIT, ZIP_TARGET = TARGET['zip_limit'], TARGET['zip_target']
    FILE_LIMIT, FILE_TARGET = TARGET['file_limit'], TARGET['file_target']
BUNDLE = 'js/app.js'  # written as js/app-1.js, js/app-2.js, ... in load order
BUNDLE_MAX = 1900 * 1024  # each joined script under the 2 MiB text-file warning
ALLOWED_SUFFIXES = {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json'}
SKIP_JS = {'dev-tools.js', 'taptap.js'}
CSS_FILES = ['palace.css', 'ui-layout.css']

# Art that belongs only to characters this edition keeps locked (see js/edition.js and the
# map in tests/xhs-edition.test.cjs). Portrait cells 422 / 433 / 501 / 502 are exclusive to
# 赵令仪, 谢安, 林见溪 and 贺行简; palace-fenghua-people.webp also holds 上官兰台, so it stays.
LOCKED_ART = {
    'story': {
        'qingyi': ['story-cast/qingyi.webp'],
        'luwan': ['story-cast/luwan.webp'],
        'chuwan': ['story-cast/chuwan.webp', 'story-cast/chuwan-court.webp', 'story-cast/chuwan-noble.webp', 'story-cast/chuwan-grand.webp'],
        'suheng': ['story-cast/suheng.webp'],
        'xiaoman': ['story-cast/xiaoman.webp'],
        'gouyi': ['palace-consort-gouyi.webp', 'story-gouyi-go-stone.webp', 'story-gouyi-study-window.webp', 'story-hezhong-river-bank.webp'],
        'hongjian': ['story-hongjian-paper-shop.webp', 'story-hongjian-willow-rain.webp', 'story-hongjian-poem-at-dusk.webp'],
    },
    'fenghua': {
        'xiean': ['palace-capital-noble.webp', 'story-xie-homecoming-lamp.webp'],
        'linJianxi': ['palace-lin-jianxi.webp'],
        'heXingjian': ['palace-he-xingjian.webp'],
    },
}

# Image rules: (category, max width in px or None to keep, WebP quality, alpha quality).
# Portraits are shown at most 176 CSS px wide on phones (224 px on wide screens). Every
# portrait sheet is cut to 784 px wide, i.e. 196 px per cell, and its scale entry in the
# JS is rewritten to match (scale = cell px / 112). Canvas atlases with fixed pixel cells
# (map, headpieces) keep their size. Illustrations fill the dialog (about 340 CSS px on a
# phone, 800 px wide at about 2x). See the build report for before/after sizes.
SHEET_WIDTH = 784
# 易次元 allows a 4 GB package, so its portraits and illustrations keep their full resolution
# (448 px a portrait cell, sharp at 2-3x on phones) and are compressed lightly; 小红书's 10 MB cap needs the rules below.
# Sheets load one at a time when a portrait from them is shown.
def hi_res_image_rule(rel):
    name = Path(rel).name
    if rel.startswith('story-cast/'):
        return ('剧情妃立绘', None, 82, 70)
    if name.startswith('story-'):
        return ('事件插画', None, 74, 60)
    if name.startswith('palace-painted-'):
        return ('季节场景', 1920, 72, 60)
    if name.startswith('palace-map-'):
        return ('地图图集（像素坐标，不缩放）', None, 72, 60)
    if name.startswith('palace-headpieces'):
        return ('首饰图集（像素坐标，不缩放）', None, 80, 60)
    if name in ('palace-daoist-portraits.png', 'palace-court-crane-portraits.png'):
        return ('特殊人物立绘', None, 80, 60)
    if name in ('palace-coronation.webp', 'palace-selection.webp'):
        return ('开局横幅', 1600, 72, 60)
    if name.startswith('palace-'):
        return ('立绘图集', None, 80, 60)
    return ('其他', None, 72, 60)
def image_rule(rel, size):
    if TARGET.get('images') == 'hi-res':
        return hi_res_image_rule(rel)
    name = Path(rel).name
    w, h = size
    if rel.startswith('story-cast/'):
        return ('剧情妃立绘', 640 if 'dance' in name else 448, 65, 50)
    if name.startswith('story-'):
        return ('事件插画', 800, 50, 50)
    if name.startswith('palace-painted-'):
        return ('季节场景', 1280, 52, 50)
    if name.startswith('palace-map-'):
        return ('地图图集（像素坐标，不缩放）', None, 60, 50)
    if name.startswith('palace-headpieces'):
        return ('首饰图集（像素坐标，不缩放）', None, 72, 50)
    if name in ('palace-daoist-portraits.png', 'palace-court-crane-portraits.png'):
        return ('特殊人物立绘', 600, 58, 40)
    if name in ('palace-coronation.webp', 'palace-selection.webp'):
        return ('开局横幅', 1000, 52, 50)
    if name.startswith('palace-'):
        return ('立绘图集', SHEET_WIDTH, 50, 20)
    return ('其他', None, 60, 50)


def locked_files():
    out = set()
    allow = EDITION.get('allow', {})
    for kind, people in LOCKED_ART.items():
        for key, files in people.items():
            if kind in allow and key not in allow[kind]:
                out.update(files)
    return out


def game_scripts():
    html = (ROOT / 'index.html').read_text('utf8')
    return [m.split('?')[0] for m in re.findall(r'<script defer src="\./([^"]+)"></script>', html)]


def used_images(sources):
    """Images the game can request: named in code, or built from a prefix such as story-${key}."""
    text = '\n'.join(sources)
    base = ROOT / 'assets/images'
    used = []
    for path in sorted(p for p in base.rglob('*') if p.is_file() and p.suffix in ('.webp', '.png')):
        if path.parent != base:
            if f'images/{path.parent.relative_to(base).as_posix()}/' in text:
                used.append(path)
            continue
        stem = path.stem
        key = stem[len('story-'):] if stem.startswith('story-') else stem
        # Seasonal scenes are named as palace-painted-${art} (js/scene.js).
        if path.name in text or key in text or (stem.startswith('palace-painted-') and 'palace-painted-${' in text):
            used.append(path)
    return used


# Web-only code this package must not carry: the dev panel hooks (dev-tools.js is not in
# the package) and file export. Each entry must match exactly once, so a source change
# that moves the code fails the build instead of shipping it.
STRIP = {
    'js/governance-life.js': [("typeof DEV!=='undefined'&&DEV.autoMonth&&$('#dev-panel')?.hidden===true", 'false')],
    'js/views.js': [("const devLaunch=typeof DEV==='undefined'?'':'<button id=\"dev-launch\" type=\"button\" aria-controls=\"dev-panel\" data-onclick=\"DEV.open()\">DEV · 金手指</button>';", "const devLaunch='';")],
    'js/palace-storage.js': [("['chengongji_v1_','chengongji_dev_v1_']", "['chengongji_v1_']")],
    'js/saves.js': [
        ("const SKEY=document.querySelector('meta[name=\"palace-dev\"]')?.content==='true'?'chengongji_dev_v1_':'chengongji_v1_';", "const SKEY='chengongji_v1_';"),
        ('    try { return globalThis.localStorage; } catch { return null; }', '    return null;'),
        (re.compile(r'A\.downloadSave=function\(\)\{\n.*?\n\};\n', re.S), "A.downloadSave=function(){toast('当前版本不支持导出存档文件');};\n"),
        (re.compile(r'A\.readSaveFile=async function\(input\)\{\n.*?\n\};\n', re.S), 'A.readSaveFile=function(){};\n'),
    ],
}


def strip_web_only(name, text):
    for old, new in STRIP.get(name, []):
        if isinstance(old, re.Pattern):
            text, n = old.subn(lambda m: new, text)
        else:
            n = text.count(old)
            text = text.replace(old, new)
        if n != 1:
            sys.exit(f'strip rule matched {n} times in {name}: {str(old)[:80]}')
    return text


def drop_locked_refs(text, dropped):
    """Remove references to left-out art: illustration captions and portrait sheet sources."""
    for rel in dropped:
        name = Path(rel).name
        if '/' not in rel and name.startswith('story-'):
            key = Path(name).stem[len('story-'):]
            text = re.sub(r"'" + re.escape(key) + r"':'[^']*',?", '', text)
        elif '/' not in rel:
            # The sheet entry keeps its place in the cell index but loads nothing.
            text = text.replace(f"src:'./assets/images/{name}'", "src:''")
    return text


def rewrite_text(text, renamed, rescaled, dropped=()):
    # Package files are addressed without cache-busting queries.
    text = re.sub(r'(\.(?:webp|png|jpg|css|js))\?v=\$\{[^}]*\}', r'\1', text)
    text = re.sub(r'(\.(?:webp|png|jpg|css|js))\?v=[^\'"`)\s]*', r'\1', text)
    text = drop_locked_refs(text, dropped)
    for old, new in renamed.items():
        text = text.replace(old, new)
    for name, factor in rescaled.items():
        text = re.sub(r"scale:(\d+(?:\.\d+)?),src:'\./assets/images/" + re.escape(name) + "'",
                      lambda m: f"scale:{float(m.group(1)) * factor:g},src:'./assets/images/{name}'", text)
        text = re.sub(r'"scale":(\d+(?:\.\d+)?),"src":"\./assets/images/' + re.escape(name) + '"',
                      lambda m: f'"scale":{float(m.group(1)) * factor:g},"src":"./assets/images/{name}"', text)
    # Features this host forbids are constant here, so the minifier drops those paths.
    for feature in ('saveExport', 'browserStorage'):
        if EDITION['features'].get(feature) is False:
            text = text.replace(f"PALACE_EDITION.feature('{feature}')", 'false')
    return text


INDEX_HEAD = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>宸宫纪</title>
<style>
/* Static first screen: visible before any script runs. Centered text keeps clear of the
   container capsule at the top right; xhs-host.js refines the top inset from getWindowInfo. */
#xhs-boot{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2000;display:-webkit-box;display:flex;-webkit-box-orient:vertical;flex-direction:column;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;padding:96px 24px 48px;background:#213e46;color:#f6ead2;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
#xhs-boot h1{margin:0 0 10px;font-size:34px;letter-spacing:.3em;font-weight:700;color:#f0d79a}
#xhs-boot .xhs-boot-sub{margin:0 0 28px;font-size:14px;line-height:1.7;opacity:.85}
#xhs-boot .xhs-boot-status{margin:0;font-size:15px}
#xhs-boot .xhs-boot-hint{margin:14px 0 0;font-size:12px;opacity:.7}
html.xhs-window-info #xhs-boot{padding-top:calc(var(--xhs-top-inset,0px) + 48px)}
/* Keep game chrome below the capsule and the status bar once their positions are known. */
html.xhs-window-info #app #top{padding-top:calc(var(--xhs-top-inset,0px) + 6px) !important}
html.xhs-window-info #modal{padding-top:calc(var(--xhs-top-inset,0px) + 8px)}
html.xhs-window-info #toast{top:calc(var(--xhs-top-inset,0px) + 8px)}
html.xhs-window-info #app[data-layout="landing"] .title-wrap{padding-top:calc(var(--xhs-top-inset,0px) + 12px)}
html{-webkit-text-size-adjust:100%;touch-action:manipulation}
body{-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
</style>
'''

BOOT = '''<div id="xhs-boot" role="status" aria-live="polite">
  <h1>宸宫纪</h1>
  <p class="xhs-boot-sub">宫廷人生模拟 · 处理朝政、走访后宫，写下属于你的一朝本纪</p>
  <p class="xhs-boot-status" id="xhs-boot-status">正在准备…</p>
  <p class="xhs-boot-hint">首次打开需要读取立绘与存档，请稍候。若长时间没有反应，请退出后重新打开。</p>
</div>
'''


YC_HEAD = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>宸宫纪</title>
<style>
/* Static first screen: visible before any script runs. */
#yc-boot{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2000;display:-webkit-box;display:flex;-webkit-box-orient:vertical;flex-direction:column;-webkit-box-align:center;align-items:center;-webkit-box-pack:center;justify-content:center;padding:96px 24px 48px;background:#213e46;color:#f6ead2;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
#yc-boot h1{margin:0 0 10px;font-size:34px;letter-spacing:.3em;font-weight:700;color:#f0d79a}
#yc-boot .yc-boot-sub{margin:0 0 28px;font-size:14px;line-height:1.7;opacity:.85}
#yc-boot .yc-boot-status{margin:0;font-size:15px}
#yc-boot .yc-boot-hint{margin:14px 0 0;font-size:12px;opacity:.7}
/* The platform draws its exit button at the top left of the WebView. */
html.yiciyuan-host #app #top{padding-left:calc(env(safe-area-inset-left,0px) + 52px) !important}
html.yiciyuan-host #app[data-layout="landing"] .title-wrap{padding-top:calc(env(safe-area-inset-top,0px) + 48px)}
/* Cards drawn on canvas, shown full screen for long-press saving. */
#yiciyuan-picture{position:fixed;top:0;right:0;bottom:0;left:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;background:rgba(20,16,14,.92);color:#f6ead2}
#yiciyuan-picture img{max-width:100%;max-height:72vh;-webkit-touch-callout:default}
#yiciyuan-picture p{margin:0;font-size:14px}
html{-webkit-text-size-adjust:100%;touch-action:manipulation}
body{-webkit-tap-highlight-color:transparent}
</style>
'''

YC_BOOT = '''<div id="yc-boot" role="status" aria-live="polite">
  <h1>宸宫纪</h1>
  <p class="yc-boot-sub">宫廷人生模拟 · 处理朝政、走访后宫，写下属于你的一朝本纪</p>
  <p class="yc-boot-status" id="yc-boot-status">正在准备…</p>
  <p class="yc-boot-hint">首次打开需要读取立绘与云存档，请稍候。若长时间没有反应，请退出后重新打开。</p>
</div>
'''


def build_index(scripts):
    source = (ROOT / 'index.html').read_text('utf8')
    body = source[source.index('<div id="app">'):]
    body = re.sub(r'<script[^>]*></script>\s*', '', body)
    body = body.replace('<div id="app">', '<div id="app" aria-busy="true">', 1)
    css = ''.join(f'<link rel="stylesheet" href="./{name}">\n' for name in CSS_FILES)
    js = ''.join(f'<script defer src="./{path}"></script>\n' for path in scripts)
    if TARGET['name'] == 'yiciyuan':
        # The SDK runs first: defer scripts run in document order.
        js = f'<script defer src="{AVG_SDK}"></script>\n' + js
        return YC_HEAD + css + '</head>\n<body>\n' + YC_BOOT + body.strip() + '\n' + js + '</body>\n</html>\n'
    return INDEX_HEAD + css + '</head>\n<body>\n' + BOOT + body.strip() + '\n' + js + '</body>\n</html>\n'


FORBIDDEN = [
    (r'(?<![\w-])on[a-z]+\s*=\s*["\']', 'inline event attribute'),
    (r'javascript:', 'javascript: URL'),
    (r'\beval\s*\(', 'eval'),
    (r'new\s+Function\s*\(', 'new Function'),
    (r'WebAssembly', 'WebAssembly'),
    (r'window\.open\s*\(', 'window.open'),
    (r'\bprompt\s*\(', 'prompt'),
    (r'\bfetch\s*\(', 'fetch'),
    (r'XMLHttpRequest', 'XMLHttpRequest'),
    (r'WebSocket|EventSource|RTCPeerConnection', 'network channel'),
    (r'_blank', 'target=_blank'),
    (r'\.download\s*=|\sdownload[\s=>]', 'download link'),
    (r'createObjectURL', 'blob URL'),
    (r'<iframe|<object', 'iframe / object'),
    (r'https?://', 'external address'),
    (r'navigator\.(clipboard|geolocation|serviceWorker|bluetooth|usb|hid|serial|getBattery|connection|credentials|locks)', 'disabled navigator API'),
    (r'execCommand|requestFullscreen|new\s+Worker|SharedWorker', 'disabled API'),
    (r'type=["\']module|<base\s|http-equiv', 'module script / base / CSP meta'),
    (r'\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie|\bcaches\.', 'browser storage'),
]
# Dev panel / test mode: none of it may reach the package. 「金手指」 alone is not a marker:
# the 易次元 shop sells a 金手指包; the panel's own ids and DEV. calls still give it away.
DEV_MARKERS = ['dev-tools', 'dev.html', 'dev.css', 'palace-dev', 'mountDevTools', '金手指面板', '测试模式', 'DEV.', 'dev-panel', 'chengongji_dev_']


def check_package(files, texts):
    problems = []
    if FILE_LIMIT and len(files) > FILE_LIMIT:
        problems.append(f'{len(files)} files; the platform allows at most {FILE_LIMIT}')
    for p in files:
        rel = p.relative_to(STAGE).as_posix()
        if p.suffix.lower() not in ALLOWED_SUFFIXES:
            problems.append(f'file type not allowed: {rel}')
        if rel.startswith('dev') or '/dev' in rel or 'node_modules' in rel or rel.endswith('.map') or p.name.startswith('.'):
            problems.append(f'development file in package: {rel}')
    html_files = [p for p in files if p.suffix == '.html']
    if [p.relative_to(STAGE).as_posix() for p in html_files] != ['index.html']:
        problems.append('package must hold exactly one HTML file, index.html at the root')
    for rel, text in texts.items():
        for marker in DEV_MARKERS:
            if marker in text:
                problems.append(f'dev panel marker {marker!r} in {rel}')
        if rel == 'index.html':
            # The pinned platform SDK is the one external script this target may load.
            text = text.replace(f'<script defer src="{AVG_SDK}"></script>', '')
        for pattern, label in FORBIDDEN:
            body = text
            if label == 'browser storage':
                # Only the storage module may name browser stores: its xhs branch returns before
                # any of them (tests/xhs-storage, and the storage trap in xhs-browser-check).
                body = re.sub(r'/\* --- js/palace-storage\.js --- \*/.*?(?=/\* --- js/|\Z)', '', text, flags=re.S)
            for m in re.finditer(pattern, body):
                problems.append(f'{label} in {rel}: …{body[max(0, m.start() - 40):m.end() + 40]}…')
                break
    index = texts['index.html']
    if TARGET['name'] == 'yiciyuan' and index.count(AVG_SDK) != 1:
        problems.append('index.html must load the platform SDK once')
    if re.search(r'<script(?![^>]*\ssrc=)[^>]*>', index):
        problems.append('inline <script> in index.html')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tools', required=True, help='folder with node_modules for esbuild, lightningcss, acorn and sharp')
    ap.add_argument('--version', default='1.0.0')
    ap.add_argument('--node', default='node')
    ap.add_argument('--target', choices=sorted(TARGETS), default='xhs')
    args = ap.parse_args()
    configure(args.target)
    host = TARGET['host']
    if not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
        sys.exit('version must look like 1.0.0')

    shutil.rmtree(STAGE, ignore_errors=True)
    shutil.rmtree(GEN, ignore_errors=True)
    STAGE.mkdir(parents=True)
    (GEN / 'js').mkdir(parents=True)
    CACHE.mkdir(parents=True, exist_ok=True)

    source_scripts = [s for s in game_scripts() if Path(s).name not in SKIP_JS]
    texts = {name: (ROOT / name).read_text('utf8') for name in source_scripts + CSS_FILES}
    texts[host] = (ROOT / host).read_text('utf8')

    # ---- images
    locked = locked_files()
    images = [p for p in used_images(texts.values()) if p.relative_to(ROOT / 'assets/images').as_posix() not in locked]
    dropped_locked = sorted(locked)
    from PIL import Image
    renamed = {p.name: p.stem + '.webp' for p in images if p.suffix == '.png'}
    img_dir = STAGE / 'assets/images'
    jobs, rules = [], {}
    for p in images:
        rel = p.relative_to(ROOT / 'assets/images').as_posix()
        with Image.open(p) as im:
            size = im.size
        category, width, quality, alpha = image_rule(rel, size)
        rules[rel] = category
        out = img_dir / Path(rel).parent / renamed.get(p.name, p.name)
        jobs.append({'src': str(p), 'out': str(out), 'width': width, 'quality': quality, 'alphaQuality': alpha, 'rel': rel})
    (GEN / 'images.json').write_text(json.dumps({'tools': str(Path(args.tools).resolve()), 'cache': str(CACHE), 'images': jobs}), 'utf8')
    result = subprocess.run([args.node, str(ROOT / 'scripts/lib/xhs-images.cjs'), str(GEN / 'images.json')], capture_output=True, text=True)
    if result.returncode:
        sys.exit('image encoding failed:\n' + result.stderr)
    encoded = {Path(r['src']).relative_to(ROOT / 'assets/images').as_posix(): r for r in json.loads(result.stdout)}
    # Portrait sheets drawn on canvas use pixel offsets = logical offsets x scale; record the
    # factor for every resized sheet so its scale entry can be rewritten.
    rescaled = {Path(rel).name: r['after'][0] / r['before'][0]
                for rel, r in encoded.items() if rules[rel] == '立绘图集' and r['after'][0] != r['before'][0]}

    # ---- generated sources
    (GEN / 'js/xhs-edition-config.js').write_text(
        f'/* Generated by scripts/build-xhs.py from {TARGET["edition"]}. */\n'
        f'window.PALACE_EDITION_CONFIG=Object.freeze({json.dumps(EDITION, ensure_ascii=False)});\n', 'utf8')
    # Every resized sheet must have exactly one scale entry to rewrite (portraitSheets or the
    # half-body CONSORT_DETAIL_SHEETS, which are SVG-only but kept consistent).
    scale_hits = {name: sum(len(re.findall(r"scale:\d+(?:\.\d+)?,src:'\./assets/images/" + re.escape(name) + r"(?:\?[^']*)?'", t)) + len(re.findall(r'"scale":\d+(?:\.\d+)?,"src":"\./assets/images/' + re.escape(name) + r'(?:\?[^"]*)?"', t)) for t in texts.values()) for name in rescaled}
    missing_scale = [n for n, c in scale_hits.items() if c != 1]
    if missing_scale:
        sys.exit('portrait sheets resized without a matching scale entry: ' + ', '.join(missing_scale))
    for name, text in texts.items():
        target = GEN / 'src' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(rewrite_text(strip_web_only(name, text), renamed, rescaled, dropped_locked), 'utf8')
    for name in ('js/compat.js', 'js/xhs-compat-ui.js'):
        target = GEN / 'src' / name
        target.write_text((ROOT / name).read_text('utf8'), 'utf8')

    # Load order: polyfills, edition config, :has() patterns and layout fallbacks, then the
    # game in its usual order, then the host bridge (after main.js has opened storage).
    order = ['js/compat.js', 'js/xhs-edition-config.js', 'js/xhs-has-patterns.js', 'js/xhs-compat-ui.js'] + source_scripts + [host]
    job = {'tools': str(Path(args.tools).resolve()), 'hasOut': str(GEN / 'src/js/xhs-has-patterns.js'),
           'css': [{'src': str(GEN / 'src' / n), 'out': str(STAGE / n)} for n in CSS_FILES],
           'js': [{'src': str(GEN / ('js/xhs-edition-config.js' if n == 'js/xhs-edition-config.js' else 'src/' + n)), 'out': str(STAGE / n)} for n in order],
           # One classic script instead of ~200: the container caps a package at 200 files.
           'bundle': {'stage': str(STAGE), 'order': order, 'out': BUNDLE, 'maxBytes': BUNDLE_MAX}}
    (GEN / 'job.json').write_text(json.dumps(job), 'utf8')
    result = subprocess.run([args.node, str(ROOT / 'scripts/lib/xhs-transform.cjs'), str(GEN / 'job.json')], capture_output=True, text=True)
    if result.returncode:
        sys.exit('transform failed:\n' + result.stderr)
    report = json.loads(result.stdout)
    (STAGE / 'index.html').write_text(build_index(report['bundle']['outputs']), 'utf8')

    # ---- checks
    files = sorted(p for p in STAGE.rglob('*') if p.is_file())
    stage_texts = {p.relative_to(STAGE).as_posix(): p.read_text('utf8') for p in files if p.suffix in ('.html', '.css', '.js', '.json')}
    missing = []
    for rel, body in stage_texts.items():
        for ref in re.findall(r'\./((?:js|assets)/[^"\'`?)\s$]+)', body):
            if not ref.endswith(('-', '/', '.')) and not (STAGE / ref).exists():
                missing.append(f'{rel}: {ref}')
    if missing:
        sys.exit('missing files:\n' + '\n'.join(sorted(set(missing))))
    # Left-out art must not be named anywhere. story-cast/<key>.webp is built from the key at
    # run time; tests/xhs-edition.test.cjs shows locked keys are never created or shown.
    named = [f'{rel}: {name}' for name in dropped_locked for rel, body in stage_texts.items() if Path(name).name in body]
    if named:
        sys.exit('left-out art is still referenced:\n' + '\n'.join(named))
    problems = check_package(files, stage_texts)
    if problems:
        sys.exit('package check failed:\n' + '\n'.join(problems[:60]))

    # ---- zip (index.html at the root; the folder contents, not the folder)
    zip_path = OUT / TARGET['zip'].format(args.version)
    zip_path.unlink(missing_ok=True)
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            kind = zipfile.ZIP_DEFLATED if p.suffix in ('.html', '.css', '.js', '.json', '.svg') else zipfile.ZIP_STORED
            z.write(p, p.relative_to(STAGE).as_posix(), compress_type=kind)

    # ---- report
    mb = lambda n: f'{n / 1024 / 1024:.2f}MiB'
    cats = {}
    for rel, r in encoded.items():
        c = cats.setdefault(rules[rel], {'files': 0, 'before': 0, 'after': 0, 'px_before': set(), 'px_after': set()})
        c['files'] += 1; c['before'] += r['bytesBefore']; c['after'] += r['bytesAfter']
        c['px_before'].add('x'.join(map(str, r['before']))); c['px_after'].add('x'.join(map(str, r['after'])))
    summary = {'zip': str(zip_path), 'zip_bytes': zip_path.stat().st_size, 'files': len(files),
               'unpacked_bytes': sum(p.stat().st_size for p in files),
               'images': {k: {**v, 'px_before': sorted(v['px_before'])[:6], 'px_after': sorted(v['px_after'])[:6]} for k, v in cats.items()},
               'dropped_locked_art': dropped_locked, 'png_renamed': renamed, 'portrait_scale_factor': rescaled,
               'js_bytes': report['bundle']['bytes'], 'js_files_joined': report['bundle']['files'], 'js_outputs': report['bundle']['outputs'], 'urls_removed': report['urlsRemoved'],
               'css': report['css'], 'has_patterns': len(report['has'])}
    (OUT / 'build-report.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), 'utf8')
    print(f'{TARGET["label"]} V{args.version} -> {zip_path.relative_to(ROOT)}')
    print(f'  zip {mb(summary["zip_bytes"])} ({summary["files"]} files), unpacked {mb(summary["unpacked_bytes"])}, JS {mb(summary["js_bytes"])} in {len(summary["js_outputs"])} files joined from {summary["js_files_joined"]} scripts')
    for cat, c in sorted(cats.items(), key=lambda kv: -kv[1]['before']):
        print(f'  {cat:<22} {c["files"]:>3} files  {mb(c["before"]):>9} -> {mb(c["after"]):>9}')
    print(f'  locked characters\' art left out: {len(dropped_locked)} files; external notes removed: {report["urlsRemoved"]}')
    for css in report['css']:
        print(f'  {Path(css["src"]).name}: {css["stats"]} still-modern (enhancement only): {css["remaining"]}')
    if summary['zip_bytes'] > ZIP_LIMIT:
        sys.exit(f'zip is over the {mb(ZIP_LIMIT)} limit')
    if FILE_TARGET and len(files) > FILE_TARGET:
        print(f'  WARNING: {len(files)} files, above the working target of {FILE_TARGET} (hard limit {FILE_LIMIT})')
    if ZIP_TARGET and summary['zip_bytes'] > ZIP_TARGET:
        print('  WARNING: zip is above the 9.3 MiB working target')


if __name__ == '__main__':
    main()
