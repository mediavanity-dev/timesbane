// timesbane's widgets: wordless, drawn from the time alone (they read nothing from the app).
//  - Today: the same pattern the piece's Today movement shows everyone on Earth this hour (the same rule, seed and clock).
//  - Year: every day of this year on one spiral; today glows.
//  - Moon: tonight's Moon at its real phase (also on the Lock Screen).
//  - Tree: a tree that grows through the day while you aren't looking, blossoms in the evening, and starts again at midnight.
// All of them work in StandBy.

import WidgetKit
import SwiftUI

let ink = Color(red: 5 / 255, green: 4 / 255, blue: 7 / 255)
let cream = Color(red: 236 / 255, green: 228 / 255, blue: 214 / 255)
let ember = Color(red: 1, green: 106 / 255, blue: 77 / 255)
let gold = Color(red: 1, green: 207 / 255, blue: 107 / 255)

struct TickEntry: TimelineEntry { let date: Date }

// Entries now and at the next few multiples of `step` seconds.
struct Ticks: TimelineProvider {
    let step: TimeInterval
    let count: Int
    func placeholder(in context: Context) -> TickEntry { TickEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (TickEntry) -> Void) { completion(TickEntry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<TickEntry>) -> Void) {
        let now = Date()
        let next = (floor(now.timeIntervalSince1970 / step) + 1) * step
        var entries = [TickEntry(date: now)]
        for i in 0..<count { entries.append(TickEntry(date: Date(timeIntervalSince1970: next + Double(i) * step))) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// The piece's random source (mulberry32), bit for bit, so Today matches the website.
struct Mulberry {
    var s: UInt32
    mutating func next() -> Double {
        s = s &+ 0x6D2B79F5
        var t = (s ^ (s >> 15)) &* (1 | s)
        t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
        return Double(t ^ (t >> 14)) / 4294967296
    }
}

// MARK: Today

func todayRows(at date: Date, count n: Int) -> [[UInt8]] {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    let c = cal.dateComponents([.year, .month, .day, .hour], from: date)
    guard let y = c.year, let m = c.month, let d = c.day, let h = c.hour, let hourStart = cal.date(from: c) else { return [] }
    var r = Mulberry(s: UInt32(truncatingIfNeeded: y * 1_000_000 + m * 10_000 + d * 100 + h))
    let rules = [30, 45, 73, 90, 105, 110, 150, 54, 60, 126, 22, 18, 146, 129, 137, 193]
    let rule = rules[min(15, Int(r.next() * 16))]
    let nc = 128
    var row = [UInt8](repeating: 0, count: nc)
    for i in 0..<nc { row[i] = r.next() < 0.5 ? 1 : 0 }
    var tmp = row
    let target = max(0, Int(date.timeIntervalSince(hourStart) / 0.5))
    var out: [[UInt8]] = []
    for gen in 0..<target {
        for i in 0..<nc {
            let l = i > 0 ? Int(row[i - 1]) : 0, cc = Int(row[i]), rr = i < nc - 1 ? Int(row[i + 1]) : 0
            tmp[i] = UInt8((rule >> ((l << 2) | (cc << 1) | rr)) & 1)
        }
        row = tmp
        if target - gen <= n { out.append(row) }
    }
    return out
}

struct TodayView: View {
    let date: Date
    var body: some View {
        Canvas { ctx, size in
            let cell = size.width / 128
            let n = Int(ceil(size.height / cell))
            let rows = todayRows(at: date, count: n)
            var on = Path()
            let top = size.height - CGFloat(rows.count) * cell
            for (j, row) in rows.enumerated() {
                for (i, v) in row.enumerated() where v == 1 {
                    on.addRect(CGRect(x: CGFloat(i) * cell, y: top + CGFloat(j) * cell, width: cell + 0.3, height: cell + 0.3))
                }
            }
            ctx.fill(on, with: .color(cream))
        }
        .containerBackground(ink, for: .widget)
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "today", provider: Ticks(step: 600, count: 6)) { e in TodayView(date: e.date) }
            .configurationDisplayName("Today")
            .description("The pattern everyone on Earth is seeing this hour.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
            .contentMarginsDisabled()
    }
}

// MARK: Year

struct YearView: View {
    let date: Date
    var body: some View {
        Canvas { ctx, size in
            let cal = Calendar.current
            let y = cal.component(.year, from: date)
            let start = cal.date(from: DateComponents(year: y, month: 1, day: 1))!
            let end = cal.date(from: DateComponents(year: y + 1, month: 1, day: 1))!
            let days = cal.dateComponents([.day], from: start, to: end).day ?? 365
            let today = cal.dateComponents([.day], from: start, to: date).day ?? 0
            let m = min(size.width, size.height), cx = size.width / 2, cy = size.height / 2
            func pos(_ i: Int) -> CGPoint {
                let u = Double(i) / Double(days), a = -Double.pi / 2 + u * .pi * 6, r = m * (0.07 + 0.39 * u)
                return CGPoint(x: cx + CGFloat(cos(a)) * r, y: cy + CGFloat(sin(a)) * r)
            }
            var past = Path(), future = Path()
            let dot = max(1.2, m / 140)
            for i in 0..<days where i != today {
                let p = pos(i)
                let rect = CGRect(x: p.x - dot, y: p.y - dot, width: dot * 2, height: dot * 2)
                if i < today { past.addEllipse(in: rect) } else { future.addEllipse(in: rect) }
            }
            ctx.fill(future, with: .color(cream.opacity(0.1)))
            ctx.fill(past, with: .color(cream.opacity(0.45)))
            let t = pos(today)
            ctx.fill(Path(ellipseIn: CGRect(x: t.x - dot * 4, y: t.y - dot * 4, width: dot * 8, height: dot * 8)), with: .color(ember.opacity(0.3)))
            ctx.fill(Path(ellipseIn: CGRect(x: t.x - dot * 1.6, y: t.y - dot * 1.6, width: dot * 3.2, height: dot * 3.2)), with: .color(ember))
        }
        .containerBackground(ink, for: .widget)
    }
}

struct YearWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "year", provider: Ticks(step: 3600 * 6, count: 4)) { e in YearView(date: e.date) }
            .configurationDisplayName("Year")
            .description("Every day of this year on one spiral. Today glows.")
            .supportedFamilies([.systemSmall, .systemLarge])
    }
}

