/**
 * 스티커 앨범 화면.
 *
 * 못 받은 스티커도 회색으로 자리를 보여 준다. 빈칸이 보여야 "저건 어떻게
 * 받지?" 하고 다시 놀러 간다. 힌트는 눌러야 나온다.
 */
import { VIEW_H, VIEW_W, gridRect, inRect, type Rect } from '../engine/view'
import { circlePath, rectPath, linear } from '../engine/shapes'
import { STICKERS, STICKER_TOTAL, type Album } from '../stickers/album'
import { paintShape } from '../render/paint'
import { UI, drawBar, drawPanel, drawTopBar, fillRRect, strokeRRect, text } from '../render/ui'

const CELL_W = 76
const CELL_H = 74

export function stickerRect(i: number): Rect {
  return gridRect(i, 4, 17, 94, CELL_W, CELL_H, 7, 6)
}

export function stickerHit(px: number, py: number): number | null {
  for (let i = 0; i < STICKERS.length; i++) {
    if (inRect(stickerRect(i), px, py)) return i
  }
  return null
}

export function drawAlbum(
  ctx: CanvasRenderingContext2D,
  album: Album,
  muted: boolean,
  detail: number | null,
): void {
  paintShape(ctx, {
    d: rectPath(0, 0, VIEW_W, VIEW_H),
    fill: linear(0, 0, 0, VIEW_H, [
      [0, '#2f1a55'],
      [1, '#6a4a9e'],
    ]),
  })
  drawTopBar(ctx, '스티커 앨범', muted)

  const got = Object.keys(album.owned).length
  text(ctx, `모은 스티커 ${got} / ${STICKER_TOTAL}`, VIEW_W / 2, 66, { size: 12, bold: true })
  drawBar(ctx, { x: 40, y: 78, w: VIEW_W - 80, h: 8 }, got / STICKER_TOTAL, UI.gold)

  for (let i = 0; i < STICKERS.length; i++) {
    const s = STICKERS[i]!
    const r = stickerRect(i)
    const own = album.owned[s.id] === true

    fillRRect(ctx, r, 12, own ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.18)')
    strokeRRect(ctx, r, 12, own ? s.color : 'rgba(255,255,255,.12)', own ? 2 : 1)

    paintShape(ctx, {
      d: circlePath(r.x + r.w / 2, r.y + 28, 20),
      fill: own ? s.color : 'rgba(255,255,255,.07)',
    })
    ctx.save()
    if (!own) ctx.globalAlpha = 0.28
    text(ctx, s.emoji, r.x + r.w / 2, r.y + 29, { size: 21 })
    ctx.restore()

    text(ctx, own ? s.name : '???', r.x + r.w / 2, r.y + 58, {
      size: 8.5,
      bold: own,
      color: own ? UI.ink : UI.inkDim,
      maxW: r.w - 6,
    })
  }

  if (detail !== null) {
    const s = STICKERS[detail]
    if (!s) return
    const own = album.owned[s.id] === true
    const panel: Rect = { x: 26, y: 250, w: VIEW_W - 52, h: 140 }
    fillRRect(ctx, { x: 0, y: 0, w: VIEW_W, h: VIEW_H }, 0, 'rgba(12,4,20,.55)')
    drawPanel(ctx, panel, 16)
    paintShape(ctx, { d: circlePath(VIEW_W / 2, panel.y + 40, 26), fill: own ? s.color : 'rgba(255,255,255,.1)' })
    text(ctx, s.emoji, VIEW_W / 2, panel.y + 41, { size: 26 })
    text(ctx, own ? s.name : '아직 못 받은 스티커', VIEW_W / 2, panel.y + 84, {
      size: 14,
      bold: true,
    })
    text(ctx, own ? '받았어요! 잘했어요' : s.hint, VIEW_W / 2, panel.y + 108, {
      size: 11,
      color: UI.inkSoft,
      maxW: panel.w - 24,
    })
    text(ctx, '아무 데나 누르면 닫혀요', VIEW_W / 2, panel.y + 128, {
      size: 9,
      color: UI.inkDim,
    })
  }
}
