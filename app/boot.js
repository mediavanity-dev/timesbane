// The app's entry point (the website runs the same piece inline instead).
// Inside the iPhone app the piece's memory lives in a file, which is loaded before the piece starts.
// If the native side doesn't answer within three seconds, the piece starts anyway.
if (window.Capacitor?.isNativePlatform?.()) {
  try {
    const native = await import('./native.js');
    await Promise.race([native.ready, new Promise((r) => setTimeout(r, 3000))]);
    native.started();
  } catch (e) {
    console.error('native setup failed', e);
  }
}
const s = document.createElement('script');
s.src = 'piece.js';
document.body.appendChild(s);
