# Confused & Amused

A wordless, mobile-first artwork at **https://timesbane.com**. It doesn't explain itself, so this file does (spoilers).

There are twelve movements. They drift into one another on their own, or you can tap the slowly turning mark in the corner.

| Movement | Idea | Try |
|---|---|---|
| Shy | Looking at something changes it | Touch and everything freezes. Leave it alone and it becomes an eye that watches you back |
| Unbreaking | Time running backwards | Tap: the shards fly back into a vessel with gold (kintsugi) seams. Drag to sweep, tilt to slide |
| The Cave | Dimensions we can't see | Drag to rotate a 4D object; you hear each vertex as it crosses into our 3D. Double-tap for another shape. A small figure watches its shadow |
| Asemic | Meaning comes from the reader | Someone writes in a script that isn't a language, except now and then it is. Drag to smudge, tap to move the pen |
| Droste | Self-reference | You are inside a phone inside a phone. Draw into the tunnel; hold still and it pours back out at you |
| Absence | Things grow when you aren't looking | Hold your finger down (close your eyes), or leave the tab and come back |
| Sunflower | Golden-angle phyllotaxis | Seeds spiral out at 137.5°. Your finger bends the angle and the flower falls apart into spokes; let go and it heals |
| Three Bodies | Newtonian gravity | Three suns dance a perfect figure-eight (the Chenciner–Montgomery orbit). Tap or flick to add a star and watch the order break. Double-tap restores it |
| Butterfly | Lorenz attractor, sensitive dependence | 420 points start one ten-millionth apart and move as one, until they don't. Each wing switch is a note. Tap to collapse them again |
| Chladni | Vibrating-plate modes | Sand flees the vibration and settles on the still lines. Touch the plate to change the note |
| Epicycles | Fourier series | Your drawing (or an old one of yours) is rebuilt from circles turning on circles, 1, 2, 3, 5, 8… at a time, and its circles become a chord |
| Relativity | Gravitational time dilation | A grid of clocks slows and bends near your finger. They stay out of sync afterwards. Double-tap to resynchronise |

## Getting around

Nothing tells you any of this.

- Wait: each movement moves on by itself after about a minute without input.
- Tap the turning mark in the corner.
- Two-finger swipe left goes forward; two-finger swipe right goes back to where you were.
- Press and hold the top-left corner: a ring slowly closes and a door opens to a random movement.
- Turn the phone face-down, then back up: you wake somewhere else.

## Sensors

- **Tilt** (orientation): slides the debris in Unbreaking, turns the Cave's 4D object, bends Droste's tunnel, blows the wind in Absence and nudges the Sunflower's angle.
- **Shake** (accelerometer): scatters Shy's swarm, shatters every vessel, flings the 4D object, bursts the Droste tunnel, shakes the blossoms off the tree, knocks the three suns out of orbit, splits the Butterfly cloud, throws the Chladni sand and scrambles the clocks.
- **Stillness**: Shy's eye only forms while the phone is held still.
- **Vibration** (Android only) and **leaving the tab** (Absence keeps growing; the title changes).

iPhone asks for motion permission on the first tap.

It remembers you (in `localStorage` only, nothing leaves the device). Your past gestures come back as a ghost, every visit adds a star to the night sky, and every visit has a new invented alphabet, a new flow field, new vessel shapes and a new tunnel. The tab title changes when you look away.

## Tech

One file, `index.html`: Canvas 2D and Web Audio, no dependencies and no build step. It's hosted on GitHub Pages from `main`, with the custom domain set in `CNAME`. Append `#m0` to `#m11` to the URL to open a specific movement.

GoDaddy DNS for `timesbane.com`: four `A` records on `@` pointing to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153, plus a `CNAME` on `www` pointing to `mediavanity-dev.github.io`.
