/**
 * 리아 아바타의 몸·얼굴·기본 옷.
 *
 * 참고작(docs/DESIGN.md)처럼 **키 큰 패션 아바타**다 — 머리 하나가 키의
 * 1/8 쯤이다. 예전 치비 인형(머리가 키의 1/3)에서 바꾸면서 좌표계를 새로
 * 잡았다. 옷 생성기(builders.ts)는 전부 아래 `A` 자리표를 기준으로 한다.
 *
 * **기본 옷은 벗겨지지 않는다.** 아이가 옷을 다 벗기고 당황하는 화면을
 * 만들지 않기 위해서다. 드레스·망토는 이 위에 얹힌다.
 *
 * 팔은 몸과 따로 낸다(`armShapes`). 팔을 몸에 붙여 한 번에 그리면 드레스
 * 치마가 팔뚝을 덮어 손이 사라진다. 그래서 순서가
 * [몸 → 옷 → 팔 → 소매 → 장갑] 이다.
 *
 * 좌표계: 200 x 440 상자. 머리카락 꼭대기 y≈28, 발끝 y≈416.
 */
import {
  arcPath,
  circlePath,
  ellipsePath,
  flowerPath,
  linear,
  mergePaths,
  polyPath,
  radial,
  rrectPath,
  skirtPath,
  starPath,
  vshade,
  type Shape,
} from '../engine/shapes'

export const DOLL_W = 200
export const DOLL_H = 440

/** 옷을 만들 때 기준으로 삼는 자리들 */
export const A = {
  headCx: 100,
  headCy: 64,
  headRx: 21,
  headRy: 26,
  /** 머리카락 꼭대기 */
  hairTop: 28,
  /** 턱 끝 */
  chinY: 91,
  /** 옷깃이 닿는 높이 (목 밑) */
  collarY: 104,
  shoulderY: 112,
  /** 어깨 끝 x (왼쪽). 오른쪽은 200 - x */
  shoulderX: 72,
  bustY: 140,
  waistY: 172,
  /** 허리 왼쪽 끝 x */
  waistX: 86,
  hipY: 202,
  hipX: 76,
  kneeY: 300,
  ankleY: 392,
  footY: 416,
  /** 어깨 관절 */
  armL: { x: 76, y: 114 },
  armR: { x: 124, y: 114 },
  /** 팔꿈치 곡선의 조절점 */
  elbowL: { x: 63, y: 170 },
  elbowR: { x: 137, y: 170 },
  /** 손 — 치마 옆, 엉덩이 높이 */
  handL: { x: 70, y: 226 },
  handR: { x: 130, y: 226 },
  eyeY: 66,
  eyeLx: 91,
  eyeRx: 109,
  /** 귓불 — 귀걸이가 매달린다 */
  earL: { x: 79, y: 70 },
  earR: { x: 121, y: 70 },
} as const

export const SKIN = {
  base: '#ffe1d0',
  shade: '#f3c6ae',
  line: '#d69a80',
  blush: '#f59aa2',
} as const

export const HAIR = {
  base: '#4a2e24',
  dark: '#2c1913',
  shine: '#8a5a48',
} as const

/** 기본 옷 — 흰 크롭 티 + 라벤더 플리츠 치마 */
export const BASE_WEAR = {
  tee: '#fdfaf6',
  teeShade: '#e6dcd8',
  trim: '#cbb6e4',
  skirt: '#d8c9ec',
  skirtShade: '#a993cf',
  shoe: '#f2b4c4',
  shoeDark: '#d98ea3',
} as const

// ── 몸 ─────────────────────────────────────────────────────────

/** 다리 한 짝. 허벅지에서 발목으로 가늘어진다 */
function leg(dir: 1 | -1): string {
  const x = (v: number): number => (dir === 1 ? v : 200 - v)
  return (
    `M${x(77)},196` +
    `C${x(75)},240 ${x(83)},282 ${x(87)},302` +
    `C${x(88)},336 ${x(89)},366 ${x(91)},394` +
    `L${x(97)},394` +
    `C${x(97)},366 ${x(98)},334 ${x(98)},302` +
    `C${x(99)},270 ${x(100)},236 ${x(100)},204Z`
  )
}

