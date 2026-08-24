/**
 * 놀이 목록.
 *
 * 첫 화면(허브)이 이 목록을 그대로 그린다. 놀이를 늘리려면 여기에 한 줄
 * 넣고 main.ts 에서 그 id 를 라우팅하면 된다 — docs/ADD-GAME.md 참고.
 */
export type GameStatus = 'ready' | 'soon'

export type GameEntry = {
  id: string
  title: string
  /**
   * 카드 한 줄 설명.
   *
   * **개수를 여기 적지 않는다.** 미션이나 옷이 늘 때마다 같이 고쳐야 하고,
   * 실제로 그런 문구는 반드시 옛날 숫자로 남는다. 개수는 진행도 줄이 만든다.
   */
  subtitle: string
  status: GameStatus
  accent: string
  emoji: string
}

export const GAMES: readonly GameEntry[] = [
  {
    id: 'closet',
    title: '공주 옷장',
    subtitle: '드레스와 악세사리로 마음껏 꾸미기',
    status: 'ready',
    accent: '#ff8fc0',
    emoji: '👗',
  },
  {
    id: 'runway',
    title: '패션쇼',
    subtitle: '부탁을 듣고 코디를 맞춰요',
    status: 'ready',
    accent: '#ffd76a',
    emoji: '🎀',
  },
  {
    id: 'crown',
    title: '보석 왕관 공방',
    subtitle: '내 왕관을 만들어 옷장에 넣기',
    status: 'ready',
    accent: '#9fd8ff',
    emoji: '👑',
  },
  {
    id: 'room',
    title: '공주 방 꾸미기',
    subtitle: '가구와 소품을 놓아 방을 완성',
    status: 'ready',
    accent: '#7fe3d4',
    emoji: '🛋️',
  },
  {
    id: 'album',
    title: '스티커 앨범',
    subtitle: '놀면서 모은 스티커를 구경해요',
    status: 'ready',
    accent: '#b48ae0',
    emoji: '🌈',
  },
]

export function gameById(id: string): GameEntry | undefined {
  return GAMES.find((g) => g.id === id)
}

export function firstReadyGame(): string | null {
  return GAMES.find((g) => g.status === 'ready')?.id ?? null
}
