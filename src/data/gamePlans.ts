import type { GameId, GamePlan } from '../types'

// What each planned game still needs. Nothing here is gameplay: it is the to-do
// list shown on the game's page so "planned" is never mistaken for "playable".
// When a game gets a module in src/games/registry.ts, flip its status in
// data/games.ts and delete its entry here.
export const gamePlans: Partial<Record<GameId, GamePlan>> = {
  'sketch-guess': {
    inspiredBy: 'Skribbl.io / Sketchful.io',
    howItPlays: 'Each round one player draws a secret word while everyone else types guesses. Faster correct guesses score more.',
    needsServer: true,
    needs: [
      'Live sharing of drawing strokes between players (WebSocket or similar)',
      'A drawing canvas with pen, colour, size and undo',
      'A word list, turn order, round timer and scoring',
      'Guess matching, with close guesses hidden from other players',
    ],
    firstStep: 'Build the drawing canvas and the word-pick/turn logic as a pass-the-device prototype, then add the network layer.',
  },
  'doodle-relay': {
    inspiredBy: 'Gartic Phone',
    howItPlays: 'Everyone writes a prompt, then each chain alternates between drawing the previous text and describing the previous drawing.',
    needsServer: true,
    needs: [
      'Server-side chains of prompt → drawing → caption that pass between players',
      'A drawing canvas that exports an image',
      'Round timers and a reveal screen that replays each chain',
    ],
    firstStep: 'Write the chain data model and the reveal screen, using canned sample chains.',
  },
  codewords: {
    inspiredBy: 'Codenames',
    howItPlays: 'Two teams share a 5×5 grid of words. Each spymaster gives a one-word clue and a number; teammates guess the matching words.',
    needsServer: true,
    needs: [
      'Hidden key card that only spymasters can see',
      'Team and role assignment, clue entry and turn tracking',
      'A word bank and win detection (all words found or the assassin hit)',
    ],
    firstStep: 'Build the board, key card and turn rules as a hot-seat game on one screen.',
  },
  'party-pack': {
    inspiredBy: 'Jackbox Party Packs',
    howItPlays: 'A host screen runs short mini-games while players answer on their own devices.',
    needsServer: true,
    needs: [
      'Room codes with a host screen and controller screens',
      'A mini-game interface so each round type is a plug-in',
      'Per-game prompts, voting and scoring',
    ],
    firstStep: 'Define the mini-game plug-in interface, then implement one simple round type (for example, a funny-answer vote).',
  },
  'map-guess': {
    inspiredBy: 'GeoGuessr',
    howItPlays: 'You are shown a street-level view of somewhere on Earth and pin where you think it is. Closer pins score more.',
    needsServer: false,
    needs: [
      'A licensed source of location imagery (a map provider key or an open image set)',
      'An interactive world map for placing a guess',
      'Distance-based scoring over several rounds',
    ],
    firstStep: 'Pick the imagery source. The rest (map, scoring) can be built and played solo with no server.',
  },
  'card-chaos': {
    inspiredBy: 'Cards Against Humanity',
    howItPlays: 'Each round a judge reads a prompt card. Everyone else plays their funniest answer card, and the judge picks the winner.',
    needsServer: true,
    needs: [
      'Prompt and answer card decks (written by you, not copied from the original game)',
      'Hands that stay hidden from other players',
      'Rotating judge, submissions and a score table',
    ],
    firstStep: 'Write the deck format and the round state machine, and test it with bots that pick random cards.',
  },
  'snap-roulette': {
    inspiredBy: 'Photo Roulette',
    howItPlays: 'A random photo from someone’s camera roll appears. Everyone guesses whose it is.',
    needsServer: true,
    needs: [
      'Photo upload with explicit consent and a way to remove photos',
      'Storage and moderation for uploaded images',
      'Guess collection, reveal and scoring',
    ],
    firstStep: 'Design the consent and upload flow first. The privacy work is the hard part of this game.',
  },
  'quiz-blitz': {
    inspiredBy: 'Kahoot',
    howItPlays: 'A host shows a question and four answers. Players tap one; faster correct answers earn more points.',
    needsServer: true,
    needs: [
      'A quiz format and a way to author or import question sets',
      'Join codes, a host view and live answer collection',
      'Speed-weighted scoring and a podium screen',
    ],
    firstStep: 'Build the quiz format and a solo mode that scores speed, then add hosted rooms.',
  },
  puzzles: {
    inspiredBy: 'Jigsaw and sliding-tile races',
    howItPlays: 'Everyone gets the same puzzle and races to finish it first.',
    needsServer: false,
    needs: [
      'A puzzle generator (jigsaw, sliding tiles or word grid) with a solved-state check',
      'Drag or tap controls that work on touch',
      'For races: a shared seed so every player gets the same puzzle',
    ],
    firstStep: 'Solo sliding-tile puzzle with a timer. It needs no server and proves the puzzle interface.',
  },
}
