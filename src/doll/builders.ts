/**
 * 옷·악세사리 생성기.
 *
 * 옷 55 벌을 하나하나 손으로 그리면 관리가 안 된다. 대신 "실루엣 + 색 3개 +
 * 목선 + 장식" 같은 사양(spec)을 받아 조각을 찍어내는 함수를 둔다.
 * wardrobe.ts 는 이 함수들에 넘길 데이터 표일 뿐이다.
 *
 * 좌표는 전부 body.ts 의 A(자리표)를 기준으로 한다.
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
import { A } from './body'

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
  [-0.5, 0.2],
  [0.42, 0.32],
  [-0.18, 0.52],
  [0.6, 0.62],
  [-0.68, 0.74],
  [0.14, 0.84],
  [-0.36, 0.93],
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
  const out: Shape[] = []
  for (let i = 0; i < count; i++) {
    const [rx, ry] = SCATTER[i % SCATTER.length]!
    const y = topY + (botY - topY) * ry
    const half = topHalf + (botHalf - topHalf) * ry
    out.push(make(100 + rx * half * 0.92, y, i))
  }
  return out
}

/** 머리 위 호(왕관이 앉는 선) 위의 점 */
export function headArc(t: number): [number, number] {
  const p0 = [62, 58]
  const c = [100, 18]
  const p1 = [138, 58]
  const u = 1 - t
  return [
    u * u * p0[0]! + 2 * u * t * c[0]! + t * t * p1[0]!,
    u * u * p0[1]! + 2 * u * t * c[1]! + t * t * p1[1]!,
  ]
}

const HEAD_BAND = `M62,58Q100,18 138,58`

// ── 드레스 ─────────────────────────────────────────────────────

export type Silhouette = 'ballgown' | 'gown' | 'aline' | 'mermaid' | 'pants'
export type Neckline = 'puff' | 'off' | 'strap' | 'long' | 'halter'
export type Deco =
  | 'sparkle'
  | 'rose'
  | 'shell'
  | 'snow'
  | 'leaf'
  | 'gold'
  | 'star'
  | 'frill'
  | 'none'

export type DressSpec = {
  silhouette: Silhouette
  main: string
  dark: string
  trim: string
  neckline: Neckline
  deco: Deco
  decoColor: string
}

const MERMAID_SKIRT =
  `M74,186C69,216 71,242 78,254C70,268 60,286 56,298L144,298` +
  `C140,286 130,268 122,254C129,242 131,216 126,186Z`

const PANTS_L = `M76,188C56,206 54,238 70,252C81,260 93,253 95,240L97,188Z`
const PANTS_R = `M124,188C144,206 146,238 130,252C119,260 107,253 105,240L103,188Z`

function skirtOf(sp: DressSpec): { d: string; botY: number; botHalf: number } {
  switch (sp.silhouette) {
    case 'ballgown':
      return { d: skirtPath(100, 184, 58, 282, 158, 6, 9, 0.68), botY: 282, botHalf: 79 }
    case 'gown':
      return { d: skirtPath(100, 186, 56, 290, 132, 5, 7, 0.6), botY: 290, botHalf: 66 }
    case 'aline':
      return { d: skirtPath(100, 186, 56, 258, 118, 5, 6, 0.5), botY: 258, botHalf: 59 }
    case 'mermaid':
      return { d: MERMAID_SKIRT, botY: 296, botHalf: 44 }
    case 'pants':
      return { d: mergePaths(PANTS_L, PANTS_R), botY: 250, botHalf: 45 }
  }
}

/** 몸통 부분. topY 가 낮을수록 어깨를 덮는다 */
function bodicePath(topY: number): string {
  return (
    `M73,${topY + 10}Q73,${topY + 1} 86,${topY - 1}` +
    `L114,${topY - 1}Q127,${topY + 1} 127,${topY + 10}` +
    `L127,193Q100,198 73,193Z`
  )
}

