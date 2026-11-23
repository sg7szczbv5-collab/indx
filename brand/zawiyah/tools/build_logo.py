"""Build the ZAWIYAH logo set as outlined SVGs.  usage: python3 -I build_logo.py <fonts dir> <out dir>"""
import sys, json, subprocess, os

FONTS, OUT = sys.argv[1], sys.argv[2]
SHAPE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shape.py")
os.makedirs(OUT, exist_ok=True)

INK, PINK, PAPER, WHITE = "#0B0B0A", "#D0106F", "#F7F7F5", "#FFFFFF"


def shape(font, text, track=0):
    r = subprocess.run([sys.executable, "-I", SHAPE, os.path.join(FONTS, font), text, str(track)],
                       capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


AR = shape("Alexandria.ttf", "زاوية")
LA = shape("geist600.ttf", "ZAWIYAH", 120)

# the symbol on a 200 grid: a viewfinder corner (the angle) and the recording dot
CORNER = "M40 40H144a16 16 0 0 1 16 16V160"
SW = 40


def symbol(x, y, s, ink, dot):
    return (f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.5f})">'
            f'<path d="{CORNER}" fill="none" stroke="{ink}" stroke-width="{SW}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cx="76" cy="124" r="28" fill="{dot}"/></g>')


def svg(w, h, body, bg=None, title="ZAWIYAH"):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{rect}{body}</svg>\n')


def glyphs(j, x, base_y, size, fill):
    s = size / j["upm"]
    return f'<g transform="translate({x:.2f} {base_y:.2f}) scale({s:.5f})" fill="{fill}"><path d="{j["d"]}"/></g>'


# metrics: Alexandria glyph extents (y down, baseline 0) measured from the font's own outline
def bbox(d):
    import re
    nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


ax0, ay0, ax1, ay1 = AR["bbox"]
lx0, ly0, lx1, ly1 = LA["bbox"]

schemes = {
    "ink": (INK, PINK, None),
    "pink": (PINK, INK, None),
    "white": (WHITE, PINK, None),
    "mono-ink": (INK, INK, None),
    "mono-white": (WHITE, WHITE, None),
}

for name, (ink, dot, bg) in schemes.items():
    # symbol alone, 200 box with the stroke reaching 20..180
    open(f"{OUT}/symbol-{name}.svg", "w").write(svg(200, 200, symbol(0, 0, 1, ink, dot), bg, "زاوية ZAWIYAH"))

    # Arabic wordmark: glyph height 200 units of cap box
    size = 260
    s = size / AR["upm"]
    w = (ax1 - ax0) * s
    h = (ay1 - ay0) * s
    pad = 0
    body = glyphs(AR, -ax0 * s, -ay0 * s, size, ink)
    open(f"{OUT}/wordmark-ar-{name}.svg", "w").write(svg(w, h, body, bg, "زاوية"))

    # Latin wordmark
    lsize = 120
    ls = lsize / LA["upm"]
    lw = (lx1 - lx0) * ls
    lh = (ly1 - ly0) * ls
    open(f"{OUT}/wordmark-en-{name}.svg", "w").write(
        svg(lw, lh, glyphs(LA, -lx0 * ls, -ly0 * ls, lsize, ink), bg, "ZAWIYAH"))

    # horizontal lockup (RTL: the symbol on the right, the Arabic name to its left, ZAWIYAH under the name)
    k = 1.45
    sym_h = 160 * k
    gap = 72
    ar_size = 300
    a_s = ar_size / AR["upm"]
    a_w, a_h = (ax1 - ax0) * a_s, (ay1 - ay0) * a_s
    l_size = 64
    l_s = l_size / LA["upm"]
    l_w, l_h = (lx1 - lx0) * l_s, (ly1 - ly0) * l_s
    text_w = max(a_w, l_w)
    total_h = max(sym_h, a_h + 28 + l_h)
    W = text_w + gap + sym_h
    top = (total_h - (a_h + 28 + l_h)) / 2
    b = glyphs(AR, text_w - a_w - ax0 * a_s, top - ay0 * a_s, ar_size, ink)
    b += glyphs(LA, text_w - l_w - lx0 * l_s, top + a_h + 28 - ly0 * l_s, l_size, ink)
    b += symbol(text_w + gap - 20 * k, top + (a_h - sym_h) / 2 - 20 * k, k, ink, dot)
    open(f"{OUT}/lockup-{name}.svg", "w").write(svg(W, total_h, b, bg, "زاوية ZAWIYAH"))

# app icon: ink tile, white corner, pink dot (and the reverse on pink)
for name, (tile, ink, dot) in {"ink": (INK, WHITE, PINK), "pink": (PINK, WHITE, INK)}.items():
    body = f'<rect width="1024" height="1024" rx="230" fill="{tile}"/>' + symbol(512 - 100 * 3.2, 512 - 100 * 3.2, 3.2, ink, dot)
    open(f"{OUT}/app-icon-{name}.svg", "w").write(svg(1024, 1024, body, None, "زاوية"))

# favicon
open(f"{OUT}/favicon.svg", "w").write(
    svg(64, 64, f'<rect width="64" height="64" rx="14" fill="{INK}"/>' + symbol(4, 4, .28, WHITE, PINK), None, "زاوية"))
print("ok", ax1 - ax0, ay1 - ay0, lx1 - lx0, ly1 - ly0)
