/**
 * 화면 부품 — 버튼·패널·글씨·상단 HUD.
 *
 * 다섯 게임이 같은 부품을 쓴다. 손가락이 작은 아이가 쓰므로 버튼은 크고,
 * 눌린 게 눈에 보여야 한다(눌림 표시는 각 화면이 pressed 로 넘긴다).
 *
 * 색은 전부 `UI` 에 있다. 밝은 파스텔 톤 — 배경 그림이 화면 전체에 깔리고
 * 그 위에 흰 반투명 판을 얹는 구성이다 (docs/DESIGN.md).
 */
import { VIEW_W, inRect, type Rect } from '../engine/view'
import { circlePath, linear, radial, rectPath, rrectPath } from '../engine/shapes'
import { paintShape } from './paint'

export const UI = {
  /** 글자 — 진한 자두색 */
  ink: '#4a3357',
  inkSoft: 'rgba(74,51,87,.7)',
  inkDim: 'rgba(74,51,87,.42)',
  /** 어두운 배경 위의 흰 글자 */
  white: '#ffffff',
  whiteSoft: 'rgba(255,255,255,.78)',
  /** 흰 반투명 판 */
  panel: 'rgba(255,255,255,.88)',
  panelSoft: 'rgba(255,255,255,.62)',
  panelLine: 'rgba(255,255,255,.95)',
  shadow: 'rgba(60,30,70,.18)',
  /** 아이템 칸 바탕 — 연라벤더 */
  cell: '#ece6f2',
  cellLine: '#ffffff',
  /** 제목 금색 + 외곽선 */
  gold: '#ffd54a',
  goldDeep: '#ffb300',
  goldLine: '#6b4a12',
  /** 포인트 */
  pink: '#f0607a',
  pinkSoft: '#ffd3df',
  green: '#8fe24d',
  greenDeep: '#4fae2e',
  lavender: '#9b8fb0',
  lavenderSoft: '#d9d0e6',
  mint: '#7fe3d4',
  violet: '#b48ae0',
  cream: '#fff3e6',
  creamLine: '#f3c9a8',
  danger: '#ff7a8a',
} as const

export const TOP_H = 80
/** 큰 초록 버튼 높이 */
export const CTA_H = 48
export const BACK_RECT: Rect = { x: 8, y: 44, w: 58, h: 30 }
export const COIN_RECT: Rect = { x: 8, y: 8, w: 92, h: 30 }
export const MUTE_RECT: Rect = { x: VIEW_W - 44, y: 8, w: 36, h: 36 }

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
  fill: string | CanvasGradient,
): void {
  if (typeof fill === 'string') {
    paintShape(ctx, { d: rrectPath(r.x, r.y, r.w, r.h, radius), fill })
    return
  }
  ctx.fillStyle = fill
  ctx.fill(new Path2D(rrectPath(r.x, r.y, r.w, r.h, radius)))
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
  /** 외곽선 색. 제목(금색)에 쓴다 */
  stroke?: string
  strokeW?: number
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
  const over = o.maxW !== undefined && ctx.measureText(s).width > o.maxW
  if (o.stroke) {
    ctx.strokeStyle = o.stroke
    ctx.lineWidth = o.strokeW ?? Math.max(2, size * 0.22)
    ctx.lineJoin = 'round'
    if (over) ctx.strokeText(s, x, y, o.maxW)
    else ctx.strokeText(s, x, y)
  }
  if (over) ctx.fillText(s, x, y, o.maxW)
  else ctx.fillText(s, x, y)
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
  /** 글자색 (기본은 자두색, 진한 바탕이면 흰색) */
  ink?: string
}