function decoShapes(sp: DressSpec, botY: number, botHalf: number): Shape[] {
  const c = sp.decoColor
  switch (sp.deco) {
    case 'sparkle':
      return scatter(200, botY - 6, 30, botHalf, 7, (x, y, i) => ({
        d: sparklePath(x, y, i % 2 === 0 ? 6 : 4),
        fill: c,
        alpha: 0.9,
      }))
    case 'star':
      return scatter(200, botY - 6, 30, botHalf, 6, (x, y, i) => ({
        d: starPath(x, y, i % 2 === 0 ? 7 : 5, i % 2 === 0 ? 3 : 2.2),
        fill: c,
      }))
    case 'rose':
      return [
        ...scatter(206, botY - 10, 32, botHalf, 4, (x, y) => ({
          d: flowerPath(x, y, 8, 5),
          fill: c,
        })),
        { d: flowerPath(100, 186, 10, 5), fill: c },
        { d: circlePath(100, 186, 3.4), fill: '#fff2c9' },
      ]
    case 'shell':
      return scatter(206, botY - 10, 32, botHalf, 5, (x, y) => ({
        d: mergePaths(
          `M${x - 8},${y + 5}Q${x},${y - 9} ${x + 8},${y + 5}Z`,
          `M${x},${y + 5}L${x},${y - 6}`,
        ),
        fill: c,
        stroke: 'rgba(255,255,255,.6)',
        lw: 1,
      }))
    case 'snow':
      return scatter(200, botY - 6, 30, botHalf, 6, (x, y, i) => ({
        d: mergePaths(
          `M${x - 7},${y}L${x + 7},${y}`,
          `M${x},${y - 7}L${x},${y + 7}`,
          `M${x - 5},${y - 5}L${x + 5},${y + 5}`,
          `M${x - 5},${y + 5}L${x + 5},${y - 5}`,
        ),
        stroke: c,
        lw: i % 2 === 0 ? 1.8 : 1.2,
        cap: 'round',
      }))
    case 'leaf':
      return scatter(206, botY - 10, 32, botHalf, 5, (x, y) => ({
        d: `M${x},${y - 8}Q${x + 8},${y} ${x},${y + 8}Q${x - 8},${y} ${x},${y - 8}Z`,
        fill: c,
      }))
    case 'gold':
      return [
        { d: `M100,192L100,${botY - 4}`, stroke: c, lw: 2, dash: [6, 5] },
        { d: `M84,196L${100 - botHalf * 0.72},${botY - 6}`, stroke: c, lw: 1.6, alpha: 0.8 },
        { d: `M116,196L${100 + botHalf * 0.72},${botY - 6}`, stroke: c, lw: 1.6, alpha: 0.8 },
        { d: rrectPath(74, 178, 52, 9, 4), fill: c },
      ]
    case 'frill':
      return [
        {
          d: skirtPath(100, botY - 44, botHalf * 1.3, botY - 10, botHalf * 1.86, 6, 6, 0.5),
          fill: c,
          alpha: 0.55,
        },
      ]
    case 'none':
      return []
  }
}

/** 목선에 따라 달라지는 앞쪽 조각 + 소매 */
function necklineParts(sp: DressSpec): { topY: number; front: Shape[]; sleeves: Shape[] } {
  const puff = (x: number): Shape[] => [
    { d: ellipsePath(x, 152, 14, 13), fill: sp.main },
    { d: ellipsePath(x, 152, 14, 13), stroke: sp.dark, lw: 1.2, alpha: 0.5 },
    { d: arcPath(x - 8, 147, x + 4, 145, -3), stroke: 'rgba(255,255,255,.5)', lw: 3, cap: 'round' },
  ]

  switch (sp.neckline) {
    case 'puff':
      return { topY: 126, front: [], sleeves: [...puff(66), ...puff(134)] }
    case 'off':
      return {
        topY: 140,
        front: [{ d: rrectPath(70, 138, 60, 7, 3.5), fill: sp.trim }],
        sleeves: [...puff(66), ...puff(134)],
      }
    case 'strap':
      return {
        topY: 142,
        front: [
          { d: `M84,144L88,124`, stroke: sp.main, lw: 5, cap: 'round' },
          { d: `M116,144L112,124`, stroke: sp.main, lw: 5, cap: 'round' },
        ],
        sleeves: [],
      }
    case 'halter':
      return {
        topY: 142,
        front: [
          { d: `M88,144Q100,116 112,144`, stroke: sp.main, lw: 6, cap: 'round' },
        ],
        sleeves: [],
      }
    case 'long':
      return {
        topY: 126,
        front: [],
        sleeves: [
          {
            d: mergePaths(
              `M${A.armL.x},${A.armL.y}Q${A.armL.x - 12},182 ${A.handL.x + 1},${A.handL.y - 8}`,
              `M${A.armR.x},${A.armR.y}Q${A.armR.x + 12},182 ${A.handR.x - 1},${A.handR.y - 8}`,
            ),
            stroke: sp.main,
            lw: 15,
            cap: 'round',
          },
          { d: ellipsePath(56, 198, 11, 9), fill: sp.trim },
          { d: ellipsePath(144, 198, 11, 9), fill: sp.trim },
        ],
      }
  }
}

