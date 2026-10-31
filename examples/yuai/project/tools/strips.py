#!/usr/bin/env python3
"""逐句帧条：每句歌词取 6 帧排成一行 → out/strips.jpg（从成片里取，不重新渲染）。在项目根目录运行：python tools/strips.py out/mv.mp4
看图时一行一行问：角色有没有在演（换姿势、换表情、不只是平移）？画面是不是在动？相邻几行像不像同一个画面？
相邻两格几乎一样的格子标红框（可能定格了）。"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
VID = sys.argv[1]; K = 6; W, H = 320, 180
plan = json.load(open('plan.json', encoding='utf-8'))
L = json.load(open('data/lines.json', encoding='utf-8'))['lines']
dur = (plan['end'] - plan['start']) / 24
def grab(t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', VID, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3) if len(raw) == W * H * 3 else np.zeros((H, W, 3), np.uint8)
lines = [l for l in L if l['end'] > 0 and l['t'] < dur]
sheet = Image.new('RGB', (180 + K * W, len(lines) * H), (20, 18, 30)); d = ImageDraw.Draw(sheet)
for r, l in enumerate(lines):
    a, b = max(0, l['t']) + .15, min(dur, l['end']) - .15
    ims = [grab(a + (b - a) * k / (K - 1)) for k in range(K)]
    d.text((8, r * H + 8), f"{l['id']}  {l['t']:.1f}s", fill=(230, 230, 240))
    for k, im in enumerate(ims):
        sheet.paste(Image.fromarray(im), (180 + k * W, r * H))
        if k and (b - a) / (K - 1) >= 0.4 and np.abs(im.astype(int) - ims[k - 1]).mean() < 1.0:   # 取样间隔太短的句子不判
            d.rectangle([180 + k * W, r * H, 180 + (k + 1) * W - 1, (r + 1) * H - 1], outline=(255, 60, 60), width=4)
os.makedirs('out', exist_ok=True); sheet.save('out/strips.jpg', quality=85); print('-> out/strips.jpg')
