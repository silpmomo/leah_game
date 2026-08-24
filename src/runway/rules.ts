/**
 * 패션쇼 채점.
 *
 * 실패가 없다. 조건을 하나도 못 맞춰도 "다시 해보자" 로 끝나고, 맞춘 만큼
 * 별이 붙는다. 별은 덮어쓰지 않고 최고 기록만 남긴다 — 이미 별 셋을 받은
 * 미션을 다시 하다가 기록이 깎이면 아이가 억울해한다.
 */
import type { Resolve } from '../doll/outfit'
import { outfitColors, outfitItems, outfitThemes, wornCount, type Outfit } from '../doll/outfit'
import { itemById } from '../doll/wardrobe'
import { MISSIONS, type Mission, type Requirement } from './missions'

export type Progress = Record<string, number>

export function sanitizeProgress(v: unknown): Progress {
  const o = (v ?? {}) as Record<string, unknown>
  const out: Progress = {}
  for (const m of MISSIONS) {
    const n = Number(o[m.id])
    if (Number.isFinite(n) && n > 0) out[m.id] = Math.max(0, Math.min(3, Math.floor(n)))
  }
  return out
}

export function starsOf(p: Progress, id: string): number {
  return p[id] ?? 0
}

export function clearedCount(p: Progress): number {
  return MISSIONS.filter((m) => starsOf(p, m.id) > 0).length
}

export function threeStarCount(p: Progress): number {
  return MISSIONS.filter((m) => starsOf(p, m.id) >= 3).length
}

/** 조건 하나가 충족됐는가 */
export function meets(r: Requirement, outfit: Outfit, resolve: Resolve = itemById): boolean {
  switch (r.kind) {
    case 'item': {
      const item = resolve(r.id)
      return item ? outfit[item.cat] === r.id : false
    }
    case 'cat':
      return Boolean(outfit[r.cat])
    case 'color':
      return outfitColors(outfit, resolve).has(r.color)
    case 'theme':
      return outfitThemes(outfit, resolve).has(r.theme)
    case 'count':
      return wornCount(outfit) >= r.n
  }
}

export function metFlags(
  m: Mission,
  outfit: Outfit,
  resolve: Resolve = itemById,
): boolean[] {
  return m.reqs.map((r) => meets(r, outfit, resolve))
}

/**
 * 별 개수.
 *
 * 전부 맞으면 3, 절반 이상이면 2, 하나라도 맞으면 1, 아니면 0.
 * 조건이 하나뿐인 미션은 맞으면 바로 3 이다.
 */
export function scoreStars(met: readonly boolean[]): number {
  const total = met.length
  if (total === 0) return 3
  const hit = met.filter(Boolean).length
  if (hit >= total) return 3
  if (hit === 0) return 0
  return hit * 2 >= total ? 2 : 1
}

/** 최고 기록만 남긴다 */
export function record(p: Progress, id: string, stars: number): Progress {
  if (stars <= starsOf(p, id)) return p
  return { ...p, [id]: stars }
}

/**
 * 다음에 도전할 미션.
 *
 * 아직 안 깬 것 중 첫 번째. 전부 깼으면 별이 부족한 것, 그것도 없으면 0번.
 * 미션은 잠기지 않는다 — 잠금은 어린 아이에게 "못 하게 막힘" 으로만 읽힌다.
 */
export function suggestIndex(p: Progress): number {
  const fresh = MISSIONS.findIndex((m) => starsOf(p, m.id) === 0)
  if (fresh >= 0) return fresh
  const partial = MISSIONS.findIndex((m) => starsOf(p, m.id) < 3)
  return partial >= 0 ? partial : 0
}

/** 결과 화면에서 리아가 하는 말 */
export function praise(stars: number): { msg: string; emoji: string } {
  if (stars >= 3) return { msg: '완벽해! 최고의 공주야', emoji: '🏆' }
  if (stars === 2) return { msg: '멋져! 거의 다 맞았어', emoji: '🌟' }
  if (stars === 1) return { msg: '좋아! 하나 더 찾아볼까?', emoji: '🎀' }
  return { msg: '괜찮아, 같이 다시 해보자', emoji: '💗' }
}

/**
 * 아직 못 맞춘 조건 하나를 골라 힌트로 준다.
 *
 * 힌트를 눌렀을 때 "다 맞았어요" 만 나오면 버튼이 고장 난 것처럼 보이므로
 * 그 경우도 문구를 돌려준다.
 */
export function hintFor(m: Mission, met: readonly boolean[]): number | null {
  const i = met.findIndex((v) => !v)
  return i >= 0 ? i : null
}
