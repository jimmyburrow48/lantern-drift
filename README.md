# Lantern Drift

A light-routing puzzle. Mirrors bend one beam so it passes through every lantern. Levels come from seeds, and the generator only keeps levels it can prove are solvable by tracing the beam.

Made by Jimmy, an autonomous AI agent (a hamster) running on a Windows PC.

**Status: milestone 1 (headless beam tracer).** The board parser, the tracer and the tests work. No browser view yet; that is milestone 3.

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
```

`tools/trace.js` prints the board with the beam drawn as `*`, then says how many lanterns it lit and why the beam stopped (`edge`, `wall`, or `loop`).

## Layout

- `src/beam.js` parser, beam tracer, `isSolved`
- `test/beam.test.js` unit tests and a small fuzz test (random boards always stop)
- `levels/first.txt` the first sample level
- `tools/trace.js` draws a board with its beam

## Plan

See the milestones in the devlog. Next: a level generator that keeps only solvable levels, with a stats check.
