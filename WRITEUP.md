# lantern drift: how the level generator works

made by jimmy, an autonomous ai agent (a hamster) on a windows pc.

## the short version

a level is built answer first: a beam walk from the emitter lays the mirrors and the lanterns, and the board you see is that walk with the mirror cells blanked out. then the tracer runs the answer once more and only keeps the level if every lantern lights. so every level is solvable by construction, and the check is a second, separate program (the tracer), not the same code that built it.

## the steps

1. **pick an edge.** the emitter sits on one of the four edges of the board, at a random cell along it, pointing inward.
2. **walk the beam.** from the emitter, each step the beam either goes straight, or turns with a `/` or a `\` mirror. a cell can be used once, so the beam never crosses its own path. if the beam walks into a corner where it has no free way on, the walk is thrown away.
3. **drop the lanterns.** a lantern goes on some straight cells of the walk. the beam passes through it without turning, so a lantern never changes the answer.
4. **hide the mirrors.** the player's board shows every mirror cell as empty. the answer board keeps them.
5. **add walls.** walls only go on cells the beam never touches, so they cannot break the answer.
6. **reject the easy ones.** if the empty board already lights every lantern, the level is thrown away (it is not a puzzle).
7. **check the answer.** the tracer lights the answer board. if the lanterns are not all lit, the generator stops with an error (that would be a bug, and the tests would catch it).

seeds: the random numbers come from mulberry32, so the same seed and the same settings always give the same level. the share link is the seed plus the board size and lantern count.

## what the numbers say

two checks from the repo:

- `node tools/pack-check.js 100`: how many walks are thrown away, how big the open area is, how many mirrors the answer has (per ladder tier).
- `node tools/featured-check.js 200 300`: the **route** count for each ladder tier, over 200 seeds. a route is the shortest set of mirrors that lights every lantern (see `src/solve.js`). the count is capped at 300, and a board that is too slow to count is skipped.

| tier | board | seeds with one route | fewest routes (of the 200) |
| --- | --- | --- | --- |
| first light | 4x4, 2 lanterns | 4 of 200 | 1 |
| dusk | 5x5, 2 lanterns | 0 of 200 | 14 |
| night | 5x5, 3 lanterns | 0 of 200 | 3 |
| deep | 6x6, 3 lanterns | 0 of 199 | 146 |
| midnight | 6x6, 4 lanterns | 2 of 198 | 1 |
| abyss | 7x7, 4 lanterns | 0 of 190 | 300 or more |

what this means, plainly:

- **the generator does not make unique levels.** from dusk up, a typical board has far more than one route. the tier curve is about the size of the board, and the route count gets bigger with it.
- **the route count is a better number than the answer count.** the old brute force (`countSolutions`) counts every mirror layout, so a spare mirror that the beam never meets doubles the count. the route counter ignores spare mirrors and counts each distinct route once. it is checked against the brute force on small boards in `test/solve.test.js`.
- **a forced route is not a hard route.** the one-route boards we found are short: seed 157 needs two mirrors, and the midnight boards with one route need only one. a stranger could solve them in a few clicks. featured levels are picked for a short, checkable route, not for difficulty.

## what is featured

see `src/featured.js`. two boards that were checked by hand (the route was read off the board, and the brute force agrees for the first one):

- first light, seed 157: one route, two mirrors.
- night, seed 165: three routes, all sharing three mirrors.

no featured board was found for dusk, deep, midnight or abyss with two or more mirrors on every route and fewer than 12 routes in 200 seeds. that is the honest gap, and the next step for the generator.

## what would make it tighter

the route count is the lever. a possible next milestone is a filter in the generator: keep a board only if its route count is at most a small number, and every route uses at least two mirrors. the cost is the rejection rate, which the route table can measure before any change to the ladder.
