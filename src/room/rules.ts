/**
 * 방 배치 규칙.
 *
 * 자유 놀이다. 목표도 시간 제한도 없고, 놓고 옮기고 치우는 것만 된다.
 * 다만 두 가지는 막는다:
 *   - 벽 물건이 바닥에, 바닥 물건이 벽에 뜨는 것 (y 를 구간으로 자른다)
 *   - 물건이 방 밖으로 나가는 것
 */
import { clamp } from '../engine/view'
import { furnitureOf, type FurnitureKind } from './items'

/** 방 좌표계 */
export const ROOM_W = 360
export const ROOM_H = 392
/** 벽과 바닥의 경계 */
export const FLOOR_Y = 244

export const WALL_BAND = { min: 54, max: FLOOR_Y - 6 }
export const FLOOR_BAND = { min: FLOOR_Y + 14, max: ROOM_H - 8 }

export const MAX_ITEMS = 18

export type Placed = {
  kind: FurnitureKind
  x: number
  y: number
}

export function sanitizeLayout(v: unknown): Placed[] {
  if (!Array.isArray(v)) return []
  const out: Placed[] = []
  for (const raw of v.slice(0, MAX_ITEMS)) {
    const o = (raw ?? {}) as Record<string, unknown>
    const f = typeof o.kind === 'string' ? furnitureOf(o.kind) : undefined
    if (!f) continue
    const x = Number(o.x)
    const y = Number(o.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    out.push(snap({ kind: f.kind, x, y }))
  }
  return out
}

/** 방 안으로, 그리고 알맞은 높이 구간으로 밀어 넣는다 */
export function snap(p: Placed): Placed {
  const f = furnitureOf(p.kind)
  if (!f) return p
  const band = f.onWall ? WALL_BAND : FLOOR_BAND
  return {
    kind: p.kind,
    x: clamp(p.x, f.halfW + 4, ROOM_W - f.halfW - 4),
    y: clamp(p.y, band.min, band.max),
  }
}

/** 가득 차면 가장 오래된 것을 밀어낸다 */
export function place(list: readonly Placed[], kind: FurnitureKind, x: number, y: number): Placed[] {
  const next = [...list, snap({ kind, x, y })]
  return next.length > MAX_ITEMS ? next.slice(next.length - MAX_ITEMS) : next
}

export function moveTo(list: readonly Placed[], index: number, x: number, y: number): Placed[] {
  const item = list[index]
  if (!item) return [...list]
  const next = [...list]
  next[index] = snap({ kind: item.kind, x, y })
  return next
}

export function removeAt(list: readonly Placed[], index: number): Placed[] {
  return list.filter((_, i) => i !== index)
}

/**
 * 그리는 순서 — y 가 작은(뒤쪽) 것부터.
 *
 * 인덱스를 함께 돌려준다. 정렬된 배열만 주면 어느 것을 지워야 할지
 * 호출부가 알 수 없다.
 */
export function drawOrder(list: readonly Placed[]): number[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.y - b.p.y || a.i - b.i)
    .map((e) => e.i)
}

/**
 * 두드린 자리의 물건. 앞(아래)에 있는 것이 먼저 잡힌다.
 */
export function pickAt(list: readonly Placed[], x: number, y: number): number | null {
  const order = drawOrder(list)
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k]!
    const p = list[i]!
    const f = furnitureOf(p.kind)
    if (!f) continue
    if (
      x >= p.x - f.halfW &&
      x <= p.x + f.halfW &&
      y >= p.y - f.height &&
      y <= p.y + 6
    ) {
      return i
    }
  }
  return null
}

export function countOf(list: readonly Placed[], kind: FurnitureKind): number {
  return list.filter((p) => p.kind === kind).length
}

export function hasKind(list: readonly Placed[], kind: FurnitureKind): boolean {
  return list.some((p) => p.kind === kind)
}
