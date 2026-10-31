// S2 · DeepSeek · 第 688–1352 帧（全曲帧号）。这是你要写的文件。
// 公共引擎在 engine/relay.js（角色、贴地、踩拍、表情符号、转场、后期、字幕、交接），共用道具在 engine/props.js。
// 镜头划分、转场、动作轨、表情拍点都在 plan.json 里预先填好了（来自分镜），这里只管：搭场景、摆镜头、摆角色位置。
//
// 现在的场景是占位的灰色地台，只为让流程从头跑通。window.PLACEHOLDER = true 时 handoff_check 会判 FAIL，
// 换成你自己的场景后，把文件底部 R.run({ ... placeholder: true }) 里的 placeholder 删掉。
import * as R from './engine/relay.js';
import { makePuzzle, makeFireworks } from './engine/props.js';
const { THREE, FPS, clamp, lerp, smooth, easeIO, hash } = R;

// ============================ 场景（占位，换成你自己的）============================
// 规则：会站人的地面都用 R.addGround(...) 登记，角色的脚才会贴上去（防穿模）。
// 场景可以是很多组，不同镜头显示不同的组（group.visible），或者放在世界里不同的地方。
let stage, puzzle, fireworks;
async function build() {
  stage = new THREE.Group(); R.scene.add(stage); R.addGround(stage);
  R.box(stage, 60, 0.3, 30, 0xbdb7cc, 0, -0.3, -5);                         // 占位地台
  for (let i = 0; i < 9; i++) R.box(stage, 2.4, 1.2 + hash(i) * 2.5, 2.4, 0xd8d2e6, -12 + i * 3, 0, -9);   // 占位背景块
  puzzle = makePuzzle(); puzzle.set(1);                                // 发光拼图：收到时 1 块，交出去时 2 块
  fireworks = makeFireworks(4);
}

// 占位镜头：角色站成一排，镜头按景别远近慢慢推。每个镜头换成你自己的 case。
const DIST = [['特写', 4.6], ['近景', 5.2], ['中景', 6], ['大远景', 9], ['全景', 7.5]];
function placeholderShot(f, shot) {
  const t = f / FPS, cast = R.plan().cast.filter(n => R.actAt(n, f));
  const d = (DIST.find(([k]) => shot.camera.includes(k)) || ['', 9])[1];
  const k = (f - shot.f0) / Math.max(1, shot.f1 - shot.f0);
  R.look(1.2 * Math.sin(t * 0.9), 1.4 + d * 0.08 + 0.3 * Math.sin(t * 1.3), d * (1.08 - 0.16 * k), 0, 1.0, 0);
  const gap = Math.min(1.5, 7 / cast.length);
  cast.forEach((n, i) => R.play(n, f, (i - (cast.length - 1) / 2) * gap, 0, 0, { flip: i % 2 === 1 }));
  return {};
}

// ============================ 每个镜头 ============================
// f：这一帧的全曲帧号；sf：镜头帧（转场时引擎会分别用旧镜头、新镜头各渲一次，sf 决定是哪个镜头）。
// 角色：R.play(名字, f, x, y, z, 选项) 按动作轨摆（动作、帧序、踩拍都由动作轨决定），你只给位置和朝向。
// 返回值可选：{ veilColor, veilOp, focus, band, hblur, hideCaption }
function setupShot(f, sf) {
  const t = f / FPS, shot = R.shotOf(sf);
  R.setSky(0xcfc8e8); R.keyAt(0, 0, 0); R.hemi.intensity = 1.1;
  fireworks.hideAll(); puzzle.group.visible = false;
  let v = {};
  switch (shot.id) {
    case 'S2-08': {      // ---- 交接 T2 出场（不要改 placeT2）：镜头推到 Gemini 脸上，眼睛对准 (50%, 40%)，圆形收黑 ----
      v = placeholderShot(f, shot);
      R.look(0.8 * Math.sin(f / 20), 1.2, 8, 0, 1.2, 0);   // 镜头要一直在动（交接定位跟着镜头算，不受影响）
      R.placeT2(f);                           // 起始身高可以改：R.placeT2(f, 你的起始身高)
      R.chars.deepseek.root.visible = false;
      break;
    }
    default: v = placeholderShot(f, shot);
  }
  return v;
}

// 画在最上层 2D 画布（R.fxc）上的东西：交接画面已经写好
function overlay(f) {
  R.drawT1In(f);                 // 交接 T1 入场：688–689 纯色 #FFF4E0，奶白方块裂开露出画面
  R.drawT2Out(f);                // 交接 T2 出场：1342 起圆形收黑，1350–1352 全黑
}

R.run({ build, setupShot, overlay, placeholder: true });
