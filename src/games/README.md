# Game modules

The Game page (`src/pages/game/`) owns everything around the playfield: the setup
panel, the scoreboard and player cards, pause / restart / resign, the how-to-play
box and the result popup. A **game module** owns only what happens inside the
playfield. That split is what lets each of the remaining games be added on its own.

## What is playable today

| Game | Status | Modes | Notes |
| --- | --- | --- | --- |
| Ping Pong | playable | vs bot, two players on one device, watch bots | Real-time physics at a fixed 120 Hz step. First to 5, 7 or 11. |
| Checkers | playable | vs bot, two players on one device, watch bots | English draughts: compulsory and multi-jump captures, kings, draws. |
| Chess | playable | vs bot, two players on one device, watch bots | Full rules: castling, en passant, promotion, check / mate / stalemate, 50-move, threefold, insufficient material. |
| The other nine | **planned** | none | They have a page that says what is still needed. They have no gameplay. |

Not built for any game: online play (there is no server), ratings changes from
practice games, clocks, sound, undo, saved games. The Online mode in the setup panel
is shown disabled with the reason.

Bots run on the main thread under a time budget (no Web Worker), so the strongest
levels are modest on purpose. Chess "hard" answers in about a second.

## How the pieces fit

```
data/games.ts          catalog entry: status 'playable' | 'planned'
data/gamePlans.ts      the to-do list shown for planned games only
games/playable.ts      list of ids that have a module (no React, so scripts can import it)
games/registry.ts      id -> GameModule; typed as a full Record so drift fails the build
games/types.ts         the GameModule contract
games/<id>/engine.ts   the rules, plain TypeScript, no React or DOM
games/<id>/bot.ts      the computer player
games/<id>/<Id>Play.tsx  the playfield component
games/<id>/index.ts    exports the GameModule
scripts/verify-engines.ts  rule tests that run in Node
```

## Adding a game, step by step

Use `pong/` (real time) or `checkers/` (turn based) as a template.

1. **Write the rules as plain TypeScript** in `games/<id>/engine.ts`. No React, no
   DOM, no `Math.random()` you can't inject: take a `random: () => number`
   argument so tests can be seeded (`seededRandom` is in `lib/format.ts`).
2. **Test the rules in Node** by adding a section to `scripts/verify-engines.ts`.
   Test the edge cases, not just the happy path. Two examples of what this caught:
   Pong bots that never missed made a "watch bots" match last forever, and a
   bot that kept a bad read between serves lost every point after its first miss.
   Both were found by running whole bot-vs-bot matches, so do that for your game.
3. **Write a bot** in `bot.ts` with `easy | medium | hard` profiles. For turn-based
   games use the `useBotTurn` hook in `games/hooks.ts` to schedule it.
4. **Write `<Id>Play.tsx`.** It receives `GamePlayProps`:
   - `seats` and `setup` say who is playing and how;
   - report progress with `onStatus({ headline, detail, activeSeat, scores })`;
   - call `onFinish({ winnerSeat, reason, scoreText })` exactly once when the rules
     end the game (the platform shows the winner popup);
   - ignore input while `paused` or `finished`.
   For 8 x 8 boards, `Board8.tsx` gives you a responsive, keyboard-accessible grid.
5. **Export the module** from `games/<id>/index.ts`: `setupFields`, `rules`,
   `controls`, `mySeat`, `seatLabels`, `formatLabel`, and `pausable` / `resignable`.
6. **Register it** in three places:
   1. `games/registry.ts`: add it to the `modules` table;
   2. `games/playable.ts`: add its id to `playableGameIds`;
   3. `data/games.ts`: change its `status` from `'planned'` to `'playable'`.
   If you forget one, `tsc` (registry vs playable) or `verify-engines.ts` (catalog vs
   playable) fails, so a game can't show up as playable without working gameplay.
7. **Delete its entry from `data/gamePlans.ts`.** The verify script fails if a
   playable game still has a plan.
8. Run the checks below, then play it for real in the browser. A passing type
   check is not the same as a game that works.

## Games that need a server

Sketch & Guess, Doodle Relay, Codewords, Party Pack, Map Guess, Wild Cards, Snap
Roulette, Quiz Blitz and Puzzles all need something this project doesn't have yet:
shared state between players, a content set (words, prompts, photos, questions, map
imagery) or both. `data/gamePlans.ts` lists what each needs and a sensible first
step. Several can ship first as a pass-the-device or play-against-bots version using
the same module contract, as long as the setup panel and the page say exactly that.

## Checks

```
npx tsx scripts/verify-engines.ts   # rules, bots and catalog consistency, in Node
npx tsc -b                          # type check (also run by npm run build)
npm run lint                        # oxlint
npm run build                       # tsc -b && vite build
```