/** 바탕색이 진한지 — 글자색을 자동으로 고른다 */
function darkish(css: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(css)
  if (!m) return false
  const v = parseInt(m[1]!, 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return r * 0.299 + g * 0.587 + b * 0.114 < 150
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  o: ButtonOpts = {},
): void {
  const accent = o.accent ?? UI.pink
  const radius = o.radius ?? Math.min(16, r.h / 2)
  const dy = o.pressed ? 1.5 : 0
  const box: Rect = { ...r, y: r.y + dy }

  if (!o.pressed) {
    fillRRect(ctx, { ...box, y: box.y + 3 }, radius, o.disabled ? 'rgba(60,30,70,.1)' : UI.shadow)
  }
  fillRRect(ctx, box, radius, o.disabled ? UI.lavenderSoft : accent)
  // 윗부분 하이라이트 — 버튼이 볼록해 보인다
  fillRRect(
    ctx,
    { x: box.x + 3, y: box.y + 2, w: box.w - 6, h: Math.max(4, box.h * 0.38) },
    radius,
    'rgba(255,255,255,.28)',
  )
  if (o.active) strokeRRect(ctx, box, radius, UI.white, 2.5)

  const ink = o.disabled ? UI.inkDim : (o.ink ?? (darkish(accent) ? UI.white : UI.ink))
  text(ctx, label, box.x + box.w / 2, box.y + box.h / 2 + 0.5, {
    size: o.size ?? (o.iconOnly ? 20 : 13),
    bold: true,
    color: ink,
    maxW: box.w - 10,
  })
}

/**
 * 큰 초록 확인 버튼 — 참고작의 "다음".
 *
 * 패션쇼 "완성!" 처럼 **한 화면에 하나**만 둔다. 둘이면 어느 게 진짜인지
 * 아이가 헷갈린다.
 */
export function drawCta(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  o: { disabled?: boolean; accent?: string; deep?: string } = {},
): void {
  const radius = r.h / 2
  const accent = o.accent ?? UI.green
  const deep = o.deep ?? UI.greenDeep
  fillRRect(ctx, { ...r, y: r.y + 5 }, radius, o.disabled ? 'rgba(60,30,70,.12)' : deep)
  fillRRect(ctx, r, radius, o.disabled ? UI.lavenderSoft : accent)
  fillRRect(
    ctx,
    { x: r.x + 6, y: r.y + 3, w: r.w - 12, h: r.h * 0.4 },
    radius,
    'rgba(255,255,255,.3)',
  )
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2, {
    size: 17,
    bold: true,
    color: o.disabled ? UI.inkDim : UI.white,
    stroke: o.disabled ? undefined : 'rgba(40,90,20,.55)',
    strokeW: 3,
    maxW: r.w - 16,
  })
}

/** 원형 유리 버튼 — 도구줄(🎲 ↺ 🌈 📷 🖼)과 소리 버튼에 쓴다 */
export function drawRoundButton(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  icon: string,
  o: { accent?: string; active?: boolean; disabled?: boolean; label?: string; iconSize?: number } = {},
): void {
  paintShape(ctx, { d: circlePath(cx, cy + 3, r), fill: UI.shadow })
  paintShape(ctx, {
    d: circlePath(cx, cy, r),
    fill: o.disabled ? UI.lavenderSoft : (o.accent ?? UI.panel),
  })
  paintShape(ctx, { d: circlePath(cx, cy, r), stroke: UI.panelLine, lw: 2 })
  if (o.active) paintShape(ctx, { d: circlePath(cx, cy, r + 2), stroke: UI.gold, lw: 3 })
  ctx.save()
  if (o.disabled) ctx.globalAlpha = 0.45
  text(ctx, icon, cx, cy + (o.label ? -4 : 1), { size: o.iconSize ?? r * 0.95 })
  ctx.restore()
  if (o.label) {
    text(ctx, o.label, cx, cy + r - 8, {
      size: 7.5,
      bold: true,
      color: o.disabled ? UI.inkDim : UI.ink,
      maxW: r * 2 - 6,
    })
  }
}

/** 흰 반투명 판 */
export function drawPanel(ctx: CanvasRenderingContext2D, r: Rect, radius = 14): void {
  fillRRect(ctx, { ...r, y: r.y + 3 }, radius, UI.shadow)
  fillRRect(ctx, r, radius, UI.panel)
  strokeRRect(ctx, r, radius, UI.panelLine, 1.4)
}

/** 라벤더 회색 태그 pill — 참고작의 "한정 의상" 자리 */
export function drawTagPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  icon = '🏷️',
  w = 124,
): void {
  const r: Rect = { x: cx - w / 2, y: cy - 11, w, h: 22 }
  fillRRect(ctx, r, 11, 'rgba(120,108,140,.78)')
  text(ctx, icon, r.x + 14, cy + 0.5, { size: 10 })
  text(ctx, label, r.x + 24 + (r.w - 30) / 2, cy + 0.5, {
    size: 11,
    bold: true,
    color: UI.white,
    maxW: r.w - 34,
  })
}