/** 몸통 — 어깨에서 허리로 좁아졌다가 엉덩이로 벌어진다 */
const TORSO =
  `M93,100L107,100Q110,107 121,109Q129,111 128,122` +
  `C127,146 117,156 114,172C117,186 124,194 125,206` +
  `L75,206C76,194 83,186 86,172C83,156 73,146 72,122Q71,111 79,109Q90,107 93,100Z`

/** 얼굴 윤곽 — 둥근 이마, 살짝 뾰족한 턱 */
export const FACE_PATH = `M79,60C78,39 122,39 121,60C121,76 113,88 100,92C87,88 79,76 79,60Z`

/** 다리·몸통·목·머리. 팔은 빠져 있다 */
export function bodyShapes(): Shape[] {
  return [
    // 발밑 그림자 — 바닥에 붙어 있게 만든다
    { d: ellipsePath(100, 418, 40, 6), fill: 'rgba(70,35,80,.18)' },

    // 다리 — 안쪽에 그늘을 넣어 둥글게 보이게
    {
      d: mergePaths(leg(1), leg(-1)),
      fill: linear(76, 0, 124, 0, [
        [0, SKIN.shade],
        [0.25, SKIN.base],
        [0.5, SKIN.shade],
        [0.75, SKIN.base],
        [1, SKIN.shade],
      ]),
    },

    // 몸통
    {
      d: TORSO,
      fill: linear(72, 0, 128, 0, [
        [0, SKIN.shade],
        [0.3, SKIN.base],
        [0.7, SKIN.base],
        [1, SKIN.shade],
      ]),
    },
    // 쇄골
    { d: arcPath(86, 109, 96, 110, 2), stroke: 'rgba(214,154,128,.45)', lw: 0.9, cap: 'round' },
    { d: arcPath(104, 110, 114, 109, 2), stroke: 'rgba(214,154,128,.45)', lw: 0.9, cap: 'round' },

    // 목 — 턱 밑 그늘
    { d: rrectPath(94, 82, 12, 24, 5), fill: SKIN.base },
    { d: `M94,86Q100,94 106,86L106,92Q100,97 94,92Z`, fill: SKIN.shade },

    // 귀
    { d: ellipsePath(79.5, 66, 3, 5.4), fill: SKIN.base },
    { d: ellipsePath(120.5, 66, 3, 5.4), fill: SKIN.base },

    // 얼굴
    {
      d: FACE_PATH,
      fill: radial(96, 58, 4, 34, [
        [0, '#fff0e6'],
        [0.7, SKIN.base],
        [1, '#f8d2bf'],
      ]),
    },
  ]
}

/** 팔 한 쪽의 중심선 */
function armPath(dir: 1 | -1): string {
  const s = dir === 1 ? A.armL : A.armR
  const e = dir === 1 ? A.elbowL : A.elbowR
  const h = dir === 1 ? A.handL : A.handR
  return `M${s.x},${s.y}Q${e.x},${e.y} ${h.x},${h.y - 4}`
}

export const ARM_L = armPath(1)
export const ARM_R = armPath(-1)

/** 팔과 손. 옷보다 앞에 그린다 */
export function armShapes(): Shape[] {
  const hand = (x: number, y: number, dir: number): string =>
    `M${x - 4},${y - 6}Q${x - 5},${y + 4} ${x - dir},${y + 8}Q${x + 5},${y + 6} ${x + 4},${y - 6}Z`
  return [
    { d: mergePaths(ARM_L, ARM_R), stroke: SKIN.base, lw: 8.5, cap: 'round' },
    { d: mergePaths(ARM_L, ARM_R), stroke: 'rgba(214,154,128,.18)', lw: 3, cap: 'round' },
    { d: mergePaths(hand(A.handL.x, A.handL.y, 1), hand(A.handR.x, A.handR.y, -1)), fill: SKIN.base },
  ]
}

// ── 얼굴 ───────────────────────────────────────────────────────

export type Expression = 'smile' | 'happy' | 'wink' | 'surprise' | 'sparkle'

