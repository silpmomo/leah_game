/**
 * 게임 고르기(허브) 화면.
 *
 * 세로 화면이라 카드를 위에서 아래로 쌓는다. 오른쪽 위에는 지금 코디를
 * 입은 리아가 서 있어서, 옷장에서 갈아입힌 게 여기서도 보인다.
 */
import { VIEW_H, VIEW_W, inRect, type Rect } from '../engine/view'
import { circlePath, rectPath, linear, starPath } from '../engine/shapes'
import { DOLL_H, DOLL_W } from '../doll/body'
import { composeDoll, type Outfit } from '../doll/outfit'
import type { Resolve } from '../doll/outfit'
import { STICKER_TOTAL } from '../stickers/album'
import { GAMES } from '../games/registry'
import { paintInBox, paintShape } from '../render/paint'
import { UI, drawBar, drawPanel, fillRRect, strokeRRect, text } from '../render/ui'

const CARD_X = 18
const CARD_W = VIEW_W - CARD_X * 2
const CARD_H = 74
const CARD_GAP = 9
const CARD_TOP = 132

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
}

export function drawHub(ctx: CanvasRenderingContext2D, v: HubView): void {
  // 배경
  paintShape(ctx, {
    d: rectPath(0, 0, VIEW_W, VIEW_H),
    fill: linear(0, 0, 0, VIEW_H, [
      [0, '#3b1550'],
      [0.55, '#6a2a78'],
      [1, '#b45a95'],
    ]),
  })
  // 반짝이는 배경 별
  for (let i = 0; i < 22; i++) {
    const x = (i * 71) % VIEW_W
    const y = 8 + ((i * 53) % 118)
    paintShape(ctx, {
      d: starPath(x, y, i % 3 === 0 ? 3.4 : 2.2, 1),
      fill: 'rgba(255,255,255,.5)',
    })
  }

  // 제목
  text(ctx, '리아의', 24, 34, { size: 15, bold: true, align: 'left', color: UI.gold })
  text(ctx, '공주 놀이', 24, 60, { size: 27, bold: true, align: 'left' })
  text(ctx, '무엇을 하고 놀까요?', 24, 86, {
    size: 11,
    align: 'left',
    color: UI.inkSoft,
  })

  // 지금 코디를 입은 리아
  paintShape(ctx, { d: circlePath(300, 66, 52), fill: 'rgba(255,255,255,.12)' })
  paintInBox(
    ctx,
    composeDoll(v.outfit, { resolve: v.resolve, expr: 'happy' }),
    { x: 256, y: 8, w: 92, h: 112 },
    { w: DOLL_W, h: DOLL_H },
  )

  // 카드
  for (let i = 0; i < GAMES.length; i++) {
    const g = GAMES[i]!
    const r = cardRect(i)
    const ready = g.status === 'ready'

    fillRRect(ctx, { ...r, y: r.y + 3 }, 16, 'rgba(0,0,0,.2)')
    fillRRect(ctx, r, 16, ready ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)')
    strokeRRect(ctx, r, 16, ready ? g.accent : 'rgba(255,255,255,.14)', 2)

    // 왼쪽 아이콘
    paintShape(ctx, {
      d: circlePath(r.x + 36, r.y + r.h / 2, 24),
      fill: ready ? g.accent : 'rgba(255,255,255,.12)',
    })
    text(ctx, g.emoji, r.x + 36, r.y + r.h / 2 + 1, { size: 24 })

    text(ctx, g.title, r.x + 70, r.y + 24, {
      size: 16,
      bold: true,
      align: 'left',
      color: ready ? UI.ink : UI.inkDim,
      maxW: r.w - 96,
    })
    text(ctx, g.subtitle, r.x + 70, r.y + 43, {
      size: 10,
      align: 'left',
      color: ready ? UI.inkSoft : UI.inkDim,
      maxW: r.w - 96,
    })
    text(ctx, v.labels[g.id] ?? '', r.x + 70, r.y + 60, {
      size: 10,
      bold: true,
      align: 'left',
      color: ready ? g.accent : UI.inkDim,
      maxW: r.w - 96,
    })

    text(ctx, ready ? '▶' : '🔒', r.x + r.w - 20, r.y + r.h / 2, {
      size: 14,
      color: ready ? UI.inkSoft : UI.inkDim,
    })
  }

  // 스티커 진행도
  const bar: Rect = { x: CARD_X, y: VIEW_H - 46, w: CARD_W, h: 34 }
  drawPanel(ctx, bar, 12)
  text(ctx, '🌈', bar.x + 20, bar.y + 17, { size: 15 })
  text(ctx, `스티커 ${v.stickers} / ${STICKER_TOTAL}`, bar.x + 82, bar.y + 17, {
    size: 11,
    bold: true,
    align: 'left',
  })
  drawBar(
    ctx,
    { x: bar.x + 168, y: bar.y + 12, w: bar.w - 186, h: 10 },
    v.stickers / STICKER_TOTAL,
    UI.gold,
  )
}
