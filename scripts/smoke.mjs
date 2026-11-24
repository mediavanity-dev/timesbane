// Headless walk-through of the built app (www/) in Edge, with a stand-in for the native plugin.
//   npm run smoke [-- out-dir]      (screenshots go to out-dir when given)
// 1. Browser: the piece starts; no analytics, no remote fonts or scripts; no errors.
// 2. App, first launch: an older web-storage memory is carried into the native file.
// 3. App, relaunch after iOS wiped web storage: the memory comes back from the file.
// 4. Haptics go to the plugin; the battery reaches the piece.
// 5. The patron's page: opened by a three-finger tap and by holding the turning mark; buying unlocks it;
//    keeping a moment then sends a picture to the share sheet.
// 6. The patron's page fits a small phone, a large phone and an iPad in landscape.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const www = join(dirname(fileURLToPath(import.meta.url)), '..', 'www');
const out = process.argv[2];
if (out) await mkdir(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '') || 'index.html';
  if (p === 'favicon.ico') return void res.writeHead(204).end();
  try { res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(await readFile(join(www, p))); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: 'msedge', args: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The stand-in plugin: records every call; the memory file lives in Node between launches.
const files = {};
const calls = [];
const STUB = `
  window.Capacitor = { isNativePlatform: () => true };
  window.__calls = [];
  const rec = (n, a) => window.__calls.push([n, a]);
  window.__listeners = {};
  window.__plugin = {
    readFile: async (a) => { rec('readFile', a); return { text: window.__file ?? null }; },
    writeFile: async (a) => { rec('writeFile', a); window.__file = a.text; window.__saveFile(a.text); },
    haptic: async (a) => { rec('haptic', a); },
    battery: async () => ({ level: .9, charging: true }),
    patronStatus: async () => ({ patron: !!window.__patron, price: '$2.99' }),
    buyPatron: async () => { rec('buyPatron'); (window.__listeners.patronStep || []).forEach((f) => f({ step: 'found' })); await new Promise((r) => setTimeout(r, 300)); window.__patron = true; return { patron: true }; },
    restorePatron: async () => ({ patron: !!window.__patron }),
    setBedside: async (a) => { rec('setBedside', a); },
    keep: async (a) => { rec('keep', { bytes: (a.png || '').length }); return { completed: true }; },
    addListener: async (name, fn) => { (window.__listeners[name] ||= []).push(fn); return { remove() {} }; },
  };`;

async function open({ native = false, storage = null, file = undefined, viewport = { width: 390, height: 844 } } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage();
  const errors = [], remote = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  // the live data is part of the piece; in the test it is simply offline. Anything else remote is a failure.
  await context.route((u) => !u.href.startsWith(base), (route) => { remote.push(route.request().url()); route.abort(); });
  if (native) {
    await page.exposeFunction('__saveFile', (t) => { files.memory = t; });
    await page.route('**/vendor/capacitor-core.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export const registerPlugin = () => window.__plugin;' }));
    await page.addInitScript(STUB + (file !== undefined ? `window.__file = ${JSON.stringify(file)};` : ''));
  }
  await page.addInitScript((s) => { localStorage.clear(); if (s) localStorage.setItem('timesbane', s); }, storage);
  await page.goto(base);
  await page.waitForFunction(() => typeof MOVES !== 'undefined', null, { timeout: 15000 });
  return { page, context, errors, remote };
}
const begin = async (page) => { await page.mouse.click(195, 422); await page.waitForFunction(() => started, null, { timeout: 10000 }); };
const memVisits = (page) => page.evaluate(() => MEM.visits);
const shot = async (page, name) => out && page.screenshot({ path: join(out, `${name}.png`) });

