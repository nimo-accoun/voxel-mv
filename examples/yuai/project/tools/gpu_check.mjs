// 渲染用的浏览器拿到的是哪块显卡（WebGL 渲染器名）。由 tools/run.py doctor 调用；最后一行打印渲染器名。
// usage: node gpu_check.mjs <render dir>
import path from 'path'; import { pathToFileURL } from 'url';
const lib = path.resolve(process.argv[2]);
const { chromium } = await import(pathToFileURL(path.join(lib, 'node_modules', 'playwright-core', 'index.mjs')).href);
const { EXE, ARGS } = await import(pathToFileURL(path.join(lib, 'core/render/browser.mjs')).href);
const browser = await chromium.launch({ executablePath: EXE, args: ARGS });
const page = await browser.newPage();
const name = await page.evaluate(() => {
  const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
  if (!g) return 'no WebGL';
  const e = g.getExtension('WEBGL_debug_renderer_info');
  return String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
});
await browser.close();
console.log(name);
process.exit(/no WebGL/.test(name) ? 1 : 0);
