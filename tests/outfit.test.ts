import { describe, expect, it } from 'vitest'
import { createRng } from '../src/engine/rng'
import {
  composeDoll,
  equip,
  outfitColors,
  outfitItems,
  outfitThemes,
  randomOutfit,
  unequip,
  wornCount,
  type Outfit,
} from '../src/doll/outfit'
import { itemById, itemsOf } from '../src/doll/wardrobe'
import { baseOutfitShapes, baseHairFront } from '../src/doll/body'

const dress = itemById('dress-star-blue')!
const crown = itemById('crown-gold-royal')!

describe('코디', () => {
  it('같은 아이템을 다시 누르면 벗는다', () => {
    const a = equip({}, dress)
    expect(a.dress).toBe(dress.id)
    const b = equip(a, dress)
    expect(b.dress).toBeUndefined()
  })

  it('같은 칸의 다른 아이템은 갈아입는다', () => {
    const other = itemsOf('dress')[1]!
    const a = equip(equip({}, dress), other)
    expect(a.dress).toBe(other.id)
    expect(wornCount(a)).toBe(1)
  })

  it('unequip 은 원래 값을 건드리지 않는다', () => {
    const a: Outfit = { dress: dress.id, crown: crown.id }
    const b = unequip(a, 'crown')
    expect(a.crown).toBe(crown.id)
    expect(b.crown).toBeUndefined()
  })

  it('색·테마 집합을 뽑는다', () => {
    const o = equip(equip({}, dress), crown)
    expect(outfitColors(o).has('blue')).toBe(true)
    expect(outfitColors(o).has('gold')).toBe(true)
    expect(outfitThemes(o).has('royal')).toBe(true)
  })

  it('outfitItems 는 분류 순서를 지킨다', () => {
    const o: Outfit = { crown: crown.id, dress: dress.id }
    expect(outfitItems(o).map((i) => i.cat)).toEqual(['dress', 'crown'])
  })
})

describe('랜덤 코디', () => {
  it('드레스와 머리는 반드시 들어간다', () => {
    for (let seed = 1; seed < 40; seed++) {
      const o = randomOutfit(createRng(seed))
      expect(o.dress).toBeTruthy()
      expect(o.hair).toBeTruthy()
    }
  })

  it('같은 씨앗은 같은 코디를 만든다', () => {
    expect(randomOutfit(createRng(99))).toEqual(randomOutfit(createRng(99)))
  })

  it('씨앗이 다르면 대체로 다르다', () => {
    const a = JSON.stringify(randomOutfit(createRng(1)))
    const b = JSON.stringify(randomOutfit(createRng(2)))
    expect(a).not.toBe(b)
  })
})

describe('인형 조립', () => {
  it('아무것도 안 입으면 기본 옷이 보인다', () => {
    const shapes = composeDoll({})
    const base = baseOutfitShapes()
    expect(shapes.some((s) => s.d === base[0]!.d)).toBe(true)
  })

  it('드레스를 입으면 기본 치마가 사라진다', () => {
    const shapes = composeDoll({ dress: dress.id })
    const base = baseOutfitShapes()
    expect(shapes.some((s) => s.d === base[0]!.d)).toBe(false)
    // 드레스 조각은 들어 있다
    expect(shapes.some((s) => s.d === dress.front[0]!.d)).toBe(true)
  })

  it('머리 아이템이 없으면 기본 앞머리를 쓴다', () => {
    const shapes = composeDoll({})
    expect(shapes.some((s) => s.d === baseHairFront()[0]!.d)).toBe(true)
  })

  it('머리 아이템을 쓰면 기본 앞머리를 안 쓴다', () => {
    const hair = itemById('hair-twin-brown')!
    const shapes = composeDoll({ hair: hair.id })
    expect(shapes.some((s) => s.d === baseHairFront()[0]!.d)).toBe(false)
  })

  it('층 순서 — 날개는 몸보다 앞에 오지 않는다', () => {
    const wings = itemById('wing-fairy-pink')!
    const shapes = composeDoll({ wings: wings.id, dress: dress.id })
    const wingAt = shapes.findIndex((s) => s.d === wings.back![0]!.d)
    const dressAt = shapes.findIndex((s) => s.d === dress.front[0]!.d)
    expect(wingAt).toBeGreaterThanOrEqual(0)
    expect(wingAt).toBeLessThan(dressAt)
  })

  it('왕관은 머리보다 뒤에(위에) 그린다', () => {
    const hair = itemById('hair-long-brown')!
    const shapes = composeDoll({ hair: hair.id, crown: crown.id })
    const hairAt = shapes.findIndex((s) => s.d === hair.front[0]!.d)
    const crownAt = shapes.findIndex((s) => s.d === crown.front[0]!.d)
    expect(crownAt).toBeGreaterThan(hairAt)
  })

  it('열 칸을 모두 채워도 조각이 만들어진다', () => {
    const full: Outfit = {}
    for (const cat of [
      'dress',
      'hair',
      'crown',
      'shoes',
      'necklace',
      'gloves',
      'cape',
      'wings',
      'earrings',
      'wand',
    ] as const) {
      full[cat] = itemsOf(cat)[0]!.id
    }
    expect(wornCount(full)).toBe(10)
    const shapes = composeDoll(full)
    expect(shapes.length).toBeGreaterThan(40)
    for (const s of shapes) expect(s.d.length).toBeGreaterThan(0)
  })
})
