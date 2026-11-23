"""Shape text with HarfBuzz and emit an SVG path (y down, baseline at 0, units = font units).
usage: python3 -I shape.py font.ttf "text" [letter_spacing_units] -> prints JSON {d, adv, asc, desc}
"""
import sys, json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

path, text = sys.argv[1], sys.argv[2]
track = float(sys.argv[3]) if len(sys.argv) > 3 else 0
blob = hb.Blob.from_file_path(path)
face = hb.Face(blob)
font = hb.Font(face)
buf = hb.Buffer()
buf.add_str(text)
buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": True})
tt = TTFont(path)
gs = tt.getGlyphSet()
order = tt.getGlyphOrder()
pen = SVGPathPen(gs)
bp = BoundsPen(gs)
x = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    tp = TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset))
    gs[name].draw(tp)
    gs[name].draw(TransformPen(bp, (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)))
    x += pos.x_advance + track
x -= track
os2 = tt["OS/2"]
print(json.dumps({"d": pen.getCommands(), "adv": x, "upm": tt["head"].unitsPerEm,
                  "asc": os2.sTypoAscender, "desc": os2.sTypoDescender, "cap": getattr(os2, "sCapHeight", 0), "bbox": bp.bounds}))
