// Render video: node core/render/video.mjs <demo> [--fps 24] [--workers 3] [--q 'k=v'] [--out <demo>/out/video.mp4] [--size 1920x1080]
//                                          [--chunks a:b,c:d --chunk-dir <dir>] [--crf 16]
// Each worker has its own browser and takes pieces of frames from a shared queue; JPEG screenshots are piped to ffmpeg; pieces are joined losslessly.
// Encoding happens once, straight at delivery spec: H.264 yuv420p, bt709, limited range, CRF 16 (no second re-encode afterwards).
// --chunks: render only these frame ranges (frame indices from 0, end exclusive); each one is saved as <chunk-dir>/<a>_<b>.mp4.
//   The caller joins the chunk files with ffmpeg concat -c copy, so re-rendering one chunk later leaves the others untouched.
//   Without --chunks the whole film is one chunk written to --out.
// Capture: DevTools Page.captureScreenshot with optimizeForSpeed (same JPEG quality 95, less time per frame); VOXEL_CAPTURE=playwright uses page.screenshot.
// With the environment variable RENDER_SLOTS (an integer) set, the machine runs at most that many renders at once (slot.mjs); unset means no limit.
// Piece files go in a hidden directory next to --out, unique to each render, deleted when the render finishes (or fails, or is interrupted).
// <out>.lock holds the owner's pid; if the owner is gone, or the lock file hasn't been refreshed for over 12 hours, it counts as stale and a new render takes over.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo, closeServer, requireDemo, takeSize } from './page.mjs';
const args = process.argv.slice(2), { w: W, h: H } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0]; requireDemo(dir);
const FPS = +opt('--fps', 24), WK = +opt('--workers', 3), Q = opt('--q', ''), CRF = String(+opt('--crf', 16));
if (!(FPS > 0) || !Number.isInteger(WK) || WK < 1) { console.error('bad --fps / --workers: fps must be > 0, workers an integer ≥ 1'); process.exit(2); }
const out = path.resolve(opt('--out', path.join(dir, 'out', 'video.mp4')));
const chunkArg = opt('--chunks', null), chunkDir = chunkArg ? path.resolve(opt('--chunk-dir', path.join(path.dirname(out), 'chunks'))) : null;
const outDir = path.dirname(out), base = path.basename(out, path.extname(out));
fs.mkdirSync(outDir, { recursive: true }); if (chunkDir) fs.mkdirSync(chunkDir, { recursive: true });
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];

// —— only one render may write a given --out: <out>.lock holds the pid ——
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const lock = out + '.lock', LOCK_MAX_AGE = 12 * 3600 * 1000;
try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); } catch {
  const other = Number(fs.readFileSync(lock, 'utf8')), age = Date.now() - fs.statSync(lock).mtimeMs;
  if (Number.isInteger(other) && other > 0 && alive(other) && age < LOCK_MAX_AGE) {
    console.error(`another render (pid ${other}) is already writing ${out}. Give this one its own --out.\n` +
      `If no render is running (a crashed one can leave its lock behind), delete ${lock} and run this again.`); process.exit(2);
  }
  fs.writeFileSync(lock, String(process.pid));
}
setInterval(() => { try { const n = new Date(); fs.utimesSync(lock, n, n); } catch {} }, 10 * 60 * 1000).unref();
for (const n of fs.readdirSync(outDir)) if (n.startsWith(`.${base}_segs-`)) {   // piece directories left by crashed renders
  try { const p = Number(fs.readFileSync(path.join(outDir, n, 'pid'), 'utf8')); if (!alive(p)) fs.rmSync(path.join(outDir, n), { recursive: true, force: true }); } catch {}
}
let segDir = null, cleaned = false; const procs = new Set();
const cleanup = () => { if (cleaned) return; cleaned = true; for (const p of procs) p.kill('SIGKILL'); if (segDir) fs.rmSync(segDir, { recursive: true, force: true }); try { fs.unlinkSync(lock); } catch {} };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(128 + (sig === 'SIGINT' ? 2 : 15)); });
const fail = msg => { console.error(msg); cleanup(); process.exit(1); };