/** 초록 ✓ 배지 — 착용 중인 분류, 맞춘 조건 */
export function drawCheckBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r = 7): void {
  paintShape(ctx, { d: circlePath(cx, cy, r), fill: UI.greenDeep })
  paintShape(ctx, { d: circlePath(cx, cy, r - 1.5), fill: UI.green })
  paintShape(ctx, {
    d: `M${cx - r * 0.45},${cy}L${cx - r * 0.1},${cy + r * 0.4}L${cx + r * 0.5},${cy - r * 0.4}`,
    stroke: UI.white,
    lw: Math.max(1.6, r * 0.28),
    cap: 'round',
  })
}

/** 숫자 배지 — 분류 레일의 개수, 미션 번호 */
export function drawCountBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  n: number | string,
  color: string = UI.pink,
): void {
  paintShape(ctx, { d: circlePath(cx, cy, 7.5), fill: color })
  paintShape(ctx, { d: circlePath(cx, cy, 7.5), stroke: UI.white, lw: 1.4 })
  text(ctx, String(n), cx, cy + 0.5, { size: 8.5, bold: true, color: UI.white })
}

/** 금색 빛남 — 선택된 칸 */
export function fillGlow(ctx: CanvasRenderingContext2D, r: Rect, radius: number): void {
  paintShape(ctx, {
    d: rrectPath(r.x, r.y, r.w, r.h, radius),
    fill: radial(r.x + r.w / 2, r.y + r.h / 2, 2, Math.max(r.w, r.h) * 0.75, [
      [0, '#fff3b0'],
      [0.6, UI.gold],
      [1, UI.goldDeep],
    ]),
  })
}

/**
 * 상단 HUD.
 *
 * 왼쪽 위 스티커 수, 그 아래 뒤로 버튼 — 모든 화면에서 같은 자리다.
 * 아이가 길을 잃으면 여기를 누르면 된다. 가운데 금색 제목과 태그 pill,
 * 오른쪽 소리 켜고 끄기. 배경은 HUD 뒤까지 깔려 있으므로 띠를 깔지 않는다.
 */
export function drawTopBar(
  ctx: CanvasRenderingContext2D,
  title: string,
  muted: boolean,
  opts: { back?: string; tag?: string; tagIcon?: string; stickers?: number; total?: number } = {},
): void {
  // 스티커 pill
  fillRRect(ctx, { ...COIN_RECT, y: COIN_RECT.y + 2 }, 15, UI.shadow)
  fillRRect(ctx, COIN_RECT, 15, UI.cream)
  strokeRRect(ctx, COIN_RECT, 15, UI.creamLine, 1.6)
  text(ctx, '🌈', COIN_RECT.x + 16, COIN_RECT.y + 16, { size: 15 })
  const count = opts.stickers ?? 0
  text(
    ctx,
    opts.total !== undefined ? `${count} / ${opts.total}` : String(count),
    COIN_RECT.x + 30 + (COIN_RECT.w - 36) / 2,
    COIN_RECT.y + 16,
    { size: 12, bold: true, color: UI.ink, maxW: COIN_RECT.w - 40 },
  )

  // 뒤로 — 핑크레드, 왼쪽 모서리는 각지고 오른쪽만 둥글다
  const b = BACK_RECT
  paintShape(ctx, {
    d:
      `M${b.x},${b.y + 3}h${b.w - 14}a14,14 0 0 1 14,14` +
      `v2a14,14 0 0 1 -14,14h${-(b.w - 14)}Z`,
    fill: UI.shadow,
  })
  paintShape(ctx, {
    d: `M${b.x},${b.y}h${b.w - 15}a15,15 0 0 1 15,15a15,15 0 0 1 -15,15h${-(b.w - 15)}Z`,
    fill: UI.pink,
  })
  paintShape(ctx, {
    d: `M${b.x + 2},${b.y + 2}h${b.w - 19}a12,10 0 0 1 11,9h${-(b.w - 8)}Z`,
    fill: 'rgba(255,255,255,.28)',
  })
  // 굽은 화살표
  const ax = b.x + b.w / 2
  const ay = b.y + b.h / 2
  paintShape(ctx, {
    d: `M${ax + 9},${ay + 7}Q${ax + 9},${ay - 6} ${ax - 5},${ay - 5}`,
    stroke: UI.white,
    lw: 4,
    cap: 'round',
  })
  paintShape(ctx, {
    d: `M${ax - 1},${ay - 11}L${ax - 10},${ay - 5}L${ax - 1},${ay + 1}Z`,
    fill: UI.white,
  })
  if (opts.back) {
    text(ctx, opts.back, b.x + b.w / 2, b.y + b.h + 8, { size: 8, bold: true, color: UI.ink })
  }

  // 제목 — 금색 + 갈색 외곽선
  text(ctx, title, VIEW_W / 2, 24, {
    size: 20,
    bold: true,
    color: UI.gold,
    stroke: UI.goldLine,
    strokeW: 4.5,
    maxW: 170,
  })
  if (opts.tag) drawTagPill(ctx, VIEW_W / 2, 54, opts.tag, opts.tagIcon)

  // 소리
  drawRoundButton(ctx, MUTE_RECT.x + MUTE_RECT.w / 2, MUTE_RECT.y + MUTE_RECT.h / 2, 17, muted ? '🔇' : '🔊', {
    accent: 'rgba(255,255,255,.7)',
    iconSize: 15,
  })
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
  color: string = UI.green,
): void {
  fillRRect(ctx, r, r.h / 2, 'rgba(74,51,87,.16)')
  const w = Math.max(0, Math.min(1, ratio)) * r.w
  if (w > 2) fillRRect(ctx, { ...r, w }, r.h / 2, color)
}

