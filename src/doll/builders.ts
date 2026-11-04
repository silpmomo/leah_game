/**
 * 벡터 소품 생성기 — 왕관·날개·손에 드는 소품.
 *
 * 옷·머리·구두는 일러스트 조각(art.ts)으로 바뀌었지만, 이 셋은 팩에 공주풍
 * 그림이 없어서 벡터로 남겼다. "모양 + 색 몇 개" 사양(spec)을 받아 조각을
 * 찍어낸다. 왕관 공방도 같은 왕관 띠(headArc)를 쓴다.
 */
import {
  arcPath,
  circlePath,
  dropPath,
  ellipsePath,
  flowerPath,
  gemPath,
  heartPath,
  linear,
  mergePaths,
  polyPath,
  rrectPath,
  skirtPath,
  sparklePath,
  starPath,
  vshade,
  type Paint,
  type Shape,
} from '../engine/shapes'

/**
 * 이 파일의 좌표는 "벡터 틀"이다 — 예전 8등신 인형 좌표 그대로 그리고,
 * 일러스트 인형에 얹을 때 outfit.ts 가 XF(배율·이동)로 옮긴다.
 */
const HAND_R = { x: 130, y: 226 } as const

// ── 공통 도우미 ────────────────────────────────────────────────

/** 좌우 대칭 좌표 */
export function mx(x: number): number {
  return 200 - x
}

/**
 * 치마 위에 장식을 흩뿌릴 자리.
 *
 * 난수를 쓰지 않는다. 같은 옷은 언제 봐도 같은 자리에 별이 있어야 한다.
 */
const SCATTER: readonly (readonly [number, number])[] = [
  [-0.5, 0.12],
  [0.42, 0.24],
  [-0.18, 0.4],
  [0.6, 0.52],
  [-0.68, 0.64],
  [0.14, 0.72],
  [-0.36, 0.86],
  [0.7, 0.9],
]

function scatter(
  topY: number,
  botY: number,
  topHalf: number,
  botHalf: number,
  count: number,
  make: (x: number, y: number, i: number) => Shape,
): Shape[] {
  return SCATTER.slice(0, count).map(([rx, ry], i) => {
    const y = topY + (botY - topY) * ry
    const half = topHalf + (botHalf - topHalf) * ry
    return make(100 + rx * half, y, i)
  })
}

/** 2차 베지어 한 점 */
function qpt(
  p0: readonly [number, number],
  c: readonly [number, number],
  p1: readonly [number, number],
  t: number,
): [number, number] {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]
}

const HEAD_P0 = [78, 50] as const
const HEAD_C = [100, 26] as const
const HEAD_P1 = [122, 50] as const

/** 머리 위 호(왕관 띠)의 한 점. t: 0(왼쪽) → 1(오른쪽) */
export function headArc(t: number): [number, number] {
  return qpt(HEAD_P0, HEAD_C, HEAD_P1, t)
}

const HEAD_BAND = `M${HEAD_P0[0]},${HEAD_P0[1]}Q${HEAD_C[0]},${HEAD_C[1]} ${HEAD_P1[0]},${HEAD_P1[1]}`

/** 팔 중심선의 t0 → 손 구간 (장갑·긴 소매) */
// ── 왕관 ───────────────────────────────────────────────────────

export type CrownStyle = 'tiara' | 'gold' | 'flower' | 'pearl' | 'snow' | 'star'

export type CrownSpec = {
  style: CrownStyle
  metal: string
  metalDark: string
  gem: string
}

