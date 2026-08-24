import type { TrackName } from '../core/audio'

/**
 * 놀이 하나가 지켜야 하는 모양.
 *
 * main.ts 는 이 다섯 함수만 안다. 새 놀이를 붙일 때 main 을 고치는 양이
 * 최소가 되도록 — 리온의 대모험에서 게임을 붙일 때마다 main 의 네 군데를
 * 고쳐야 했던 게 불편했다.
 */
export type GameApp = {
  /** 지금 어느 하위 화면인가 (디버그·테스트용) */
  screen: () => string
  /** 허브에서 이 놀이로 들어올 때 */
  enter: () => void
  update: (dt: number) => void
  render: (ctx: CanvasRenderingContext2D, tick: number) => void
  /** 'hub' 를 돌려주면 허브로 나간다 */
  pointerDown: (px: number, py: number) => 'hub' | null
  pointerMove: (px: number, py: number) => void
  pointerUp: (px: number, py: number) => void
  key: (code: string) => void
  /** 뒤로 가기 한 단계 */
  escape: () => 'hub' | 'stay'
  blur: () => void
  /** 허브 카드에 뜨는 진행도 한 줄 */
  label: () => string
  track: () => TrackName
}
