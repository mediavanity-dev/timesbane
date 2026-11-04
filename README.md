# timesbane

A wordless, mobile-first artwork at **https://timesbane.com**. It doesn't explain itself, so this file does. **Everything below is a spoiler.**

Planned additions are in [BACKLOG.md](BACKLOG.md).

## Opening

A black screen with one breathing dot. If nothing happens for a few seconds, faint rings pulse out from it. Tap it to begin; that first tap also turns on sound and, on iPhone, asks for motion access. Faint dots circle the opening dot, one for each previous visit. At a mirror minute (1:11, 2:22, 10:10, 11:11, 12:12…) the dot is two.

## The twelve movements

They drift into one another on their own. Add `#m0` to `#m11` to the URL to open one directly.

| # | Movement | Idea | What happens and what you can do |
|---|---|---|---|
| 0 | Shy | Looking at something changes it | A flowing swarm of light. Touch and everything freezes, desaturates and goes quiet, and you hear a heartbeat (with a vibration on Android). Let go and the swarm rushes to where your finger was. Leave it alone and hold the phone still, and it slowly forms an eye that blinks and looks at you, or at where you were, or at the ghost of your past gestures. A shake scatters it |
| 1 | Unbreaking | Time running backwards | Paper covered in black shards. Tap and the shards fly back together (accelerating, as in a rewound film) into a vessel with gold kintsugi seams, which rings like a bell. After a few seconds it breaks again; tap a whole vessel to break it sooner. Drag to sweep debris, tilt to slide it, shake to shatter everything. Vessel shapes are new each visit |
| 2 | The Cave | Dimensions we can't see | A tesseract, a 24-cell or a Clifford torus turning in four dimensions, coloured by its depth in the fourth. You hear each vertex as it crosses into our 3D. Drag to rotate in 4D, tap to make it glow, double-tap for the next shape, tilt or shake to spin it. A small figure on the floor watches its shadow |
| 3 | Asemic | Meaning comes from the reader | An invisible hand writes in a script that isn't a language (a new alphabet every visit). Every few words a real word appears and soon fades; across many words they form sentences ("nobody is writing this", "meaning arrives from you"…) in your language. Drag to smudge the wet ink, tap to move the pen |
| 4 | Droste | Self-reference | A rainbow tunnel of phone screens inside phone screens. Draw into it and your lines spiral down, with a voice that echoes (the sound repeats itself, like the picture). Hold still and the tunnel reverses, pouring screens out toward you. Tilt bends it, shake bursts it; speed and spin are new each visit |
| 5 | Absence | Things grow when you aren't looking | A tree under the real night sky. Hold your finger down and darkness spreads (eyes closed); in the dark the tree grows fast, with a rising melody. Leave the tab and it grows while you're gone. Once in bloom, petals fall, the tree dies and a new seed sprouts. Tilt is wind, shake knocks the blossoms off. One star in the sky for each of your visits; the newest one pulses |
| 6 | Sunflower | One irrational number | Seeds spiral out at the golden angle, 137.5°. Your finger bends the angle by fractions of a degree and the flower collapses into spokes, each count playing a note. Let go and it heals with a bell |
| 7 | Three Bodies | Order is fragile | Three suns on the real figure-eight orbit (Chenciner–Montgomery), playing a repeating rhythm. Tap to add a star, flick to throw one, and the order breaks into chaos. Left alone, a visitor eventually arrives anyway. Escaping suns leave with a low note. Double-tap restores the figure-eight; shake knocks them off course |
| 8 | Butterfly | Sensitive dependence (Lorenz attractor) | 420 points start one ten-millionth apart and move as a single dot for about 25 seconds, then smear across the whole butterfly. Each wing switch is a note, so one note becomes a rain of notes. Tap to collapse the cloud again from that point, drag to turn it, shake to split it at once |
| 9 | Chladni | Sound has shape | Sand on a vibrating plate jumps off the moving parts and settles on the still lines, forming geometric figures. Touch or drag across the plate to change the note; left alone, it changes every few seconds. Shake throws the sand |
| 10 | Epicycles | Anything is circles (Fourier series) | A shape (one of your own past strokes, or an invented one) is redrawn by circles turning on circles, 1, 2, 3, 5, 8… of them as the cycles pass. The circles also sound as a chord. Draw anything and it becomes the new shape |
| 11 | Relativity | Time is not the same everywhere | A grid of ticking clocks. Near your finger, or a slow invisible mass that wanders past, they slow down, turn red and bend inward. Afterwards they stay out of sync, so the single tick becomes a scatter of clicks. Double-tap to resynchronise; shake scrambles them |

## Getting around

- Wait: each movement moves on by itself after about a minute without input. Later visits favour movements you haven't seen yet.
- Tap the slowly turning mark in the bottom-right corner.
- Two-finger swipe left goes forward; two-finger swipe right goes back through where you've been.
- Press and hold the top-left corner: a ring slowly closes, then a door opens to a random movement.
- Turn the phone face-down, then back up: you wake somewhere else.
- The mark in the top-right corner turns sound on and off.

## Sensors and inputs

- **Touch:** tap, hold, drag, flick, double-tap and multi-touch, as described per movement above.
- **Tilt** (orientation): slides the debris in Unbreaking, turns the Cave's 4D object, bends Droste's tunnel, blows the wind in Absence and nudges the Sunflower's angle. On a computer, the mouse position stands in for tilt in the Cave, Droste and Absence.
- **Shake** (accelerometer): scatters Shy's swarm, shatters every vessel, flings the 4D object, bursts the Droste tunnel, shakes the blossoms off the tree, knocks the three suns off course, splits the Butterfly cloud, throws the Chladni sand and scrambles the clocks.
- **Stillness:** Shy's eye only forms while the phone is held still.
- **Compass:** where the phone reports a heading, the sky in Absence turns as you turn.
- **Vibration:** Android only.
- **Leaving the tab:** Absence keeps growing, and the tab title changes to a line for each movement (below).

