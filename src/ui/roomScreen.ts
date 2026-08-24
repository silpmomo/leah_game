/**
 * 공주 방 꾸미기 화면.
 *
 * 위는 방, 아래는 가구 창고다. 가구를 고르고 방을 두드리면 놓이고,
 * 놓인 가구는 끌어서 옮긴다. 리아는 방 오른쪽에 서서 구경한다 —
 * 지금 입은 옷 그대로다.
 */
import { VIEW_H, VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { linear, rectPath, rrectPath, starPath, ellipsePath } from '../engine/shapes'
import { DOLL_H, DOLL_W } from '../doll/body'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import { FURNITURE, furnitureOf } from '../room/items'
import { FLOOR_Y, ROOM_H, ROOM_W, drawOrder, type Placed } from '../room/rules'
import { paintCrop, paintInBox, paintShape } from '../render/paint'
import { TOP_H, UI, drawButton, drawTopBar, fillRRect, strokeRRect, text } from '../render/ui'

export const ROOM_RECT: Rect = { x: 0, y: TOP_H, w: ROOM_W, h: ROOM_H }

export const PER_PAGE = 8
const CELL_W = 76
const CELL_H = 50
const PAL_X = 28
const PAL_Y = 446

export function paletteRect(i: number): Rect {
  return gridRect(i, 4, PAL_X, PAL_Y, CELL_W, CELL_H, 6, 6)
}

export const PREV_RECT: Rect = { x: 3, y: 464, w: 22, h: 74 }
export const NEXT_RECT: Rect = { x: VIEW_W - 25, y: 464, w: 22, h: 74 }
export const TRASH_RECT: Rect = { x: 40, y: 560, w: 130, h: 46 }
export const CLEAR_RECT: Rect = { x: 190, y: 560, w: 130, h: 46 }

export function pageCountOf(): number {
  return Math.ceil(FURNITURE.length / PER_PAGE)
}

export type RoomAction =
  | { kind: 'room'; x: number; y: number }
  | { kind: 'palette'; index: number }
  | { kind: 'page'; dir: 1 | -1 }
  | { kind: 'trash' }
  | { kind: 'clear' }

export function roomHit(px: number, py: number): RoomAction | null {
  if (inRect(ROOM_RECT, px, py)) {
    return { kind: 'room', x: px - ROOM_RECT.x, y: py - ROOM_RECT.y }
  }
  for (let i = 0; i < PER_PAGE; i++) {
    if (inRect(paletteRect(i), px, py)) return { kind: 'palette', index: i }
  }
  if (inRect(PREV_RECT, px, py)) return { kind: 'page', dir: -1 }
  if (inRect(NEXT_RECT, px, py)) return { kind: 'page', dir: 1 }
  if (inRect(TRASH_RECT, px, py)) return { kind: 'trash' }
  if (inRect(CLEAR_RECT, px, py)) return { kind: 'clear' }
  return null
}

/** 방 바탕 — 벽지와 마루 */
function roomScene(): Parameters<typeof paintShape>[1][] {
  const out: Parameters<typeof paintShape>[1][] = [
    {
      d: rectPath(0, 0, ROOM_W, FLOOR_Y),
      fill: linear(0, 0, 0, FLOOR_Y, [
        [0, '#ffd9ea'],
        [1, '#ffeaf3'],
      ]),
    },
  ]
  // 벽지 줄무늬
  for (let i = 0; i < 9; i++) {
    out.push({
      d: rectPath(i * 42 + 12, 0, 12, FLOOR_Y),
      fill: 'rgba(255,255,255,.45)',
    })
  }
  // 벽지 별
  for (let i = 0; i < 10; i++) {
    out.push({
      d: starPath(26 + ((i * 71) % (ROOM_W - 40)), 30 + ((i * 53) % (FLOOR_Y - 70)), 5, 2),
      fill: 'rgba(255,255,255,.7)',
    })
  }
  out.push(
    { d: rectPath(0, FLOOR_Y - 12, ROOM_W, 14), fill: '#f7f0f8' },
    {
      d: rectPath(0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y),
      fill: linear(0, FLOOR_Y, 0, ROOM_H, [
        [0, '#e8c39a'],
        [1, '#c99a6c'],
      ]),
    },
  )
  for (let i = 1; i < 8; i++) {
    out.push({
      d: `M${(i * ROOM_W) / 8},${FLOOR_Y}L${(i * ROOM_W) / 8 - 40},${ROOM_H}`,
      stroke: 'rgba(255,255,255,.28)',
      lw: 1.4,
    })
  }
  return out
}

export type RoomView = {
  layout: readonly Placed[]
  /** 창고에서 고른 가구 (없으면 null) */
  picked: string | null
  /** 방에서 잡은 가구 번호 */
  selected: number | null
  page: number
  outfit: Outfit
  resolve: Resolve
  muted: boolean
  message: string
}

export function drawRoomScreen(ctx: CanvasRenderingContext2D, v: RoomView): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#2a1338' })

  // 방
  ctx.save()
  ctx.beginPath()
  ctx.clip(new Path2D(rrectPath(ROOM_RECT.x, ROOM_RECT.y, ROOM_RECT.w, ROOM_RECT.h, 0)))
  ctx.translate(ROOM_RECT.x, ROOM_RECT.y)
  for (const s of roomScene()) paintShape(ctx, s)

  // 가구 — 뒤(위)부터
  for (const i of drawOrder(v.layout)) {
    const p = v.layout[i]!
    const f = furnitureOf(p.kind)
    if (!f) continue
    if (i === v.selected) {
      paintShape(ctx, {
        d: ellipsePath(p.x, p.y, f.halfW + 4, 8),
        fill: 'rgba(255,215,106,.55)',
      })
    }
    for (const s of f.build(p.x, p.y)) paintShape(ctx, s)
  }

  // 리아는 오른쪽에서 구경한다
  ctx.translate(-ROOM_RECT.x, -ROOM_RECT.y)
  paintInBox(
    ctx,
    composeDoll(v.outfit, { resolve: v.resolve, expr: 'happy' }),
    { x: ROOM_RECT.x + 258, y: ROOM_RECT.y + ROOM_H - 168, w: 96, h: 164 },
    { w: DOLL_W, h: DOLL_H },
  )
  ctx.restore()

  strokeRRect(ctx, ROOM_RECT, 0, 'rgba(255,255,255,.18)', 1)
  drawTopBar(ctx, '공주 방 꾸미기', v.muted)

  // 안내 한 줄
  fillRRect(ctx, { x: 8, y: ROOM_RECT.y + ROOM_H - 26, w: VIEW_W - 16, h: 20 }, 8, 'rgba(24,8,36,.6)')
  text(ctx, v.message, VIEW_W / 2, ROOM_RECT.y + ROOM_H - 16, {
    size: 10,
    bold: true,
    maxW: VIEW_W - 30,
  })

  // 창고
  const start = v.page * PER_PAGE
  for (let i = 0; i < PER_PAGE; i++) {
    const f = FURNITURE[start + i]
    const r = paletteRect(i)
    if (!f) {
      fillRRect(ctx, r, 10, 'rgba(255,255,255,.05)')
      continue
    }
    const on = v.picked === f.kind
    fillRRect(ctx, r, 10, on ? 'rgba(127,227,212,.32)' : 'rgba(255,255,255,.12)')
    strokeRRect(ctx, r, 10, on ? '#ffffff' : 'rgba(255,255,255,.18)', on ? 2.2 : 1.2)
    paintCrop(
      ctx,
      f.build(0, 0),
      { x: r.x + 3, y: r.y + 2, w: r.w - 6, h: r.h - 14 },
      { x: -f.halfW - 3, y: -f.height - 4, w: f.halfW * 2 + 6, h: f.height + 8 },
    )
    text(ctx, f.name, r.x + r.w / 2, r.y + r.h - 7, {
      size: 7.5,
      color: on ? UI.ink : UI.inkSoft,
      maxW: r.w - 4,
    })
  }

  if (pageCountOf() > 1) {
    for (const [r, label] of [
      [PREV_RECT, '◀'],
      [NEXT_RECT, '▶'],
    ] as const) {
      fillRRect(ctx, r, 8, 'rgba(255,255,255,.14)')
      text(ctx, label, r.x + r.w / 2, r.y + r.h / 2, { size: 11 })
    }
  }

  drawButton(ctx, TRASH_RECT, '🗑️ 치우기', {
    accent: '#ffb1d1',
    disabled: v.selected === null,
    size: 12,
  })
  drawButton(ctx, CLEAR_RECT, '↺ 다치우기', { accent: UI.violet, size: 12 })
}
