/**
 * 게임 고르기(허브) 화면.
 *
 * 옥상 파티 배경이 화면 전체에 깔리고, 지금 코디를 입은 리아가 왼쪽에
 * 크게 선다 — 옷장에서 갈아입힌 게 여기서도 보인다. 놀이 카드는 오른쪽에
 * 세로로 쌓는다 (참고작의 오른쪽 레일 자리, docs/DESIGN.md).
 */
import { VIEW_H, VIEW_W, inRect, type Rect } from '../engine/view'
import { circlePath } from '../engine/shapes'
import type { Tints } from '../doll/tint'
import { composeDoll, type Outfit } from '../doll/outfit'
import type { Resolve } from '../doll/outfit'
import { STICKER_TOTAL } from '../stickers/album'
import { GAMES } from '../games/registry'
import { paintShape } from '../render/paint'
import {
  COIN_RECT,
  MUTE_RECT,
  UI,
  drawBar,
  drawRoundButton,
  drawTagPill,
  fillRRect,
  strokeRRect,
  text,
} from '../render/ui'
import { DOLL_BOX as CLOSET_DOLL_BOX, drawStage } from './closetScreen'

const CARD_X = 198
const CARD_W = VIEW_W - CARD_X - 8
const CARD_H = 80
const CARD_GAP = 8
const CARD_TOP = 96

/** 허브의 인형 자리 — 옷장과 같은 폭이라 같은 크기로 보인다 */
export const HUB_DOLL_BOX: Rect = { x: 0, y: 120, w: CLOSET_DOLL_BOX.w - 4, h: 450 }

export function cardRect(i: number): Rect {
  return { x: CARD_X, y: CARD_TOP + i * (CARD_H + CARD_GAP), w: CARD_W, h: CARD_H }
}

export function hubHitTest(px: number, py: number): string | null {
  for (let i = 0; i < GAMES.length; i++) {
    if (!inRect(cardRect(i), px, py)) continue
    const g = GAMES[i]!
    return g.status === 'ready' ? g.id : null
  }
  return null
}

/** 카드가 화면 밖으로 나가지 않는지 — 테스트가 확인한다 */
export function lastCardBottom(): number {
  return cardRect(GAMES.length - 1).y + CARD_H
}

export type HubView = {
  outfit: Outfit
  resolve: Resolve
  /** 게임별 진행도 한 줄 */
  labels: Record<string, string>
  stickers: number
  muted: boolean
  tints?: Tints
}

export const STICKER_BAR: Rect = { x: 12, y: VIEW_H - 52, w: VIEW_W - 24, h: 40 }

export function drawHub(ctx: CanvasRenderingContext2D, v: HubView): void {
  drawStage(
    ctx,
    { x: 0, y: 0, w: VIEW_W, h: VIEW_H },
    'party',
    composeDoll(v.outfit, { resolve: v.resolve, expr: 'happy', tints: v.tints }),
    0,
    HUB_DOLL_BOX,
  )

  // 스티커 pill (옷장과 같은 자리)
  fillRRect(ctx, { ...COIN_RECT, y: COIN_RECT.y + 2 }, 15, UI.shadow)
  fillRRect(ctx, COIN_RECT, 15, UI.cream)
  strokeRRect(ctx, COIN_RECT, 15, UI.creamLine, 1.6)
  text(ctx, '🌈', COIN_RECT.x + 16, COIN_RECT.y + 16, { size: 15 })
  text(ctx, `${v.stickers} / ${STICKER_TOTAL}`, COIN_RECT.x + 30 + (COIN_RECT.w - 36) / 2, COIN_RECT.y + 16, {
    size: 12,
    bold: true,
  })

  // 제목
  text(ctx, '리아의 공주 놀이', VIEW_W / 2, 26, {
    size: 22,
    bold: true,
    color: UI.gold,
    stroke: UI.goldLine,
    strokeW: 5,
  })
  drawTagPill(ctx, VIEW_W / 2, 56, '무엇을 하고 놀까요?', '👑', 140)

  drawRoundButton(ctx, MUTE_RECT.x + MUTE_RECT.w / 2, MUTE_RECT.y + MUTE_RECT.h / 2, 17, v.muted ? '🔇' : '🔊', {
    accent: 'rgba(255,255,255,.7)',
    iconSize: 15,
  })

  // 카드
  for (let i = 0; i < GAMES.length; i++) {
    const g = GAMES[i]!
    const r = cardRect(i)
    const ready = g.status === 'ready'

    fillRRect(ctx, { ...r, y: r.y + 3 }, 16, UI.shadow)
    fillRRect(ctx, r, 16, ready ? UI.panel : 'rgba(255,255,255,.5)')
    strokeRRect(ctx, r, 16, ready ? g.accent : UI.panelLine, 2.2)

    // 왼쪽 원형 아이콘
    paintShape(ctx, {
      d: circlePath(r.x + 26, r.y + r.h / 2, 20),
      fill: ready ? g.accent : UI.lavenderSoft,
    })
    paintShape(ctx, { d: circlePath(r.x + 26, r.y + r.h / 2, 20), stroke: UI.white, lw: 2 })
    text(ctx, g.emoji, r.x + 26, r.y + r.h / 2 + 1, { size: 20 })

    text(ctx, g.title, r.x + 52, r.y + 26, {
      size: 14,
      bold: true,
      align: 'left',
      color: ready ? UI.ink : UI.inkDim,
      maxW: r.w - 60,
    })
    text(ctx, v.labels[g.id] ?? '', r.x + 52, r.y + 48, {
      size: 8.5,
      bold: true,
      align: 'left',
      color: ready ? UI.inkSoft : UI.inkDim,
      maxW: r.w - 60,
    })
    text(ctx, ready ? '▶' : '🔒', r.x + r.w - 14, r.y + r.h - 14, {
      size: 10,
      color: ready ? g.accent : UI.inkDim,
    })
  }

  // 스티커 진행도
  const bar = STICKER_BAR
  fillRRect(ctx, { ...bar, y: bar.y + 3 }, 20, UI.shadow)
  fillRRect(ctx, bar, 20, UI.panel)
  strokeRRect(ctx, bar, 20, UI.panelLine, 1.4)
  text(ctx, '🌈', bar.x + 22, bar.y + 20, { size: 15 })
  text(ctx, `스티커 ${v.stickers} / ${STICKER_TOTAL}`, bar.x + 40, bar.y + 20, {
    size: 11,
    bold: true,
    align: 'left',
  })
  drawBar(
    ctx,
    { x: bar.x + 150, y: bar.y + 15, w: bar.w - 166, h: 10 },
    v.stickers / STICKER_TOTAL,
    UI.gold,
  )
}
