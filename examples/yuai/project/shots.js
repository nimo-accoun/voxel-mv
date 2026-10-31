// 《雨爱（DJ版）》MV：一张会下雨的黑胶唱片。桌面微距 → 沟槽雨巷 → 水花舞池 → 黎明彩虹。
// 引擎用法见 references/engine.md；镜头、转场、动作轨写在 plan.json。
import * as R from './engine/relay.js';
const { THREE, FPS, clamp, lerp, smooth, easeIO, easeOut, hash, beatOf, pulse } = R;

const C = new THREE.Color();
const REC_TOP = 0.40, STREET_TOP = 0.20, STAGE_TOP = 0.24;
const NEEDLE = { x: 0.46, z: 0.60 };

let deskSet, needlePivot, needleHead, needleGlow, dropRing;
let cityWin, cityWinData = [], cityNeon, citySigns = [];
let deskLamp;
let streetSet, shopSet, streetSigns = [], streetLamps = [], streetBulbs = [], streetWin, streetWinData = [];
let stageSet, stageBeams = [], speakerGlow = [], mirrorBall, ringIM, crowd = [], stickIM;
let rainbowSet, rainbowIM, rainbowClouds = [];
let umbrella;
let rain, burstA, burstB, burstC, burstD, splash, confetti;
let lampDesk, lampStreet, lampStage, rimStreet, rimShop;

// ---------------------------------------------------------------- 小工具
function litInst(parent, n, o = {}) {
  const im = new THREE.InstancedMesh(R.boxGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: !!o.opacity, opacity: o.opacity ?? 1 }),
    n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  parent.add(im);
  return im;
}
function done(im) {
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
}
function hideInst(im, n) { for (let i = 0; i < n; i++) R.setInst(im, i, 0, -80, 0, 0, 0, 0); done(im); }
function setFov(v) { if (R.camera.fov !== v) { R.camera.fov = v; R.camera.updateProjectionMatrix(); } }
const off = (i, s = 0) => hash(i * 1.71 + s);

