/**
 * 리아 인형의 몸·얼굴·기본 옷.
 *
 * 사진 속 리아를 치비 비율(머리 크게)로 옮겼다. 기본값은 사진 그대로다:
 *   - 진한 밤색 단발, 옆으로 흐르는 앞머리, 왼쪽 관자놀이에 꽃 머리핀
 *   - 흰 반팔 티(보라 왕관 프린트) + 라벤더 치마
 *
 * **기본 옷은 벗겨지지 않는다.** 요구사항이기도 하고, 아이가 옷을 다 벗기고
 * 당황하는 화면을 만들지 않기 위해서다. 드레스·망토는 이 위에 얹힌다.
 *
 * 팔은 몸과 따로 낸다(`armShapes`). 팔을 몸에 붙여 한 번에 그리면 드레스
 * 치마가 팔뚝을 덮어 손이 사라진다 — 처음에 그렇게 만들었다가 고쳤다.
 * 그래서 순서가 [몸 → 옷 → 팔 → 소매 → 장갑] 이다.
 *
 * 좌표계: 200 x 340 상자. 발끝이 y=300 근처, 아래는 그림자·여백이다.
 */
import {
  arcPath,
  circlePath,
  ellipsePath,
  flowerPath,
  linear,
  mergePaths,
  polyPath,
  rrectPath,
  skirtPath,
  starPath,
  vshade,
  type Shape,
} from '../engine/shapes'

export const DOLL_W = 200
export const DOLL_H = 340

/** 옷을 만들 때 기준으로 삼는 자리들 */
export const A = {
  headCx: 100,
  headCy: 76,
  headRx: 42,
  headRy: 45,
  /** 턱 끝 */
  chinY: 121,
  /** 옷깃이 닿는 높이 */
  collarY: 128,
  shoulderY: 140,
  shoulderW: 64,
  waistY: 190,
  waistW: 54,
  hipY: 198,
  hipW: 60,
  kneeY: 244,
  ankleY: 284,
  footY: 300,
  /** 어깨 관절 */
  armL: { x: 72, y: 146 },
  armR: { x: 128, y: 146 },
  /** 손 (치마 옆으로 나와야 한다) */
  handL: { x: 57, y: 208 },
  handR: { x: 143, y: 208 },
  eyeY: 86,
  eyeLx: 85,
  eyeRx: 115,
} as const

export const SKIN = {
  base: '#ffe0cb',
  shade: '#f6cdb2',
  line: '#d8a184',
  blush: '#f79a9a',
} as const

export const HAIR = {
  base: '#2b1d18',
  dark: '#1a100d',
  shine: '#5d4038',
} as const

/** 사진의 라벤더 치마 · 흰 티 */
export const BASE_WEAR = {
  tee: '#fdfaf6',
  teeShade: '#e6dcd8',
  trim: '#cbb6e4',
  skirt: '#d8c9ec',
  skirtShade: '#b39dd4',
  shoe: '#f2b4c4',
  shoeDark: '#d98ea3',
  sock: '#ffffff',
} as const

// ── 몸 ─────────────────────────────────────────────────────────

const LEG_L = `M90,${A.hipY}Q87,${A.kneeY} 88,${A.ankleY}`
const LEG_R = `M110,${A.hipY}Q113,${A.kneeY} 112,${A.ankleY}`

