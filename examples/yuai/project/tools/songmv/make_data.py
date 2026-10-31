#!/usr/bin/env python3
"""Turn data/audio.timeline.json + data/lyrics.lrc into src/data.js (TL + LYR) and data/lines.json (for the check scripts).
Usage: python3 tools/make_data.py <project_dir>
Gaps longer than 4 s between lines get a '♪' line, so every second of the song belongs to a shot."""
import json, re, sys, os
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
root = sys.argv[1] if len(sys.argv) > 1 else '.'
tl = json.load(open(os.path.join(root, 'data/audio.timeline.json'), encoding='utf-8'))
keep = ['duration', 'tempo_bpm', 'seconds_per_beat', 'beat_times', 'bar_times', 'hits', 'sections', 'drops',
        'energy_per_beat', 'energy_per_bar', 'vocal_activity_per_beat']
TL = {k: tl[k] for k in keep if k in tl}
lrc = open(os.path.join(root, 'data/lyrics.lrc'), encoding='utf-8-sig').read()
off = re.search(r'\[offset:(-?\d+)\]', lrc); off = int(off.group(1)) / 1000 if off else 0
rows = []
# 一行一句：普通 LRC「[00:01.99]歌词」和逐字 LRC「[00:01.99]我[00:01.99]们…」都按一行算一句，句首取第一个时间
TS = re.compile(r'[\[<](\d+):(\d+(?:\.\d+)?)[\]>]')
for ln in lrc.splitlines():
    ts = TS.findall(ln)
    if not ts or re.match(r'\[[a-z]+:', ln): continue
    text = TS.sub('', ln).strip()
    if text: rows.append([round(int(ts[0][0]) * 60 + float(ts[0][1]) + off, 3), text])
rows.sort()
out = []
for i, (t, text) in enumerate(rows):
    if out and t - out[-1]['end_guess'] > 4 and not out[-1]['text'].startswith('♪'):
        out.append({'t': round(out[-1]['end_guess'], 3), 'text': '♪ 间奏', 'end_guess': t})
    nxt = rows[i + 1][0] if i + 1 < len(rows) else TL['duration']
    # a sung line rarely lasts more than ~6 s; the rest of a long gap is an interlude
    out.append({'t': t, 'text': text, 'end_guess': min(nxt, t + 6) if not text.startswith('♪') else nxt})
if TL['duration'] - out[-1]['end_guess'] > 3:
    out.append({'t': round(out[-1]['end_guess'], 3), 'text': '♪ 尾奏', 'end_guess': TL['duration']})
LYR = []
for i, r in enumerate(out):
    end = out[i + 1]['t'] if i + 1 < len(out) else TL['duration']
    LYR.append({'t': r['t'], 'text': r['text'], 'end': round(end, 3), 'id': 'L%02d' % (i + 1)})
with open(os.path.join(root, 'src/data.js'), 'w', encoding='utf-8') as f:
    f.write('// generated from data/audio.timeline.json + data/lyrics.lrc\n')
    f.write('export const TL = ' + json.dumps(TL, ensure_ascii=False) + ';\n')
    f.write('export const LYR = ' + json.dumps(LYR, ensure_ascii=False, indent=0) + ';\n')
json.dump({'lines': LYR, 'duration': TL['duration']}, open(os.path.join(root, 'data/lines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for l in LYR: print(l['id'], l['t'], l['end'], l['text'])
