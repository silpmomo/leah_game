/**
 * 공주 방 가구.
 *
 * 각 가구는 놓을 자리(x, y)를 받아 조각을 만든다. y 는 물건의 **밑바닥**
 * 이다. 그래야 y 로 정렬만 해도 앞뒤가 맞는다.
 *
 * 벽에 걸리는 물건(거울·액자·커튼·샹들리에)은 바닥 물건과 y 범위가 다르다.
 * 침대가 벽에 붙어 떠 있으면 아이가 이상하다고 느낀다.
 */
import {
  arcPath,
  circlePath,
  ellipsePath,
  flowerPath,
  heartPath,
  linear,
  polyPath,
  rectPath,
  rrectPath,
  starPath,
  type Shape,
} from '../engine/shapes'

export type FurnitureKind =
  | 'bed'
  | 'vanity'
  | 'mirror'
  | 'chandelier'
  | 'curtain'
  | 'rug'
  | 'plant'
  | 'teatable'
  | 'cake'
  | 'puppy'
  | 'teddy'
  | 'picture'
  | 'lamp'
  | 'throne'
  | 'balloon'
  | 'wardrobe'

export type Furniture = {
  kind: FurnitureKind
  name: string
  icon: string
  /** 벽에 거는 물건인가 */
  onWall: boolean
  /** 두드림 판정 상자 (x 중심 기준 반폭, y 밑바닥 기준 높이) */
  halfW: number
  height: number
  build: (x: number, y: number) => Shape[]
}

const WOOD = '#b07a52'
const WOOD_DARK = '#8a5b3a'
const GOLD = '#f0c04a'
const PINK = '#f4a7c3'
const CREAM = '#fff3e2'