/** 눈 한 쪽. dir 은 눈꼬리 방향(왼눈 -1, 오른눈 +1). open=false 면 감은 눈 */
function eye(cx: number, dir: -1 | 1, open: boolean, look = 0): Shape[] {
  const y = A.eyeY
  const o = cx + dir * 6.5 // 눈꼬리
  const i = cx - dir * 6 // 눈머리
  if (!open) {
    return [
      { d: `M${i},${y}Q${cx},${y - 4.5} ${o},${y - 0.5}`, stroke: '#2a1a20', lw: 1.6, cap: 'round' },
      { d: `M${o},${y - 0.5}L${o + dir * 2},${y - 2.2}`, stroke: '#2a1a20', lw: 1.2, cap: 'round' },
    ]
  }
  const ix = cx + look
  return [
    // 아이섀도 — 눈 위에 은은하게
    { d: ellipsePath(cx + dir * 0.6, y - 3, 7.6, 3.6), fill: 'rgba(214,140,170,.22)' },
    // 흰자 — 아몬드꼴
    { d: `M${i},${y + 0.5}Q${cx},${y - 6} ${o},${y - 0.8}Q${cx},${y + 4.6} ${i},${y + 0.5}Z`, fill: '#ffffff' },
    // 홍채 — 참고작처럼 맑은 청회색
    {
      d: circlePath(ix, y, 3.5),
      fill: radial(ix, y + 1, 0.5, 3.5, [
        [0, '#9cc0e6'],
        [1, '#3f5f8f'],
      ]),
    },
    { d: circlePath(ix, y, 1.6), fill: '#1b2232' },
    { d: circlePath(ix - 1.1, y - 1.3, 1), fill: '#ffffff' },
    { d: circlePath(ix + 1.2, y + 1.2, 0.5), fill: 'rgba(255,255,255,.8)' },
    // 윗 속눈썹 라인 + 눈꼬리 속눈썹
    {
      d: `M${i - dir * 0.4},${y + 0.2}Q${cx},${y - 6.6} ${o + dir * 0.4},${y - 1}`,
      stroke: '#22141a',
      lw: 1.7,
      cap: 'round',
    },
    { d: `M${o},${y - 1.2}L${o + dir * 2.4},${y - 3.4}`, stroke: '#22141a', lw: 1.1, cap: 'round' },
    { d: `M${o - dir * 1.6},${y - 2.6}L${o + dir * 0.6},${y - 5}`, stroke: '#22141a', lw: 0.9, cap: 'round' },
    // 아래 라인
    { d: `M${i + dir * 1.5},${y + 2}Q${cx},${y + 4.2} ${o - dir * 0.5},${y + 0.6}`, stroke: 'rgba(120,70,80,.35)', lw: 0.7 },
  ]
}

/** 눈썹 — 가늘고 부드러운 아치. 좌우 높이를 같게 둔다 */
function brow(cx: number, dir: -1 | 1): Shape {
  return {
    d: `M${cx - dir * 6},${A.eyeY - 7}Q${cx + dir * 1},${A.eyeY - 10.6} ${cx + dir * 7.4},${A.eyeY - 7.6}`,
    stroke: '#7a5444',
    lw: 1.3,
    cap: 'round',
  }
}

function mouth(kind: Expression): Shape[] {
  if (kind === 'surprise') {
    return [
      { d: ellipsePath(100, 83, 2.6, 3.2), fill: '#b8435a' },
      { d: ellipsePath(100, 84.4, 1.6, 1.2), fill: '#ee8296' },
    ]
  }
  if (kind === 'happy' || kind === 'sparkle') {
    return [
      { d: `M94,81Q100,79.6 106,81Q100,89 94,81Z`, fill: '#b8435a' },
      { d: `M95.6,81.3Q100,80.4 104.4,81.3Q100,83.2 95.6,81.3Z`, fill: '#ffffff' },
      { d: `M97,85.6Q100,87 103,85.6Q100,87.6 97,85.6Z`, fill: '#f08ba0' },
    ]
  }
  // 다문 입술 — 윗입술은 하트 꼴, 아랫입술은 도톰하게
  return [
    { d: `M95,81.6Q97.5,79.8 100,80.8Q102.5,79.8 105,81.6Q100,83 95,81.6Z`, fill: '#d55e70' },
    { d: `M95.4,81.9Q100,87 104.6,81.9Q100,83.3 95.4,81.9Z`, fill: '#e98393' },
    { d: ellipsePath(101.4, 83.6, 1.3, 0.6), fill: 'rgba(255,255,255,.55)' },
  ]
}

