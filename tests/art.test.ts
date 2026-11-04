import { describe, expect, it } from 'vitest'
import { ART, SRC, art, artBounds, fromSrc, isArtName } from '../src/doll/art'
import { BASE_HAIR, HAIR_SHADES, hairLayers } from '../src/doll/body'
import { XF, placed, xfPoint } from '../src/doll/fit'
import { composeDoll } from '../src/doll/outfit'
import { itemById } from '../src/doll/wardrobe'
import { retintPixels, rgbToHsl } from '../src/engine/color'

describe('일러스트 조각', () => {
  it('원본 판의 기준점이 인형 가운데 위에 온다', () => {
    expect(fromSrc(SRC.cx, SRC.y0)).toEqual([100, 0])
    // 판 높이 700 이 인형 높이 안에 거의 들어간다
    expect(fromSrc(SRC.cx, 680)[1]).toBeCloseTo(440, 0)
  })

  it('조각은 art.gen.ts 의 자리를 그대로 쓴다', () => {
    const s = art('body')
    expect(s.d).toBe('')
    expect([s.img!.x, s.img!.y, s.img!.w, s.img!.h]).toEqual([...ART.body])
    expect(art('body', '#ff0000').img!.tint).toBe('#ff0000')
  })

  it('isArtName 은 목록에 있는 이름만 받는다', () => {
    expect(isArtName('body')).toBe(true)
    expect(isArtName('toString')).toBe(false)
    expect(isArtName('없는그림')).toBe(false)
  })

  it('썸네일 영역은 조각을 감싸고 너무 납작하지 않다', () => {
    const r = artBounds(['ear-ring1'])
    const [x, y, w, h] = ART['ear-ring1']
    expect(r.x).toBeLessThanOrEqual(x)
    expect(r.y).toBeLessThanOrEqual(y)
    expect(r.x + r.w).toBeGreaterThanOrEqual(x + w)
    expect(r.y + r.h).toBeGreaterThanOrEqual(y + h)
    expect(r.w / r.h).toBeGreaterThan(0.6)
    expect(r.w / r.h).toBeLessThan(1.7)
  })
})

describe('머리 색', () => {
  it('팩 머리는 여덟 색 그림이 모두 있다', () => {
    for (let style = 1; style <= 12; style++) {
      for (let shade = 0; shade < HAIR_SHADES.length; shade++) {
        const { back, front } = hairLayers({ style, bangs: 1 }, shade)
        for (const s of [...back, ...front]) expect(isArtName(s.img!.name)).toBe(true)
      }
    }
  })

  it('머리 견본을 고르면 같은 머리의 다른 색 그림으로 바뀐다', () => {
    const plain = composeDoll({})
    const blond = composeDoll({}, { tints: { hair: 4 } })
    const names = (l: typeof plain) => l.map((s) => s.img?.name).filter(Boolean)
    expect(names(plain)).toContain(`hair${BASE_HAIR.style}`)
    expect(names(blond)).toContain(`hair${BASE_HAIR.style}e`)
    expect(names(blond)).not.toContain(`hair${BASE_HAIR.style}`)
  })

  it('팩 머리가 아닌 머리는 색조를 돌린다', () => {
    const rainbow = itemById('hair-rainbow-pink')!
    const s = composeDoll({ hair: rainbow.id }, { tints: { hair: 2 } })
    const hair = s.find((x) => x.img?.name === 'party-hair2')!
    expect(hair.img!.tint).toBe(HAIR_SHADES[2]!.css)
  })
})

describe('벡터 소품 옮기기', () => {
  it('XF 는 점과 조각에 같은 값을 쓴다', () => {
    const [k, dx, dy] = XF.crown
    expect(xfPoint(XF.crown, 100, 26)).toEqual([dx + 100 * k, dy + 26 * k])
    const moved = placed([{ d: 'M0,0L1,1', stroke: '#000', lw: 1 }], XF.crown)
    expect(moved[0]!.xf).toEqual(XF.crown)
  })

  it('왕관 띠 가운데가 머리 위쪽에 온다', () => {
    const [x, y] = xfPoint(XF.crown, 100, 26)
    expect(x).toBeCloseTo(100, 0)
    expect(y).toBeGreaterThan(30)
    expect(y).toBeLessThan(110)
  })
})

describe('그림 색조 돌리기', () => {
  const px = (r: number, g: number, b: number): Uint8ClampedArray => new Uint8ClampedArray([r, g, b, 255])

  it('유채색은 목표 색조로 간다', () => {
    const d = px(220, 120, 160)
    retintPixels(d, '#4a83c8')
    const h = rgbToHsl({ r: d[0]!, g: d[1]!, b: d[2]!, a: 1 }).h
    expect(Math.abs(h - rgbToHsl({ r: 0x4a, g: 0x83, b: 0xc8, a: 1 }).h)).toBeLessThan(0.02)
  })

  it('검은 선·흰 반사광·투명 픽셀은 그대로 둔다', () => {
    const line = px(30, 25, 28)
    const white = px(250, 250, 250)
    const clear = new Uint8ClampedArray([200, 50, 50, 0])
    retintPixels(line, '#4a83c8')
    retintPixels(white, '#4a83c8')
    retintPixels(clear, '#4a83c8')
    expect([...line]).toEqual([30, 25, 28, 255])
    expect([...white]).toEqual([250, 250, 250, 255])
    expect([...clear]).toEqual([200, 50, 50, 0])
  })
})
