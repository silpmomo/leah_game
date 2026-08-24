/**
 * 플레이어가 만든 왕관.
 *
 * 보석 왕관 공방에서 만든 왕관이 옷장에 아이템으로 들어간다. 게임끼리
 * 이어지는 보상이 하나쯤 있어야 아이가 "내가 만든 걸 입혀볼래" 를 한다.
 *
 * 저장되는 값은 디자인(금속 + 보석 8칸)뿐이고, 그림은 매번 여기서 만든다.
 */
import {
  circlePath,
  dropPath,
  gemPath,
  heartPath,
  starPath,
  type Shape,
} from '../engine/shapes'
import { headArc } from './builders'
import type { Item } from './kinds'
import { THUMB_VIEW } from './wardrobe'

export type GemShape = 'gem' | 'round' | 'heart' | 'star' | 'drop'

export type GemKind = {
  id: string
  name: string
  color: string
  shape: GemShape
}

export const GEMS: readonly GemKind[] = [
  { id: 'ruby', name: '루비', color: '#e2596b', shape: 'gem' },
  { id: 'sapphire', name: '사파이어', color: '#5b8ff0', shape: 'gem' },
  { id: 'emerald', name: '에메랄드', color: '#4fc07a', shape: 'drop' },
  { id: 'amethyst', name: '자수정', color: '#a678de', shape: 'gem' },
  { id: 'topaz', name: '황옥', color: '#f5cf6a', shape: 'drop' },
  { id: 'pearl', name: '진주', color: '#fdfcff', shape: 'round' },
  { id: 'heart', name: '하트 보석', color: '#f4708f', shape: 'heart' },
  { id: 'star', name: '별 보석', color: '#ffe37a', shape: 'star' },
]

export function gemById(id: string | null): GemKind | undefined {
  return id ? GEMS.find((g) => g.id === id) : undefined
}

export type CrownBase = 'silver' | 'gold' | 'rose'

export const BASES: readonly { id: CrownBase; name: string; metal: string; dark: string }[] = [
  { id: 'silver', name: '은관', metal: '#e3eaf6', dark: '#a9b6cc' },
  { id: 'gold', name: '금관', metal: '#f5cf6a', dark: '#c99b2c' },
  { id: 'rose', name: '분홍관', metal: '#f7c6da', dark: '#d47398' },
]

export const SLOT_COUNT = 8

export type CrownDesign = {
  base: CrownBase
  /** 길이 SLOT_COUNT. null 은 빈 칸 */
  gems: (string | null)[]
}

export function emptyDesign(base: CrownBase = 'silver'): CrownDesign {
  return { base, gems: Array.from({ length: SLOT_COUNT }, () => null) }
}

export function sanitizeDesign(v: unknown): CrownDesign {
  const o = (v ?? {}) as Partial<CrownDesign>
  const base = BASES.find((b) => b.id === o.base)?.id ?? 'silver'
  const gems = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const raw = Array.isArray(o.gems) ? o.gems[i] : null
    return typeof raw === 'string' && gemById(raw) ? raw : null
  })
  return { base, gems }
}

export function sanitizeDesigns(v: unknown): CrownDesign[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, 3).map(sanitizeDesign)
}

export function filledSlots(d: CrownDesign): number {
  return d.gems.filter(Boolean).length
}

/** 칸 위치 — 인형 좌표. 공방 화면이 두드릴 자리를 여기서 가져간다 */
export const SLOTS: readonly (readonly [number, number])[] = Array.from(
  { length: SLOT_COUNT },
  (_, i) => headArc(0.07 + (i / (SLOT_COUNT - 1)) * 0.86),
)

function gemShape(kind: GemKind, x: number, y: number, r: number): Shape[] {
  const hi: Shape = { d: circlePath(x - r * 0.3, y - r * 0.35, r * 0.26), fill: 'rgba(255,255,255,.85)' }
  switch (kind.shape) {
    case 'round':
      return [{ d: circlePath(x, y, r), fill: kind.color }, hi]
    case 'heart':
      return [{ d: heartPath(x, y, r * 0.95), fill: kind.color }, hi]
    case 'star':
      return [{ d: starPath(x, y, r * 1.25, r * 0.52), fill: kind.color }]
    case 'drop':
      return [{ d: dropPath(x, y, r * 1.6, r * 2.1), fill: kind.color }, hi]
    case 'gem':
      return [{ d: gemPath(x, y, r * 2, r * 2.2), fill: kind.color }, hi]
  }
}

export function customCrownShapes(d: CrownDesign): Shape[] {
  const base = BASES.find((b) => b.id === d.base) ?? BASES[0]!
  const band = `M62,58Q100,18 138,58`
  const out: Shape[] = [
    { d: band, stroke: base.dark, lw: 9, cap: 'round' },
    { d: band, stroke: base.metal, lw: 6, cap: 'round' },
  ]
  d.gems.forEach((gid, i) => {
    const [x, y] = SLOTS[i]!
    const kind = gemById(gid)
    if (!kind) {
      // 빈 칸은 금속 알갱이로 둔다. 구멍처럼 보이면 미완성으로 느껴진다
      out.push({ d: circlePath(x, y - 2, 2.4), fill: base.dark })
      return
    }
    out.push(...gemShape(kind, x, y - 5, 5.4))
  })
  return out
}

/** 옷장에 들어갈 아이템으로 바꾼다 */
export function customCrownItem(d: CrownDesign, index: number): Item {
  const base = BASES.find((b) => b.id === d.base) ?? BASES[0]!
  return {
    id: customCrownId(index),
    cat: 'crown',
    name: `내 ${base.name} ${index + 1}`,
    color: d.base === 'gold' ? 'gold' : d.base === 'rose' ? 'pink' : 'silver',
    theme: 'royal',
    front: customCrownShapes(d),
    thumb: THUMB_VIEW.crown,
    custom: true,
  }
}

export function customCrownId(index: number): string {
  return `custom-crown-${index}`
}

export function isCustomCrownId(id: string | undefined): boolean {
  return typeof id === 'string' && id.startsWith('custom-crown-')
}