export function buildDress(sp: DressSpec): { front: Shape[]; sleeves: Shape[] } {
  const skirt = skirtOf(sp)
  const nk = necklineParts(sp)

  const front: Shape[] = [
    // 치마
    { d: skirt.d, fill: vshade(188, skirt.botY, sp.main, sp.dark) },
    { d: skirt.d, stroke: sp.dark, lw: 1.2, alpha: 0.6 },
    // 몸통
    { d: bodicePath(nk.topY), fill: vshade(nk.topY, 194, sp.main, sp.dark) },
    { d: bodicePath(nk.topY), stroke: sp.dark, lw: 1.2, alpha: 0.5 },
    // 허리 띠
    { d: rrectPath(72, 182, 56, 11, 5), fill: sp.trim },
    { d: circlePath(100, 187.5, 4), fill: '#fff6d8' },
    ...nk.front,
    ...decoShapes(sp, skirt.botY, skirt.botHalf),
  ]

  if (sp.silhouette === 'pants') {
    front.push(
      { d: rrectPath(62, 244, 26, 9, 4.5), fill: sp.trim },
      { d: rrectPath(112, 244, 26, 9, 4.5), fill: sp.trim },
    )
  }

  return { front, sleeves: nk.sleeves }
}

// ── 머리 ───────────────────────────────────────────────────────

export type HairStyle = 'long' | 'wave' | 'braid' | 'twin' | 'bun'

export type HairSpec = {
  style: HairStyle
  base: string
  dark: string
  shine: string
}

/** 어느 머리든 같은 정수리·앞머리를 쓴다. 리아 얼굴선이 흐트러지지 않게 */
function hairTop(sp: HairSpec): Shape[] {
  return [
    {
      d:
        `M55,90C51,44 76,25 101,25C131,25 149,46 146,92` +
        `C142,66 131,55 117,53` +
        `C110,70 93,77 74,74` +
        `C64,72 58,80 55,90Z`,
      fill: vshade(25, 94, sp.shine, sp.base),
    },
    { d: arcPath(74, 45, 112, 38, -7), stroke: sp.shine, lw: 5, cap: 'round', alpha: 0.55 },
  ]
}

function sideLock(sp: HairSpec, toY: number, wavy: boolean): Shape {
  const l = wavy
    ? `M52,70L70,70C68,110 76,130 66,${toY}C56,${toY - 12} 58,110 52,70Z`
    : `M52,70L70,70L68,${toY - 10}Q61,${toY} 54,${toY - 10}Z`
  const r = wavy
    ? `M148,70L130,70C132,110 124,130 134,${toY}C144,${toY - 12} 142,110 148,70Z`
    : `M148,70L130,70L132,${toY - 10}Q139,${toY} 146,${toY - 10}Z`
  return { d: mergePaths(l, r), fill: vshade(70, toY, sp.base, sp.dark) }
}