/** 다리·몸통·목·머리. 팔은 빠져 있다 */
export function bodyShapes(): Shape[] {
  return [
    // 발밑 그림자 — 바닥에 붙어 있게 만든다
    { d: ellipsePath(100, 306, 44, 8), fill: 'rgba(70,35,80,.16)' },

    // 다리
    { d: mergePaths(LEG_L, LEG_R), stroke: SKIN.base, lw: 18, cap: 'round' },
    { d: LEG_R, stroke: 'rgba(214,150,120,.16)', lw: 18, cap: 'round' },

    // 몸통 — 어깨에서 허리로 살짝 좁아진다
    {
      d:
        `M70,${A.shoulderY - 6}Q70,${A.collarY} 82,${A.collarY}` +
        `L118,${A.collarY}Q130,${A.collarY} 130,${A.shoulderY - 6}` +
        `L127,${A.waistY + 6}L73,${A.waistY + 6}Z`,
      fill: SKIN.base,
    },

    // 목
    { d: rrectPath(91, A.chinY - 8, 18, 20, 8), fill: SKIN.shade },

    // 귀 — 머리 옆선에 살짝 걸치게
    { d: ellipsePath(60, 88, 6.5, 9), fill: SKIN.base },
    { d: ellipsePath(140, 88, 6.5, 9), fill: SKIN.base },
    { d: ellipsePath(60, 88, 2.8, 4.2), fill: 'rgba(216,161,132,.45)' },
    { d: ellipsePath(140, 88, 2.8, 4.2), fill: 'rgba(216,161,132,.45)' },

    // 머리 — 둥근 얼굴
    {
      d: ellipsePath(A.headCx, A.headCy, A.headRx, A.headRy),
      fill: linear(58, 30, 142, 122, [
        [0, '#ffe7d6'],
        [1, '#fbd2b8'],
      ]),
    },
  ]
}

/** 팔과 손. 옷보다 앞에 그린다 */
export function armShapes(): Shape[] {
  const armL = `M${A.armL.x},${A.armL.y}Q${A.armL.x - 12},182 ${A.handL.x},${A.handL.y - 6}`
  const armR = `M${A.armR.x},${A.armR.y}Q${A.armR.x + 12},182 ${A.handR.x},${A.handR.y - 6}`
  return [
    { d: mergePaths(armL, armR), stroke: SKIN.base, lw: 13, cap: 'round' },
    { d: circlePath(A.handL.x, A.handL.y, 8), fill: SKIN.base },
    { d: circlePath(A.handR.x, A.handR.y, 8), fill: SKIN.base },
  ]
}

// ── 얼굴 ───────────────────────────────────────────────────────

export type Expression = 'smile' | 'happy' | 'wink' | 'surprise' | 'sparkle'

/** 눈 한 쪽. open=false 면 감은 눈(^) */
function eye(cx: number, open: boolean, look = 0): Shape[] {
  if (!open) {
    return [
      {
        d: arcPath(cx - 9, A.eyeY + 3, cx + 9, A.eyeY + 3, -11),
        stroke: '#2a1a14',
        lw: 3,
        cap: 'round',
      },
    ]
  }
  const ix = cx + look
  return [
    { d: ellipsePath(cx, A.eyeY, 9.5, 11), fill: '#ffffff' },
    // 홍채 — 사진처럼 아주 진한 갈색
    { d: ellipsePath(ix, A.eyeY + 0.5, 7.6, 9), fill: '#4a2a1c' },
    { d: ellipsePath(ix, A.eyeY + 1.5, 5.4, 6.6), fill: '#1d0f0a' },
    { d: circlePath(ix - 2.6, A.eyeY - 3.6, 2.9), fill: '#ffffff' },
    { d: circlePath(ix + 3, A.eyeY + 3.4, 1.5), fill: 'rgba(255,255,255,.75)' },
    // 윗 속눈썹 — 두껍게 그어야 눈이 또렷해진다
    {
      d: arcPath(cx - 10.5, A.eyeY - 6, cx + 10.5, A.eyeY - 6, -6),
      stroke: '#20120d',
      lw: 3.2,
      cap: 'round',
    },
    {
      d: arcPath(cx + 8.5, A.eyeY - 7, cx + 13.5, A.eyeY - 10, 1),
      stroke: '#20120d',
      lw: 2,
      cap: 'round',
    },
  ]
}

/**
 * 눈썹.
 *
 * 가늘고 높게. 두껍고 눈에 붙으면 어린아이가 아니라 화난 어른이 된다.
 */
function brow(cx: number): Shape {
  // 양쪽 끝 높이를 같게 둔다. 한쪽만 올리면 두 눈썹이 나란히 기울어
  // 비웃는 표정이 된다 (좌우를 뒤집지 않고 같은 함수를 쓰기 때문이다).
  return {
    d: arcPath(cx - 8, A.eyeY - 22, cx + 8, A.eyeY - 22, -6),
    stroke: '#5a3d2e',
    lw: 2.1,
    cap: 'round',
  }
}

