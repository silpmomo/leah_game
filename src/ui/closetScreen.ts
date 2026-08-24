/**
 * 공주 옷장 화면.
 *
 * 세로 한 화면에 [무대 · 분류 탭 · 옷 칸 · 도구] 를 층으로 쌓는다.
 * 스크롤은 없다 — 아이가 스크롤로 길을 잃는 것보다 페이지 화살표가 낫다.
 */
import { VIEW_H, VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { rectPath, rrectPath, starPath } from '../engine/shapes'
import { DOLL_H, DOLL_W, type Expression } from '../doll/body'
import { backdropById, type BackdropId } from '../doll/backdrop'
import { BACKDROPS } from '../doll/backdrop'
import { CATEGORIES, type Category, type Item } from '../doll/kinds'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import type { Look } from '../closet/state'
import { paintCrop, paintInBox, paintShape } from '../render/paint'
import {
  TOP_H,
  UI,
  drawBubble,
  drawPanel,
  drawTopBar,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'

export const STAGE: Rect = { x: 0, y: TOP_H, w: VIEW_W, h: 310 }

/**
 * 인형이 서는 자리.
 *
 * 무대보다 아래를 60 만큼 비워 둔다. 그 자리에 말풍선(옷장)이나 부탁
 * 카드(패션쇼)가 뜨기 때문이다. 무대 전체를 쓰게 했더니 말풍선이 구두를
 * 가려서, 구두를 골라도 뭘 신었는지 보이지 않았다.
 */
export const DOLL_BOX: Rect = {
  x: STAGE.x + 8,
  y: STAGE.y + 4,
  w: STAGE.w - 16,
  h: STAGE.h - 62,
}

const TAB_Y = 360
const TAB_H = 30
const TAB_GAP = 4
const TAB_COLS = 5
const TAB_W = 65

export function tabRect(i: number): Rect {
  const c = i % TAB_COLS
  const r = Math.floor(i / TAB_COLS)
  return { x: 8 + c * (TAB_W + TAB_GAP), y: TAB_Y + r * (TAB_H + TAB_GAP), w: TAB_W, h: TAB_H }
}

export const PER_PAGE = 8
const CELL_W = 72
const CELL_H = 58
const GRID_X = 27
const GRID_Y = 430

export function itemRect(i: number): Rect {
  return gridRect(i, 4, GRID_X, GRID_Y, CELL_W, CELL_H, 6, 6)
}

export const PREV_RECT: Rect = { x: 3, y: GRID_Y + 18, w: 22, h: 84 }
export const NEXT_RECT: Rect = { x: VIEW_W - 25, y: GRID_Y + 18, w: 22, h: 84 }

export type ToolName = 'random' | 'strip' | 'backdrop' | 'photo' | 'lookbook' | 'done' | 'hint'

const TOOL_DEF: Record<ToolName, { icon: string; label: string; accent: string }> = {
  random: { icon: '🎲', label: '랜덤', accent: UI.mint },
  strip: { icon: '↺', label: '다벗기', accent: '#ffb1d1' },
  backdrop: { icon: '🌈', label: '배경', accent: UI.violet },
  photo: { icon: '📷', label: '사진', accent: UI.gold },
  lookbook: { icon: '🖼️', label: '룩북', accent: '#ffc9e4' },
  done: { icon: '✔️', label: '완성!', accent: UI.gold },
  hint: { icon: '💡', label: '힌트', accent: '#ffe0a8' },
}

export const CLOSET_TOOLS: readonly ToolName[] = [
  'random',
  'strip',
  'backdrop',
  'photo',
  'lookbook',
]

const TOOL_Y = 558
const TOOL_H = 46

/** 개수에 맞춰 가운데 정렬. 패션쇼는 도구가 셋뿐이다 */
export function toolRect(i: number, count: number): Rect {
  const gap = 8
  const w = Math.min(84, (VIEW_W - 26 - gap * (count - 1)) / count)
  const rowW = w * count + gap * (count - 1)
  return { x: (VIEW_W - rowW) / 2 + i * (w + gap), y: TOOL_Y, w, h: TOOL_H }
}

export type ClosetAction =
  | { kind: 'tab'; cat: Category }
  | { kind: 'item'; index: number }
  | { kind: 'page'; dir: 1 | -1 }
  | { kind: 'tool'; name: ToolName }

/** 아이템 칸 수를 알아야 페이지 밖 칸을 무시할 수 있다 */
export function closetHit(
  px: number,
  py: number,
  shown: number,
  tools: readonly ToolName[] = CLOSET_TOOLS,
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
    if (inRect(toolRect(i, tools.length), px, py)) return { kind: 'tool', name: tools[i]! }
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
  /** 무대 아래에 뜨는 한 줄. 없으면 안 그린다 */
  toast: string | null
  toastEmoji: string
  expr: Expression
}

/** 무대 — 배경과 인형. 여러 화면이 같이 쓴다 */
export function drawStage(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  backdrop: BackdropId,
  shapes: Parameters<typeof paintInBox>[1],
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

export function drawCloset(ctx: CanvasRenderingContext2D, v: ClosetView): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#31163f' })

  drawStage(
    ctx,
    STAGE,
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve, expr: v.expr }),
    0,
    DOLL_BOX,
  )
  drawTopBar(ctx, '공주 옷장', v.muted)

  if (v.toast) {
    drawBubble(
      ctx,
      { x: 18, y: STAGE.y + STAGE.h - 54, w: VIEW_W - 36, h: 34 },
      v.toast,
      v.toastEmoji,
    )
  }

  drawTabs(ctx, v.cat)
  drawItemGrid(ctx, v.shown, v.outfit, v.page, v.pages)
  drawTools(ctx, CLOSET_TOOLS)
}

