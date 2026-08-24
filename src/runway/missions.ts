/**
 * 패션쇼 미션 20개.
 *
 * "부탁"을 듣고 코디를 맞추는 놀이다. 틀려도 벌이 없다 — 별이 하나 덜
 * 붙을 뿐이고 언제든 다시 할 수 있다(페파피그류 게임의 규칙).
 *
 * 조건은 네 가지 결로 만든다: 정확한 물건 · 칸 채우기 · 색 · 테마.
 * 색과 테마 조건은 여러 옷으로 맞출 수 있어서 아이가 스스로 길을 찾는다.
 */
import type { Category, ColorTag, ThemeTag } from '../doll/kinds'
import { COLOR_NAME, THEME_NAME } from '../doll/kinds'
import { CATEGORIES } from '../doll/kinds'
import { itemById } from '../doll/wardrobe'

export type Requirement =
  | { kind: 'item'; id: string }
  | { kind: 'cat'; cat: Category }
  | { kind: 'color'; color: ColorTag }
  | { kind: 'theme'; theme: ThemeTag }
  | { kind: 'count'; n: number }

export type Mission = {
  id: string
  title: string
  /** 리아가 하는 부탁 */
  ask: string
  emoji: string
  reqs: readonly Requirement[]
}

export const MISSIONS: readonly Mission[] = [
  {
    id: 'm01',
    title: '첫 무대',
    ask: '드레스를 하나 입혀줄래?',
    emoji: '🎀',
    reqs: [{ kind: 'cat', cat: 'dress' }],
  },
  {
    id: 'm02',
    title: '반짝 왕관',
    ask: '드레스에 왕관도 써보고 싶어!',
    emoji: '👑',
    reqs: [{ kind: 'cat', cat: 'dress' }, { kind: 'cat', cat: 'crown' }],
  },
  {
    id: 'm03',
    title: '유리 구두',
    ask: '유리 구두를 신고 춤추고 싶어',
    emoji: '👠',
    reqs: [{ kind: 'item', id: 'shoes-glass' }, { kind: 'cat', cat: 'dress' }],
  },
  {
    id: 'm04',
    title: '파랑 코디',
    ask: '오늘은 파란색이 좋아',
    emoji: '💙',
    reqs: [{ kind: 'color', color: 'blue' }, { kind: 'cat', cat: 'dress' }],
  },
  {
    id: 'm05',
    title: '분홍 공주',
    ask: '분홍색 물건을 하나 걸치고 왕관도!',
    emoji: '🌷',
    reqs: [{ kind: 'color', color: 'pink' }, { kind: 'cat', cat: 'crown' }],
  },
  {
    id: 'm06',
    title: '눈나라 여행',
    ask: '눈나라에 갈 거야. 안 추울까?',
    emoji: '❄️',
    reqs: [{ kind: 'theme', theme: 'snow' }, { kind: 'cat', cat: 'dress' }],
  },
  {
    id: 'm07',
    title: '바닷속 파티',
    ask: '바다 친구들을 만나러 가!',
    emoji: '🐚',
    reqs: [{ kind: 'theme', theme: 'sea' }, { kind: 'cat', cat: 'necklace' }],
  },
  {
    id: 'm08',
    title: '장미 정원',
    ask: '장미 향기 나는 옷차림으로!',
    emoji: '🌹',
    reqs: [
      { kind: 'theme', theme: 'rose' },
      { kind: 'cat', cat: 'dress' },
      { kind: 'cat', cat: 'shoes' },
    ],
  },
  {
    id: 'm09',
    title: '요정 친구',
    ask: '날개를 달고 요정이 되고 싶어',
    emoji: '🦋',
    reqs: [{ kind: 'cat', cat: 'wings' }, { kind: 'theme', theme: 'fairy' }],
  },
  {
    id: 'm10',
    title: '별빛 밤',
    ask: '별빛 아래에서 마법을 부릴 거야',
    emoji: '⭐',
    reqs: [
      { kind: 'theme', theme: 'star' },
      { kind: 'cat', cat: 'wand' },
      { kind: 'cat', cat: 'dress' },
    ],
  },
  {
    id: 'm11',
    title: '황금 무도회',
    ask: '금색으로 반짝반짝하게!',
    emoji: '✨',
    reqs: [
      { kind: 'color', color: 'gold' },
      { kind: 'cat', cat: 'crown' },
      { kind: 'cat', cat: 'gloves' },
    ],
  },
  {
    id: 'm12',
    title: '사막의 공주',
    ask: '뜨거운 사막 궁전으로 가자',
    emoji: '🕌',
    reqs: [
      { kind: 'theme', theme: 'desert' },
      { kind: 'cat', cat: 'necklace' },
      { kind: 'cat', cat: 'shoes' },
    ],
  },
  {
    id: 'm13',
    title: '숲의 요정',
    ask: '숲 냄새 나는 초록 옷이 좋아',
    emoji: '🍃',
    reqs: [
      { kind: 'theme', theme: 'forest' },
      { kind: 'cat', cat: 'wings' },
      { kind: 'cat', cat: 'crown' },
    ],
  },
  {
    id: 'm14',
    title: '눈의 여왕',
    ask: '눈나라 여왕님처럼 꾸며줘',
    emoji: '👸',
    reqs: [
      { kind: 'theme', theme: 'snow' },
      { kind: 'cat', cat: 'cape' },
      { kind: 'cat', cat: 'crown' },
      { kind: 'color', color: 'blue' },
    ],
  },
  {
    id: 'm15',
    title: '빨강 열정',
    ask: '빨간 망토를 두르고 씩씩하게!',
    emoji: '❤️',
    reqs: [
      { kind: 'color', color: 'red' },
      { kind: 'cat', cat: 'cape' },
      { kind: 'cat', cat: 'shoes' },
    ],
  },
  {
    id: 'm16',
    title: '하양 백조',
    ask: '하얀 백조처럼 우아하게',
    emoji: '🕊️',
    reqs: [
      { kind: 'color', color: 'white' },
      { kind: 'cat', cat: 'gloves' },
      { kind: 'cat', cat: 'crown' },
      { kind: 'cat', cat: 'shoes' },
    ],
  },
  {
    id: 'm17',
    title: '보라 마법',
    ask: '보라색 마법 소녀가 될 거야',
    emoji: '🪄',
    reqs: [
      { kind: 'color', color: 'purple' },
      { kind: 'cat', cat: 'wand' },
      { kind: 'cat', cat: 'dress' },
      { kind: 'cat', cat: 'earrings' },
    ],
  },
  {
    id: 'm18',
    title: '궁전 대무도회',
    ask: '궁전에서 제일 예쁜 공주로!',
    emoji: '🏰',
    reqs: [
      { kind: 'theme', theme: 'royal' },
      { kind: 'cat', cat: 'crown' },
      { kind: 'cat', cat: 'necklace' },
      { kind: 'cat', cat: 'gloves' },
      { kind: 'cat', cat: 'shoes' },
    ],
  },
  {
    id: 'm19',
    title: '완벽한 코디',
    ask: '여덟 칸을 채워줄 수 있어?',
    emoji: '🌟',
    reqs: [{ kind: 'count', n: 8 }],
  },
  {
    id: 'm20',
    title: '리아의 대관식',
    ask: '오늘은 내가 여왕이 되는 날이야!',
    emoji: '🏆',
    reqs: [
      { kind: 'theme', theme: 'royal' },
      { kind: 'cat', cat: 'crown' },
      { kind: 'cat', cat: 'cape' },
      { kind: 'cat', cat: 'wand' },
      { kind: 'count', n: 9 },
    ],
  },
]

export function missionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id)
}

const CAT_NAME = new Map(CATEGORIES.map((c) => [c.id, c.name]))
const CAT_ICON = new Map(CATEGORIES.map((c) => [c.id, c.icon]))

/** 조건을 아이가 읽을 수 있는 짧은 말로 */
export function reqLabel(r: Requirement): string {
  switch (r.kind) {
    case 'item':
      return itemById(r.id)?.name ?? r.id
    case 'cat':
      return CAT_NAME.get(r.cat) ?? r.cat
    case 'color':
      return `${COLOR_NAME[r.color]}색`
    case 'theme':
      return THEME_NAME[r.theme]
    case 'count':
      return `${r.n}칸 이상`
  }
}

export function reqIcon(r: Requirement): string {
  switch (r.kind) {
    case 'item':
      return CAT_ICON.get(itemById(r.id)?.cat ?? 'dress') ?? '👗'
    case 'cat':
      return CAT_ICON.get(r.cat) ?? '👗'
    case 'color':
      return '🎨'
    case 'theme':
      return '🗺️'
    case 'count':
      return '🔢'
  }
}
