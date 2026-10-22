import { BALL_R, EDGE, H, HALF, PADDLE_H, PADDLE_W, W, type PongState } from './engine'

export const CANVAS_DPR = 2
export const LEFT_COLOUR = '#ff8a3d'
export const RIGHT_COLOUR = '#5bc0ff'

interface DrawOptions {
  /** Skip the court background so the canvas can sit over a CSS backdrop. */
  transparent?: boolean
  /** Draw big faint score numbers behind the action. */
  showScore?: boolean
}

function drawPaddle(ctx: CanvasRenderingContext2D, x: number, centreY: number, colour: string) {
  ctx.save()
  ctx.shadowColor = colour
  ctx.shadowBlur = 18
  ctx.fillStyle = colour
  ctx.beginPath()
  ctx.roundRect(x, centreY - HALF, PADDLE_W, PADDLE_H, 6)
  ctx.fill()
  ctx.restore()
}

/** Prepares a canvas for drawing in court units (800 x 450) at 2x resolution. */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  canvas.width = W * CANVAS_DPR
  canvas.height = H * CANVAS_DPR
  ctx.setTransform(CANVAS_DPR, 0, 0, CANVAS_DPR, 0, 0)
  return ctx
}

export function drawPong(ctx: CanvasRenderingContext2D, state: PongState, options: DrawOptions = {}) {
  ctx.clearRect(0, 0, W, H)
  if (!options.transparent) {
    ctx.fillStyle = '#0a0b18'
    ctx.fillRect(0, 0, W, H)
  }

  if (options.showScore) {
    ctx.save()
    ctx.font = '700 120px Unbounded, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255, 138, 61, 0.1)'
    ctx.fillText(String(state.scores[0]), W / 2 - 130, H / 2)
    ctx.fillStyle = 'rgba(91, 192, 255, 0.1)'
    ctx.fillText(String(state.scores[1]), W / 2 + 130, H / 2)
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(168, 172, 255, 0.22)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 14])
  ctx.beginPath()
  ctx.moveTo(W / 2, 14)
  ctx.lineTo(W / 2, H - 14)
  ctx.stroke()
  ctx.restore()

  drawPaddle(ctx, EDGE, state.paddles[0], LEFT_COLOUR)
  drawPaddle(ctx, W - EDGE - PADDLE_W, state.paddles[1], RIGHT_COLOUR)

  state.trail.forEach(([x, y], index) => {
    const fade = index / state.trail.length
    ctx.fillStyle = `rgba(241, 239, 255, ${fade * 0.24})`
    ctx.beginPath()
    ctx.arc(x, y, BALL_R * (0.4 + 0.6 * fade), 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.save()
  ctx.shadowColor = 'rgba(241, 239, 255, 0.7)'
  ctx.shadowBlur = 16
  ctx.fillStyle = '#f1efff'
  ctx.beginPath()
  ctx.arc(state.x, state.y, BALL_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // While the ball waits to be served, ring it so players know where it will start.
  if (state.serveTimer > 0 && state.winner === null) {
    ctx.save()
    ctx.strokeStyle = `rgba(241, 239, 255, ${Math.min(1, state.serveTimer) * 0.5})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(state.x, state.y, BALL_R + 8 + state.serveTimer * 14, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
