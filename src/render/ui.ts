/**
 * 화면 부품 — 버튼·패널·글씨·상단바.
 *
 * 다섯 게임이 같은 부품을 쓴다. 손가락이 작은 아이가 쓰므로 버튼은 크고,
 * 눌린 게 눈에 보여야 한다(눌림 표시는 각 화면이 pressed 로 넘긴다).
 */
import { VIEW_W, inRect, type Rect } from '../engine/view'
import { rrectPath } from '../engine/shapes'
import { paintShape } from './paint'

export const UI = {
  ink: '#ffffff',
  inkSoft: 'rgba(255,255,255,.72)',
  inkDim: 'rgba(255,255,255,.45)',
  panel: 'rgba(255,255,255,.12)',
  panelSolid: '#3d1c53',
  line: 'rgba(255,255,255,.22)',
  pink: '#ff8fc0',
  gold: '#ffd76a',
  mint: '#7fe3d4',
  violet: '#b48ae0',
  danger: '#ff7a8a',
} as const

export const TOP_H = 46
export const BACK_RECT: Rect = { x: 8, y: 8, w: 62, h: 30 }
export const MUTE_RECT: Rect = { x: VIEW_W - 44, y: 8, w: 36, h: 30 }

export function backHit(px: number, py: number): boolean {
  return inRect(BACK_RECT, px, py)
}

export function muteHit(px: number, py: number): boolean {
  return inRect(MUTE_RECT, px, py)
}

export function fillRRect(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  radius: number,
  fill: string,
): void {
  paintShape(ctx, { d: rrectPath(r.x, r.y, r.w, r.h, radius), fill })
}

export function strokeRRect(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  radius: number,
  stroke: string,
  lw = 2,
): void {
  paintShape(ctx, { d: rrectPath(r.x, r.y, r.w, r.h, radius), stroke, lw })
}

export type TextOpts = {
  size?: number
  bold?: boolean
  color?: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  /** 글자가 상자를 넘으면 줄인다 */
  maxW?: number
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: TextOpts = {},
): void {
  const size = o.size ?? 13
  ctx.font = `${o.bold ? 'bold ' : ''}${size}px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
  ctx.fillStyle = o.color ?? UI.ink
  ctx.textAlign = o.align ?? 'center'
  ctx.textBaseline = o.baseline ?? 'middle'
  if (o.maxW && ctx.measureText(s).width > o.maxW) {
    ctx.fillText(s, x, y, o.maxW)
    return
  }
  ctx.fillText(s, x, y)
}

export type ButtonOpts = {
  accent?: string
  /** 선택된 상태 — 테두리가 빛난다 */
  active?: boolean
  disabled?: boolean
  /** 눌려 있는 동안 살짝 들어간다 */
  pressed?: boolean
  size?: number
  radius?: number
  /** 글씨 대신 큰 아이콘만 */
  iconOnly?: boolean
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  o: ButtonOpts = {},
): void {
  const accent = o.accent ?? UI.pink
  const radius = o.radius ?? Math.min(14, r.h / 2)
  const dy = o.pressed ? 1.5 : 0
  const box: Rect = { ...r, y: r.y + dy }

  if (!o.pressed) {
    fillRRect(ctx, { ...box, y: box.y + 3 }, radius, 'rgba(0,0,0,.22)')
  }
  fillRRect(ctx, box, radius, o.disabled ? 'rgba(255,255,255,.10)' : accent)
  if (o.active) strokeRRect(ctx, box, radius, '#ffffff', 2.5)

  text(ctx, label, box.x + box.w / 2, box.y + box.h / 2 + 0.5, {
    size: o.size ?? (o.iconOnly ? 20 : 13),
    bold: true,
    color: o.disabled ? UI.inkDim : '#3c1740',
    maxW: box.w - 10,
  })
}

/** 반투명 유리 패널 */
export function drawPanel(ctx: CanvasRenderingContext2D, r: Rect, radius = 14): void {
  fillRRect(ctx, r, radius, UI.panel)
  strokeRRect(ctx, r, radius, UI.line, 1.4)
}

/**
 * 상단바.
 *
 * 왼쪽 "← 게임" 은 모든 화면에서 같은 자리다. 아이가 길을 잃으면 여기를
 * 누르면 된다. 오른쪽은 소리 켜고 끄기.
 */
export function drawTopBar(
  ctx: CanvasRenderingContext2D,
  title: string,
  muted: boolean,
  opts: { back?: string } = {},
): void {
  fillRRect(ctx, { x: 0, y: 0, w: VIEW_W, h: TOP_H }, 0, 'rgba(20,6,32,.55)')
  fillRRect(ctx, BACK_RECT, 10, 'rgba(255,255,255,.16)')
  text(ctx, opts.back ?? '← 게임', BACK_RECT.x + BACK_RECT.w / 2, BACK_RECT.y + 15, {
    size: 11,
    bold: true,
  })
  text(ctx, title, VIEW_W / 2, TOP_H / 2, { size: 16, bold: true, maxW: 180 })
  fillRRect(ctx, MUTE_RECT, 10, 'rgba(255,255,255,.16)')
  text(ctx, muted ? '🔇' : '🔊', MUTE_RECT.x + MUTE_RECT.w / 2, MUTE_RECT.y + 15, { size: 15 })
}

/** 별점 — 패션쇼 결과와 미션 목록에 쓴다 */
export function drawStars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  got: number,
  total = 3,
  size = 12,
): void {
  const gap = size * 1.5
  const x0 = cx - ((total - 1) * gap) / 2
  for (let i = 0; i < total; i++) {
    text(ctx, i < got ? '⭐' : '☆', x0 + i * gap, cy, {
      size,
      color: i < got ? UI.gold : UI.inkDim,
    })
  }
}

/** 진행 막대 */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  ratio: number,
  color: string = UI.mint,
): void {
  fillRRect(ctx, r, r.h / 2, 'rgba(0,0,0,.28)')
  const w = Math.max(0, Math.min(1, ratio)) * r.w
  if (w > 2) fillRRect(ctx, { ...r, w }, r.h / 2, color)
}

/**
 * 말풍선 — 리아가 하는 말.
 *
 * 페파피그처럼 화면이 늘 말을 걸어야 한다. 글을 못 읽는 아이도 있으니
 * 그림·이모지와 함께 쓴다.
 */
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  msg: string,
  emoji = '👑',
): void {
  fillRRect(ctx, r, 12, 'rgba(255,255,255,.92)')
  paintShape(ctx, {
    d: `M${r.x + 22},${r.y + r.h}L${r.x + 34},${r.y + r.h + 8}L${r.x + 40},${r.y + r.h}Z`,
    fill: 'rgba(255,255,255,.92)',
  })
  text(ctx, emoji, r.x + 20, r.y + r.h / 2, { size: 18 })
  text(ctx, msg, r.x + 38 + (r.w - 46) / 2, r.y + r.h / 2, {
    size: 12,
    bold: true,
    color: '#5a2a55',
    maxW: r.w - 50,
  })
}
