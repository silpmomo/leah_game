import { describe, expect, it } from 'vitest'
import {
  STICKERS,
  STICKER_TOTAL,
  bump,
  counter,
  emptyAlbum,
  grant,
  hasSticker,
  newlyEarned,
  ownedCount,
  sanitizeAlbum,
  see,
  seenCount,
  stickerById,
  type World,
} from '../src/stickers/album'

const base: World = { dressTotal: 12, hairTotal: 8 }

describe('스티커 목록', () => {
  it('아이디가 겹치지 않는다', () => {
    const ids = STICKERS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(STICKER_TOTAL).toBe(STICKERS.length)
  })

  it('모든 스티커에 이름·힌트·이모지가 있다', () => {
    for (const s of STICKERS) {
      expect(s.name).toBeTruthy()
      expect(s.hint).toBeTruthy()
      expect(s.emoji).toBeTruthy()
      expect(s.color).toMatch(/^#/)
    }
  })

  it('없는 아이디는 undefined', () => {
    expect(stickerById('없음')).toBeUndefined()
  })
})

describe('앨범', () => {
  it('같은 값을 두 번 봐도 한 번만 센다', () => {
    let a = emptyAlbum()
    a = see(a, 'dress', 'd1')
    a = see(a, 'dress', 'd1')
    a = see(a, 'dress', 'd2')
    expect(seenCount(a, 'dress')).toBe(2)
  })

  it('카운터를 올린다', () => {
    let a = emptyAlbum()
    a = bump(a, 'random')
    a = bump(a, 'random', 4)
    expect(counter(a, 'random')).toBe(5)
    expect(counter(a, '없는것')).toBe(0)
  })

  it('깨진 저장값을 걸러낸다', () => {
    const a = sanitizeAlbum({
      owned: { 'first-dress': true, 없는스티커: true },
      counters: { random: 3, bad: 'x' },
      seen: { dress: ['a', 1, 'b'] },
    })
    expect(hasSticker(a, 'first-dress')).toBe(true)
    expect(a.owned['없는스티커']).toBeUndefined()
    expect(a.counters.random).toBe(3)
    expect(a.counters.bad).toBeUndefined()
    expect(a.seen.dress).toEqual(['a', 'b'])
  })

  it('빈 값도 견딘다', () => {
    expect(ownedCount(sanitizeAlbum(undefined))).toBe(0)
    expect(ownedCount(sanitizeAlbum('쓰레기'))).toBe(0)
  })
})

describe('스티커 조건', () => {
  it('드레스를 한 번 입으면 첫 드레스', () => {
    const a = see(emptyAlbum(), 'dress', 'dress-star-blue')
    expect(newlyEarned(a, base)).toContain('first-dress')
  })

  it('열 칸을 채우면 완벽한 코디', () => {
    expect(newlyEarned(emptyAlbum(), { ...base, worn: 10 })).toContain('full-set')
    expect(newlyEarned(emptyAlbum(), { ...base, worn: 9 })).not.toContain('full-set')
  })

  it('드레스를 전부 입어야 옷장 정복', () => {
    let a = emptyAlbum()
    for (let i = 0; i < 11; i++) a = see(a, 'dress', `d${i}`)
    expect(newlyEarned(a, base)).not.toContain('dress-all')
    a = see(a, 'dress', 'd11')
    expect(newlyEarned(a, base)).toContain('dress-all')
  })

  it('이미 받은 스티커는 다시 안 준다', () => {
    const first = grant(emptyAlbum(), { ...base, worn: 10 })
    expect(first.gained).toContain('full-set')
    const again = grant(first.album, { ...base, worn: 10 })
    expect(again.gained).not.toContain('full-set')
  })

  it('마지막 한 장은 나머지를 다 모아야 붙는다', () => {
    let a = emptyAlbum()
    for (const s of STICKERS) {
      if (s.id === 'all-stickers') continue
      a = { ...a, owned: { ...a.owned, [s.id]: true } }
    }
    const res = grant(a, base)
    expect(res.gained).toEqual(['all-stickers'])
    expect(ownedCount(res.album)).toBe(STICKER_TOTAL)
  })

  it('한 번에 여러 장을 받을 수 있다', () => {
    const res = grant(emptyAlbum(), {
      ...base,
      worn: 10,
      wearingWings: true,
      wearingWand: true,
      looks: 1,
    })
    expect(res.gained.length).toBeGreaterThanOrEqual(4)
    expect(new Set(res.gained).size).toBe(res.gained.length)
  })

  it('방·왕관·패션쇼 조건이 각각 동작한다', () => {
    expect(newlyEarned(emptyAlbum(), { ...base, roomItems: 10 })).toEqual(
      expect.arrayContaining(['room-first', 'room-10']),
    )
    expect(newlyEarned(emptyAlbum(), { ...base, crownDesigns: 3 })).toEqual(
      expect.arrayContaining(['crown-first', 'crown-3']),
    )
    expect(
      newlyEarned(emptyAlbum(), { ...base, runwayThreeStars: 20, runwayTotal: 20, runwayDone: 20 }),
    ).toEqual(expect.arrayContaining(['show-first', 'show-5', 'show-10', 'show-all']))
  })
})
