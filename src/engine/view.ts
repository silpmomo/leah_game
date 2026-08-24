/**
 * 화면 규격과 사각형 유틸. 브라우저 API 를 만지지 않는 순수 모듈이다.
 *
 * 이 게임은 **세로 모드 전용**이다. 논리 해상도를 9:16 에 맞춰 고정하고
 * 실제 화면 크기에 맞춰 배율만 바꾼다. 리온의 대모험은 도트라서 정수 배율만
 * 썼지만, 여기는 전부 벡터(Path2D)라 소수 배율을 써도 계단이 생기지 않는다.
 */
export const VIEW_W = 360
export const VIEW_H = 640

/** 고정 timestep — 초 단위 */
export const DT = 1 / 60

/** 한 tick 에서 따라잡을 수 있는 최대 프레임 수 */
export const MAX_CATCHUP_FRAMES = 5

export type Rect = { x: number; y: number; w: number; h: number }

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h }
}

export function inRect(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}

/** 사각형 가운데 좌표 */
export function centerOf(r: Rect): [number, number] {
  return [r.x + r.w / 2, r.y + r.h / 2]
}

/** 가로로 균등 분할한 i 번째 칸. 좌우 여백과 간격을 준다 */
export function slotRect(
  index: number,
  count: number,
  y: number,
  h: number,
  side = 12,
  gap = 8,
): Rect {
  const avail = VIEW_W - side * 2 - gap * (count - 1)
  const w = avail / count
  return { x: side + index * (w + gap), y, w, h }
}

/** 격자 칸. cols 열로 늘어놓는다 */
export function gridRect(
  index: number,
  cols: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number,
): Rect {
  const c = index % cols
  const r = Math.floor(index / cols)
  return { x: x0 + c * (w + gapX), y: y0 + r * (h + gapY), w, h }
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** 0..1 로 정규화된 진행도 */
export function progress01(v: number, total: number): number {
  return total <= 0 ? 0 : clamp(v / total, 0, 1)
}