function mouth(kind: Expression): Shape[] {
  if (kind === 'surprise') {
    return [
      { d: ellipsePath(100, 110, 6.5, 8), fill: '#bd4a60' },
      { d: ellipsePath(100, 113, 4, 3.6), fill: '#ee8296' },
    ]
  }
  if (kind === 'happy' || kind === 'sparkle') {
    return [
      { d: `M88,105Q100,103 112,105Q106,120 100,120Q94,120 88,105Z`, fill: '#c0455c' },
      { d: `M92,107Q100,106 108,107Q104,110.5 100,110.5Q96,110.5 92,107Z`, fill: '#ffffff' },
      { d: `M94,116Q100,119 106,116Q100,121 94,116Z`, fill: '#f08ba0' },
    ]
  }
  return [
    { d: arcPath(93, 107, 107, 107, 7), stroke: '#c25366', lw: 3, cap: 'round' },
    { d: arcPath(96, 110.5, 104, 110.5, 3), stroke: 'rgba(240,140,160,.8)', lw: 2, cap: 'round' },
  ]
}

export function faceShapes(expr: Expression = 'smile'): Shape[] {
  const wink = expr === 'wink'
  const closed = expr === 'happy'
  const look = expr === 'sparkle' ? 1 : 0

  const out: Shape[] = [
    { d: ellipsePath(72, 100, 10, 6), fill: SKIN.blush, alpha: 0.34 },
    { d: ellipsePath(128, 100, 10, 6), fill: SKIN.blush, alpha: 0.34 },

    brow(A.eyeLx),
    brow(A.eyeRx),

    ...eye(A.eyeLx, !closed, look),
    ...eye(A.eyeRx, !closed && !wink, look),

    // 코 — 사진처럼 아주 작은 점
    { d: ellipsePath(100, 99, 2.3, 1.7), fill: 'rgba(208,146,116,.7)' },

    ...mouth(expr),
  ]

  if (expr === 'sparkle') {
    out.push(
      { d: starPath(58, 56, 5, 2, 4), fill: '#ffe37a' },
      { d: starPath(147, 64, 4, 1.6, 4), fill: '#ffe37a' },
    )
  }
  return out
}

// ── 기본 머리 (머리 아이템이 없을 때) ─────────────────────────────

/** 머리 뒤쪽 — 몸보다 뒤에 그린다 */
export function baseHairBack(): Shape[] {
  return [
    {
      d: ellipsePath(100, 84, 48, 60),
      fill: vshade(24, 146, HAIR.base, HAIR.dark),
    },
  ]
}

/**
 * 정수리·앞머리·옆머리 — 얼굴보다 앞에 그린다.
 *
 * 사진의 옆가르마다. 왼쪽(보는 사람 기준)에서 오른쪽으로 흘러내리고,
 * 오른쪽 이마가 조금 드러난다. 이 비대칭이 리아처럼 보이게 하는 핵심이다.
 * 옆머리를 여기서 그리는 이유는 귀를 덮어야 하기 때문이다 —
 * 뒷머리에 넣으면 살색 귀가 머리카락 위에 동동 뜬다.
 */
export function baseHairFront(): Shape[] {
  return [
    // 옆머리 두 갈래 (귀를 덮는다). 끝을 좁혀야 헬멧처럼 보이지 않는다
    {
      d: mergePaths(
        `M52,70L70,70L68,150Q61,166 54,150Z`,
        `M148,70L130,70L132,150Q139,166 146,150Z`,
      ),
      fill: vshade(70, 168, HAIR.base, HAIR.dark),
    },
    // 정수리 + 앞머리
    {
      d:
        `M55,90C51,44 76,25 101,25C131,25 149,46 146,92` +
        `C142,66 131,55 117,53` +
        `C110,70 93,77 74,74` +
        `C64,72 58,80 55,90Z`,
      fill: vshade(25, 94, '#3b2820', HAIR.base),
    },
    // 앞으로 흘러내린 잔머리 한 줄기
    { d: `M60,74C57,92 60,106 67,118C60,108 54,96 55,82Z`, fill: HAIR.dark },
    // 윤기
    { d: arcPath(74, 45, 112, 38, -7), stroke: HAIR.shine, lw: 5, cap: 'round', alpha: 0.5 },
    ...hairClip(),
  ]
}

