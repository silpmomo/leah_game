/**
 * 옷장 — 아이템 표.
 *
 * 그림은 builders.ts 가 만든다. 이 파일은 "무엇이 있는가" 만 적는다.
 * 디즈니 공주풍이되 이름은 우리가 붙였다 (별빛·장미·바다·눈꽃…).
 *
 * 새 옷을 넣으려면 이 표에 한 줄 추가하면 된다. 아이디는 절대 바꾸지 않는다 —
 * 저장된 코디와 룩북이 아이디로 옷을 기억하기 때문이다.
 */
import type { Rect } from '../engine/view'
import {
  buildCape,
  buildCrown,
  buildDress,
  buildEarrings,
  buildGloves,
  buildHair,
  buildNecklace,
  buildShoes,
  buildWand,
  buildWings,
  type CapeSpec,
  type CrownSpec,
  type DressSpec,
  type EarringSpec,
  type GloveSpec,
  type HairSpec,
  type NecklaceSpec,
  type ShoeSpec,
  type WandSpec,
  type WingSpec,
} from './builders'
import type { Category, ColorTag, Item, ThemeTag } from './kinds'

/** 썸네일에서 잘라 보여줄 영역 (인형 좌표) */
export const THUMB_VIEW: Record<Category, Rect> = {
  dress: { x: 34, y: 118, w: 132, h: 186 },
  hair: { x: 26, y: 8, w: 148, h: 170 },
  crown: { x: 50, y: 6, w: 100, h: 62 },
  shoes: { x: 64, y: 244, w: 72, h: 64 },
  necklace: { x: 74, y: 118, w: 52, h: 50 },
  gloves: { x: 42, y: 152, w: 116, h: 76 },
  cape: { x: 0, y: 116, w: 200, h: 192 },
  wings: { x: 0, y: 96, w: 200, h: 154 },
  earrings: { x: 44, y: 84, w: 112, h: 36 },
  wand: { x: 106, y: 124, w: 94, h: 132 },
}

type Row = {
  id: string
  name: string
  color: ColorTag
  theme?: ThemeTag
}

function dress(row: Row, spec: DressSpec): Item {
  const { front, sleeves } = buildDress(spec)
  return { ...row, cat: 'dress', front, sleeves, thumb: THUMB_VIEW.dress }
}

function hair(row: Row, spec: HairSpec): Item {
  const { back, front } = buildHair(spec)
  return { ...row, cat: 'hair', back, front, thumb: THUMB_VIEW.hair }
}

function crown(row: Row, spec: CrownSpec): Item {
  return { ...row, cat: 'crown', front: buildCrown(spec), thumb: THUMB_VIEW.crown }
}

function shoes(row: Row, spec: ShoeSpec): Item {
  return { ...row, cat: 'shoes', front: buildShoes(spec), thumb: THUMB_VIEW.shoes }
}

function necklace(row: Row, spec: NecklaceSpec): Item {
  return { ...row, cat: 'necklace', front: buildNecklace(spec), thumb: THUMB_VIEW.necklace }
}

function gloves(row: Row, spec: GloveSpec): Item {
  return { ...row, cat: 'gloves', front: [], sleeves: buildGloves(spec), thumb: THUMB_VIEW.gloves }
}

function cape(row: Row, spec: CapeSpec): Item {
  const { back, front } = buildCape(spec)
  return { ...row, cat: 'cape', back, front, thumb: THUMB_VIEW.cape }
}

function wings(row: Row, spec: WingSpec): Item {
  return { ...row, cat: 'wings', back: buildWings(spec), front: [], thumb: THUMB_VIEW.wings }
}

function earrings(row: Row, spec: EarringSpec): Item {
  return { ...row, cat: 'earrings', front: buildEarrings(spec), thumb: THUMB_VIEW.earrings }
}

function wand(row: Row, spec: WandSpec): Item {
  return { ...row, cat: 'wand', front: buildWand(spec), thumb: THUMB_VIEW.wand }
}

// ── 드레스 12 ──────────────────────────────────────────────────

