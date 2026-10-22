import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatNumber } from '../../lib/format'

interface SparklineProps {
  values: number[]
  label: string
  width?: number
  height?: number
  color?: string
}

/** Tiny trend line for stat strips. No axes: the number next to it carries the value. */
export function Sparkline({ values, label, width = 112, height = 36, color = 'var(--p2)' }: SparklineProps) {
  const pad = 5
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [endX, endY] = points[points.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={endX} cy={endY} r="4" fill={color} stroke="var(--panel)" strokeWidth="2" />
    </svg>
  )
}

interface TrendChartProps {
  values: number[]
  /** What the values measure, e.g. "Rating". */
  label: string
  /** Describes the x positions, newest last: "matches ago" for [24 … 0]. */
  unit: string
  color?: string
  height?: number
}

/**
 * Single-series line chart with a crosshair readout. Pointer and arrow keys both move it,
 * and a visually hidden table gives screen readers the same numbers.
 */
export function TrendChart({ values, label, unit, color = 'var(--p2)', height = 184 }: TrendChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, Math.floor(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const margin = { top: 16, right: 16, bottom: 28, left: 46 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const last = values.length - 1

  const scale = useMemo(() => {
    const step = 50
    let lo = Math.floor(Math.min(...values) / step) * step
    let hi = Math.ceil(Math.max(...values) / step) * step
    if (hi === lo) hi = lo + step
    if (hi - lo < step * 2) {
      lo -= step
      hi += step
    }
    const mid = Math.round((lo + hi) / 2 / step) * step
    return { lo, hi, ticks: [hi, mid, lo] }
  }, [values])

  const x = (index: number) => margin.left + (index / last) * innerWidth
  const y = (value: number) => margin.top + (1 - (value - scale.lo) / (scale.hi - scale.lo)) * innerHeight
  const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ')

  const move = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const index = Math.round(((event.clientX - rect.left - margin.left) / innerWidth) * last)
    setHover(Math.min(last, Math.max(0, index)))
  }

  const key = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      setHover((current) => Math.min(last, Math.max(0, (current ?? last) + direction)))
    }
    if (event.key === 'Escape') setHover(null)
  }

  const shown = hover ?? last
  const ago = last - shown
  const tipLeft = Math.min(width - 78, Math.max(78, x(shown)))
  const summary = `${label} over the last ${values.length} ${unit.replace(' ago', '')}: from ${formatNumber(values[0])} to ${formatNumber(values[last])}, low ${formatNumber(Math.min(...values))}, high ${formatNumber(Math.max(...values))}. Use the arrow keys to read each point.`

  return (
    <div className="trend" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={move}
        onPointerLeave={() => setHover(null)}
        onKeyDown={key}
        onBlur={() => setHover(null)}
      >
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth="1" />
            <text x={margin.left - 10} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="trend__axis">
              {formatNumber(tick)}
            </text>
          </g>
        ))}
        <text x={margin.left} y={height - 6} textAnchor="start" className="trend__axis">
          {values.length - 1} {unit}
        </text>
        <text x={width - margin.right} y={height - 6} textAnchor="end" className="trend__axis">
          Latest
        </text>

        {hover !== null ? (
          <line x1={x(hover)} x2={x(hover)} y1={margin.top} y2={margin.top + innerHeight} stroke="var(--line-strong)" strokeWidth="1" />
        ) : null}

        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(shown)} cy={y(values[shown])} r="4.5" fill={color} stroke="var(--panel)" strokeWidth="2" />
      </svg>

      <div className="trend__tip" style={{ left: tipLeft, top: Math.max(0, y(values[shown]) - 50) }} aria-hidden="true">
        <strong>{formatNumber(values[shown])}</strong>
        <span>{ago === 0 ? 'Latest' : `${ago} ${unit}`}</span>
      </div>

      <table className="sr-only">
        <caption>{label} history</caption>
        <thead>
          <tr>
            <th scope="col">{unit}</th>
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          {values.map((value, index) => (
            <tr key={index}>
              <td>{last - index}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