// MARK: Moon

// The Moon's phase, 0 new, 0.5 full (the same low-precision formula the piece uses).
func moonPhase(_ date: Date) -> Double {
    let rad = Double.pi / 180
    let D = date.timeIntervalSince1970 / 86400 + 2440587.5 - 2451545
    let g0 = (357.529 + 0.98560028 * D) * rad
    let sl = 280.459 + 0.98564736 * D + 1.915 * sin(g0) + 0.02 * sin(2 * g0)
    let M = (134.963 + 13.064993 * D) * rad
    let ml = 218.316 + 13.176396 * D + 6.289 * sin(M)
    return ((ml - sl).truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) / 360
}

func moonPath(center c: CGPoint, radius r: CGFloat, phase p: Double) -> Path {
    var path = Path()
    let k = CGFloat(cos(2 * Double.pi * p)), waxing = p < 0.5, steps = 48
    var right: [CGPoint] = [], left: [CGPoint] = []
    for s in 0...steps {
        let yy = -r + 2 * r * CGFloat(s) / CGFloat(steps), limb = sqrt(max(0, r * r - yy * yy))
        let a = waxing ? limb * k : -limb, b = waxing ? limb : -limb * k
        left.append(CGPoint(x: c.x + a, y: c.y + yy)); right.append(CGPoint(x: c.x + b, y: c.y + yy))
    }
    path.move(to: right[0])
    for q in right.dropFirst() { path.addLine(to: q) }
    for q in left.reversed() { path.addLine(to: q) }
    path.closeSubpath()
    return path
}