/**
 * 말풍선 — 리아가 하는 말.
 *
 * 페파피그처럼 화면이 늘 말을 걸어야 한다. 글을 못 읽는 아이도 있으니
 * 그림·이모지와 함께 쓴다. 꼬리는 아래쪽(인형 머리 쪽)을 향한다.
 */
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  msg: string,
  emoji = '👑',
): void {
  fillRRect(ctx, { ...r, y: r.y + 3 }, 14, UI.shadow)
  fillRRect(ctx, r, 14, UI.panel)
  paintShape(ctx, {
    d: `M${r.x + r.w / 2 - 8},${r.y + r.h}L${r.x + r.w / 2},${r.y + r.h + 9}L${r.x + r.w / 2 + 8},${r.y + r.h}Z`,
    fill: UI.panel,
  })
  text(ctx, emoji, r.x + 18, r.y + r.h / 2, { size: 16 })
  text(ctx, msg, r.x + 32 + (r.w - 40) / 2, r.y + r.h / 2, {
    size: 11.5,
    bold: true,
    color: UI.ink,
    maxW: r.w - 44,
  })
}

/**
 * 부드러운 하늘 바탕 — 배경 그림이 없는 화면(목록·앨범·공방·방)이 깐다.
 *
 * 고정 좌표의 보케 원 몇 개로 "밖에 있는 느낌" 만 낸다. 난수를 쓰면
 * 프레임마다 튄다.
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  variant: 'sunset' | 'pink' | 'lavender' | 'mint' = 'sunset',
): void {
  const stops: Record<typeof variant, readonly (readonly [number, string])[]> = {
    sunset: [
      [0, '#f6c7d6'],
      [0.55, '#f7c9b8'],
      [1, '#d9b6dc'],
    ],
    pink: [
      [0, '#ffe3ee'],
      [1, '#f5c6da'],
    ],
    lavender: [
      [0, '#e8dcf5'],
      [1, '#cfb9e6'],
    ],
    mint: [
      [0, '#e2f7f1'],
      [1, '#bfe6e8'],
    ],
  }
  paintShape(ctx, {
    d: rectPath(0, 0, VIEW_W, 640),
    fill: linear(0, 0, 0, 640, stops[variant]),
  })
  const dots: readonly (readonly [number, number, number])[] = [
    [40, 120, 26], [300, 90, 18], [330, 420, 30], [60, 500, 22], [200, 600, 16], [250, 250, 12],
  ]
  for (const [x, y, r] of dots) {
    paintShape(ctx, { d: circlePath(x, y, r), fill: 'rgba(255,255,255,.22)' })
  }
}
