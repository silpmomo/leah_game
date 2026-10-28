/**
 * 공주 옷장 화면.
 *
 * 배경이 화면 전체에 깔리고 인형이 왼쪽에 크게 선다. 오른쪽은 세 열 —
 * [색 견본 · 옷 세로 목록 · 분류 레일]. 아래 왼쪽에 원형 도구 버튼.
 * 참고작(docs/DESIGN.md)의 옷장 구성을 360 x 640 에 맞춰 옮겼다.
 *
 * 스크롤은 없다 — 아이가 스크롤로 길을 잃는 것보다 ▲▼ 화살표가 낫다.
 */
import { VIEW_H, VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { circlePath, rectPath, rrectPath, starPath, type Shape } from '../engine/shapes'
import { DOLL_H, DOLL_W, armShapes, bodyShapes, type Expression } from '../doll/body'
import { backdropById, type BackdropId } from '../doll/backdrop'
import { BACKDROPS } from '../doll/backdrop'
import { CATEGORIES, type Category, type Item } from '../doll/kinds'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import { SWATCHES, isTintable, swatchCount, tintFor, type Tints } from '../doll/tint'
import type { Look } from '../closet/state'
import { paintCrop, paintInBox, paintShape } from '../render/paint'
import {
  CTA_H,
  UI,
  drawBubble,
  drawCheckBadge,
  drawCta,
  drawPanel,
  drawRoundButton,
  drawSky,
  drawTopBar,
  fillGlow,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'

/** 무대 = 화면 전체. 배경이 HUD 뒤까지 깔린다 */
export const STAGE: Rect = { x: 0, y: 0, w: VIEW_W, h: VIEW_H }

/**
 * 인형이 서는 자리 — 왼쪽, 아래 맞춤.
 *
 * 폭 200 이면 인형 좌표계(200 x 440)가 배율 1 로 그려져 가장 크다.
 * 머리 위 빈 공간(y 90~140)에 말풍선이 뜬다.
 */
export const DOLL_BOX: Rect = { x: 0, y: 100, w: 200, h: 462 }

/** 인형 가슴께 — 반짝임이 터지는 자리 */
export const DOLL_CENTER: readonly [number, number] = [100, 270]

/** 말풍선 — HUD 아래, 머리 위 */
export const BUBBLE_RECT: Rect = { x: 8, y: 90, w: 184, h: 32 }

// ── 분류 레일 (오른쪽 끝) ────────────────────────────────────────

const RAIL_X = 306
const RAIL_Y = 92
const RAIL_D = 42
const RAIL_GAP = 4

export function tabRect(i: number): Rect {
  return { x: RAIL_X, y: RAIL_Y + i * (RAIL_D + RAIL_GAP), w: 44, h: RAIL_D }
}

// ── 옷 세로 목록 ───────────────────────────────────────────────

export const PER_PAGE = 6
const LIST_X = 226
const LIST_Y = 104
const CELL_W = 72
const CELL_H = 62
const CELL_GAP = 4

export function itemRect(i: number): Rect {
  return { x: LIST_X, y: LIST_Y + i * (CELL_H + CELL_GAP), w: CELL_W, h: CELL_H }
}

/** 위·아래 화살표 — 이름은 옛 화면(◀ ▶)에서 이어받았다 */
export const PREV_RECT: Rect = { x: LIST_X, y: 84, w: CELL_W, h: 18 }
export const NEXT_RECT: Rect = { x: LIST_X, y: LIST_Y + PER_PAGE * (CELL_H + CELL_GAP) + 2, w: CELL_W, h: 18 }

// ── 색 견본 ────────────────────────────────────────────────────

const SWATCH_X = 195
const SWATCH_Y = 140
const SWATCH_D = 26
const SWATCH_GAP = 2

/** 0 번은 원래 색. 1~n 이 팔레트 */
export function swatchRect(i: number): Rect {
  return { x: SWATCH_X, y: SWATCH_Y + i * (SWATCH_D + SWATCH_GAP), w: SWATCH_D, h: SWATCH_D }
}

export function swatchPillRect(count: number): Rect {
  const first = swatchRect(0)
  const last = swatchRect(count)
  return { x: first.x - 3, y: first.y - 4, w: SWATCH_D + 6, h: last.y + last.h - first.y + 8 }
}

// ── 도구 ───────────────────────────────────────────────────────

export type ToolName = 'random' | 'strip' | 'backdrop' | 'photo' | 'lookbook' | 'done' | 'hint'

const TOOL_DEF: Record<ToolName, { icon: string; label: string; accent: string }> = {
  random: { icon: '🎲', label: '랜덤', accent: '#dff7f2' },
  strip: { icon: '↺', label: '다벗기', accent: '#ffe1ea' },
  backdrop: { icon: '🌈', label: '배경', accent: '#ece0fb' },
  photo: { icon: '📷', label: '사진', accent: '#fff2cc' },
  lookbook: { icon: '🖼️', label: '룩북', accent: '#ffe4f1' },
  done: { icon: '✔️', label: '완성!', accent: UI.green },
  hint: { icon: '💡', label: '힌트', accent: '#fff2cc' },
}

export const CLOSET_TOOLS: readonly ToolName[] = [
  'random',
  'strip',
  'backdrop',
  'photo',
  'lookbook',
]

const TOOL_R = 22
const TOOL_CY = 606
const TOOL_STEP = 54

/** 큰 초록 버튼 자리 — 패션쇼 "완성!" */
export const CTA_RECT: Rect = { x: 226, y: TOOL_CY - CTA_H / 2, w: 126, h: CTA_H }

/**
 * 도구 i 번의 자리.
 *
 * 'done' 은 오른쪽 아래 큰 초록 버튼이고 나머지는 왼쪽부터 원형으로 늘어선다.
 */
export function toolRect(i: number, tools: readonly ToolName[]): Rect {
  if (tools[i] === 'done') return CTA_RECT
  const slot = tools.slice(0, i).filter((t) => t !== 'done').length
  const cx = 30 + slot * TOOL_STEP
  return { x: cx - TOOL_R, y: TOOL_CY - TOOL_R, w: TOOL_R * 2, h: TOOL_R * 2 }
}

export type ClosetAction =
  | { kind: 'tab'; cat: Category }
  | { kind: 'item'; index: number }
  | { kind: 'page'; dir: 1 | -1 }
  | { kind: 'tool'; name: ToolName }
  | { kind: 'swatch'; index: number }

/**
 * 어디를 눌렀나.
 *
 * `shown` 은 지금 페이지의 옷 칸 수 — 빈 칸을 눌러도 아무 일이 없어야 한다.
 * `swatches` 는 색 견본 수(0 이면 숨김). 0 번(원래 색)은 항상 같이 센다.
 */
export function closetHit(
  px: number,
  py: number,
  shown: number,
  tools: readonly ToolName[] = CLOSET_TOOLS,
  swatches = 0,
): ClosetAction | null {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (inRect(tabRect(i), px, py)) return { kind: 'tab', cat: CATEGORIES[i]!.id }
  }
  for (let i = 0; i < shown; i++) {
    if (inRect(itemRect(i), px, py)) return { kind: 'item', index: i }
  }
  if (inRect(PREV_RECT, px, py)) return { kind: 'page', dir: -1 }
  if (inRect(NEXT_RECT, px, py)) return { kind: 'page', dir: 1 }
  for (let i = 0; i < tools.length; i++) {
    if (inRect(toolRect(i, tools), px, py)) return { kind: 'tool', name: tools[i]! }
  }
  for (let i = 0; i <= swatches && swatches > 0; i++) {
    if (inRect(swatchRect(i), px, py)) return { kind: 'swatch', index: i }
  }
  return null
}

export type ClosetView = {
  outfit: Outfit
  resolve: Resolve
  backdrop: BackdropId
  cat: Category
  /** 지금 페이지에 보이는 아이템들 */
  shown: readonly Item[]
  page: number
  pages: number
  muted: boolean
  /** 인형 머리 위에 뜨는 한 줄. 없으면 안 그린다 */
  toast: string | null
  toastEmoji: string
  expr: Expression
  tints: Tints
  stickers: number
}

/** 무대 — 배경과 인형. 여러 화면이 같이 쓴다 */
export function drawStage(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  backdrop: BackdropId,
  shapes: readonly Shape[],
  radius = 0,
  dollBox: Rect = box,
): void {
  ctx.save()
  ctx.beginPath()
  if (radius > 0) {
    const p = new Path2D(rrectPath(box.x, box.y, box.w, box.h, radius))
    ctx.clip(p)
  } else {
    ctx.rect(box.x, box.y, box.w, box.h)
    ctx.clip()
  }
  ctx.translate(box.x, box.y)
  const bd = backdropById(backdrop)
  for (const s of bd.build(box.w, box.h)) paintShape(ctx, s)
  ctx.translate(-box.x, -box.y)
  paintInBox(ctx, shapes, dollBox, { w: DOLL_W, h: DOLL_H }, 'bottom')
  ctx.restore()
}

function catOf(id: Category): { name: string; icon: string } {
  return CATEGORIES.find((c) => c.id === id) ?? { name: '', icon: '' }
}

export function drawCloset(ctx: CanvasRenderingContext2D, v: ClosetView): void {
  drawStage(
    ctx,
    STAGE,
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve, expr: v.expr, tints: v.tints }),
    0,
    DOLL_BOX,
  )
  const c = catOf(v.cat)
  drawTopBar(ctx, '공주 옷장', v.muted, { tag: c.name, tagIcon: c.icon, stickers: v.stickers })

  if (v.toast) drawBubble(ctx, BUBBLE_RECT, v.toast, v.toastEmoji)

  if (isTintable(v.cat)) drawSwatches(ctx, v.cat, v.tints)
  drawItemGrid(ctx, v.shown, v.outfit, v.page, v.pages, v.tints)
  drawTabs(ctx, v.cat, v.outfit)
  drawTools(ctx, CLOSET_TOOLS)
}

