# 角色

技能自带七个角色（《把回忆拼好给你》的接力角色），帧图已经放好，直接用：

| 文件夹名（`--cast` 里写的） | 是谁 |
|---|---|
| claude | 橙发琥珀眼的方块礼裙少女 |
| deepseek | 蓝发鲸鳍女仆 |
| gemini | 紫发双子星灵 |
| gpt | 白紫方块小龙女 |
| kimi | 月冠银发方块女仆 |
| qwen | 紫蓝方块汉服玩偶 |
| zai | 薰衣草色方块女仆 |

挑角色前读各自的 `character.md`（长相、标志物、主色、帧图里没有的东西）。每个角色有 19 个动作，名字就是 `frames/` 下的文件夹名。

```
characters/
  身高校正.json          各角色的 mv_scale（按「眼睛到脚底」统一身高）
  bad_frames.json        已知坏帧
  角色对照.txt           文件夹名 ↔ 原素材名
  claude/
    character.md         角色说明
    frames.json          canvas、baseline_y、center_x、stand_h、每个动作的 frames/fps/loop
    frames/<动作>/01.png …
```

帧图很大（七个人约 900 MB）。把技能交给别人或别的 AI 时，要整个文件夹连 `characters/` 一起给；只用几个角色，可以只留那几个的文件夹。

## 加新角色

1. 用 sprite-frames 技能出帧（标准动作，侧面动作朝右），得到 `frames.json` + `frames/`。
2. 建 `characters/<名字>/`（英文小写，不要空格），放进去，再写一份 `character.md`（是谁、长什么样、标志物、主色、帧图里没有的东西）。
3. 身高：和已有角色并排截一张图，量「眼睛到脚底」，算出让它和别人一样高的 `mv_scale`，写进 `身高校正.json`（或直接写进它的 frames.json）。也可以在 frames.json 里写实测的 `eye_sole`（眼睛到脚底的素材像素），体素关 V1 用它。
4. 有切坏的帧就写进 `bad_frames.json`（帧序从 1 数）。