// ---------------------------------------------------------------- 桌面 + 唱片
function buildDesk() {
  deskSet = new THREE.Group();
  R.scene.add(deskSet);

  // 木桌（微缩模型的地台）
  for (let i = 0; i < 17; i++) {
    R.rbox(deskSet, 2.0, 0.36, 34, i % 2 ? 0x8f7788 : 0x856d7e, -16 + i * 2.0, -0.36, 0, { r: 0.07, cast: false });
    if (i < 16) R.box(deskSet, 0.035, 0.02, 33.9, 0x6b5566, -15 + i * 2.0, -0.02, 0, { cast: false });
  }

  // 唱机底座
  R.rbox(deskSet, 24.2, 0.22, 24.2, 0x68587a, 0, 0, 0, { r: 0.36, cast: false });
  R.rbox(deskSet, 23.2, 0.05, 23.2, 0x776588, 0, 0.22, 0, { r: 0.22, cast: false });
  R.box(deskSet, 24.0, 0.012, 0.16, 0x4b3f5b, 0, 0.25, 10.6, { cast: false });

  // 黑胶：一圈圈方块，标签是玫瑰色
  const step = 0.55, RMAX = 10.3, tiles = [];
  for (let x = -RMAX; x <= RMAX; x += step) for (let z = -RMAX; z <= RMAX; z += step)
    if (x * x + z * z <= RMAX * RMAX) tiles.push([x, z]);
  const rec = R.instanced(deskSet, tiles.length, 0xffffff, { cast: false });
  tiles.forEach(([x, z], i) => {
    const r = Math.hypot(x, z);
    let c;
    if (r < 0.36) c = 0x3a2f44;
    else if (r < 3.02) c = (Math.floor(r / 0.52) % 2 ? 0xc695a8 : 0xba839a);
    else if (r < 3.34) c = 0xe6cbb4;
    else if (r < 3.56) c = 0xd8a25f;
    else if (r > 10.02) c = 0x413a5a;
    else c = (Math.floor((r - 3.6) / 0.44) % 2 ? 0x56507c : 0x4b4570);
    R.setInst(rec, i, x, 0.33, z, step * 0.97, 0.14, step * 0.97);
    rec.setColorAt(i, C.setHex(c).offsetHSL(0, 0, (off(i) - 0.5) * 0.03));
  });
  done(rec);

  // 标签上的小纹样（金色小方块、奶白圆点、雨滴）
  const dash = R.instanced(deskSet, 36, 0xdcb277, { cast: false });
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2;
    const sx = i % 3 ? 0.14 : 0.22;
    R.setInst(dash, i, Math.cos(a) * 3.16, 0.405, Math.sin(a) * 3.16, sx, 0.02, 0.1, 0, -a, 0);
  }
  done(dash);
  const dots = R.instanced(deskSet, 14, 0xead6c2, { cast: false });
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + 0.11;
    R.setInst(dots, i, Math.cos(a) * 2.42, 0.405, Math.sin(a) * 2.42, 0.13, 0.02, 0.13);
  }
  done(dots);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + 0.4, rr = 1.85;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    R.box(deskSet, 0.1, 0.03, 0.1, 0xf0d7a8, x, 0.405, z, { emissive: 0xf0d7a8, ei: 0.5, cast: false });
    R.box(deskSet, 0.06, 0.03, 0.06, 0xf0d7a8, x + 0.09, 0.405, z + 0.07, { emissive: 0xf0d7a8, ei: 0.5, cast: false });
  }

  // 外圈小城：方块楼 + 一盏盏窗
  const walls = [0x8b7f9c, 0x7f8798, 0x94807e, 0x83799b, 0x8f8497];
  const roofs = [0x5d5468, 0x615770, 0x574e63];
  const litCols = [0xffcf94, 0xffb98c, 0xffe2b4, 0x9fd6ff];
  const winSpots = [];
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + (off(i) - 0.5) * 0.05;
    const rad = 13.0 + off(i + 1.3) * 2.2;
    const w = 1.0 + off(i + 2.7) * 0.9, d = 0.9 + off(i + 3.1) * 0.8;
    const h = 1.0 + off(i + 4.5) * 1.25;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = -a;
    deskSet.add(g);
    R.rbox(g, w, h, d, walls[i % walls.length], 0, 0, 0, { r: 0.07, cast: true });
    R.rbox(g, w + 0.14, 0.13, d + 0.14, roofs[i % roofs.length], 0, h, 0, { r: 0.04, cast: false });
    R.box(g, w * 0.3, 0.1, d * 0.3, roofs[i % roofs.length], w * 0.18, h + 0.13, d * 0.16, { cast: false });
    if (off(i + 7.7) > 0.62) {
      R.box(g, 0.1, 0.42, 0.1, 0x5a5166, -w * 0.25, h + 0.13, -d * 0.2, { cast: false });
      R.box(g, 0.16, 0.08, 0.16, litCols[i % 4], -w * 0.25, h + 0.55, -d * 0.2, { emissive: litCols[i % 4], ei: 1.4, cast: false });
    }
    // 四面窗（只放两列两三层，够看）
    const rows = h > 1.8 ? 3 : 2;
    for (let f = 0; f < rows; f++) for (let k = 0; k < 2; k++) for (const side of [-1, 1]) {
      const lx = (k ? 0.24 : -0.24) * w, lz = side * (d / 2 + 0.02);
      winSpots.push({
        i: winSpots.length,
        x: x + lx * Math.cos(-a) + lz * Math.sin(-a),
        z: z - lx * Math.sin(-a) + lz * Math.cos(-a),
        y: 0.34 + f * 0.52 + off(i + f) * 0.06,
        rot: -a, w: 0.24, h: 0.24,
        ci: (i + f + k + (side > 0 ? 1 : 0)) % 4,
        r: Math.hypot(x, z),
      });
    }
  }
  cityWin = litInst(deskSet, winSpots.length);
  cityWinData = winSpots;
  for (const s of winSpots) {
    R.setInst(cityWin, s.i, s.x, s.y, s.z, s.w, s.h, 0.05, 0, s.rot, 0);
    cityWin.setColorAt(s.i, C.setHex(0x5f5870));
  }
  done(cityWin);

  // 霓虹招牌（只有发光色块）
  const neonCols = [0xff7fb4, 0x77d8ff, 0xffd27a, 0xc79bff];
  const neon = [];
  for (let i = 0; i < 26; i++) {
    const a = (i + 0.5) / 26 * Math.PI * 2;
    const rad = 12.9, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    neon.push({ x, z, a, c: neonCols[i % 4], h: 0.5 + off(i + 4) * 0.5, w: 0.16 + off(i + 6) * 0.14 });
  }
  cityNeon = litInst(deskSet, neon.length);
  neon.forEach((s, i) => {
    R.setInst(cityNeon, i, s.x, 0.55 + off(i) * 0.9, s.z, s.w, s.h, 0.12, 0, -s.a, 0);
    cityNeon.setColorAt(i, C.setHex(s.c));
  });
  done(cityNeon);

  // 城市里的小树、箱子
  const trunk = R.instanced(deskSet, 28, 0x7a5d58, { cast: false });
  const leaf = R.instanced(deskSet, 28, 0x8fb686, { cast: false });
  for (let i = 0; i < 28; i++) {
    const a = (i + 0.35) / 28 * Math.PI * 2, rad = 12.4 + off(i + 2) * 2.6;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad, s = 0.8 + off(i + 5) * 0.5;
    R.setInst(trunk, i, x, 0.12 * s, z, 0.08 * s, 0.24 * s, 0.08 * s);
    R.setInst(leaf, i, x, (0.24 + 0.16) * s, z, 0.34 * s, 0.34 * s, 0.34 * s, 0, off(i) * 3, 0);
    leaf.setColorAt(i, C.setHex(i % 3 ? 0x8fb686 : 0x7fa47a).offsetHSL(0, 0, (off(i) - 0.5) * 0.06));
  }
  done(trunk); done(leaf);
  const crates = R.instanced(deskSet, 30, 0xffffff, { cast: false });
  for (let i = 0; i < 30; i++) {
    const a = (i + 0.7) / 30 * Math.PI * 2, rad = 11.9 + off(i + 8) * 2.4;
    const s = 0.2 + off(i + 3) * 0.16;
    R.setInst(crates, i, Math.cos(a) * rad, s / 2, Math.sin(a) * rad, s, s, s, 0, off(i) * 3, 0);
    crates.setColorAt(i, C.setHex([0x9a8394, 0x8b7590, 0xa08b83][i % 3]));
  }
  done(crates);

  // 唱针（从画外摆进来，落针点亮全城）
  const base = new THREE.Group(); base.position.set(-7.4, 0.26, 4.9); deskSet.add(base);
  R.rbox(base, 1.5, 0.34, 1.5, 0x4a4058, 0, 0, 0, { r: 0.12 });
  R.rbox(base, 0.9, 0.5, 0.9, 0x5a4f6a, 0, 0.34, 0, { r: 0.1 });
  R.box(base, 0.34, 0.22, 0.34, 0x3e374e, 0, 0.84, 0);
  needlePivot = new THREE.Group();
  needlePivot.position.set(-7.4, 1.02, 4.9);
  needlePivot.rotation.y = -0.69;
  deskSet.add(needlePivot);
  drawRoundArm();
  function drawRoundArm() {
    R.box(needlePivot, 0.62, 0.26, 0.5, 0x3e374e, -0.35, 0.02, 0, { cast: false });   // 配重
    R.box(needlePivot, 8.9, 0.13, 0.2, 0xd4cddd, 4.35, -0.03, 0, { cast: true });
    R.box(needlePivot, 1.3, 0.16, 0.3, 0x9a90ad, 8.0, -0.06, 0, { cast: false });
    needleHead = new THREE.Group();
    needleHead.position.set(8.9, -0.18, 0);
    needlePivot.add(needleHead);
    R.box(needleHead, 0.56, 0.24, 0.42, 0x6f6685, 0, -0.04, 0, { cast: false });
    R.box(needleHead, 0.2, 0.12, 0.2, 0x3e374e, -0.09, 0.2, 0, { cast: false });
    needleGlow = R.box(needleHead, 0.17, 0.08, 0.17, 0xffe0a8, 0, -0.11, 0, { emissive: 0xffd38a, ei: 1.4, cast: false });
  }

  // 落针涟漪
  dropRing = R.instanced(deskSet, 96, 0xffe0b0, { emissive: 0x6a4f2a, cast: false });
  dropRing.frustumCulled = false;
  dropRing.material.color.set(0xffe0b0);
  hideInst(dropRing, 96);

  // 桌上的小物：前排（微距前景）
  const mug = new THREE.Group(); mug.position.set(8.7, 0, 9.1); deskSet.add(mug);
  R.rbox(mug, 0.95, 0.9, 0.95, 0xe8d9cd, 0, 0, 0, { r: 0.16 });
  R.box(mug, 0.7, 0.02, 0.7, 0x57414f, 0, 0.86, 0, { cast: false });
  R.box(mug, 0.16, 0.4, 0.28, 0xe8d9cd, 0.55, 0.3, 0);
  R.box(mug, 0.62, 0.06, 0.62, 0xc58b9f, 0, 0.9, 0, { cast: false });

  const cas = new THREE.Group(); cas.position.set(-9.0, 0, 9.6); cas.rotation.y = -0.28; deskSet.add(cas);
  R.rbox(cas, 2.3, 0.3, 1.5, 0x6d5a6e, 0, 0, 0, { r: 0.07 });
  R.box(cas, 1.8, 0.03, 1.05, 0xe8dcc0, 0, 0.29, 0, { cast: false });
  for (const sx of [-0.45, 0.45]) {
    R.box(cas, 0.44, 0.04, 0.44, 0x4b3e52, sx, 0.31, 0, { cast: false });
    R.box(cas, 0.14, 0.05, 0.14, 0xcfc0a0, sx, 0.34, 0, { cast: false });
  }
  R.box(cas, 0.5, 0.05, 0.2, 0xc58b9f, 0.9, 0.31, 0.3, { cast: false });

  const hp = new THREE.Group(); hp.position.set(-11.4, 0, 6.4); hp.rotation.y = 0.6; deskSet.add(hp);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.2;
    R.box(hp, 0.2, 0.2, 0.42, 0x8f8398, Math.sin(a) * 1.05, 1.0 + Math.cos(a) * 0.75, 0);
  }
  R.rbox(hp, 0.6, 0.62, 0.4, 0x7d7189, -1.1, 0, 0, { r: 0.14 });
  R.rbox(hp, 0.6, 0.62, 0.4, 0x7d7189, 1.1, 0, 0, { r: 0.14 });
  R.box(hp, 0.48, 0.06, 0.06, 0x5c5268, 0, 0.12, 0);

  const pens = new THREE.Group(); pens.position.set(6.2, 0, 10.4); deskSet.add(pens);
  for (let i = 0; i < 3; i++) {
    R.box(pens, 2.6, 0.13, 0.13, [0xd9a24e, 0x6f97a0, 0xc58b9f][i], i * 0.22 - 0.4, 0, i * 0.3, { cast: false });
    R.box(pens, 0.3, 0.13, 0.13, 0x4a4058, i * 0.22 + 0.9, 0, i * 0.3, { cast: false });
  }

  const plant = new THREE.Group(); plant.position.set(11.6, 0, 6.0); deskSet.add(plant);
  R.rbox(plant, 1.1, 0.85, 1.1, 0xc08b7a, 0, 0, 0, { r: 0.16 });
  R.box(plant, 1.2, 0.12, 1.2, 0x9d6f60, 0, 0.85, 0, { cast: false });
  for (let i = 0; i < 9; i++) {
    const a = off(i) * Math.PI * 2, rr = 0.12 + off(i + 3) * 0.34;
    R.box(plant, 0.3, 0.45 + off(i + 7) * 0.65, 0.3, i % 2 ? 0x7fa47a : 0x8fb686,
      Math.cos(a) * rr, 0.95 + off(i + 5) * 0.3, Math.sin(a) * rr, { cast: false });
  }

  // 后排：唱片封套、唱片箱、台灯
  const sleeve = new THREE.Group(); sleeve.position.set(-13.2, 0, -3.2); sleeve.rotation.y = 0.22; deskSet.add(sleeve);
  R.rbox(sleeve, 5.6, 5.9, 0.26, 0xe8d9cd, 0, 0, 0, { r: 0.1 });
  R.box(sleeve, 4.9, 4.9, 0.06, 0x3a3350, 0, 0.5, 0.16, { cast: false });
  R.box(sleeve, 3.1, 3.1, 0.07, 0xc58b9f, 0, 1.4, 0.19, { cast: false });
  R.box(sleeve, 1.3, 1.3, 0.09, 0xe8d9cd, 0, 2.3, 0.21, { cast: false });
  R.box(sleeve, 0.5, 0.5, 0.1, 0xd8a25f, 0, 2.7, 0.22, { cast: false });

  const crate2 = new THREE.Group(); crate2.position.set(13.0, 0, -6.6); crate2.rotation.y = -0.2; deskSet.add(crate2);
  R.rbox(crate2, 3.2, 2.2, 2.6, 0x8b7590, 0, 0, 0, { r: 0.12 });
  for (let i = 0; i < 5; i++)
    R.box(crate2, 2.8, 1.9, 0.12, [0xc58b9f, 0x6f97a0, 0xe8d9cd, 0x8b7590, 0xd8a25f][i], 0, 0.12, -0.9 + i * 0.42, { cast: false });

  const lampG = new THREE.Group(); lampG.position.set(-12.6, 0, 8.6); deskSet.add(lampG);
  R.rbox(lampG, 1.4, 0.18, 1.4, 0x4a4058, 0, 0, 0, { r: 0.06 });
  R.box(lampG, 0.14, 3.0, 0.14, 0x4a4058, 0, 0.18, 0, { cast: false });
  R.box(lampG, 1.4, 0.14, 0.14, 0x4a4058, 0.63, 3.0, 0, { cast: false });
  R.rbox(lampG, 1.15, 0.55, 1.15, 0xf2dcb8, 1.25, 2.62, 0, { r: 0.16, emissive: 0xffd9a0, ei: 0.75, cast: false });
  deskLamp = new THREE.PointLight(0xffc188, 16, 26, 2);
  deskLamp.position.set(-11.3, 3.2, 8.4);
  deskSet.add(deskLamp);

  // 桌面灰尘、纸屑
  const dust = R.instanced(deskSet, 60, 0xffffff, { cast: false });
  for (let i = 0; i < 60; i++) {
    const x = (off(i * 1.7) * 2 - 1) * 16, z = (off(i * 2.3 + 4) * 2 - 1) * 16;
    const s = 0.05 + off(i + 9) * 0.05;
    R.setInst(dust, i, x, 0.02, z, s, s * 0.5, s, 0, off(i) * 3, 0);
    dust.setColorAt(i, C.setHex([0xcbbdd8, 0xa89ab8, 0xe8d9c0][i % 3]));
  }
  done(dust);

  R.addGround(deskSet);
}
// ---------------------------------------------------------------- 沟槽雨巷
function buildStreet() {
  streetSet = new THREE.Group();
  R.scene.add(streetSet);

  // 石板路 + 两侧人行道
  const nx = 66, nz = 20, tiles = [];
  for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++)
    tiles.push([-16.5 + ix * 0.5 + 0.25, -3.7 + iz * 0.5 + 0.25]);
  const gim = R.instanced(streetSet, tiles.length, 0xffffff, { cast: false });
  tiles.forEach(([x, z], i) => {
    const walk = z < -2.6 || z > 2.6;
    const base = walk ? [0x9a94a6, 0xa39dae] : [0x847e93, 0x7c768a];
    const top = walk ? 0.28 : 0.20;
    R.setInst(gim, i, x, top - 0.1, z, 0.48, 0.2, 0.48);
    gim.setColorAt(i, C.setHex(base[i % 2]).offsetHSL(0, 0, (off(i) - 0.5) * 0.04));
  });
  done(gim);
  for (const z of [2.62, -2.62]) R.box(streetSet, 33, 0.1, 0.14, 0xb0a9bb, 0, 0.2, z, { cast: false });
  R.addGround(streetSet);

  // 斑马线
  for (let i = 0; i < 6; i++)
    R.box(streetSet, 0.5, 0.016, 3.2, 0xd8d1d8, -3.0 + i * 1.05, 0.2, 0.35, { cast: false });

  // 水洼（会反光的小灯）
  const pud = [], pudTiles = [];
  for (const [px, pz, pw, pd] of [[-9.2, 1.6, 2.6, 1.2], [-3.4, 1.9, 3.2, 1.4], [2.2, 1.7, 2.4, 1.1], [7.6, 1.9, 2.8, 1.3]]) {
    for (let ix = -Math.floor(pw / 0.5); ix <= Math.floor(pw / 0.5); ix++)
      for (let iz = -Math.floor(pd / 0.5); iz <= Math.floor(pd / 0.5); iz++) {
        const x = px + ix * 0.5, z = pz + iz * 0.5;
        if (Math.abs(ix * 0.5) / pw + Math.abs(iz * 0.5) / pd < 0.62) pud.push([x, z]);
      }
  }
  const pim = R.instanced(streetSet, pud.length, 0xffffff, { emissive: 0x0f1a24, opacity: 1, cast: false });
  pud.forEach(([x, z], i) => {
    R.setInst(pim, i, x, 0.2, z, 0.48, 0.025, 0.48);
    pim.setColorAt(i, C.setHex(i % 4 ? 0x4c6678 : 0x5b7484).offsetHSL(0, 0, (off(i) - 0.5) * 0.05));
  });
  done(pim);

  // 远处小楼（第一排）+ 后排剪影
  const walls = [0x8b809c, 0x7d94a0, 0x9c8a80, 0x817aa0, 0x968ca3, 0x8a99a0];
  const rows = [[12, -8.9, 3.2, 3.3, 1.9], [9, -14.8, 4.2, 5.4, 2.4]];
  for (let r = 0; r < 2; r++) {
    const [n, zc, dep, h0, hm] = rows[r];
    for (let i = 0; i < n; i++) {
      const x = -18 + i * (36 / (n - 1)) + (off(i + r * 9) - 0.5) * 0.5;
      const w = 2.5 + off(i + 2 + r) * 0.7;
      const h = h0 + off(i + 4 + r) * hm;
      R.rbox(streetSet, w, h, dep, walls[(i + r) % walls.length], x, 0.2, zc, { r: 0.1 });
      R.rbox(streetSet, w + 0.26, 0.18, dep + 0.26, 0x5f566e, x, 0.2 + h, zc, { r: 0.05, cast: false });
      if (r === 0) {
        R.box(streetSet, w * 0.6, 0.12, dep * 0.7, 0x6e637e, x, 0.2 + h + 0.18, zc, { cast: false });
        if (off(i + 13) > 0.5) {
          R.box(streetSet, 0.14, 1.2, 0.14, 0x635a72, x - w * 0.28, 0.2 + h, zc + dep * 0.2, { cast: false });
          R.box(streetSet, 0.42, 0.24, 0.42, 0x635a72, x - w * 0.28, 0.2 + h + 1.2, zc + dep * 0.2, { cast: false });
        }
      }
    }
  }

  // 第一排的门、店招、雨棚、窗台
  const signCols = [0xff7fb4, 0x77d8ff, 0xffd27a, 0xb9a0ff];
  const awnCols = [0xc58b9f, 0x6f97a0, 0xb9a0d8, 0xd8a25f];
  for (let i = 0; i < 12; i++) {
    const x = -18 + i * (36 / 11) + (off(i + 9) - 0.5) * 0.5;
    const fz = -8.9 + 1.6 + 0.02;
    // 门
    R.box(streetSet, 0.9, 1.7, 0.08, 0x5a4f66, x - 0.55, 0.2, fz, { cast: false });
    R.box(streetSet, 0.08, 0.08, 0.1, 0xd8b06a, x - 0.2, 1.1, fz + 0.05, { cast: false });
    // 暖窗（有的亮有的暗），深色窗框压在墙里
    const lit = off(i * 7.3) > 0.22;
    const wcol = lit ? [0xffcb90, 0xffb579, 0xffe0ae][i % 3] : 0x6a6078;
    for (let k = 0; k < 2; k++) for (let f = 0; f < 2; f++) {
      const wx = x + 0.45 + k * 0.62, wy = 0.92 + f * 0.82;
      R.box(streetSet, 0.5, 0.58, 0.05, 0x4e4559, wx, wy - 0.04, fz - 0.005, { cast: false });
      R.box(streetSet, 0.4, 0.46, 0.04, wcol, wx, wy, fz + 0.02,
        { emissive: wcol, ei: lit ? 1.0 : 0.05, cast: false });
    }
    // 雨棚
    for (let k = 0; k < 5; k++)
      R.box(streetSet, 0.66, 0.08, 1.15, k % 2 ? 0xe8d9cf : awnCols[i % 4], x - 0.8 + k * 0.7, 2.12, fz + 0.55, { cast: false });
    // 店招：一块发光色块，没有字
    const sc = signCols[i % 4];
    streetSigns.push(R.box(streetSet, 0.34, 1.3, 0.16, sc, x + 1.55, 1.55, fz + 0.12,
      { emissive: sc, ei: 1.2, cast: false }));
    // 窗台小盆栽 + 空调
    R.box(streetSet, 0.55, 0.14, 0.3, 0x5f5468, x - 0.9, 1.5, fz + 0.1, { cast: false });
    R.box(streetSet, 0.26, 0.26, 0.26, 0x8fb686, x - 0.9, 1.64, fz + 0.1, { cast: false });
    if (off(i + 15) > 0.45) R.box(streetSet, 0.5, 0.55, 0.4, 0x6a6078, x + 0.2, 2.9, fz + 0.1, { cast: false });
  }
  // 后一排亮窗
  streetWin = litInst(streetSet, 150);
  let wi = 0;
  for (let r = 0; r < 2; r++) {
    const [n, zc, dep, h0, hm] = rows[r];
    for (let i = 0; i < n && wi < 150; i++) {
      const x = -18 + i * (36 / (n - 1)) + (off(i + r * 9) - 0.5) * 0.5;
      const h = h0 + off(i + 4 + r) * hm;
      const lits = off(i * 3.1 + r) > 0.35;
      for (let k = 0; k < 3; k++) for (let f = 0; f < 2; f++) {
        if (wi >= 150) break;
        const col = lits ? [0xffc286, 0xffd9a4, 0xb8dcff][(i + k) % 3] : 0x635a72;
        R.setInst(streetWin, wi, x - 0.7 + k * 0.7, 1.2 + f * (h * 0.4), zc + dep / 2 + 0.03, 0.34, 0.4, 0.05);
        streetWin.setColorAt(wi, C.setHex(col).offsetHSL(0, 0, (off(wi) - 0.5) * 0.05));
        streetWinData.push({ i: wi, c: new THREE.Color(col), ph: off(wi + 3) * 6.28 });
        wi++;
      }
    }
  }
  for (let i = wi; i < 150; i++) R.setInst(streetWin, i, 0, -80, 0, 0, 0, 0);
  done(streetWin);

  // 路灯
  const lampX = [-10.5, -4.5, 1.5, 7.5];
  for (const x of lampX) {
    const g = new THREE.Group(); g.position.set(x, 0.2, -2.15); streetSet.add(g);
    R.box(g, 0.16, 3.1, 0.16, 0x4a4258, 0, 0, 0, { cast: true });
    R.box(g, 0.9, 0.12, 0.14, 0x4a4258, 0.38, 3.0, 0, { cast: false });
    R.box(g, 0.36, 0.14, 0.36, 0x4a4258, 0.78, 2.9, 0, { cast: false });
    streetLamps.push(R.box(g, 0.44, 0.3, 0.44, 0xffe2ae, 0.78, 2.58, 0, { emissive: 0xffd28a, ei: 1.6, cast: false }));
    R.box(g, 0.1, 0.3, 0.1, 0x4a4258, 0.78, 2.88, 0, { cast: false });
  }
  lampStreet = new THREE.PointLight(0xffc98f, 12, 20, 2);
  lampStreet.position.set(-1.5, 2.6, 0.2);
  streetSet.add(lampStreet);
  rimStreet = new THREE.PointLight(0xa8dcff, 0, 9, 2);
  rimStreet.position.set(0, 1.9, -1.4);
  streetSet.add(rimStreet);

  // 串灯：两盏路灯之间垂下来
  const wire = R.instanced(streetSet, 80, 0x554c62, { cast: false });
  for (let i = 0; i < 80; i++) {
    const p = i / 79, x = -14 + p * 28, z = -2.0;
    const y = 3.55 - Math.sin(p * Math.PI) * 0.45;
    R.setInst(wire, i, x, y, z, 0.1, 0.1, 0.1);
  }
  done(wire);
  streetBulbs = litInst(streetSet, 30);
  for (let i = 0; i < 30; i++) {
    const p = (i + 0.5) / 30, x = -14 + p * 28, y = 3.5 - Math.sin(p * Math.PI) * 0.45, z = -2.0;
    R.setInst(streetBulbs, i, x, y - 0.1, z, 0.15, 0.15, 0.15);
    streetBulbs.setColorAt(i, C.setHex(i % 5 ? 0xffd9a0 : 0xffb3cf));
  }
  done(streetBulbs);

  // 长椅、单车、垃圾桶、邮筒（前景层，都在人行道上）
  const bench = new THREE.Group(); bench.position.set(-6.4, 0.28, 5.0); bench.rotation.y = 0.08; streetSet.add(bench);
  R.box(bench, 2.2, 0.12, 0.6, 0x9c7656, 0, 0.42, 0);
  R.box(bench, 2.2, 0.12, 0.1, 0x9c7656, 0, 0.8, -0.28);
  for (const sx of [-0.9, 0.9]) {
    R.box(bench, 0.1, 0.42, 0.1, 0x554c62, sx, 0, -0.22);
    R.box(bench, 0.1, 0.42, 0.1, 0x554c62, sx, 0, 0.22);
    R.box(bench, 0.08, 0.42, 0.08, 0x554c62, sx, 0.42, -0.24);
  }
  const bike = new THREE.Group(); bike.position.set(2.6, 0.28, 5.0); bike.rotation.y = 0.25; streetSet.add(bike);
  for (const wx of [-0.7, 0.7]) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      R.box(bike, 0.09, 0.09, 0.09, 0xcfc7d4, wx + Math.cos(a) * 0.38, 0.38 + Math.sin(a) * 0.38, 0, { cast: false });
    }
    R.box(bike, 0.22, 0.22, 0.22, 0x9a8fa8, wx, 0, 0);
  }
  R.box(bike, 1.35, 0.08, 0.08, 0x8fb0be, 0, 0.58, 0);
  R.box(bike, 0.08, 0.45, 0.08, 0x8fb0be, -0.7, 0.38, 0);
  R.box(bike, 0.08, 0.4, 0.08, 0x8fb0be, 0.45, 0.55, 0);
  R.box(bike, 0.42, 0.07, 0.2, 0x554c62, 0.42, 0.9, 0, { cast: false });
  const bin = new THREE.Group(); bin.position.set(9.0, 0.28, 4.7); streetSet.add(bin);
  R.rbox(bin, 0.68, 0.95, 0.68, 0x6a8b88, 0, 0, 0, { r: 0.1 });
  R.box(bin, 0.78, 0.1, 0.78, 0x54706f, 0, 0.95, 0, { cast: false });
  const post = new THREE.Group(); post.position.set(-11.6, 0.28, 4.4); streetSet.add(post);
  R.rbox(post, 0.7, 1.25, 0.6, 0xc58b9f, 0, 0, 0, { r: 0.1 });
  R.box(post, 0.06, 0.2, 0.06, 0x554c62, 0.18, 1.25, 0, { cast: false });

  // 人行道内侧的小树 + 花箱
  for (const [tx, tz, ts] of [[-7.8, -2.5, 1.0], [-1.4, -2.55, 0.85], [5.2, -2.45, 0.95], [11.0, -2.55, 0.8]]) {
    R.rbox(streetSet, 0.9 * ts, 0.34 * ts, 0.62 * ts, 0x7f6b74, tx, 0.28, tz, { r: 0.06, cast: false });
    R.box(streetSet, 0.14 * ts, 1.5 * ts, 0.14 * ts, 0x6b5566, tx, 0.28, tz, { cast: false });
    for (let k = 0; k < 3; k++)
      R.rbox(streetSet, 0.66 * ts, 0.5 * ts, 0.6 * ts, k % 2 ? 0x7f9e86 : 0x8fae92,
        tx + (off(tx + k) - 0.5) * 0.5, 1.62 * ts + k * 0.26, tz + (off(tx + k + 5) - 0.5) * 0.3,
        { r: 0.12, cast: false });
  }
  // 墙面壁灯、落水管、悬挂小招牌
  for (const wx of [-13.4, -6.8, 0.4, 7.2, 13.8]) {
    R.box(streetSet, 0.12, 0.12, 0.3, 0x4a4258, wx, 2.78, -7.1, { cast: false });
    R.box(streetSet, 0.26, 0.3, 0.26, 0xffe2ae, wx, 2.5, -7.0, { emissive: 0xffc07a, ei: 1.4, cast: false });
  }
  for (const px of [-15.2, -9.2, 3.2, 12.4]) {
    R.box(streetSet, 0.1, 3.0, 0.1, 0x5a5066, px, 0.2, -7.2, { cast: false });
    for (let k = 0; k < 3; k++)
      R.box(streetSet, 0.2, 0.06, 0.16, 0x5a5066, px, 0.6 + k * 0.9, -7.14, { cast: false });
  }
  for (const [sx, sy, scol] of [[-8.6, 2.7, 0x8fd0c0], [4.4, 2.6, 0xffa8c8], [10.2, 2.75, 0xffd68a]]) {
    R.box(streetSet, 0.05, 0.35, 0.05, 0x4a4258, sx - 0.22, sy, -7.16, { cast: false });
    R.box(streetSet, 0.05, 0.35, 0.05, 0x4a4258, sx + 0.22, sy, -7.16, { cast: false });
    R.box(streetSet, 0.55, 0.44, 0.08, scol, sx, sy - 0.55, -7.1, { emissive: scol, ei: 0.9, cast: false });
  }

  // 前排水洼里的反光小灯（跟拍时的细碎亮点）
  const glint = litInst(streetSet, 40);
  for (let i = 0; i < 40; i++) {
    const p = i / 40;
    R.setInst(glint, i, -9.2 + p * 17.4, 0.225, 1.4 + Math.sin(i * 2.1) * 0.7, 0.09, 0.02, 0.32);
    glint.setColorAt(i, C.setHex(i % 3 ? 0xffd0a0 : 0xa8e0ff));
  }
  done(glint);
}