export function buildHair(sp: HairSpec): { back: Shape[]; front: Shape[] } {
  const head = ellipsePath(100, 84, 48, 60)

  if (sp.style === 'bun') {
    return {
      back: [{ d: head, fill: vshade(24, 146, sp.base, sp.dark) }],
      front: [
        { d: ellipsePath(100, 22, 25, 21), fill: vshade(2, 42, sp.shine, sp.base) },
        { d: ellipsePath(100, 22, 25, 21), stroke: sp.dark, lw: 1.4, alpha: 0.5 },
        { d: arcPath(84, 16, 116, 16, 8), stroke: sp.shine, lw: 3, cap: 'round', alpha: 0.6 },
        sideLock(sp, 120, false),
        ...hairTop(sp),
      ],
    }
  }

  if (sp.style === 'twin') {
    const tail = (x: number, dir: number): Shape[] => [
      {
        d:
          `M${x},104C${x + dir * 28},110 ${x + dir * 38},146 ${x + dir * 28},188` +
          `C${x + dir * 20},214 ${x - dir * 4},212 ${x - dir * 6},186` +
          `C${x - dir * 4},146 ${x - dir * 8},118 ${x},104Z`,
        fill: vshade(104, 210, sp.base, sp.dark),
      },
      { d: circlePath(x, 106, 9), fill: '#f26d8e' },
      { d: circlePath(x, 106, 4.5), fill: '#ffd0dd' },
    ]
    return {
      back: [{ d: head, fill: vshade(24, 146, sp.base, sp.dark) }],
      front: [...tail(56, -1), ...tail(144, 1), sideLock(sp, 128, false), ...hairTop(sp)],
    }
  }

  if (sp.style === 'braid') {
    const seg: Shape[] = []
    for (let i = 0; i < 9; i++) {
      const y = 128 + i * 14
      const x = 60 - i * 0.9
      seg.push({
        d: ellipsePath(x, y, 11 - i * 0.5, 8.5),
        fill: i % 2 === 0 ? sp.base : sp.dark,
      })
    }
    return {
      back: [{ d: head, fill: vshade(24, 146, sp.base, sp.dark) }],
      front: [
        sideLock(sp, 124, false),
        ...seg,
        // 끝 리본
        { d: `M46,254L60,246L60,262Z`, fill: '#f26d8e' },
        { d: `M66,254L52,246L52,262Z`, fill: '#f26d8e' },
        { d: circlePath(56, 254, 4), fill: '#ffd0dd' },
        ...hairTop(sp),
      ],
    }
  }

  // long · wave — 뒤로 길게 흐른다
  const wavy = sp.style === 'wave'
  const backMass = wavy
    ? skirtPath(100, 84, 96, 246, 128, 5, 10, 0.55)
    : skirtPath(100, 84, 96, 240, 116, 3, 5, 0.5)

  return {
    back: [
      { d: head, fill: vshade(24, 146, sp.base, sp.dark) },
      { d: backMass, fill: vshade(84, 250, sp.base, sp.dark) },
    ],
    front: [sideLock(sp, wavy ? 212 : 200, wavy), ...hairTop(sp)],
  }
}

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
    { d: HEAD_BAND, stroke: sp.metalDark, lw: 8, cap: 'round' },
    { d: HEAD_BAND, stroke: sp.metal, lw: 5.5, cap: 'round' },
  ]

  switch (sp.style) {
    case 'tiara': {
      const out = [...band]
      for (const [t, h] of [[0.28, 12], [0.5, 20], [0.72, 12]] as const) {
        const [x, y] = headArc(t)
        out.push({ d: polyPath([x - 7, y - 1, x, y - h, x + 7, y - 1]), fill: sp.metal })
        out.push({ d: circlePath(x, y - h + 4, 3.4), fill: sp.gem })
      }
      return out
    }
    case 'gold': {
      const out = [...band]
      for (const t of [0.16, 0.33, 0.5, 0.67, 0.84]) {
        const [x, y] = headArc(t)
        const h = t === 0.5 ? 20 : 14
        out.push({ d: polyPath([x - 6, y, x, y - h, x + 6, y]), fill: sp.metal })
        out.push({ d: circlePath(x, y - h - 2, 3.2), fill: sp.gem })
      }
      return out
    }
    case 'flower': {
      const out: Shape[] = [{ d: HEAD_BAND, stroke: '#6fae63', lw: 4, cap: 'round' }]
      for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) {
        const [x, y] = headArc(t)
        out.push({ d: flowerPath(x, y - 3, 8.5, 5), fill: sp.metal })
        out.push({ d: circlePath(x, y - 3, 3.2), fill: sp.gem })
      }
      return out
    }
    case 'pearl': {
      const out: Shape[] = [{ d: HEAD_BAND, stroke: sp.metal, lw: 5, cap: 'round' }]
      for (let i = 0; i <= 8; i++) {
        const [x, y] = headArc(i / 8)
        out.push({ d: circlePath(x, y - 1, 4.2), fill: sp.gem })
        out.push({ d: circlePath(x - 1.2, y - 2.4, 1.5), fill: 'rgba(255,255,255,.85)' })
      }
      return out
    }
    case 'snow': {
      const out = [...band]
      for (const [t, r] of [[0.26, 8], [0.5, 12], [0.74, 8]] as const) {
        const [x, y] = headArc(t)
        const cy = y - r - 2
        out.push({
          d: mergePaths(
            `M${x - r},${cy}L${x + r},${cy}`,
            `M${x},${cy - r}L${x},${cy + r}`,
            `M${x - r * 0.7},${cy - r * 0.7}L${x + r * 0.7},${cy + r * 0.7}`,
            `M${x - r * 0.7},${cy + r * 0.7}L${x + r * 0.7},${cy - r * 0.7}`,
          ),
          stroke: sp.gem,
          lw: 2.2,
          cap: 'round',
        })
        out.push({ d: circlePath(x, cy, 2.4), fill: '#ffffff' })
      }
      return out
    }
    case 'star': {
      const out = [...band]
      for (const [t, r] of [[0.2, 6], [0.5, 11], [0.8, 6]] as const) {
        const [x, y] = headArc(t)
        out.push({ d: starPath(x, y - r - 2, r, r * 0.42), fill: sp.gem })
      }
      return out
    }
  }
}

