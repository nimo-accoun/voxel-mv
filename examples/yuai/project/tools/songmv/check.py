#!/usr/bin/env python3
"""Measure the rendered film against the song: does the picture move, hit the beat, and vary its transitions?
Usage: python3 check.py <project_dir> [video=out/mv.mp4]
Reads data/lines.json + data/audio.timeline.json, decodes the video at 24 fps (160x90 grey), writes out/check.md.
Advisory: exit code 1 if anything is flagged, but render.sh never blocks on it. The numbers are proxies; always look at sheet.jpg / strips.jpg.

Signals (d = mean abs pixel change between consecutive frames, 0-255; paper grain alone is ~0.5-1):
  motion   median d per lyric line                         FAIL < 1.5   (picture nearly still)
  beat     lift = mean d at beats / mean d between beats  FAIL < 1.15 per line, < 1.25 for the whole film
  hits     d peak within 3 frames of each hit/drop vs the surrounding second   FAIL < 1.5 for >1/3 of hits
  cuts     transition at each line change: cut (<=2 frames), fast (<0.4 s) or long, plus its look (pan direction,
           flash, dissolve/wipe, local change); on-beat if its peak is within
           2 frames of a beat.   FAIL if > 50 % hard cuts, the same look 3 times in a row, < 4 distinct looks or one look > 50 %,
           or < 60 % on the beat. When the page declares window.TRANSITIONS (out/page_meta.json), transitions are left to
           trans_check.py and these transition flags are skipped."""
import json, os, subprocess, sys
import numpy as np
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
P = sys.argv[1]; V = sys.argv[2] if len(sys.argv) > 2 else os.path.join(P, 'out/mv.mp4')
FPS = 24
L = json.load(open(os.path.join(P, 'data/lines.json'), encoding='utf-8'))['lines']
TL = json.load(open(os.path.join(P, 'data/audio.timeline.json'), encoding='utf-8'))
beats, bars = np.array(TL['beat_times']), np.array(TL['bar_times'])
hits = [(h['time'], h.get('strength', 1)) for h in TL.get('hits', [])] + [(d['time'], 1) for d in TL.get('drops', [])]
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', V, '-vf', f'fps={FPS},scale=160:90,format=gray', '-f', 'rawvideo', '-'],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160).astype(np.float32)
d = np.concatenate([[0], np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))])   # d[i] = change arriving at frame i
N = len(d); fi = lambda t: int(round(t * FPS))
def peak(t, a=-1, b=2): i = fi(t); return d[max(0, i + a):min(N, i + b + 1)].max() if 0 <= i < N else 0
offs = (beats[:-1] + beats[1:]) / 2
def shift(f0, f1):
    # global translation between two frames by phase correlation (pixels on the 160x90 copy)
    F = np.fft.fft2(f0 - f0.mean()) * np.conj(np.fft.fft2(f1 - f1.mean())); r = np.abs(np.fft.ifft2(F / (np.abs(F) + 1e-6)))
    y, x = np.unravel_index(r.argmax(), r.shape); return (x if x < 80 else x - 160), (y if y < 45 else y - 90)
def signature(i0, i1):
    # what kind of change the transition is: pan direction, flash, dissolve/wipe, or local
    sx = sy = 0
    for i in range(i0 + 1, i1 + 1): dx, dy = shift(fr[i - 1], fr[i]); sx += dx; sy += dy
    bright = fr[i0:i1 + 1].mean(axis=(1, 2))
    if bright.max() - min(bright[0], bright[-1]) > 40: return 'flash'
    if max(abs(sx), abs(sy)) > 25: return 'pan' + ('←→'[int(sx < 0)] if abs(sx) >= abs(sy) else '↑↓'[int(sy < 0)])
    spread = (np.abs(fr[i1] - fr[i0]) > 20).mean()
    return 'dissolve/wipe' if spread > .5 else 'local'
fails, out = [], []
starts = np.array([l['t'] for l in L[1:]])
calm = lambda t: not len(starts) or np.abs(starts - t).min() > .45      # ignore the transition itself when measuring the beat
def lift(lo, hi):
    on = [peak(b) for b in beats if lo <= b < hi and calm(b)]; off = [peak(m) for m in offs if lo <= m < hi and calm(m)]
    return (np.mean(on) / max(np.mean(off), .3), len(on)) if len(on) >= 3 and off else (None, len(on))