const DRESSES: Item[] = [
  dress(
    { id: 'dress-star-blue', name: '별빛 파랑 드레스', color: 'blue', theme: 'star' },
    {
      silhouette: 'ballgown',
      main: '#8dc0f5',
      dark: '#4a83c8',
      trim: '#eaf4ff',
      neckline: 'puff',
      deco: 'sparkle',
      decoColor: '#ffffff',
    },
  ),
  dress(
    { id: 'dress-rose-gold', name: '황금 장미 드레스', color: 'gold', theme: 'rose' },
    {
      silhouette: 'ballgown',
      main: '#f3ca5f',
      dark: '#d29a25',
      trim: '#fff3c4',
      neckline: 'off',
      deco: 'rose',
      decoColor: '#f2748f',
    },
  ),
  dress(
    { id: 'dress-sea-teal', name: '바다빛 조개 드레스', color: 'teal', theme: 'sea' },
    {
      silhouette: 'mermaid',
      main: '#57c9c4',
      dark: '#2a8f96',
      trim: '#bff4ef',
      neckline: 'strap',
      deco: 'shell',
      decoColor: '#ffd9e6',
    },
  ),
  dress(
    { id: 'dress-snow-ice', name: '눈꽃 얼음 드레스', color: 'blue', theme: 'snow' },
    {
      silhouette: 'gown',
      main: '#b6dffc',
      dark: '#79b2da',
      trim: '#ffffff',
      neckline: 'long',
      deco: 'snow',
      decoColor: '#ffffff',
    },
  ),
  dress(
    { id: 'dress-dawn-pink', name: '새벽 분홍 드레스', color: 'pink', theme: 'rose' },
    {
      silhouette: 'ballgown',
      main: '#f4a7c3',
      dark: '#d47398',
      trim: '#ffe3ee',
      neckline: 'halter',
      deco: 'frill',
      decoColor: '#ffd9e8',
    },
  ),
  dress(
    { id: 'dress-lamp-violet', name: '보라 램프 바지옷', color: 'purple', theme: 'night' },
    {
      silhouette: 'pants',
      main: '#a678de',
      dark: '#7a4bb5',
      trim: '#ffd76a',
      neckline: 'halter',
      deco: 'gold',
      decoColor: '#ffd76a',
    },
  ),
  dress(
    { id: 'dress-flame-red', name: '빨강 열정 드레스', color: 'red', theme: 'royal' },
    {
      silhouette: 'gown',
      main: '#e2596b',
      dark: '#b23348',
      trim: '#ffd76a',
      neckline: 'off',
      deco: 'gold',
      decoColor: '#ffd76a',
    },
  ),
  dress(
    { id: 'dress-vine-green', name: '초록 덩굴 드레스', color: 'green', theme: 'forest' },
    {
      silhouette: 'mermaid',
      main: '#6cc47f',
      dark: '#3f9257',
      trim: '#d9f5df',
      neckline: 'strap',
      deco: 'leaf',
      decoColor: '#cdeed4',
    },
  ),
  dress(
    { id: 'dress-desert-orange', name: '모래빛 사막 드레스', color: 'orange', theme: 'desert' },
    {
      silhouette: 'aline',
      main: '#f0a05a',
      dark: '#cd7833',
      trim: '#ffe0b8',
      neckline: 'strap',
      deco: 'gold',
      decoColor: '#ffe0b8',
    },
  ),
  dress(
    { id: 'dress-ball-lavender', name: '라벤더 무도회 드레스', color: 'purple', theme: 'royal' },
    {
      silhouette: 'ballgown',
      main: '#c9aee8',
      dark: '#9b78c9',
      trim: '#f3e8ff',
      neckline: 'puff',
      deco: 'star',
      decoColor: '#ffffff',
    },
  ),
  dress(
    { id: 'dress-night-navy', name: '밤하늘 드레스', color: 'blue', theme: 'night' },
    {
      silhouette: 'gown',
      main: '#5566c4',
      dark: '#2b3480',
      trim: '#ffe37a',
      neckline: 'off',
      deco: 'star',
      decoColor: '#ffe37a',
    },
  ),
  dress(
    { id: 'dress-swan-white', name: '백조 하양 드레스', color: 'white', theme: 'fairy' },
    {
      silhouette: 'aline',
      main: '#fbfaff',
      dark: '#dcd8ea',
      trim: '#e9d9f5',
      neckline: 'puff',
      deco: 'sparkle',
      decoColor: '#cbb6e4',
    },
  ),
]