/** 분류 탭 — 옷장과 패션쇼가 같이 쓴다 */
export function drawTabs(ctx: CanvasRenderingContext2D, current: Category): void {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!
    const r = tabRect(i)
    const on = c.id === current
    fillRRect(ctx, r, 10, on ? UI.pink : 'rgba(255,255,255,.12)')
    if (on) strokeRRect(ctx, r, 10, '#ffffff', 2)
    text(ctx, c.icon, r.x + r.w / 2, r.y + 12, { size: 13 })
    text(ctx, c.name, r.x + r.w / 2, r.y + 23, {
      size: 8.5,
      bold: on,
      color: on ? '#43163f' : UI.inkSoft,
      maxW: r.w - 4,
    })
  }
}

/** 옷 칸 격자 */
export function drawItemGrid(
  ctx: CanvasRenderingContext2D,
  shown: readonly Item[],
  outfit: Outfit,
  page: number,
  pages: number,
): void {
  for (let i = 0; i < PER_PAGE; i++) {
    const r = itemRect(i)
    const item = shown[i]
    if (!item) {
      fillRRect(ctx, r, 10, 'rgba(255,255,255,.05)')
      continue
    }
    const on = outfit[item.cat] === item.id
    fillRRect(ctx, r, 10, on ? 'rgba(255,143,192,.3)' : 'rgba(255,255,255,.12)')
    strokeRRect(ctx, r, 10, on ? '#ffffff' : 'rgba(255,255,255,.18)', on ? 2.2 : 1.2)
    paintCrop(ctx, item.front.length > 0 ? item.front : (item.back ?? item.sleeves ?? []), {
      x: r.x + 3,
      y: r.y + 2,
      w: r.w - 6,
      h: r.h - 14,
    }, item.thumb)
    text(ctx, item.name, r.x + r.w / 2, r.y + r.h - 7, {
      size: 7.5,
      color: on ? UI.ink : UI.inkSoft,
      maxW: r.w - 4,
    })
    if (item.custom) text(ctx, '✨', r.x + r.w - 9, r.y + 9, { size: 9 })
    if (on) text(ctx, '✓', r.x + 9, r.y + 9, { size: 10, bold: true, color: UI.gold })
  }

  // 페이지 화살표
  if (pages > 1) {
    for (const [r, label] of [
      [PREV_RECT, '◀'],
      [NEXT_RECT, '▶'],
    ] as const) {
      fillRRect(ctx, r, 8, 'rgba(255,255,255,.14)')
      text(ctx, label, r.x + r.w / 2, r.y + r.h / 2, { size: 11 })
    }
    text(ctx, `${page + 1}/${pages}`, VIEW_W / 2, GRID_Y + 122, {
      size: 8,
      color: UI.inkDim,
    })
  }
}

