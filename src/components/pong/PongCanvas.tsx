import { useEffect, useRef } from 'react'
import { PongBot } from '../../games/pong/bot'
import { STEP, createPong, stepPong } from '../../games/pong/engine'
import { drawPong, setupCanvas } from '../../games/pong/render'
import type { Difficulty } from '../../games/types'

interface PongCanvasProps {
  /** When false the rally is frozen on its current frame. */
  running: boolean
  /** Bot level for both paddles. Defaults to hard, which rarely misses. */
  difficulty?: Difficulty
  /** Skip the court background so the canvas can sit over a CSS backdrop. */
  transparent?: boolean
  label: string
}

/**
 * Decorative rally between two bots, used behind the Home hero. It runs the same
 * engine as the real game but takes no input and keeps no score.
 */
export function PongCanvas({ running, difficulty = 'hard', transparent = false, label }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runningRef = useRef(running)

  useEffect(() => {
    runningRef.current = running
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = setupCanvas(canvas)
    if (!ctx) return

    // An unreachable target keeps the rally going forever.
    const state = createPong(Number.MAX_SAFE_INTEGER)
    const bots = [new PongBot(0, difficulty), new PongBot(1, difficulty)]
    let frame = 0
    let last = performance.now()
    let accumulator = 0

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (runningRef.current) {
        accumulator += dt
        while (accumulator >= STEP) {
          accumulator -= STEP
          stepPong(state, [bots[0].think(state, STEP), bots[1].think(state, STEP)], STEP)
        }
      }
      drawPong(ctx, state, { transparent })
      frame = requestAnimationFrame(tick)
    }

    drawPong(ctx, state, { transparent })
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [difficulty, transparent])

  return <canvas ref={canvasRef} className="pong-canvas" role="img" aria-label={label} />
}