/**
 * 분류 레일 — 옷장과 패션쇼가 같이 쓴다.
 *
 * 착용 중인 분류에 초록 ✓ 배지가 붙는다. 아이가 "뭘 입혔더라" 를 레일만
 * 보고 안다.
 */
export function drawTabs(ctx: CanvasRenderingContext2D, current: Category, outfit: Outfit = {}): void {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!
    const r = tabRect(i)
    const on = c.id === current
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    const rad = RAIL_D / 2
    paintShape(ctx, { d: circlePath(cx, cy + 2, rad), fill: UI.shadow })
    paintShape(ctx, { d: circlePath(cx, cy, rad), fill: on ? UI.gold : '#f6dfe8' })
    paintShape(ctx, { d: circlePath(cx, cy, rad), stroke: UI.white, lw: on ? 3 : 2 })
    text(ctx, c.icon, cx, cy + 1, { size: 19 })
    if (outfit[c.id]) drawCheckBadge(ctx, cx + rad - 6, cy + rad - 6, 7)
  }
}

/** 회색 마네킹 — 옷 칸 썸네일 뒤에 깔린다. 참고작처럼 "옷만" 보이게 */
const MANNEQUIN: readonly Shape[] = [...bodyShapes(), ...armShapes()].map((s) => ({
  d: s.d,
  ...(s.fill ? { fill: '#cfc6da' } : {}),
  ...(s.stroke ? { stroke: '#cfc6da', lw: s.lw, cap: s.cap } : {}),
}))

