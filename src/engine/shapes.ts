/**
 * 그림 조각(Shape) 규격과 경로 생성기.
 *
 * 리온의 대모험은 도트 아틀라스를 썼다. 옷입히기는 그러면 안 된다 —
 * 옷 한 벌마다 프레임을 굽고, 색만 다른 옷에도 새 프레임이 필요해진다.
 * 여기서는 **SVG 경로 문자열 + 칠하기 정보** 를 데이터로 들고 다니고,
 * 브라우저에서 Path2D 로 한 번에 그린다. 그래서:
 *
 *   - 옷을 "치마 실루엣 + 색 3개" 같은 파라미터로 찍어낼 수 있다
 *   - 이 모듈이 순수해서 node 테스트에서 그대로 검증된다
 *   - 배율을 아무리 키워도 깨지지 않는다 (세로 화면 크기가 제각각이다)
 *
 * 좌표계는 "인형 좌표계"다. 200 x 440 상자 안에 리아가 서 있다.
 * DOLL_W / DOLL_H 는 doll/body.ts 가 정의한다.
 */

export type GradientStop = readonly [number, string]

export type Paint =
  | string
  | {
      kind: 'linear'
      x0: number
      y0: number
      x1: number
      y1: number
      stops: readonly GradientStop[]
    }
  | {
      kind: 'radial'
      x: number
      y: number
      r0: number
      r1: number
      stops: readonly GradientStop[]
    }

export type Shape = {
  /** SVG path 문자열. Path2D 가 그대로 먹는다 */
  d: string
  fill?: Paint
  stroke?: Paint
  /** 선 두께 */
  lw?: number
  alpha?: number
  cap?: CanvasLineCap
  join?: CanvasLineJoin
  /** 점선 */
  dash?: readonly number[]
}

export function linear(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: readonly GradientStop[],
): Paint {
  return { kind: 'linear', x0, y0, x1, y1, stops }
}

export function radial(
  x: number,
  y: number,
  r0: number,
  r1: number,
  stops: readonly GradientStop[],
): Paint {
  return { kind: 'radial', x, y, r0, r1, stops }
}

/** 세로로 밝은 색 → 어두운 색. 옷감에 제일 많이 쓴다 */
export function vshade(y0: number, y1: number, light: string, dark: string): Paint {
  return linear(0, y0, 0, y1, [
    [0, light],
    [1, dark],
  ])
}

// ── 경로 생성기 ─────────────────────────────────────────────────
//
// 전부 문자열을 돌려준다. 숫자는 소수점 2자리로 잘라 경로가 길어지지 않게 한다.