struct MoonView: View {
    let date: Date
    @Environment(\.widgetFamily) var family
    var body: some View {
        Canvas { ctx, size in
            let lock = family == .accessoryCircular
            let r = min(size.width, size.height) * (lock ? 0.42 : 0.3), c = CGPoint(x: size.width / 2, y: size.height / 2)
            if !lock {
                var stars = Mulberry(s: 1969)
                var sp = Path()
                for _ in 0..<40 { let x = stars.next() * Double(size.width), y = stars.next() * Double(size.height); sp.addRect(CGRect(x: x, y: y, width: 1, height: 1)) }
                ctx.fill(sp, with: .color(cream.opacity(0.35)))
            }
            ctx.fill(Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2)), with: .color(cream.opacity(lock ? 0.25 : 0.08)))
            ctx.fill(moonPath(center: c, radius: r, phase: moonPhase(date)), with: .color(lock ? .white : Color(red: 1, green: 248 / 255, blue: 230 / 255)))
        }
        .containerBackground(family == .accessoryCircular ? Color.clear : ink, for: .widget)
    }
}

struct MoonWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "moon", provider: Ticks(step: 3600 * 3, count: 8)) { e in MoonView(date: e.date) }
            .configurationDisplayName("Moon")
            .description("Tonight's Moon, at its real phase.")
            .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

// MARK: Tree

struct TreeView: View {
    let date: Date
    var body: some View {
        Canvas { ctx, size in
            let cal = Calendar.current
            let dayStart = cal.startOfDay(for: date)
            let grown = min(1, max(0.04, date.timeIntervalSince(dayStart) / 86400 * 1.15))
            let doy = cal.ordinality(of: .day, in: .year, for: date) ?? 1
            var r = Mulberry(s: UInt32(doy * 7919 + cal.component(.year, from: date)))
            let ground = size.height * 0.9
            ctx.fill(Path(CGRect(x: 0, y: ground, width: size.width, height: 1)), with: .color(cream.opacity(0.18)))
            var wood = Path(), tips: [CGPoint] = []
            let depth = 2 + Int(grown * 7)
            func branch(_ p: CGPoint, _ a: Double, _ len: CGFloat, _ d: Int) {
                let q = CGPoint(x: p.x + CGFloat(sin(a)) * len, y: p.y - CGFloat(cos(a)) * len)
                wood.move(to: p); wood.addLine(to: q)
                if d >= depth { tips.append(q); return }
                let spread = 0.35 + r.next() * 0.3
                branch(q, a - spread, len * CGFloat(0.68 + r.next() * 0.12), d + 1)
                branch(q, a + spread * (0.8 + r.next() * 0.4), len * CGFloat(0.68 + r.next() * 0.12), d + 1)
            }
            branch(CGPoint(x: size.width / 2, y: ground), (r.next() - 0.5) * 0.15, size.height * 0.24 * CGFloat(0.4 + 0.6 * grown), 1)
            ctx.stroke(wood, with: .color(cream.opacity(0.75)), lineWidth: 1)
            if grown > 0.62 {
                let bloom = min(1, (grown - 0.62) / 0.3)
                var petals = Path()
                for t in tips where r.next() < bloom { petals.addEllipse(in: CGRect(x: t.x - 1.6, y: t.y - 1.6, width: 3.2, height: 3.2)) }
                ctx.fill(petals, with: .color(ember.opacity(0.85)))
            }
        }
        .containerBackground(ink, for: .widget)
    }
}

struct TreeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "tree", provider: Ticks(step: 1800, count: 16)) { e in TreeView(date: e.date) }
            .configurationDisplayName("Tree")
            .description("It grows while you aren't looking.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct TimesbaneWidgets: WidgetBundle {
    var body: some Widget {
        TodayWidget()
        YearWidget()
        MoonWidget()
        TreeWidget()
    }
}
