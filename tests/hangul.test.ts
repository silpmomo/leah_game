import { describe, expect, it } from 'vitest'
import { hasFinal, josa } from '../src/engine/hangul'
import { ITEMS } from '../src/doll/wardrobe'
import { FURNITURE } from '../src/room/items'
import { GEMS } from '../src/doll/custom'

describe('받침 판정', () => {
  it('받침이 있는 글자', () => {
    expect(hasFinal('커튼')).toBe(true)
    expect(hasFinal('왕관')).toBe(true)
    expect(hasFinal('침대')).toBe(false)
    expect(hasFinal('루비')).toBe(false)
  })

  it('숫자로 끝나면 읽는 소리로 본다', () => {
    expect(hasFinal('내 왕관 1')).toBe(true) // 일
    expect(hasFinal('내 왕관 2')).toBe(false) // 이
    expect(hasFinal('내 왕관 3')).toBe(true) // 삼
  })

  it('빈 값도 견딘다', () => {
    expect(hasFinal('')).toBe(false)
    expect(() => josa('', '을/를')).not.toThrow()
  })
})

describe('조사 붙이기', () => {
  it('을/를', () => {
    expect(josa('커튼', '을/를')).toBe('커튼을')
    expect(josa('침대', '을/를')).toBe('침대를')
  })

  it('이/가 · 은/는 · 와/과', () => {
    expect(josa('왕관', '이/가')).toBe('왕관이')
    expect(josa('구두', '이/가')).toBe('구두가')
    expect(josa('드레스', '은/는')).toBe('드레스는')
    expect(josa('망토', '와/과')).toBe('망토와')
    expect(josa('장갑', '와/과')).toBe('장갑과')
  })

  it('으로/로 는 ㄹ 받침을 따로 본다', () => {
    expect(josa('왕관', '으로/로')).toBe('왕관으로')
    expect(josa('구두', '으로/로')).toBe('구두로')
    expect(josa('연필', '으로/로')).toBe('연필로')
  })

  it('모든 옷·가구·보석 이름에 조사를 붙일 수 있다', () => {
    for (const name of [
      ...ITEMS.map((i) => i.name),
      ...FURNITURE.map((f) => f.name),
      ...GEMS.map((g) => g.name),
    ]) {
      const s = josa(name, '을/를')
      expect(s.startsWith(name)).toBe(true)
      expect(s.length).toBe(name.length + 1)
    }
  })
})
