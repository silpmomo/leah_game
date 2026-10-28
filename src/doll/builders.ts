/**
 * 옷·악세사리 생성기.
 *
 * 옷 58 벌을 하나하나 손으로 그리면 관리가 안 된다. 대신 "실루엣 + 색 3개 +
 * 목선 + 장식" 같은 사양(spec)을 받아 조각을 찍어내는 함수를 둔다.
 * wardrobe.ts 는 이 함수들에 넘길 데이터 표일 뿐이다.
 *
 * 좌표는 전부 body.ts 의 A(자리표)를 기준으로 한다. 아바타가 치비 인형에서
 * 8등신으로 바뀌면서 이 파일을 통째로 다시 그렸다 — 사양 표(wardrobe.ts)와
 * 아이디는 그대로라 저장된 코디가 살아 있다.
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
import { A, ARM_L, ARM_R, FOOT_LX, FOOT_RX, HAIR_TOP, shoePath } from './body'

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
function armFrom(dir: 1 | -1, t0: number): string {
  const s = dir === 1 ? A.armL : A.armR
  const e = dir === 1 ? A.elbowL : A.elbowR
  const h = dir === 1 ? A.handL : A.handR
  const p0 = [s.x, s.y] as const
  const c = [e.x, e.y] as const
  const p1 = [h.x, h.y - 4] as const
  const [x0, y0] = qpt(p0, c, p1, t0)
  const cx = (1 - t0) * c[0] + t0 * p1[0]
  const cy = (1 - t0) * c[1] + t0 * p1[1]
  return `M${x0.toFixed(2)},${y0.toFixed(2)}Q${cx.toFixed(2)},${cy.toFixed(2)} ${p1[0]},${p1[1]}`
}

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
  `M86,168C80,230 84,290 90,330C80,362 64,396 56,412L144,412` +
  `C136,396 120,362 110,330C116,290 120,230 114,168Z`

const PANTS_L = `M85,168C76,230 70,320 64,408L95,408L99,212Z`
const PANTS_R = `M115,168C124,230 130,320 136,408L105,408L101,212Z`

/**
 * 허리부터 바로 부풀어 오르는 볼 가운 치마.
 *
 * skirtPath 는 옆선이 안으로 오목해서 엉덩이에서 한 번 오므라든다 —
 * 볼 가운에 쓰면 트럼펫 드레스처럼 보였다. 여기서는 옆선을 바깥으로
 * 볼록하게 뺀다.
 */
function fullSkirt(topY: number, topW: number, botY: number, botW: number, waves: number, waveH: number): string {
  const tl = 100 - topW / 2
  const tr = 100 + topW / 2
  const bl = 100 - botW / 2
  const br = 100 + botW / 2
  const h = botY - topY
  let d = `M${tl},${topY}C${tl - botW * 0.3},${topY + h * 0.12} ${bl},${topY + h * 0.55} ${bl},${botY}`
  const step = (br - bl) / waves
  for (let i = 0; i < waves; i++) {
    const x0 = bl + step * i
    d += `Q${(x0 + step / 2).toFixed(2)},${botY + waveH} ${(x0 + step).toFixed(2)},${botY}`
  }
  d += `C${br},${topY + h * 0.55} ${tr + botW * 0.3},${topY + h * 0.12} ${tr},${topY}Z`
  return d
}

function skirtOf(sp: DressSpec): { d: string; botY: number; botHalf: number } {
  switch (sp.silhouette) {
    case 'ballgown':
      return { d: fullSkirt(168, 32, 410, 192, 8, 7), botY: 410, botHalf: 96 }
    case 'gown':
      return { d: skirtPath(100, 168, 32, 412, 128, 6, 6, 0.62), botY: 412, botHalf: 64 }
    case 'aline':
      return { d: skirtPath(100, 168, 32, 300, 106, 5, 5, 0.5), botY: 300, botHalf: 53 }
    case 'mermaid':
      return { d: MERMAID_SKIRT, botY: 412, botHalf: 44 }
    case 'pants':
      return { d: mergePaths(PANTS_L, PANTS_R), botY: 404, botHalf: 36 }
  }
}

