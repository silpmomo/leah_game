/**
 * 옷장 — 아이템 표.
 *
 * 옷·머리·구두·목걸이·장갑·망토·귀걸이는 일러스트 조각(art.ts)을 겹친다.
 * 왕관·날개·지팡이는 팩에 공주풍 그림이 모자라 벡터(builders.ts)로 그리고
 * fit.ts 의 XF 로 인형 머리·등·손에 옮긴다. 팩 그림 장식(화관·토끼 귀·
 * 요정 날개…)도 같은 분류에 섞는다.
 *
 * 같은 그림에 색만 입힌 옷(tint)도 따로 한 벌로 센다. 팩 드레스가 적어서
 * 공주 드레스 색을 늘리는 방법이다.
 *
 * 새 옷을 넣으려면 이 표에 한 줄 추가하면 된다. 아이디는 절대 바꾸지 않는다 —
 * 저장된 코디와 룩북이 아이디로 옷을 기억하기 때문이다.
 */
import type { Rect } from '../engine/view'
import type { Shape } from '../engine/shapes'
import { art, artBounds, type ArtName } from './art'
import { hairLayers, type HairStyle } from './body'
import {
  buildCrown,
  buildWand,
  buildWings,
  type CrownSpec,
  type WandSpec,
  type WingSpec,
} from './builders'
import { XF, placed, xfRect } from './fit'
import type { Category, ColorTag, Item, ThemeTag } from './kinds'

/** 벡터 소품의 썸네일 영역 (벡터 틀 좌표를 XF 로 옮긴 값) */
export const THUMB_VIEW = {
  crown: xfRect(XF.crown, { x: 72, y: 12, w: 56, h: 42 }),
  wings: xfRect(XF.wings, { x: 0, y: 40, w: 200, h: 240 }),
  wand: xfRect(XF.wand, { x: 108, y: 166, w: 56, h: 86 }),
} as const satisfies Partial<Record<Category, Rect>>

type Row = {
  id: string
  name: string
  color: ColorTag
  theme?: ThemeTag
}

/** 조각 이름, 또는 [조각 이름, 입힐 색] */
type Layer = ArtName | readonly [ArtName, string]

function layer(l: Layer): Shape {
  return typeof l === 'string' ? art(l) : art(l[0], l[1])
}

function nameOf(l: Layer): ArtName {
  return typeof l === 'string' ? l : l[0]
}

/** 일러스트 아이템. front 는 몸 앞, back 은 몸 뒤 */
function pic(cat: Category, row: Row, front: readonly Layer[], back: readonly Layer[] = []): Item {
  const all = [...back, ...front].map(nameOf)
  return {
    ...row,
    cat,
    front: front.map(layer),
    ...(back.length ? { back: back.map(layer) } : {}),
    thumb: artBounds(all),
  }
}

function hair(row: Row, h: HairStyle): Item {
  const { back, front } = hairLayers(h)
  const names = [`hair${h.style}`, `hair${h.style}-back`, ...(h.bangs ? [`bangs${h.bangs}`] : [])]
  return { ...row, cat: 'hair', back, front, hair: h, thumb: artBounds(names as ArtName[], 4) }
}

function crown(row: Row, spec: CrownSpec): Item {
  return { ...row, cat: 'crown', front: placed(buildCrown(spec), XF.crown), thumb: THUMB_VIEW.crown }
}

function wings(row: Row, spec: WingSpec): Item {
  return { ...row, cat: 'wings', back: placed(buildWings(spec), XF.wings), front: [], thumb: THUMB_VIEW.wings }
}

function wand(row: Row, spec: WandSpec): Item {
  return { ...row, cat: 'wand', front: placed(buildWand(spec), XF.wand), thumb: THUMB_VIEW.wand }
}