// ---------------------------------------------------------------- 雨棚小店（S04）
function buildShop() {
  shopSet = new THREE.Group();
  shopSet.visible = false;
  R.scene.add(shopSet);

  // 墙（砖块感）+ 门 + 暖窗
  const brickCols = [0x8f8499, 0x8b8095, 0x93889d, 0x887d94];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 8; j++) {
    const bw = 5.9 / 8;
    const bx = 0.2 - 5.9 / 2 + bw * (j + 0.5) + (i % 2 ? bw * 0.06 : -bw * 0.06);
    R.rbox(shopSet, bw * 0.985, 0.43, 0.24, brickCols[(i * 3 + j) % 4], bx, 0.2 + i * 0.46, -1.28, { r: 0.04, cast: false });
  }
  R.rbox(shopSet, 6.4, 0.22, 1.1, 0x5f566e, 0.2, 3.42, -1.2, { r: 0.06, cast: false });
  R.box(shopSet, 1.05, 2.0, 0.1, 0x5a4f66, -1.55, 0.2, -0.98, { cast: false });
  R.box(shopSet, 0.1, 0.1, 0.12, 0xd8b06a, -1.12, 1.05, -0.93, { cast: false });
  R.box(shopSet, 2.0, 1.0, 0.08, 0xffcf94, 1.0, 1.15, -0.98, { emissive: 0xffb877, ei: 1.05, cast: false });
  R.box(shopSet, 2.16, 0.09, 0.14, 0x5f566e, 1.0, 2.16, -0.95, { cast: false });
  R.box(shopSet, 2.3, 0.12, 0.2, 0x5f566e, 1.0, 1.04, -0.95, { cast: false });
  R.box(shopSet, 0.1, 1.06, 0.14, 0x5f566e, -0.02, 1.12, -0.95, { cast: false });
  R.box(shopSet, 0.1, 1.06, 0.14, 0x5f566e, 2.02, 1.12, -0.95, { cast: false });
  for (const mx of [0.67, 1.33]) R.box(shopSet, 0.07, 1.0, 0.12, 0x5f566e, mx, 1.15, -0.94, { cast: false });
  R.box(shopSet, 0.5, 0.16, 0.34, 0x5f566e, 2.35, 0.85, -0.96, { cast: false });
  R.box(shopSet, 0.36, 0.3, 0.3, 0x8fb686, 2.35, 1.0, -0.96, { cast: false });

  // 雨棚（玫瑰条纹，向外倾斜）
  for (let k = 0; k < 7; k++)
    R.box(shopSet, 0.92, 0.1, 2.55, k % 2 ? 0xe8d9cf : 0xc58b9f,
      -2.55 + 0.92 * k + 0.46, 2.46 - k * 0.012, 0.16, { cast: false });
  R.box(shopSet, 6.5, 0.1, 0.12, 0x5f566e, 0.2, 2.46, -1.06, { cast: false });
  // 雨棚底面（连续布面 + 条纹）
  R.box(shopSet, 6.5, 0.05, 2.45, 0xeadbd3, 0.2, 2.395, 0.16, { cast: false });
  for (let k = 0; k < 7; k += 2)
    R.box(shopSet, 0.92, 0.02, 2.45, 0xc58b9f, -2.55 + 0.92 * k + 0.46, 2.365, 0.16, { cast: false });
  // 雨棚下的小灯泡
  for (let i = 0; i < 5; i++)
    R.box(shopSet, 0.13, 0.16, 0.13, 0xffe2ae, -2.1 + i * 1.0, 2.26, 1.1,
      { emissive: 0xffcb8a, ei: 1.6, cast: false });

  // 招牌（发光色块）与吊牌
  const sc = 0xff9ec4;
  R.box(shopSet, 1.1, 1.0, 0.16, sc, -3.3, 1.75, -0.55, { emissive: sc, ei: 1.2, cast: false });
  R.box(shopSet, 0.7, 0.9, 0.12, 0x77d8ff, 2.9, 1.9, -0.86, { emissive: 0x77d8ff, ei: 1.0, cast: false });

  // 门口的木箱、花盆、收起来的伞
  R.rbox(shopSet, 0.85, 0.85, 0.85, 0x9c7656, -2.75, 0.2, 0.3, { r: 0.08 });
  R.rbox(shopSet, 0.6, 0.6, 0.6, 0xb08a66, -2.7, 1.05, 0.3, { r: 0.08 });
  R.rbox(shopSet, 0.9, 0.7, 0.7, 0xc08b7a, 2.95, 0.2, 0.9, { r: 0.12 });
  for (let i = 0; i < 4; i++) R.box(shopSet, 0.24, 0.3, 0.24, 0x8fb686, 2.75 + (i % 2) * 0.35, 0.9, 0.75 + (i > 1 ? 0.3 : 0), { cast: false });
  R.box(shopSet, 0.08, 1.5, 0.08, 0x4a4058, -3.15, 0.25, 1.1, { cast: false });
  R.box(shopSet, 0.2, 1.2, 0.2, 0x4a4058, -3.15, 0.3, 1.1, { cast: false });
  // 木箱上的小猫
  R.box(shopSet, 0.3, 0.22, 0.18, 0x4a4058, -2.62, 1.72, 0.32, { cast: false });
  R.box(shopSet, 0.2, 0.17, 0.17, 0x51465f, -2.57, 1.94, 0.32, { cast: false });
  R.box(shopSet, 0.07, 0.09, 0.05, 0x51465f, -2.63, 2.11, 0.32, { cast: false });
  R.box(shopSet, 0.07, 0.09, 0.05, 0x51465f, -2.51, 2.11, 0.32, { cast: false });
  R.box(shopSet, 0.05, 0.05, 0.18, 0x4a4058, -2.45, 1.72, 0.42, { cast: false });

  // 门口地垫、菜单板、墙灯、橱窗里的小点心
  R.box(shopSet, 0.9, 0.025, 0.5, 0x6b5566, -1.55, 0.2, -0.55, { cast: false });
  const menu = R.box(shopSet, 0.56, 0.78, 0.06, 0x4a4058, -2.25, 0.24, -0.62, { cast: false });
  menu.rotation.x = -0.16;
  R.box(shopSet, 0.44, 0.58, 0.02, 0xf2ddc8, -2.25, 0.33, -0.58, { cast: false });
  R.box(shopSet, 0.12, 0.12, 0.3, 0x4a4258, -2.95, 2.78, -1.05, { cast: false });
  R.box(shopSet, 0.2, 0.26, 0.2, 0xffe2ae, -2.95, 2.5, -0.95, { emissive: 0xffc07a, ei: 1.6, cast: false });
  for (const [dx, dc] of [[0.55, 0xf0bd8a], [0.95, 0xe8a9a2], [1.35, 0xf2d09e]]) {
    R.box(shopSet, 0.22, 0.16, 0.12, dc, dx, 1.06, -0.88, { emissive: dc, ei: 0.25, cast: false });
    R.box(shopSet, 0.26, 0.05, 0.16, 0xd8c4b0, dx, 1.0, -0.88, { cast: false });
  }
  // 雨棚前沿的波浪挂边 + 垂吊小灯
  for (let k = 0; k < 7; k++)
    R.box(shopSet, 0.86, 0.2, 0.12, k % 2 ? 0xe8d9cf : 0xc58b9f, -2.55 + 0.92 * k + 0.46, 2.34, 1.42, { cast: false });
  for (let k = 0; k < 6; k++)
    R.box(shopSet, 0.035, 0.16, 0.035, 0x5f566e, -2.3 + k * 1.0, 2.33, 1.38, { cast: false });
  // 吊在雨棚下的小招牌
  R.box(shopSet, 0.04, 0.3, 0.04, 0x4a4258, 2.42, 2.18, 0.9, { cast: false });
  R.box(shopSet, 0.44, 0.5, 0.07, 0xff9ec4, 2.42, 1.64, 0.9, { emissive: 0xff9ec4, ei: 1.0, cast: false });
  for (const lx of [-2.15, 2.25]) {
    R.box(shopSet, 0.035, 0.28, 0.035, 0x5f566e, lx, 2.2, 0.7, { cast: false });
    R.box(shopSet, 0.18, 0.22, 0.18, 0xffe2ae, lx, 1.98, 0.7, { emissive: 0xffcb8a, ei: 1.5, cast: false });
  }

  const shopLamp = new THREE.PointLight(0xffbe86, 10, 14, 2);
  shopLamp.position.set(0.2, 2.2, 0.9);
  shopSet.add(shopLamp);
  rimShop = new THREE.PointLight(0x9fd4ff, 5.5, 8, 2);
  rimShop.position.set(0.35, 1.9, -0.25);
  shopSet.add(rimShop);
}
// ---------------------------------------------------------------- 水花舞池
function buildStage() {
  stageSet = new THREE.Group();
  R.scene.add(stageSet);

  // 粉色/金色格子的圆台
  const step = 0.5, RM = 5.4, tiles = [];
  for (let x = -RM; x <= RM; x += step) for (let z = -RM; z <= RM; z += step)
    if (x * x + z * z <= RM * RM) tiles.push([x, z, Math.hypot(x, z)]);
  const plat = R.instanced(stageSet, tiles.length, 0xffffff, { cast: false });
  tiles.forEach(([x, z, r], i) => {
    const ring = Math.floor(r / 0.72) % 2;
    R.setInst(plat, i, x, 0.12, z, step * 0.96, 0.24, step * 0.96);
    plat.setColorAt(i, C.setHex(ring ? 0xdc93b0 : 0xe8c39c).offsetHSL(0, 0, (off(i) - 0.5) * 0.03));
  });
  done(plat);
  R.addGround(stageSet);

  // 台下的水面
  const wt = [], WS = 0.75;
  for (let x = -17; x <= 17; x += WS) for (let z = -14; z <= 12; z += WS) {
    const r = Math.hypot(x, z);
    if (r > RM + 0.1 && r < 17.5) wt.push([x, z]);
  }
  const water = R.instanced(stageSet, wt.length, 0xffffff, { emissive: 0x2a1e44, cast: false });
  wt.forEach(([x, z], i) => {
    R.setInst(water, i, x, 0.08, z, WS * 0.95, 0.16, WS * 0.95);
    const r = Math.hypot(x, z);
    water.setColorAt(i, C.setHex(Math.floor(r / 1.5) % 2 ? 0x5c4478 : 0x503a6a).offsetHSL(0, 0, (off(i) - 0.5) * 0.04));
  });
  done(water);

  // 水面的涟漪（每拍往外扩一圈）
  ringIM = litInst(stageSet, 96);
  for (let i = 0; i < 96; i++) ringIM.setColorAt(i, C.setHex(i % 3 ? 0xffc9e6 : 0xffe3b0));
  done(ringIM);
  hideInst(ringIM, 96);

  // 场馆后墙 + 背后的巨型唱片
  R.box(stageSet, 34, 9.2, 0.5, 0x4d3d69, 0, 0.2, -16.9, { cast: false });
  R.box(stageSet, 34.4, 0.28, 0.7, 0x3b2e50, 0, 9.35, -16.8, { cast: false });
  for (let i = -8; i <= 8; i += 2)
    R.box(stageSet, 0.4, 8.9, 0.6, 0x5c4a7a, i * 1.95, 0.2, -16.75, { cast: false });
  const wallNeon = [0xff6fb4, 0xffc857];
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 23; i++)
      R.box(stageSet, 0.34, 0.09, 0.12, wallNeon[row], -15.4 + i * 1.4, row ? 6.35 : 0.95, -16.55,
        { emissive: wallNeon[row], ei: 1.5, cast: false });
  const disc = new THREE.Group();
  disc.position.set(0, 3.5, -16.2);
  stageSet.add(disc);
  const dt = [], DS = 0.5, DR = 3.0;
  for (let x = -DR; x <= DR; x += DS) for (let y = -DR; y <= DR; y += DS)
    if (x * x + y * y <= DR * DR) dt.push([x, y]);
  const discIM = R.instanced(disc, dt.length, 0xffffff, { emissive: 0x2c2246, cast: false });
  dt.forEach(([x, y], i) => {
    const r = Math.hypot(x, y);
    let c;
    if (r < 0.4) c = 0x3a2f44;
    else if (r < 2.0) c = (Math.floor(r / 0.5) % 2 ? 0xd0a3b3 : 0xc497a8);
    else if (r < 2.3) c = 0xe0bd8c;
    else c = (Math.floor(r / 0.42) % 2 ? 0x7a6a9e : 0x6f608f);
    R.setInst(discIM, i, x, y, 0, DS * 0.96, DS * 0.96, 0.18);
    discIM.setColorAt(i, C.setHex(c));
  });
  done(discIM);
  stageSet.userData.disc = disc;

  // 音箱
  for (const sx of [-10.4, 10.4]) {
    const g = new THREE.Group(); g.position.set(sx, 0.16, -6.5); stageSet.add(g);
    for (let i = 0; i < 3; i++) {
      R.rbox(g, 1.8, 0.95, 1.5, 0x5a4472, 0, i * 0.98, 0, { r: 0.12 });
      R.box(g, 1.0, 0.8, 0.08, 0xffb45e, 0, 0.1 + i * 0.98, 0.76, { emissive: 0xffa64d, ei: 1.1, cast: false });
      speakerGlow.push(R.box(g, 0.42, 0.42, 0.1, 0xfff0c8, 0, 0.3 + i * 0.98, 0.8, { emissive: 0xffe2a8, ei: 1.6, cast: false }));
    }
  }

  // 台沿小地灯
  const rimIM = litInst(stageSet, 30);
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2;
    R.setInst(rimIM, i, Math.cos(a) * 5.15, 0.3, Math.sin(a) * 5.15, 0.24, 0.16, 0.24);
    rimIM.setColorAt(i, C.setHex(i % 3 ? 0xffd9a0 : 0xff9ec8));
  }
  done(rimIM);
  // 地上一圈线缆
  const cableIM = R.instanced(stageSet, 64, 0x2f2440, { cast: false });
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2;
    R.setInst(cableIM, i, Math.cos(a) * (5.95 + (off(i) - 0.5) * 0.4), 0.19, Math.sin(a) * (5.95 + (off(i + 3) - 0.5) * 0.4),
      0.09, 0.05, 0.5, 0, -a, 0);
  }
  done(cableIM);

  // 光柱
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * 0.9 + i / 7 * Math.PI * 0.8;
    const x = Math.cos(a) * 10.2, z = Math.sin(a) * 10.2;
    const col = [0xff5fa2, 0xffc857, 0xb98cff][i % 3];
    const g = new THREE.Group(); g.position.set(x, 0.2, z); stageSet.add(g);
    const b = R.box(g, 0.55, 14, 0.55, col, 0, 0, 0, { cast: false });
    b.material = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    g.rotation.z = (off(i) - 0.5) * 0.26;
    g.rotation.x = (off(i + 3) - 0.5) * 0.2;
    stageBeams.push(b);
  }

  // 镜面球
  mirrorBall = new THREE.Group(); mirrorBall.position.set(0, 3.3, -8.5); stageSet.add(mirrorBall);
  R.box(mirrorBall, 0.12, 2.2, 0.12, 0x4a4058, 0, 0.62, 0, { cast: false });
  for (let i = 0; i < 44; i++) {
    const g = Math.acos(1 - 2 * ((i + 0.5) / 44)), ph = i * 2.39996, rr = 0.66;
    R.box(mirrorBall, 0.15, 0.15, 0.15, 0xffe8b0,
      Math.sin(g) * Math.cos(ph) * rr, Math.cos(g) * rr, Math.sin(g) * Math.sin(ph) * rr,
      { emissive: 0xffd98a, ei: 1.2, cast: false });
  }

  // 围观的人（方块剪影）+ 荧光棒
  crowd = [];
  const N_CROWD = 150;
  const cb = R.instanced(stageSet, N_CROWD, 0xffffff, { cast: false });
  const ch = R.instanced(stageSet, N_CROWD, 0xffffff, { cast: false });
  for (let i = 0; i < N_CROWD; i++) {
    const a = Math.PI * (1.0 + 0.94 * off(i)), rr = 7.2 + off(i + 5) * 2.4;
    const s = 0.78 + off(i + 2) * 0.28;
    crowd.push({ a, rr, s, ph: off(i + 8) * 6.28 });
    R.setInst(cb, i, Math.cos(a) * rr, 0.16, Math.sin(a) * rr, 0.34 * s, 0.9 * s, 0.3 * s, 0, -a, 0);
    R.setInst(ch, i, Math.cos(a) * rr, 0.16 + 0.9 * s + 0.14 * s, Math.sin(a) * rr, 0.32 * s, 0.32 * s, 0.32 * s, 0, -a, 0);
    cb.setColorAt(i, C.setHex([0x6d588e, 0x7d67a0, 0x5f4b80, 0x8a72a8][i % 4]).offsetHSL(0, 0, (off(i) - 0.5) * 0.05));
    ch.setColorAt(i, C.setHex(0xcaa5b4));
  }
  done(cb); done(ch);
  stageSet.userData.crowdBody = cb;
  stageSet.userData.crowdHead = ch;

  stickIM = litInst(stageSet, 110);
  for (let i = 0; i < 110; i++) {
    const c = crowd[Math.floor(off(i + 11) * N_CROWD)];
    const a = c.a + (off(i) - 0.5) * 0.1;
    R.setInst(stickIM, i, Math.cos(a) * c.rr, 1.0 * c.s, Math.sin(a) * c.rr, 0.07, 0.5, 0.07, 0, -a, 0);
    stickIM.setColorAt(i, C.setHex(i % 3 ? 0xff9ec8 : 0xffe2a0));
  }
  done(stickIM);

  const armIM = litInst(stageSet, 110);
  for (let i = 0; i < 110; i++) {
    const c = crowd[Math.floor(off(i + 11) * N_CROWD)];
    const a = c.a + (off(i) - 0.5) * 0.1;
    const side = i % 2 ? 1 : -1;
    R.setInst(armIM, i,
      Math.cos(a) * c.rr + Math.cos(a + Math.PI / 2) * 0.14 * side, 0.72 * c.s,
      Math.sin(a) * c.rr + Math.sin(a + Math.PI / 2) * 0.14 * side,
      0.09, 0.55 * c.s, 0.09, 0, -a, 0.16 * side);
    armIM.setColorAt(i, C.setHex(0xcaa5b4));
  }
  done(armIM);

  // 水花、彩屑
  splash = litInst(stageSet, 170);
  confetti = litInst(stageSet, 130);
  hideInst(splash, 170); hideInst(confetti, 130);

  lampStage = new THREE.PointLight(0xff9ecb, 20, 26, 2);
  lampStage.position.set(0, 3.6, 1.6);
  stageSet.add(lampStage);
  const lampStage2 = new THREE.PointLight(0xffc27a, 9, 18, 2);
  lampStage2.position.set(0, 1.2, -2.2);
  stageSet.add(lampStage2);
  const fillStage = new THREE.DirectionalLight(0xd8c4f0, 0.55);
  fillStage.position.set(3, 7, 12);
  fillStage.target.position.set(0, 2, -16);
  stageSet.add(fillStage, fillStage.target);
}

