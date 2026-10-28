/**
 * 패션쇼 화면 — 미션 목록 · 꾸미기 · 결과.
 *
 * 꾸미기 화면은 옷장과 같은 부품(레일·옷 목록·도구)을 쓴다. 아이가 두 놀이
 * 사이를 오갈 때 조작법이 달라지면 안 된다. 색 견본만 없다 — 채점이 색
 * 태그로 되므로 원래 색으로 보여 준다.
 */
import { VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import type { BackdropId } from '../doll/backdrop'
import { CATEGORIES, type Category, type Item } from '../doll/kinds'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import { MISSIONS, reqIcon, reqLabel, type Mission } from '../runway/missions'
import { starsOf, threeStarCount, type Progress } from '../runway/rules'
import {
  UI,
  drawBar,
  drawButton,
  drawCheckBadge,
  drawCountBadge,
  drawCta,
  drawPanel,
  drawSky,
  drawStars,
  drawTopBar,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'
import {
  STAGE,
  drawItemGrid,
  drawStage,
  drawTabs,
  drawTools,
  type ToolName,
} from './closetScreen'

export const RUNWAY_TOOLS: readonly ToolName[] = ['random', 'strip', 'hint', 'done']

// ── 미션 목록 ──────────────────────────────────────────────────

const LIST_X = 16
const LIST_Y = 96
const CELL_W = 76
const CELL_H = 72

export function missionRect(i: number): Rect {
  return gridRect(i, 4, LIST_X, LIST_Y, CELL_W, CELL_H, 8, 8)
}

export const CONTINUE_RECT: Rect = { x: 60, y: 528, w: VIEW_W - 120, h: 48 }

export function missionHit(px: number, py: number): number | null {
  for (let i = 0; i < MISSIONS.length; i++) {
    if (inRect(missionRect(i), px, py)) return i
  }
  return null
}

export function drawMissionList(
  ctx: CanvasRenderingContext2D,
  progress: Progress,
  muted: boolean,
  stickers = 0,
): void {
  drawSky(ctx, 'sunset')
  const three = threeStarCount(progress)
  drawTopBar(ctx, '패션쇼', muted, {
    tag: `⭐⭐⭐ ${three} / ${MISSIONS.length}`,
    tagIcon: '🎀',
    stickers,
  })

  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i]!
    const r = missionRect(i)
    const stars = starsOf(progress, m.id)
    const done = stars > 0

    fillRRect(ctx, { ...r, y: r.y + 3 }, 12, UI.shadow)
    fillRRect(ctx, r, 12, done ? '#fff6d2' : UI.panel)
    strokeRRect(ctx, r, 12, done ? UI.gold : UI.panelLine, done ? 2.2 : 1.4)

    drawCountBadge(ctx, r.x + 11, r.y + 11, i + 1, done ? UI.goldDeep : UI.lavender)
    text(ctx, m.emoji, r.x + r.w / 2, r.y + 28, { size: 22 })
    text(ctx, m.title, r.x + r.w / 2, r.y + 48, { size: 8.5, bold: true, maxW: r.w - 8 })
    drawStars(ctx, r.x + r.w / 2, r.y + 62, stars, 3, 9)
    if (stars >= 3) drawCheckBadge(ctx, r.x + r.w - 10, r.y + 10, 7)
  }

  drawBar(
    ctx,
    { x: LIST_X, y: 500, w: VIEW_W - LIST_X * 2, h: 10 },
    three / MISSIONS.length,
    UI.gold,
  )
  drawCta(ctx, CONTINUE_RECT, '▶ 이어서 하기')
}

// ── 꾸미기 ─────────────────────────────────────────────────────

export type DressView = {
  mission: Mission
  met: readonly boolean[]
  outfit: Outfit
  resolve: Resolve
  backdrop: BackdropId
  cat: Category
  shown: readonly Item[]
  page: number
  pages: number
  muted: boolean
  /** 힌트로 짚어 준 조건 번호 */
  hint: number | null
  stickers: number
}

/**
 * 꾸미기 화면의 인형 자리 — 옷장보다 조금 작게, 아래로 내린다.
 * 위쪽에 부탁 카드(최대 두 줄)가 떠야 하는데, 옷장 크기 그대로면
 * 카드가 얼굴을 가린다.
 */
export const DRESS_DOLL_BOX: Rect = { x: 0, y: 182, w: 200, h: 380 }

/** 부탁 카드 — 인형 머리 위 왼쪽 빈 공간 */
const CARD_X = 6
const CARD_Y = 92
const CARD_W = 188
const CHIP_W = 88
const CHIP_H = 20

