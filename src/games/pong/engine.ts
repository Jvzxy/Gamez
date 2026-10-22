// Pong rules and physics. Pure TypeScript, no DOM: the same code runs in the
// browser and in Node tests. Time advances in fixed steps so a match plays the
// same on a 60 Hz and a 144 Hz screen.

export const W = 800
export const H = 450
export const PADDLE_W = 12
export const PADDLE_H = 88
export const HALF = PADDLE_H / 2
export const BALL_R = 8
/** Distance from the court edge to the back of each paddle. */
export const EDGE = 30
export const BASE_SPEED = 430
export const MAX_SPEED = 780
export const PADDLE_SPEED = 560
/** Seconds the ball rests at the centre before each serve. */
export const SERVE_DELAY = 0.9
export const STEP = 1 / 120

/** Seat 0 plays the left paddle, seat 1 the right. */
export type PongSide = 0 | 1

export interface PongState {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  /** Vertical centre of each paddle. */
  paddles: [number, number]
  scores: [number, number]
  target: number
  /** Seconds until the ball is served. While above zero the ball rests at the centre. */
  serveTimer: number
  /** Paddle hits since the last serve. */
  rally: number
  winner: PongSide | null
  trail: Array<[number, number]>
}

/** What a controller wants a paddle to do this step. */
export interface PaddleInput {
  /** Keyboard-style: -1 up, 0 still, 1 down. Ignored when targetY is set. */
  dir: number
  /** Pointer or bot style: move towards this y as fast as allowed. */
  targetY: number | null
  /** Fraction of full paddle speed this controller may use (0 to 1). Handicaps bots. */
  speed: number
}

export const idleInput = (): PaddleInput => ({ dir: 0, targetY: null, speed: 1 })

export type PongEvent = 'hit' | 'wall' | 'point-left' | 'point-right' | 'win'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export function createPong(target: number, random: () => number = Math.random): PongState {
  const state: PongState = {
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    speed: BASE_SPEED,
    paddles: [H / 2, H / 2],
    scores: [0, 0],
    target,
    serveTimer: SERVE_DELAY,
    rally: 0,
    winner: null,
    trail: [],
  }
  serve(state, random() < 0.5 ? 0 : 1, random)
  return state
}

/** Puts the ball at the centre, to be launched towards `toward` once the delay ends. */
function serve(state: PongState, toward: PongSide, random: () => number) {
  const angle = (random() - 0.5) * 0.9
  state.x = W / 2
  state.y = H / 2
  state.speed = BASE_SPEED
  state.vx = (toward === 0 ? -1 : 1) * Math.cos(angle) * state.speed
  state.vy = Math.sin(angle) * state.speed
  state.serveTimer = SERVE_DELAY
  state.rally = 0
  state.trail = []
}

function movePaddle(current: number, input: PaddleInput, dt: number): number {
  const reach = PADDLE_SPEED * clamp(input.speed, 0, 1) * dt
  const next = input.targetY !== null ? current + clamp(input.targetY - current, -reach, reach) : current + clamp(input.dir, -1, 1) * reach
  return clamp(next, HALF, H - HALF)
}

/** Advances the match by `dt` seconds (use STEP). Returns the things that happened, for sound or effects. */
export function stepPong(state: PongState, inputs: [PaddleInput, PaddleInput], dt: number, random: () => number = Math.random): PongEvent[] {
  if (state.winner !== null) return []
  const events: PongEvent[] = []

  state.paddles[0] = movePaddle(state.paddles[0], inputs[0], dt)
  state.paddles[1] = movePaddle(state.paddles[1], inputs[1], dt)

  if (state.serveTimer > 0) {
    state.serveTimer -= dt
    return events
  }

  state.x += state.vx * dt
  state.y += state.vy * dt
  state.trail.push([state.x, state.y])
  if (state.trail.length > 14) state.trail.shift()

  if (state.y < BALL_R) {
    state.y = BALL_R
    state.vy = Math.abs(state.vy)
    events.push('wall')
  } else if (state.y > H - BALL_R) {
    state.y = H - BALL_R
    state.vy = -Math.abs(state.vy)
    events.push('wall')
  }

  const leftFace = EDGE + PADDLE_W
  const rightFace = W - EDGE - PADDLE_W
  if (state.vx < 0 && state.x - BALL_R <= leftFace && state.x + BALL_R >= EDGE && Math.abs(state.y - state.paddles[0]) <= HALF + BALL_R) {
    bounce(state, 0)
    events.push('hit')
  } else if (state.vx > 0 && state.x + BALL_R >= rightFace && state.x - BALL_R <= W - EDGE && Math.abs(state.y - state.paddles[1]) <= HALF + BALL_R) {
    bounce(state, 1)
    events.push('hit')
  }

  // The ball has gone past a paddle: a point for the other side.
  if (state.x < -BALL_R * 2) score(state, 1, events, random)
  else if (state.x > W + BALL_R * 2) score(state, 0, events, random)
  return events
}

function bounce(state: PongState, side: PongSide) {
  const offset = clamp((state.y - state.paddles[side]) / (HALF + BALL_R), -1, 1)
  const angle = offset * 0.85
  state.speed = Math.min(state.speed * 1.045, MAX_SPEED)
  state.rally++
  state.vx = (side === 0 ? 1 : -1) * Math.cos(angle) * state.speed
  state.vy = Math.sin(angle) * state.speed
  state.x = side === 0 ? EDGE + PADDLE_W + BALL_R : W - EDGE - PADDLE_W - BALL_R
}

function score(state: PongState, scorer: PongSide, events: PongEvent[], random: () => number) {
  state.scores[scorer]++
  events.push(scorer === 0 ? 'point-left' : 'point-right')
  if (state.scores[scorer] >= state.target) {
    state.winner = scorer
    state.vx = 0
    state.vy = 0
    events.push('win')
    return
  }
  // Serve towards the player who just lost the point.
  serve(state, scorer === 0 ? 1 : 0, random)
}

/** Where the ball will cross the vertical line x = planeX, folding its path over the top and bottom walls. */
export function predictY(state: PongState, planeX: number): number {
  if (state.vx === 0) return state.y
  const time = (planeX - state.x) / state.vx
  if (time < 0) return state.y
  const span = H - 2 * BALL_R
  const raw = state.y - BALL_R + state.vy * time
  const folded = ((raw % (2 * span)) + 2 * span) % (2 * span)
  return BALL_R + (folded <= span ? folded : 2 * span - folded)
}

/** Final score as text, left side first. */
export function scoreText(state: PongState): string {
  return `${state.scores[0]} – ${state.scores[1]}`
}
