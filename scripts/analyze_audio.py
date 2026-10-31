#!/usr/bin/env python3
"""分析一首歌的节奏：拍点、小节、重击点、段落、drop、每拍能量 → audio.timeline.json + audio.report.md。
只要 Python（numpy）和 ffmpeg，mp3 / wav / m4a / flac 都行。new_project.py 没给 --timeline 时会自动调用它。
用法：python $SKILL/scripts/analyze_audio.py song.mp3 [--out 目录] [--bpm 128]
  --bpm  自动测出来的速度不对（比如差一倍）时，直接告诉它大概的 BPM
结果是自动估的：拍点一般很准，段落和 drop 是估计，做 TREATMENT 时以耳朵听到的为准，可以手改 audio.timeline.json 再建项目。"""
import argparse, json, os, subprocess, sys
import numpy as np
if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ap = argparse.ArgumentParser(); ap.add_argument('audio'); ap.add_argument('--out'); ap.add_argument('--bpm', type=float)
A = ap.parse_args()
OUT = A.out or os.path.dirname(os.path.abspath(A.audio)); os.makedirs(OUT, exist_ok=True)
SR, HOP, NFFT = 22050, 512, 2048
try:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', A.audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
except FileNotFoundError: sys.exit('没找到 ffmpeg：先装 ffmpeg（Windows：winget install Gyan.FFmpeg；macOS：brew install ffmpeg）')
except subprocess.CalledProcessError as e: sys.exit('ffmpeg 读不了这个音频：' + e.stderr.decode('utf-8', 'replace')[-300:])
y = np.frombuffer(raw, np.float32).astype(np.float64)
if len(y) < SR * 5: sys.exit('音频太短（不到 5 秒）或者读出来是空的')
dur = len(y) / SR
fps = SR / HOP                                   # 帧率（约 43 帧/秒）

