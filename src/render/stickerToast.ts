/**
 * 스티커를 받았을 때 위에서 내려오는 알림.
 *
 * 어느 놀이에 있든 같은 모양으로 뜬다. 스티커는 놀이를 가로지르는
 * 보상이라 알림도 놀이 밖(main)에서 그린다.
 */
import { VIEW_W, type Rect } from '../engine/view'
import { circlePath } from '../engine/shapes'
import { stickerById } from '../stickers/album'
import { paintShape } from './paint'
import { UI, fillRRect, strokeRRect, text } from './ui'

export const TOAST_TOTAL = 2.8

/** 0 → 1 로 진행. 위에서 내려왔다가 잠시 머물고 올라간다 */
function slide(t: number): number {
  const inT = 0.25
  const outT = 0.35
  if (t < inT) return t / inT
  if (t > TOAST_TOTAL - outT) return (TOAST_TOTAL - t) / outT
  return 1
}

/**
 * 알림이 멈추는 높이.
 *
 * 화면 맨 위에 딱 붙인다. 조금만 내려도 리아의 얼굴을 덮는데, 하필
 * 스티커를 받는 순간은 방금 입힌 옷을 보고 싶은 순간이다.
 */
const REST_Y = 2
const TOAST_H = 52

export function drawStickerToast(
  ctx: CanvasRenderingContext2D,
  id: string,
  elapsed: number,
): void {
  const s = stickerById(id)
  if (!s) return
  const p = Math.max(0, Math.min(1, slide(elapsed)))
  const r: Rect = {
    x: 26,
    y: -TOAST_H - 6 + p * (TOAST_H + 6 + REST_Y),
    w: VIEW_W - 52,
    h: TOAST_H,
  }

  ctx.save()
  ctx.globalAlpha = Math.min(1, p * 1.4)
  fillRRect(ctx, { ...r, y: r.y + 4 }, 14, 'rgba(0,0,0,.3)')
  fillRRect(ctx, r, 14, '#fff4fb')
  strokeRRect(ctx, r, 14, s.color, 2.5)

  paintShape(ctx, { d: circlePath(r.x + 32, r.y + 26, 19), fill: s.color })
  text(ctx, s.emoji, r.x + 32, r.y + 27, { size: 19 })

  text(ctx, '스티커를 받았어요!', r.x + 62, r.y + 18, {
    size: 9.5,
    align: 'left',
    color: '#a05a8a',
    bold: true,
  })
  text(ctx, s.name, r.x + 62, r.y + 36, {
    size: 14,
    align: 'left',
    bold: true,
    color: '#5a2a55',
    maxW: r.w - 78,
  })
  text(ctx, '🌈', r.x + r.w - 18, r.y + 26, { size: 13, color: UI.gold })
  ctx.restore()
}
