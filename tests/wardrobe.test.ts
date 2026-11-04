import { describe, expect, it } from 'vitest'
import { ITEMS, itemById, itemsOf, THUMB_VIEW } from '../src/doll/wardrobe'
import { isArtName } from '../src/doll/art'
import { CATEGORIES, COLOR_NAME, THEME_NAME } from '../src/doll/kinds'
import { assertValidWardrobe } from '../src/doll/schema'
import type { Item } from '../src/doll/kinds'

describe('옷장 데이터', () => {
  it('부팅 검사를 통과한다', () => {
    expect(() => assertValidWardrobe(ITEMS)).not.toThrow()
  })

  it('아이디가 겹치지 않는다', () => {
    const ids = ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('분류마다 아이템이 넉넉히 있다', () => {
    // 한 페이지(8칸)를 채우지 못하는 분류가 있어도 되지만, 비어 있으면 안 된다
    for (const c of CATEGORIES) {
      expect(itemsOf(c.id).length).toBeGreaterThan(0)
    }
    expect(itemsOf('dress').length).toBeGreaterThanOrEqual(10)
    expect(itemsOf('hair').length).toBeGreaterThanOrEqual(5)
    expect(ITEMS.length).toBeGreaterThanOrEqual(50)
  })

  it('색·테마 태그가 사전에 있는 값이다', () => {
    for (const it of ITEMS) {
      expect(COLOR_NAME[it.color]).toBeTruthy()
      if (it.theme) expect(THEME_NAME[it.theme]).toBeTruthy()
    }
  })

  it('아이템의 그림 조각이 비어 있지 않다', () => {
    for (const it of ITEMS) {
      const pieces = [...(it.back ?? []), ...it.front]
      expect(pieces.length).toBeGreaterThan(0)
    }
  })

  it('벡터 소품은 분류 썸네일, 그림 아이템은 제 그림을 감싼 영역을 쓴다', () => {
    for (const it of ITEMS) {
      const pieces = [...(it.back ?? []), ...it.front]
      if (pieces.some((p) => p.img)) {
        for (const p of pieces) {
          if (!p.img) continue
          // 그림 가운데가 썸네일 안에 들어 있다
          const cx = p.img.x + p.img.w / 2
          const cy = p.img.y + p.img.h / 2
          expect(cx).toBeGreaterThanOrEqual(it.thumb.x)
          expect(cx).toBeLessThanOrEqual(it.thumb.x + it.thumb.w)
          expect(cy).toBeGreaterThanOrEqual(it.thumb.y)
          expect(cy).toBeLessThanOrEqual(it.thumb.y + it.thumb.h)
        }
      } else {
        expect(it.thumb).toEqual(THUMB_VIEW[it.cat as keyof typeof THUMB_VIEW])
      }
    }
  })

  it('그림 조각은 모두 에셋 목록(art.gen.ts)에 있다', () => {
    for (const it of ITEMS) {
      for (const p of [...(it.back ?? []), ...it.front]) {
        if (p.img) expect(isArtName(p.img.name)).toBe(true)
      }
    }
  })

  it('날개는 몸 뒤(back)에만 있다', () => {
    for (const w of itemsOf('wings')) {
      expect(w.back?.length ?? 0).toBeGreaterThan(0)
      expect(w.front.length).toBe(0)
    }
  })

  it('itemById 는 없는 아이디에 undefined 를 준다', () => {
    expect(itemById('없는옷')).toBeUndefined()
    expect(itemById(undefined)).toBeUndefined()
    expect(itemById('dress-night-blue')?.cat).toBe('dress')
  })

  it('검사기는 잘못된 데이터를 잡는다', () => {
    const good = ITEMS[0] as Item
    expect(() => assertValidWardrobe([good, good])).toThrow(/아이디가 겹친다/)
    expect(() =>
      assertValidWardrobe([{ ...good, front: [], back: undefined }]),
    ).toThrow(/조각/)
    expect(() =>
      assertValidWardrobe([{ ...good, color: 'lime' as unknown as Item['color'] }]),
    ).toThrow(/모르는 색/)
  })
})