out.append('# check report\n')
out.append('| line | time | text | motion | beat lift | transition in | on beat |')
out.append('|---|---|---|---|---|---|---|')
kinds = []
for k, l in enumerate(L):
    a, b = fi(l['t']), min(N, fi(l['end']))
    mot = float(np.median(d[a:b])) if b > a else 0
    lf, nb = lift(l['t'], l['end'])
    tr, onb = '', ''
    if k > 0:
        w = d[max(0, a - 12):min(N, a + 13)]; base = np.median(d[max(0, a - 48):min(N, a + 48)]) + .3
        busy = int((w > base * 2).sum()); pk = max(0, a - 12) + int(w.argmax())
        dur = 'cut' if busy <= 2 and w.max() > base * 4 else ('fast' if busy < 10 else 'long')
        kind = dur if dur == 'cut' else dur + '-' + signature(max(0, a - 12), min(N - 1, a + 12))
        on = np.abs(beats * FPS - pk).min() <= 2
        kinds.append((kind, on)); tr, onb = kind, 'yes' if on else 'no'
    flag = []
    if mot < 1.5: flag.append('STILL'); fails.append(f"{l['id']} motion {mot:.2f} < 1.5: picture nearly still")
    if lf is not None and lf < 1.15 and not l['text'].startswith('♪ 尾'):
        flag.append('OFFBEAT'); fails.append(f"{l['id']} beat lift {lf:.2f} < 1.15: nothing in this shot visibly lands on the beat")
    out.append(f"| {l['id']} | {l['t']:.2f} | {l['text']} | {mot:.2f} | {'' if lf is None else f'{lf:.2f}'} | {tr} | {onb} | {' '.join(flag)}")

total, _ = lift(0, 1e9)
out.append(f'\n**whole film**: beat lift {total:.2f} (pass >= 1.25), median motion {np.median(d):.2f}')
if total < 1.25: fails.append(f'whole-film beat lift {total:.2f} < 1.25')
weak = [(t, s) for t, s in hits if peak(t, -1, 3) < 1.5 * (np.median(d[max(0, fi(t) - 24):fi(t) + 24]) + .3)]
out.append(f'**hits/drops**: {len(hits) - len(weak)}/{len(hits)} answered by a visible jolt')
if hits and len(weak) > len(hits) / 3: fails.append('hits without a visible reaction: ' + ', '.join(f'{t:.2f}s' for t, _ in weak))
mp = os.path.join(P, 'out/page_meta.json')
declared = os.path.exists(mp) and json.load(open(mp, encoding='utf-8')).get('TRANSITIONS')
if declared:
    out.append('**transitions**: the page declares them (window.TRANSITIONS): kinds, beats and visibility are checked in '
               'out/trans_check.md. The "transition in" column above is only this script\'s rough guess.')
elif kinds:
    from collections import Counter
    from itertools import groupby
    looks = Counter(k for k, _ in kinds); onr = sum(o for _, o in kinds) / len(kinds)
    cuts = sum(k == 'cut' for k, _ in kinds); run = max(len(list(g)) for _, g in groupby(k for k, _ in kinds))
    top, topn = looks.most_common(1)[0]
    out.append(f'**transitions**: {len(looks)} distinct looks ' + ', '.join(f'{k}×{n}' for k, n in looks.most_common())
               + f'; longest run of one look {run}; {onr:.0%} land on a beat')
    if cuts > len(kinds) / 2: fails.append(f'{cuts}/{len(kinds)} line changes are hard cuts: design real transitions')
    if run >= 3: fails.append(f'the same transition look {run} times in a row: vary them')
    if len(kinds) >= 6 and (len(looks) < 4 or topn > len(kinds) / 2):
        fails.append(f'transitions are monotonous: {len(looks)} distinct looks, "{top}" used {topn}/{len(kinds)} times (want >= 4 looks, none over half)')
    if onr < .6: fails.append(f'only {onr:.0%} of transitions land on a beat (want >= 60 %): snap each transition to the nearest beat or bar')
out.append('\n## ' + ('FLAGS (advisory: look at the frames first; fix real problems with designed changes, keep deliberate choices and say why; see references/common-problems.md)' if fails else 'NO FLAGS'))
out += [f'- {f}' for f in fails]
open(os.path.join(P, 'out/check.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('\n'.join(out)); sys.exit(1 if fails else 0)