/** 옷 세로 목록 */
export function drawItemGrid(
  ctx: CanvasRenderingContext2D,
  shown: readonly Item[],
  outfit: Outfit,
  page: number,
  pages: number,
  tints: Tints = {},
): void {
  for (let i = 0; i < PER_PAGE; i++) {
    const r = itemRect(i)
    const item = shown[i]
    if (!item) {
      fillRRect(ctx, r, 10, 'rgba(255,255,255,.22)')
      continue
    }
    const on = outfit[item.cat] === item.id
    fillRRect(ctx, { ...r, y: r.y + 2 }, 10, UI.shadow)
    if (on) fillGlow(ctx, r, 10)
    else fillRRect(ctx, r, 10, UI.cell)
    strokeRRect(ctx, r, 10, on ? UI.white : UI.cellLine, on ? 2.4 : 1.4)

    const back = tintFor(item.cat, tints, item.back ?? [])
    const front = tintFor(item.cat, tints, item.front)
    const sleeves = tintFor(item.cat, tints, item.sleeves ?? [])
    paintCrop(
      ctx,
      [...back, ...MANNEQUIN, ...front, ...sleeves],
      { x: r.x + 3, y: r.y + 2, w: r.w - 6, h: r.h - 14 },
      item.thumb,
    )
    text(ctx, item.name, r.x + r.w / 2, r.y + r.h - 7, {
      size: 7.5,
      bold: on,
      color: UI.ink,
      maxW: r.w - 6,
    })
    // 내가 만든 왕관 — 참고작의 희귀 리본 자리
    if (item.custom) {
      paintShape(ctx, {
        d: `M${r.x + r.w - 22},${r.y + r.h}L${r.x + r.w},${r.y + r.h - 22}L${r.x + r.w},${r.y + r.h}Z`,
        fill: UI.mint,
      })
      text(ctx, '✨', r.x + r.w - 7, r.y + r.h - 6, { size: 8 })
    }
    if (on) drawCheckBadge(ctx, r.x + 9, r.y + 9, 7)
  }

  // 위·아래 화살표
  if (pages > 1) {
    for (const [r, label] of [
      [PREV_RECT, '▲'],
      [NEXT_RECT, '▼'],
    ] as const) {
      fillRRect(ctx, r, 9, UI.panel)
      text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 0.5, { size: 9, color: UI.lavender })
    }
    text(ctx, `${page + 1}/${pages}`, NEXT_RECT.x + NEXT_RECT.w / 2, NEXT_RECT.y + NEXT_RECT.h + 8, {
      size: 8,
      bold: true,
      color: UI.ink,
    })
  }
}

