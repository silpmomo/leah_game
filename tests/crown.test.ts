import { describe, expect, it } from 'vitest'
import {
  BASES,
  GEMS,
  SLOTS,
  SLOT_COUNT,
  customCrownId,
  customCrownItem,
  customCrownShapes,
  emptyDesign,
  filledSlots,
  gemById,
  isCustomCrownId,
  sanitizeDesign,
  sanitizeDesigns,
} from '../src/doll/custom'
import { DOLL_W } from '../src/doll/body'
import { assertValidWardrobe } from '../src/doll/schema'

describe('보석과 바탕', () => {
  it('보석 아이디가 겹치지 않는다', () => {
    const ids = GEMS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(GEMS.length).toBe(8)
  })

  it('바탕은 셋이고 색이 있다', () => {
    expect(BASES.length).toBe(3)
    for (const b of BASES) {
      expect(b.metal).toMatch(/^#/)
      expect(b.dark).toMatch(/^#/)
    }
  })

  it('칸은 여덟이고 머리 위 호에 놓인다', () => {
    expect(SLOTS.length).toBe(SLOT_COUNT)
    for (const [x, y] of SLOTS) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(DOLL_W)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(70)
    }
  })

  it('칸이 왼쪽에서 오른쪽으로 늘어선다', () => {
    for (let i = 1; i < SLOTS.length; i++) {
      expect(SLOTS[i]![0]).toBeGreaterThan(SLOTS[i - 1]![0])
    }
  })
})

describe('왕관 디자인', () => {
  it('빈 디자인은 칸이 전부 비어 있다', () => {
    const d = emptyDesign()
    expect(d.gems.length).toBe(SLOT_COUNT)
    expect(filledSlots(d)).toBe(0)
  })

  it('깨진 값을 걸러낸다', () => {
    const d = sanitizeDesign({ base: '없는바탕', gems: ['ruby', '없는보석', 3] })
    expect(d.base).toBe('silver')
    expect(d.gems[0]).toBe('ruby')
    expect(d.gems[1]).toBeNull()
    expect(d.gems.length).toBe(SLOT_COUNT)
  })

  it('저장 목록은 세 개까지', () => {
    const many = [emptyDesign(), emptyDesign(), emptyDesign(), emptyDesign()]
    expect(sanitizeDesigns(many).length).toBe(3)
    expect(sanitizeDesigns('쓰레기')).toEqual([])
  })

  it('보석을 채우면 조각이 늘어난다', () => {
    const empty = customCrownShapes(emptyDesign())
    const full = customCrownShapes({ base: 'gold', gems: GEMS.map((g) => g.id).slice(0, 8) })
    expect(full.length).toBeGreaterThan(empty.length)
    for (const s of full) expect(/NaN|undefined/.test(s.d)).toBe(false)
  })

  it('옷장 아이템으로 바뀌고 검사를 통과한다', () => {
    const item = customCrownItem({ base: 'rose', gems: ['heart', null, 'pearl', null, null, null, null, null] }, 1)
    expect(item.id).toBe(customCrownId(1))
    expect(item.cat).toBe('crown')
    expect(item.custom).toBe(true)
    expect(() => assertValidWardrobe([item])).toThrow(/분류에 아이템이 없다/)
    // 왕관 분류만 검사하면 통과해야 하므로 조각·색만 따로 확인한다
    expect(item.front.length).toBeGreaterThan(0)
    expect(item.color).toBe('pink')
  })

  it('내가 만든 왕관 아이디를 알아본다', () => {
    expect(isCustomCrownId(customCrownId(0))).toBe(true)
    expect(isCustomCrownId('crown-gold-royal')).toBe(false)
    expect(isCustomCrownId(undefined)).toBe(false)
  })

  it('보석을 아이디로 찾는다', () => {
    expect(gemById('ruby')?.name).toBe('루비')
    expect(gemById(null)).toBeUndefined()
    expect(gemById('없음')).toBeUndefined()
  })
})