/** 왕관 공방에서 만든 왕관 — 칸마다 보석이 박힌다 */
export const CROWN_SLOTS: readonly (readonly [number, number])[] = [
  headArc(0.08),
  headArc(0.2),
  headArc(0.32),
  headArc(0.44),
  headArc(0.56),
  headArc(0.68),
  headArc(0.8),
  headArc(0.92),
] as unknown as readonly (readonly [number, number])[]

// ── 구두 ───────────────────────────────────────────────────────

export type ShoeStyle = 'glass' | 'pump' | 'ribbon' | 'ballet' | 'boot'

export type ShoeSpec = {
  style: ShoeStyle
  main: string
  dark: string
  accent: string
}

const SHOE_L = `M77,284Q77,275 89,274Q101,274 101,289L101,296Q101,301 96,301L82,301Q77,301 77,296Z`
const SHOE_R = `M123,284Q123,275 111,274Q99,274 99,289L99,296Q99,301 104,301L118,301Q123,301 123,296Z`

export function buildShoes(sp: ShoeSpec): Shape[] {
  const body: Shape[] = [
    {
      d: mergePaths(SHOE_L, SHOE_R),
      fill: sp.style === 'glass'
        ? linear(0, 274, 0, 301, [
            [0, 'rgba(214,240,255,.92)'],
            [1, 'rgba(150,200,240,.95)'],
          ])
        : vshade(274, 301, sp.main, sp.dark),
    },
    { d: mergePaths(SHOE_L, SHOE_R), stroke: sp.dark, lw: 1.2, alpha: 0.7 },
    { d: rrectPath(77, 296, 24, 5, 2.5), fill: sp.dark },
    { d: rrectPath(99, 296, 24, 5, 2.5), fill: sp.dark },
  ]

  switch (sp.style) {
    case 'glass':
      return [
        ...body,
        { d: sparklePath(86, 282, 5), fill: '#ffffff' },
        { d: sparklePath(114, 285, 4), fill: '#ffffff' },
        { d: arcPath(80, 292, 96, 288, -3), stroke: 'rgba(255,255,255,.8)', lw: 2 },
      ]
    case 'ribbon':
      return [
        ...body,
        { d: `M82,278L90,274L90,284Z`, fill: sp.accent },
        { d: `M98,278L90,274L90,284Z`, fill: sp.accent },
        { d: circlePath(90, 279, 2.6), fill: '#fff0f5' },
        { d: `M110,278L118,274L118,284Z`, fill: sp.accent },
        { d: `M126,278L118,274L118,284Z`, fill: sp.accent },
        { d: circlePath(118, 279, 2.6), fill: '#fff0f5' },
      ]
    case 'ballet':
      return [
        ...body,
        { d: `M84,274Q88,258 80,250`, stroke: sp.accent, lw: 2.6, cap: 'round' },
        { d: `M94,274Q92,258 100,250`, stroke: sp.accent, lw: 2.6, cap: 'round' },
        { d: `M116,274Q112,258 120,250`, stroke: sp.accent, lw: 2.6, cap: 'round' },
        { d: `M106,274Q108,258 100,250`, stroke: sp.accent, lw: 2.6, cap: 'round' },
      ]
    case 'boot':
      return [
        { d: rrectPath(78, 250, 22, 40, 8), fill: vshade(250, 290, sp.main, sp.dark) },
        { d: rrectPath(100, 250, 22, 40, 8), fill: vshade(250, 290, sp.main, sp.dark) },
        ...body,
        { d: rrectPath(78, 250, 22, 7, 3.5), fill: sp.accent },
        { d: rrectPath(100, 250, 22, 7, 3.5), fill: sp.accent },
      ]
    case 'pump':
      return [
        ...body,
        { d: circlePath(88, 279, 3.6), fill: sp.accent },
        { d: circlePath(112, 279, 3.6), fill: sp.accent },
      ]
  }
}

// ── 목걸이 ─────────────────────────────────────────────────────

export type NecklaceStyle = 'pearl' | 'heart' | 'star' | 'shell' | 'snow'

export type NecklaceSpec = {
  style: NecklaceStyle
  chain: string
  gem: string
}

