# Backlog

Ideas for timesbane that haven't been built. What already exists is in the [README](README.md).

## Ground rules for everything here

- **Wordless and restrained.** No instructions, no UI, no score. A new experience must not get in the way of someone who never finds it.
- **Optional and robust.** Each external data source is cached, fails silently, and the piece works fully without it.
- **Privacy.** Location is opt-in only (the existing double-tap in Absence), rounded, and never stored. Anything that sends rough coordinates to a third party, such as a weather API, has to be listed in the README's privacy section first. That would change the current promise that location is "never sent anywhere", so confirm the trade-off before building.
- **Discoveries leave a gold star.** New secrets call `found(id)`; the only record is the gold star in the Absence sky.

## Undecided

1. **A secret you can trigger in Asemic.** Right now its only secret depends on the moon. Idea: smudge an entire line away, and the pen pauses and writes one real word where it was.
2. **The hidden constellation.** The gold stars for the secrets you can make happen by action sit on the points of one constellation. Once all are found, its lines join and the figure is Shy's eye. Secrets that depend on the moon, the anniversary, the hour, the battery or a mirror minute stay outside the set as pure gifts.

## Calendar

- Solstices and equinoxes: the longest and shortest light.
- Meteor-shower nights (Perseids around 12 August, Geminids around 14 December): far more falling stars in Absence.
- Eclipses.
- Leap day (29 February).
- Pi day (14 March), for the Sunflower or Epicycles.
- Fibonacci day (23 November).
- Friday the 13th.
- New Year's midnight.
- Visit milestones (the 10th, 100th…).
- Day-of-week moods.
- Festivals: Halloween and Día de Muertos, Diwali, Lunar New Year (these need date tables).

## Location (opt-in)

- Latitude-specific skies: midnight sun and polar night, auroras at high latitudes.
- Nearness to the equator or a tropic.
- Ocean versus inland.
- Altitude from the phone's position data.
- Real sunrise and sunset times driving the palette.
- The antipode: the point on the opposite side of the Earth.
- Distance travelled since the last visit (coarse, kept for the visit only).

## Time of day

- Golden hour and blue hour around the real sunrise and sunset.
- The dead of night (3–4 a.m.): movements behave strangely or run slower.
- A dawn chorus in the sound near sunrise.
- True noon: the Cave figure's shadow disappears.
- Exactly midnight, and the minutes counting down to each hour.
- Lunch-time and commute rhythms.
- Your usual visiting hour versus an unusual one (remembered in `localStorage`).
- Session length: the piece grows drowsy after about 20 minutes.

Already built: the sky follows the real sun, Shy sleeps sooner at night, Relativity strikes the hour, and mirror minutes double the opening dot.

## Weather

| Source | Needs | Notes |
|---|---|---|
| Open-Meteo (`api.open-meteo.com`) | Coordinates | Free, no key, works from a web page |
| NOAA space weather (geomagnetic Kp index) | Nothing | Check that a web page can read it directly |
| USGS earthquake feeds | Nothing | Free, works from a web page |

Experiences:
- rain or snow in Absence, and Asemic's ink running in the rain;
- wind driving the tree's sway and Droste's spin;
- real cloud cover hiding the real stars;
- fog softening everything;
- thunderstorms bringing lightning and a thundering Chladni plate;
- temperature tinting the palette;
- auroras on geomagnetically active nights;
- a recent large earthquake making the Chladni plate tremble by itself.

Implementation: use weather only after the location opt-in or with the timezone guess; round coordinates to about 0.1° (~10 km); fetch at most every 30 minutes; do nothing when offline.

## Other public data

For each source, check whether a web page can call it directly (CORS), what the rate limits are, and whether it needs a key.

### Sky and space

| Data | Source | Experience |
|---|---|---|
| ISS position | wheretheiss.at | A steady light crosses the Absence sky when the ISS is really overhead |
| Near-Earth asteroids passing today | NASA NeoWs (free key, or the low-limit demo key) | Today's closest asteroid becomes the Three Bodies visitor, with its real speed and size |
| Solar flares and solar storms | NASA DONKI, NOAA space weather | The Cave's 4D object flares; auroras |
| Astronomy picture of the day | NASA APOD | Its colours become the day's palette (the image is never shown) |

### The planet

| Data | Source | Experience |
|---|---|---|
| Earthquakes | USGS | The Chladni plate trembles by itself |
| Species observed nearby | iNaturalist (location needed) | The local species count sets the tree's branching and colours |
| Air quality and pollen | Open-Meteo Air Quality | Haze; pollen drifting through the Sunflower |
| Tides | NOAA tides (US only) | A tide line at your nearest coast |
| This day 50 years ago | Open-Meteo historical weather | A ghost tree grown in that day's temperature, beside today's |
| CO₂, Arctic ice, temperature anomaly | global-warming.org | A very slow layer, e.g. Unbreaking's white region shrinking with the real Arctic ice |
| Grid carbon intensity | carbonintensity.org.uk (UK only) | The glow dims when the electricity is dirtier |

### Humanity in real time

| Data | Source | Experience |
|---|---|---|
| Every Wikipedia edit, live | Wikimedia's live event stream | Each edit anywhere becomes a faint particle and note; pairs with Asemic |
| Bitcoin blocks | mempool.space | Each new block makes a vessel whole |
| Public holidays | Nager.Date | The piece knows when it's a holiday where you are (country from the timezone) |
| Aircraft overhead | OpenSky Network (rate-limited; browser access uncertain) | Real planes cross your sky as slow lights |
| Artworks | Art Institute of Chicago, the Met | The palette comes from a painting made on this date in history |
| Atmospheric randomness | random.org (key for the modern version) | Seeds from real atmospheric noise |

### Top picks

1. Wikipedia's live edits (no location needed, strongest fit).
2. The ISS overhead.
3. Today's asteroid as the Three Bodies visitor.
4. The 50-years-ago tree.
5. iNaturalist's local species (after the location opt-in).

## How to build

- **Where things go:** follow the existing patterns in `index.html`:
  - `found(id)` for discoveries;
  - the `CTX`, `sky()` and `season()` helpers for context;
  - each movement's `frame`, `down`, `up`, `move`, `dbl`, `shake` and `away` handlers.
- **Patch safely:** edit with a script that checks each anchor appears exactly once.
- **Test:** check in headless Edge with a timer-driven frame loop and synthetic pointer, motion and orientation events, then watch for JS errors.
- **Document:** add new spoilers to the README's Secrets table.