export const FURNITURE: readonly Furniture[] = [
  {
    kind: 'bed',
    name: '공주 침대',
    icon: '🛏️',
    onWall: false,
    halfW: 52,
    height: 60,
    build: (x, y) => [
      { d: rrectPath(x - 50, y - 26, 100, 24, 8), fill: '#f7d9e6' },
      { d: rrectPath(x - 50, y - 12, 100, 12, 6), fill: WOOD },
      { d: rrectPath(x - 52, y - 58, 20, 56, 8), fill: WOOD_DARK },
      { d: rrectPath(x + 32, y - 44, 20, 42, 8), fill: WOOD_DARK },
      { d: rrectPath(x - 44, y - 36, 30, 14, 7), fill: '#ffffff' },
      { d: rrectPath(x - 10, y - 30, 56, 10, 5), fill: PINK },
      { d: heartPath(x - 40, y - 48, 7), fill: PINK },
    ],
  },
  {
    kind: 'vanity',
    name: '화장대',
    icon: '🪞',
    onWall: false,
    halfW: 30,
    height: 74,
    build: (x, y) => [
      { d: ellipsePath(x, y - 54, 24, 26), fill: '#dff0ff' },
      { d: ellipsePath(x, y - 54, 24, 26), stroke: GOLD, lw: 3 },
      { d: rrectPath(x - 28, y - 28, 56, 12, 4), fill: WOOD },
      { d: rrectPath(x - 24, y - 16, 8, 16, 3), fill: WOOD_DARK },
      { d: rrectPath(x + 16, y - 16, 8, 16, 3), fill: WOOD_DARK },
      { d: rrectPath(x - 14, y - 24, 12, 8, 3), fill: PINK },
      { d: circlePath(x + 10, y - 32, 4), fill: '#ff8fc0' },
    ],
  },
  {
    kind: 'mirror',
    name: '큰 거울',
    icon: '🪟',
    onWall: true,
    halfW: 24,
    height: 62,
    build: (x, y) => [
      { d: rrectPath(x - 22, y - 60, 44, 60, 20), fill: GOLD },
      {
        d: rrectPath(x - 17, y - 55, 34, 50, 16),
        fill: linear(x, y - 55, x, y, [
          [0, '#eaf6ff'],
          [1, '#bcd8ee'],
        ]),
      },
      { d: arcPath(x - 10, y - 44, x + 6, y - 20, 8), stroke: 'rgba(255,255,255,.8)', lw: 3 },
      { d: starPath(x, y - 64, 5, 2), fill: GOLD },
    ],
  },
  {
    kind: 'chandelier',
    name: '샹들리에',
    icon: '💡',
    onWall: true,
    halfW: 26,
    height: 46,
    build: (x, y) => [
      { d: `M${x},${y - 46}L${x},${y - 30}`, stroke: GOLD, lw: 2.4 },
      { d: ellipsePath(x, y - 24, 24, 12), fill: 'rgba(255,225,150,.85)' },
      { d: circlePath(x, y - 24, 6), fill: '#fff6c9' },
      { d: circlePath(x - 16, y - 12, 4.5), fill: '#ffe9a8' },
      { d: circlePath(x, y - 8, 5), fill: '#ffe9a8' },
      { d: circlePath(x + 16, y - 12, 4.5), fill: '#ffe9a8' },
      { d: starPath(x - 24, y - 30, 4, 1.6, 4), fill: '#fff6c9' },
    ],
  },
  {
    kind: 'curtain',
    name: '창문과 커튼',
    icon: '🪟',
    onWall: true,
    halfW: 34,
    height: 96,
    build: (x, y) => [
      // 창을 함께 그린다. 커튼만 그렸더니 벽에 붙은 게 아니라
      // 공중에 뜬 천처럼 보였다
      { d: rrectPath(x - 26, y - 88, 52, 76, 6), fill: '#cfe9ff' },
      { d: rrectPath(x - 26, y - 88, 52, 76, 6), stroke: '#ffffff', lw: 3 },
      { d: `M${x},${y - 88}L${x},${y - 12}`, stroke: '#ffffff', lw: 3 },
      { d: `M${x - 26},${y - 50}L${x + 26},${y - 50}`, stroke: '#ffffff', lw: 3 },
      { d: rrectPath(x - 34, y - 96, 68, 6, 3), fill: GOLD },
      {
        d: `M${x - 32},${y - 92}C${x - 40},${y - 50} ${x - 30},${y - 20} ${x - 22},${y}L${x - 8},${y}C${x - 16},${y - 30} ${x - 18},${y - 60} ${x - 14},${y - 92}Z`,
        fill: '#e9a8c4',
      },
      {
        d: `M${x + 32},${y - 92}C${x + 40},${y - 50} ${x + 30},${y - 20} ${x + 22},${y}L${x + 8},${y}C${x + 16},${y - 30} ${x + 18},${y - 60} ${x + 14},${y - 92}Z`,
        fill: '#e9a8c4',
      },
      { d: circlePath(x - 22, y - 44, 4), fill: GOLD },
      { d: circlePath(x + 22, y - 44, 4), fill: GOLD },
    ],
  },
  {
    kind: 'rug',
    name: '동그란 러그',
    icon: '🟣',
    onWall: false,
    halfW: 46,
    height: 20,
    build: (x, y) => [
      { d: ellipsePath(x, y - 8, 46, 17), fill: '#c9a8f0' },
      { d: ellipsePath(x, y - 8, 34, 12), fill: '#e2d0f7' },
      { d: ellipsePath(x, y - 8, 18, 6.5), fill: '#fff0f8' },
    ],
  },
  {
    kind: 'plant',
    name: '꽃 화분',
    icon: '🪴',
    onWall: false,
    halfW: 18,
    height: 54,
    build: (x, y) => [
      { d: polyPath([x - 14, y - 18, x + 14, y - 18, x + 10, y, x - 10, y]), fill: '#d98a5e' },
      { d: rrectPath(x - 15, y - 22, 30, 6, 3), fill: '#e89a6e' },
      { d: `M${x},${y - 20}L${x},${y - 40}`, stroke: '#5fae67', lw: 3 },
      { d: flowerPath(x, y - 44, 12, 5), fill: '#ff9ec4' },
      { d: circlePath(x, y - 44, 4), fill: '#ffe9a8' },
      { d: `M${x - 4},${y - 30}Q${x - 14},${y - 34} ${x - 16},${y - 26}`, stroke: '#5fae67', lw: 2.6 },
      { d: `M${x + 4},${y - 34}Q${x + 14},${y - 38} ${x + 16},${y - 30}`, stroke: '#5fae67', lw: 2.6 },
    ],
  },
  {
    kind: 'teatable',
    name: '티테이블',
    icon: '🫖',
    onWall: false,
    halfW: 30,
    height: 42,
    build: (x, y) => [
      { d: ellipsePath(x, y - 26, 28, 9), fill: CREAM },
      { d: rrectPath(x - 3, y - 26, 6, 24, 3), fill: WOOD },
      { d: ellipsePath(x, y - 2, 16, 5), fill: WOOD_DARK },
      { d: rrectPath(x - 14, y - 38, 14, 11, 4), fill: '#ffffff' },
      { d: `M${x},${y - 34}Q${x + 6},${y - 32} ${x},${y - 29}`, stroke: '#ffffff', lw: 2.4 },
      { d: circlePath(x + 14, y - 30, 5), fill: '#f7d9e6' },
    ],
  },
  {
    kind: 'cake',
    name: '딸기 케이크',
    icon: '🎂',
    onWall: false,
    halfW: 20,
    height: 40,
    build: (x, y) => [
      { d: ellipsePath(x, y - 2, 20, 6), fill: '#e0d0e8' },
      { d: rrectPath(x - 18, y - 22, 36, 20, 5), fill: '#fff0f5' },
      { d: rrectPath(x - 14, y - 32, 28, 12, 4), fill: '#ffe0ec' },
      { d: circlePath(x - 8, y - 34, 4), fill: '#e2596b' },
      { d: circlePath(x + 6, y - 35, 4), fill: '#e2596b' },
      { d: `M${x},${y - 40}L${x},${y - 34}`, stroke: GOLD, lw: 2 },
      { d: ellipsePath(x, y - 42, 2.4, 4), fill: '#ffd76a' },
    ],
  },
  {
    kind: 'puppy',
    name: '강아지 친구',
    icon: '🐶',
    onWall: false,
    halfW: 20,
    height: 34,
    build: (x, y) => [
      { d: ellipsePath(x - 2, y - 12, 17, 11), fill: '#f2d9b8' },
      { d: circlePath(x + 12, y - 22, 11), fill: '#f7e3c8' },
      { d: ellipsePath(x + 6, y - 30, 5, 7), fill: '#d9b48a' },
      { d: ellipsePath(x + 18, y - 30, 5, 7), fill: '#d9b48a' },
      { d: circlePath(x + 10, y - 23, 1.8), fill: '#3a2418' },
      { d: circlePath(x + 16, y - 23, 1.8), fill: '#3a2418' },
      { d: ellipsePath(x + 13, y - 18, 3, 2.2), fill: '#3a2418' },
      { d: `M${x - 18},${y - 16}Q${x - 24},${y - 26} ${x - 16},${y - 28}`, stroke: '#f2d9b8', lw: 5, cap: 'round' },
      { d: ellipsePath(x - 6, y - 2, 5, 3), fill: '#e8cba8' },
      { d: ellipsePath(x + 8, y - 2, 5, 3), fill: '#e8cba8' },
    ],
  },
  {
    kind: 'teddy',
    name: '곰인형',
    icon: '🧸',
    onWall: false,
    halfW: 16,
    height: 36,
    build: (x, y) => [
      { d: ellipsePath(x, y - 12, 13, 12), fill: '#c9925e' },
      { d: circlePath(x, y - 26, 11), fill: '#d9a06a' },
      { d: circlePath(x - 9, y - 34, 5), fill: '#c9925e' },
      { d: circlePath(x + 9, y - 34, 5), fill: '#c9925e' },
      { d: ellipsePath(x, y - 23, 5, 4), fill: '#f2d9b8' },
      { d: circlePath(x - 4, y - 28, 1.6), fill: '#3a2418' },
      { d: circlePath(x + 4, y - 28, 1.6), fill: '#3a2418' },
      { d: circlePath(x, y - 23, 1.4), fill: '#3a2418' },
      { d: heartPath(x, y - 12, 4), fill: PINK },
      { d: ellipsePath(x - 12, y - 4, 5, 3.4), fill: '#c9925e' },
      { d: ellipsePath(x + 12, y - 4, 5, 3.4), fill: '#c9925e' },
    ],
  },
  {
    kind: 'picture',
    name: '리아 액자',
    icon: '🖼️',
    onWall: true,
    halfW: 20,
    height: 34,
    build: (x, y) => [
      { d: rrectPath(x - 19, y - 34, 38, 34, 5), fill: GOLD },
      { d: rrectPath(x - 15, y - 30, 30, 26, 3), fill: '#ffe9f2' },
      { d: circlePath(x, y - 22, 6), fill: '#ffe0cb' },
      { d: `M${x - 7},${y - 26}Q${x},${y - 32} ${x + 7},${y - 26}`, fill: '#2b1d18' },
      { d: polyPath([x - 8, y - 8, x, y - 16, x + 8, y - 8]), fill: PINK },
    ],
  },
  {
    kind: 'lamp',
    name: '분홍 램프',
    icon: '🛋️',
    onWall: false,
    halfW: 18,
    height: 62,
    build: (x, y) => [
      { d: ellipsePath(x, y - 2, 14, 5), fill: WOOD_DARK },
      { d: rrectPath(x - 2.5, y - 44, 5, 42, 2.5), fill: '#c9a8f0' },
      { d: polyPath([x - 17, y - 44, x + 17, y - 44, x + 12, y - 62, x - 12, y - 62]), fill: '#ffd9e8' },
      { d: rrectPath(x - 17, y - 46, 34, 4, 2), fill: PINK },
    ],
  },
  {
    kind: 'throne',
    name: '작은 왕좌',
    icon: '👑',
    onWall: false,
    halfW: 26,
    height: 68,
    build: (x, y) => [
      { d: rrectPath(x - 22, y - 66, 44, 46, 10), fill: '#8e4f8e' },
      { d: rrectPath(x - 24, y - 26, 48, 16, 6), fill: '#a45fa4' },
      { d: rrectPath(x - 18, y - 22, 36, 8, 4), fill: '#ffd9e8' },
      { d: rrectPath(x - 22, y - 12, 8, 12, 3), fill: WOOD_DARK },
      { d: rrectPath(x + 14, y - 12, 8, 12, 3), fill: WOOD_DARK },
      { d: polyPath([x - 12, y - 66, x - 8, y - 78, x, y - 68, x + 8, y - 78, x + 12, y - 66]), fill: GOLD },
      { d: circlePath(x, y - 44, 6), fill: GOLD },
    ],
  },
  {
    kind: 'balloon',
    name: '풍선 다발',
    icon: '🎈',
    onWall: false,
    halfW: 22,
    height: 78,
    build: (x, y) => [
      { d: `M${x},${y}Q${x + 4},${y - 24} ${x},${y - 44}`, stroke: '#ffffff', lw: 1.4 },
      { d: `M${x},${y}Q${x - 10},${y - 24} ${x - 14},${y - 48}`, stroke: '#ffffff', lw: 1.4 },
      { d: `M${x},${y}Q${x + 12},${y - 26} ${x + 15},${y - 46}`, stroke: '#ffffff', lw: 1.4 },
      { d: ellipsePath(x - 15, y - 60, 13, 15), fill: '#ff8fa8' },
      { d: ellipsePath(x + 16, y - 58, 13, 15), fill: '#9fd8ff' },
      { d: ellipsePath(x, y - 70, 13, 15), fill: '#ffd76a' },
      { d: circlePath(x - 19, y - 65, 3), fill: 'rgba(255,255,255,.7)' },
    ],
  },
  {
    kind: 'wardrobe',
    name: '옷장',
    icon: '🚪',
    onWall: false,
    halfW: 28,
    height: 80,
    build: (x, y) => [
      { d: rrectPath(x - 26, y - 78, 52, 78, 7), fill: WOOD },
      { d: rrectPath(x - 22, y - 74, 20, 70, 4), fill: '#c98d61' },
      { d: rrectPath(x + 2, y - 74, 20, 70, 4), fill: '#c98d61' },
      { d: circlePath(x - 5, y - 40, 3), fill: GOLD },
      { d: circlePath(x + 5, y - 40, 3), fill: GOLD },
      { d: starPath(x, y - 70, 5, 2), fill: GOLD },
    ],
  },
]

export function furnitureOf(kind: string): Furniture | undefined {
  return FURNITURE.find((f) => f.kind === kind)
}