// ── 머리 8 ─────────────────────────────────────────────────────

const BROWN = { base: '#2b1d18', dark: '#1a100d', shine: '#5d4038' }

const HAIRS: Item[] = [
  hair({ id: 'hair-long-brown', name: '긴 생머리', color: 'brown' }, { style: 'long', ...BROWN }),
  hair({ id: 'hair-wave-brown', name: '웨이브 머리', color: 'brown' }, { style: 'wave', ...BROWN }),
  hair({ id: 'hair-braid-brown', name: '땋은 머리', color: 'brown' }, { style: 'braid', ...BROWN }),
  hair({ id: 'hair-twin-brown', name: '양갈래 머리', color: 'brown' }, { style: 'twin', ...BROWN }),
  hair({ id: 'hair-bun-brown', name: '올림머리', color: 'brown', theme: 'royal' }, { style: 'bun', ...BROWN }),
  hair(
    { id: 'hair-long-red', name: '붉은 긴 머리', color: 'red', theme: 'sea' },
    { style: 'long', base: '#d1583a', dark: '#a03a26', shine: '#f08a68' },
  ),
  hair(
    { id: 'hair-braid-silver', name: '은빛 땋은 머리', color: 'silver', theme: 'snow' },
    { style: 'braid', base: '#e3eaf6', dark: '#b3bfd4', shine: '#ffffff' },
  ),
  hair(
    { id: 'hair-wave-gold', name: '금빛 웨이브', color: 'gold', theme: 'royal' },
    { style: 'wave', base: '#f0cf7a', dark: '#cfa544', shine: '#fff0c0' },
  ),
]

// ── 왕관 6 ─────────────────────────────────────────────────────

const CROWNS: Item[] = [
  crown(
    { id: 'crown-tiara-silver', name: '은빛 티아라', color: 'silver', theme: 'royal' },
    { style: 'tiara', metal: '#e3eaf6', metalDark: '#a9b6cc', gem: '#9fd8ff' },
  ),
  crown(
    { id: 'crown-gold-royal', name: '황금 왕관', color: 'gold', theme: 'royal' },
    { style: 'gold', metal: '#f5cf6a', metalDark: '#c99b2c', gem: '#e2596b' },
  ),
  crown(
    { id: 'crown-flower-pink', name: '분홍 꽃 화관', color: 'pink', theme: 'flower' },
    { style: 'flower', metal: '#f4a7c3', metalDark: '#d47398', gem: '#fff3c4' },
  ),
  crown(
    { id: 'crown-pearl-white', name: '진주 머리띠', color: 'white', theme: 'royal' },
    { style: 'pearl', metal: '#e8e8f2', metalDark: '#c3c3d6', gem: '#fdfcff' },
  ),
  crown(
    { id: 'crown-snow-ice', name: '눈꽃 티아라', color: 'blue', theme: 'snow' },
    { style: 'snow', metal: '#cfeaff', metalDark: '#8fc0e0', gem: '#ffffff' },
  ),
  crown(
    { id: 'crown-star-gold', name: '별 왕관', color: 'gold', theme: 'star' },
    { style: 'star', metal: '#f5cf6a', metalDark: '#c99b2c', gem: '#ffe37a' },
  ),
]

// ── 구두 5 ─────────────────────────────────────────────────────