// ---------------------------------------------------------------- 伞、彩虹
function buildUmbrella() {
  umbrella = new THREE.Group();
  umbrella.visible = false;
  R.scene.add(umbrella);
  R.box(umbrella, 0.07, 2.4, 0.07, 0x4a4058, 0.55, 0.5, 0, { cast: false });
  R.box(umbrella, 0.07, 0.07, 0.34, 0x4a4058, 0.55, 0.5, 0.14, { cast: false });
  R.box(umbrella, 0.07, 0.2, 0.07, 0x4a4058, 0.55, 0.32, 0.3, { cast: false });
  const cols = [0xf2e0d6, 0xdda7b8];
  const tiers = [[1.55, 26, 2.42], [1.28, 22, 2.55], [1.01, 18, 2.67], [0.74, 13, 2.77], [0.47, 9, 2.85]];
  for (let t = 0; t < tiers.length; t++) {
    const [rr, n, y] = tiers[t];
    const w = Math.PI * 2 * rr / n * 1.2;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + t * 0.11;
      const m = R.box(umbrella, w, 0.11, 0.36, cols[(i + t) % 2],
        0.55 + Math.cos(a) * rr, y, Math.sin(a) * rr, { cast: false });
      m.rotation.y = -(a + Math.PI / 2);
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + 0.05;
    const m = R.box(umbrella, 0.05, 0.05, 1.5, 0x8c7b8e, 0.55 + Math.cos(a) * 0.78, 2.39, Math.sin(a) * 0.78, { cast: false });
    m.rotation.y = Math.PI / 2 - a;
  }
  R.box(umbrella, 0.3, 0.14, 0.3, 0xdca2b4, 0.55, 2.9, 0, { cast: false });
  R.box(umbrella, 0.12, 0.18, 0.12, 0xd8a25f, 0.55, 3.02, 0, { cast: false });
}

