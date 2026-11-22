"""Build self-contained pages: index.html and political.html at the repo root.

Sources live in src/ (src/index.html, src/political.html, src/assets/).
Every stylesheet, script, font and image is inlined, so each built page
works as a single file: opened from disk, on a phone, in a file viewer,
or attached to a message.

Run:  python3 src/build.py
"""
import base64, io, pathlib, re
from PIL import Image

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
ASSETS = SRC / "assets"
PAGES = ["index.html", "political.html"]
MAX_SIDE, QUALITY = 1000, 78

_img_cache = {}
def img_uri(name):
    if name not in _img_cache:
        im = Image.open(ASSETS / "img" / f"{name}.jpg").convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        _img_cache[name] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    return _img_cache[name]

def font_uri(rel):
    return "data:font/woff2;base64," + base64.b64encode((ASSETS / rel).read_bytes()).decode()

def build(page):
    html = (SRC / page).read_text(encoding="utf-8")
    names = sorted(set(re.findall(r"assets/img/([\w-]+)\.jpg", html)) |
                   set(re.findall(r'IMG\("([\w-]+)"\)', html)) |
                   set(re.findall(r'\["(g-[\w-]+)"', html)) | {"bg-founders"})

    fonts = (ASSETS / "fonts.css").read_text(encoding="utf-8")
    fonts = re.sub(r"url\((fonts/[\w.-]+)\)", lambda m: f"url({font_uri(m.group(1))})", fonts)
    css = (ASSETS / "site.css").read_text(encoding="utf-8")
    css = re.sub(r"url\(img/([\w-]+)\.jpg\)", lambda m: f"url({img_uri(m.group(1))})", css)
    js = (ASSETS / "shelf.js").read_text(encoding="utf-8")

    html = re.sub(r'\s*<link rel="preload"[^>]*>', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/fonts.css">', f"<style>\n{fonts}\n</style>")
    html = html.replace('<link rel="stylesheet" href="assets/site.css">', f"<style>\n{css}</style>")
    html = html.replace('<script src="assets/shelf.js"></script>', f"<script>\n{js}</script>")
    # images used from page scripts go through IMG(); give it an inlined table
    table = "{" + ",".join(f'"{n}":"{img_uri(n)}"' for n in names) + "}"
    html = html.replace("const IMG=n=>`assets/img/${n}.jpg`;", f"const __IMG={table};\nconst IMG=n=>__IMG[n];")
    html = re.sub(r"assets/img/([\w-]+)\.jpg", lambda m: img_uri(m.group(1)), html)

    left = re.findall(r'(?:href|src)="assets/[^"]+"|url\((?:assets/)?(?:img|fonts)/', html)
    if left:
        raise SystemExit(f"{page}: unresolved asset references: {left[:5]}")
    (ROOT / page).write_text(html, encoding="utf-8")
    print(f"{page}: {len(html.encode()) / 1e6:.1f} MB, images: {', '.join(names)}")

for p in PAGES:
    build(p)