const SHOES: Item[] = [
  shoes(
    { id: 'shoes-glass', name: '유리 구두', color: 'silver', theme: 'royal' },
    { style: 'glass', main: '#cfe9ff', dark: '#86b8dd', accent: '#ffffff' },
  ),
  shoes(
    { id: 'shoes-gold', name: '황금 구두', color: 'gold', theme: 'royal' },
    { style: 'pump', main: '#f5cf6a', dark: '#c99b2c', accent: '#fff3c4' },
  ),
  shoes(
    { id: 'shoes-ribbon-pink', name: '분홍 리본 구두', color: 'pink', theme: 'rose' },
    { style: 'ribbon', main: '#f4a7c3', dark: '#d47398', accent: '#fff0f5' },
  ),
  shoes(
    { id: 'shoes-ballet-silver', name: '은빛 발레슈즈', color: 'silver', theme: 'fairy' },
    { style: 'ballet', main: '#e8ecf5', dark: '#c2cadb', accent: '#f4a7c3' },
  ),
  shoes(
    { id: 'shoes-boot-red', name: '빨강 부츠', color: 'red', theme: 'royal' },
    { style: 'boot', main: '#e2596b', dark: '#a83249', accent: '#ffd76a' },
  ),
]

// ── 목걸이 5 ───────────────────────────────────────────────────

const NECKLACES: Item[] = [
  necklace(
    { id: 'neck-pearl', name: '진주 목걸이', color: 'white', theme: 'royal' },
    { style: 'pearl', chain: '#e0e6f0', gem: '#fdfcff' },
  ),
  necklace(
    { id: 'neck-heart-pink', name: '하트 목걸이', color: 'pink', theme: 'rose' },
    { style: 'heart', chain: '#f5cf6a', gem: '#f4708f' },
  ),
  necklace(
    { id: 'neck-star-gold', name: '별 목걸이', color: 'gold', theme: 'star' },
    { style: 'star', chain: '#f5cf6a', gem: '#ffe37a' },
  ),
  necklace(
    { id: 'neck-shell-teal', name: '조개 목걸이', color: 'teal', theme: 'sea' },
    { style: 'shell', chain: '#cfe9ff', gem: '#4fc3c0' },
  ),
  necklace(
    { id: 'neck-snow-blue', name: '눈꽃 목걸이', color: 'blue', theme: 'snow' },
    { style: 'snow', chain: '#cfeaff', gem: '#ffffff' },
  ),
]

// ── 장갑 4 ─────────────────────────────────────────────────────

const GLOVES: Item[] = [
  gloves(
    { id: 'glove-long-white', name: '흰 긴 장갑', color: 'white', theme: 'royal' },
    { long: true, main: '#fbfbff', trim: '#e0d4f0' },
  ),
  gloves(
    { id: 'glove-long-pink', name: '분홍 긴 장갑', color: 'pink', theme: 'rose' },
    { long: true, main: '#f6b8cd', trim: '#ffe3ee' },
  ),
  gloves(
    { id: 'glove-short-silver', name: '은빛 짧은 장갑', color: 'silver', theme: 'snow' },
    { long: false, main: '#e2e8f2', trim: '#cfd6e2' },
  ),
  gloves(
    { id: 'glove-short-blue', name: '하늘 짧은 장갑', color: 'blue', theme: 'snow' },
    { long: false, main: '#a8d6f7', trim: '#ddf0ff' },
  ),
]

// ── 망토 5 ─────────────────────────────────────────────────────

const CAPES: Item[] = [
  cape(
    { id: 'cape-red-velvet', name: '빨강 벨벳 망토', color: 'red', theme: 'royal' },
    { main: '#cf3f57', dark: '#93223a', lining: '#ffe0c9', clasp: '#f5cf6a' },
  ),
  cape(
    { id: 'cape-snow-blue', name: '눈나라 망토', color: 'blue', theme: 'snow' },
    { main: '#bfe4ff', dark: '#7fb6dd', lining: '#ffffff', clasp: '#e3eaf6' },
  ),
  cape(
    { id: 'cape-pink-tulle', name: '분홍 튤 망토', color: 'pink', theme: 'fairy' },
    { main: '#f7c6da', dark: '#e194b4', lining: '#fff3f8', clasp: '#f5cf6a' },
  ),
  cape(
    { id: 'cape-purple-star', name: '보라 별 망토', color: 'purple', theme: 'night' },
    { main: '#7b5bd6', dark: '#4d3699', lining: '#ffe37a', clasp: '#ffe37a' },
  ),
  cape(
    { id: 'cape-gold-royal', name: '황금 망토', color: 'gold', theme: 'royal' },
    { main: '#f0c04a', dark: '#c99b2c', lining: '#fff3c4', clasp: '#e2596b' },
  ),
]

