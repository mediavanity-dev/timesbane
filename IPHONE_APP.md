# timesbane as an iPhone app

An assessment and a set of ideas from 2026-11-24. Nothing here is built yet. The ground rules in
[BACKLOG.md](BACKLOG.md) still apply: wordless, optional sources, privacy, no real words on screen.

## Verdict

Worth doing. It belongs with generative art toys and ambient apps: a small but loyal market that sells on mood
and polish, and one Apple tends to feature.

### What the app gives that the site can't

- **Real haptics.** iPhone Safari ignores `navigator.vibrate`, so iPhone visitors never feel the heartbeat in Shy,
  the Sandpile avalanches or the Unbreaking shatter. Core Haptics fixes that.
- **No permission friction.** No motion-access prompt, an option to play sound with the silent switch on, works offline.
- **Presence outside the app:** widgets, StandBy, wallpapers (below).

### Risks and required changes

- **Review guideline 4.2 (minimum functionality).** A wrapped website can be rejected, and a wordless piece can look
  broken to a reviewer. Native features answer the first; the review notes should explain the piece (the README does).
- **The site stays free,** so the app must offer clearly more than the site.
- **Before submission:** remove Google Analytics; keep the memory (visits, stars) in a native file with web storage as
  a mirror (the convention for every app here); keep location opt-in and rounded as the README promises.
- **Discovery:** a wordless piece is hard to sell in screenshots; an app preview video matters most.
- **Name:** check that "timesbane" is free on the App Store.

### Technical route

Capacitor 8 around `index.html`, like the other apps. Points to watch:
- Web Audio in WKWebView follows the silent switch unless the audio session category is set natively.
- Motion through a native plugin rather than `DeviceOrientationEvent.requestPermission`.
- A ProMotion (120 Hz) and low-power pass with `tools/check.mjs`.

## Extending it on iPhone (most valuable first)

1. **Haptics written for each movement:** pendulum ticks, the Rings lock clicking, frost crackling.
2. **Home and Lock Screen widgets:** the Absence tree growing while you're away; today's shared pattern (Today);
   today's Skin pattern.
3. **StandBy and always-on:** Pendulums, released together at the top of every real minute, as a bedside clock.
4. **Keep what you make:** export a Harmonograph drawing, a Frost crystal or an Epicycles stroke as a wallpaper or a
   10-second loop.
5. **iCloud sync** of visits and stars across iPhone, iPad and Mac.
6. **"Traces of strangers"** (BACKLOG): the CloudKit public database can store anonymous gestures with no server to run.
7. **Later:** an Apple TV version.

## Making the content far more variable

1. **Lenses on any movement.** Make the tricks of individual movements a shared layer any movement can wear:
   Shy's freeze when watched, Unbreaking's reversed time, Droste's recursion, Relativity's slowing near the finger.
   24 movements × 6–8 lenses is a few hundred distinct experiences from existing code.
2. **Crossings.** One movement acts on another: the Flock roosts on Chladni's sand figures, Frost grows along
   Labyrinth walls, the Ant walks the Sandpile.
3. **A full genome per movement.** Palette, symmetry, tempo, scale, rule and sound drawn from the visit or day seed,
   over much wider ranges (Gray–Scott alone has dozens of regimes; Skin uses a handful).
4. **More from the phone (all opt-in):** barometer and altitude; compass heading; steps walked ("walk to grow");
   microphone as breath or wind; camera colours as a palette, processed on the phone.
5. **More of the world:** planets at true positions (BACKLOG); moon phase and local tide; aurora (Kp) index;
   ISS overhead; sunrise light angle; weather as sound (BACKLOG).
6. **Longer time scales:** once-per-person doors; a shared piece that takes a real year; movements that exist only at
   a solstice or full moon; a personal garden that lasts months (a Frost crystal that keeps every visit's shape).
7. **New movement ideas:**
   - Fireflies falling into sync (Kuramoto)
   - Slime-mould networks (Physarum)
   - A ripple tank of interfering waves
   - A Shepard tone, a scale that rises forever
   - Penrose tiles growing without repeating
   - A double pendulum
   - Rain on glass
   - Rivers carving a terrain
   - A deep Mandelbrot zoom
   - Aurora driven by real solar activity

**Content after launch:** new settings, seeds and data can arrive from GitHub Pages without an app update. App Store
rule 2.5.2 rules out downloading new movement *code*, so new movements ship as app updates, each a reason to be featured.

## Pricing (recommendation)

Free, with the whole piece included, plus one optional "patron" purchase that unlocks the app-only extras (widgets,
StandBy, exports, lenses). A paywall partway through a wordless artwork would break it; charging for the extras keeps
the app the same as the site.