const dress = (row: Row, front: readonly Layer[]): Item => pic('dress', row, front)
const shoes = (row: Row, front: readonly Layer[]): Item => pic('shoes', row, front)
const necklace = (row: Row, front: readonly Layer[]): Item => pic('necklace', row, front)
const gloves = (row: Row, front: readonly Layer[]): Item => pic('gloves', row, front)
const earrings = (row: Row, front: readonly Layer[]): Item => pic('earrings', row, front)

// ── 드레스 20 ──────────────────────────────────────────────────

const DRESSES: Item[] = [
  dress({ id: 'dress-mint', name: '민트 꽃 드레스', color: 'teal', theme: 'flower' }, ['dress1']),
  dress({ id: 'dress-pink-frill', name: '분홍 프릴 드레스', color: 'pink', theme: 'rose' }, ['dress6']),
  dress({ id: 'dress-red-royal', name: '빨강 궁전 드레스', color: 'red', theme: 'royal' }, ['dress5']),
  dress({ id: 'dress-white-goddess', name: '하얀 여신 드레스', color: 'white', theme: 'snow' }, ['dress7']),
  dress({ id: 'dress-gold-ball', name: '황금 드레스', color: 'gold', theme: 'royal' }, [['dress1', '#e8b93a']]),
  dress({ id: 'dress-sky-frill', name: '하늘 프릴 드레스', color: 'blue', theme: 'snow' }, [['dress6', '#7fb6f2']]),
  dress({ id: 'dress-lilac-frill', name: '라일락 프릴 드레스', color: 'purple', theme: 'fairy' }, [['dress6', '#b48ae0']]),
  dress({ id: 'dress-berry', name: '딸기 드레스', color: 'pink', theme: 'flower' }, ['frou3', 'berry-top1']),
  dress({ id: 'dress-galaxy', name: '별하늘 드레스', color: 'purple', theme: 'star' }, ['pleat3', 'witch-top3']),
  dress({ id: 'dress-night-blue', name: '파란 밤 드레스', color: 'blue', theme: 'night' }, ['frou2', 'witch-top2']),
  dress({ id: 'dress-snowflake', name: '눈꽃 드레스', color: 'white', theme: 'snow' }, ['drape2', 'witch-top4']),
  dress({ id: 'dress-forest-fairy', name: '숲속 요정 옷', color: 'green', theme: 'forest' }, ['fairy-bottom', 'fairy-top']),
  dress({ id: 'dress-bunny-apron', name: '토끼 앞치마 드레스', color: 'blue', theme: 'flower' }, [
    'skirt-frill',
    'top-frill',
    'apron',
  ]),
  dress({ id: 'dress-desert', name: '사막 여행 옷', color: 'brown', theme: 'desert' }, ['bottom5', 'cottage-top1']),
  dress({ id: 'dress-white-tee', name: '하얀 원피스', color: 'white' }, ['dress2']),
  dress({ id: 'mermaid-teal', name: '청록 인어 꼬리', color: 'teal', theme: 'sea' }, ['tail6', 'top-shell']),
  dress({ id: 'mermaid-pink', name: '분홍 인어 꼬리', color: 'pink', theme: 'sea' }, ['tail11', 'top-shell']),
  dress({ id: 'mermaid-purple', name: '보라 인어 꼬리', color: 'purple', theme: 'sea' }, ['tail10', 'top-shell']),
  dress({ id: 'mermaid-blue', name: '파랑 인어 꼬리', color: 'blue', theme: 'sea' }, ['tail7', 'top-shell']),
  dress({ id: 'mermaid-gold', name: '황금 인어 꼬리', color: 'gold', theme: 'sea' }, ['tail3', 'top-shell']),
]

// ── 머리 16 ────────────────────────────────────────────────────