function buildRainbow() {
  rainbowIM = litInst(rainbowSetParent(), 240);
  rainbowSet.userData = rainbowIM;
  const bands = [0xff8f8f, 0xffb46b, 0xffd97a, 0x9fd48a, 0x86c8e8, 0xb99bff];
  const data = [];
  for (let b = 0; b < 6; b++) {
    const rad = 4.15 - b * 0.2;
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * (0.07 + 0.86 * (i + 0.5) / 40);
      const idx = b * 40 + i;
      data.push({ i: idx, x: Math.cos(a) * rad, y: 0.4 + Math.sin(a) * rad, delay: 0.02 + i / 40 * 0.5 });
      rainbowIM.setColorAt(idx, C.setHex(bands[b]));
      R.setInst(rainbowIM, idx, 0, -80, 0, 0, 0, 0);
    }
  }
  done(rainbowIM);
  rainbowSet.userDataList = data;
  // 两端的云
  for (const sx of [-1, 1]) {
    const cx = sx * 4.0;
    for (let i = 0; i < 7; i++) {
      const c = R.rbox(rainbowSet, 0.78, 0.62, 0.72, i % 2 ? 0xf4ebf2 : 0xe4d8e8,
        cx + (off(i) - 0.5) * 1.35, 0.4 + off(i + 2) * 0.28, (off(i + 5) - 0.5) * 0.9, { r: 0.14, cast: false });
      rainbowClouds.push(c);
      c.material.emissive.set(0x6b5a74);
      c.material.emissiveIntensity = 0.5;
    }
  }
}

