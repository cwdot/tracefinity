'use client'

import { useEffect, useRef, useState } from 'react'
import type { Point } from '@/types'
import { distance, snapToRings, type Measurement } from '@/lib/measure'

interface Props {
  // click-capture area, in svg user units
  x: number
  y: number
  width: number
  height: number
  // outlines to snap to, in svg user units
  snapRings: Point[][]
  // mm per svg user unit
  mmPerUnit: number
}

const SNAP_PX = 10
const CLICK_SLOP_PX = 4
const COLOR = 'rgb(251, 191, 36)'

// Two-click distance tool. Measurements are view-only and clear on Esc or unmount.
export function MeasureLayer({ x, y, width, height, snapRings, mmPerUnit }: Props) {
  const rectRef = useRef<SVGRectElement>(null)
  const downRef = useRef<{ x: number; y: number } | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [start, setStart] = useState<Point | null>(null)
  const [hover, setHover] = useState<Point | null>(null)
  // svg user units per screen px, read from the live transform so strokes and
  // labels keep a constant on-screen size at any zoom
  const [unitPerPx, setUnitPerPx] = useState(1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMeasurements([])
      setStart(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // client coords -> svg user units, snapped to the nearest outline unless Alt is held
  const toUser = (e: React.MouseEvent): Point | null => {
    const m = rectRef.current?.getScreenCTM()
    if (!m) return null
    const upp = 1 / Math.hypot(m.a, m.b)
    setUnitPerPx(upp)
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const raw = { x: p.x, y: p.y }
    if (e.altKey) return raw
    return snapToRings(raw, snapRings, SNAP_PX * upp) ?? raw
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    downRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const down = downRef.current
    // ignore the click that ends a pan
    if (e.button !== 0 || (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX)) return
    const p = toUser(e)
    if (!p) return
    if (!start) {
      setStart(p)
      return
    }
    setMeasurements(prev => [...prev, { a: start, b: p }])
    setStart(null)
  }

  const segments = start && hover ? [...measurements, { a: start, b: hover }] : measurements
  const stroke = 1.5 * unitPerPx
  const fontSize = 13 * unitPerPx
  const dot = 3.5 * unitPerPx

  return (
    <g>
      <rect
        ref={rectRef}
        x={x} y={y} width={width} height={height}
        fill="transparent"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseMove={e => setHover(toUser(e))}
        onMouseLeave={() => setHover(null)}
      />
      <g className="pointer-events-none select-none">
        {segments.map((s, i) => (
          <g key={i}>
            <line
              x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y}
              stroke={COLOR} strokeWidth={stroke}
              strokeDasharray={`${6 * unitPerPx},${4 * unitPerPx}`}
            />
            <circle cx={s.a.x} cy={s.a.y} r={dot} fill={COLOR} />
            <circle cx={s.b.x} cy={s.b.y} r={dot} fill={COLOR} />
            <text
              x={(s.a.x + s.b.x) / 2} y={(s.a.y + s.b.y) / 2 - fontSize * 0.6}
              textAnchor="middle"
              fontSize={fontSize} fontWeight="600" fontFamily="Arial, sans-serif"
              fill={COLOR}
              stroke="rgba(15, 23, 42, 0.9)" strokeWidth={fontSize * 0.3} paintOrder="stroke"
            >
              {(distance(s.a, s.b) * mmPerUnit).toFixed(1)} mm
            </text>
          </g>
        ))}
        {start && <circle cx={start.x} cy={start.y} r={dot} fill={COLOR} />}
        {hover && <circle cx={hover.x} cy={hover.y} r={dot * 1.4} fill="none" stroke={COLOR} strokeWidth={stroke} />}
      </g>
    </g>
  )
}
