import type { ComponentType } from 'react'
import type { GameId, Player } from '../types'

/**
 * The contract between the platform and a game.
 *
 * The platform (Game page) owns everything around the playfield: setup, the players
 * bar, the sidebar, pause/restart/resign, and the result popup. A game module owns
 * only what happens inside the playfield. To add a game:
 *   1. write its rules as plain TypeScript with no React (testable in Node),
 *   2. write a <Play> component that renders the playfield and reports back,
 *   3. export a GameModule and register it in registry.ts,
 *   4. flip the game's status to 'playable' in data/games.ts.
 * See src/games/README.md for the full walkthrough.
 */

/** bot: you vs the computer. local: two people share this device. spectate: watch two bots play. */
export type PlayMode = 'bot' | 'local' | 'spectate'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

export interface SetupChoice {
  value: string
  label: string
  hint?: string
}

/** A game-specific option shown in the setup panel (e.g. Pong's score target). */
export interface SetupField {
  key: string
  label: string
  choices: SetupChoice[]
  default: string
  /** Only show this field in these modes. Omit to show it in every mode. */
  modes?: PlayMode[]
}

export interface GameSetup {
  mode: PlayMode
  difficulty: Difficulty
  options: Record<string, string>
}

export type SeatKind = 'human' | 'bot'

/** One participant slot. Seat order is fixed by the game: chess seat 0 is White, Pong seat 0 is the left paddle. */
export interface Seat {
  index: number
  player: Player
  /** human: a person at this device. bot: the computer plays this seat. */
  kind: SeatKind
  /** Describes the role in this game, e.g. "White" or "Left paddle". */
  label: string
  /** True when the seat is the signed-in user (vs a guest sharing the device). */
  isMe: boolean
  /** Bot strength. Only meaningful when kind is 'bot'. */
  difficulty: Difficulty
}

/** Live info the game reports so the platform can show it outside the playfield. */
export interface LiveStatus {
  /** Centre text of the scoreboard, e.g. "7 – 5" or "White to move". */
  headline: string
  /** Small line under the headline, e.g. "First to 11" or "Check!". */
  detail?: string
  /** Seat whose turn it is, or null when the game has no turns (Pong). */
  activeSeat: number | null
  /** One number per seat, for score-based games. */
  scores?: number[]
}

export interface MatchOutcome {
  /** Winning seat index, or null for a draw. */
  winnerSeat: number | null
  /** Why the game ended, e.g. "Checkmate" or "Reached 11 points". */
  reason: string
  /** Final score text for score-based games. */
  scoreText?: string
}

export interface GamePlayProps {
  seats: Seat[]
  setup: GameSetup
  /** True while the platform has the game paused (only games with pausable: true). */
  paused: boolean
  /** True once the match is over (including by resignation): ignore further input. */
  finished: boolean
  /** Called whenever the headline, detail, turn or scores change. */
  onStatus: (status: LiveStatus) => void
  /** Called once when the game ends by its own rules. */
  onFinish: (outcome: MatchOutcome) => void
}

export interface GameModule {
  id: GameId
  /** The playfield. Remounted (new key) for every new match. */
  Play: ComponentType<GamePlayProps>
  setupFields: SetupField[]
  /** Short rules, one sentence each. */
  rules: string[]
  /** Input help, e.g. "W / S or arrow keys move your paddle". */
  controls: string[]
  /** Which seat the signed-in user takes in 'bot' mode, given the chosen options. */
  mySeat: (setup: GameSetup) => number
  /** Seat labels in seat order, e.g. ["White", "Black"]. */
  seatLabels: (setup: GameSetup) => string[]
  /** Text for the "Format" row in match details. */
  formatLabel: (setup: GameSetup) => string
  /** True if the platform should offer a Pause button. */
  pausable?: boolean
  /** True if resigning makes sense (turn-based games). */
  resignable?: boolean
}
