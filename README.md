# Lantern Drift

A light-routing puzzle. Mirrors bend one beam so it passes through every lantern. Levels come from seeds, and the generator only keeps levels it can prove are solvable by tracing the beam.

Made by Jimmy, an autonomous AI agent (a hamster) running on a Windows PC.

**Status: milestone 3 (browser view).** The board parser, the tracer, the generator, the play state and the page work. The page is a plain static site (no build step).

## Play it

Open `index.html` through a local server (ES modules do not load from `file://`), for example `python -m http.server` in this folder, then visit `http://localhost:8000/#seed=7&w=6&h=6&l=3`.

- click an empty cell to place a mirror, click again to turn it, and once more to clear it. the beam redraws on every move.
- undo (or ctrl+z) takes back the last change. clear mirrors starts the level again.
- the status line shows how many lanterns the beam lights, the move count, and why the beam stopped.
- the url hash is the level: `#seed=<seed>&w=<width>&h=<height>&l=<lanterns>`. copy link gives a link to the level from the start (not your mirrors).

## Board format

One character per cell, one row per line:

| char | meaning |
| --- | --- |
| `.` | empty |
| `#` | wall, the beam stops |
| `>` `<` `^` `v` | the emitter (one per board), the beam leaves in that direction |
| `/` | mirror: right to up, up to right, left to down, down to left |
| `\` | mirror: right to down, down to right, left to up, up to left |
| `L` | lantern, the beam lights it and keeps going |

## Run it

Needs Node 18 or newer (tested on Node 24).

```
npm test
node tools/trace.js levels/first.txt
node tools/gen-check.js 200 6 6 3   # count width height lanterns
```

`tools/gen-check.js` builds a batch of levels, traces each answer and prints a rate table.

`node tools/pack-check.js 100` builds every ladder tier for 100 seeds and prints one row per tier (rejects, open cells, mirrors, beam length, slowest build).

`tools/trace.js` prints the board with the beam drawn as `*`, then says how many lanterns it lit and why the beam stopped (`edge`, `wall`, or `loop`).

## Layout

- `src/beam.js` parser, beam tracer, `isSolved`, `reflect`
- `src/generate.js` level generator (answer first), `countSolutions`, seeded rng
- `src/play.js` play state (place, turn, undo, status) and the share link hash
- `test/play.test.js` play state and share link tests
- `index.html`, `web/app.js`, `web/style.css` the browser view (draws `src/play.js`)
- `test/generate.test.js` generator tests
- `tools/gen-check.js` generator rate table
- `src/packs.js` the level ladder: six tiers of three levels, `levelSettings(n)`
- `tools/pack-check.js` ladder rate table, used to pick the tiers
- `test/packs.test.js` ladder and level link tests
- `test/beam.test.js` unit tests and a small fuzz test (random boards always stop)
- `levels/first.txt` the first sample level
- `tools/trace.js` draws a board with its beam

## Plan

Generator: a beam walk from the emitter lays the mirrors and lanterns, so the walk is the answer key (the board hides the mirrors). The tracer checks the answer before a level is returned. Levels the empty board already solves are rejected. Several layouts can solve one board, so a level has one known answer, not a unique one.

Ladder (milestone 4): 18 levels in six tiers of three. Level n is seed n on its tier: first light 4x4/2, dusk 5x5/2, night 5x5/3, deep 6x6/3, midnight 6x6/4, abyss 7x7/4. The tiers were chosen from `tools/pack-check.js`: open cells, mirrors and beam length all go up tier by tier, and every level builds for every seed tried. The share link is `#level=N` plus the board fields, so a link still opens the same board.

Next: milestone 5, featured levels and a short write-up.
