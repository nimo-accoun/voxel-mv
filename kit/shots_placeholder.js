// 你的 MV。这是你要写的文件：搭场景（build）、每个镜头的机位和角色位置（setupShot）、上层特效（overlay）。
// 引擎在 engine/relay.js（角色、贴地、踩拍、表情符号、转场、后期、字幕、页面契约），速查见技能的 references/engine.md。
// 镜头划分、转场、动作轨、表情拍点写在 plan.json（格式见 references/plan-format.md），也可以全写在这里，随你。
//
// 现在是占位的灰色地台，只为让流程从头跑通。window.PLACEHOLDER 为真时体素关 V0 判 FAIL：
// 换成你自己的场景后，把文件底部 R.run({ ... placeholder: true }) 里的 placeholder 删掉。
import * as R from './engine/relay.js';
const { THREE, FPS, clamp, lerp, smooth, easeIO, hash } = R;

let stage;
async function build() {
  stage = new THREE.Group(); R.scene.add(stage); R.addGround(stage);   // 会站人的地面都要 R.addGround 登记
  R.box(stage, 60, 0.3, 30, 0xbdb7cc, 0, -0.3, -5);
  for (let i = 0; i < 9; i++) R.box(stage, 2.4, 1.2 + hash(i) * 2.5, 2.4, 0xd8d2e6, -12 + i * 3, 0, -9);
}

function setupShot(f, sf) {
  const t = f / FPS;
  R.setSky(0xcfc8e8); R.keyAt(0, 0, 0); R.hemi.intensity = 1.1;
  R.look(1.2 * Math.sin(t * 0.4), 1.8, 9, 0, 1.0, 0);
  const cast = R.plan().cast;
  cast.forEach((n, i) => {
    const x = (i - (cast.length - 1) / 2) * 1.6;
    if (!R.play(n, f, x, 0, 0)) R.pose(R.chars[n], 'idle', R.loopIdx(R.chars[n], 'idle', t), x, 0, 0);   // 动作轨里没写就待机
  });
  return { focus: 0.5 };
}

function overlay(f) { }

R.run({ build, setupShot, overlay, placeholder: true });
