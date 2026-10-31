#!/usr/bin/env python3
"""Transitions: the page declares them (window.TRANSITIONS), this script checks the table and verifies it against the film.
Usage: python3 trans_check.py <project_dir> [video=out/mv.mp4] [--mode safe|free]
Reads out/page_meta.json (render.sh writes it), data/lines.json, data/audio.timeline.json, and the video if it exists
(without a video only the table checks run: T2-T5; T1 waits for render.sh video). Writes out/trans_check.md.
Mode: --mode, else the first word of <project>/MODE, else safe. safe: exit 3 if a gate fails. free: exit 0.

window.TRANSITIONS = [{ from: 'S03', to: 'S04', t0: 6.69, t1: 7.29, key: 7.036, kind: 'iris', note: '...' }, ...]
  key  = the moment the picture changes (the frame the eye reads as "new scene"); t0..t1 = the whole transition.
  kind = how it moves, one of KINDS below (any art style can draw any of them). A big change inside one shot
         (a drop that turns night into day, a one-take that travels to a new place) is an entry with kind 'incamera'.
Gates (safe mode):
  T1  every entry visibly changes the picture at its key; no undeclared scene change anywhere else (a one-frame jump
      after which >= 40 % of the picture stays different: a cut, a new panel taking half the page, the whole sky
      swapping colour. Flashes that fade back, blinks, sparks and small pop-ins do not count)
  T2  >= 4 kinds; no kind > 40 %; never the same kind 3 times in a row; 'cut' <= 30 %   ('incamera' not counted)
  T3  >= 80 % of keys within 1 frame of a beat, a bar line or a hit
  T4  2 frames <= t1 - t0 <= 1 bar ('cut' and 'incamera' may be 0); a transition spans at most one lyric-line start
  T5  every drop has an entry whose key is within 1 frame of it"""
import json, os, subprocess, sys
import numpy as np
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')

KINDS = {'cut': '硬切', 'flash': '闪白/闪黑', 'dissolve': '溶解', 'wipe': '擦除', 'iris': '圈入圈出', 'slide': '推拉滑入',
         'whip': '甩镜', 'through': '穿过物体推进', 'match': '形状匹配', 'page': '翻页', 'rotate': '旋转',
         'incamera': '镜头内换景/一镜到底', 'other': '其他（note 里写清楚）'}
FPS, TOL = 24, 1 / 24 + .01
args = sys.argv[1:]; mode = None
if '--mode' in args: i = args.index('--mode'); mode = args[i + 1]; del args[i:i + 2]
P = args[0] if args else '.'; V = args[1] if len(args) > 1 else os.path.join(P, 'out/mv.mp4')
if not mode:
    mf = os.path.join(P, 'MODE'); mode = (open(mf, encoding='utf-8').read().split() or ['safe'])[0] if os.path.exists(mf) else 'safe'
SAFE = mode != 'free'
L = json.load(open(os.path.join(P, 'data/lines.json'), encoding='utf-8'))['lines']
TL = json.load(open(os.path.join(P, 'data/audio.timeline.json'), encoding='utf-8'))
beats, bars = np.array(TL['beat_times']), np.array(TL['bar_times'])
spb, bar = float(np.median(np.diff(beats))), float(np.median(np.diff(bars)))
grid = np.sort(np.concatenate([beats, bars, [h['time'] for h in TL.get('hits', [])]]))
drops = [d['time'] for d in TL.get('drops', [])]
meta_p = os.path.join(P, 'out/page_meta.json')
meta = json.load(open(meta_p, encoding='utf-8')) if os.path.exists(meta_p) else {}
TR = meta.get('TRANSITIONS')
out, fails = ['# transition check\n', f'mode: **{"safe (gates block the render)" if SAFE else "free (advisory)"}**\n'], []
if not TR:
    out.append('**FAIL: the page declares no window.TRANSITIONS** (see SKILL.md 页面契约). A one-take film still declares '
               'its scene changes as kind "incamera".')
    open(os.path.join(P, 'out/trans_check.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(out[-1]); sys.exit(3 if SAFE else 0)
TR = sorted(TR, key=lambda r: r['key'])

# ---------- video ----------
fr = None
if os.path.exists(V):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', V, '-vf', f'fps={FPS},scale=160:90,format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160).astype(np.float32)
    N = len(fr); d = np.concatenate([[0], np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))])
    fi = lambda t: int(np.clip(round(t * FPS), 0, N - 1))
    diff = lambda a, b: float(np.abs(fr[fi(a)] - fr[fi(b)]).mean())
    win = [(r['t0'] - 2 / FPS, r['t1'] + 2 / FPS) for r in TR]
    def calm_med(t):   # typical change per frame around t, outside every transition
        ii = [i for i in range(fi(t - 1.5), fi(t + 1.5)) if not any(a <= i / FPS <= b for a, b in win)]
        return float(np.median(d[ii])) if ii else float(np.median(d))