const HAIRS: Item[] = [
  hair({ id: 'hair-long', name: '긴 생머리', color: 'brown' }, { style: 10, bangs: 2 }),
  hair({ id: 'hair-wave', name: '웨이브 머리', color: 'brown', theme: 'flower' }, { style: 1, bangs: 1 }),
  hair({ id: 'hair-pony', name: '높은 포니테일', color: 'brown' }, { style: 2, bangs: 5 }),
  hair({ id: 'hair-updo', name: '올림머리', color: 'brown', theme: 'royal' }, { style: 3, bangs: 9 }),
  hair({ id: 'hair-bob', name: '찰랑 단발', color: 'brown' }, { style: 4, bangs: 3 }),
  hair({ id: 'hair-short', name: '짧은 단발', color: 'brown' }, { style: 5, bangs: 2 }),
  hair({ id: 'hair-side', name: '옆으로 묶은 머리', color: 'brown' }, { style: 6, bangs: 12 }),
  hair({ id: 'hair-mini-bun', name: '작은 똥머리', color: 'brown' }, { style: 7, bangs: 8 }),
  hair({ id: 'hair-side-long', name: '긴 옆머리', color: 'brown' }, { style: 8, bangs: 4 }),
  hair({ id: 'hair-big-bun', name: '큰 올림머리', color: 'brown', theme: 'royal' }, { style: 9, bangs: 10 }),
  hair({ id: 'hair-long-wave', name: '긴 웨이브', color: 'brown', theme: 'rose' }, { style: 11, bangs: 6 }),
  hair({ id: 'hair-curly-bob', name: '곱슬 단발', color: 'brown' }, { style: 12, bangs: 13 }),
  pic('hair', { id: 'hair-rainbow-lilac', name: '무지개 보라 머리', color: 'purple', theme: 'star' }, ['party-hair1']),
  pic('hair', { id: 'hair-rainbow-pink', name: '무지개 분홍 머리', color: 'pink', theme: 'star' }, ['party-hair2']),
  pic('hair', { id: 'hair-rainbow-green', name: '무지개 초록 머리', color: 'green', theme: 'fairy' }, ['party-hair3']),
  pic('hair', { id: 'hair-rainbow-blue', name: '무지개 파랑 머리', color: 'blue', theme: 'fairy' }, ['party-hair4']),
]

// ── 왕관·머리 장식 ─────────────────────────────────────────────

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

const HEADWEAR: Item[] = [
  pic('crown', { id: 'crown-heart-tiara', name: '하트 보석 티아라', color: 'gold', theme: 'royal' }, ['gen-tiara-heart']),
  pic('crown', { id: 'crown-violet-flowers', name: '보라 꽃 화관', color: 'purple', theme: 'flower' }, ['flower-crown']),
  pic('crown', { id: 'crown-gold-flowers', name: '꽃 머리띠', color: 'gold', theme: 'flower' }, ['flower-band']),
  pic('crown', { id: 'crown-hibiscus', name: '하와이 꽃핀', color: 'orange', theme: 'sea' }, ['hibiscus']),
  pic('crown', { id: 'crown-red-band', name: '빨간 머리띠', color: 'red' }, ['headband']),
  pic('crown', { id: 'crown-bunny-ears', name: '토끼 귀', color: 'blue', theme: 'fairy' }, ['bunny-ears']),
  pic('crown', { id: 'crown-antlers', name: '사슴뿔', color: 'brown', theme: 'forest' }, ['antlers']),
  pic('crown', { id: 'hat-party-1', name: '고깔모자', color: 'purple', theme: 'star' }, ['party-hat1']),
  pic('crown', { id: 'hat-party-2', name: '분홍 고깔모자', color: 'pink', theme: 'star' }, ['party-hat2']),
]

// ── 구두 15 ────────────────────────────────────────────────────

