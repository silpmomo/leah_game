import { describe, expect, it } from 'vitest'
import {
  LOOK_MAX,
  clampPage,
  pageCount,
  removeLook,
  sanitizeBackdrop,
  sanitizeLooks,
  sanitizeOutfit,
  saveLook,
} from '../src/closet/state'
import { BACKDROPS, backdropById } from '../src/doll/backdrop'

const look = { outfit: { dress: 'dress-star-blue' }, backdrop: 'garden' as const }

describe('룩북', () => {
  it('새 사진이 맨 앞에 온다', () => {
    const a = saveLook([], look)
    const b = saveLook(a, { ...look, backdrop: 'sea' })
    expect(b[0]!.backdrop).toBe('sea')
    expect(b.length).toBe(2)
  })

  it('아홉 장이 넘으면 가장 오래된 것이 밀린다', () => {
    let list = [] as ReturnType<typeof saveLook>
    for (let i = 0; i < LOOK_MAX + 4; i++) list = saveLook(list, look)
    expect(list.length).toBe(LOOK_MAX)
  })

  it('지우기', () => {
    const list = saveLook(saveLook([], look), { ...look, backdrop: 'snow' })
    expect(removeLook(list, 0)[0]!.backdrop).toBe('garden')
    expect(removeLook(list, 9).length).toBe(2)
  })

  it('깨진 저장값을 걸러낸다', () => {
    const list = sanitizeLooks([
      { outfit: { dress: 'dress-star-blue' }, backdrop: 'garden' },
      { outfit: 'x', backdrop: '없는배경' },
      null,
    ])
    expect(list.length).toBe(3)
    expect(list[1]!.backdrop).toBe('ballroom')
    expect(list[1]!.outfit).toEqual({})
    expect(sanitizeLooks('쓰레기')).toEqual([])
  })
})

describe('코디 저장값', () => {
  it('없는 옷은 버린다', () => {
    const o = sanitizeOutfit({ dress: 'dress-star-blue', crown: '없는왕관', hair: 42 })
    expect(o.dress).toBe('dress-star-blue')
    expect(o.crown).toBeUndefined()
    expect(o.hair).toBeUndefined()
  })

  it('칸과 분류가 어긋나면 버린다', () => {
    // 왕관 칸에 드레스 아이디가 들어 있는 경우
    expect(sanitizeOutfit({ crown: 'dress-star-blue' }).crown).toBeUndefined()
  })

  it('내가 만든 왕관은 남긴다', () => {
    expect(sanitizeOutfit({ crown: 'custom-crown-0' }).crown).toBe('custom-crown-0')
  })
})

describe('배경', () => {
  it('여섯 곳이 있고 아이디가 겹치지 않는다', () => {
    expect(BACKDROPS.length).toBe(6)
    const ids = BACKDROPS.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('모든 배경이 조각을 만든다', () => {
    for (const b of BACKDROPS) {
      const shapes = b.build(360, 300)
      expect(shapes.length).toBeGreaterThan(3)
      for (const s of shapes) expect(/NaN|undefined/.test(s.d)).toBe(false)
    }
  })

  it('작은 상자에도 그려진다 (룩북 미니 인형)', () => {
    for (const b of BACKDROPS) {
      for (const s of b.build(100, 128)) expect(/NaN|undefined/.test(s.d)).toBe(false)
    }
  })

  it('모르는 아이디는 첫 배경으로', () => {
    expect(backdropById('없음').id).toBe('ballroom')
    expect(sanitizeBackdrop(123)).toBe('ballroom')
    expect(sanitizeBackdrop('snow')).toBe('snow')
  })
})

describe('페이지', () => {
  it('개수에 맞는 페이지 수', () => {
    expect(pageCount(0, 8)).toBe(1)
    expect(pageCount(8, 8)).toBe(1)
    expect(pageCount(9, 8)).toBe(2)
    expect(pageCount(12, 8)).toBe(2)
  })

  it('페이지는 앞뒤로 돌아간다', () => {
    expect(clampPage(2, 12, 8)).toBe(0)
    expect(clampPage(-1, 12, 8)).toBe(1)
    expect(clampPage(0, 4, 8)).toBe(0)
  })
})