function rainbowSetParent() {
  rainbowSet = new THREE.Group();
  rainbowSet.position.set(0, 0, -3.4);
  rainbowSet.visible = false;
  R.scene.add(rainbowSet);
  return rainbowSet;
}
// ---------------------------------------------------------------- 会动的小东西
const LIT_CITY = [0xffcf94, 0xffb98c, 0xffe2b4, 0x9fd6ff].map(h => new THREE.Color(h));
const DARK_CITY = new THREE.Color(0x5f5870);
const DAWN_CITY = new THREE.Color(0xffd9b0);

function cityLight(radius, level = 1) {
  for (const s of cityWinData) {
    const d = Math.hypot(s.x - NEEDLE.x, s.z - NEEDLE.z);
    const on = smooth(d - 1.6, d + 0.3, radius) * level;
    C.copy(DARK_CITY).lerp(LIT_CITY[s.ci], on);
    cityWin.setColorAt(s.i, C);
  }
  cityWin.instanceColor.needsUpdate = true;
}

function streetGlow(t, flash) {
  for (const s of streetWinData) {
    const k = 0.82 + 0.18 * Math.sin(t * 2.3 + s.ph) + flash * 0.18;
    C.copy(s.c).multiplyScalar(clamp(k, 0.4, 1.3));
    streetWin.setColorAt(s.i, C);
  }
  streetWin.instanceColor.needsUpdate = true;
  for (let i = 0; i < streetBulbs.count; i++) {
    const k = 0.75 + 0.25 * Math.sin(t * 3.1 + i * 0.9);
    C.setHex(i % 5 ? 0xffd9a0 : 0xffb3cf).multiplyScalar(k);
    streetBulbs.setColorAt(i, C);
  }
  streetBulbs.instanceColor.needsUpdate = true;
  for (let i = 0; i < streetSigns.length; i++)
    streetSigns[i].material.emissiveIntensity = 1.0 + 0.55 * Math.abs(Math.sin(beatOf(t) * Math.PI + i * 0.7)) + flash * 0.3;
  for (const l of streetLamps) l.material.emissiveIntensity = 1.4 + flash * 0.5;
}

