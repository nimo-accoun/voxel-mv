# act check

mode: **safe (gates block the render)**  ·  characters: claude, deepseek

## per line

| line | text | claude: on / actions / longest still / sync | deepseek: on / actions / longest still / sync |
|---|---|---|---|
| L01 | 我们都是渺小真实存在 | 100% / 5 / 0 / 0.05 ⚠ | – |
| L02 | 祈愿小世界里不只有挫败 | 100% / 4 / 0 / 0.03 ⚠ | – |
| L03 | 直到遇见你我以为就光明起来 | 100% / 4 / 0 / 0.13 ⚠ | 92% / 3 / 0 / 0.29 |
| L04 | 眼睛里看到的都是广袤无垠的大 | 100% / 5 / 0 / 0.21 | 100% / 10 / 0 / 0.22 |
| L05 | 有你在的日子不可能被取代 | 100% / 4 / 0 / 0.44 | 100% / 4 / 0 / 0.46 |
| L06 | 在最灰暗的日子你陪着我发呆 | 100% / 0 / 1 / 0.19 | 100% / 2 / 0 / -0.05 ⚠ |
| L07 | 你让我学会如何拨开阴霾 | 100% / 1 / 0 / 0.31 | 100% / 3 / 0 / 0.18 |
| L08 | 将快乐全都收集将不开心全都淘 | 100% / 1 / 0 / 0.39 | 100% / 3 / 0 / 0.36 |

## gates

- **claude** on screen 26.8 s, 25 clear actions
  - G1 action every 2 bars: PASS (4/4 windows)
  - G2 longest still: 1 beats (from 20.6s) PASS
  - G3 sync: 0.22 PASS
- **deepseek** on screen 20.0 s, 25 clear actions
  - G1 action every 2 bars: PASS (3/3 windows)
  - G2 longest still: 0 beats PASS
  - G3 sync: 0.24 PASS
- G4 action plan: PASS (15/15 planned actions seen)

| line | who | beat | t | action | seen |
|---|---|---|---|---|---|
| L01 | claude | 3 | 2.70 | 雨里侧面走，每拍一步 | ok |
| L02 | claude | 7 | 6.10 | 双手合十祈愿到位 | ok |
| L02 | claude | 8 | 6.96 | 「挫败」：低头弯腰，头顶乌云 | ok |
| L03 | deepseek | 12 | 10.36 | 走到她跟前停下，笑 | ok |
| L03 | claude | 12 | 10.36 | 回头看见她（转身到位） | ok |
| L03 | claude | 13 | 11.22 | 「光明起来」：朝她伸手 | ok |
| L04 | claude | 15 | 12.92 | 并肩走上码头 | ok |
| L04 | deepseek | 15 | 12.92 | 并肩走上码头 | ok |
| L05 | claude | 19 | 16.33 | 大笑（每半拍换一帧） | ok |
| L05 | deepseek | 20 | 17.18 | 412 强击点：跳一下凑过来 | ok |
| L06 | deepseek | 23 | 19.74 | 举起大叶子替她挡雨 | ok |
| L07 | deepseek | 27 | 23.14 | 伸手拨开乌云（伸到位） | ok |
| L07 | claude | 29 | 24.85 | 阳光照下来，笑起来 | ok |
| L08 | claude | 31 | 26.55 | 637 拍上蹲下去捡拼图块 | ok |
| L08 | deepseek | 32 | 27.40 | 一起拾起拼图块 | ok |

Read with out/act_check.png: each character's body speed, beats as ticks, clear actions as dots, still beats in grey, 2-bar windows with no action in red.

**PASS**