/** 색 견본 열 — 0 번(원래 색)은 흰 바탕에 ↺ */
export function drawSwatches(ctx: CanvasRenderingContext2D, cat: Category, tints: Tints): void {
  const list = SWATCHES[cat] ?? []
  const n = list.length
  if (n === 0) return
  const pill = swatchPillRect(n)
  fillRRect(ctx, { ...pill, y: pill.y + 2 }, pill.w / 2, UI.shadow)
  fillRRect(ctx, pill, pill.w / 2, UI.panel)
  const current = tints[cat] ?? 0
  for (let i = 0; i <= n; i++) {
    const r = swatchRect(i)
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    const color = i === 0 ? '#ffffff' : list[i - 1]!
    paintShape(ctx, { d: circlePath(cx, cy, SWATCH_D / 2 - 1), fill: color })
    paintShape(ctx, {
      d: circlePath(cx, cy, SWATCH_D / 2 - 1),
      stroke: i === current ? UI.ink : 'rgba(74,51,87,.18)',
      lw: i === current ? 2 : 1,
    })
    if (i === 0) text(ctx, '↺', cx, cy + 0.5, { size: 12, bold: true, color: UI.ink })
    else if (i === current) {
      text(ctx, '✓', cx, cy + 0.5, { size: 12, bold: true, color: UI.white, stroke: 'rgba(0,0,0,.35)', strokeW: 2 })
    }
  }
}

/** 아래 도구 — 원형 유리 버튼. 'done' 은 큰 초록 버튼 */
export function drawTools(
  ctx: CanvasRenderingContext2D,
  tools: readonly ToolName[],
  disabled: readonly ToolName[] = [],
): void {
  for (let i = 0; i < tools.length; i++) {
    const name = tools[i]!
    const t = TOOL_DEF[name]
    const r = toolRect(i, tools)
    const off = disabled.includes(name)
    if (name === 'done') {
      drawCta(ctx, r, t.label, { disabled: off })
      continue
    }
    drawRoundButton(ctx, r.x + r.w / 2, r.y + r.h / 2, TOOL_R, t.icon, {
      accent: t.accent,
      disabled: off,
      label: t.label,
      iconSize: 17,
    })
  }
}

// ── 배경 고르기 ────────────────────────────────────────────────

export function backdropRect(i: number): Rect {
  return gridRect(i, 2, 22, 96, 152, 104, 12, 10)
}

export function backdropHit(px: number, py: number): BackdropId | null {
  for (let i = 0; i < BACKDROPS.length; i++) {
    if (inRect(backdropRect(i), px, py)) return BACKDROPS[i]!.id
  }
  return null
}

