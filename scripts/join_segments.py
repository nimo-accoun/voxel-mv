#!/usr/bin/env python3
"""把分段做的几个项目拼成整支 MV：按 plan.json 的 start 排好，检查帧号首尾相接，无损拼接，再配整首原曲。
用法：python $SKILL/scripts/join_segments.py 成片.mp4 --audio song.mp3 段1目录 段2目录 ...
每个段目录里要先跑过 python tools/run.py video（用的是 out/<segment>_<maker>.mp4）。"""
import argparse, json, os, subprocess, sys, tempfile
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--audio', required=True); ap.add_argument('segments', nargs='+')
A = ap.parse_args()
segs = []
for d in A.segments:
    p = json.load(open(os.path.join(d, 'plan.json'), encoding='utf-8'))
    f = os.path.join(d, 'out', f"{p['segment']}_{p['maker']}.mp4")
    if not os.path.exists(f): sys.exit(f'{d} 还没有成片 {f}：先在那个目录里跑 python tools/run.py video')
    n = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or 0)
    if n != p['end'] - p['start']: sys.exit(f"{f} 有 {n} 帧，plan.json 说应该是 {p['end'] - p['start']} 帧")
    segs.append((p['start'], p['end'], f))
segs.sort()
for (a0, a1, fa), (b0, b1, fb) in zip(segs, segs[1:]):
    if a1 != b0: sys.exit(f'{fa} 到第 {a1} 帧，{fb} 从第 {b0} 帧开始：中间{"重叠" if a1 > b0 else "缺了"}，改 plan.json 的 start/end 重渲')
if segs[0][0] != 0: print(f'提醒：第一段从第 {segs[0][0]} 帧开始，不是歌头')
with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as L:
    for _, _, f in segs: L.write("file '%s'\n" % os.path.abspath(f).replace("'", "'\\''"))
tmp = A.out + '.video.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', L.name, '-c', 'copy', tmp], check=True)
ss = f'{segs[0][0] / 24:.4f}'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ss', ss, '-i', A.audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', A.out], check=True)
os.remove(tmp); os.remove(L.name)
print(f'拼好了：{A.out}（{len(segs)} 段，第 {segs[0][0]}–{segs[-1][1] - 1} 帧）')