// 1. Browser
{
  const { page, context, errors, remote } = await open();
  await begin(page);
  await sleep(1500);
  const html = await page.content();
  assert.ok(!/googletagmanager|fonts\.googleapis|gtag\(/.test(html), 'analytics or remote fonts in the app page');
  assert.ok(remote.every((u) => !/googletagmanager|fonts\.g/.test(u)), 'requested analytics or remote fonts: ' + remote.join(' '));
  assert.equal(await page.evaluate(() => typeof window.tbPatron), 'undefined', 'the patron page must not exist in a browser');
  assert.equal(await page.evaluate(() => document.fonts.check('italic 500 24px "Cormorant Garamond"')), true, 'the bundled font did not load');
  assert.deepEqual(errors, []);
  console.log('1 browser: ok (offline live data:', remote.length, 'requests aborted)');
  await context.close();
}

// 2. App, first launch: web storage from the website era is carried into the file
{
  const old = JSON.stringify({ visits: 3, first: Date.now() - 9e8, seen: [], strokes: [], found: { wink: 1 } });
  const { page, context, errors } = await open({ native: true, storage: old, file: null });
  assert.equal(await memVisits(page), 4);
  await begin(page);
  await page.waitForFunction(() => window.__calls.some(([n]) => n === 'writeFile'), null, { timeout: 8000 });
  const saved = JSON.parse(files.memory);
  assert.equal(saved.visits, 4); assert.ok(saved.found.wink, 'found stars carried over');
  // haptics and battery
  await page.evaluate(() => buzz([10, 30, 10]));
  assert.ok(await page.evaluate(() => window.__calls.some(([n, a]) => n === 'haptic' && a.pattern.length === 3)), 'haptic not sent');
  await sleep(2000);
  assert.deepEqual(await page.evaluate(() => [BAT && BAT.level, BAT && BAT.charging]), [.9, true], 'battery not passed to the piece');
  assert.deepEqual(errors, []);
  console.log('2 first launch: memory copied into the file; haptics and battery: ok');
  await context.close();
}

// 3. Relaunch after iOS cleared web storage
{
  const { page, context, errors } = await open({ native: true, storage: null, file: files.memory });
  assert.equal(await memVisits(page), 5, 'memory did not come back from the file');
  assert.ok(await page.evaluate(() => MEM.found.wink), 'gold stars lost');
  assert.deepEqual(errors, []);
  console.log('3 relaunch with web storage wiped: memory restored (visit 5): ok');
  await context.close();
}

// 4 and 5. The patron's page
{
  const { page, context, errors } = await open({ native: true, file: files.memory });
  await begin(page);
  await sleep(1200);
  // three fingers, not yet a patron: the page opens instead of keeping
  await page.evaluate(() => { const c = document.getElementById('c'); for (const t of ['pointerdown', 'pointerup']) for (const id of [21, 22, 23]) c.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: 100 + id, clientY: 400, bubbles: true, cancelable: true })); });
  await page.waitForSelector('#tb-sheet:not([hidden])');
  let text = await page.locator('#tb-sheet').innerText();
  assert.match(text, /Become a patron/); assert.match(text, /\$2\.99/); assert.match(text, /Restore/);
  assert.ok(!await page.evaluate(() => window.__calls.some(([n]) => n === 'keep')), 'kept a moment without being a patron');
  await shot(page, 'patron-offer-390');
  await page.click('.tb-quiet');
  await page.waitForSelector('#tb-sheet', { state: 'hidden' });
  // holding the turning mark opens it too
  const nx = await page.locator('#nx').boundingBox();
  await page.mouse.move(nx.x + nx.width / 2, nx.y + nx.height / 2); await page.mouse.down(); await sleep(1000); await page.mouse.up();
  await page.waitForSelector('#tb-sheet:not([hidden])');
  const before = await page.evaluate(() => curI);
  await page.click('.tb-main');
  await page.waitForFunction(() => /You are a patron/.test(document.getElementById('tb-sheet').innerText), null, { timeout: 5000 });
  await shot(page, 'patron-thanks-390');
  assert.equal(await page.evaluate(() => curI), before, 'holding the mark also changed the movement');
  assert.ok(await page.evaluate(() => window.__calls.some(([n, a]) => n === 'setBedside' && a.on)), 'bedside not turned on for a patron');
  await page.click('.tb-main');
  await page.waitForSelector('#tb-sheet', { state: 'hidden' });
  // now three fingers keep the moment
  await page.evaluate(() => window.tbKeep());
  await page.waitForFunction(() => window.__calls.some(([n, a]) => n === 'keep' && a.bytes > 1000), null, { timeout: 5000 });
  assert.deepEqual(errors, []);
  console.log('4-5 patron page: opens by three fingers and by holding the mark; buy unlocks; bedside on; a moment is kept: ok');
  await context.close();
}

// 6. Layout of the patron's page on other screens
for (const [w, h, name] of [[320, 568, 'se'], [440, 956, 'max'], [1180, 820, 'ipad-landscape']]) {
  const { page, context } = await open({ native: true, file: files.memory, viewport: { width: w, height: h } });
  await begin(page);
  await page.evaluate(() => window.tbPatron());
  await page.waitForSelector('#tb-sheet:not([hidden])');
  await sleep(400);
  const fits = await page.evaluate(() => { const b = document.querySelector('.tb-main').getBoundingClientRect(), r = document.querySelector('.tb-link').getBoundingClientRect(); return b.right <= innerWidth && b.left >= 0 && r.bottom <= document.getElementById('tb-sheet').scrollHeight + 1; });
  assert.ok(fits, `the patron page does not fit at ${w}x${h}`);
  await shot(page, `patron-${name}`);
  await context.close();
}
console.log('6 patron page fits 320x568, 440x956 and an iPad in landscape: ok');

await browser.close();
server.close();
console.log('smoke: all passed');