function crowdAt(t, energy) {
  const cb = stageSet.userData.crowdBody, ch = stageSet.userData.crowdHead;
  const bp = beatOf(t);
  for (let i = 0; i < crowd.length; i++) {
    const c = crowd[i];
    const hop = Math.max(0, Math.sin(bp * Math.PI * 2 + c.ph)) * 0.12 * energy;
    const x = Math.cos(c.a) * c.rr, z = Math.sin(c.a) * c.rr;
    R.setInst(cb, i, x, 0.16 + hop, z, 0.34 * c.s, 0.9 * c.s, 0.3 * c.s, 0, -c.a, 0);
    R.setInst(ch, i, x, 0.16 + hop + 0.9 * c.s + 0.14 * c.s, z, 0.32 * c.s, 0.32 * c.s, 0.32 * c.s, 0, -c.a, 0);
  }
  done(cb); done(ch);
  for (let i = 0; i < stickIM.count; i++) {
    const c = crowd[Math.floor(off(i + 11) * crowd.length)];
    const a = c.a + (off(i) - 0.5) * 0.1;
    const y = 1.0 * c.s + Math.sin(bp * Math.PI * 2 + i) * 0.12 * energy;
    R.setInst(stickIM, i, Math.cos(a) * c.rr, y, Math.sin(a) * c.rr, 0.07, 0.5, 0.07, 0, -a, 0);
  }
  done(stickIM);
}

function ripplesAt(f, t, energy) {
  const bp = beatOf(t);
  for (let i = 0; i < 96; i++) {
    const ri = Math.floor(i / 16), ang = (i % 16) / 16 * Math.PI * 2 + ri * 0.31;
    const prog = ((bp * 0.5 + ri / 6) % 1 + 1) % 1;
    if (prog > 0.9) { R.setInst(ringIM, i, 0, -80, 0, 0, 0, 0); continue; }
    const rad = 5.65 + prog * 3.2;
    const s = (0.3 - prog * 0.22) * (0.6 + energy * 0.5);
    R.setInst(ringIM, i, Math.cos(ang) * rad, 0.18, Math.sin(ang) * rad, s, 0.03, s, 0, -ang, 0);
  }
  done(ringIM);
}

function splashAt(f, t, strength) {
  const bp = beatOf(t);
  for (let i = 0; i < 170; i++) {
    const seed = off(i * 1.9), ang = seed * Math.PI * 2;
    const ph = ((bp * 0.5 + seed * 0.9) % 1 + 1) % 1;
    const rad = 1.1 + seed * 2.2 + ph * 1.2;
    const hh = Math.sin(ph * Math.PI) * (0.45 + strength * 1.8) * (0.35 + off(i + 4));
    const s = 0.08 + 0.07 * off(i + 9);
    R.setInst(splash, i, Math.cos(ang) * rad, STAGE_TOP + hh + 0.04, Math.sin(ang) * rad * 0.8 - 0.9, s, s * 1.5, s, ph * 2, ang, ph * 3);
    splash.setColorAt(i, C.setHex([0xffffff, 0xffe2f0, 0xdaf2ff][i % 3]));
  }
  done(splash);
}

function confettiAt(t, k, tint = 1) {
  for (let i = 0; i < 130; i++) {
    const seed = off(i * 3.1);
    if (k <= 0) { R.setInst(confetti, i, 0, -80, 0, 0, 0, 0); continue; }
    const y = 9 - ((t * (2.0 + seed * 2.2) + seed * 9) % 9.2);
    const x = (off(i + 2) * 2 - 1) * 7 + Math.sin(t * 1.4 + i) * 0.5;
    const z = -2.0 - off(i + 5) * 5.0;
    R.setInst(confetti, i, x, y, z, 0.1 * tint, 0.1 * tint, 0.045, t * 2 + i, t + i, 0);
    confetti.setColorAt(i, C.setHex([0xffc857, 0xff5fa2, 0x9b6bff, 0xfff0c0][i % 4]));
  }
  done(confetti);
}

function needleRing(f) {
  const age = f - 35;
  if (age < 0 || age > 60) { hideInst(dropRing, 96); return; }
  const rad = 0.6 + age * 0.13, fade = clamp(1 - age / 60, 0, 1);
  const s = (0.2 * fade + 0.05);
  for (let i = 0; i < 96; i++) {
    const a = i / 96 * Math.PI * 2;
    R.setInst(dropRing, i, NEEDLE.x + Math.cos(a) * rad, REC_TOP + 0.015, NEEDLE.z + Math.sin(a) * rad * 1.0, s, 0.02, s, 0, -a, 0);
  }
  done(dropRing);
}

function rainbowAt(k) {
  const data = rainbowSet.userDataList;
  for (const s of data) {
    if (k <= s.delay) { R.setInst(rainbowIM, s.i, 0, -80, 0, 0, 0, 0); continue; }
    const pop = smooth(s.delay, s.delay + 0.12, k);
    const sz = 0.19 * pop;
    R.setInst(rainbowIM, s.i, s.x, s.y, 0, sz, sz, sz, 0, 0, 0);
  }
  done(rainbowIM);
}

function hideWorlds() {
  deskSet.visible = streetSet.visible = shopSet.visible = stageSet.visible = rainbowSet.visible = false;
  umbrella.visible = false;
  splash.visible = confetti.visible = ringIM.visible = false;
  rain.at(0, 0, 0, 0);
}

// ---------------------------------------------------------------- 搭场景
async function build() {
  buildDesk();
  buildStreet();
  buildShop();
  buildStage();
  buildUmbrella();
  buildRainbow();
  rain = R.makeRain(900, 0xc9d2e8);
  rain.im.frustumCulled = false;
  burstA = R.makeBurst(80, 0xffe6b0);
  burstB = R.makeBurst(90, 0xff9ec8);
  burstC = R.makeBurst(80, 0xffd98a);
  burstD = R.makeBurst(80, 0xc8e8ff);
}
// ---------------------------------------------------------------- 镜头
function placeUmb(x, y, z, tilt = 0) {
  umbrella.visible = true;
  umbrella.position.set(x, y, z);
  umbrella.rotation.set(0, 0.25, tilt);
}