/** 몸통 부분. t 가 낮을수록 어깨를 덮는다 */
function bodicePath(t: number): string {
  return (
    `M72,${t + 8}Q73,${t} 84,${t - 1}L116,${t - 1}Q127,${t} 128,${t + 8}` +
    `C126,148 117,158 115,174L85,174C83,158 74,148 72,${t + 8}Z`
  )
}

/** 치마 주름 — 허리에서 밑단으로 퍼지는 그늘 선 */
function folds(sp: DressSpec, botY: number, botHalf: number): Shape[] {
  if (sp.silhouette === 'pants' || sp.silhouette === 'mermaid') return []
  const out: Shape[] = []
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue
    out.push({
      d: `M${100 + i * 4},180Q${100 + i * botHalf * 0.22},${(180 + botY) / 2} ${100 + i * botHalf * 0.28},${botY - 4}`,
      stroke: sp.dark,
      lw: 1.1,
      alpha: 0.28,
      cap: 'round',
    })
  }
  return out
}

function decoShapes(sp: DressSpec, botY: number, botHalf: number): Shape[] {
  const c = sp.decoColor
  const top = 188
  const bot = botY - 12
  const half = Math.max(14, botHalf - 10)
  switch (sp.deco) {
    case 'sparkle':
      return scatter(top, bot, 18, half, 8, (x, y, i) => ({
        d: sparklePath(x, y, i % 2 === 0 ? 4.6 : 3.2),
        fill: c,
        alpha: 0.92,
      }))
    case 'star':
      return scatter(top, bot, 18, half, 7, (x, y, i) => ({
        d: starPath(x, y, i % 2 === 0 ? 5 : 3.6, i % 2 === 0 ? 2.1 : 1.5),
        fill: c,
      }))
    case 'rose':
      return [
        ...scatter(top + 6, bot, 20, half, 5, (x, y) => ({ d: flowerPath(x, y, 6.4, 5), fill: c })),
        { d: flowerPath(100, 170, 7.4, 5), fill: c },
        { d: circlePath(100, 170, 2.4), fill: '#fff2c9' },
      ]
    case 'shell':
      return scatter(top + 6, bot, 20, half, 5, (x, y) => ({
        d: mergePaths(`M${x - 6},${y + 4}Q${x},${y - 7} ${x + 6},${y + 4}Z`, `M${x},${y + 4}L${x},${y - 4}`),
        fill: c,
        stroke: 'rgba(255,255,255,.6)',
        lw: 0.8,
      }))
    case 'snow':
      return scatter(top, bot, 18, half, 7, (x, y, i) => ({
        d: mergePaths(
          `M${x - 5},${y}L${x + 5},${y}`,
          `M${x},${y - 5}L${x},${y + 5}`,
          `M${x - 3.6},${y - 3.6}L${x + 3.6},${y + 3.6}`,
          `M${x - 3.6},${y + 3.6}L${x + 3.6},${y - 3.6}`,
        ),
        stroke: c,
        lw: i % 2 === 0 ? 1.4 : 1,
        cap: 'round',
      }))
    case 'leaf':
      return scatter(top + 6, bot, 18, half, 6, (x, y) => ({
        d: `M${x},${y - 6}Q${x + 6},${y} ${x},${y + 6}Q${x - 6},${y} ${x},${y - 6}Z`,
        fill: c,
      }))
    case 'gold':
      return [
        { d: `M100,176L100,${botY - 4}`, stroke: c, lw: 1.4, dash: [5, 4] },
        { d: `M90,178L${100 - botHalf * 0.72},${botY - 6}`, stroke: c, lw: 1.2, alpha: 0.8 },
        { d: `M110,178L${100 + botHalf * 0.72},${botY - 6}`, stroke: c, lw: 1.2, alpha: 0.8 },
        { d: rrectPath(84, 165, 32, 7, 3), fill: c },
      ]
    case 'frill':
      return [
        {
          d: skirtPath(100, botY - 56, botHalf * 1.3, botY - 8, Math.min(196, botHalf * 1.9), 7, 5, 0.5),
          fill: c,
          alpha: 0.55,
        },
      ]
    case 'none':
      return []
  }
}

