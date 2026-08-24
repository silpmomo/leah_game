import { describe, expect, it } from 'vitest'
import { FURNITURE, furnitureOf } from '../src/room/items'
import {
  FLOOR_BAND,
  MAX_ITEMS,
  ROOM_H,
  ROOM_W,
  WALL_BAND,
  countOf,
  drawOrder,
  hasKind,
  moveTo,
  pickAt,
  place,
  removeAt,
  sanitizeLayout,
  snap,
} from '../src/room/rules'

describe('가구 목록', () => {
  it('종류가 겹치지 않는다', () => {
    const kinds = FURNITURE.map((f) => f.kind)
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(FURNITURE.length).toBeGreaterThanOrEqual(16)
  })

  it('모든 가구가 조각을 만든다', () => {
    for (const f of FURNITURE) {
      const shapes = f.build(100, 300)
      expect(shapes.length).toBeGreaterThan(0)
      for (const s of shapes) {
        expect(s.d).toBeTruthy()
        expect(/NaN|undefined/.test(s.d)).toBe(false)
      }
      expect(f.halfW).toBeGreaterThan(0)
      expect(f.height).toBeGreaterThan(0)
      expect(f.name).toBeTruthy()
    }
  })

  it('벽 가구와 바닥 가구가 둘 다 있다', () => {
    expect(FURNITURE.some((f) => f.onWall)).toBe(true)
    expect(FURNITURE.some((f) => !f.onWall)).toBe(true)
  })
})

describe('배치', () => {
  it('방 밖으로 나가지 않는다', () => {
    const p = snap({ kind: 'bed', x: -100, y: 999 })
    const f = furnitureOf('bed')!
    expect(p.x).toBeGreaterThanOrEqual(f.halfW)
    expect(p.x).toBeLessThanOrEqual(ROOM_W - f.halfW)
    expect(p.y).toBeLessThanOrEqual(ROOM_H)
  })

  it('벽 가구는 벽 높이로, 바닥 가구는 바닥 높이로 간다', () => {
    expect(snap({ kind: 'mirror', x: 100, y: 380 }).y).toBeLessThanOrEqual(WALL_BAND.max)
    expect(snap({ kind: 'bed', x: 100, y: 60 }).y).toBeGreaterThanOrEqual(FLOOR_BAND.min)
  })

  it('가득 차면 가장 오래된 것이 밀린다', () => {
    let list = [] as ReturnType<typeof place>
    for (let i = 0; i < MAX_ITEMS + 3; i++) list = place(list, 'teddy', 50 + i, 300)
    expect(list.length).toBe(MAX_ITEMS)
  })

  it('옮기면 그 자리도 방 안으로 잘린다', () => {
    let list = place([], 'plant', 100, 300)
    list = moveTo(list, 0, 9999, 9999)
    expect(list[0]!.x).toBeLessThan(ROOM_W)
    expect(list[0]!.y).toBeLessThanOrEqual(FLOOR_BAND.max)
  })

  it('없는 번호를 옮겨도 터지지 않는다', () => {
    const list = place([], 'plant', 100, 300)
    expect(moveTo(list, 7, 10, 10)).toEqual(list)
  })

  it('앞(아래)에 있는 물건이 먼저 잡힌다', () => {
    let list = place([], 'rug', 150, 300)
    list = place(list, 'teddy', 150, 340)
    const hit = pickAt(list, 150, 330)
    expect(hit).toBe(1)
  })

  it('빈 곳을 두드리면 아무것도 안 잡힌다', () => {
    const list = place([], 'teddy', 40, 300)
    expect(pickAt(list, 300, 380)).toBeNull()
  })

  it('그리는 순서는 y 가 작은 것부터', () => {
    let list = place([], 'teddy', 100, 380)
    list = place(list, 'plant', 100, 280)
    expect(drawOrder(list)).toEqual([1, 0])
  })

  it('치우기', () => {
    let list = place([], 'teddy', 100, 300)
    list = place(list, 'cake', 200, 320)
    list = removeAt(list, 0)
    expect(list.length).toBe(1)
    expect(list[0]!.kind).toBe('cake')
  })

  it('개수와 존재 확인', () => {
    let list = place([], 'balloon', 100, 300)
    list = place(list, 'balloon', 200, 300)
    expect(countOf(list, 'balloon')).toBe(2)
    expect(hasKind(list, 'cake')).toBe(false)
  })

  it('깨진 저장값을 걸러낸다', () => {
    const list = sanitizeLayout([
      { kind: 'bed', x: 100, y: 300 },
      { kind: '없는가구', x: 1, y: 1 },
      { kind: 'cake', x: 'x', y: 3 },
      null,
    ])
    expect(list.length).toBe(1)
    expect(list[0]!.kind).toBe('bed')
    expect(sanitizeLayout('쓰레기')).toEqual([])
  })
})
