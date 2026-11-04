/**
 * 벡터 소품 → 일러스트 인형 자리 맞추기.
 *
 * 왕관·날개·지팡이는 예전 8등신 인형 좌표(벡터 틀)로 그려져 있다.
 * 다시 그리는 대신 [배율, dx, dy] 한 벌로 치비 인형의 머리·등·손에 옮긴다.
 * 왕관 공방이 보석 칸을 두드릴 때도 같은 값을 써야 칸이 어긋나지 않는다.
 */
import type { Shape } from '../engine/shapes'

export type Xf = readonly [number, number, number]

export const XF = {
  /** 벡터 틀의 왕관 띠(78..122, y 26~50) → 치비 머리 위 */
  crown: [2.1, -110, 6],
  /** 날개 — 등 가운데, 어깨 높이 */
  wings: [1.25, -25, 82],
  /** 오른손(130, 226) → 치비 오른손 */
  wand: [1.45, -10.8, -27.9],
} as const satisfies Record<string, Xf>

export function placed(shapes: readonly Shape[], xf: Xf): Shape[] {
  return shapes.map((s) => ({ ...s, xf }))
}

/** 벡터 틀의 한 점 → 인형 좌표 */
export function xfPoint(xf: Xf, x: number, y: number): [number, number] {
  return [xf[1] + x * xf[0], xf[2] + y * xf[0]]
}

/** 벡터 틀의 상자 → 인형 좌표 */
export function xfRect(xf: Xf, r: { x: number; y: number; w: number; h: number }) {
  const [x, y] = xfPoint(xf, r.x, r.y)
  return { x, y, w: r.w * xf[0], h: r.h * xf[0] }
}
