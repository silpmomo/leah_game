/**
 * 패션쇼 화면 — 미션 목록 · 꾸미기 · 결과.
 *
 * 꾸미기 화면은 옷장과 같은 부품(탭·옷 칸·도구)을 쓴다. 아이가 두 놀이
 * 사이를 오갈 때 조작법이 달라지면 안 된다.
 */
import { VIEW_H, VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { rectPath } from '../engine/shapes'
import type { BackdropId } from '../doll/backdrop'
import type { Category, Item } from '../doll/kinds'
import { composeDoll, type Outfit, type Resolve } from '../doll/outfit'
import { MISSIONS, reqIcon, reqLabel, type Mission } from '../runway/missions'
import { starsOf, threeStarCount, type Progress } from '../runway/rules'
import { paintShape } from '../render/paint'
import {
  UI,
  drawBar,
  drawButton,
  drawPanel,
  drawStars,
  drawTopBar,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'
import {
  DOLL_BOX,
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
): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#3a1240' })
  paintShape(ctx, {
    d: rectPath(0, 0, VIEW_W, VIEW_H),
    fill: {
      kind: 'linear',
      x0: 0,
      y0: 0,
      x1: 0,
      y1: VIEW_H,
      stops: [
        [0, '#4a1852'],
        [1, '#8a3a6e'],
      ],
    },
  })
  drawTopBar(ctx, '패션쇼', muted)

  const three = threeStarCount(progress)
  text(ctx, '부탁을 듣고 코디를 맞춰주세요', VIEW_W / 2, 68, { size: 11, color: UI.inkSoft })
  text(ctx, `⭐⭐⭐ ${three} / ${MISSIONS.length}`, VIEW_W / 2, 86, {
    size: 10,
    bold: true,
    color: UI.gold,
  })

  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i]!
    const r = missionRect(i)
    const stars = starsOf(progress, m.id)
    const done = stars > 0

    fillRRect(ctx, { ...r, y: r.y + 2 }, 12, 'rgba(0,0,0,.2)')
    fillRRect(ctx, r, 12, done ? 'rgba(255,215,106,.22)' : 'rgba(255,255,255,.12)')
    strokeRRect(ctx, r, 12, done ? UI.gold : 'rgba(255,255,255,.2)', done ? 2 : 1.2)

    text(ctx, `${i + 1}`, r.x + 12, r.y + 12, { size: 9, bold: true, color: UI.inkSoft })
    text(ctx, m.emoji, r.x + r.w / 2, r.y + 28, { size: 22 })
    text(ctx, m.title, r.x + r.w / 2, r.y + 48, { size: 8.5, bold: true, maxW: r.w - 8 })
    drawStars(ctx, r.x + r.w / 2, r.y + 62, stars, 3, 9)
  }

  drawBar(
    ctx,
    { x: LIST_X, y: 500, w: VIEW_W - LIST_X * 2, h: 10 },
    three / MISSIONS.length,
    UI.gold,
  )
  drawButton(ctx, CONTINUE_RECT, '▶ 이어서 하기', { accent: UI.pink, size: 15 })
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
}

const CARD_H = 56

export function drawDressScreen(ctx: CanvasRenderingContext2D, v: DressView): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#31163f' })
  drawStage(
    ctx,
    STAGE,
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve }),
    0,
    DOLL_BOX,
  )
  drawTopBar(ctx, v.mission.title, v.muted, { back: '← 목록' })

  // 부탁 카드
  const card: Rect = { x: 10, y: STAGE.y + STAGE.h - CARD_H - 8, w: VIEW_W - 20, h: CARD_H }
  fillRRect(ctx, card, 12, 'rgba(24,8,36,.78)')
  strokeRRect(ctx, card, 12, 'rgba(255,255,255,.25)', 1.2)
  text(ctx, v.mission.emoji, card.x + 18, card.y + 16, { size: 15 })
  text(ctx, v.mission.ask, card.x + 34 + (card.w - 44) / 2, card.y + 16, {
    size: 11,
    bold: true,
    maxW: card.w - 46,
  })

  const n = v.mission.reqs.length
  const chipW = Math.min(72, (card.w - 12 - (n - 1) * 4) / n)
  for (let i = 0; i < n; i++) {
    const req = v.mission.reqs[i]!
    const ok = v.met[i] === true
    const r: Rect = {
      x: card.x + 6 + i * (chipW + 4),
      y: card.y + 28,
      w: chipW,
      h: 22,
    }
    fillRRect(ctx, r, 8, ok ? 'rgba(127,227,212,.32)' : 'rgba(255,255,255,.12)')
    if (v.hint === i) strokeRRect(ctx, r, 8, UI.gold, 2)
    text(ctx, ok ? '✓' : reqIcon(req), r.x + 11, r.y + 11, {
      size: ok ? 11 : 10,
      bold: true,
      color: ok ? UI.mint : UI.inkSoft,
    })
    text(ctx, reqLabel(req), r.x + 20 + (r.w - 24) / 2, r.y + 11, {
      size: 8,
      bold: ok,
      color: ok ? UI.ink : UI.inkSoft,
      maxW: r.w - 24,
    })
  }

  drawTabs(ctx, v.cat)
  drawItemGrid(ctx, v.shown, v.outfit, v.page, v.pages)
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
  },
): void {
  paintShape(ctx, { d: rectPath(0, 0, VIEW_W, VIEW_H), fill: '#31163f' })
  drawStage(
    ctx,
    { x: 0, y: 0, w: VIEW_W, h: 430 },
    v.backdrop,
    composeDoll(v.outfit, { resolve: v.resolve, expr: v.stars >= 2 ? 'sparkle' : 'smile' }),
    0,
    // 상단바 아래로 내려 세운다. 무대 전체를 쓰면 머리가 제목에 가린다
    { x: 30, y: 56, w: VIEW_W - 60, h: 366 },
  )
  drawTopBar(ctx, v.mission.title, v.muted, { back: '← 목록' })

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

  drawButton(ctx, RESULT_AGAIN, '↺ 다시', { accent: '#ffb1d1' })
  drawButton(ctx, RESULT_LIST, '≡ 목록', { accent: UI.violet })
  drawButton(ctx, RESULT_NEXT, '다음 ▶', { accent: UI.gold, disabled: !v.hasNext })
}
