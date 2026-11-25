// App Store screenshots of the app build (www/): six movements, captioned and framed, for
// iPhone 6.3" (1206x2622) and iPad 13" (2064x2752), into fastlane/screenshots/en-US; plus the Patron
// review screenshot (fastlane/review/iap-review.png) and a contact sheet (fastlane/review/contact-sheet.png).
//   npm run build && node scripts/store-screenshots.mjs
// Live data is offline here and lenses are switched off, so every run starts from the same state. Look at every image.
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const outDir = join(root, 'fastlane', 'screenshots', 'en-US');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await mkdir(join(root, 'fastlane', 'review'), { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '') || 'index.html';
  try { const b = await readFile(join(www, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(b); } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: 'msedge', args: ['--autoplay-policy=no-user-gesture-required'] });

// [movement index, seconds to let it unfold, caption, optional play]
const SCENES = [
  [32, 16, { h: 'Fall forever <em>into a fractal</em>', p: 'A living artwork that answers your touch' }],
  [38, 26, { h: 'Ink on water, <em>combed by your finger</em>', p: 'Real marbling, made fresh every time' }],
  [33, 8, { h: 'Northern lights <em>at your fingertips</em>', p: 'The real Sun, Moon, sky and space weather' }],
  [39, 14, { h: 'Drift <em>into the deep</em>', p: 'Glowing creatures, slow sound, no words' }],
  [45, 10, { h: 'Tilt, touch <em>and listen</em>', p: 'Everything responds, and makes its own sound' }],
  [47, 12, { h: 'Forty-eight <em>living movements</em>', p: 'New colours, shapes and secrets every visit' }],
];
const DEVICES = {
  iPhone: { w: 402, h: 874, dpr: 3, s: 0.74, capTop: 46, devTop: 206, pad: 22, h1: 29, sub: 15, r: 40, bezel: 7, mobile: true },
  iPad: { w: 1032, h: 1376, dpr: 2, s: 0.74, capTop: 64, devTop: 250, pad: 90, h1: 50, sub: 22, r: 28, bezel: 9, mobile: false },
};
const frame = (d, cap, img) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
@font-face{font-family:Cg;font-style:italic;font-weight:500;src:url(${base}fonts/cormorant-garamond-italic-500-latin.woff2)}
html,body{margin:0;width:${d.w}px;height:${d.h}px;overflow:hidden;background:radial-gradient(120% 70% at 50% 0%,#3a1d16 0%,#050407 64%);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#f3ebdf}
.cap{position:absolute;left:0;right:0;top:${d.capTop}px;text-align:center;padding:0 ${d.pad}px}
h1{margin:0;font:italic 500 ${d.h1 * 1.25}px/1.02 Cg,Georgia,serif;text-wrap:balance}
h1 em{color:#ffcf6b}
p{margin:${d.h1 * 0.3}px 0 0;font-size:${d.sub}px;line-height:1.3;color:rgba(236,228,214,.75);text-wrap:balance}
.dev{position:absolute;left:50%;top:${d.devTop}px;width:${d.w * d.s}px;height:${d.h * d.s}px;transform:translateX(-50%);border-radius:${d.r}px;overflow:hidden;
box-shadow:0 0 0 ${d.bezel}px #000,0 0 0 ${d.bezel + 2}px rgba(255,255,255,.18),0 30px 80px rgba(0,0,0,.6)}
img{width:100%;height:100%;display:block}
</style><div class="cap"><h1>${cap.h}</h1><p>${cap.p}</p></div><div class="dev"><img src="${img}"></div>`;

const offline = () => {
  window.fetch = () => Promise.reject(new Error('offline'));
  window.EventSource = class { close() {} };
  try { localStorage.setItem('timesbane', JSON.stringify({ visits: 1, seen: [], strokes: [], found: {} })); } catch (e) {}
};
const made = [];
for (const [name, d] of Object.entries(DEVICES)) {
  const fctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.dpr });
  const fp = await fctx.newPage();
  for (const [k, [m, secs, cap]] of SCENES.entries()) {
    const ctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.dpr, isMobile: d.mobile, hasTouch: true, locale: 'en-US' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('page error:', String(e)));
    await page.addInitScript(offline);
    await page.goto(`${base}index.html#m${m}`);
    await page.waitForFunction(() => typeof started !== 'undefined' && started, null, { timeout: 15000 });
    await page.evaluate(() => { setLens(null); document.querySelectorAll('.ui').forEach((e) => { e.style.visibility = 'hidden'; }); });
    await page.waitForTimeout(secs * 1000);
    await page.evaluate(() => setLens(null));
    const raw = await page.screenshot({ type: 'png' });
    await ctx.close();
    await fp.setContent(frame(d, cap, 'data:image/png;base64,' + raw.toString('base64')), { waitUntil: 'load' });
    await fp.evaluate(() => document.fonts.ready); await fp.waitForTimeout(200);
    const out = join(outDir, `${name}-${k + 1}-m${m}.png`);
    await sharp(await fp.screenshot({ type: 'png' })).removeAlpha().png().toFile(out);
    made.push(out);
  }
  await fctx.close();
  console.log(`${name}: ${SCENES.length} screenshots`);
}

// the Patron page as a free user sees it, with the App Store price
{
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route('**/vendor/capacitor-core.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export const registerPlugin = () => window.__plugin;' }));
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform: () => true };
    const ok = async () => ({});
    window.__plugin = { readFile: async () => ({ text: null }), writeFile: ok, haptic: ok, battery: async () => ({ level: 1, charging: false }), setBedside: ok, keep: ok,
      patronStatus: async () => ({ patron: false, price: '$2.99' }), buyPatron: ok, restorePatron: ok, addListener: async () => ({ remove() {} }) };
  });
  await page.addInitScript(offline);
  await page.goto(`${base}index.html#m47`);
  await page.waitForFunction(() => typeof started !== 'undefined' && started && window.tbPatron, null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.tbPatron());
  await page.waitForTimeout(800);
  await sharp(await page.screenshot({ type: 'png' })).removeAlpha().png().toFile(join(root, 'fastlane', 'review', 'iap-review.png'));
  await ctx.close();
  console.log('Patron review screenshot');
}
const tiles = await Promise.all(made.map((f) => sharp(f).resize({ height: 600 }).toBuffer({ resolveWithObject: true })));
let x = 0; const comp = tiles.map((t) => { const o = { input: t.data, left: x, top: 0 }; x += t.info.width + 10; return o; });
await sharp({ create: { width: x, height: 600, channels: 3, background: '#333' } }).composite(comp).png().toFile(join(root, 'fastlane', 'review', 'contact-sheet.png'));
await browser.close();
server.close();