export function drawDressScreen(ctx: CanvasRenderingContext2D, v: DressView): void {
  drawStage(
    ctx,
    STAGE,
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve }),
    0,
    DRESS_DOLL_BOX,
  )
  const c = CATEGORIES.find((k) => k.id === v.cat)
  drawTopBar(ctx, v.mission.title, v.muted, {
    back: '목록',
    tag: c?.name ?? '',
    tagIcon: c?.icon ?? '',
    stickers: v.stickers,
  })

  // 부탁 카드
  const n = v.mission.reqs.length
  const rows = Math.ceil(n / 2)
  const card: Rect = { x: CARD_X, y: CARD_Y, w: CARD_W, h: 30 + rows * (CHIP_H + 4) + 4 }
  drawPanel(ctx, card, 12)
  text(ctx, v.mission.emoji, card.x + 14, card.y + 15, { size: 13 })
  text(ctx, v.mission.ask, card.x + 26 + (card.w - 32) / 2, card.y + 15, {
    size: 10.5,
    bold: true,
    maxW: card.w - 34,
  })

  for (let i = 0; i < n; i++) {
    const req = v.mission.reqs[i]!
    const ok = v.met[i] === true
    const r: Rect = {
      x: card.x + 6 + (i % 2) * (CHIP_W + 4),
      y: card.y + 30 + Math.floor(i / 2) * (CHIP_H + 4),
      w: CHIP_W,
      h: CHIP_H,
    }
    fillRRect(ctx, r, 10, ok ? '#dff7d0' : UI.lavenderSoft)
    if (v.hint === i) strokeRRect(ctx, r, 10, UI.goldDeep, 2.2)
    if (ok) drawCheckBadge(ctx, r.x + 11, r.y + 10, 6.5)
    else text(ctx, reqIcon(req), r.x + 11, r.y + 10.5, { size: 10 })
    text(ctx, reqLabel(req), r.x + 20 + (r.w - 24) / 2, r.y + 10.5, {
      size: 8,
      bold: ok,
      color: UI.ink,
      maxW: r.w - 24,
    })
  }

  drawItemGrid(ctx, v.shown, v.outfit, v.page, v.pages)
  drawTabs(ctx, v.cat, v.outfit)
  drawTools(ctx, RUNWAY_TOOLS)
}

// ── 결과 ───────────────────────────────────────────────────────

export const RESULT_AGAIN: Rect = { x: 22, y: 556, w: 96, h: 48 }
export const RESULT_LIST: Rect = { x: 132, y: 556, w: 96, h: 48 }
export const RESULT_NEXT: Rect = { x: 242, y: 556, w: 96, h: 48 }

export type ResultAction = 'again' | 'list' | 'next'

export function resultHit(px: number, py: number, hasNext: boolean): ResultAction | null {
  if (inRect(RESULT_AGAIN, px, py)) return 'again'
  if (inRect(RESULT_LIST, px, py)) return 'list'
  if (hasNext && inRect(RESULT_NEXT, px, py)) return 'next'
  return null
}

export function drawResult(
  ctx: CanvasRenderingContext2D,
  v: {
    mission: Mission
    stars: number
    best: number
    msg: string
    emoji: string
    outfit: Outfit
    resolve: Resolve
    backdrop: BackdropId
    muted: boolean
    hasNext: boolean
    stickers: number
  },
): void {
  drawStage(
    ctx,
    STAGE,
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve, expr: v.stars >= 2 ? 'sparkle' : 'smile' }),
    0,
    // 상단바 아래로 내려 세운다. 무대 전체를 쓰면 머리가 제목에 가린다
    { x: 60, y: 90, w: 240, h: 344 },
  )
  drawTopBar(ctx, v.mission.title, v.muted, {
    back: '목록',
    tag: '무대 끝!',
    tagIcon: '🎉',
    stickers: v.stickers,
  })

  const panel: Rect = { x: 20, y: 440, w: VIEW_W - 40, h: 100 }
  drawPanel(ctx, panel, 16)
  drawStars(ctx, VIEW_W / 2, panel.y + 30, v.stars, 3, 26)
  text(ctx, `${v.emoji} ${v.msg}`, VIEW_W / 2, panel.y + 64, { size: 14, bold: true })
  text(
    ctx,
    v.best > v.stars ? `최고 기록 ⭐${v.best}` : v.stars >= 3 ? '최고 기록!' : '다시 하면 더 잘할 수 있어요',
    VIEW_W / 2,
    panel.y + 84,
    { size: 10, color: UI.inkSoft },
  )

  drawButton(ctx, RESULT_AGAIN, '↺ 다시', { accent: UI.pinkSoft })
  drawButton(ctx, RESULT_LIST, '≡ 목록', { accent: UI.lavenderSoft })
  drawCta(ctx, RESULT_NEXT, '다음 ▶', { disabled: !v.hasNext })
}