/** 목선에 따라 달라지는 몸통 높이 · 앞쪽 조각 · 소매 */
function necklineParts(sp: DressSpec): { topY: number; front: Shape[]; sleeves: Shape[] } {
  const puff = (x: number, y: number, rx: number, ry: number): Shape[] => [
    { d: ellipsePath(x, y, rx, ry), fill: vshade(y - ry, y + ry, sp.main, sp.dark) },
    { d: ellipsePath(x, y, rx, ry), stroke: sp.dark, lw: 0.8, alpha: 0.5 },
    { d: arcPath(x - rx * 0.6, y - ry * 0.4, x + rx * 0.3, y - ry * 0.6, -2), stroke: 'rgba(255,255,255,.5)', lw: 1.8, cap: 'round' },
  ]

  switch (sp.neckline) {
    case 'puff':
      return { topY: 106, front: [], sleeves: [...puff(73, 120, 9, 9), ...puff(127, 120, 9, 9)] }
    case 'off':
      return {
        topY: 124,
        front: [{ d: rrectPath(71, 121, 58, 5, 2.5), fill: sp.trim }],
        sleeves: [...puff(69, 131, 8, 6.4), ...puff(131, 131, 8, 6.4)],
      }
    case 'strap':
      return {
        topY: 124,
        front: [
          { d: `M88,123L90,105`, stroke: sp.main, lw: 2.6, cap: 'round' },
          { d: `M112,123L110,105`, stroke: sp.main, lw: 2.6, cap: 'round' },
        ],
        sleeves: [],
      }
    case 'halter':
      return {
        topY: 124,
        front: [{ d: `M89,124Q100,96 111,124`, stroke: sp.main, lw: 3.4, cap: 'round' }],
        sleeves: [],
      }
    case 'long':
      return {
        topY: 106,
        front: [],
        sleeves: [
          { d: mergePaths(ARM_L, ARM_R), stroke: sp.main, lw: 10.5, cap: 'round' },
          { d: mergePaths(ARM_L, ARM_R), stroke: sp.dark, lw: 3, cap: 'round', alpha: 0.25 },
          { d: ellipsePath(A.handL.x, A.handL.y - 8, 6.6, 4.2), fill: sp.trim },
          { d: ellipsePath(A.handR.x, A.handR.y - 8, 6.6, 4.2), fill: sp.trim },
        ],
      }
  }
}

