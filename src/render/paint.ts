/**
 * Shape 를 캔버스에 옮기는 유일한 지점.
 *
 * 데이터(경로 문자열)와 캔버스 사이를 여기서만 잇는다. 그래서 옷·캐릭터
 * 정의는 전부 순수 모듈로 남고 node 테스트에서 검증된다.
 */
import type { Paint, Shape } from '../engine/shapes'

/**
 * Path2D 캐시.
 *
 * 옷 한 벌이 30 조각쯤 되고 60fps 로 다시 그린다. 매 프레임 문자열을
 * 파싱하면 저가 안드로이드에서 눈에 띄게 밀린다. 경로 문자열은 불변이라
 * 문자열을 그대로 키로 쓴다.
 */
const PATHS = new Map<string, Path2D>()
const PATH_CAP = 4000

function pathOf(d: string): Path2D {
  const hit = PATHS.get(d)
  if (hit) return hit
  const p = new Path2D(d)
  if (PATHS.size > PATH_CAP) PATHS.clear()
  PATHS.set(d, p)
  return p
}

function toStyle(ctx: CanvasRenderingContext2D, p: Paint): string | CanvasGradient {
  if (typeof p === 'string') return p
  if (p.kind === 'linear') {
    const g = ctx.createLinearGradient(p.x0, p.y0, p.x1, p.y1)
    for (const [at, color] of p.stops) g.addColorStop(at, color)
    return g
  }
  const g = ctx.createRadialGradient(p.x, p.y, p.r0, p.x, p.y, p.r1)
  for (const [at, color] of p.stops) g.addColorStop(at, color)
  return g
}

export function paintShape(ctx: CanvasRenderingContext2D, s: Shape): void {
  if (!s.d) return
  const path = pathOf(s.d)
  const prevAlpha = ctx.globalAlpha
  if (s.alpha !== undefined) ctx.globalAlpha = prevAlpha * s.alpha

  if (s.fill) {
    ctx.fillStyle = toStyle(ctx, s.fill)
    ctx.fill(path)
  }
  if (s.stroke) {
    ctx.strokeStyle = toStyle(ctx, s.stroke)
    ctx.lineWidth = s.lw ?? 1
    ctx.lineCap = s.cap ?? 'butt'
    ctx.lineJoin = s.join ?? 'round'
    if (s.dash) ctx.setLineDash(s.dash as number[])
    ctx.stroke(path)
    if (s.dash) ctx.setLineDash([])
  }

  ctx.globalAlpha = prevAlpha
}

export function paintShapes(ctx: CanvasRenderingContext2D, shapes: readonly Shape[]): void {
  for (const s of shapes) paintShape(ctx, s)
}

export type BoxFit = { k: number; dx: number; dy: number }

/**
 * 인형 좌표 → 화면 좌표 변환값.
 *
 * 그리기와 두드리기(왕관 보석 칸 등)가 같은 계산을 써야 한다.
 * 두 곳에 따로 적었다가 한쪽만 고쳐 어긋난 적이 있다.
 */
export function boxFit(
  box: { x: number; y: number; w: number; h: number },
  src: { w: number; h: number },
  align: 'center' | 'bottom' = 'center',
): BoxFit {
  const k = Math.min(box.w / src.w, box.h / src.h)
  const dx = box.x + (box.w - src.w * k) / 2
  const dy = align === 'bottom' ? box.y + (box.h - src.h * k) : box.y + (box.h - src.h * k) / 2
  return { k, dx, dy }
}

/** 인형 좌표 한 점을 화면 좌표로 */
export function fitPoint(f: BoxFit, x: number, y: number): [number, number] {
  return [f.dx + x * f.k, f.dy + y * f.k]
}

/**
 * 인형 좌표계(w x h)를 화면의 어떤 상자 안에 맞춰 그린다.
 *
 * 세로 화면은 기기마다 비율이 달라서, 인형을 항상 같은 크기로 그리면
 * 어떤 폰에서는 잘리고 어떤 폰에서는 뜬다. 상자에 맞춰 축소만 한다.
 */
export function paintInBox(
  ctx: CanvasRenderingContext2D,
  shapes: readonly Shape[],
  box: { x: number; y: number; w: number; h: number },
  src: { w: number; h: number },
  align: 'center' | 'bottom' = 'center',
): void {
  const { k, dx, dy } = boxFit(box, src, align)

  ctx.save()
  ctx.translate(dx, dy)
  ctx.scale(k, k)
  paintShapes(ctx, shapes)
  ctx.restore()
}

/**
 * 잘라 그리기의 변환값.
 *
 * 왕관 공방이 보석 칸을 두드릴 때 이 값을 쓴다. 그림과 두드림이 같은
 * 계산을 공유해야 칸이 어긋나지 않는다.
 */
export function cropFit(
  box: { x: number; y: number; w: number; h: number },
  view: { x: number; y: number; w: number; h: number },
): BoxFit {
  const k = Math.min(box.w / view.w, box.h / view.h)
  return {
    k,
    dx: box.x + (box.w - view.w * k) / 2 - view.x * k,
    dy: box.y + (box.h - view.h * k) / 2 - view.y * k,
  }
}

/** 잘라낸 영역(view)만 상자에 채워 그린다. 아이템 썸네일에 쓴다 */
export function paintCrop(
  ctx: CanvasRenderingContext2D,
  shapes: readonly Shape[],
  box: { x: number; y: number; w: number; h: number },
  view: { x: number; y: number; w: number; h: number },
): void {
  const k = Math.min(box.w / view.w, box.h / view.h)
  const dx = box.x + (box.w - view.w * k) / 2
  const dy = box.y + (box.h - view.h * k) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  ctx.translate(dx, dy)
  ctx.scale(k, k)
  ctx.translate(-view.x, -view.y)
  paintShapes(ctx, shapes)
  ctx.restore()
}
