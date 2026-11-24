import UIKit
import Capacitor
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

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