/** 아래 도구 줄 */
export function drawTools(
  ctx: CanvasRenderingContext2D,
  tools: readonly ToolName[],
  disabled: readonly ToolName[] = [],
): void {
  for (let i = 0; i < tools.length; i++) {
    const name = tools[i]!
    const t = TOOL_DEF[name]
    const r = toolRect(i, tools.length)
    const off = disabled.includes(name)
    fillRRect(ctx, { ...r, y: r.y + 3 }, 13, 'rgba(0,0,0,.22)')
    fillRRect(ctx, r, 13, off ? 'rgba(255,255,255,.14)' : t.accent)
    text(ctx, t.icon, r.x + r.w / 2, r.y + 20, { size: 19 })
    text(ctx, t.label, r.x + r.w / 2, r.y + 37, {
      size: 8.5,
      bold: true,
      color: off ? UI.inkDim : '#43163f',
    })
  }
}

// ── 배경 고르기 ────────────────────────────────────────────────

export function backdropRect(i: number): Rect {
  return gridRect(i, 2, 24, 120, 152, 132, 12, 12)
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
): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#31163f' })
  drawTopBar(ctx, '배경 고르기', muted, { back: '← 옷장' })
  text(ctx, '어디에서 놀까요?', VIEW_W / 2, 78, { size: 13, color: UI.inkSoft })

  for (let i = 0; i < BACKDROPS.length; i++) {
    const b = BACKDROPS[i]!
    const r = backdropRect(i)
    const on = b.id === current

    ctx.save()
    ctx.beginPath()
    ctx.clip(new Path2D(rrectPath(r.x, r.y, r.w, r.h - 22, 12)))
    ctx.translate(r.x, r.y)
    for (const s of b.build(r.w, r.h - 22)) paintShape(ctx, s)
    ctx.restore()

    strokeRRect(
      ctx,
      { ...r, h: r.h - 22 },
      12,
      on ? '#ffffff' : 'rgba(255,255,255,.25)',
      on ? 3 : 1.4,
    )
    text(ctx, `${b.icon} ${b.name}`, r.x + r.w / 2, r.y + r.h - 9, {
      size: 11,
      bold: on,
      color: on ? UI.gold : UI.inkSoft,
    })
  }
}

// ── 룩북 ───────────────────────────────────────────────────────

export function lookRect(i: number): Rect {
  return gridRect(i, 3, 21, 112, 100, 148, 9, 10)
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
): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#31163f' })
  drawTopBar(ctx, '룩북', muted, { back: '← 옷장' })

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

  text(ctx, `담은 사진 ${looks.length} / 9 · 누르면 그 코디로 갈아입어요`, VIEW_W / 2, 82, {
    size: 10,
    color: UI.inkSoft,
  })

  for (let i = 0; i < looks.length; i++) {
    const look = looks[i]!
    const r = lookRect(i)
    drawStage(
      ctx,
      r,
      look.backdrop,
      composeDoll(look.outfit, { resolve, expr: 'smile' }),
      12,
    )
    strokeRRect(ctx, r, 12, 'rgba(255,255,255,.4)', 1.6)
    const d = lookDeleteRect(i)
    fillRRect(ctx, d, 8, 'rgba(20,6,32,.6)')
    text(ctx, '🗑️', d.x + d.w / 2, d.y + d.h / 2, { size: 11 })
    paintShape(ctx, {
      d: starPath(r.x + 12, r.y + r.h - 12, 6, 2.6),
      fill: 'rgba(255,215,106,.9)',
    })
  }
}
