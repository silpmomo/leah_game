/**
 * 일러스트 조각 → Shape.
 *
 * 인형·옷 그림은 MaelleMarylloup 의 CHIBI 팩(itch.io, 무료·상업 가능·단독
 * 재판매 금지)에서 골라 쓴다. 원본은 비공개 저장소(leah_game_assets)에 있고
 * 이 저장소에는 조각 이름과 자리(art.gen.ts)만 있다.
 *
 * 모든 조각은 같은 판(444 x 700) 위에 그려져 있어서, 판을 인형 좌표에
 * 한 번 맞춰 두면 옷이 몸에 저절로 맞는다. 맞추는 값은 build.py 와 같다.
 */
import type { Rect } from '../engine/view'
import type { Shape } from '../engine/shapes'
import { ART, type ArtName } from './art.gen'

export { ART, type ArtName }

/** 원본 판 → 인형 좌표 (tools/build.py 의 K·CX·Y0 와 같아야 한다) */
export const SRC = { k: 0.6875, cx: 225, y0: 40 } as const

/** 원본 판의 한 점을 인형 좌표로 */
export function fromSrc(sx: number, sy: number): [number, number] {
  return [(sx - SRC.cx) * SRC.k + 100, (sy - SRC.y0) * SRC.k]
}

export function isArtName(name: string): name is ArtName {
  return Object.prototype.hasOwnProperty.call(ART, name)
}

/** 조각 하나. tint 를 주면 색조를 돌려 그린다 */
export function art(name: ArtName, tint?: string): Shape {
  const [x, y, w, h] = ART[name]
  return { d: '', img: tint ? { name, x, y, w, h, tint } : { name, x, y, w, h } }
}

export function arts(names: readonly ArtName[]): Shape[] {
  return names.map((n) => art(n))
}

/**
 * 조각들을 감싸는 상자 — 아이템 썸네일 영역.
 *
 * 정사각형에 가깝게 넓히고 여백을 둔다. 작은 귀걸이를 꽉 채워 그리면
 * 무엇인지 알아보기 어렵다.
 */
export function artBounds(names: readonly ArtName[], pad = 6, min = 40): Rect {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const n of names) {
    const [x, y, w, h] = ART[n]
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x + w)
    y1 = Math.max(y1, y + h)
  }
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const side = Math.max(x1 - x0, y1 - y0, min) + pad * 2
  const w = Math.max(x1 - x0 + pad * 2, side * 0.8)
  const h = Math.max(y1 - y0 + pad * 2, side * 0.8)
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}
