// The iPhone app's side of timesbane. Never loaded on the website.
//  - The piece's memory (visits, ghost strokes, gold stars...) is kept in a file in Application Support,
//    because iOS may clear a web view's storage. Web storage stays as a mirror.
//  - Real haptics stand in for navigator.vibrate (which iPhones ignore).
//  - The battery, for the piece's "tired" mood.
//  - The patron's page (a one-time purchase) and its two keepsakes: keeping a moment as a picture
//    (tap with three fingers), and bedside (the screen stays awake while charging).
import { registerPlugin } from './vendor/capacitor-core.js';

// A Capacitor plugin answers to every property, `then` included, so it is never awaited or returned
// from an async function directly: it is handed out behind a wrapper with no `then`.
const raw = registerPlugin('Timesbane');
const N = new Proxy({}, { get: (_, k) => (k === 'then' ? undefined : raw[k]) });

const KEY = 'timesbane', FILE = 'memory.json';
let canWrite = false, pending = null, timer = 0, isStarted = false;

// ---------- memory ----------
async function loadMemory() {
  let r;
  try { r = await N.readFile({ name: FILE }); } catch (e) { return; }   // unreadable: never overwrite it
  canWrite = true;
  if (!isStarted && r && typeof r.text === 'string') {
    try { JSON.parse(r.text); localStorage.setItem(KEY, r.text); } catch (e) {}
  }
  // No file yet (first launch): whatever web storage holds is written on the piece's first save.
}
function flush() {
  clearTimeout(timer); timer = 0;
  if (!pending || !canWrite) return;
  const text = pending; pending = null;
  N.writeFile({ name: FILE, text }).catch(() => {});
}
window.tbSave = (json) => { pending = json; if (!timer) timer = setTimeout(flush, 4000); };
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
addEventListener('pagehide', flush);

export const ready = loadMemory();
export function started() { isStarted = true; }

// ---------- sound with the silent switch on ----------
// iOS's web view gives web audio its own "ambient" category, which the silent switch mutes, whatever the
// app's own audio session says. Asking for "playback" makes it play like a video (iOS 16.4+). Older
// systems get the same category from a silent looping clip started on the first touch.
window.tbNative = true;
const playback = () => { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} };
playback();
if (!navigator.audioSession) {
  const quiet = new Audio('data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');
  quiet.loop = true; quiet.setAttribute('playsinline', '');
  const start = () => { quiet.play().catch(() => {}); };
  addEventListener('pointerdown', start, { once: true, capture: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) playback(); });

// ---------- haptics and battery ----------
window.tbHaptic = (p) => { N.haptic({ pattern: Array.isArray(p) ? p : [p] }).catch(() => {}); };
const battery = ({ level, charging }) => { if (window.tbSetBattery && typeof level === 'number' && level >= 0) window.tbSetBattery(level, !!charging); };
N.addListener('battery', battery).catch(() => {});
setTimeout(() => N.battery().then(battery).catch(() => {}), 2500);

// ---------- the patron ----------
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'native.css'; document.head.appendChild(css);
let patron = false, price = null, sheet = null, busy = false;
try { patron = localStorage.getItem('tb.patron') === '1'; } catch (e) {}