export function faceShapes(expr: Expression = 'smile'): Shape[] {
  const wink = expr === 'wink'
  const closed = expr === 'happy'
  const look = expr === 'sparkle' ? 0.6 : 0

  const out: Shape[] = [
    { d: ellipsePath(87, 75, 5, 2.6), fill: SKIN.blush, alpha: 0.32 },
    { d: ellipsePath(113, 75, 5, 2.6), fill: SKIN.blush, alpha: 0.32 },

    brow(A.eyeLx, -1),
    brow(A.eyeRx, 1),

    ...eye(A.eyeLx, -1, !closed, look),
    ...eye(A.eyeRx, 1, !closed && !wink, look),

    // 코 — 콧날 그늘과 코끝
    { d: `M99.4,70Q98.6,75 99,77`, stroke: 'rgba(214,154,128,.45)', lw: 0.8, cap: 'round' },
    { d: `M98.2,77.6Q100,78.8 101.8,77.6`, stroke: 'rgba(196,120,100,.7)', lw: 0.9, cap: 'round' },

    ...mouth(expr),
  ]

  if (expr === 'sparkle') {
    out.push(
      { d: starPath(76, 46, 3.4, 1.3, 4), fill: '#ffe37a' },
      { d: starPath(125, 52, 2.8, 1.1, 4), fill: '#ffe37a' },
    )
  }
  return out
}

// ── 기본 머리 (머리 아이템이 없을 때) ─────────────────────────────

/** 머리 뒤쪽 — 몸보다 뒤에 그린다. 등까지 오는 긴 머리 */
export function baseHairBack(): Shape[] {
  return [
    { d: ellipsePath(100, 62, 25, 31), fill: vshade(28, 96, HAIR.base, HAIR.dark) },
    { d: skirtPath(100, 64, 52, 196, 66, 4, 5, 0.5), fill: vshade(64, 200, HAIR.base, HAIR.dark) },
  ]
}

/** 정수리·앞머리 — 얼굴보다 앞에 그린다. 옆가르마로 오른쪽으로 흐른다 */
export const HAIR_TOP =
  `M77,72C72,40 90,29 101,29C117,29 129,42 124,74` +
  `C121,58 114,49 106,47C100,57 89,60 81,60C79,63 78,67 77,72Z`

/** 얼굴을 감싸 어깨로 흐르는 옆머리 두 갈래 */
export const SIDE_LOCKS = mergePaths(
  `M78,58C71,86 75,110 70,134C77,126 82,104 82,74Z`,
  `M122,58C129,86 125,110 130,134C123,126 118,104 118,74Z`,
)

export function baseHairFront(): Shape[] {
  return [
    { d: SIDE_LOCKS, fill: vshade(58, 136, HAIR.base, HAIR.dark) },
    { d: HAIR_TOP, fill: vshade(29, 74, HAIR.shine, HAIR.base) },
    // 머리결 몇 줄
    { d: `M104,33Q116,40 121,62`, stroke: 'rgba(255,255,255,.14)', lw: 1.2, cap: 'round' },
    { d: `M96,34Q86,42 82,58`, stroke: 'rgba(255,255,255,.12)', lw: 1.2, cap: 'round' },
    { d: arcPath(88, 38, 110, 34, -4), stroke: HAIR.shine, lw: 2.6, cap: 'round', alpha: 0.6 },
    ...hairClip(),
  ]
}

/** 사진에 늘 붙어 있는 꽃 머리핀 */
export function hairClip(): Shape[] {
  return [
    { d: flowerPath(84, 44, 5.4, 5), fill: '#ffd75e' },
    { d: circlePath(84, 44, 2.1), fill: '#9b6ad1' },
    { d: circlePath(83.2, 43.2, 0.8), fill: 'rgba(255,255,255,.8)' },
  ]
}

// ── 기본 옷 (항상 입고 있다) ────────────────────────────────────

