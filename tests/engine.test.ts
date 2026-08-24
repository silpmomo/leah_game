import { describe, expect, it } from 'vitest'
import { createRng } from '../src/engine/rng'
import { burst, fadeOf, rain, sparkleAt, stepParticles } from '../src/engine/particles'
import { clamp, gridRect, inRect, progress01, slotRect, VIEW_H, VIEW_W } from '../src/engine/view'
import { createLoop } from '../src/core/loop'
import { pickDpr, pickScale, createPerfWatch } from '../src/perf'

describe('난수', () => {
  it('같은 씨앗이면 같은 값이 나온다', () => {
    const a = createRng(7)
    const b = createRng(7)
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next())
  })

  it('0 이상 1 미만', () => {
    const r = createRng(3)
    for (let i = 0; i < 500; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int 는 범위를 벗어나지 않는다', () => {
    const r = createRng(11)
    for (let i = 0; i < 200; i++) {
      const v = r.int(5)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(5)
    }
    expect(r.int(0)).toBe(0)
  })

  it('씨앗 0 도 견딘다', () => {
    expect(() => createRng(0).next()).not.toThrow()
  })

  it('빈 배열에서 골라도 터지지 않는다', () => {
    expect(() => createRng(1).pick([])).not.toThrow()
  })
})

describe('축하 가루', () => {
  it('터뜨린 만큼 만들어진다', () => {
    expect(burst(createRng(1), 100, 100, 12).length).toBe(12)
    expect(rain(createRng(2), 360, 30).length).toBe(30)
    expect(sparkleAt(createRng(3), 50, 50, 8).length).toBe(8)
  })

  it('시간이 지나면 사라진다', () => {
    let ps = burst(createRng(4), 0, 0, 10)
    for (let i = 0; i < 200; i++) ps = stepParticles(ps, 1 / 60)
    expect(ps.length).toBe(0)
  })

  it('무거운 조각은 아래로 떨어진다', () => {
    const one = burst(createRng(5), 0, 0, 30).filter((p) => p.heavy)[0]!
    let ps = [one]
    for (let i = 0; i < 40; i++) ps = stepParticles(ps, 1 / 60)
    expect(ps[0]!.vy).toBeGreaterThan(one.vy)
  })

  it('원본 배열을 건드리지 않는다', () => {
    const ps = burst(createRng(6), 0, 0, 5)
    const before = ps[0]!.x
    stepParticles(ps, 0.1)
    expect(ps[0]!.x).toBe(before)
  })

  it('흐려짐은 1 에서 0 으로 간다', () => {
    const p = burst(createRng(7), 0, 0, 1)[0]!
    expect(fadeOf(p)).toBeCloseTo(1, 5)
    expect(fadeOf({ ...p, life: 0 })).toBe(0)
  })
})

describe('화면 계산', () => {
  it('사각형 안팎 판정', () => {
    const r = { x: 10, y: 10, w: 20, h: 20 }
    expect(inRect(r, 15, 15)).toBe(true)
    expect(inRect(r, 9, 15)).toBe(false)
    expect(inRect(r, 30, 30)).toBe(true)
  })

  it('가로 분할은 화면을 넘지 않는다', () => {
    for (let n = 1; n <= 6; n++) {
      const last = slotRect(n - 1, n, 0, 40)
      expect(last.x + last.w).toBeLessThanOrEqual(VIEW_W)
    }
  })

  it('격자는 열 수에 맞춰 접힌다', () => {
    const a = gridRect(0, 3, 0, 0, 10, 10, 2, 2)
    const b = gridRect(3, 3, 0, 0, 10, 10, 2, 2)
    expect(a.x).toBe(b.x)
    expect(b.y).toBe(12)
  })

  it('clamp 와 진행도', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-5, 0, 3)).toBe(0)
    expect(progress01(5, 10)).toBe(0.5)
    expect(progress01(5, 0)).toBe(0)
    expect(progress01(50, 10)).toBe(1)
  })

  it('배율은 세로 화면을 꽉 채운다', () => {
    // 좁고 긴 화면이면 가로에 맞춘다
    expect(pickScale(360, 900)).toBeCloseTo(1, 5)
    expect(pickScale(720, 1280)).toBeCloseTo(2, 5)
    expect(pickScale(180, 640)).toBeCloseTo(0.5, 5)
    expect(pickScale(VIEW_W, VIEW_H)).toBe(1)
  })

  it('픽셀 밀도는 2 를 넘지 않는다', () => {
    expect(pickDpr(3, false)).toBe(2)
    expect(pickDpr(1.5, false)).toBe(1.5)
    expect(pickDpr(3, true)).toBe(1)
    expect(pickDpr(0, false)).toBe(1)
  })
})

describe('루프', () => {
  it('고정 timestep 으로 부른다', () => {
    let updates = 0
    let renders = 0
    const loop = createLoop({
      update: () => {
        updates += 1
      },
      render: () => {
        renders += 1
      },
    })
    // 시각은 정수 ms 로 준다. 16.666… 을 쓰면 누적 오차 때문에
    // 마지막 한 걸음이 들쭉날쭉해져 테스트가 흔들린다.
    loop.tick(0) // 첫 tick 은 기준 시각만 잡는다
    expect(updates).toBe(0)
    expect(renders).toBe(1)
    loop.tick(17)
    expect(updates).toBe(1)
    loop.tick(51)
    expect(updates).toBe(3)
  })

  it('오래 멈췄다 돌아와도 폭주하지 않는다', () => {
    let updates = 0
    const loop = createLoop({ update: () => (updates += 1), render: () => {} })
    loop.tick(0)
    loop.tick(10_000)
    expect(updates).toBeLessThanOrEqual(5)
  })

  it('reset 하면 시간 간격을 다시 잡는다', () => {
    let updates = 0
    const loop = createLoop({ update: () => (updates += 1), render: () => {} })
    loop.tick(0)
    loop.reset()
    loop.tick(5000)
    expect(updates).toBe(0)
  })
})

describe('성능 감시', () => {
  it('계속 느리면 한 번만 하향을 요청한다', () => {
    const w = createPerfWatch()
    let asked = 0
    for (let i = 0; i < 400; i++) if (w.sample(40)) asked += 1
    expect(asked).toBe(1)
  })

  it('빠르면 요청하지 않는다', () => {
    const w = createPerfWatch()
    for (let i = 0; i < 400; i++) expect(w.sample(16)).toBe(false)
  })
})
