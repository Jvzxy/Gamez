import type { Difficulty } from '../types'
import { BALL_R, EDGE, H, HALF, PADDLE_W, W, predictY, type PaddleInput, type PongSide, type PongState } from './engine'

interface Profile {
  /** Seconds between the bot re-reading the ball. Larger is slower to react. */
  reaction: number
  /** Largest aiming mistake, in pixels. */
  error: number
  /** Fraction of full paddle speed the bot can use. */
  speed: number
  /**
   * Chance per incoming ball of a bad read: the bot aims clearly off the paddle's reach and misses.
   * It grows with the length of the rally, so even two perfect-tracking bots eventually drop a point.
   */
  slip: number
}

export const pongProfiles: Record<Difficulty, Profile> = {
  easy: { reaction: 0.32, error: 40, speed: 0.55, slip: 0.2 },
  medium: { reaction: 0.16, error: 28, speed: 0.8, slip: 0.14 },
  hard: { reaction: 0.06, error: 14, speed: 1, slip: 0.1 },
}

/** A slip aims at least this far from the ball, which is beyond what the paddle can cover (HALF + BALL_R). */
const SLIP_MIN = HALF + BALL_R + 6
const SLIP_MAX = SLIP_MIN + 36

/**
 * Computer-controlled paddle. It only "sees" the ball every `reaction` seconds and
 * aims with a random error chosen when the ball turns towards it, then moves at
 * the speed cap for its level, so lower levels lose rallies for believable reasons.
 */
export class PongBot {
  private readonly side: PongSide
  private readonly profile: Profile
  private readonly random: () => number
  private clock = 0
  private seen = 0
  private aim = H / 2
  private offset = 0
  private incoming = false
  private slipping = false

  constructor(side: PongSide, difficulty: Difficulty, random: () => number = Math.random) {
    this.side = side
    this.profile = pongProfiles[difficulty]
    this.random = random
  }

  /** Decides how this bot will misjudge the ball that is about to arrive. */
  private chooseOffset(rally: number) {
    const chance = Math.min(0.6, this.profile.slip * (1 + rally / 16))
    this.slipping = this.random() < chance
    this.offset = this.slipping
      ? SLIP_MIN + this.random() * (SLIP_MAX - SLIP_MIN)
      : (this.random() * 2 - 1) * this.profile.error
  }

  think(state: PongState, dt: number): PaddleInput {
    this.clock += dt
    // While the ball rests before a serve it is not "incoming" yet, so every serve gets a fresh read.
    const toward = state.serveTimer <= 0 && (this.side === 0 ? state.vx < 0 : state.vx > 0)
    if (toward && !this.incoming) this.chooseOffset(state.rally)
    this.incoming = toward

    if (this.clock - this.seen >= this.profile.reaction) {
      this.seen = this.clock
      if (toward) {
        const plane = this.side === 0 ? EDGE + PADDLE_W + BALL_R : W - EDGE - PADDLE_W - BALL_R
        const predicted = predictY(state, plane)
        // A slip is always aimed towards the open court, so the paddle is not pinned against a wall and saves it.
        const offset = this.slipping ? Math.abs(this.offset) * (predicted < H / 2 ? 1 : -1) : this.offset
        this.aim = Math.min(H - HALF, Math.max(HALF, predicted + offset))
      } else {
        // Ball is heading away: drift back to the middle.
        this.aim = H / 2
      }
    }
    return { dir: 0, targetY: this.aim, speed: this.profile.speed }
  }
}