/** 사진에 늘 붙어 있는 꽃 머리핀 */
export function hairClip(): Shape[] {
  return [
    { d: flowerPath(64, 55, 9, 5), fill: '#ffd75e' },
    { d: circlePath(64, 55, 3.6), fill: '#9b6ad1' },
    { d: circlePath(62.6, 53.6, 1.3), fill: 'rgba(255,255,255,.8)' },
  ]
}

// ── 기본 옷 (항상 입고 있다) ────────────────────────────────────

/** 라벤더 치마 + 흰 티 몸통. 소매는 팔 뒤에 그려야 해서 따로 낸다 */
export function baseOutfitShapes(): Shape[] {
  const skirt = skirtPath(100, A.waistY - 6, 58, 252, 100, 5, 5)
  return [
    { d: skirt, fill: vshade(A.waistY, 254, BASE_WEAR.skirt, BASE_WEAR.skirtShade) },
    { d: skirt, stroke: 'rgba(140,115,180,.5)', lw: 1.2 },

    // 티 — 어깨선까지 한 조각으로. 두 조각으로 나누면 이음선이 보인다
    {
      d:
        `M69,${A.shoulderY + 2}Q69,${A.collarY - 4} 84,${A.collarY - 6}` +
        `L116,${A.collarY - 6}Q131,${A.collarY - 4} 131,${A.shoulderY + 2}` +
        `L129,${A.waistY + 8}Q100,${A.waistY + 14} 71,${A.waistY + 8}Z`,
      fill: vshade(A.collarY, A.waistY + 8, BASE_WEAR.tee, BASE_WEAR.teeShade),
    },

    // 목단
    {
      d: `M87,${A.collarY - 5}Q100,${A.collarY + 7} 113,${A.collarY - 5}`,
      stroke: BASE_WEAR.trim,
      lw: 3.4,
      cap: 'round',
    },

    // 티셔츠 프린트 — 사진의 보라 왕관
    { d: polyPath([90, 172, 94, 164, 100, 170, 106, 164, 110, 172]), fill: '#f0c04a' },
    { d: rrectPath(89, 172, 22, 4, 2), fill: '#f0c04a' },
    { d: circlePath(94, 163, 2), fill: '#7b4fb5' },
    { d: circlePath(106, 163, 2), fill: '#7b4fb5' },
    { d: arcPath(86, 182, 114, 182, 5), stroke: '#7b4fb5', lw: 2.4, cap: 'round' },
    { d: starPath(83, 167, 3, 1.2, 4), fill: '#7b4fb5' },
    { d: starPath(117, 176, 3, 1.2, 4), fill: '#7b4fb5' },
  ]
}

/** 기본 티의 반팔 소매. 팔보다 앞에 그린다 */
export function baseSleeveShapes(): Shape[] {
  return [
    { d: rrectPath(60, A.shoulderY - 8, 20, 34, 10), fill: BASE_WEAR.tee },
    { d: rrectPath(120, A.shoulderY - 8, 20, 34, 10), fill: BASE_WEAR.tee },
    { d: rrectPath(60, A.shoulderY + 20, 20, 6, 3), fill: BASE_WEAR.trim },
    { d: rrectPath(120, A.shoulderY + 20, 20, 6, 3), fill: BASE_WEAR.trim },
  ]
}

/** 기본 신발 — 분홍 샌들과 흰 양말 */
export function baseShoeShapes(): Shape[] {
  return [
    { d: rrectPath(81, 268, 15, 16, 6), fill: BASE_WEAR.sock },
    { d: rrectPath(104, 268, 15, 16, 6), fill: BASE_WEAR.sock },
    // 앞코가 둥근 샌들
    { d: `M78,284Q78,278 88,278Q100,278 100,290L100,296Q100,300 96,300L82,300Q78,300 78,296Z`, fill: BASE_WEAR.shoe },
    { d: `M122,284Q122,278 112,278Q100,278 100,290L100,296Q100,300 104,300L118,300Q122,300 122,296Z`, fill: BASE_WEAR.shoe },
    { d: rrectPath(78, 295, 22, 5, 2.5), fill: BASE_WEAR.shoeDark },
    { d: rrectPath(100, 295, 22, 5, 2.5), fill: BASE_WEAR.shoeDark },
  ]
}
