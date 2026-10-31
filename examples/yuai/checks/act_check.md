# act check

mode: **safe (gates block the render)**  ·  characters: claude, deepseek

## per line

| line | text | claude: on / actions / longest still / sync | deepseek: on / actions / longest still / sync |
|---|---|---|---|
| L01 | 真希望雨能下不停 | 100% / 3 / 0 / 0.46 | – |
| L02 | 让想念继续 | 100% / 6 / 0 / 0.35 | – |
| L03 | 让爱变透明 | 100% / 6 / 0 / 0.35 | – |
| L04 | 我爱上给我勇气的 Raini | 100% / 16 / 0 / 0.26 | 93% / 20 / 0 / 0.30 |
| L05 | 窗外的雨滴 | 100% / 3 / 0 / 0.13 ⚠ | 100% / 2 / 0 / 0.54 |
| L06 | 一滴滴累积 | 100% / 2 / 0 / – | 100% / 4 / 0 / – |
| L07 | 屋内的湿气 | 100% / 5 / 0 / – | 100% / 2 / 0 / – |
| L08 | 像储存爱你的记忆 | 100% / 11 / 0 / 0.60 | 100% / 5 / 0 / 0.67 |
| L09 | ♪ 间奏 | 100% / 22 / 0 / 0.45 | 100% / 15 / 0 / 0.65 |
| L10 | 我相信 | 100% / 2 / 0 / 0.06 ⚠ | 100% / 1 / 0 / 0.44 |
| L11 | 我将会看到彩虹的美丽 | 100% / 0 / 0 / 0.58 | 100% / 4 / 0 / 0.61 |

## gates

- **claude** on screen 44.4 s, 76 clear actions
  - G1 action every 2 bars: PASS (12/12 windows)
  - G2 longest still: 0 beats PASS
  - G3 sync: 0.41 PASS
- **deepseek** on screen 32.9 s, 53 clear actions
  - G1 action every 2 bars: PASS (9/9 windows)
  - G2 longest still: 0 beats PASS
  - G3 sync: 0.56 PASS
- G4 action plan: PASS (19/19 planned actions seen)

| line | who | beat | t | action | seen |
|---|---|---|---|---|---|
| L01 | claude | 8 | 3.53 | 伸手到位 | ok |
| L02 | claude | 12 | 5.20 | 开心笑到位 | ok |
| L03 | claude | 18 | 7.71 | 伸手到位 | ok |
| L03 | claude | 21 | 8.96 | 开心笑到位 | ok |
| L03 | claude | 24 | 10.19 | 伸手到位 | ok |
| L04 | claude | 41 | 17.30 | 开心笑到位 | ok |
| L05 | claude | 43 | 18.14 | 伸手到位 | ok |
| L05 | claude | 45 | 18.97 | 开心笑到位 | ok |
| L07 | claude | 53 | 22.31 | 鞠躬道谢到位 | ok |
| L07 | claude | 53 | 22.31 | 开心笑 | ok |
| L08 | claude | 59 | 24.82 | 开心笑 | ok |
| L08 | claude | 65 | 27.33 | 伸手到位 | ok |
| L08 | claude | 65 | 27.33 | 挥手告别 | ok |
| L09 | claude | 71 | 29.84 | 鞠躬道谢到位 | ok |
| L09 | claude | 71 | 29.84 | 开心笑 | ok |
| L09 | claude | 81 | 34.02 | 伸手到位 | ok |
| L09 | claude | 81 | 34.02 | 开心笑 | ok |
| L09 | claude | 89 | 37.36 | 鞠躬道谢到位 | ok |
| L09 | claude | 89 | 37.36 | 开心笑 | ok |

Read with out/act_check.png: each character's body speed, beats as ticks, clear actions as dots, still beats in grey, 2-bar windows with no action in red.

**PASS**