iPhone asks for motion access on the first tap.

## Memory: never the same twice

Everything is kept in this browser's `localStorage`, and nothing leaves the device.

- **Your ghost:** your past gestures replay as a ghost. Shy's swarm freezes where the ghost "touches", and the eye sometimes watches it instead of you. Droste draws the ghost's strokes into the tunnel, and Epicycles redraws your old strokes as circles.
- **Each visit is new:** a new alphabet, flow field, eye shape, set of vessel shapes, tunnel speed and spin, starting 4D view and tree.
- **Never the same place:** it remembers which movements you've seen. The first visit starts with Shy; later visits start with what you've seen least.
- **It ages with you:** one dot at the opening and one star in the sky per visit, and the tree starts larger the more often you've come.

## Context and privacy

It knows *when* you are, and roughly where:

- **The real sky in Absence:** the 53 brightest stars, with faint lines for Orion, the Plough, Cassiopeia, the Summer Triangle and the Southern Cross. The Moon is drawn at its real position and phase, and the sky colour follows the real Sun through night, twilight, sunrise glow and day.
- **Seasons:** the tree carries frost, blossom, leaves or turning leaves for your season and hemisphere (in autumn they fall sooner).
- **Language:** Asemic's real words are in your browser language (English, Spanish, French, German, Portuguese or Italian).
- **Small touches:** Droste's colours start from the hour of day, and the Sunflower turns the other way in the southern hemisphere.

**What it uses.** Without permission it uses only the clock, timezone and browser language, which every page can read. Your approximate position is guessed from your timezone.

**Location is opt-in only.** Double-tap in Absence and the browser asks. If you allow it:
- the sky snaps to your exact place, and that place grows its own tree;
- the coordinates are rounded to about 1 km and never stored or sent anywhere;
- if permission was granted earlier, it is reused without asking again.

The site also carries the shared Google Analytics tag, which records ordinary page visits.

## Secrets

None of these is hinted at, and missing them costs nothing. Each first discovery adds one gold star to the night sky in Absence. That is the only record.

| Where | Secret | Depends on |
|---|---|---|
| Shy | Leave the formed eye alone and hold the phone still, and it falls asleep to a lullaby. Touch wakes it with a start | Patience; it tires sooner between 10 pm and 5 am |
| Shy | Tap exactly while it blinks and it winks back | Timing |
| Unbreaking | Tap a vessel in the instant it breaks (a quick double tap): time stops, the shards hang, then rewind | Timing |
| Unbreaking | Get all three vessels whole at once: they ring together and stay gold for the rest of the visit | Speed |
| The Cave | Tap the little figure and it turns and walks away. It doesn't come back this visit | Curiosity |
| Asemic | On a full or new moon, the hidden sentence is about tonight's moon | The real moon |
| Droste | Hold perfectly still at the exact centre of the tunnel and you fall through to the eye | Stillness |
| Absence | Tap a falling star to keep a wish (a pale star, forever) | Real darkness, luck |
| Absence | Tap the real moon and the blossoms turn silver | The moon being up |
| Absence | On the anniversary of your first visit, the tree is in full golden bloom | A year |
| Sunflower | Bend the angle to a Fibonacci number of spokes (5, 8, 13, 21, 34, 55) and hold it | Precision |
| Three Bodies | If exactly two suns are left and stay together, they marry: gold trails, a duet | Chaos, luck |
| Butterfly | Tap the orange point itself and the two butterflies become one | Aim |
| Chladni | Hold one note without moving for eight seconds and the plate resonates and throws its sand | Patience |
| Epicycles | Draw a near-perfect circle: it needs only one circle, and it turns gold | A steady hand |
| Relativity | Three fingers make an event horizon that swallows clocks | Three fingers |
| Relativity | At the real top of the hour, the clocks strike the hour together and resynchronise | The clock |
| Everywhere | Below 15% battery, unplugged, the piece is tired: slower and dimmer | Your battery (Chrome/Android) |
| Opening | At a mirror minute the first dot is two | The clock |

## When you look away

The tab title is "timesbane" while you watch. When you switch tabs it changes to:

| Movement | Title while you're away |
|---|---|
| Shy | it can still see you |
| Unbreaking | something is falling apart |
| The Cave | we were only shadows |
| Asemic | it is still writing |
| Droste | you are inside this |
| Absence | it is growing |
| Sunflower | 137.507764° |
| Three Bodies | three is already too many |
| Butterfly | a small difference |
| Chladni | the plate is still ringing |
| Epicycles | everything is circles |
| Relativity | time is passing differently here |

## Sound

Everything is synthesised live with Web Audio: a drone in a different key for each movement, reverb, and an echo line. Nearly every sound is the maths itself, not a soundtrack:
- vertices crossing into the 4th dimension (the Cave);
- Lorenz wing switches (Butterfly);
- orbital turning points (Three Bodies);
- spoke counts (Sunflower);
- Fourier coefficients as a chord (Epicycles);
- clock ticks (Relativity).

## Tech

One file, `index.html`: Canvas 2D and Web Audio, no dependencies and no build step; only the Cormorant Garamond font loads from Google Fonts. It's hosted on GitHub Pages from `main`, with the custom domain set in `CNAME`.

GoDaddy DNS for `timesbane.com`: four `A` records on `@` pointing to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153, plus a `CNAME` on `www` pointing to `mediavanity-dev.github.io`.

The site also appears on the repo dashboard at https://mediavanity-dev.github.io/dashboard/, which discovers public repos automatically.
