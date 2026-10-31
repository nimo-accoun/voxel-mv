#!/usr/bin/env python3
"""Find frozen stretches: compares frames 1/4 s apart; any stretch of >= 1 s where the picture barely changes is reported.
Usage: python3 tools/freeze_check.py out/video.mp4 [threshold=1.2]
Threshold is mean absolute pixel difference (0-255) on a 160x90 grey copy. Grain alone gives ~0.5-1; real motion is 2+."""
import sys, subprocess, numpy as np
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
src = sys.argv[1]; th = float(sys.argv[2]) if len(sys.argv) > 2 else 1.2
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', 'fps=4,scale=160:90,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
bad, start = [], None
for i, v in enumerate(list(d) + [99]):
    if v < th and start is None: start = i
    if v >= th and start is not None:
        if i - start >= 4: bad.append((start / 4, i / 4, float(d[start:i].mean())))
        start = None
print(f'frames {len(fr)}  median diff {np.median(d):.2f}  min {d.min():.2f}')
print('FROZEN stretches:' if bad else 'no frozen stretch >= 1 s')
for a, b, m in bad: print(f'  {a:6.2f}s - {b:6.2f}s  mean diff {m:.2f}')