function setupShot(f, sf) {
  const t = f / FPS, shot = R.shotOf(sf);
  hideWorlds();

  burstA.at(f, 35, NEEDLE.x, REC_TOP + 0.1, NEEDLE.z, 1.7, 3.0, i => [0xffe6b0, 0xffc46b, 0xfff6e0][i % 3]);
  burstB.at(f, 596, 0, 0.6, 0, 2.8, 4.2, i => [0xffb4d6, 0xffd98a, 0xfff1d6][i % 3]);
  burstC.at(f, 756, 0, 1.0, -0.6, 2.6, 4.6, i => [0xffd0a0, 0xfff0c8, 0xffb0d8][i % 3]);
  burstD.at(f, 1037, 0, 2.4, -3.4, 3.0, 3.2, i => [0xffd0e0, 0xffe8b8, 0xc8e8ff][i % 3]);

  let focus = 0.5, band = 0.28, veilOp = 0, veilColor = '#000';

  switch (shot.id) {
    // ============ 桌面：雨夜，唱针待落
    case 'S01': {
      deskSet.visible = true;
      const k = easeIO(f / 154);
      R.setSky(0x3a3f74, 30, 120, 0x6d6fae, 0.55);
      R.keyAt(0.6, 0.6, 1.2, 0xffd8bb, 2.55);
      R.hemi.color.set(0xa8aede); R.hemi.intensity = 1.15;
      deskLamp.intensity = 17;
      setFov(32);
      const sw = easeOut(clamp((f - 12) / 22, 0, 1));
      needlePivot.rotation.y = lerp(-0.72, -0.503, sw);
      needleHead.position.y = -0.18 - 0.34 * smooth(26, 35, f);
      needleGlow.material.emissiveIntensity = 0.6 + 2.2 * pulse(f, 35, 18);
      cityLight((f - 35) * 0.22);
      needleRing(f);
      R.look(
        lerp(8.2, 4.5, k) + Math.sin(t * 0.4) * 0.22, lerp(9.6, 5.3, k), lerp(22.5, 12.5, k),
        lerp(0.4, 1.2, k), lerp(0.9, 1.1, k), lerp(1.7, 1.2, k));
      R.play('claude', f, 3.1, REC_TOP, 1.3, { tint: [1.0, 0.99, 1.03] });
      rain.im.material.color.set(0xcfd6ea);
      rain.at(t, 0.6, 0.9, 0.5 + 0.25 * smooth(30, 45, f));
      focus = 0.54; band = 0.3;
      veilColor = '#1c1a32';
      veilOp = 1 - smooth(0, 13, f);
      if (f >= 35 && f < 44) {
        veilColor = '#ffe8c4';
        veilOp = Math.max(veilOp, 0.15 * (1 - (f - 35) / 9));
      }
      break;
    }
    // ============ 伞下：伸手接雨
    case 'S02': {
      deskSet.visible = true;
      const k = easeIO((f - 155) / 119);
      R.setSky(0x353a6c, 26, 104, 0x6264a4, 0.5);
      R.keyAt(3.4, 1.0, 1.4, 0xffd2b0, 2.5);
      R.hemi.color.set(0xaab0e4); R.hemi.intensity = 1.1;
      deskLamp.intensity = 15;
      setFov(28);
      needlePivot.rotation.y = -0.503;
      needleHead.position.y = -0.52;
      needleGlow.material.emissiveIntensity = 0.7 + 0.7 * Math.abs(Math.sin(beatOf(t) * Math.PI));
      cityLight(40);
      R.look(
        lerp(7.2, 6.7, k), lerp(1.02, 0.94, k), lerp(8.8, 8.3, k),
        3.1, lerp(1.36, 1.28, k), 1.35);
      R.play('claude', f, 3.1, REC_TOP, 1.3, { tint: [1.02, 0.99, 1.01] });
      placeUmb(3.1, REC_TOP, 1.3, -0.06 + 0.03 * Math.sin(t * 1.3));
      rain.im.material.color.set(0xd6dcf0);
      rain.at(t, 3.1, 1.6, 0.95);
      focus = 0.48; band = 0.29;
      break;
    }
    // ============ 沟槽雨巷：共伞往前
    case 'S03': {
      streetSet.visible = true;
      const b0 = beatOf(275 / FPS), bStop = beatOf(355 / FPS);
      const xc = -4.8 + 0.8 * (Math.min(beatOf(t), bStop) - b0);
      const xd = xc - 1.35;
      const drift = Math.max(0, f - 355) * 0.002;
      R.setSky(0x2c5a63, 24, 95, 0x3f8086, 0.5);
      R.keyAt(xc, 0.8, 0.6, 0xffd9a8, 2.4);
      R.hemi.color.set(0x9fd0cf); R.hemi.intensity = 1.0;
      lampStreet.intensity = 11 + 3 * pulse(f, 275, 16);
      rimStreet.position.set(xc, 1.9, -1.4); rimStreet.intensity = 5.5;
      setFov(32);
      R.look(
        xc - 0.95 + Math.sin(t * 0.5) * 0.12, 2.95, 9.0,
        xc - 0.6 + drift, 1.2, 0.2);
      R.play('claude', f, xc, STREET_TOP, 0.75, { tint: [0.97, 1.0, 1.02] });
      R.play('deepseek', f, xd, STREET_TOP, 1.35, { tint: [0.97, 1.0, 1.04] });
      placeUmb(xc - 0.6, STREET_TOP, 1.05, -0.045 + 0.04 * Math.sin(t * 1.4));
      streetGlow(t, pulse(f, 275, 18) * 0.4);
      rain.im.material.color.set(0xbcd0e0);
      rain.at(t, xc, 0.6, 0.9);
      focus = 0.46; band = 0.3;
      break;
    }
    // ============ 雨棚下：递心、鞠躬
    case 'S04': {
      streetSet.visible = true;
      shopSet.visible = true;
      const k = easeIO((f - 435) / 161);
      R.setSky(0x2a555e, 22, 88, 0x3b7a80, 0.55);
      R.keyAt(0.2, 0.9, 0.6, 0xffd6a8, 2.8);
      R.hemi.color.set(0x9ccbcb); R.hemi.intensity = 0.92;
      lampStreet.intensity = 9;
      rimStreet.position.set(0.2, 1.9, -1.2); rimStreet.intensity = 3.5;
      setFov(29);
      R.look(
        lerp(0.75, 0.28, k), lerp(2.5, 2.32, k), lerp(7.7, 7.3, k),
        lerp(0.0, -0.05, k), lerp(1.12, 1.02, k), 0.55);
      R.play('claude', f, 0.6, STREET_TOP, 0.72, { tint: [1.0, 0.99, 0.99] });
      R.play('deepseek', f, -0.85, STREET_TOP, 1.02, { tint: [1.0, 1.0, 1.03] });
      streetGlow(t, pulse(f, 435, 18) * 0.5);
      rain.im.material.color.set(0xc2d4e4);
      rain.at(t, 0.4, 4.0, 0.5);
      focus = 0.48; band = 0.28;
      break;
    }
    // ============ 水花舞池：环绕
    case 'S05': {
      stageSet.visible = true;
      splash.visible = confetti.visible = ringIM.visible = true;
      const k = easeIO((f - 596) / 159);
      const a = lerp(-0.62, 0.52, k);
      R.setSky(0x54204e, 24, 100, 0x8f3568, 0.55);
      R.keyAt(0, 1.2, 0.6, 0xffd2a4, 2.8);
      R.hemi.color.set(0xe8b0dc); R.hemi.intensity = 0.9;
      lampStage.intensity = 20 + 8 * pulse(f, 596, 24);
      setFov(28);
      R.look(
        Math.sin(a) * 9.3, 3.28 + Math.sin(beatOf(t) * Math.PI * 2) * 0.06, Math.cos(a) * 9.3,
        0, 1.32, 0.1);
      R.play('claude', f, 1.45, STAGE_TOP, 0.55, { tint: [1.02, 0.97, 1.0] });
      R.play('deepseek', f, -1.45, STAGE_TOP, 0.55, { tint: [0.98, 0.97, 1.04] });
      const energy = 0.7 + 0.5 * pulse(f, 596, 24);
      splashAt(f, t, energy * smooth(596, 630, f));
      ripplesAt(f, t, energy);
      crowdAt(t, 0.9 + 0.4 * pulse(f, 596, 24));
      confettiAt(t, smooth(700, 748, f) * 0.9);
      stageSet.userData.disc.rotation.z = -t * 0.055;
      for (let i = 0; i < speakerGlow.length; i++)
        speakerGlow[i].material.emissiveIntensity = 0.8 + 1.3 * Math.abs(Math.sin(beatOf(t) * Math.PI + i * 0.8));
      for (let i = 0; i < stageBeams.length; i++)
        stageBeams[i].material.opacity = 0.2 + 0.14 * Math.abs(Math.sin(beatOf(t) * Math.PI + i * 0.9));
      mirrorBall.rotation.y = t * 0.8;
      rain.im.material.color.set(0xffc6e0);
      rain.at(t, 0, 0, 0);
      focus = 0.52; band = 0.3;
      break;
    }
    // ============ 舞池近景：最大的水花
    case 'S06': {
      stageSet.visible = true;
      splash.visible = confetti.visible = ringIM.visible = true;
      const k = easeIO((f - 756) / 160);
      R.setSky(0x632654, 20, 88, 0xa03e73, 0.5);
      R.keyAt(0.4, 1.4, 0.6, 0xffd2a0, 2.7);
      R.hemi.color.set(0xf0b8e6); R.hemi.intensity = 0.95;
      lampStage.intensity = 26 + 10 * pulse(f, 756, 24);
      setFov(26);
      R.look(
        lerp(2.9, 2.5, k) + Math.sin(t * 0.8) * 0.1, lerp(1.25, 1.2, k), lerp(6.3, 6.0, k),
        0.35, 1.38, 0.5);
      R.play('claude', f, 1.4, STAGE_TOP, 0.55, { tint: [1.03, 0.96, 1.0] });
      R.play('deepseek', f, -1.4, STAGE_TOP, 0.55, { tint: [0.97, 0.96, 1.05] });
      splashAt(f, t, 1.25);
      ripplesAt(f, t, 1.2);
      crowdAt(t, 1.25);
      confettiAt(t, 1);
      stageSet.userData.disc.rotation.z = -t * 0.08;
      for (let i = 0; i < speakerGlow.length; i++)
        speakerGlow[i].material.emissiveIntensity = 1.0 + 1.5 * Math.abs(Math.sin(beatOf(t) * Math.PI + i * 0.8));
      for (let i = 0; i < stageBeams.length; i++)
        stageBeams[i].material.opacity = 0.14 + 0.12 * Math.abs(Math.sin(beatOf(t) * Math.PI + i * 0.9));
      mirrorBall.rotation.y = t * 1.2;
      rain.im.material.color.set(0xffd0e8);
      rain.at(t, 0, 0, 0);
      focus = 0.52; band = 0.27;
      break;
    }
    // ============ 黎明：针抬起，两人坐下
    case 'S07': {
      deskSet.visible = true;
      const k = easeIO((f - 917) / 119);
      R.setSky(0xd9c6b8, 34, 130, 0xf8d4ae, 0.62);
      R.keyAt(0, 1.0, 0.6, 0xffd0a4, 2.9);
      R.hemi.color.set(0xefe0d4); R.hemi.intensity = 1.2;
      deskLamp.intensity = 16 - 8 * smooth(917, 1000, f);
      setFov(28 + 2 * k);
      const lift = smooth(917, 1006, f);
      needlePivot.rotation.y = lerp(-0.503, -0.64, lift);
      needleHead.position.y = -0.52 + 0.34 * lift;
      needleGlow.material.emissiveIntensity = 0.9 * (1 - lift);
      cityLight(40, 1 - 0.62 * lift);
      R.look(
        lerp(1.7, 1.2, k), lerp(2.6, 6.4, k), lerp(7.4, 17.5, k),
        0, lerp(1.15, 0.9, k), lerp(0.9, 0.7, k));
      R.play('claude', f, -0.85, REC_TOP, 1.15, { tint: [1.04, 1.0, 0.98] });
      R.play('deepseek', f, 0.85, REC_TOP, 1.15, { tint: [1.0, 1.0, 1.02] });
      rain.im.material.color.set(0xd6e2f0);
      rain.at(t, 0, -9, 0.35 * (1 - smooth(950, 1030, f)));
      focus = 0.5; band = 0.3;
      break;
    }
    // ============ 尾镜：方块彩虹
    case 'S08': {
      deskSet.visible = true;
      rainbowSet.visible = true;
      const k = easeIO((f - 1037) / 27);
      R.setSky(0xb8cfe4, 36, 140, 0xf6d8bc, 0.6);
      R.keyAt(0, 1.2, 0.4, 0xffd6ae, 2.7);
      R.hemi.color.set(0xdce6f8); R.hemi.intensity = 1.2;
      deskLamp.intensity = 12;
      setFov(28);
      R.look(
        lerp(0.25, 0.1, k), lerp(3.15, 3.02, k), lerp(10.3, 9.6, k),
        0, lerp(2.1, 2.16, k), -1.2);
      R.play('claude', f, -0.85, REC_TOP, 1.15, { tint: [1.05, 1.0, 0.98] });
      R.play('deepseek', f, 0.85, REC_TOP, 1.15, { tint: [1.0, 1.0, 1.03] });
      needlePivot.rotation.y = -0.64; needleHead.position.y = -0.18;
      needleGlow.material.emissiveIntensity = 0;
      cityLight(40, 0.3 + 0.1 * smooth(1037, 1060, f));
      rainbowAt(clamp((f - 1037) / 7, 0, 1));
      for (let i = 0; i < rainbowClouds.length; i++)
        rainbowClouds[i].material.emissiveIntensity = 0.5 + 0.5 * smooth(1037 + i * 0.3, 1046 + i * 0.3, f);
      rain.im.material.color.set(0xe0eaf8);
      rain.at(t, 0, -9, 0.12);
      focus = 0.52; band = 0.3;
      break;
    }
  }
  return { focus, band, veilColor, veilOp };
}

function overlay(f) { }

R.run({ build, setupShot, overlay });