const release = process.env.RENDER_SLOTS ? await (await import('./slot.mjs')).acquire() : () => {};
segDir = fs.mkdtempSync(path.join(outDir, `.${base}_segs-`)); fs.writeFileSync(path.join(segDir, 'pid'), String(process.pid));
const probe = await openDemo(dir, { w: W, h: H, q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
if (!(DUR > 0)) fail(`window.DUR must be a positive number of seconds (got ${DUR})`);
const TOTAL = Math.round(DUR * FPS), t0 = Date.now();

// —— chunks → pieces (the unit of work a worker takes from the queue) ——
const chunks = chunkArg ? chunkArg.split(',').map(s => s.split(':').map(Number)) : [[0, TOTAL]];
for (const [a, b] of chunks) if (!(Number.isInteger(a) && Number.isInteger(b) && 0 <= a && a < b && b <= TOTAL)) fail(`bad chunk ${a}:${b} (film has ${TOTAL} frames)`);
const todo = chunks.reduce((s, [a, b]) => s + b - a, 0);
const PIECE = Math.max(24, Math.min(240, Math.ceil(todo / WK / 2)));   // small enough to keep every worker busy to the end, big enough that encoder start-up doesn't matter
const queue = [];
chunks.forEach(([a, b], ci) => { for (let x = a, k = 0; x < b; x += PIECE, k++) queue.push({ ci, k, a: x, b: Math.min(b, x + PIECE) }); });
const pieceName = p => `c${p.ci}_${String(p.k).padStart(4, '0')}.mp4`;
let doneFrames = 0, lastLog = 0;

async function capture(page, cdp) {
  if (cdp) { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true }); return Buffer.from(r.data, 'base64'); }
  return page.screenshot({ type: 'jpeg', quality: 95 });
}

async function encodePiece(page, cdp, p) {
  // cwd set to the piece directory with relative filenames: that way ffmpeg won't read characters such as # ? in the path as protocol syntax
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...ENC, pieceName(p)],
    { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
  procs.add(ff); ff.on('close', () => procs.delete(ff));
  let dead = null;   // ffmpeg exited early (missing encoder, disk full…): its own error is already on stderr
  let done; const closed = new Promise(r => { done = r; }); ff.on('close', code => done(code));
  ff.on('error', e => { dead = e.code === 'ENOENT' ? 'ffmpeg is not installed (or not on PATH)' : e.message; done(-1); });
  ff.stdin.on('error', () => { dead ??= 'ffmpeg closed its input early'; });
  for (let f = p.a; f < p.b && !dead; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await capture(page, cdp);
    if (dead) break;
    if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), closed]);
    doneFrames++;
    if (Date.now() - lastLog > 15000) { lastLog = Date.now(); const s = (Date.now() - t0) / 1000; console.log(`${doneFrames}/${todo} frames  ${s.toFixed(0)}s  (${(s / doneFrames * 1000 * WK).toFixed(0)} ms per frame per worker)`); }
  }
  ff.stdin.end(); const code = await closed;
  if (dead || code !== 0) fail(`ffmpeg failed on frames ${p.a}–${p.b}: ${dead || 'exit code ' + code} (ffmpeg's own message, if any, is above)`);
}

try { await Promise.all([...Array(Math.min(WK, queue.length))].map(async () => {
  const { browser, page } = await openDemo(dir, { w: W, h: H, q: Q });
  let cdp = null;
  if (process.env.VOXEL_CAPTURE !== 'playwright') {
    try { cdp = await page.context().newCDPSession(page); await capture(page, cdp); } catch { cdp = null; }   // a Chrome without optimizeForSpeed: page.screenshot
  }
  for (let p; (p = queue.shift());) await encodePiece(page, cdp, p);
  await browser.close();
})); } catch (e) { fail(`render stopped: ${String(e.message || e).split('\n')[0]}`); }   // e.g. the page's render(t) threw

// —— join pieces into chunks (or into the one film) ——
const join = (names, dst) => {
  fs.writeFileSync(path.join(segDir, 'list.txt'), names.map(n => `file '${n}'`).join('\n'));
  try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'merged.mp4'], { cwd: segDir, stdio: ['ignore', 'inherit', 'inherit'] }); }
  catch { fail('ffmpeg could not join the pieces (its message is above)'); }
  fs.copyFileSync(path.join(segDir, 'merged.mp4'), dst); fs.unlinkSync(path.join(segDir, 'merged.mp4'));   // the final filename never goes through ffmpeg
};
const names = fs.readdirSync(segDir);
chunks.forEach(([a, b], ci) => join(names.filter(n => n.startsWith(`c${ci}_`)).sort(), chunkArg ? path.join(chunkDir, `${a}_${b}.mp4`) : out));
const secs = (Date.now() - t0) / 1000;
cleanup(); release();
console.log('done', chunkArg ? `${chunks.length} chunks -> ${chunkDir}` : out, todo, 'frames', secs.toFixed(0) + 's', `(${WK} workers)`);
closeServer();
