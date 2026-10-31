#!/usr/bin/env python3
"""Contact sheet of a rendered video: one frame every STEP seconds, labelled with its time.
Usage: python3 tools/sheet.py out/mv.mp4 out/sheet.jpg [step=1.5]
Look for: frozen neighbours (two cells that look the same), empty panels, cropped captions/faces, off-frame characters."""
import sys, subprocess, tempfile, glob, os
from PIL import Image, ImageDraw
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
src, dst = sys.argv[1], sys.argv[2]; step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.5
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', f'fps=1/{step},scale=480:-1', f'{tmp}/f%04d.jpg'], check=True)
fs = sorted(glob.glob(f'{tmp}/*.jpg')); w, h = Image.open(fs[0]).size; cols = 6; rows = (len(fs) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 18)), 'white'); d = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    x, y = (i % cols) * w, (i // cols) * (h + 18); S.paste(Image.open(f), (x, y + 18)); d.text((x + 4, y + 3), f'{i * step:.1f}s', fill='black')
S.save(dst, quality=85); print(dst, S.size, len(fs), 'frames')