export function buildDress(sp: DressSpec): { front: Shape[]; sleeves: Shape[] } {
  const skirt = skirtOf(sp)
  const nk = necklineParts(sp)
  const bodice = bodicePath(nk.topY)
  const sideShade = linear(72, 0, 128, 0, [
    [0, 'rgba(0,0,0,.14)'],
    [0.25, 'rgba(0,0,0,0)'],
    [0.75, 'rgba(0,0,0,0)'],
    [1, 'rgba(0,0,0,.14)'],
  ])

  const front: Shape[] = [
    // 치마
    { d: skirt.d, fill: vshade(176, skirt.botY, sp.main, sp.dark) },
    ...folds(sp, skirt.botY, skirt.botHalf),
    // 튤 겉치마 — 볼 가운만. 겹이 보여야 공주 드레스 같다
    ...(sp.silhouette === 'ballgown'
      ? [{ d: fullSkirt(174, 26, 392, 150, 6, 6), fill: 'rgba(255,255,255,.16)' } as Shape]
      : []),
    { d: skirt.d, stroke: sp.dark, lw: 1, alpha: 0.6 },
    // 몸통
    { d: bodice, fill: vshade(nk.topY, 174, sp.main, sp.dark) },
    { d: bodice, fill: sideShade },
    { d: bodice, stroke: sp.dark, lw: 0.9, alpha: 0.5 },
    { d: arcPath(86, 140, 98, 141, 3), stroke: 'rgba(255,255,255,.35)', lw: 1, cap: 'round' },
    { d: arcPath(102, 141, 114, 140, 3), stroke: 'rgba(255,255,255,.35)', lw: 1, cap: 'round' },
    // 허리 띠
    { d: rrectPath(84, 167, 32, 7, 3.5), fill: sp.trim },
    { d: circlePath(100, 170.5, 2.4), fill: '#fff6d8' },
    ...nk.front,
    ...decoShapes(sp, skirt.botY, skirt.botHalf),
  ]

  if (sp.silhouette === 'pants') {
    front.push(
      { d: rrectPath(63, 402, 33, 6, 3), fill: sp.trim },
      { d: rrectPath(104, 402, 33, 6, 3), fill: sp.trim },
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

/** 어느 머리든 같은 정수리·앞머리를 쓴다. 얼굴선이 흐트러지지 않게 */
function hairTop(sp: HairSpec): Shape[] {
  return [
    { d: HAIR_TOP, fill: vshade(29, 74, sp.shine, sp.base) },
    { d: `M104,33Q116,40 121,62`, stroke: 'rgba(255,255,255,.16)', lw: 1.2, cap: 'round' },
    { d: `M96,34Q86,42 82,58`, stroke: 'rgba(255,255,255,.14)', lw: 1.2, cap: 'round' },
    { d: arcPath(88, 38, 110, 34, -4), stroke: sp.shine, lw: 2.6, cap: 'round', alpha: 0.6 },
  ]
}

function sideLock(sp: HairSpec, toY: number, wavy: boolean): Shape {
  const one = (dir: 1 | -1): string => {
    const x = (v: number): number => (dir === 1 ? v : 200 - v)
    if (wavy) {
      return (
        `M${x(78)},58C${x(68)},88 ${x(82)},${toY - 60} ${x(72)},${toY - 26}` +
        `C${x(66)},${toY - 12} ${x(76)},${toY - 4} ${x(73)},${toY}` +
        `C${x(85)},${toY - 18} ${x(80)},${toY - 38} ${x(84)},${toY - 64}C${x(85)},86 ${x(83)},70 ${x(82)},66Z`
      )
    }
    return `M${x(78)},58C${x(71)},${58 + (toY - 58) * 0.4} ${x(75)},${toY - 24} ${x(70)},${toY}C${x(77)},${toY - 8} ${x(82)},${toY - 30} ${x(82)},74Z`
  }
  return { d: mergePaths(one(1), one(-1)), fill: vshade(58, toY, sp.base, sp.dark) }
}

export function buildHair(sp: HairSpec): { back: Shape[]; front: Shape[] } {
  const head: Shape = { d: ellipsePath(100, 62, 25, 31), fill: vshade(28, 96, sp.base, sp.dark) }

  if (sp.style === 'bun') {
    return {
      back: [head],
      front: [
        { d: ellipsePath(100, 30, 14, 11), fill: vshade(19, 41, sp.shine, sp.base) },
        { d: ellipsePath(100, 30, 14, 11), stroke: sp.dark, lw: 1, alpha: 0.5 },
        { d: arcPath(91, 26, 109, 26, 4), stroke: sp.shine, lw: 1.8, cap: 'round', alpha: 0.6 },
        sideLock(sp, 106, false),
        ...hairTop(sp),
      ],
    }
  }

  if (sp.style === 'twin') {
    const tail = (x: number, dir: number): Shape[] => [
      {
        d:
          `M${x},62C${x + dir * 22},70 ${x + dir * 26},122 ${x + dir * 18},170` +
          `C${x + dir * 12},198 ${x - dir * 4},194 ${x - dir * 4},172` +
          `C${x - dir * 2},132 ${x - dir * 6},84 ${x},62Z`,
        fill: vshade(62, 196, sp.base, sp.dark),
      },
      { d: circlePath(x + dir * 3, 68, 4), fill: '#f26d8e' },
      { d: circlePath(x + dir * 3, 68, 1.8), fill: '#ffd0dd' },
    ]
    return {
      back: [head],
      front: [...tail(78, -1), ...tail(122, 1), sideLock(sp, 112, false), ...hairTop(sp)],
    }
  }

  if (sp.style === 'braid') {
    const seg: Shape[] = []
    for (let i = 0; i < 12; i++) {
      const y = 100 + i * 10
      const x = 80 - i * 0.6
      seg.push({ d: ellipsePath(x, y, 6.4 - i * 0.18, 5.8), fill: i % 2 === 0 ? sp.base : sp.dark })
    }
    return {
      back: [head, { d: skirtPath(100, 64, 50, 120, 56, 2, 3, 0.5), fill: vshade(64, 122, sp.base, sp.dark) }],
      front: [
        sideLock(sp, 120, false),
        ...seg,
        // 끝 리본
        { d: `M66,218L74,213L74,223Z`, fill: '#f26d8e' },
        { d: `M82,218L74,213L74,223Z`, fill: '#f26d8e' },
        { d: circlePath(74, 218, 2.4), fill: '#ffd0dd' },
        ...hairTop(sp),
      ],
    }
  }

  // long · wave — 등 뒤로 길게 흐른다
  const wavy = sp.style === 'wave'
  const backMass = wavy
    ? skirtPath(100, 64, 56, 224, 88, 6, 8, 0.55)
    : skirtPath(100, 64, 52, 214, 68, 4, 5, 0.5)

  return {
    back: [head, { d: backMass, fill: vshade(64, 226, sp.base, sp.dark) }],
    front: [sideLock(sp, wavy ? 172 : 162, wavy), ...hairTop(sp)],
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

// ── 구두 ───────────────────────────────────────────────────────

export type ShoeStyle = 'glass' | 'pump' | 'ribbon' | 'ballet' | 'boot'

export type ShoeSpec = {
  style: ShoeStyle
  main: string
  dark: string
  accent: string
}

const SHOES_BOTH = mergePaths(shoePath(FOOT_LX), shoePath(FOOT_RX))

/** 무릎 아래 부츠 기둥 — 다리 모양을 따라 가늘어진다 */
const BOOT_L = `M85,300L99,300L98,396L90,396Z`
const BOOT_R = `M115,300L101,300L102,396L110,396Z`

export function buildShoes(sp: ShoeSpec): Shape[] {
  const body: Shape[] = [
    {
      d: SHOES_BOTH,
      fill:
        sp.style === 'glass'
          ? linear(0, 389, 0, 416, [
              [0, 'rgba(214,240,255,.92)'],
              [1, 'rgba(150,200,240,.95)'],
            ])
          : vshade(389, 416, sp.main, sp.dark),
    },
    { d: SHOES_BOTH, stroke: sp.dark, lw: 0.9, alpha: 0.7 },
    // 발등 라인
    { d: mergePaths(arcPath(FOOT_LX - 4, 395, FOOT_LX + 4, 395, 2.4), arcPath(FOOT_RX - 4, 395, FOOT_RX + 4, 395, 2.4)), stroke: sp.dark, lw: 0.9 },
  ]

  switch (sp.style) {
    case 'glass':
      return [
        ...body,
        { d: sparklePath(FOOT_LX - 1, 400, 2.8), fill: '#ffffff' },
        { d: sparklePath(FOOT_RX + 1, 402, 2.4), fill: '#ffffff' },
      ]
    case 'ribbon': {
      const bow = (cx: number): Shape[] => [
        { d: `M${cx - 5},390L${cx},393L${cx - 5},396Z`, fill: sp.accent },
        { d: `M${cx + 5},390L${cx},393L${cx + 5},396Z`, fill: sp.accent },
        { d: circlePath(cx, 393, 1.4), fill: sp.dark },
      ]
      return [...body, ...bow(FOOT_LX), ...bow(FOOT_RX)]
    }
    case 'ballet': {
      const tie = (cx: number): Shape => ({
        d: mergePaths(
          `M${cx - 4},392Q${cx + 3},382 ${cx - 2},368`,
          `M${cx + 4},392Q${cx - 3},382 ${cx + 2},368`,
        ),
        stroke: sp.accent,
        lw: 1.3,
        cap: 'round',
      })
      return [...body, tie(FOOT_LX), tie(FOOT_RX)]
    }
    case 'boot':
      return [
        { d: mergePaths(BOOT_L, BOOT_R), fill: vshade(300, 396, sp.main, sp.dark) },
        { d: mergePaths(BOOT_L, BOOT_R), stroke: sp.dark, lw: 0.8, alpha: 0.6 },
        ...body,
        { d: rrectPath(84, 297, 16, 6, 3), fill: sp.accent },
        { d: rrectPath(100, 297, 16, 6, 3), fill: sp.accent },
      ]
    case 'pump':
      return [
        ...body,
        { d: circlePath(FOOT_LX, 393.5, 1.6), fill: sp.accent },
        { d: circlePath(FOOT_RX, 393.5, 1.6), fill: sp.accent },
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

const CHAIN_P0 = [90, 103] as const
const CHAIN_C = [100, 122] as const
const CHAIN_P1 = [110, 103] as const

export function buildNecklace(sp: NecklaceSpec): Shape[] {
  const chain = `M${CHAIN_P0[0]},${CHAIN_P0[1]}Q${CHAIN_C[0]},${CHAIN_C[1]} ${CHAIN_P1[0]},${CHAIN_P1[1]}`
  const out: Shape[] = [{ d: chain, stroke: sp.chain, lw: 1.1, cap: 'round' }]

  if (sp.style === 'pearl') {
    for (let i = 0; i <= 8; i++) {
      const [x, y] = qpt(CHAIN_P0, CHAIN_C, CHAIN_P1, i / 8)
      out.push({ d: circlePath(x, y, 1.8), fill: sp.gem })
      out.push({ d: circlePath(x, y, 1.8), stroke: 'rgba(160,160,190,.6)', lw: 0.4 })
      out.push({ d: circlePath(x - 0.5, y - 0.6, 0.6), fill: 'rgba(255,255,255,.9)' })
    }
    return out
  }

  const px = 100
  const py = 116
  switch (sp.style) {
    case 'heart':
      out.push({ d: heartPath(px, py, 3.8), fill: sp.gem })
      break
    case 'star':
      out.push({ d: starPath(px, py, 4.6, 2), fill: sp.gem })
      break
    case 'shell':
      out.push(
        { d: `M${px - 5},${py + 3}Q${px},${py - 6} ${px + 5},${py + 3}Z`, fill: sp.gem },
        { d: `M${px},${py + 3}L${px},${py - 4}`, stroke: 'rgba(255,255,255,.7)', lw: 0.8 },
      )
      break
    case 'snow':
      out.push({
        d: mergePaths(
          `M${px - 4.6},${py}L${px + 4.6},${py}`,
          `M${px},${py - 4.6}L${px},${py + 4.6}`,
          `M${px - 3.3},${py - 3.3}L${px + 3.3},${py + 3.3}`,
          `M${px - 3.3},${py + 3.3}L${px + 3.3},${py - 3.3}`,
        ),
        stroke: sp.gem,
        lw: 1.3,
        cap: 'round',
      })
      break
  }
  out.push({ d: circlePath(px - 1.2, py - 1.2, 0.9), fill: 'rgba(255,255,255,.85)' })
  return out
}

// ── 장갑 ───────────────────────────────────────────────────────

export type GloveSpec = { long: boolean; main: string; trim: string }

export function buildGloves(sp: GloveSpec): Shape[] {
  const t0 = sp.long ? 0.5 : 0.8
  const hand = (x: number, y: number): string => ellipsePath(x, y + 1, 5, 7.4)
  const cuff = (dir: 1 | -1): string => {
    const s = dir === 1 ? A.armL : A.armR
    const e = dir === 1 ? A.elbowL : A.elbowR
    const h = dir === 1 ? A.handL : A.handR
    const [x, y] = qpt([s.x, s.y], [e.x, e.y], [h.x, h.y - 4], t0)
    return ellipsePath(x, y, 6, 2.6)
  }
  return [
    { d: mergePaths(armFrom(1, t0), armFrom(-1, t0)), stroke: sp.main, lw: 9.4, cap: 'round' },
    { d: mergePaths(hand(A.handL.x, A.handL.y), hand(A.handR.x, A.handR.y)), fill: sp.main },
    { d: mergePaths(armFrom(1, t0), armFrom(-1, t0)), stroke: 'rgba(0,0,0,.08)', lw: 3, cap: 'round' },
    { d: mergePaths(cuff(1), cuff(-1)), fill: sp.trim },
  ]
}

// ── 망토 ───────────────────────────────────────────────────────

export type CapeSpec = { main: string; dark: string; lining: string; clasp: string }

export function buildCape(sp: CapeSpec): { back: Shape[]; front: Shape[] } {
  // 드레스보다 넓어야 한다. 좁게 만들었더니 볼 가운 뒤에 완전히 숨어서
  // 망토를 입었는지 알 수가 없었다.
  const cloth = skirtPath(100, 106, 64, 416, 198, 8, 7, 0.78)
  return {
    back: [
      { d: cloth, fill: vshade(106, 416, sp.main, sp.dark) },
      { d: skirtPath(100, 110, 50, 408, 150, 6, 5, 0.76), fill: sp.lining, alpha: 0.45 },
      { d: cloth, stroke: sp.dark, lw: 1, alpha: 0.6 },
    ],
    front: [
      { d: `M76,108Q100,124 124,108`, stroke: sp.main, lw: 4.4, cap: 'round' },
      { d: circlePath(80, 111, 3), fill: sp.clasp },
      { d: circlePath(120, 111, 3), fill: sp.clasp },
      { d: circlePath(79.2, 110.2, 1), fill: 'rgba(255,255,255,.85)' },
    ],
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

// ── 귀걸이 ─────────────────────────────────────────────────────

export type EarringStyle = 'pearl' | 'star' | 'heart' | 'drop'

export type EarringSpec = { style: EarringStyle; metal: string; gem: string }

export function buildEarrings(sp: EarringSpec): Shape[] {
  const one = (x: number): Shape[] => {
    const y = A.earL.y
    const top: Shape = { d: circlePath(x, y + 1, 1.2), fill: sp.metal }
    switch (sp.style) {
      case 'pearl':
        return [
          top,
          { d: circlePath(x, y + 5, 2.6), fill: sp.gem },
          { d: circlePath(x, y + 5, 2.6), stroke: 'rgba(160,160,190,.6)', lw: 0.4 },
          { d: circlePath(x - 0.8, y + 4.2, 0.9), fill: 'rgba(255,255,255,.85)' },
        ]
      case 'star':
        return [top, { d: starPath(x, y + 6, 3.6, 1.5), fill: sp.gem }]
      case 'heart':
        return [top, { d: heartPath(x, y + 5, 3), fill: sp.gem }]
      case 'drop':
        return [
          top,
          { d: `M${x},${y + 2}L${x},${y + 4}`, stroke: sp.metal, lw: 1 },
          { d: dropPath(x, y + 8, 5, 7.5), fill: sp.gem },
          { d: circlePath(x - 1, y + 6.4, 0.9), fill: 'rgba(255,255,255,.8)' },
        ]
    }
  }
  return [...one(A.earL.x), ...one(A.earR.x)]
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
