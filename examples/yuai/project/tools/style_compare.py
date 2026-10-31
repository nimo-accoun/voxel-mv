#!/usr/bin/env python3
"""风格对照：体素微缩参考图在上，你的画面在下 → out/style_compare.jpg。由 python tools/run.py style <秒> ... 调用。
参考图在技能目录 references/style/（项目里拷了一份在 ref/style/）。可以用 --extra 旧版帧.jpg,… 加一行旧版对比。
然后在 STYLE_FRAMES.md 里先写差距，再逐项打分（见 SKILL.md 流程 2）。"""
import glob, os, sys
from PIL import Image, ImageDraw
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
args = sys.argv[1:]; extra = []
if '--extra' in args: i = args.index('--extra'); extra = args[i + 1].split(','); del args[i:i + 2]
refs = sorted(glob.glob('ref/style/*.jpg')) or sys.exit('ref/style/ 里没有参考图：从技能目录 references/style/ 拷过来')
RH = 300
def row(paths, h):
    ims = [Image.open(p).convert('RGB') for p in paths if os.path.exists(p)]
    ims = [im.resize((round(im.width * h / im.height), h)) for im in ims]
    out = Image.new('RGB', (sum(i.width for i in ims) + 10 * len(ims), h), (24, 22, 34)); x = 0
    for im in ims: out.paste(im, (x, 0)); x += im.width + 10
    return out
rows = [('REF', row(refs, RH)), ('NEW', row(args, RH))] + ([('OLD', row(extra, RH))] if extra else [])
W = max(r.width for _, r in rows) + 90
sheet = Image.new('RGB', (W, sum(r.height + 12 for _, r in rows)), (24, 22, 34)); d = ImageDraw.Draw(sheet); y = 0
for name, r in rows: sheet.paste(r, (90, y)); d.text((10, y + 10), name, fill=(240, 240, 250)); y += r.height + 12
os.makedirs('out', exist_ok=True); sheet.save('out/style_compare.jpg', quality=88); print('-> out/style_compare.jpg')
