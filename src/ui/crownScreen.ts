/**
 * 보석 왕관 공방 화면.
 *
 * 보석을 고르고 왕관의 칸을 두드리면 붙는다. 끌어다 놓기(drag)를 쓰지
 * 않는 이유는 네 살 손가락으로 정확히 끌기가 어렵기 때문이다 —
 * "고르고 두드리기" 가 훨씬 잘 통한다.
 */
import { VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { circlePath, rrectPath } from '../engine/shapes'
import { DOLL_H, DOLL_W } from '../doll/body'
import {
  BASES,
  GEMS,
  SLOTS,
  SLOT_LIFT,
  customCrownShapes,
  filledSlots,
  type CrownBase,
  type CrownDesign,
} from '../doll/custom'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import { cropFit, paintCrop, paintShape } from '../render/paint'
import {
  UI,
  drawButton,
  drawPanel,
  drawSky,
  drawTopBar,
  fillGlow,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'

/**
 * 머리 위쪽만 크게 보여 준다.
 *
 * y 를 0 보다 위에서 시작해 왕관 위에 여유를 둔다. 딱 맞추면 별 보석처럼
 * 위로 솟는 모양이 잘린다.
 */
export const HEAD_VIEW: Rect = { x: 64, y: 14, w: 72, h: 84 }
export const STAGE: Rect = { x: 18, y: 84, w: VIEW_W - 36, h: 206 }

const GEM_X = 23
const GEM_Y = 302
const GEM_W = 74
const GEM_H = 52

export function gemRect(i: number): Rect {
  return gridRect(i, 4, GEM_X, GEM_Y, GEM_W, GEM_H, 6, 6)
}

export function baseRect(i: number): Rect {
  return { x: 23 + i * 106, y: 422, w: 100, h: 36 }
}

export const ERASER_RECT: Rect = { x: 23, y: 468, w: 100, h: 44 }
export const CLEAR_RECT: Rect = { x: 129, y: 468, w: 100, h: 44 }
export const SAVE_RECT: Rect = { x: 235, y: 468, w: 100, h: 44 }

export function savedRect(i: number): Rect {
  return { x: 23 + i * 106, y: 524, w: 100, h: 74 }
}

export type CrownAction =
  | { kind: 'slot'; index: number }
  | { kind: 'gem'; index: number }
  | { kind: 'base'; base: CrownBase }
  | { kind: 'eraser' }
  | { kind: 'clear' }
  | { kind: 'save' }
  | { kind: 'saved'; index: number }

const SLOT_R = 18

/** 보석 칸 i 의 화면 좌표 */
export function slotPoint(i: number): [number, number] {
  const fit = cropFit(STAGE, HEAD_VIEW)
  const [sx, sy] = SLOTS[i]!
  return [fit.dx + sx * fit.k, fit.dy + (sy - SLOT_LIFT) * fit.k]
}

export function crownHit(px: number, py: number, savedCount: number): CrownAction | null {
  // 칸 사이가 손가락보다 좁다 — 반지름 안에서 가장 가까운 칸을 고른다
  let best = -1
  let bestD = SLOT_R * SLOT_R
  for (let i = 0; i < SLOTS.length; i++) {
    const [x, y] = slotPoint(i)
    const d = (px - x) ** 2 + (py - y) ** 2
    if (d <= bestD) {
      best = i
      bestD = d
    }
  }
  if (best >= 0) return { kind: 'slot', index: best }
  for (let i = 0; i < GEMS.length; i++) {
    if (inRect(gemRect(i), px, py)) return { kind: 'gem', index: i }
  }
  for (let i = 0; i < BASES.length; i++) {
    if (inRect(baseRect(i), px, py)) return { kind: 'base', base: BASES[i]!.id }
  }
  if (inRect(ERASER_RECT, px, py)) return { kind: 'eraser' }
  if (inRect(CLEAR_RECT, px, py)) return { kind: 'clear' }
  if (inRect(SAVE_RECT, px, py)) return { kind: 'save' }
  for (let i = 0; i < savedCount; i++) {
    if (inRect(savedRect(i), px, py)) return { kind: 'saved', index: i }
  }
  return null
}

export type CrownView = {
  design: CrownDesign
  outfit: Outfit
  resolve: Resolve
  /** 고른 보석. null 이면 지우개 */
  gem: number | null
  eraser: boolean
  saved: readonly CrownDesign[]
  muted: boolean
  message: string
  stickers?: number
}

export function drawCrownScreen(ctx: CanvasRenderingContext2D, v: CrownView): void {
  drawSky(ctx, 'lavender')

  // 작업대
  fillRRect(ctx, { ...STAGE, y: STAGE.y + 3 }, 16, UI.shadow)
  fillRRect(ctx, STAGE, 16, UI.panelSoft)
  strokeRRect(ctx, STAGE, 16, UI.panelLine, 1.6)

  // 왕관을 뺀 인형 + 지금 만드는 왕관
  const noCrown: Outfit = { ...v.outfit }
  delete noCrown.crown
  paintCrop(
    ctx,
    [...composeDoll(noCrown, { resolve: v.resolve, expr: 'smile' }), ...customCrownShapes(v.design)],
    STAGE,
    HEAD_VIEW,
  )

  // 빈 칸 표시 — 어디를 두드려야 하는지 보여 준다
  for (let i = 0; i < SLOTS.length; i++) {
    if (v.design.gems[i]) continue
    const [x, y] = slotPoint(i)
    paintShape(ctx, {
      d: circlePath(x, y, 7),
      stroke: 'rgba(74,51,87,.6)',
      lw: 1.6,
      dash: [3, 3],
    })
  }

  drawTopBar(ctx, '보석 왕관 공방', v.muted, {
    tag: `보석 ${filledSlots(v.design)} / ${SLOTS.length}`,
    tagIcon: '💎',
    stickers: v.stickers ?? 0,
  })

  // 안내 글은 얼굴 위에 겹치므로 띠를 깔고 얹는다
  fillRRect(
    ctx,
    { x: STAGE.x + 10, y: STAGE.y + STAGE.h - 28, w: STAGE.w - 20, h: 22 },
    11,
    UI.panel,
  )
  text(ctx, v.message, VIEW_W / 2, STAGE.y + STAGE.h - 17, {
    size: 11,
    bold: true,
    color: UI.ink,
    maxW: STAGE.w - 34,
  })
  // 보석 고르기
  for (let i = 0; i < GEMS.length; i++) {
    const g = GEMS[i]!
    const r = gemRect(i)
    const on = v.gem === i && !v.eraser
    fillRRect(ctx, { ...r, y: r.y + 2 }, 10, UI.shadow)
    if (on) fillGlow(ctx, r, 10)
    else fillRRect(ctx, r, 10, UI.cell)
    strokeRRect(ctx, r, 10, UI.white, on ? 2.4 : 1.4)
    paintShape(ctx, { d: circlePath(r.x + 18, r.y + 26, 12), fill: g.color })
    paintShape(ctx, { d: circlePath(r.x + 14, r.y + 22, 3.6), fill: 'rgba(255,255,255,.8)' })
    text(ctx, g.name, r.x + 36 + (r.w - 42) / 2, r.y + 26, {
      size: 9,
      bold: on,
      maxW: r.w - 42,
    })
  }

  // 왕관 바탕
  for (let i = 0; i < BASES.length; i++) {
    const b = BASES[i]!
    const r = baseRect(i)
    const on = v.design.base === b.id
    fillRRect(ctx, { ...r, y: r.y + 2 }, 10, UI.shadow)
    fillRRect(ctx, r, 10, on ? b.metal : UI.cell)
    strokeRRect(ctx, r, 10, UI.white, on ? 2.4 : 1.4)
    text(ctx, b.name, r.x + r.w / 2, r.y + r.h / 2, {
      size: 11,
      bold: true,
      color: UI.ink,
    })
  }

  drawButton(ctx, ERASER_RECT, '🧽 지우개', { accent: v.eraser ? UI.gold : UI.pinkSoft, size: 11 })
  drawButton(ctx, CLEAR_RECT, '↺ 다지우기', { accent: UI.lavenderSoft, size: 11 })
  drawButton(ctx, SAVE_RECT, '💾 옷장에', { accent: UI.green, size: 11 })

  // 저장한 왕관들
  drawPanel(ctx, { x: 18, y: 518, w: VIEW_W - 36, h: 86 }, 12)
  for (let i = 0; i < 3; i++) {
    const r = savedRect(i)
    const d = v.saved[i]
    if (!d) {
      fillRRect(ctx, r, 10, 'rgba(255,255,255,.35)')
      text(ctx, '빈 자리', r.x + r.w / 2, r.y + r.h / 2, { size: 9, color: UI.inkDim })
      continue
    }
    fillRRect(ctx, r, 10, UI.cell)
    strokeRRect(ctx, r, 10, UI.white, 1.4)
    paintCrop(ctx, customCrownShapes(d), { x: r.x + 4, y: r.y + 2, w: r.w - 8, h: r.h - 20 }, {
      x: 54,
      y: 8,
      w: 92,
      h: 56,
    })
    text(ctx, `내 왕관 ${i + 1}`, r.x + r.w / 2, r.y + r.h - 10, { size: 9, color: UI.inkSoft })
  }
}

/** 인형 전체 크기 — 다른 화면과 같은 값을 쓰기 위해 다시 내보낸다 */
export const DOLL_SIZE = { w: DOLL_W, h: DOLL_H }

/** 둥근 모서리 경로 (테스트에서 모양을 확인할 때 쓴다) */
export const panelPath = rrectPath