# ---------- per entry ----------
rows, bad = [], {k: [] for k in ('T1', 'T3', 'T4')}
for r in TR:
    kind, key, t0, t1 = r.get('kind', '?'), float(r['key']), float(r['t0']), float(r['t1'])
    on = float(np.abs(grid - key).min()) <= TOL
    if not on: bad['T3'].append(r)
    dur = t1 - t0; lines_in = [l for l in L[1:] if t0 + spb / 2 < l['t'] < t1 - spb / 2]
    t4 = (dur <= bar + 1e-6) and (kind in ('cut', 'incamera') or dur >= 2 / FPS - 1e-6) and len(lines_in) <= 1 and t0 <= key <= t1
    if not t4: bad['T4'].append(r)
    vis = '–'
    if fr is not None:
        pk = float(d[fi(key - 2 / FPS):fi(key + 2 / FPS) + 1].max()); ratio = pk / max(calm_med(key), .5)
        span = max(t1 - t0, 2 / FPS) + 4 / FPS; change = diff(t0 - 2 / FPS, t1 + 2 / FPS)
        # the same before/after difference measured over equally long stretches nearby, outside every transition
        ref = [diff(x, x + span) for x in np.arange(key - 2.5, key + 2.5, 1 / FPS)
               if 0 <= x and x + span < N / FPS and not any(a < x + span and x < b for a, b in win)]
        cr = change / max(np.median(ref), 3) if ref else 9
        ok = ratio >= 2.5 or cr >= 1.8
        vis = f'{"ok" if ok else "NOT SEEN"} (peak ×{ratio:.1f}, before/after ×{cr:.1f})'
        if not ok: bad['T1'].append(r)
    rows.append(f"| {r.get('from', '')}→{r.get('to', '')} | {key:.3f} | {kind} | {dur:.2f}s | {'yes' if on else 'NO'} | "
                f"{'ok' if t4 else 'NO'} | {vis} | {str(r.get('note', ''))[:30]} |")

# undeclared scene changes: a one-frame jump after which a large part of the picture stays changed
undeclared = []
if fr is not None:
    for i in range(2, N - 8):
        if d[i] < 22 or any(a <= i / FPS <= b for a, b in win): continue
        loc = np.median(d[max(0, i - 12):i + 12])
        if d[i] < 3 * max(loc, 1): continue
        stay = float((np.abs(fr[i + 6] - fr[i - 1]) > 25).mean())   # share of the picture still different 6 frames later
        if stay >= .4 and (not undeclared or i / FPS - undeclared[-1] > .5): undeclared.append(i / FPS)
    if undeclared: bad['T1'].append('undeclared')

# ---------- film-level ----------
kinds = [r.get('kind', '?') for r in TR if r.get('kind') != 'incamera']
unknown = sorted({r.get('kind') for r in TR} - set(KINDS))
cnt = {k: kinds.count(k) for k in set(kinds)}; n = len(kinds)
run = max((len(list(g)) for _, g in __import__('itertools').groupby(kinds)), default=0)
need = min(4, n)
t2 = n == 0 or (len(cnt) >= need and max(cnt.values()) <= max(.4 * n, 1) and run < 3 and cnt.get('cut', 0) <= .3 * n and not unknown)
t5_miss = [x for x in drops if not any(abs(float(r['key']) - x) <= TOL for r in TR)]
gate = {
    'T1': (fr is None) or not bad['T1'],
    'T2': t2,
    'T3': len(bad['T3']) <= .2 * len(TR),
    'T4': not bad['T4'],
    'T5': not t5_miss,
}
out.append(f'{len(TR)} entries: ' + ', '.join(f'{k}×{v}' for k, v in sorted(cnt.items(), key=lambda x: -x[1])) +
           (f', incamera×{len(TR) - n}' if len(TR) > n else '') + '\n')
out.append('| from→to | key | kind | length | on beat/bar/hit | length ok | seen in the film | note |\n|---|---|---|---|---|---|---|---|')
out += rows
out.append('\n## gates\n')
out.append(f"- T1 visible & complete: " + ('waiting for out/mv.mp4 (render.sh video)' if fr is None else
           ('PASS' if gate['T1'] else 'FAIL') + (f" — not seen at: {', '.join(str(r['key']) for r in bad['T1'] if r != 'undeclared')}" if any(r != 'undeclared' for r in bad['T1']) else '') +
           (f" — undeclared scene change at: {', '.join(f'{x:.2f}s' for x in undeclared)}" if undeclared else '')))
out.append(f"- T2 variety: {'PASS' if gate['T2'] else 'FAIL'} ({len(cnt)} kinds, largest {max(cnt.values()) if cnt else 0}/{n}, longest run {run}, cut {cnt.get('cut', 0)}/{n}" +
           (f", unknown kinds: {unknown}" if unknown else '') + ')')
out.append(f"- T3 on the beat: {'PASS' if gate['T3'] else 'FAIL'} ({len(TR) - len(bad['T3'])}/{len(TR)})" +
           (f" — off: {', '.join(str(r['key']) for r in bad['T3'])}" if bad['T3'] else ''))
out.append(f"- T4 length: {'PASS' if gate['T4'] else 'FAIL'}" + (f" — {', '.join(str(r['key']) for r in bad['T4'])}" if bad['T4'] else ''))
out.append(f"- T5 drops: {'PASS' if gate['T5'] else 'FAIL'}" + (f" — nothing declared at {', '.join(f'{x:.3f}' for x in t5_miss)}" if t5_miss else ''))
fails = [k for k, v in gate.items() if not v]
out.append(f'\nKinds: ' + ', '.join(f'{k} = {v}' for k, v in KINDS.items()))
out.append(f'\n**{"FAIL: " + ", ".join(fails) if fails else "PASS"}**' + (' (free mode: advisory)' if fails and not SAFE else '') +
           (' (T1 not checked yet: no video)' if fr is None else ''))
open(os.path.join(P, 'out/trans_check.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(out[-1], '-> out/trans_check.md')
sys.exit(3 if fails and SAFE else 0)
