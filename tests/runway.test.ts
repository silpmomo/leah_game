import { describe, expect, it } from 'vitest'
import { MISSIONS, reqIcon, reqLabel } from '../src/runway/missions'
import {
  clearedCount,
  meets,
  metFlags,
  praise,
  record,
  sanitizeProgress,
  scoreStars,
  starsOf,
  suggestIndex,
  threeStarCount,
} from '../src/runway/rules'
import { itemById, itemsOf } from '../src/doll/wardrobe'
import type { Outfit } from '../src/doll/outfit'

describe('미션 데이터', () => {
  it('아이디가 겹치지 않는다', () => {
    const ids = MISSIONS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('스무 개가 있고 모두 조건이 있다', () => {
    expect(MISSIONS.length).toBe(20)
    for (const m of MISSIONS) {
      expect(m.reqs.length).toBeGreaterThan(0)
      expect(m.title).toBeTruthy()
      expect(m.ask).toBeTruthy()
    }
  })

  it('item 조건은 실제로 있는 옷을 가리킨다', () => {
    for (const m of MISSIONS) {
      for (const r of m.reqs) {
        if (r.kind === 'item') expect(itemById(r.id)).toBeTruthy()
      }
    }
  })

  it('모든 조건에 이름과 아이콘이 붙는다', () => {
    for (const m of MISSIONS) {
      for (const r of m.reqs) {
        expect(reqLabel(r).length).toBeGreaterThan(0)
        expect(reqIcon(r).length).toBeGreaterThan(0)
      }
    }
  })

  it('모든 미션은 실제로 별 셋을 받을 수 있다', () => {
    // 조건을 만족하는 코디를 실제로 만들어 본다.
    // 만들 수 없는 미션이 하나라도 있으면 아이가 영영 못 깬다.
    for (const m of MISSIONS) {
      const outfit: Outfit = {}
      for (const r of m.reqs) {
        if (r.kind === 'item') {
          const it = itemById(r.id)!
          outfit[it.cat] = it.id
        } else if (r.kind === 'cat') {
          outfit[r.cat] ??= itemsOf(r.cat)[0]!.id
        } else if (r.kind === 'color') {
          const hit = [...itemsOf('necklace'), ...itemsOf('earrings'), ...itemsOf('wand')].concat(
            itemsOf('dress'),
            itemsOf('cape'),
            itemsOf('shoes'),
            itemsOf('crown'),
            itemsOf('gloves'),
            itemsOf('wings'),
            itemsOf('hair'),
          ).find((i) => i.color === r.color && !outfit[i.cat])
          expect(hit, `${m.id}: ${r.color} 색 옷이 없다`).toBeTruthy()
          outfit[hit!.cat] = hit!.id
        } else if (r.kind === 'theme') {
          const hit = itemsOf('dress')
            .concat(
              itemsOf('necklace'),
              itemsOf('crown'),
              itemsOf('cape'),
              itemsOf('wings'),
              itemsOf('shoes'),
              itemsOf('wand'),
              itemsOf('earrings'),
              itemsOf('gloves'),
              itemsOf('hair'),
            )
            .find((i) => i.theme === r.theme && !outfit[i.cat])
          expect(hit, `${m.id}: ${r.theme} 테마 옷이 없다`).toBeTruthy()
          outfit[hit!.cat] = hit!.id
        }
      }
      // count 조건은 남은 칸을 채워서 맞춘다
      for (const r of m.reqs) {
        if (r.kind !== 'count') continue
        for (const c of [
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
          if (Object.keys(outfit).length >= r.n) break
          outfit[c] ??= itemsOf(c)[0]!.id
        }
      }
      expect(scoreStars(metFlags(m, outfit)), `${m.id} 를 별 셋으로 깰 수 없다`).toBe(3)
    }
  })
})

describe('조건 판정', () => {
  const blue = itemById('dress-star-blue')!

  it('cat 조건은 그 칸이 차 있으면 참', () => {
    expect(meets({ kind: 'cat', cat: 'dress' }, {})).toBe(false)
    expect(meets({ kind: 'cat', cat: 'dress' }, { dress: blue.id })).toBe(true)
  })

  it('item 조건은 정확히 그 옷일 때만 참', () => {
    const other = itemsOf('dress')[1]!
    expect(meets({ kind: 'item', id: blue.id }, { dress: other.id })).toBe(false)
    expect(meets({ kind: 'item', id: blue.id }, { dress: blue.id })).toBe(true)
  })

  it('color 조건은 어느 칸이든 그 색이면 참', () => {
    expect(meets({ kind: 'color', color: 'blue' }, { dress: blue.id })).toBe(true)
    expect(meets({ kind: 'color', color: 'red' }, { dress: blue.id })).toBe(false)
  })

  it('count 조건은 칸 수를 센다', () => {
    const o = { dress: blue.id, hair: itemsOf('hair')[0]!.id }
    expect(meets({ kind: 'count', n: 2 }, o)).toBe(true)
    expect(meets({ kind: 'count', n: 3 }, o)).toBe(false)
  })
})

describe('채점', () => {
  it('전부 맞으면 별 셋', () => {
    expect(scoreStars([true, true, true])).toBe(3)
  })

  it('절반 이상이면 둘, 하나면 하나, 없으면 없음', () => {
    expect(scoreStars([true, true, false, false])).toBe(2)
    expect(scoreStars([true, false, false])).toBe(1)
    expect(scoreStars([false, false])).toBe(0)
  })

  it('조건이 하나뿐이면 맞는 순간 별 셋', () => {
    expect(scoreStars([true])).toBe(3)
    expect(scoreStars([false])).toBe(0)
  })

  it('기록은 최고점만 남는다', () => {
    let p = record({}, 'm01', 2)
    expect(starsOf(p, 'm01')).toBe(2)
    p = record(p, 'm01', 1)
    expect(starsOf(p, 'm01')).toBe(2)
    p = record(p, 'm01', 3)
    expect(starsOf(p, 'm01')).toBe(3)
  })

  it('진행도 개수를 센다', () => {
    const p = { m01: 3, m02: 1, m03: 3 }
    expect(clearedCount(p)).toBe(3)
    expect(threeStarCount(p)).toBe(2)
  })

  it('깨진 저장값을 걸러낸다', () => {
    const p = sanitizeProgress({ m01: 9, m02: 'x', 없는미션: 3, m03: -1 })
    expect(p.m01).toBe(3)
    expect(p.m02).toBeUndefined()
    expect(p['없는미션']).toBeUndefined()
    expect(p.m03).toBeUndefined()
  })

  it('다음 미션을 고른다', () => {
    expect(suggestIndex({})).toBe(0)
    expect(suggestIndex({ m01: 3 })).toBe(1)
    const all: Record<string, number> = {}
    for (const m of MISSIONS) all[m.id] = 3
    expect(suggestIndex(all)).toBe(0)
  })

  it('별이 없어도 격려한다', () => {
    expect(praise(0).msg.length).toBeGreaterThan(0)
    expect(praise(3).msg).toContain('완벽')
  })
})
