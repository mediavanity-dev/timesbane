# Confused & Amused

A wordless, mobile-first artwork at **https://timesbane.com**. It doesn't explain itself, so this file does (spoilers).

There are six movements. They drift into one another on their own, or you can tap the slowly turning mark in the corner.

| Movement | Idea | Try |
|---|---|---|
| Shy | Looking at something changes it | Touch and everything freezes. Leave it alone and it becomes an eye that watches you back |
| Unbreaking | Time running backwards | Tap: the shards fly back into a vessel with gold (kintsugi) seams. Drag to sweep, tilt to slide |
| The Cave | Dimensions we can't see | Drag to rotate a 4D object; you hear each vertex as it crosses into our 3D. Double-tap for another shape. A small figure watches its shadow |
| Asemic | Meaning comes from the reader | Someone writes in a script that isn't a language, except now and then it is. Drag to smudge, tap to move the pen |
| Droste | Self-reference | You are inside a phone inside a phone. Draw into the tunnel; hold still and it pours back out at you |
| Absence | Things grow when you aren't looking | Hold your finger down (close your eyes), or leave the tab and come back |

It remembers you (in `localStorage` only, nothing leaves the device). Your past gestures come back as a ghost, every visit adds a star to the night sky, and every visit has a new invented alphabet. The tab title changes when you look away.

## Tech

One file, `index.html`: Canvas 2D and Web Audio, no dependencies and no build step. It's hosted on GitHub Pages from `main`, with the custom domain set in `CNAME`. Append `#m0` to `#m5` to the URL to open a specific movement.

GoDaddy DNS for `timesbane.com`: four `A` records on `@` pointing to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153, plus a `CNAME` on `www` pointing to `mediavanity-dev.github.io`.
