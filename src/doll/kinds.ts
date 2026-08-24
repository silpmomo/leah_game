/**
 * 옷 분류와 태그.
 *
 * 패션쇼(미션)가 "파란 옷을 입어줘", "눈나라 느낌으로 꾸며줘" 같은 조건을
 * 걸려면 아이템마다 색·테마를 붙여 둬야 한다. 그림에서 색을 뽑아낼 수는
 * 없으니 데이터로 적는다.
 */
import type { Rect } from '../engine/view'
import type { Shape } from '../engine/shapes'

export type Category =
  | 'dress'
  | 'hair'
  | 'crown'
  | 'shoes'
  | 'necklace'
  | 'gloves'
  | 'cape'
  | 'wings'
  | 'earrings'
  | 'wand'

export type ColorTag =
  | 'pink'
  | 'blue'
  | 'purple'
  | 'white'
  | 'gold'
  | 'red'
  | 'green'
  | 'teal'
  | 'orange'
  | 'silver'
  | 'brown'

export type ThemeTag =
  | 'snow'
  | 'sea'
  | 'rose'
  | 'star'
  | 'flower'
  | 'night'
  | 'desert'
  | 'forest'
  | 'royal'
  | 'fairy'

export type Item = {
  id: string
  cat: Category
  name: string
  color: ColorTag
  theme?: ThemeTag
  /** 몸보다 뒤에 그리는 조각 (망토 천, 긴 머리 뒷부분, 날개) */
  back?: readonly Shape[]
  /** 몸보다 앞에 그리는 조각 */
  front: readonly Shape[]
  /** 팔보다 앞에 그리는 조각 (드레스 소매·장갑) */
  sleeves?: readonly Shape[]
  /** 썸네일에서 잘라 보여줄 인형 좌표 영역 */
  thumb: Rect
  /** 왕관 공방에서 만든 왕관처럼 플레이어가 만든 아이템 */
  custom?: boolean
}

export const CATEGORIES: readonly {
  id: Category
  name: string
  icon: string
}[] = [
  { id: 'dress', name: '드레스', icon: '👗' },
  { id: 'hair', name: '머리', icon: '💇' },
  { id: 'crown', name: '왕관', icon: '👑' },
  { id: 'shoes', name: '구두', icon: '👠' },
  { id: 'necklace', name: '목걸이', icon: '📿' },
  { id: 'gloves', name: '장갑', icon: '🧤' },
  { id: 'cape', name: '망토', icon: '🧣' },
  { id: 'wings', name: '날개', icon: '🦋' },
  { id: 'earrings', name: '귀걸이', icon: '💎' },
  { id: 'wand', name: '소품', icon: '🪄' },
]

export const COLOR_NAME: Record<ColorTag, string> = {
  pink: '분홍',
  blue: '파랑',
  purple: '보라',
  white: '하양',
  gold: '금색',
  red: '빨강',
  green: '초록',
  teal: '청록',
  orange: '주황',
  silver: '은색',
  brown: '갈색',
}

export const THEME_NAME: Record<ThemeTag, string> = {
  snow: '눈나라',
  sea: '바다',
  rose: '장미',
  star: '별빛',
  flower: '꽃',
  night: '밤하늘',
  desert: '사막',
  forest: '숲',
  royal: '궁전',
  fairy: '요정',
}

/** 색 태그를 화면에 칠할 때 쓰는 대표색 */
export const COLOR_SWATCH: Record<ColorTag, string> = {
  pink: '#f48fb1',
  blue: '#7ab8f5',
  purple: '#b48ae0',
  white: '#f5f0f7',
  gold: '#f0c04a',
  red: '#e2596b',
  green: '#7cc47f',
  teal: '#4fc3c0',
  orange: '#f0a05a',
  silver: '#cfd6e2',
  brown: '#8a5f4a',
}