const SHOES: Item[] = [
  shoes({ id: 'shoes-glass', name: '유리 구두', color: 'blue', theme: 'royal' }, ['shoes-glass']),
  shoes({ id: 'shoes-cream', name: '크림 리본 구두', color: 'white', theme: 'flower' }, ['shoes-strap']),
  shoes({ id: 'shoes-violet', name: '보라 구두', color: 'purple', theme: 'fairy' }, ['shoes-violet']),
  shoes({ id: 'shoes-fairy', name: '꽃 샌들', color: 'purple', theme: 'forest' }, ['shoes-fairy']),
  shoes({ id: 'shoes-flip', name: '바닷가 샌들', color: 'purple', theme: 'sea' }, ['shoes-flip']),
  shoes({ id: 'shoes-party-blue', name: '파랑 구두', color: 'blue' }, ['party-shoes1']),
  shoes({ id: 'shoes-party-pink', name: '분홍 구두', color: 'pink', theme: 'rose' }, ['party-shoes2']),
  shoes({ id: 'shoes-party-green', name: '초록 구두', color: 'green' }, ['party-shoes3']),
  shoes({ id: 'shoes-party-yellow', name: '노랑 구두', color: 'gold' }, ['party-shoes4']),
  shoes({ id: 'shoes-pink-socks', name: '분홍 양말 구두', color: 'pink' }, ['party-socks1', 'party-shoes2']),
  shoes({ id: 'shoes-silver', name: '은빛 구두', color: 'silver', theme: 'snow' }, ['shoes1']),
  shoes({ id: 'shoes-black', name: '까만 구두', color: 'silver' }, ['shoes2']),
  shoes({ id: 'shoes-boots', name: '갈색 부츠', color: 'brown', theme: 'desert' }, ['shoes3']),
  shoes({ id: 'shoes-green', name: '숲 구두', color: 'green', theme: 'forest' }, ['shoes4']),
  shoes({ id: 'shoes-gold', name: '황금 구두', color: 'gold', theme: 'royal' }, [['shoes-strap', '#e8b93a']]),
]

// ── 목걸이 8 ───────────────────────────────────────────────────

const NECKLACES: Item[] = [
  necklace({ id: 'neck-pearl', name: '진주 목걸이', color: 'white', theme: 'royal' }, ['pearl']),
  necklace({ id: 'neck-moon', name: '달 목걸이', color: 'silver', theme: 'star' }, ['moon-silver']),
  necklace({ id: 'neck-lace', name: '레이스 목걸이', color: 'white', theme: 'snow' }, ['choker-white']),
  necklace({ id: 'neck-shell', name: '조개 목걸이', color: 'white', theme: 'sea' }, ['shell-necklace']),
  necklace({ id: 'neck-party-1', name: '보라 리본 목걸이', color: 'purple' }, ['party-collar1']),
  necklace({ id: 'neck-party-2', name: '초록 리본 목걸이', color: 'green' }, ['party-collar2']),
  necklace({ id: 'neck-party-3', name: '빨강 리본 목걸이', color: 'red', theme: 'rose' }, ['party-collar3']),
  necklace({ id: 'neck-party-4', name: '노랑 리본 목걸이', color: 'gold' }, ['party-collar4']),
]

// ── 장갑·팔찌 7 ────────────────────────────────────────────────

const GLOVES: Item[] = [
  gloves({ id: 'gloves-long', name: '긴 장갑', color: 'white', theme: 'royal' }, ['gloves1']),
  gloves({ id: 'gloves-white', name: '하얀 장갑', color: 'white', theme: 'snow' }, ['gloves-white']),
  gloves({ id: 'gloves-flower', name: '꽃 팔찌', color: 'purple', theme: 'forest' }, ['gloves-fairy']),
  gloves({ id: 'bracelet-1', name: '알록 팔찌', color: 'pink', theme: 'star' }, ['bracelet1']),
  gloves({ id: 'bracelet-2', name: '노랑 팔찌', color: 'gold' }, ['bracelet2']),
  gloves({ id: 'bracelet-3', name: '파랑 팔찌', color: 'blue' }, ['bracelet3']),
  gloves({ id: 'bracelet-4', name: '반짝 팔찌', color: 'gold', theme: 'star' }, ['bracelet4']),
]

// ── 망토 5 (한 그림에 색을 입혔다) ─────────────────────────────

