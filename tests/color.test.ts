/**
 * 색조 돌리기 검사.
 *
 * 색 견본은 "같은 옷을 다른 색으로" 보여 줘야 한다. 흰 레이스는 남고,
 * 본 색만 목표 색조로 가야 한다.
 */
import { describe, expect, it } from 'vitest'
import { hslToRgb, parseColor, retint, rgbToHsl, tintShapes, toCss } from '../src/engine/color'
import { SWATCHES, TINTABLE, sanitizeTints, swatchColor, tintFor } from '../src/doll/tint'
import { itemsOf } from '../src/doll/wardrobe'
import { composeDoll } from '../src/doll/outfit'

describe('색 읽기·쓰기', () => {
  it('hex 와 rgba 를 읽는다', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor('#7ab8f5')).toEqual({ r: 122, g: 184, b: 245, a: 1 })
    expect(parseColor('rgba(255,255,255,.5)')).toEqual({ r: 255, g: 255, b: 255, a: 0.5 })
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ r: 1, g: 2, b: 3, a: 1 })
    expect(parseColor('없는색')).toBeNull()
  })

  it('hsl 왕복이 색을 보존한다', () => {
    for (const css of ['#7ab8f5', '#e2596b', '#f0c04a', '#2b1d18']) {
      const c = parseColor(css)!
      const back = hslToRgb(rgbToHsl(c))
      expect(Math.abs(back.r - c.r)).toBeLessThanOrEqual(1)
      expect(Math.abs(back.g - c.g)).toBeLessThanOrEqual(1)
      expect(Math.abs(back.b - c.b)).toBeLessThanOrEqual(1)
    }
    expect(toCss({ r: 255, g: 0, b: 16, a: 1 })).toBe('#ff0010')
    expect(toCss({ r: 1, g: 2, b: 3, a: 0.5 })).toBe('rgba(1,2,3,0.5)')
  })
})

describe('색조 돌리기', () => {
  const red = rgbToHsl(parseColor('#e2596b')!)

  it('파란 옷감이 빨간 색조로 간다', () => {
    const out = rgbToHsl(parseColor(retint('#7ab8f5', red))!)
    expect(Math.abs(out.h - red.h)).toBeLessThan(0.03)
  })

  it('흰색·회색은 그대로 둔다 (레이스가 살아남는다)', () => {
    expect(retint('#ffffff', red)).toBe('#ffffff')
    expect(retint('rgba(255,255,255,.6)', red)).toBe('rgba(255,255,255,.6)')
    expect(retint('#cfd6e2', red)).toBe('#cfd6e2')
  })

  it('투명도를 보존한다', () => {
    expect(parseColor(retint('rgba(122,184,245,.4)', red))!.a).toBeCloseTo(0.4)
  })

  it('무채색 견본은 채도를 빼고 밝기를 당긴다', () => {
    const black = rgbToHsl(parseColor('#2a2a2a')!)
    const out = rgbToHsl(parseColor(retint('#7ab8f5', black))!)
    expect(out.s).toBeLessThan(0.1)
    expect(out.l).toBeLessThan(rgbToHsl(parseColor('#7ab8f5')!).l)
  })

  it('그라데이션의 모든 단계를 돌리고 경로는 건드리지 않는다', () => {
    const shapes = [
      { d: 'M0,0L1,1', fill: { kind: 'linear' as const, x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, '#7ab8f5'], [1, '#2a5aa0']] as const } },
      { d: 'M1,1L2,2', stroke: '#7ab8f5', lw: 2 },
    ]
    const out = tintShapes(shapes, '#e2596b')
    expect(out[0]!.d).toBe('M0,0L1,1')
    const f = out[0]!.fill as { stops: readonly (readonly [number, string])[] }
    for (const [, c] of f.stops) {
      expect(Math.abs(rgbToHsl(parseColor(c)!).h - red.h)).toBeLessThan(0.03)
    }
    expect(out[1]!.stroke).not.toBe('#7ab8f5')
  })
})

describe('색 견본', () => {
  it('바꿀 수 있는 분류마다 여섯 색이 있다', () => {
    for (const cat of TINTABLE) expect(SWATCHES[cat]!.length).toBe(6)
    expect(swatchColor('dress', 0)).toBeNull()
    expect(swatchColor('dress', 1)).toBe(SWATCHES.dress![0])
    expect(swatchColor('dress', 99)).toBeNull()
    expect(swatchColor('crown', 1)).toBeNull()
  })

  it('깨진 저장값을 걸러낸다', () => {
    expect(sanitizeTints({ dress: 3, hair: 0, shoes: 'x', crown: 2, cape: 99 })).toEqual({ dress: 3 })
    expect(sanitizeTints(null)).toEqual({})
    expect(sanitizeTints({ dress: 2.7 })).toEqual({ dress: 2 })
  })

  it('견본이 없으면 조각을 그대로 돌려준다', () => {
    const dress = itemsOf('dress')[0]!
    expect(tintFor('dress', {}, dress.front)).toBe(dress.front)
    expect(tintFor('dress', { dress: 1 }, dress.front)).not.toBe(dress.front)
    expect(tintFor('dress', { dress: 1 }, dress.front).length).toBe(dress.front.length)
  })

  it('인형 전체에서 드레스 조각만 색이 바뀐다', () => {
    const outfit = { dress: itemsOf('dress')[0]!.id, hair: itemsOf('hair')[0]!.id }
    const plain = composeDoll(outfit)
    const tinted = composeDoll(outfit, { tints: { dress: 2 } })
    expect(tinted.length).toBe(plain.length)
    let changed = 0
    for (let i = 0; i < plain.length; i++) {
      expect(tinted[i]!.d).toBe(plain[i]!.d)
      if (JSON.stringify(tinted[i]!.fill) !== JSON.stringify(plain[i]!.fill)) changed += 1
    }
    expect(changed).toBeGreaterThan(0)
    expect(changed).toBeLessThan(plain.length / 2)
  })
})
