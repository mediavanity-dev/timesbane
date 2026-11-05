// CPU profile of one movement (desktop size): which functions take the time.
//   node tools/profile.mjs 5 [--slow]
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), M = +process.argv[2] || 0, SLOW = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bp = [process.env.CHROME_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
const server = createServer((q, r) => { const p = join(ROOT, new URL(q.url, 'http://x').pathname.replace(/\/$/, '/index.html')); if (!existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript' }); r.end(readFileSync(p)); });
await new Promise((r) => server.listen(0, r));
const dir = mkdtempSync(join(tmpdir(), 'tb-prof-'));
const br = spawn(bp, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
let t, port; for (let k = 0; k < 75 && !t; k++) { try { port ||= +readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]; t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch { await sleep(200); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Profiler.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
if (SLOW) await send('Emulation.setCPUThrottlingRate', { rate: 4 });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.fetch=()=>Promise.reject(new Error('x'));window.EventSource=class{close(){}};" });
await send('Page.navigate', { url: `http://localhost:${server.address().port}/#m${M}` }); await sleep(2000);
await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start'); await sleep(4000);
const { profile } = await send('Profiler.stop');
const self = new Map(), total = profile.samples.length, byId = new Map(profile.nodes.map((n) => [n.id, n]));
for (const s of profile.samples) { const n = byId.get(s), k = `${n.callFrame.functionName || '(anon)'}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + 1); }
for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(`${(v / total * 100).toFixed(1).padStart(5)}%  ${k}`);
ws.close(); if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(br.pid), '/T', '/F'], { stdio: 'ignore' }); else br.kill(); server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch {}
process.exit(0);