export function buildNecklace(sp: NecklaceSpec): Shape[] {
  const chain = arcPath(84, 132, 116, 132, 16)
  const out: Shape[] = [{ d: chain, stroke: sp.chain, lw: 2.2, cap: 'round' }]

  if (sp.style === 'pearl') {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const u = 1 - t
      const x = u * u * 84 + 2 * u * t * 100 + t * t * 116
      const y = u * u * 132 + 2 * u * t * 156 + t * t * 132
      out.push({ d: circlePath(x, y, 3.4), fill: sp.gem })
      out.push({ d: circlePath(x - 1, y - 1.2, 1.2), fill: 'rgba(255,255,255,.8)' })
    }
    return out
  }

  const px = 100
  const py = 150
  switch (sp.style) {
    case 'heart':
      out.push({ d: heartPath(px, py, 7), fill: sp.gem })
      break
    case 'star':
      out.push({ d: starPath(px, py, 8, 3.4), fill: sp.gem })
      break
    case 'shell':
      out.push(
        { d: `M${px - 9},${py + 5}Q${px},${py - 10} ${px + 9},${py + 5}Z`, fill: sp.gem },
        { d: `M${px},${py + 5}L${px},${py - 7}`, stroke: 'rgba(255,255,255,.7)', lw: 1.2 },
      )
      break
    case 'snow':
      out.push({
        d: mergePaths(
          `M${px - 8},${py}L${px + 8},${py}`,
          `M${px},${py - 8}L${px},${py + 8}`,
          `M${px - 6},${py - 6}L${px + 6},${py + 6}`,
          `M${px - 6},${py + 6}L${px + 6},${py - 6}`,
        ),
        stroke: sp.gem,
        lw: 2.2,
        cap: 'round',
      })
      break
  }
  out.push({ d: circlePath(px - 2, py - 2, 1.6), fill: 'rgba(255,255,255,.85)' })
  return out
}

// ── 장갑 ───────────────────────────────────────────────────────

export type GloveSpec = { long: boolean; main: string; trim: string }

export function buildGloves(sp: GloveSpec): Shape[] {
  const armL = sp.long
    ? `M67,164Q59,188 ${A.handL.x + 1},${A.handL.y - 8}`
    : `M60,196Q58,202 ${A.handL.x + 1},${A.handL.y - 8}`
  const armR = sp.long
    ? `M133,164Q141,188 ${A.handR.x - 1},${A.handR.y - 8}`
    : `M140,196Q142,202 ${A.handR.x - 1},${A.handR.y - 8}`

  return [
    { d: mergePaths(armL, armR), stroke: sp.main, lw: 13.5, cap: 'round' },
    { d: circlePath(A.handL.x, A.handL.y, 8.6), fill: sp.main },
    { d: circlePath(A.handR.x, A.handR.y, 8.6), fill: sp.main },
    {
      d: sp.long
        ? mergePaths(ellipsePath(67, 165, 8, 4), ellipsePath(133, 165, 8, 4))
        : mergePaths(ellipsePath(59, 199, 8, 4), ellipsePath(141, 199, 8, 4)),
      fill: sp.trim,
    },
  ]
}

// ── 망토 ───────────────────────────────────────────────────────

export type CapeSpec = { main: string; dark: string; lining: string; clasp: string }

export function buildCape(sp: CapeSpec): { back: Shape[]; front: Shape[] } {
  // 드레스보다 넓어야 한다. 좁게 만들었더니 볼 가운 뒤에 완전히 숨어서
  // 망토를 입었는지 알 수가 없었다.
  const cloth = skirtPath(100, 130, 70, 304, 194, 7, 10, 0.78)
  return {
    back: [
      { d: cloth, fill: vshade(130, 304, sp.main, sp.dark) },
      { d: skirtPath(100, 132, 54, 298, 140, 5, 7, 0.76), fill: sp.lining, alpha: 0.45 },
      { d: cloth, stroke: sp.dark, lw: 1.4, alpha: 0.6 },
    ],
    front: [
      { d: `M72,130Q100,146 128,130`, stroke: sp.main, lw: 7, cap: 'round' },
      { d: circlePath(76, 132, 5), fill: sp.clasp },
      { d: circlePath(124, 132, 5), fill: sp.clasp },
      { d: circlePath(74.6, 130.6, 1.6), fill: 'rgba(255,255,255,.85)' },
    ],
  }
}

// ── 날개 ───────────────────────────────────────────────────────

