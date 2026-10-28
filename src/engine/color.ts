/**
 * 색 계산 — 색조 돌리기.
 *
 * 옷장의 색 견본은 "같은 옷을 다른 색으로" 보여 준다. 옷마다 색 버전을
 * 따로 그리면 58벌이 348벌이 된다. 대신 그려진 조각의 fill/stroke 를
 * 받아 색조(hue)만 목표 색으로 돌린다. 순수 함수라 테스트된다.
 */
import type { Paint, Shape } from './shapes'

export type Rgba = { r: number; g: number; b: number; a: number }

/** `#rgb` · `#rrggbb` · `#rrggbbaa` · `rgb()` · `rgba()` 를 읽는다. 못 읽으면 null */
export function parseColor(s: string): Rgba | null {
  const t = s.trim()
  if (t.startsWith('#')) {
    const h = t.slice(1)
    if (h.length === 3 || h.length === 4) {
      const r = parseInt(h[0]! + h[0]!, 16)
      const g = parseInt(h[1]! + h[1]!, 16)
      const b = parseInt(h[2]! + h[2]!, 16)
      const a = h.length === 4 ? parseInt(h[3]! + h[3]!, 16) / 255 : 1
      return Number.isNaN(r + g + b) ? null : { r, g, b, a }
    }
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
      return Number.isNaN(r + g + b) ? null : { r, g, b, a }
    }
    return null
  }
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(t)
  if (!m) return null
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] === undefined ? 1 : Number(m[4]),
  }
}

export type Hsl = { h: number; s: number; l: number }

export function rgbToHsl({ r, g, b }: Rgba): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h, s, l }
}

export function hslToRgb({ h, s, l }: Hsl): Rgba {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v, a: 1 }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number): number => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return {
    r: Math.round(f(h + 1 / 3) * 255),
    g: Math.round(f(h) * 255),
    b: Math.round(f(h - 1 / 3) * 255),
    a: 1,
  }
}

export function toCss({ r, g, b, a }: Rgba): string {
  if (a >= 1) {
    const hx = (v: number): string => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
    return `#${hx(r)}${hx(g)}${hx(b)}`
  }
  return `rgba(${r},${g},${b},${Math.round(a * 1000) / 1000})`
}

/**
 * 색조를 목표 색의 색조로 바꾼다.
 *
 * 밝고 채도 낮은 색(흰 레이스·은색 선·연회색)과 거의 흰색은 건드리지
 * 않는다 — 장식이 살아남아야 "같은 옷" 으로 보인다. 어두운 저채도(갈색
 * 머리)는 바꾼다 — 머리색이 안 바뀌면 견본이 고장 난 것처럼 보인다.
 * 밝기는 원래 색과 목표 색의 중간쯤으로 당긴다. 그래야 검은 머리가
 * 백금색 견본으로도, 민트 드레스가 버건디로도 간다.
 * 목표가 무채색(검정·회색·흰색)이면 색조 대신 채도를 뺀다.
 */
export function retint(css: string, target: Hsl, minSat = 0.3): string {
  const c = parseColor(css)
  if (!c) return css
  const hsl = rgbToHsl(c)
  if (hsl.s < minSat && hsl.l > 0.6) return css
  if (hsl.l > 0.93) return css
  const l = hsl.l * 0.45 + target.l * 0.55
  let next: Hsl
  if (target.s < 0.12) {
    // 무채색 견본 — 밝기만 목표 쪽으로 당기고 채도를 뺀다
    next = { h: hsl.h, s: hsl.s * 0.08, l }
  } else {
    next = { h: target.h, s: Math.min(1, hsl.s * 0.5 + target.s * 0.6), l }
  }
  const out = hslToRgb(next)
  return toCss({ ...out, a: c.a })
}

function retintPaint(p: Paint, target: Hsl): Paint {
  if (typeof p === 'string') return retint(p, target)
  return { ...p, stops: p.stops.map(([at, col]) => [at, retint(col, target)] as const) }
}

/** 조각 묶음 전체의 색조를 돌린다. 경로는 그대로라 Path2D 캐시가 살아 있다 */
export function tintShapes(shapes: readonly Shape[], targetCss: string): Shape[] {
  const t = parseColor(targetCss)
  if (!t) return [...shapes]
  const target = rgbToHsl(t)
  return shapes.map((s) => {
    const out: Shape = { ...s }
    if (s.fill) out.fill = retintPaint(s.fill, target)
    if (s.stroke) out.stroke = retintPaint(s.stroke, target)
    return out
  })
}
