# transition check

mode: **safe (gates block the render)**

12 entries: through×3, wipe×3, dissolve×2, slide×1, whip×1, incamera×2

| from→to | key | kind | length | on beat/bar/hit | length ok | seen in the film | note |
|---|---|---|---|---|---|---|---|
| S1-01→S1-02 | 1.833 | wipe | 0.58s | yes | ok | ok (peak ×8.3, before/after ×2.4) | 方块像雨一列列落下，拼出街道 |
| S1-02→S1-03 | 5.250 | through | 0.42s | yes | ok | ok (peak ×8.3, before/after ×2.6) | 径向模糊推进，穿进 Claude |
| S1-03→S1-04 | 8.625 | dissolve | 0.50s | yes | ok | ok (peak ×15.5, before/after ×1.4) | 画面碎成体素再重新拼回（体素化溶解），落在 207 击点 |
| S1-04→S1-04 | 10.333 | incamera | 1.12s | yes | ok | ok (peak ×7.7, before/after ×1.7) | 以 DeepSeek 为圆心，灰色小镇上色，248 强击点整 |
| S1-04→S1-05 | 12.083 | wipe | 0.67s | yes | ok | ok (peak ×11.9, before/after ×3.7) | 灰色小镇崩成方块往下掉，露出码头 |
| S1-05→S1-06 | 15.458 | through | 0.42s | yes | ok | ok (peak ×12.6, before/after ×2.5) | 推进到两人身上 |
| S1-06→S1-07 | 18.875 | slide | 0.50s | yes | ok | ok (peak ×12.4, before/after ×4.8) | 画面一条条横向滑走，夕阳换成阴天 |
| S1-07→S1-08 | 22.458 | whip | 0.42s | yes | ok | ok (peak ×23.2, before/after ×7.6) | 甩镜头上摇到天空，动态模糊，落在 539 击点 |
| S1-08→S1-08 | 24.208 | incamera | 2.08s | yes | ok | ok (peak ×19.1, before/after ×9.0) | 乌云两次裂开，581 击点天空放晴、光柱照下 |
| S1-08→S1-09 | 25.708 | dissolve | 0.50s | yes | ok | ok (peak ×5.8, before/after ×1.3) | 光柱爆成体素，散开后是沙滩 |
| S1-09→S1-10 | 28.250 | through | 0.25s | yes | ok | ok (peak ×3.0, before/after ×2.4) | 推进到拼图块 |
| S1-10→T1 | 28.417 | wipe | 0.38s | NO | ok | ok (peak ×5.2, before/after ×1.4) | 交接卡 T1：拼图的光炸成奶白方块铺满画面，686–687  |

## gates

- T1 visible & complete: PASS
- T2 variety: PASS (5 kinds, largest 3/10, longest run 1, cut 0/10)
- T3 on the beat: PASS (11/12) — off: 28.416666666666668
- T4 length: PASS
- T5 drops: PASS

Kinds: cut = 硬切, flash = 闪白/闪黑, dissolve = 溶解, wipe = 擦除, iris = 圈入圈出, slide = 推拉滑入, whip = 甩镜, through = 穿过物体推进, match = 形状匹配, page = 翻页, rotate = 旋转, incamera = 镜头内换景/一镜到底, other = 其他（note 里写清楚）

**PASS**
