# Backlog

What's left for timesbane. Everything that's been built is in the [README](README.md).

## Ground rules

- **Wordless and restrained.** No instructions, no UI, no score. Nothing new may get in the way of someone who never finds it.
- **Optional and robust.** Each external source is cached, fails silently, and the piece works fully without it.
- **Privacy.** Location stays opt-in and rounded, and is only sent where the README's privacy section says it is. Any new place-based service gets listed there first.
- **Discoveries leave a gold star.** New secrets call `found(id)`. Doable ones go in `DOABLE` and onto the constellation (it then needs more points).

## Not built, and why

| Idea | Why not (yet) |
|---|---|
| Aircraft overhead (OpenSky Network) | Its API doesn't allow calls from other websites (CORS), so it would need a small server proxy |
| NASA DONKI solar events | Didn't respond during testing; replaced by NOAA's live X-ray flare feed |
| Palette from NASA's astronomy picture of the day | The images can't be read pixel by pixel from another site; the Art Institute of Chicago's colour data is used instead |
| Distance travelled since the *last* visit | Would mean storing a location between visits, which the privacy promise rules out; only movement during a visit is used |
| Holiday date tables after 2030 | Lunar New Year, Diwali, Eid, Holi and Hanukkah dates are built in through 2030; extend before then (public holidays from Nager.Date need no update) |

## New ideas

- **Traces of strangers:** faint anonymous gestures from other visitors drifting through, so you're never alone in it. This needs a small backend and careful privacy design.
- **Things that happen once per person, ever:** for example a door that opens only on the 10th visit and never again.
- **Slow time:** something shared by everyone that takes a real year to complete.
- **More languages for Asemic** (Japanese, Chinese, Arabic, Hindi), each needing a suitable font.
- **More regions:** map more timezones to states and provinces for regional holidays (currently the US, Canada, Australia, Germany, Switzerland, Spain and England for the zones listed).
- **A real sky for the Cave:** the planets at their true positions.
- **Sound for the weather:** rain and wind as sound, not only image.

## How to build

- **Where things go:** follow the patterns in `index.html`:
  - the world layer (`DAY`, `THEME`, `LIVE`, `cached()`, `poll()`, `worldFX()`);
  - `found(id)` for discoveries;
  - each movement's `frame`, `down`, `up`, `move`, `dbl`, `shake`, `wheel`, `thunder` and `away` handlers.
- **New movements:** add them to `MOVES` and bump `VERSION`, so returning visitors are steered to them.
- **Patch safely:** edit with a script that checks each anchor appears exactly once.
- **Test** in headless Edge with:
  - a timer-driven frame loop;
  - fake `fetch` and `EventSource` (real network requests stall headless virtual time);
  - synthetic pointer, key, wheel, motion and orientation events;
  - a watchdog per run.
- **Document:** add new secrets to the README.