export function buildCrown(sp: CrownSpec): Shape[] {
  const band: Shape[] = [
    { d: HEAD_BAND, stroke: sp.metalDark, lw: 5, cap: 'round' },
    { d: HEAD_BAND, stroke: sp.metal, lw: 3.4, cap: 'round' },
  ]

  switch (sp.style) {
    case 'tiara': {
      const out = [...band]
      for (const [t, h] of [[0.28, 7], [0.5, 12], [0.72, 7]] as const) {
        const [x, y] = headArc(t)
        out.push({ d: polyPath([x - 4.2, y - 0.6, x, y - h, x + 4.2, y - 0.6]), fill: sp.metal })
        out.push({ d: polyPath([x - 4.2, y - 0.6, x, y - h, x + 4.2, y - 0.6]), stroke: sp.metalDark, lw: 0.6 })
        out.push({ d: circlePath(x, y - h + 2.6, 2), fill: sp.gem })
      }
      return out
    }
    case 'gold': {
      const out = [...band]
      for (const t of [0.16, 0.33, 0.5, 0.67, 0.84]) {
        const [x, y] = headArc(t)
        const h = t === 0.5 ? 12 : 8.4
        out.push({ d: polyPath([x - 3.6, y, x, y - h, x + 3.6, y]), fill: sp.metal })
        out.push({ d: circlePath(x, y - h - 1.2, 1.9), fill: sp.gem })
      }
      return out
    }
    case 'flower': {
      const out: Shape[] = [{ d: HEAD_BAND, stroke: '#6fae63', lw: 2.4, cap: 'round' }]
      for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) {
        const [x, y] = headArc(t)
        out.push({ d: flowerPath(x, y - 2, 5.2, 5), fill: sp.metal })
        out.push({ d: circlePath(x, y - 2, 1.9), fill: sp.gem })
      }
      return out
    }
    case 'pearl': {
      const out: Shape[] = [{ d: HEAD_BAND, stroke: sp.metal, lw: 3, cap: 'round' }]
      for (let i = 0; i <= 8; i++) {
        const [x, y] = headArc(i / 8)
        out.push({ d: circlePath(x, y - 0.6, 2.5), fill: sp.gem })
        out.push({ d: circlePath(x, y - 0.6, 2.5), stroke: sp.metalDark, lw: 0.5 })
        out.push({ d: circlePath(x - 0.7, y - 1.4, 0.9), fill: 'rgba(255,255,255,.85)' })
      }
      return out
    }
    case 'snow': {
      const out = [...band]
      for (const [t, r] of [[0.26, 4.8], [0.5, 7.2], [0.74, 4.8]] as const) {
        const [x, y] = headArc(t)
        const cy = y - r - 1.2
        out.push({
          d: mergePaths(
            `M${x - r},${cy}L${x + r},${cy}`,
            `M${x},${cy - r}L${x},${cy + r}`,
            `M${x - r * 0.7},${cy - r * 0.7}L${x + r * 0.7},${cy + r * 0.7}`,
            `M${x - r * 0.7},${cy + r * 0.7}L${x + r * 0.7},${cy - r * 0.7}`,
          ),
          stroke: sp.gem,
          lw: 1.4,
          cap: 'round',
        })
        out.push({ d: circlePath(x, cy, 1.4), fill: '#ffffff' })
      }
      return out
    }
    case 'star': {
      const out = [...band]
      for (const [t, r] of [[0.2, 3.6], [0.5, 6.6], [0.8, 3.6]] as const) {
        const [x, y] = headArc(t)
        out.push({ d: starPath(x, y - r - 1.2, r, r * 0.42), fill: sp.gem })
      }
      return out
    }
  }
}

// ── 날개 ───────────────────────────────────────────────────────

export type WingStyle = 'fairy' | 'butterfly' | 'angel' | 'sparkle'

export type WingSpec = { style: WingStyle; main: string; edge: string }

/**
 * 날개 좌표 변환.
 *
 * 날개 모양은 예전 인형(어깨 y=140)에 맞춰 다듬어 둔 곡선을 그대로 쓰고,
 * 높이만 새 어깨에 맞게 옮겨 위아래로 늘린다. 참고작처럼 머리 높이까지
 * 솟아야 "날개를 달았다" 가 한눈에 보인다.
 */
function wy(y: number): number {
  return 124 + (y - 150) * 1.3
}

