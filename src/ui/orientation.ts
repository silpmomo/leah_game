import { VIEW_H, VIEW_W } from '../engine/view'
import { drawPanel, drawSky, text, UI } from '../render/ui'

/** 이 게임은 세로 전용이다 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight * 1.1
}

export function drawRotateOverlay(ctx: CanvasRenderingContext2D): void {
  drawSky(ctx, 'sunset')
  drawPanel(ctx, { x: 50, y: VIEW_H / 2 - 90, w: VIEW_W - 100, h: 160 }, 18)
  text(ctx, '📱', VIEW_W / 2, VIEW_H / 2 - 40, { size: 44 })
  text(ctx, '폰을 세워주세요', VIEW_W / 2, VIEW_H / 2 + 12, { size: 16, bold: true })
  text(ctx, '리아는 세로 화면에서 놀아요', VIEW_W / 2, VIEW_H / 2 + 38, {
    size: 11,
    color: UI.inkSoft,
  })
}