function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, r, r)
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  // 원호 두 개로 닫는다. A 커맨드는 360도를 한 번에 못 그린다
  return (
    `M${n(cx - rx)},${n(cy)}` +
    `A${n(rx)},${n(ry)} 0 1 0 ${n(cx + rx)},${n(cy)}` +
    `A${n(rx)},${n(ry)} 0 1 0 ${n(cx - rx)},${n(cy)}Z`
  )
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${n(x)},${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`
}

export function rrectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return (
    `M${n(x + rr)},${n(y)}` +
    `h${n(w - rr * 2)}a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},${n(rr)}` +
    `v${n(h - rr * 2)}a${n(rr)},${n(rr)} 0 0 1 ${n(-rr)},${n(rr)}` +
    `h${n(-(w - rr * 2))}a${n(rr)},${n(rr)} 0 0 1 ${n(-rr)},${n(-rr)}` +
    `v${n(-(h - rr * 2))}a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},${n(-rr)}Z`
  )
}

/** [x,y,x,y,...] 를 잇는다 */
export function polyPath(pts: readonly number[], closed = true): string {
  if (pts.length < 4) return ''
  let d = `M${n(pts[0]!)},${n(pts[1]!)}`
  for (let i = 2; i < pts.length - 1; i += 2) d += `L${n(pts[i]!)},${n(pts[i + 1]!)}`
  return closed ? `${d}Z` : d
}

/** 별. points 각, rot 은 라디안 */
export function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5,
  rot = -Math.PI / 2,
): string {
  const pts: number[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = rot + (i * Math.PI) / points
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  return polyPath(pts)
}

/** 하트. size 는 가로 반지름 */
export function heartPath(cx: number, cy: number, size: number): string {
  const s = size
  return (
    `M${n(cx)},${n(cy + s * 0.95)}` +
    `C${n(cx - s * 1.5)},${n(cy - s * 0.2)} ${n(cx - s * 0.85)},${n(cy - s * 1.1)} ${n(cx)},${n(cy - s * 0.35)}` +
    `C${n(cx + s * 0.85)},${n(cy - s * 1.1)} ${n(cx + s * 1.5)},${n(cy - s * 0.2)} ${n(cx)},${n(cy + s * 0.95)}Z`
  )
}

/** 물방울 (귀걸이·보석에 쓴다) */
export function dropPath(cx: number, cy: number, w: number, h: number): string {
  return (
    `M${n(cx)},${n(cy - h / 2)}` +
    `C${n(cx + w / 2)},${n(cy - h / 6)} ${n(cx + w / 2)},${n(cy + h / 3)} ${n(cx)},${n(cy + h / 2)}` +
    `C${n(cx - w / 2)},${n(cy + h / 3)} ${n(cx - w / 2)},${n(cy - h / 6)} ${n(cx)},${n(cy - h / 2)}Z`
  )
}

/** 다이아몬드 컷 보석 */
export function gemPath(cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2
  return polyPath([
    cx - hw, cy - h * 0.18,
    cx - hw * 0.55, cy - h / 2,
    cx + hw * 0.55, cy - h / 2,
    cx + hw, cy - h * 0.18,
    cx, cy + h / 2,
  ])
}

/** 꽃잎 n 장짜리 꽃 */
export function flowerPath(cx: number, cy: number, r: number, petals = 5): string {
  let d = ''
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 - Math.PI / 2
    const px = cx + Math.cos(a) * r * 0.62
    const py = cy + Math.sin(a) * r * 0.62
    d += ellipsePath(px, py, r * 0.46, r * 0.46)
  }
  return d
}

/**
 * 부드러운 치마 자락.
 *
 * 허리(x 중심 cx, 폭 topW)에서 시작해 밑단(폭 botW, y = botY)까지 벌어지고,
 * 밑단은 물결친다. waves 가 0 이면 평평한 A 라인이다.
 */
export function skirtPath(
  cx: number,
  topY: number,
  topW: number,
  botY: number,
  botW: number,
  waves = 4,
  waveH = 5,
  curve = 0.55,
): string {
  const tl = cx - topW / 2
  const tr = cx + topW / 2
  const bl = cx - botW / 2
  const br = cx + botW / 2
  const midY = topY + (botY - topY) * curve

  let d = `M${n(tl)},${n(topY)}`
  // 왼쪽 옆선 — 아래로 갈수록 벌어진다
  d += `C${n(tl - (topW * 0.1))},${n(midY)} ${n(bl)},${n(midY + (botY - midY) * 0.4)} ${n(bl)},${n(botY)}`

  if (waves <= 0) {
    d += `L${n(br)},${n(botY)}`
  } else {
    // 밑단 물결. 아래로 볼록한 호를 이어 붙인다
    const step = (br - bl) / waves
    for (let i = 0; i < waves; i++) {
      const x0 = bl + step * i
      const x1 = x0 + step
      d += `Q${n((x0 + x1) / 2)},${n(botY + waveH)} ${n(x1)},${n(botY)}`
    }
  }

  d += `C${n(br)},${n(midY + (botY - midY) * 0.4)} ${n(tr + topW * 0.1)},${n(midY)} ${n(tr)},${n(topY)}Z`
  return d
}

/** 두 점을 잇는 부드러운 호. 목걸이 줄·머리 가르마에 쓴다 */
export function arcPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bulge: number,
): string {
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2 + bulge
  return `M${n(x0)},${n(y0)}Q${n(mx)},${n(my)} ${n(x1)},${n(y1)}`
}

/** 반짝임(4각 별). 마법 연출에 많이 쓴다 */
export function sparklePath(cx: number, cy: number, r: number): string {
  const t = r * 0.24
  return (
    `M${n(cx)},${n(cy - r)}` +
    `Q${n(cx + t)},${n(cy - t)} ${n(cx + r)},${n(cy)}` +
    `Q${n(cx + t)},${n(cy + t)} ${n(cx)},${n(cy + r)}` +
    `Q${n(cx - t)},${n(cy + t)} ${n(cx - r)},${n(cy)}` +
    `Q${n(cx - t)},${n(cy - t)} ${n(cx)},${n(cy - r)}Z`
  )
}

/** 여러 조각을 하나로 합친다 (같은 색으로 칠할 때) */
export function mergePaths(...ds: readonly string[]): string {
  return ds.filter(Boolean).join('')
}