function warp(d: string): string {
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${x},${+wy(+y).toFixed(2)}`)
}

export function buildWings(sp: WingSpec): Shape[] {
  const paint = (x0: number, x1: number): Paint =>
    linear(x0, wy(120), x1, wy(220), [
      [0, sp.main],
      [1, sp.edge],
    ])

  // 날개는 드레스와 머리 밖으로 크게 나와야 보인다.
  if (sp.style === 'butterfly') {
    const left = warp(
      mergePaths(
        `M86,142C54,92 10,100 8,140C6,172 46,180 86,156Z`,
        `M86,164C52,182 18,200 24,232C30,260 72,240 88,190Z`,
      ),
    )
    const right = warp(
      mergePaths(
        `M114,142C146,92 190,100 192,140C194,172 154,180 114,156Z`,
        `M114,164C148,182 182,200 176,232C170,260 128,240 112,190Z`,
      ),
    )
    return [
      { d: left, fill: paint(8, 90), alpha: 0.86 },
      { d: right, fill: paint(192, 110), alpha: 0.86 },
      { d: mergePaths(left, right), stroke: sp.edge, lw: 1.6, alpha: 0.9 },
      { d: circlePath(44, wy(132), 6), fill: 'rgba(255,255,255,.6)' },
      { d: circlePath(156, wy(132), 6), fill: 'rgba(255,255,255,.6)' },
      { d: circlePath(48, wy(212), 4.5), fill: 'rgba(255,255,255,.5)' },
      { d: circlePath(152, wy(212), 4.5), fill: 'rgba(255,255,255,.5)' },
    ]
  }

  if (sp.style === 'angel') {
    const feather = (x: number, dir: number): Shape[] => {
      const out: Shape[] = []
      for (let i = 0; i < 5; i++) {
        const yy = 128 + i * 22
        const len = 78 - i * 9
        out.push({
          d: warp(
            `M${x},${yy}C${x + dir * len * 0.6},${yy - 18} ${x + dir * len},${yy + 2} ` +
              `${x + dir * len * 0.84},${yy + 26}C${x + dir * len * 0.4},${yy + 20} ` +
              `${x + dir * 12},${yy + 16} ${x},${yy}Z`,
          ),
          fill: i % 2 === 0 ? sp.main : sp.edge,
          stroke: '#dfe4f0',
          lw: 1,
        })
      }
      return out
    }
    return [...feather(88, -1), ...feather(112, 1)]
  }

  if (sp.style === 'sparkle') {
    const left = warp(`M88,148C56,110 18,122 18,154C18,190 56,196 88,172Z`)
    const right = warp(`M112,148C144,110 182,122 182,154C182,190 144,196 112,172Z`)
    return [
      { d: left, fill: paint(18, 90), alpha: 0.72 },
      { d: right, fill: paint(182, 110), alpha: 0.72 },
      { d: mergePaths(left, right), stroke: sp.edge, lw: 1.3, alpha: 0.8 },
      { d: sparklePath(42, wy(142), 9), fill: '#fff6c9' },
      { d: sparklePath(158, wy(142), 9), fill: '#fff6c9' },
      { d: sparklePath(60, wy(176), 5.5), fill: '#fff6c9' },
      { d: sparklePath(140, wy(176), 5.5), fill: '#fff6c9' },
    ]
  }

  // fairy — 위아래 두 장씩, 잎사귀 모양 + 반짝이 테두리
  const left = warp(
    mergePaths(
      `M88,144C54,104 14,118 18,156C22,186 58,182 88,158Z`,
      `M88,166C60,182 28,204 36,232C46,256 84,230 90,190Z`,
    ),
  )
  const right = warp(
    mergePaths(
      `M112,144C146,104 186,118 182,156C178,186 142,182 112,158Z`,
      `M112,166C140,182 172,204 164,232C154,256 116,230 110,190Z`,
    ),
  )
  return [
    { d: left, fill: paint(14, 92), alpha: 0.8 },
    { d: right, fill: paint(186, 108), alpha: 0.8 },
    { d: mergePaths(left, right), stroke: sp.edge, lw: 1.6, alpha: 0.9 },
    { d: warp(arcPath(36, 142, 84, 158, 8)), stroke: 'rgba(255,255,255,.6)', lw: 1.6 },
    { d: warp(arcPath(164, 142, 116, 158, 8)), stroke: 'rgba(255,255,255,.6)', lw: 1.6 },
    { d: warp(arcPath(44, 226, 84, 196, 6)), stroke: 'rgba(255,255,255,.5)', lw: 1.3 },
    { d: warp(arcPath(156, 226, 116, 196, 6)), stroke: 'rgba(255,255,255,.5)', lw: 1.3 },
  ]
}

// ── 손에 드는 소품 ─────────────────────────────────────────────

export type WandStyle = 'star' | 'crystal' | 'bouquet' | 'fan' | 'bag'

export type WandSpec = { style: WandStyle; stick: string; main: string; accent: string }

export function buildWand(sp: WandSpec): Shape[] {
  const hx = HAND_R.x
  const hy = HAND_R.y

  switch (sp.style) {
    case 'star':
      return [
        { d: `M${hx + 2},${hy + 6}L${hx + 9},${hy - 34}`, stroke: sp.stick, lw: 3.2, cap: 'round' },
        { d: starPath(hx + 10, hy - 41, 11, 4.8), fill: sp.main },
        { d: starPath(hx + 10, hy - 41, 6, 2.6), fill: sp.accent },
        { d: sparklePath(hx + 22, hy - 29, 4.5), fill: sp.accent, alpha: 0.9 },
        { d: sparklePath(hx + 1, hy - 51, 4), fill: sp.accent, alpha: 0.8 },
      ]
    case 'crystal':
      return [
        { d: `M${hx + 2},${hy + 6}L${hx + 8},${hy - 30}`, stroke: sp.stick, lw: 3.2, cap: 'round' },
        { d: gemPath(hx + 9, hy - 39, 17, 22), fill: sp.main },
        {
          d: `M${hx + 1},${hy - 46}L${hx + 9},${hy - 28}L${hx + 17},${hy - 46}`,
          stroke: 'rgba(255,255,255,.6)',
          lw: 1,
        },
        { d: sparklePath(hx + 21, hy - 33, 4), fill: sp.accent },
      ]
    case 'bouquet':
      return [
        { d: `M${hx + 1},${hy + 4}L${hx + 6},${hy - 18}`, stroke: '#6fae63', lw: 3.2, cap: 'round' },
        { d: flowerPath(hx + 5, hy - 26, 8.6, 5), fill: sp.main },
        { d: flowerPath(hx + 17, hy - 19, 6.6, 5), fill: sp.accent },
        { d: flowerPath(hx - 6, hy - 18, 6.6, 5), fill: sp.accent },
        { d: circlePath(hx + 5, hy - 26, 2.9), fill: '#fff2c9' },
        {
          d: `M${hx + 10},${hy - 9}Q${hx + 16},${hy - 17} ${hx + 21},${hy - 13}`,
          stroke: '#6fae63',
          lw: 1.8,
        },
      ]
    case 'fan':
      return [
        {
          d: `M${hx + 1},${hy + 4}L${hx - 15},${hy - 17}A26,26 0 0 1 ${hx + 17},${hy - 17}Z`,
          fill: sp.main,
        },
        {
          d: `M${hx + 1},${hy + 4}L${hx - 15},${hy - 17}A26,26 0 0 1 ${hx + 17},${hy - 17}Z`,
          stroke: sp.accent,
          lw: 1.1,
        },
        { d: `M${hx + 1},${hy + 4}L${hx - 4},${hy - 20}`, stroke: sp.accent, lw: 0.8 },
        { d: `M${hx + 1},${hy + 4}L${hx + 9},${hy - 20}`, stroke: sp.accent, lw: 0.8 },
      ]
    case 'bag':
      return [
        { d: arcPath(hx - 3, hy + 2, hx + 7, hy + 2, 9), stroke: sp.accent, lw: 1.7 },
        { d: rrectPath(hx - 7, hy + 10, 18, 14, 4), fill: sp.main },
        { d: rrectPath(hx - 7, hy + 10, 18, 4.4, 2), fill: sp.accent },
        { d: circlePath(hx + 2, hy + 17, 2), fill: sp.accent },
      ]
  }
}
