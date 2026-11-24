// One-time edits to the Capacitor iOS template, after `npx cap add ios` and patch-capacitor-ios.cjs.
// Safe to run again; throws if the template changed shape.
//  - Info.plist: purpose strings (location is opt-in from inside the piece; saving a kept moment to Photos),
//    no status bar.
//  - AppDelegate: sound plays with the silent switch on and mixes with other audio.
//  - SceneDelegate: AppViewController registers the plugin, turns off zoom and scrolling, matches the dark
//    background, and answers the web view's motion-and-orientation question itself (the piece uses tilt,
//    shake and turning the phone over), so there is no second permission prompt.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..', 'ios', 'App');
const edit = (file, fn) => { const p = join(app, file), a = readFileSync(p, 'utf8'), b = fn(a); if (b !== a) writeFileSync(p, b); };
const must = (t, n, w) => { if (!t.includes(n)) throw new Error(`${w}: expected ${n}`); };

edit('App/Info.plist', (pl) => {
  const keys = [
    ['NSLocationWhenInUseUsageDescription', 'Only if you ask for it, inside the piece: your place, rounded to about 10 km, puts the real sky, sun and weather over you. It is never stored.'],
    ['NSPhotoLibraryAddUsageDescription', 'To save a moment you choose to keep to your photos.'],
  ];
  for (const [k, v] of keys) if (!pl.includes(k)) pl = pl.replace('\t<key>LSRequiresIPhoneOS</key>', `\t<key>${k}</key>\n\t<string>${v}</string>\n\t<key>LSRequiresIPhoneOS</key>`);
  if (!pl.includes('UIStatusBarHidden')) pl = pl.replace('\t<key>LSRequiresIPhoneOS</key>', '\t<key>UIStatusBarHidden</key>\n\t<true/>\n\t<key>LSRequiresIPhoneOS</key>');
  pl = pl.replace(/<key>UIViewControllerBasedStatusBarAppearance<\/key>\s*<true\/>/, '<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>');
  must(pl, '<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>', 'Info.plist status bar');
  for (const [k] of keys) must(pl, k, 'Info.plist');
  return pl;
});

edit('App/AppDelegate.swift', (s) => {
  if (s.includes('AVAudioSession')) return s;
  must(s, 'import Capacitor', 'AppDelegate.swift');
  s = s.replace('import Capacitor', 'import Capacitor\nimport AVFoundation');
  const a = 'didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n';
  must(s, a, 'AppDelegate.swift');
  return s.replace(a, a + '        // The piece\'s sound plays with the silent switch on (like a video), and mixes with music already playing.\n        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])\n        try? AVAudioSession.sharedInstance().setActive(true)\n');
});

edit('App/SceneDelegate.swift', (s) => {
  if (s.includes('AppViewController')) return s;
  must(s, 'window?.rootViewController = CAPBridgeViewController()', 'SceneDelegate.swift');
  return s.replace('import Capacitor', 'import Capacitor\nimport WebKit')
    .replace('window?.rootViewController = CAPBridgeViewController()', 'window?.rootViewController = AppViewController()') + `
// The web view's controller: registers the app's plugin, turns off zoom and scrolling, keeps the
// background the piece's near-black so nothing flashes, and grants motion access itself.
class AppViewController: CAPBridgeViewController {
    private static let ink = UIColor(red: 5 / 255, green: 4 / 255, blue: 7 / 255, alpha: 1)   // #050407
    private var motion: MotionGrant?

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TimesbanePlugin())
        view.backgroundColor = AppViewController.ink
        webView?.isOpaque = false
        webView?.backgroundColor = AppViewController.ink
        webView?.scrollView.backgroundColor = AppViewController.ink
        webView?.scrollView.minimumZoomScale = 1
        webView?.scrollView.maximumZoomScale = 1
        webView?.scrollView.bouncesZoom = false
        webView?.scrollView.isScrollEnabled = false
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        if let wv = webView {
            let m = MotionGrant(inner: wv.uiDelegate)
            motion = m
            wv.uiDelegate = m
        }
    }
}

// Stands in front of Capacitor's own UI delegate: answers the motion-and-orientation request with
// "grant" (the piece is built on tilt and shake) and passes every other call through unchanged.
final class MotionGrant: NSObject, WKUIDelegate {
    private weak var inner: WKUIDelegate?
    init(inner: WKUIDelegate?) { self.inner = inner }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || (inner?.responds(to: aSelector) ?? false)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        if let inner = inner, inner.responds(to: aSelector) { return inner }
        return super.forwardingTarget(for: aSelector)
    }

    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView, requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }
}
`;
});

console.log('iOS project set up: purpose strings, no status bar, audio session, AppViewController');
