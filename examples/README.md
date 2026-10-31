# 示例（看做法，不要照抄镜头）

两份都来自《把回忆拼好给你》七 AI 接力 MV，是这个技能成形**之前**做的。它们是参考：看引擎怎么用、镜头和分镜怎么写、检查报告长什么样。你的片子要按你的歌自己构思，世界、镜头、转场都不要照搬。

**先说清楚它们差在哪，别学错：**

- 两份都**没有过体素关（V0–V7）和场景关（C1–C4）**，当时还没有这两道关。S1 的 28 秒里换了 5 个场景（最短不到 2 秒），按现在的规则太碎；S2 的 `plan.json` 后来补了 `scenes`（3 个场景，9–11 秒一个），可以看场景表怎么写。
- S1 的场景是平面大方块、没有圆角和小物件（自己的风格打分里「场景细节」只有 3 分，没过线），离 `STYLE.md` 要的「桌上的体素微缩模型」还差得远。**画风以 `references/style/` 和 `STYLE.md` 为准，不以 S1 为准。**
- S1 成片截图顶部的「Claude 制作」和 logo 条是接力拼接时加的叠加层，你的片子里不要有（SKILL.md：画面里不要出现模型名、水印）。
- 角色外观以 `characters/<角色>/character.md` 和帧图为准。S1 源码里的 `CHARACTERS.md` 是当时的旧描述。

## S1_相遇/（只读，跑不起来）

第 1 段（Claude 做，0–28.667 秒，688 帧）：灰色雨天的方块小镇，Claude 遇见 DeepSeek，世界以她为圆心上色。song-mv 稳妥模式，动作关、转场关 PASS，没有定格。

- `源码/main.js`：当时的单文件写法，引擎（`kit/engine/relay.js`）就是从它拆出来的，所以函数名大多一样（`groundAt`、`faceCamera`、`pose`、转场着色器、后期）。它要的 `node_modules/`、`assets/kp.json`、歌词和音频都不在技能包里，**不能直接跑**，只用来读写法。要跑就用 `scripts/new_project.py` 建新项目，在 `shots.js` 里照新引擎写。
- `源码/TREATMENT.md`、`STYLE_FRAMES.md`：构思和风格样张记录。值得学的是写法：先逐条写「比参考图差在哪」，再打分。里面提到的 `relay-mv/分镜样例_S1_Claude.md` 不在技能包里。
- `源码/ACTIONS.json`、`act_check.md`、`trans_check.md`：动作表和两道关的报告（合拍度 0.22 / 0.24，都 PASS）。
- `check.md`：节拍报告。注意它有 FLAGS 没处理完：L01、L04 拍上没有可见的落点，L06 画面接近静止，7 个重拍没有反应。这些是建议级，不挡渲染，但你的片子要比它做得好。
- `sheet.jpg`：接触表；`成片截图.jpg`：成片里的一帧。

## S2_开工包/（多段接力时照着写开工包）

第 2 段发给 DeepSeek 的开工说明：`开始.md`（只读这一份就能开工：剧情、必须有的画面、分镜表、引擎速查、交接、默认决定）、`plan.json`（镜头、转场、动作轨、表情、交接）、`shots.js`（**占位场景**，灰色地台，DeepSeek 要换成自己的；`placeholder: true` 时交接检查会判 FAIL）、`ACTIONS.json`（由 `kit/tools/make_actions.py` 从 plan.json 生成）。

- 它是给「另一个模型接着做」的说明书，不是成片示例。做多段接力、要给别的模型写开工包时照着它写，见 `references/relay.md`。
- `开始.md` 写于体素关之前，里面没提 `python tools/run.py voxel`；现在交付前 `video` 会一起跑体素关，写新开工包时把体素关的要求（`SKILL.md`）也写进去。
