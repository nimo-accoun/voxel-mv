# 第三方与待核实素材

以下范围优先于仓库默认许可。示例中的副本遵循相同规则；生成项目省略路径中的 `kit/` 前缀。

| 路径 / 内容 | 已知来源及许可 | 处理方式 |
|---|---|---|
| `kit/vendor/three.module.js`；`examples/yuai/project/vendor/three.module.js` | Three.js r160；文件头为 Copyright 2010–2023 Three.js Authors，MIT | 完整文本见 `LICENSES/Threejs-MIT.txt`，保留文件头 |
| `kit/vendor/zcool-kuaile/`；雨爱示例对应目录 | ZCOOL KuaiLe Project Authors，SIL OFL 1.1 | 保留各目录原有 LICENSE，不适用默认非商业许可 |
| `kit/tools/render/`；雨爱示例对应目录 | LemoLab，目录内 MIT License | 保留原 LICENSE，不能重新限制该组件的商用权 |
| 安装时下载的 `playwright-core` 等依赖 | 按锁文件安装；许可随依赖分发 | 未纳入仓库默认许可，分发时保留依赖自身许可 |
| `kit/tools/songmv/`、历史示例及公共引擎中的上游贡献 | 文档标明来自 song-mv / 七 AI 接力 MV；当前未查明各项上游授权链 | 默认许可仅覆盖维护者有权授权的部分；发布前核实上游来源和许可，不把“未附许可证”视为自有作品 |
| `characters/` 中帧图与角色形象、`references/style/`、示例 `ref/style/` 与预览图片 | 当前没有逐项权属和分发许可记录 | 排除于本次新授权之外；需补来源、创作者、授权范围 |
| 示例的歌词文本及 `data/`、`assets/lyrics.json`、`src/data.js` 等内嵌歌词 | 《雨爱》等相关作品权利人；具体版本权属未核实 | 不由本项目重新授权；公开发布前确认分发依据或移除对应文本 |
| 用户提供的音乐、原始 MP4、带音乐成片 | 由相应作品权利人决定 | 本次不随新增示例包分发，也不提供音乐授权 |

仅仅公开源文件不代表拥有重新授权的权利。任何已有明确许可和署名均应保留。本表是已识别项目的清单，不是全部素材已完成权属审查的声明。

标准许可文本来源：

- https://polyformproject.org/licenses/noncommercial/1.0.0.txt
- https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.txt
- https://raw.githubusercontent.com/mrdoob/three.js/r160/LICENSE