/** 라벤더 치마 + 흰 크롭 티. 소매는 팔 뒤에 그려야 해서 따로 낸다 */
export function baseOutfitShapes(): Shape[] {
  const skirt = skirtPath(100, A.waistY - 2, 34, 262, 92, 6, 3, 0.4)
  const out: Shape[] = [
    { d: skirt, fill: vshade(A.waistY, 262, BASE_WEAR.skirt, BASE_WEAR.skirtShade) },
    { d: skirt, stroke: 'rgba(140,115,180,.5)', lw: 0.9 },
  ]
  // 플리츠 주름
  for (let i = -2; i <= 2; i++) {
    out.push({
      d: `M${100 + i * 6},${A.waistY + 4}L${100 + i * 15},258`,
      stroke: 'rgba(120,95,170,.25)',
      lw: 0.9,
    })
  }
  out.push(
    // 티 — 어깨에서 허리까지 몸에 붙게
    {
      d:
        `M74,118Q75,110 86,108Q93,106 95,104Q100,109 105,104Q107,106 114,108Q125,110 126,118` +
        `C125,146 117,156 115,174L85,174C83,156 75,146 74,118Z`,
      fill: vshade(A.collarY, 176, BASE_WEAR.tee, BASE_WEAR.teeShade),
    },
    { d: `M95,104Q100,110 105,104`, stroke: BASE_WEAR.trim, lw: 1.8, cap: 'round' },
    { d: rrectPath(84, 169, 32, 6, 3), fill: BASE_WEAR.trim },
    // 티셔츠 프린트 — 작은 왕관
    { d: polyPath([94, 140, 96.5, 134, 100, 138, 103.5, 134, 106, 140]), fill: '#f0c04a' },
    { d: rrectPath(94, 140, 12, 2.4, 1.2), fill: '#f0c04a' },
    { d: circlePath(96.5, 133.4, 1.1), fill: '#7b4fb5' },
    { d: circlePath(103.5, 133.4, 1.1), fill: '#7b4fb5' },
    { d: starPath(90, 136, 1.8, 0.7, 4), fill: '#7b4fb5' },
    { d: starPath(110, 142, 1.8, 0.7, 4), fill: '#7b4fb5' },
  )
  return out
}

/** 기본 티의 반팔 소매. 팔보다 앞에 그린다 */
export function baseSleeveShapes(): Shape[] {
  // 어깨 관절을 덮고 팔뚝 위쪽까지 내려오는 짧은 소매
  const sleeve = (dir: 1 | -1): string => {
    const x = (v: number): number => (dir === 1 ? v : 200 - v)
    return `M${x(84)},107Q${x(70)},108 ${x(66)},120L${x(64)},132L${x(75)},134L${x(78)},122Q${x(80)},114 ${x(86)},112Z`
  }
  return [
    { d: mergePaths(sleeve(1), sleeve(-1)), fill: vshade(106, 134, BASE_WEAR.tee, BASE_WEAR.teeShade) },
    { d: `M64,132L75,134`, stroke: BASE_WEAR.trim, lw: 1.8, cap: 'round' },
    { d: `M136,132L125,134`, stroke: BASE_WEAR.trim, lw: 1.8, cap: 'round' },
  ]
}

/** 발 한 짝의 구두 꼴 (정면에서 본 뾰족한 구두). cx 는 발 가운데 */
export function shoePath(cx: number): string {
  return (
    `M${cx - 4.6},396Q${cx - 5},389 ${cx},389Q${cx + 5},389 ${cx + 4.6},396` +
    `L${cx + 3.4},411Q${cx},418 ${cx - 3.4},411Z`
  )
}

export const FOOT_LX = 94
export const FOOT_RX = 106

/** 기본 신발 — 분홍 플랫슈즈 */
export function baseShoeShapes(): Shape[] {
  return [
    { d: mergePaths(shoePath(FOOT_LX), shoePath(FOOT_RX)), fill: vshade(389, 416, BASE_WEAR.shoe, BASE_WEAR.shoeDark) },
    { d: mergePaths(arcPath(FOOT_LX - 4, 395, FOOT_LX + 4, 395, 2), arcPath(FOOT_RX - 4, 395, FOOT_RX + 4, 395, 2)), stroke: BASE_WEAR.shoeDark, lw: 1 },
  ]
}