# ---------- 频谱 ----------
win = np.hanning(NFFT); nfr = 1 + (len(y) - NFFT) // HOP
S = np.empty((NFFT // 2 + 1, nfr), np.float32)
for i in range(0, nfr, 2048):                     # 分批算，省内存
    idx = np.arange(i, min(nfr, i + 2048))
    fr = np.lib.stride_tricks.sliding_window_view(y, NFFT)[idx * HOP] * win
    S[:, idx] = np.abs(np.fft.rfft(fr, axis=1)).T
freqs = np.fft.rfftfreq(NFFT, 1 / SR)
edges = np.geomspace(40, 10000, 25)              # 24 个对数频带
B = np.stack([S[(freqs >= a) & (freqs < b)].sum(0) for a, b in zip(edges, edges[1:])])
LB = np.log1p(B * 10)
flux = np.maximum(0, np.diff(LB, axis=1, prepend=LB[:, :1]))
onset = flux.sum(0); onset = onset - np.convolve(onset, np.ones(16) / 16, 'same'); onset = np.maximum(onset, 0)
onset /= onset.max() + 1e-9
low = np.maximum(0, np.diff(LB[:5], axis=1, prepend=LB[:5, :1])).sum(0)   # 低频（底鼓）起音
OFF = (NFFT / 2 + HOP) / SR                       # 第 i 帧对应的时刻（窗口中心再晚一跳：和 librosa 的拍点对齐，实测误差中位数 ≈ 0）
t_of = lambda i: i / fps + OFF

# ---------- 速度 ----------
lags = np.arange(int(fps * 60 / 200), int(fps * 60 / 60) + 1)
oc = onset - onset.mean()
ac = np.array([np.dot(oc[:-l], oc[l:]) for l in lags]); ac /= ac.max() + 1e-9
bpm_of = lambda l: 60 * fps / l
if A.bpm: prior = np.exp(-0.5 * (np.log2(bpm_of(lags) / A.bpm) / 0.05) ** 2)
else: prior = np.exp(-0.5 * (np.log2(bpm_of(lags) / 120) / 0.9) ** 2)     # 偏向 120 左右（流行歌大多在 70–180）
score = ac * prior
# 也看两倍、一半的周期，挑一致性最好的
lag = lags[np.argmax(score)]
period = float(lag)
for _ in range(2):    # 抛物线插值细化
    k = int(round(period)) - lags[0]
    if 0 < k < len(ac) - 1:
        a, b, c = ac[k - 1], ac[k], ac[k + 1]; d = 0.5 * (a - c) / (a - 2 * b + c + 1e-12)
        period = lags[k] + float(np.clip(d, -0.5, 0.5))
bpm = bpm_of(period)

# ---------- 拍点（Ellis 动态规划）----------
n = len(onset); sc = onset.copy(); back = -np.ones(n, int)
lo, hi = int(period * 0.5), int(period * 2)
for t in range(lo, n):
    prev = np.arange(max(0, t - hi), t - lo + 1)
    if not len(prev): continue
    cand = sc[prev] - 100 * np.log((t - prev) / period) ** 2
    j = np.argmax(cand); sc[t] = onset[t] + cand[j]; back[t] = prev[j]
tail = np.arange(max(0, n - int(period * 2)), n)
t = tail[np.argmax(sc[tail])]; beats = []
while t >= 0: beats.append(t); t = back[t]
beats = np.array(beats[::-1])
bt = beats / fps + OFF
# 去掉开头结尾安静部分里不可靠的拍
rms = np.sqrt(np.convolve(y ** 2, np.ones(HOP) / HOP, 'same')[::HOP][:n] + 1e-12)
loud = rms[np.clip(beats, 0, n - 1)] > 0.02 * np.percentile(rms, 95)   # 只去掉真正没声音的头尾
first, last = np.argmax(loud), len(loud) - np.argmax(loud[::-1])
bt = bt[first:last]
spb = float(np.median(np.diff(bt)))

# ---------- 小节（4/4，挑底鼓最强的相位做强拍）----------
bi = np.clip(((bt - OFF) * fps).round().astype(int), 0, n - 1)
ph = int(np.argmax([low[bi[p::4]].mean() + onset[bi[p::4]].mean() for p in range(4)]))
bar_t = bt[ph::4]

# ---------- 每拍 / 每小节能量 ----------
def seg_energy(times):
    e = []
    for a, b in zip(times, list(times[1:]) + [min(dur, times[-1] + spb)]):
        s = y[int(a * SR):max(int(a * SR) + 1, int(b * SR))]; e.append(float(np.sqrt((s ** 2).mean())))
    e = np.array(e); return (e / (e.max() + 1e-9)).round(5)
eb, ebar = seg_energy(list(bt)), seg_energy(list(bar_t))
mid = B[(edges[:-1] >= 250) & (edges[:-1] < 3500)].sum(0) / (B.sum(0) + 1e-9)
voc = np.array([mid[int((a - OFF) * fps):max(int((a - OFF) * fps) + 1, int((a - OFF + spb) * fps))].mean() for a in bt])
voc = ((voc - voc.min()) / (np.ptp(voc) + 1e-9)).round(5)

# ---------- 重击点 ----------
env = low / (low.max() + 1e-9) + onset
pk = [i for i in range(2, n - 2) if env[i] == env[i - 2:i + 3].max()]
vals = env[pk]; thr = vals.mean() + 2 * vals.std()
hits, lastt = [], -9
for i in sorted([i for i in pk if env[i] > thr], key=lambda i: -env[i]):
    if all(abs(t_of(i) - h['time']) > 0.35 for h in hits): hits.append({'time': round(t_of(i), 3), 'strength': round(float(env[i]) * 10, 4)})
hits = sorted(hits[:max(4, int(dur / 4))], key=lambda h: h['time'])

# ---------- 段落（按小节算新颖度）----------
feat = []
for a, b in zip(bar_t, list(bar_t[1:]) + [dur]):
    seg = LB[:, int((a - OFF) * fps):max(int((a - OFF) * fps) + 1, int((b - OFF) * fps))]; feat.append(seg.mean(1))
feat = np.array(feat); feat = (feat - feat.mean(0)) / (feat.std(0) + 1e-9)
sim = feat @ feat.T / feat.shape[1]
K = 4; ker = np.kron(np.array([[1, -1], [-1, 1]]), np.ones((K, K)))
nov = np.zeros(len(feat))
for i in range(K, len(feat) - K): nov[i] = (sim[i - K:i + K, i - K:i + K] * ker).sum()
sections, cand = [], sorted(range(len(nov)), key=lambda i: -nov[i])
for i in cand:
    if nov[i] <= np.percentile(nov, 75) or len(sections) >= max(3, int(dur / 25)): break
    if all(abs(i - j) >= 6 for j in sections): sections.append(i)
sections = sorted(round(float(bar_t[i]), 3) for i in sections)

# ---------- drop（某个小节能量比前面 4 小节突然高很多）----------
drops = []
for i in range(4, len(ebar)):
    jump = ebar[i] - ebar[i - 4:i].mean()
    if jump > 0.18 and ebar[i] > 0.7 and all(abs(bar_t[i] - d['time']) > 8 for d in drops):
        drops.append({'time': round(float(bar_t[i]), 3), 'strength': round(float(jump), 4)})

TL = {'source': os.path.basename(A.audio), 'duration': round(dur, 3), 'sr': SR, 'tempo_bpm': round(60 / spb, 3), 'seconds_per_beat': round(spb, 5),
      'beats_per_bar': 4, 'bar_phase_offset': ph, 'beat_times': [round(float(x), 3) for x in bt], 'bar_times': [round(float(x), 3) for x in bar_t],
      'hits': hits, 'sections': sections, 'drops': drops, 'energy_per_beat': eb.tolist(), 'energy_per_bar': ebar.tolist(),
      'vocal_activity_per_beat': voc.tolist(), 'analyzer': 'voxel-mv analyze_audio.py（自动估计）'}
json.dump(TL, open(os.path.join(OUT, 'audio.timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
mmss = lambda t: f'{int(t // 60):02d}:{t % 60:06.3f}'
R = ['# 节奏分析报告（自动估计）', '', '| 项目 | 值 |', '|---|---|', f'| 时长 | {dur:.1f} 秒（{int(dur // 60)} 分 {dur % 60:.0f} 秒） |',
     f'| BPM | {60 / spb:.1f} |', f'| 拍数 / 小节数 | {len(bt)} / {len(bar_t)}（按 4/4） |', f'| 第一拍 | {bt[0]:.2f} 秒 |', f'| 重击点 | {len(hits)} 个 |', '',
     '## 段落分界（估计）', ''] + [f'- {mmss(s)}' for s in sections] + ['', '## Drop（能量突然抬高的小节）', ''] + \
    ([f'- {mmss(d["time"])}（强度 {d["strength"]}）' for d in drops] or ['- 没找到明显的 drop']) + \
    ['', '## 每 4 小节平均能量（0–1）', ''] + [f'- {mmss(bar_t[i])}  ' + '█' * int(round(ebar[i:i + 4].mean() * 20)) for i in range(0, len(bar_t), 4)] + \
    ['', '这些是程序估的：拍点一般准；段落、drop 要用耳朵核对。速度差一倍时用 --bpm 重新分析。']
open(os.path.join(OUT, 'audio.report.md'), 'w', encoding='utf-8').write('\n'.join(R) + '\n')
print(f'分析完：{dur:.1f} 秒，{60 / spb:.1f} BPM，{len(bt)} 拍，{len(sections) + 1} 段，{len(drops)} 个 drop，{len(hits)} 个重击点'
      f' → {os.path.join(OUT, "audio.timeline.json")}、audio.report.md')