export function drawBackdropPicker(
  ctx: CanvasRenderingContext2D,
  current: BackdropId,
  muted: boolean,
  stickers = 0,
): void {
  drawSky(ctx, 'lavender')
  drawTopBar(ctx, '배경 고르기', muted, { back: '옷장', tag: '어디에서 놀까요?', tagIcon: '🌈', stickers })

  for (let i = 0; i < BACKDROPS.length; i++) {
    const b = BACKDROPS[i]!
    const r = backdropRect(i)
    const on = b.id === current
    const pic: Rect = { ...r, h: r.h - 22 }

    fillRRect(ctx, { ...r, y: r.y + 3 }, 12, UI.shadow)
    fillRRect(ctx, r, 12, UI.panel)
    ctx.save()
    ctx.beginPath()
    ctx.clip(new Path2D(rrectPath(pic.x + 3, pic.y + 3, pic.w - 6, pic.h - 3, 10)))
    ctx.translate(pic.x + 3, pic.y + 3)
    for (const s of b.build(pic.w - 6, pic.h - 3)) paintShape(ctx, s)
    ctx.restore()

    strokeRRect(ctx, r, 12, on ? UI.gold : UI.panelLine, on ? 3 : 1.4)
    text(ctx, `${b.icon} ${b.name}`, r.x + r.w / 2, r.y + r.h - 10, {
      size: 11,
      bold: true,
      color: UI.ink,
    })
    if (on) drawCheckBadge(ctx, r.x + r.w - 12, r.y + 12, 8)
  }
}

// ── 룩북 ───────────────────────────────────────────────────────

export function lookRect(i: number): Rect {
  return gridRect(i, 3, 21, 100, 100, 150, 9, 8)
}

export function lookDeleteRect(i: number): Rect {
  const r = lookRect(i)
  return { x: r.x + r.w - 24, y: r.y + 2, w: 22, h: 22 }
}

export type LookAction = { kind: 'load'; index: number } | { kind: 'delete'; index: number }

export function lookHit(px: number, py: number, count: number): LookAction | null {
  for (let i = 0; i < count; i++) {
    if (inRect(lookDeleteRect(i), px, py)) return { kind: 'delete', index: i }
    if (inRect(lookRect(i), px, py)) return { kind: 'load', index: i }
  }
  return null
}

export function drawLookbook(
  ctx: CanvasRenderingContext2D,
  looks: readonly Look[],
  resolve: Resolve,
  muted: boolean,
  stickers = 0,
): void {
  drawSky(ctx, 'pink')
  drawTopBar(ctx, '룩북', muted, {
    back: '옷장',
    tag: looks.length > 0 ? `사진 ${looks.length} / 9` : '아직 없어요',
    tagIcon: '📷',
    stickers,
  })

  if (looks.length === 0) {
    drawPanel(ctx, { x: 40, y: 220, w: VIEW_W - 80, h: 140 })
    text(ctx, '📷', VIEW_W / 2, 268, { size: 34 })
    text(ctx, '아직 담은 사진이 없어요', VIEW_W / 2, 312, { size: 12, bold: true })
    text(ctx, '옷장에서 사진 버튼을 눌러보세요', VIEW_W / 2, 334, {
      size: 10,
      color: UI.inkSoft,
    })
    return
  }

  for (let i = 0; i < looks.length; i++) {
    const look = looks[i]!
    const r = lookRect(i)
    fillRRect(ctx, { ...r, y: r.y + 3 }, 12, UI.shadow)
    drawStage(
      ctx,
      r,
      look.backdrop,
      composeDoll(look.outfit, { resolve, expr: 'smile', tints: look.tints }),
      12,
    )
    strokeRRect(ctx, r, 12, UI.panelLine, 2)
    const d = lookDeleteRect(i)
    paintShape(ctx, { d: circlePath(d.x + d.w / 2, d.y + d.h / 2, 10), fill: UI.panel })
    text(ctx, '🗑️', d.x + d.w / 2, d.y + d.h / 2, { size: 10 })
    paintShape(ctx, {
      d: starPath(r.x + 12, r.y + r.h - 12, 6, 2.6),
      fill: UI.gold,
    })
  }
  text(ctx, '누르면 그 코디로 갈아입어요', VIEW_W / 2, 596, { size: 10, color: UI.inkSoft })
}

/** 화면 전체 사각형 경로 — 다른 화면이 바탕을 깔 때 쓴다 */
export const fullRectPath = (): string => rectPath(0, 0, VIEW_W, VIEW_H)
