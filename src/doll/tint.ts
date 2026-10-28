/**
 * 색 견본 — "같은 옷, 다른 색".
 *
 * 참고작(docs/DESIGN.md)의 색 견본 열을 옮겼다. 분류마다 여섯 색이 있고
 * 0번은 원래 색이다. 저장값은 분류별 견본 번호뿐이라 옷 그림을 고쳐도
 * 살아 있다. 패션쇼는 색 태그로 채점하므로 **원래 색으로 그린다** —
 * 분홍으로 물들인 파란 드레스에 "파란 옷 ✓" 가 붙으면 아이가 헷갈린다.
 */
import type { Shape } from '../engine/shapes'
import { tintShapes } from '../engine/color'
import type { Category } from './kinds'

export type Tints = Partial<Record<Category, number>>

/** 색을 바꿀 수 있는 분류. 왕관·목걸이처럼 금속·보석 위주는 뺀다 */
export const TINTABLE: readonly Category[] = ['dress', 'hair', 'shoes', 'cape']

/** 참고작 스크린샷에서 뽑은 팔레트 (docs/DESIGN.md 4절) */
export const SWATCHES: Record<string, readonly string[]> = {
  dress: ['#9a9ac7', '#89a7c9', '#8b1f33', '#e0c15c', '#c9d35b', '#e9a1a8'],
  hair: ['#8a6a60', '#f1efe9', '#d98a8f', '#6d7a93', '#8e8f52', '#7e6090'],
  shoes: ['#b7b7b7', '#ffe08a', '#ff8fb0', '#ff7a4d', '#5ec2f5', '#2a2a2a'],
  cape: ['#e05a7a', '#5a8fe0', '#f0c04a', '#6fcf8a', '#9a6ad0', '#f7f1e8'],
}

export function isTintable(cat: Category): boolean {
  return TINTABLE.includes(cat)
}

/** 견본 번호 → 색. 0 이나 범위 밖이면 null (원래 색) */
export function swatchColor(cat: Category, index: number | undefined): string | null {
  if (!index || index <= 0) return null
  const list = SWATCHES[cat]
  if (!list) return null
  return list[index - 1] ?? null
}

/** 견본 개수 (원래 색 칸 제외) */
export function swatchCount(cat: Category): number {
  return SWATCHES[cat]?.length ?? 0
}

export function sanitizeTints(v: unknown): Tints {
  const o = (v ?? {}) as Record<string, unknown>
  const out: Tints = {}
  for (const cat of TINTABLE) {
    const n = o[cat]
    if (typeof n !== 'number' || !Number.isFinite(n)) continue
    const i = Math.floor(n)
    if (i >= 1 && i <= swatchCount(cat)) out[cat] = i
  }
  return out
}

/** 분류의 조각 묶음에 견본 색을 입힌다. 견본이 없으면 그대로 */
export function tintFor(cat: Category, tints: Tints | undefined, shapes: readonly Shape[]): readonly Shape[] {
  const css = swatchColor(cat, tints?.[cat])
  if (!css || shapes.length === 0) return shapes
  return tintShapes(shapes, css)
}