export type WingStyle = 'fairy' | 'butterfly' | 'angel' | 'sparkle'

export type WingSpec = { style: WingStyle; main: string; edge: string }

export function buildWings(sp: WingSpec): Shape[] {
  const paint = (x0: number, x1: number): Paint =>
    linear(x0, 120, x1, 220, [
      [0, sp.main],
      [1, sp.edge],
    ])

  // 날개는 드레스와 머리 밖으로 크게 나와야 보인다.
  // 어깨 뒤에 얌전히 붙여 놨더니 아무 것도 안 보였다.
  if (sp.style === 'butterfly') {
    const left = mergePaths(
      `M86,142C54,92 10,100 8,140C6,172 46,180 86,156Z`,
      `M86,164C52,182 18,200 24,232C30,260 72,240 88,190Z`,
    )
    const right = mergePaths(
      `M114,142C146,92 190,100 192,140C194,172 154,180 114,156Z`,
      `M114,164C148,182 182,200 176,232C170,260 128,240 112,190Z`,
    )
    return [
      { d: left, fill: paint(8, 90), alpha: 0.88 },
      { d: right, fill: paint(192, 110), alpha: 0.88 },
      { d: mergePaths(left, right), stroke: sp.edge, lw: 1.8, alpha: 0.9 },
      { d: circlePath(44, 132, 6), fill: 'rgba(255,255,255,.6)' },
      { d: circlePath(156, 132, 6), fill: 'rgba(255,255,255,.6)' },
      { d: circlePath(48, 212, 4.5), fill: 'rgba(255,255,255,.5)' },
      { d: circlePath(152, 212, 4.5), fill: 'rgba(255,255,255,.5)' },
    ]
  }

  if (sp.style === 'angel') {
    const feather = (x: number, dir: number): Shape[] => {
      const out: Shape[] = []
      for (let i = 0; i < 5; i++) {
        const yy = 128 + i * 22
        const len = 78 - i * 9
        out.push({
          d:
            `M${x},${yy}C${x + dir * len * 0.6},${yy - 18} ${x + dir * len},${yy + 2} ` +
            `${x + dir * len * 0.84},${yy + 26}C${x + dir * len * 0.4},${yy + 20} ` +
            `${x + dir * 12},${yy + 16} ${x},${yy}Z`,
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
    const left = `M88,148C56,110 18,122 18,154C18,190 56,196 88,172Z`
    const right = `M112,148C144,110 182,122 182,154C182,190 144,196 112,172Z`
    return [
      { d: left, fill: paint(18, 90), alpha: 0.72 },
      { d: right, fill: paint(182, 110), alpha: 0.72 },
      { d: mergePaths(left, right), stroke: sp.edge, lw: 1.4, alpha: 0.8 },
      { d: sparklePath(42, 142, 10), fill: '#fff6c9' },
      { d: sparklePath(158, 142, 10), fill: '#fff6c9' },
      { d: sparklePath(60, 176, 6), fill: '#fff6c9' },
      { d: sparklePath(140, 176, 6), fill: '#fff6c9' },
    ]
  }

  // fairy — 위아래 두 장씩, 잎사귀 모양
  const left = mergePaths(
    `M88,144C54,104 14,118 18,156C22,186 58,182 88,158Z`,
    `M88,166C60,182 28,204 36,232C46,256 84,230 90,190Z`,
  )
  const right = mergePaths(
    `M112,144C146,104 186,118 182,156C178,186 142,182 112,158Z`,
    `M112,166C140,182 172,204 164,232C154,256 116,230 110,190Z`,
  )
  return [
    { d: left, fill: paint(14, 92), alpha: 0.84 },
    { d: right, fill: paint(186, 108), alpha: 0.84 },
    { d: mergePaths(left, right), stroke: sp.edge, lw: 1.6, alpha: 0.9 },
    { d: arcPath(36, 142, 84, 158, 8), stroke: 'rgba(255,255,255,.55)', lw: 1.8 },
    { d: arcPath(164, 142, 116, 158, 8), stroke: 'rgba(255,255,255,.55)', lw: 1.8 },
  ]
}

// ── 귀걸이 ─────────────────────────────────────────────────────

export type EarringStyle = 'pearl' | 'star' | 'heart' | 'drop'

export type EarringSpec = { style: EarringStyle; metal: string; gem: string }

export function buildEarrings(sp: EarringSpec): Shape[] {
  const one = (x: number): Shape[] => {
    const top: Shape = { d: circlePath(x, 94, 2), fill: sp.metal }
    switch (sp.style) {
      case 'pearl':
        return [top, { d: circlePath(x, 101, 4.4), fill: sp.gem },
          { d: circlePath(x - 1.3, 99.6, 1.5), fill: 'rgba(255,255,255,.85)' }]
      case 'star':
        return [top, { d: starPath(x, 102, 6, 2.6), fill: sp.gem }]
      case 'heart':
        return [top, { d: heartPath(x, 101, 5), fill: sp.gem }]
      case 'drop':
        return [
          top,
          { d: `M${x},96L${x},99`, stroke: sp.metal, lw: 1.6 },
          { d: dropPath(x, 104, 8, 12), fill: sp.gem },
          { d: circlePath(x - 1.6, 101, 1.4), fill: 'rgba(255,255,255,.8)' },
        ]
    }
  }
  return [...one(60), ...one(140)]
}

// ── 손에 드는 소품 ─────────────────────────────────────────────

export type WandStyle = 'star' | 'crystal' | 'bouquet' | 'fan' | 'bag'

export type WandSpec = { style: WandStyle; stick: string; main: string; accent: string }

export function buildWand(sp: WandSpec): Shape[] {
  const hx = A.handR.x
  const hy = A.handR.y

  switch (sp.style) {
    case 'star':
      return [
        { d: `M${hx + 3},${hy + 10}L${hx + 13},${hy - 52}`, stroke: sp.stick, lw: 5, cap: 'round' },
        { d: starPath(hx + 15, hy - 62, 17, 7.4), fill: sp.main },
        { d: starPath(hx + 15, hy - 62, 9, 4), fill: sp.accent },
        { d: sparklePath(hx + 33, hy - 44, 7), fill: sp.accent, alpha: 0.9 },
        { d: sparklePath(hx + 1, hy - 78, 6), fill: sp.accent, alpha: 0.8 },
      ]
    case 'crystal':
      return [
        { d: `M${hx + 3},${hy + 10}L${hx + 12},${hy - 46}`, stroke: sp.stick, lw: 5, cap: 'round' },
        { d: gemPath(hx + 14, hy - 60, 26, 34), fill: sp.main },
        {
          d: `M${hx + 1},${hy - 71}L${hx + 14},${hy - 43}L${hx + 27},${hy - 71}`,
          stroke: 'rgba(255,255,255,.6)',
          lw: 1.6,
        },
        { d: sparklePath(hx + 33, hy - 50, 6), fill: sp.accent },
      ]
    case 'bouquet':
      return [
        { d: `M${hx + 2},${hy + 8}L${hx + 10},${hy - 26}`, stroke: '#6fae63', lw: 5, cap: 'round' },
        { d: flowerPath(hx + 8, hy - 38, 13, 5), fill: sp.main },
        { d: flowerPath(hx + 26, hy - 28, 10, 5), fill: sp.accent },
        { d: flowerPath(hx - 6, hy - 26, 10, 5), fill: sp.accent },
        { d: circlePath(hx + 8, hy - 38, 4.4), fill: '#fff2c9' },
        {
          d: `M${hx + 16},${hy - 14}Q${hx + 24},${hy - 26} ${hx + 32},${hy - 20}`,
          stroke: '#6fae63',
          lw: 2.6,
        },
      ]
    case 'fan':
      return [
        {
          d: `M${hx + 2},${hy + 6}L${hx - 22},${hy - 26}A40,40 0 0 1 ${hx + 26},${hy - 26}Z`,
          fill: sp.main,
        },
        {
          d: `M${hx + 2},${hy + 6}L${hx - 22},${hy - 26}A40,40 0 0 1 ${hx + 26},${hy - 26}Z`,
          stroke: sp.accent,
          lw: 1.6,
        },
        { d: `M${hx + 2},${hy + 6}L${hx - 6},${hy - 30}`, stroke: sp.accent, lw: 1.2 },
        { d: `M${hx + 2},${hy + 6}L${hx + 14},${hy - 30}`, stroke: sp.accent, lw: 1.2 },
      ]
    case 'bag':
      return [
        { d: arcPath(hx - 4, hy + 4, hx + 10, hy + 4, 14), stroke: sp.accent, lw: 2.6 },
        { d: rrectPath(hx - 10, hy + 16, 26, 20, 6), fill: sp.main },
        { d: rrectPath(hx - 10, hy + 16, 26, 6, 3), fill: sp.accent },
        { d: circlePath(hx + 3, hy + 27, 3), fill: sp.accent },
      ]
  }
}