function cape(row: Row, tint?: string): Item {
  const c = (n: ArtName): Layer => (tint ? [n, tint] : n)
  return pic('cape', row, [c('cape-back')], [c('cape')])
}

const CAPES: Item[] = [
  cape({ id: 'cape-forest', name: '숲속 망토', color: 'green', theme: 'forest' }),
  cape({ id: 'cape-rose', name: '장미 망토', color: 'pink', theme: 'rose' }, '#e05a7a'),
  cape({ id: 'cape-snow', name: '눈나라 망토', color: 'blue', theme: 'snow' }, '#7fb6f2'),
  cape({ id: 'cape-gold', name: '황금 망토', color: 'gold', theme: 'royal' }, '#f0c04a'),
  cape({ id: 'cape-star', name: '보라 별 망토', color: 'purple', theme: 'star' }, '#9a6ad0'),
]

// ── 날개 ───────────────────────────────────────────────────────

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

const WINGS_PIC: Item[] = [
  pic('wings', { id: 'wing-pink-fairy', name: '분홍 나비 날개', color: 'pink', theme: 'fairy' }, [], ['gen-wings-pink']),
  pic('wings', { id: 'wing-glass', name: '유리 요정 날개', color: 'white', theme: 'fairy' }, [], ['wings-fairy']),
]

// ── 귀걸이 9 ───────────────────────────────────────────────────

const EARRINGS: Item[] = [
  earrings({ id: 'ear-ring-gold', name: '금 고리 귀걸이', color: 'gold', theme: 'royal' }, ['ear-ring1']),
  earrings({ id: 'ear-ring-silver', name: '은 고리 귀걸이', color: 'silver' }, ['ear-ring2']),
  earrings({ id: 'ear-star-gold', name: '별 귀걸이', color: 'gold', theme: 'star' }, ['ear-star1']),
  earrings({ id: 'ear-star-silver', name: '은별 귀걸이', color: 'silver', theme: 'star' }, ['ear-star2']),
  earrings({ id: 'ear-flower', name: '보라 꽃 귀걸이', color: 'purple', theme: 'forest' }, ['fairy-earrings']),
  earrings({ id: 'ear-party-1', name: '보라 방울 귀걸이', color: 'purple' }, ['party-earrings1']),
  earrings({ id: 'ear-party-2', name: '빨강 방울 귀걸이', color: 'red' }, ['party-earrings2']),
  earrings({ id: 'ear-party-3', name: '분홍 방울 귀걸이', color: 'pink', theme: 'rose' }, ['party-earrings3']),
  earrings({ id: 'ear-party-4', name: '초록 방울 귀걸이', color: 'green' }, ['party-earrings4']),
]

// ── 소품 ───────────────────────────────────────────────────────

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

const WANDS_PIC: Item[] = [
  pic('wand', { id: 'wand-heart', name: '하트 별 요술봉', color: 'pink', theme: 'star' }, ['gen-wand-heart']),
  pic('wand', { id: 'pet-bunny', name: '토끼 친구', color: 'white', theme: 'fairy' }, ['bunny']),
  pic('wand', { id: 'surfboard', name: '서핑보드', color: 'blue', theme: 'sea' }, ['surfboard']),
]

export const ITEMS: readonly Item[] = [
  ...DRESSES,
  ...HAIRS,
  ...CROWNS,
  ...HEADWEAR,
  ...SHOES,
  ...NECKLACES,
  ...GLOVES,
  ...CAPES,
  ...WINGS,
  ...WINGS_PIC,
  ...EARRINGS,
  ...WANDS,
  ...WANDS_PIC,
]

const BY_ID = new Map<string, Item>(ITEMS.map((i) => [i.id, i]))

export function itemById(id: string | undefined): Item | undefined {
  return id ? BY_ID.get(id) : undefined
}

export function itemsOf(cat: Category): Item[] {
  return ITEMS.filter((i) => i.cat === cat)
}
