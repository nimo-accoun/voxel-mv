// 跨段共用的道具：每段长得一样，不要自己另画。发光拼图（全片同一块，越传越大）、方块烟花。
// 巨鲸在 T5 交接里，用 relay.js 的 drawWhale（S5、S6 共用）。
import { THREE, scene, box, instanced, setInst, hash, clamp, FPS } from './relay.js';

// 发光拼图：pieces = 已经拼上几块（1–7），每段交出去时比收到时多一块；S7 结尾拼满 7 块。
// 用法：const pz = makePuzzle(); pz.set(pieces); pz.group.position.set(...); pz.glow(强度 0~3)
const PIECE_CELLS = (() => {
  const c = []; for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) c.push([x, y]);
  c.push([4, 1], [4, 2], [1, 4], [2, 4]); return c;
})();
// 7 块排成一个 3×3 缺两角的形状，每块各一种段落主色的边
const SLOTS = [[0, 0], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]];
const RIM = [0xff9a3c, 0x4f8dff, 0xc77dff, 0x2b2b2b, 0x5b5fd6, 0xb9a3ff, 0x1f2f5c];   // Claude 橙 … Kimi 藏青
export function makePuzzle() {
  const group = new THREE.Group(); scene.add(group);
  const pieces = SLOTS.map(([sx, sy], k) => {
    const g = new THREE.Group(); group.add(g);
    g.position.set(sx * 0.42, sy * 0.42, 0);
    for (const [x, y] of PIECE_CELLS) {
      const edge = x === 0 || y === 0 || x === 3 || y === 3;
      box(g, 0.095, 0.095, 0.09, edge ? RIM[k] : 0xffd36e, (x - 2) * 0.1, (y - 2) * 0.1, 0, { emissive: edge ? RIM[k] : 0xffb43c, ei: edge ? 0.6 : 1.6, cast: false });
    }
    return g;
  });
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,220,140,0.9)'); r.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.scale.set(1.4, 1.4, 1); group.add(halo);
  const light = new THREE.PointLight(0xffc670, 2, 4); group.add(light);
  group.visible = false;
  return {
    group, pieces,
    set(n) { pieces.forEach((p, k) => p.visible = k < n); group.visible = n > 0; },
    glow(k) { halo.scale.setScalar(1.4 * (0.6 + k)); light.intensity = 2 * k; },
  };
}

// 方块烟花：一朵 = 一团发光小方块。fw.at(f, 炸开帧, x, y, z, 颜色, 半径, 熄灭帧?)
// 炸开后 1.2 秒内悬停、闪烁、慢慢落；到熄灭帧变灰往下掉（「烟花一闪就灭」）
export function makeFireworks(count = 4, n = 140) {
  const list = [];
  for (let j = 0; j < count; j++) {
    const im = instanced(scene, n, 0xffffff, { emissive: 0xffffff }); im.material.emissiveIntensity = 1.4; im.material.toneMapped = false;
    list.push(im);
  }
  const c = new THREE.Color(), grey = new THREE.Color(0x6a6878);
  return {
    hideAll() { for (const im of list) { for (let i = 0; i < n; i++) setInst(im, i, 0, -80, 0, 0, 0, 0); im.instanceMatrix.needsUpdate = true; } },
    at(slot, f, f0, x, y, z, color, radius = 3, fOut = null) {
      const im = list[slot], age = (f - f0) / FPS;
      if (age < 0 || age > 2.6) { for (let i = 0; i < n; i++) setInst(im, i, 0, -80, 0, 0, 0, 0); im.instanceMatrix.needsUpdate = true; return; }
      const out = fOut != null && f >= fOut ? (f - fOut) / FPS : -1;
      for (let i = 0; i < n; i++) {
        const th = hash(i * 1.7) * Math.PI * 2, ph = Math.acos(2 * hash(i * 3.3) - 1);
        const r = radius * (1 - Math.exp(-age * 6)) * (0.85 + hash(i) * 0.15);
        let px = x + Math.sin(ph) * Math.cos(th) * r, py = y + Math.cos(ph) * r - 0.8 * age * age, pz = z + Math.sin(ph) * Math.sin(th) * r * 0.4;
        if (out >= 0) py -= 6 * out * out;
        const tw = 0.6 + 0.4 * Math.sin(age * 20 + i);
        const s = (out >= 0 ? 0.12 : 0.12 * clamp(1.6 - age * 0.55, 0, 1) * tw);
        setInst(im, i, px, py, pz, s, s, s, age * 2, age, 0);
        c.set(color); if (out >= 0) c.lerp(grey, clamp(out * 4, 0, 1));
        im.setColorAt(i, c);
      }
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    },
  };
}
