#!/usr/bin/env python3
"""Crop part of a check image and enlarge it, to inspect hands, faces, joints or feet up close.
Usage: python3 zoom.py <image> <x> <y> <w> <h> [out.jpg]     (x y w h as fractions 0-1 of the image)
Example: python3 zoom.py out/charsheet/p_1.jpg 0 0 .34 .5     -> left third, top half, written next to the image"""
import sys, os
from PIL import Image
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
src = sys.argv[1]; x, y, w, h = map(float, sys.argv[2:6])
out = sys.argv[6] if len(sys.argv) > 6 else os.path.splitext(src)[0] + f'_zoom_{x:g}_{y:g}.jpg'
im = Image.open(src); W, H = im.size
c = im.crop((int(x * W), int(y * H), int((x + w) * W), int((y + h) * H)))
s = 1600 / max(c.size); c = c.resize((int(c.width * s), int(c.height * s)), Image.LANCZOS)
c.save(out, quality=90); print(out, c.size)
