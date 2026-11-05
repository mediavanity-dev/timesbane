// Headless check of every movement: opens each one directly (#mN), plays with it (tap, drag, hold,
// scroll, shake, keys), and reports script errors and frame times. Live data is stubbed (real network
// requests stall a headless browser), so results are repeatable. No dependencies (Node 22+).
//
//   node tools/check.mjs                      all movements, phone-sized (390x844, touch)
//   node tools/check.mjs --desk               desktop-sized (1920x1080 at 2x, mouse)
//   node tools/check.mjs --slow               4x CPU throttle (a low-power Chromebook)
//   node tools/check.mjs --only 3,17          just these movements
//   node tools/check.mjs --shots DIR          save a screenshot of each movement
//   node tools/check.mjs --secs 6             seconds per movement (default 5)
//   CHROME_PATH=... to pick a browser.

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const has = (k) => process.argv.includes(k);
const DESK = has('--desk'), SLOW = has('--slow'), SECS = +arg('--secs', 5), SHOTS = arg('--shots', null);
const ONLY = arg('--only', null)?.split(',').map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browserPath = [process.env.CHROME_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(existsSync);
if (!browserPath) { console.error('no Chrome/Edge found (set CHROME_PATH)'); process.exit(2); }

// --- a tiny static server for the repo ---
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

// --- the browser ---
const profileDir = mkdtempSync(join(tmpdir(), 'tb-check-'));
const [vw, vh] = DESK ? [1920, 1080] : [390, 844];
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, '--no-first-run',
  '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--window-size=${vw},${vh}`, 'about:blank'], { stdio: 'ignore' });
let target, port;
for (let k = 0; k < 75 && !target; k++) {
  try { port ||= +readFileSync(join(profileDir, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]; target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); }
  catch { await sleep(200); }
}
if (!target) { console.error('browser did not start'); process.exit(2); }
if (process.env.DBG) console.error('browser on', port);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(), errors = [];
// every command has a deadline, so a stalled page shows up as an error instead of a hang
const send = (method, params = {}) => new Promise((resolve) => {
  const i = ++id, tm = setTimeout(() => { pending.delete(i); errors.push(`timeout: ${method}`); resolve({}); }, 20000);
  pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
});
const dbg = (...a) => { if (process.env.DBG) console.error(...a); };
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
};
const evalJS = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: DESK ? 2 : 3, mobile: !DESK });
if (!DESK) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
if (SLOW) await send('Emulation.setCPUThrottlingRate', { rate: 4 });
// stub the network and the live stream; count frames
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.fetch = () => Promise.reject(new Error('offline in tests'));
  window.EventSource = class { constructor() {} close() {} };
  window.__frames = [];
  const raf = window.requestAnimationFrame.bind(window);
  let lastF = 0;
  window.requestAnimationFrame = (cb) => raf((t) => { if (lastF) window.__frames.push(t - lastF); lastF = t; cb(t); });
  // the test visitor has found the key, so the hidden last movement can be opened too
  try { localStorage.setItem('timesbane', JSON.stringify({ visits: 7, first: Date.now() - 9e8, seen: [], strokes: [], found: Object.fromEntries(['lock','heart','highway','mill','tuned','avalanche','reply','frost'].map(k => [k, 1])) })); } catch (e) {}
` });

const n = await (async () => { await send('Page.navigate', { url: `http://localhost:${PORT}/` }); await sleep(1500); return evalJS('typeof MOVES !== "undefined" ? MOVES.length : 0'); })();
dbg('movements', n);
if (!n) { console.error('page did not load:', errors); process.exit(1); }
const list = ONLY || [...Array(n).keys()];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// synthetic pointer events, dispatched in the page (the browser's own touch input can stall headless)
const ptr = (type, x, y) => evalJS(`(() => { const t = { down: 'pointerdown', up: 'pointerup', move: 'pointermove' }['${type}'];
  document.getElementById('c').dispatchEvent(new PointerEvent(t, { pointerId: 1, pointerType: '${DESK ? 'mouse' : 'touch'}', clientX: ${x}, clientY: ${y},
    buttons: t === 'pointerup' ? 0 : 1, isPrimary: true, bubbles: true, cancelable: true })); })()`);
const results = [];
for (const i of list) {
  errors.length = 0; if (process.env.DBG) console.error("nav", i);
  await send('Page.navigate', { url: `http://localhost:${PORT}/?t=${Date.now()}#m${i}` });
  await sleep(1200);
  if (process.env.DBG) console.error("loaded", i); await evalJS("window.__frames = []"); if (process.env.DBG) console.error("reset", i);
  const cx = vw / 2, cy = vh / 2, t0 = Date.now(), until = t0 + SECS * 1000;
  // play: tap, drag across, hold, scroll, shake, then watch
  if (process.env.DBG) console.error("f0", await evalJS("window.__frames.length"));
  await ptr("down", cx, cy); await sleep(60); await ptr("up", cx, cy); await sleep(300);
  if (process.env.DBG) console.error("f1", await evalJS("window.__frames.length"));
  await ptr('down', vw * .2, vh * .3);
  for (let k = 0; k <= 20; k++) { await ptr('move', vw * (.2 + k * .03), vh * (.3 + Math.sin(k / 3) * .1)); await sleep(30); }
  await ptr('up', vw * .8, vh * .3); await sleep(200);
  await ptr('down', cx, cy * 1.2); await sleep(1500); await ptr('up', cx, cy * 1.2); await sleep(200);
  if (DESK) { for (let k = 0; k < 6; k++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx, y: cy, deltaX: 0, deltaY: 100 }); await sleep(50); } }
  await evalJS('cur && cur.shake && cur.shake(1.2)');
  while (Date.now() < until) await sleep(100);
  const st = await evalJS(`(() => { const f = window.__frames.slice().sort((a, b) => a - b); const avg = f.reduce((a, b) => a + b, 0) / (f.length || 1);
    return { name: cur && MOVES[curI].name, idx: curI, frames: f.length, avg: +avg.toFixed(1), p95: +(f[Math.floor(f.length * .95)] || 0).toFixed(1), voices: S.n, dpr: DPR }; })()`);
  if (SHOTS) { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(join(SHOTS, `m${String(i).padStart(2, '0')}.jpg`), Buffer.from(s.data, 'base64')); }
  const errs = [...new Set(errors)];
  results.push({ i, ...st, errors: errs });
  console.log(`${String(i).padStart(2)} ${String(st?.name).padEnd(12)} frames ${String(st?.frames).padStart(4)}  avg ${String(st?.avg).padStart(5)} ms  p95 ${String(st?.p95).padStart(5)} ms  dpr ${st?.dpr}${errs.length ? '  ERRORS: ' + errs.join(' | ').slice(0, 300) : ''}`);
}
ws.close();
if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' }); else browser.kill();
server.close();
try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
const bad = results.filter((r) => r.errors.length || r.idx !== r.i);
console.log(bad.length ? `FAILED: ${bad.map((r) => r.i).join(', ')}` : `ok: ${results.length} movements`);
process.exit(bad.length ? 1 : 0);
