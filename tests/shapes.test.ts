import { describe, expect, it } from 'vitest'
import {
  arcPath,
  circlePath,
  dropPath,
  ellipsePath,
  flowerPath,
  gemPath,
  heartPath,
  mergePaths,
  polyPath,
  rectPath,
  rrectPath,
  skirtPath,
  sparklePath,
  starPath,
} from '../src/engine/shapes'

/** SVG 경로에 NaN 이나 undefined 가 섞이면 브라우저가 조용히 아무것도 안 그린다 */
function isClean(d: string): boolean {
  return d.length > 0 && !/NaN|undefined|Infinity/.test(d)
}

describe('경로 생성기', () => {
  it('모든 생성기가 깨끗한 경로를 만든다', () => {
    const paths = [
      circlePath(10, 10, 5),
      ellipsePath(10, 10, 5, 7),
      rectPath(0, 0, 10, 10),
      rrectPath(0, 0, 20, 10, 4),
      polyPath([0, 0, 10, 0, 5, 8]),
      starPath(10, 10, 6, 3),
      heartPath(10, 10, 5),
      dropPath(10, 10, 6, 9),
      gemPath(10, 10, 8, 10),
      flowerPath(10, 10, 6, 5),
      skirtPath(100, 180, 50, 280, 140, 5, 6),
      arcPath(0, 0, 10, 10, 4),
      sparklePath(10, 10, 5),
    ]
    for (const d of paths) expect(isClean(d)).toBe(true)
  })

  it('닫힌 도형은 Z 로 끝난다', () => {
    for (const d of [circlePath(1, 1, 1), rrectPath(0, 0, 4, 4, 1), starPath(0, 0, 4, 2)]) {
      expect(d.endsWith('Z')).toBe(true)
    }
  })

  it('열린 경로(호)는 닫히지 않는다', () => {
    expect(arcPath(0, 0, 10, 0, 3).endsWith('Z')).toBe(false)
  })

  it('점이 모자란 다각형은 빈 문자열이다', () => {
    expect(polyPath([1, 2])).toBe('')
  })

  it('둥근 모서리는 반지름이 상자를 넘지 않는다', () => {
    // r=100 을 줘도 8x8 상자를 벗어나면 안 된다
    expect(isClean(rrectPath(0, 0, 8, 8, 100))).toBe(true)
    expect(rrectPath(0, 0, 8, 8, 100)).toContain('4,4')
  })

  it('치마는 물결 수만큼 Q 명령을 낸다', () => {
    const d = skirtPath(100, 180, 50, 280, 140, 4, 6)
    expect((d.match(/Q/g) ?? []).length).toBe(4)
    // 물결이 없으면 밑단이 직선이다
    expect(skirtPath(100, 180, 50, 280, 140, 0, 0)).toContain('L')
  })

  it('mergePaths 는 빈 조각을 버린다', () => {
    expect(mergePaths('M0,0', '', 'M1,1')).toBe('M0,0M1,1')
  })

  it('별의 꼭짓점 수는 points 의 두 배다', () => {
    const d = starPath(0, 0, 10, 4, 6)
    // M 한 번 + L 열한 번 = 점 12개
    expect((d.match(/L/g) ?? []).length).toBe(11)
  })
})
