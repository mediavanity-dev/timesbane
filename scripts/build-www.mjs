// Builds www/, the copy of the piece that Capacitor bundles into the iPhone app.
//  - The page's one big inline script becomes piece.js, started by boot.js once the native memory file is loaded.
//  - The Google Analytics tag and the Google Fonts link are removed; the font is bundled (app/fonts).
//  - No service worker: every file is already on the phone.
//  - app/native.js (haptics, the memory file, the patron's page, keeping a moment) and @capacitor/core are added.
// Fails if anything remote is still loaded as a script, style or font, or if analytics slipped through.
// The live-data requests (weather, sky, Wikipedia and the rest) stay: they are part of the piece and are listed in README § Privacy.
import { cpSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
let html = readFileSync(join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

const cut = (re, what) => { if (!re.test(html)) throw new Error(`index.html: ${what} not found`); html = html.replace(re, ''); };
cut(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]+"><\/script>\n<script>\n[\s\S]*?gtag\("config"[^\n]*\n<\/script>\n/, 'the analytics tag');
cut(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n/, 'the font preconnects');
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond[^"]*" rel="stylesheet">/,
  '<style>@font-face{font-family:"Cormorant Garamond";font-style:italic;font-weight:500;font-display:swap;src:url(fonts/cormorant-garamond-italic-500-latin.woff2) format("woff2")}</style>');

const m = html.match(/<script>\n('use strict';[\s\S]*?)<\/script>\n/);
if (!m) throw new Error('index.html: the main script was not found');
const piece = m[1];
html = html.replace(m[0], '<script type="module" src="boot.js"></script>\n');

if (/googletagmanager|google-analytics|gtag\(|fonts\.googleapis|fonts\.gstatic/.test(html + piece)) throw new Error('analytics or a remote font is still in the page');
if (/<(script|link)[^>]+(src|href)="https?:/i.test(html)) throw new Error('the page still loads a remote script or stylesheet');
if (!/user-scalable=no/.test(html)) throw new Error('the viewport must turn off zoom');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'vendor'), { recursive: true });
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, 'piece.js'), piece);
for (const f of ['boot.js', 'native.js', 'native.css']) copyFileSync(join(root, 'app', f), join(out, f));
cpSync(join(root, 'app', 'fonts'), join(out, 'fonts'), { recursive: true });
copyFileSync(join(root, 'node_modules', '@capacitor', 'core', 'dist', 'index.js'), join(out, 'vendor', 'capacitor-core.js'));
console.log(`Built www/ (piece.js ${(piece.length / 1024).toFixed(0)} KB)`);
