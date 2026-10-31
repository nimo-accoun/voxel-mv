#!/usr/bin/env python3
"""Approximate key points (head, hands, feet) for every sprite frame, from its alpha silhouette.
Writes assets/<char>/kp.json: {action: [[hx,hy, lx,ly, rx,ry, flx,fly, frx,fry], ...]} in sprite pixels.
The page's window.probe(t) projects these to screen space for the song-mv act check.
  head  = centroid of the top 35 % of the standing height
  hands = left-most / right-most silhouette point in the band 18–60 % above the soles (arms reaching out show up here)
  feet  = centroids of the left / right half of the bottom 12 % band
Usage: python3 tools/keypoints.py assets/claude assets/deepseek"""
import json, os, sys
import numpy as np
from PIL import Image

for d in sys.argv[1:]:
    m = json.load(open(os.path.join(d, 'frames.json')))
    base, cx, sh = m['baseline_y'], m['center_x'], m['stand_h']
    top = base - sh
    out = {}
    for act, a in m['actions'].items():
        rows = []
        for fr in a['frames']:
            al = np.asarray(Image.open(os.path.join(d, fr['file'])).convert('RGBA'))[..., 3] > 40
            ys, xs = np.nonzero(al)
            if not len(ys):
                rows.append([cx, top + .2 * sh, cx - 40, base - .4 * sh, cx + 40, base - .4 * sh, cx - 20, base, cx + 20, base]); continue
            t0 = ys.min()
            hm = ys < t0 + .35 * sh
            head = [xs[hm].mean(), ys[hm].mean()]
            band = (ys > base - .60 * sh) & (ys < base - .18 * sh)
            if band.any():
                bx, by = xs[band], ys[band]
                i, j = bx.argmin(), bx.argmax()
                hl, hr = [bx[i], by[i]], [bx[j], by[j]]
            else:
                hl, hr = [cx - 40, base - .4 * sh], [cx + 40, base - .4 * sh]
            b = ys > ys.max() - .12 * sh
            fx, fy = xs[b], ys[b]
            L, R = fx < cx, fx >= cx
            fl = [fx[L].mean(), fy[L].mean()] if L.any() else [fx.mean(), fy.mean()]
            frr = [fx[R].mean(), fy[R].mean()] if R.any() else [fx.mean(), fy.mean()]
            rows.append([round(float(v), 1) for v in head + hl + hr + fl + frr])
        out[act] = rows
    json.dump(out, open(os.path.join(d, 'kp.json'), 'w'))
    # how much each action moves (max key-point travel relative to frame 1, in % of standing height)
    rep = {act: round(float(np.max(np.abs(np.array(r) - np.array(r[0])))) / sh * 100) for act, r in out.items()}
    print(d, rep)