function setPatron(on) {
  patron = !!on;
  try { localStorage.setItem('tb.patron', patron ? '1' : '0'); } catch (e) {}
  N.setBedside({ on: patron }).catch(() => {});
  if (sheet && !sheet.hidden && !busy) render();
}
N.setBedside({ on: patron }).catch(() => {});
N.patronStatus().then((r) => { price = r.price || null; setPatron(!!r.patron); }).catch(() => {});
N.addListener('patronChanged', (r) => setPatron(!!r.patron)).catch(() => {});

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function render(note = '') {
  const card = sheet.querySelector('.tb-card');
  card.replaceChildren();
  if (patron) {
    card.append(el('h2', 'tb-title', 'You are a patron'),
      el('p', 'tb-body', 'Thank you. Tap the screen with three fingers to keep a moment as a picture. While your phone is charging, the screen stays awake.'));
    const done = el('button', 'tb-main', 'Done'); done.type = 'button'; done.addEventListener('click', close);
    card.append(done);
  } else {
    card.append(el('h2', 'tb-title', 'Become a patron'),
      el('p', 'tb-body', 'This piece is whole and free, and it stays that way. A one-time patron’s gift supports it, and gives you two keepsakes:'));
    const ul = el('ul', 'tb-list');
    ul.append(el('li', null, 'Keep a moment: tap the screen with three fingers to save what you see as a picture.'),
      el('li', null, 'Bedside: while your phone is charging, the screen stays awake and the piece drifts on through the night.'));
    card.append(ul);
    const buy = el('button', 'tb-main', price ? `Become a patron · ${price}` : 'Become a patron'); buy.type = 'button'; buy.addEventListener('click', () => purchase(buy));
    const later = el('button', 'tb-quiet', 'Not now'); later.type = 'button'; later.addEventListener('click', close);
    const restore = el('button', 'tb-link', 'Became a patron before, on this Apple Account? Restore it'); restore.type = 'button'; restore.addEventListener('click', () => restoreIt(restore));
    card.append(buy, later, restore);
  }
  const n = el('p', 'tb-note', note); n.setAttribute('aria-live', 'polite'); card.append(n);
  card.append(el('p', 'tb-credits', 'Live data, used as it happens and never kept: NOAA Space Weather Prediction Center, USGS earthquakes, NASA near-Earth objects, Wikimedia EventStreams, the Art Institute of Chicago, Nager.Date holidays, wheretheiss.at, mempool.space, global-warming.org, and in Great Britain the Carbon Intensity API (National Grid ESO, CC BY 4.0).'));
}

async function purchase(btn) {
  if (busy) return; busy = true;
  btn.disabled = true; btn.textContent = 'Connecting to the App Store…';
  const step = await N.addListener('patronStep', ({ step: s }) => { if (s === 'found') btn.textContent = 'Opening the purchase sheet…'; }).catch(() => null);
  let r; try { r = await N.buyPatron(); } catch (e) { r = { error: 'failed' }; }
  step?.remove?.();
  busy = false;
  if (r.patron) { setPatron(true); render(); N.haptic({ pattern: [20, 40, 60] }).catch(() => {}); return; }
  if (r.cancelled) return render();
  if (r.pending) return render('Waiting for approval… It will unlock by itself once it’s approved.');
  if (r.error === 'unavailable') return render(`The App Store isn’t answering right now. Please try again later. (${r.detail || 'unavailable'})`);
  render(`The purchase didn’t go through. (${r.error || 'unknown'})`);
}
async function restoreIt(btn) {
  if (busy) return; busy = true;
  btn.disabled = true; btn.textContent = 'Checking with the App Store…';
  let r; try { r = await N.restorePatron(); } catch (e) { r = { error: 'failed' }; }
  busy = false;
  if (r.patron) { setPatron(true); return render(); }
  render(r.error ? `Couldn’t reach the App Store. (${r.error})` : 'No patron’s gift was found for this Apple Account.');
}

function open() {
  if (!sheet) {
    sheet = el('div', 'tb-sheet'); sheet.id = 'tb-sheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    const card = el('div', 'tb-card'); sheet.append(card);
    sheet.addEventListener('click', (e) => { if (e.target === sheet && !busy) close(); });
    document.body.append(sheet);
  }
  render(); sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('on'));
  sheet.querySelector('.tb-title')?.setAttribute('tabindex', '-1'); sheet.querySelector('.tb-title')?.focus();
}
function close() { if (!sheet) return; sheet.classList.remove('on'); setTimeout(() => { sheet.hidden = true; }, 250); }
window.tbPatron = open;

// ---------- keep a moment ----------
function shutter() {
  const f = el('div', 'tb-flash'); document.body.append(f);
  requestAnimationFrame(() => f.classList.add('go')); setTimeout(() => f.remove(), 700);
}
window.tbKeep = () => {
  if (!patron) return open();
  const url = window.tbSnapshot && window.tbSnapshot(); if (!url) return;
  shutter(); N.haptic({ pattern: [12] }).catch(() => {});
  N.keep({ png: url.slice(url.indexOf(',') + 1) }).catch(() => {});
};

// for the smoke test
export const _test = { open, close, setPatron, get patron() { return patron; } };
