/**
 * 리아 인형의 몸·얼굴·기본 옷·기본 머리.
 *
 * 2~3등신 **치비 인형**이다 (MaelleMarylloup CHIBI 팩, docs/DOLL.md).
 * 8등신 패션 아바타를 써 봤지만 네 살 아이에게는 어른 몸이라 바꿨다.
 * 몸·얼굴·옷이 전부 같은 판에 그려진 일러스트 조각이라, 겹치기만 하면
 * 옷이 몸에 맞는다.
 *
 * **기본 옷은 벗겨지지 않는다.** 아이가 옷을 다 벗기고 당황하는 화면을
 * 만들지 않기 위해서다. 드레스를 고르면 그 위로 갈아입는다.
 *
 * 좌표계: 200 x 440 상자. 머리 꼭대기 y≈65, 발끝 y≈428.
 */
import { starPath, type Shape } from '../engine/shapes'
import { art, fromSrc, type ArtName } from './art'

export const DOLL_W = 200
export const DOLL_H = 440

const at = (sx: number, sy: number): { x: number; y: number } => {
  const [x, y] = fromSrc(sx, sy)
  return { x, y }
}

/** 소품을 맞출 때 기준으로 삼는 자리들 (원본 판에서 잰 값) */
export const A = {
  headCx: 100,
  /** 맨머리 꼭대기 */
  headTop: fromSrc(0, 135)[1],
  /** 머리카락 꼭대기 (기본 머리) */
  hairTop: fromSrc(0, 122)[1],
  /** 머리 좌우 끝 */
  headL: fromSrc(119, 0)[0],
  headR: fromSrc(331, 0)[0],
  eyeY: fromSrc(0, 305)[1],
  chinY: fromSrc(0, 358)[1],
  /** 목 밑 — 목걸이가 걸린다 */
  collar: at(224, 374),
  shoulderY: fromSrc(0, 390)[1],
  waistY: fromSrc(0, 440)[1],
  hipY: fromSrc(0, 470)[1],
  /** 손 — 왼손은 몸 옆으로 내렸고 오른손은 살짝 들었다 */
  handL: at(110, 515),
  handR: at(338, 478),
  kneeY: fromSrc(0, 560)[1],
  footY: fromSrc(0, 662)[1],
  /** 귓불. 얼굴이 살짝 돌아 있어 왼쪽 귀만 보인다 */
  earL: at(130, 318),
  earR: at(322, 318),
} as const

// ── 몸 ─────────────────────────────────────────────────────────

export function bodyShapes(): Shape[] {
  return [art('body')]
}

// ── 얼굴 ───────────────────────────────────────────────────────

export type Expression = 'smile' | 'happy' | 'wink' | 'surprise' | 'sparkle'

/**
 * 표정. 팩에 윙크 그림이 없어서 윙크는 웃는 얼굴로 갈음한다.
 * 감은 눈(happy)은 눈동자를 빼고 감은 속눈썹을 쓴다.
 */
export function faceShapes(expr: Expression = 'smile'): Shape[] {
  const closed = expr === 'happy' || expr === 'wink'
  const eyes: ArtName[] = closed ? ['lashes-closed'] : [expr === 'sparkle' ? 'eyes-star' : 'eyes', 'lashes']
  const mouth: ArtName = expr === 'surprise' ? 'mouth-o' : expr === 'smile' ? 'mouth-smile' : 'mouth-happy'
  const out: Shape[] = [...eyes.map((n) => art(n)), art('brows'), art(mouth)]
  if (expr !== 'smile') out.push(art('blush'))
  if (expr === 'sparkle') {
    out.push(
      { d: starPath(A.headL + 4, A.headTop + 6, 7, 2.6, 4), fill: '#ffe37a' },
      { d: starPath(A.headR - 2, A.headTop + 20, 5.6, 2.2, 4), fill: '#ffe37a' },
    )
  }
  return out
}

// ── 머리 ───────────────────────────────────────────────────────

/**
 * 머리 색 — 팩에 그려진 여덟 색. 0 번(짙은 갈색)이 원래 색이고
 * 나머지가 색 견본 1~7 이다. 머리는 색조를 돌리지 않고 팩의 색 그림을
 * 바꿔 끼운다 — 금발·백발처럼 밝기가 크게 다른 색이 자연스럽다.
 */
export const HAIR_SHADES = [
  { key: '', name: '갈색', css: '#5a3a2e' },
  { key: 'b', name: '주황', css: '#d9682f' },
  { key: 'c', name: '빨강', css: '#a8201f' },
  { key: 'd', name: '밤색', css: '#b8743f' },
  { key: 'e', name: '금발', css: '#f6d58a' },
  { key: 'f', name: '검정', css: '#2b2b33' },
  { key: 'g', name: '하양', css: '#f4f1ee' },
  { key: 'h', name: '회색', css: '#a0a0a0' },
] as const

export type HairStyle = { style: number; bangs?: number }

/** 팩 머리 한 벌: 뒷머리(몸 뒤) + 윗머리·앞머리(얼굴 앞) */
export function hairLayers(h: HairStyle, shade = 0): { back: Shape[]; front: Shape[] } {
  const c = HAIR_SHADES[shade]?.key ?? ''
  const front: Shape[] = [art(`hair${h.style}${c}` as ArtName)]
  if (h.bangs) front.push(art(`bangs${h.bangs}${c}` as ArtName))
  return { back: [art(`hair${h.style}-back${c}` as ArtName)], front }
}

/** 아무 머리도 고르지 않았을 때 — 등까지 오는 긴 생머리 */
export const BASE_HAIR: HairStyle = { style: 10, bangs: 2 }

export function baseHairBack(shade = 0): Shape[] {
  return hairLayers(BASE_HAIR, shade).back
}

export function baseHairFront(shade = 0): Shape[] {
  return hairLayers(BASE_HAIR, shade).front
}

// ── 기본 옷 (항상 입고 있다) ────────────────────────────────────

/** 흰 티 + 분홍 치마 */
export function baseOutfitShapes(): Shape[] {
  return [art('bottom2'), art('top1')]
}
