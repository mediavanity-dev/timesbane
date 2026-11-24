// The app's own Capacitor plugin (JS name "Timesbane", used by app/native.js).
//  - readFile / writeFile: the piece's memory as one JSON file in Application Support, because iOS can
//    clear a web view's storage when the phone is low on space. Written whole and atomically.
//  - haptic: navigator.vibrate patterns ([on, off, on, ...] in milliseconds) played as taps of the
//    Taptic Engine, stronger for longer pulses.
//  - battery: level and charging, and a "battery" event when either changes.
//  - patronStatus / buyPatron / restorePatron: the one-time patron's gift (StoreKit 2), with a
//    "patronChanged" event for purchases finished outside the app (Ask to Buy, refunds, Family Sharing).
//  - setBedside: for patrons, the screen stays awake while the phone is charging.
//  - keep: a picture of the moment, offered through the share sheet (Save Image, Messages, ...).
// Nothing here uses the network except StoreKit, and nothing is collected.

import UIKit
import StoreKit
import Capacitor

@objc(TimesbanePlugin)
public class TimesbanePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TimesbanePlugin"
    public let jsName = "Timesbane"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "readFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "haptic", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "battery", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "patronStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "buyPatron", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePatron", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBedside", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "keep", returnType: CAPPluginReturnPromise),
    ]

    static let patronProduct = "com.mediavanity.timesbane.patron"   // must match App Store Connect exactly
    private static var cachedProduct: Product?
    private static var lookupProblem = ""
    private var purchaseUpdates: Task<Void, Never>?
    private var bedside = false

    override public func load() {
        purchaseUpdates = Task.detached { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
                await self?.announcePatron()
            }
        }
        DispatchQueue.main.async {
            UIDevice.current.isBatteryMonitoringEnabled = true
            let nc = NotificationCenter.default
            nc.addObserver(self, selector: #selector(self.batteryChanged), name: UIDevice.batteryLevelDidChangeNotification, object: nil)
            nc.addObserver(self, selector: #selector(self.batteryChanged), name: UIDevice.batteryStateDidChangeNotification, object: nil)
        }
    }

    // MARK: memory

    private static let recordFiles: Set<String> = ["memory.json"]
    private let files = DispatchQueue(label: "timesbane.files")

    private func recordURL(_ name: String) throws -> URL {
        let dir = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        return dir.appendingPathComponent(name)
    }

    // { text }: the file's contents, or null when it has never been written.
    @objc func readFile(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), TimesbanePlugin.recordFiles.contains(name) else { call.reject("Unknown file"); return }
        files.async {
            do {
                let url = try self.recordURL(name)
                guard FileManager.default.fileExists(atPath: url.path) else { call.resolve(["text": NSNull()]); return }
                call.resolve(["text": try String(contentsOf: url, encoding: .utf8)])
            } catch {
                call.reject("Could not read: \(error.localizedDescription)")
            }
        }
    }

    @objc func writeFile(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), TimesbanePlugin.recordFiles.contains(name), let text = call.getString("text") else { call.reject("Unknown file"); return }
        files.async {
            do {
                try Data(text.utf8).write(to: try self.recordURL(name), options: .atomic)
                call.resolve()
            } catch {
                call.reject("Could not save: \(error.localizedDescription)")
            }
        }
    }

    // MARK: haptics

    @objc func haptic(_ call: CAPPluginCall) {
        let pattern: [Double] = (call.getArray("pattern") ?? []).compactMap { v in
            if let d = v as? Double { return d }
            if let i = v as? Int { return Double(i) }
            if let n = v as? NSNumber { return n.doubleValue }
            return nil
        }
        DispatchQueue.main.async {
            var at = 0.0
            for (i, ms) in pattern.prefix(12).enumerated() {
                if i % 2 == 0 && ms > 0 {
                    let style: UIImpactFeedbackGenerator.FeedbackStyle = ms <= 8 ? .light : ms <= 20 ? .medium : .heavy
                    let intensity = CGFloat(min(1, 0.45 + ms / 60))
                    DispatchQueue.main.asyncAfter(deadline: .now() + at) {
                        let g = UIImpactFeedbackGenerator(style: style)
                        g.impactOccurred(intensity: intensity)
                    }
                }
                at += ms / 1000
            }
            call.resolve()
        }
    }

    // MARK: battery and bedside

    private func batteryInfo() -> [String: Any] {
        let d = UIDevice.current
        return ["level": Double(d.batteryLevel), "charging": d.batteryState == .charging || d.batteryState == .full]
    }

    @objc func battery(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(self.batteryInfo()) }
    }

    @objc private func batteryChanged() {
        DispatchQueue.main.async {
            self.notifyListeners("battery", data: self.batteryInfo())
            self.applyBedside()
        }
    }

    private func applyBedside() {
        let s = UIDevice.current.batteryState
        UIApplication.shared.isIdleTimerDisabled = bedside && (s == .charging || s == .full)
    }

    @objc func setBedside(_ call: CAPPluginCall) {
        let on = call.getBool("on") ?? false
        DispatchQueue.main.async {
            self.bedside = on
            self.applyBedside()
            call.resolve()
        }
    }

    // MARK: keep a moment

    @objc func keep(_ call: CAPPluginCall) {
        guard let b64 = call.getString("png"), let data = Data(base64Encoded: b64), let image = UIImage(data: data) else { call.reject("No picture"); return }
        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController else { call.reject("No window"); return }
            let share = UIActivityViewController(activityItems: [image], applicationActivities: nil)
            if let pop = share.popoverPresentationController {   // iPad: anchor it, or it crashes
                pop.sourceView = vc.view
                pop.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.midY, width: 1, height: 1)
                pop.permittedArrowDirections = []
            }
            share.completionWithItemsHandler = { _, completed, _, _ in call.resolve(["completed": completed]) }
            vc.present(share, animated: true)
        }
    }

    // MARK: the patron's gift (StoreKit 2)

    private static func lookup(timeout: Double = 15) async -> Product? {
        if let p = cachedProduct { return p }
        let product: Product? = await withCheckedContinuation { cont in
            let once = Once()
            Task {
                do {
                    let found = try await Product.products(for: [patronProduct])
                    once.run {
                        lookupProblem = found.isEmpty ? "the App Store returned no product" : ""
                        cont.resume(returning: found.first)
                    }
                } catch {
                    once.run {
                        lookupProblem = "StoreKit: \(error.localizedDescription)"
                        cont.resume(returning: nil)
                    }
                }
            }
            Task {
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                once.run {
                    lookupProblem = "no answer from the App Store in \(Int(timeout)) seconds"
                    cont.resume(returning: nil)
                }
            }
        }
        if let p = product { cachedProduct = p }
        return product
    }

    private static func isPatron() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == patronProduct, t.revocationDate == nil { return true }
        }
        return false
    }

    private func announcePatron() async {
        let patron = await TimesbanePlugin.isPatron()
        DispatchQueue.main.async { self.notifyListeners("patronChanged", data: ["patron": patron]) }
    }

    @objc func patronStatus(_ call: CAPPluginCall) {
        Task {
            var out: [String: Any] = ["patron": await TimesbanePlugin.isPatron()]
            if let product = await TimesbanePlugin.lookup() { out["price"] = product.displayPrice }
            call.resolve(out)
        }
    }

    @objc func buyPatron(_ call: CAPPluginCall) {
        Task {
            do {
                guard let product = await TimesbanePlugin.lookup() else {
                    call.resolve(["patron": false, "error": "unavailable", "detail": TimesbanePlugin.lookupProblem])
                    return
                }
                DispatchQueue.main.async { self.notifyListeners("patronStep", data: ["step": "found"]) }
                switch try await purchase(product) {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["patron": true])
                    } else {
                        call.resolve(["patron": false, "error": "unverified"])
                    }
                case .pending:
                    call.resolve(["patron": false, "pending": true])
                case .userCancelled:
                    call.resolve(["patron": false, "cancelled": true])
                @unknown default:
                    call.resolve(["patron": false])
                }
            } catch {
                call.resolve(["patron": false, "error": error.localizedDescription])
            }
        }
    }

    // A scene-based app must name the window scene for the purchase sheet (iOS 17+).
    private func purchase(_ product: Product) async throws -> Product.PurchaseResult {
        if #available(iOS 17.0, *) {
            let scene: UIScene? = await MainActor.run {
                self.bridge?.viewController?.view.window?.windowScene
                    ?? UIApplication.shared.connectedScenes.first { $0.activationState == .foregroundActive }
            }
            if let scene = scene { return try await product.purchase(confirmIn: scene) }
        }
        return try await product.purchase()
    }

    @objc func restorePatron(_ call: CAPPluginCall) {
        Task {
            var failed: String? = nil
            do { try await AppStore.sync() } catch { failed = error.localizedDescription }
            var out: [String: Any] = ["patron": await TimesbanePlugin.isPatron()]
            if let failed = failed { out["error"] = failed }
            call.resolve(out)
        }
    }
}

// Runs its closure the first time only (for a continuation two tasks race to resume).
final class Once {
    private let lock = NSLock()
    private var done = false
    func run(_ body: () -> Void) {
        lock.lock()
        defer { lock.unlock() }
        if done { return }
        done = true
        body()
    }
}