// ── 날개 4 ─────────────────────────────────────────────────────

const WINGS: Item[] = [
  wings(
    { id: 'wing-fairy-pink', name: '요정 날개', color: 'pink', theme: 'fairy' },
    { style: 'fairy', main: '#ffd6ea', edge: '#f48fb1' },
  ),
  wings(
    { id: 'wing-butterfly-blue', name: '나비 날개', color: 'blue', theme: 'fairy' },
    { style: 'butterfly', main: '#bfe4ff', edge: '#6aa9e0' },
  ),
  wings(
    { id: 'wing-angel-white', name: '천사 날개', color: 'white', theme: 'fairy' },
    { style: 'angel', main: '#ffffff', edge: '#e4e9f5' },
  ),
  wings(
    { id: 'wing-sparkle-gold', name: '반짝 날개', color: 'gold', theme: 'star' },
    { style: 'sparkle', main: '#ffe9a8', edge: '#f0c04a' },
  ),
]

// ── 귀걸이 4 ───────────────────────────────────────────────────

const EARRINGS: Item[] = [
  earrings(
    { id: 'ear-pearl', name: '진주 귀걸이', color: 'white', theme: 'royal' },
    { style: 'pearl', metal: '#e0e6f0', gem: '#fdfcff' },
  ),
  earrings(
    { id: 'ear-star-gold', name: '별 귀걸이', color: 'gold', theme: 'star' },
    { style: 'star', metal: '#f5cf6a', gem: '#ffe37a' },
  ),
  earrings(
    { id: 'ear-heart-pink', name: '하트 귀걸이', color: 'pink', theme: 'rose' },
    { style: 'heart', metal: '#f5cf6a', gem: '#f4708f' },
  ),
  earrings(
    { id: 'ear-drop-blue', name: '물방울 귀걸이', color: 'blue', theme: 'sea' },
    { style: 'drop', metal: '#cfe9ff', gem: '#7fb6f2' },
  ),
]

// ── 소품 5 ─────────────────────────────────────────────────────

const WANDS: Item[] = [
  wand(
    { id: 'wand-star', name: '별 지팡이', color: 'gold', theme: 'star' },
    { style: 'star', stick: '#f5cf6a', main: '#ffe37a', accent: '#ffffff' },
  ),
  wand(
    { id: 'wand-crystal', name: '마법 수정봉', color: 'purple', theme: 'fairy' },
    { style: 'crystal', stick: '#cfd6e2', main: '#b48ae0', accent: '#ffffff' },
  ),
  wand(
    { id: 'wand-bouquet', name: '꽃다발', color: 'pink', theme: 'flower' },
    { style: 'bouquet', stick: '#6fae63', main: '#f4a7c3', accent: '#fff3c4' },
  ),
  wand(
    { id: 'wand-fan', name: '레이스 부채', color: 'pink', theme: 'royal' },
    { style: 'fan', stick: '#f5cf6a', main: '#f7c6da', accent: '#f5cf6a' },
  ),
  wand(
    { id: 'wand-bag', name: '작은 손가방', color: 'purple', theme: 'royal' },
    { style: 'bag', stick: '#f5cf6a', main: '#c9aee8', accent: '#f5cf6a' },
  ),
]

export const ITEMS: readonly Item[] = [
  ...DRESSES,
  ...HAIRS,
  ...CROWNS,
  ...SHOES,
  ...NECKLACES,
  ...GLOVES,
  ...CAPES,
  ...WINGS,
  ...EARRINGS,
  ...WANDS,
]

const BY_ID = new Map<string, Item>(ITEMS.map((i) => [i.id, i]))

export function itemById(id: string | undefined): Item | undefined {
  return id ? BY_ID.get(id) : undefined
}

export function itemsOf(cat: Category): Item[] {
  return ITEMS.filter((i) => i.cat === cat)
}
