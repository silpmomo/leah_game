/**
 * 스티커 앨범 — 다섯 놀이를 하나로 묶는 보상.
 *
 * 페파피그 게임에서 아이를 계속 붙잡아 두는 건 점수가 아니라 "모으기" 다.
 * 실패가 없는 놀이라 목표가 필요한데, 별점보다 스티커가 훨씬 잘 먹힌다.
 *
 * 이 모듈은 순수하다. 저장은 apps 계층이 한다.
 */

export type Sticker = {
  id: string
  name: string
  /** 아직 못 받았을 때 보여줄 힌트 */
  hint: string
  emoji: string
  color: string
}

export const STICKERS: readonly Sticker[] = [
  { id: 'first-dress', name: '첫 드레스', hint: '드레스를 입어보세요', emoji: '👗', color: '#ff8fc0' },
  { id: 'full-set', name: '완벽한 코디', hint: '열 칸을 모두 채워보세요', emoji: '✨', color: '#ffd76a' },
  { id: 'dress-all', name: '옷장 정복', hint: '드레스를 전부 입어보세요', emoji: '👚', color: '#b48ae0' },
  { id: 'hair-all', name: '머리 박사', hint: '머리를 전부 바꿔보세요', emoji: '💇', color: '#7fe3d4' },
  { id: 'wings-fly', name: '날개를 달고', hint: '날개를 달아보세요', emoji: '🦋', color: '#9fd8ff' },
  { id: 'wand-magic', name: '마법 소녀', hint: '지팡이를 들어보세요', emoji: '🪄', color: '#ffd76a' },
  { id: 'snow-queen', name: '눈나라 공주', hint: '눈나라 물건 세 개를 함께', emoji: '❄️', color: '#cfeaff' },
  { id: 'photo-1', name: '첫 사진', hint: '코디를 룩북에 담아보세요', emoji: '📷', color: '#ff8fc0' },
  { id: 'photo-9', name: '사진 가득', hint: '룩북 아홉 칸을 채워보세요', emoji: '🖼️', color: '#ffb1d1' },
  { id: 'random-fun', name: '깜짝 코디', hint: '랜덤을 열 번 눌러보세요', emoji: '🎲', color: '#7fe3d4' },
  { id: 'all-backdrops', name: '세계 여행', hint: '배경 여섯 곳을 모두 가보세요', emoji: '🗺️', color: '#b48ae0' },
  { id: 'show-first', name: '무대 데뷔', hint: '패션쇼를 한 번 해보세요', emoji: '🎀', color: '#ff8fc0' },
  { id: 'show-5', name: '인기 스타', hint: '미션 다섯 개를 별 셋으로', emoji: '🌟', color: '#ffd76a' },
  { id: 'show-10', name: '톱 모델', hint: '미션 열 개를 별 셋으로', emoji: '👑', color: '#ffd76a' },
  { id: 'show-all', name: '전설의 공주', hint: '모든 미션을 별 셋으로', emoji: '🏆', color: '#ffe37a' },
  { id: 'crown-first', name: '첫 왕관', hint: '왕관을 만들어보세요', emoji: '💎', color: '#9fd8ff' },
  { id: 'crown-full', name: '보석 가득', hint: '여덟 칸을 모두 채운 왕관', emoji: '💍', color: '#ff8fc0' },
  { id: 'crown-3', name: '왕관 수집가', hint: '왕관 세 개를 만들어보세요', emoji: '👸', color: '#ffd76a' },
  { id: 'crown-wear', name: '내가 만든 왕관', hint: '만든 왕관을 써보세요', emoji: '✨', color: '#ffe37a' },
  { id: 'room-first', name: '방 꾸미기', hint: '가구를 놓아보세요', emoji: '🛋️', color: '#7fe3d4' },
  { id: 'room-10', name: '아늑한 방', hint: '가구 열 개를 놓아보세요', emoji: '🏡', color: '#b48ae0' },
  { id: 'room-pet', name: '친구와 함께', hint: '강아지를 데려와 보세요', emoji: '🐶', color: '#ffb1d1' },
  { id: 'room-party', name: '파티 준비', hint: '케이크와 풍선을 놓아보세요', emoji: '🎂', color: '#ff8fc0' },
  { id: 'all-stickers', name: '반짝반짝 리아', hint: '스티커를 모두 모아보세요', emoji: '🌈', color: '#ffd76a' },
]

export const STICKER_TOTAL = STICKERS.length

export function stickerById(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id)
}

/**
 * 앨범 저장값.
 *
 * counters·seen 을 여기 같이 두는 이유: "드레스를 전부 입어봤나" 같은 조건은
 * 지금 코디만 봐서는 알 수 없고 누적 기록이 있어야 한다. 게임마다 따로
 * 세면 세 군데에서 같은 걸 세게 된다.
 */
export type Album = {
  owned: Record<string, true>
  counters: Record<string, number>
  seen: Record<string, string[]>
}

export function emptyAlbum(): Album {
  return { owned: {}, counters: {}, seen: {} }
}

export function sanitizeAlbum(v: unknown): Album {
  const o = (v ?? {}) as Partial<Album>
  const out = emptyAlbum()
  if (o.owned && typeof o.owned === 'object') {
    for (const id of Object.keys(o.owned)) {
      if (stickerById(id)) out.owned[id] = true
    }
  }
  if (o.counters && typeof o.counters === 'object') {
    for (const [k, n] of Object.entries(o.counters)) {
      const v2 = Number(n)
      if (Number.isFinite(v2)) out.counters[k] = v2
    }
  }
  if (o.seen && typeof o.seen === 'object') {
    for (const [k, list] of Object.entries(o.seen)) {
      if (Array.isArray(list)) out.seen[k] = list.filter((x): x is string => typeof x === 'string')
    }
  }
  return out
}

export function ownedCount(a: Album): number {
  return Object.keys(a.owned).length
}

export function hasSticker(a: Album, id: string): boolean {
  return a.owned[id] === true
}

/** 누적 기록 — 같은 값은 한 번만 남는다 */
export function see(a: Album, group: string, value: string): Album {
  const list = a.seen[group] ?? []
  if (list.includes(value)) return a
  return { ...a, seen: { ...a.seen, [group]: [...list, value] } }
}

export function seenCount(a: Album, group: string): number {
  return (a.seen[group] ?? []).length
}

export function bump(a: Album, counter: string, by = 1): Album {
  return { ...a, counters: { ...a.counters, [counter]: (a.counters[counter] ?? 0) + by } }
}

export function counter(a: Album, name: string): number {
  return a.counters[name] ?? 0
}

/**
 * 스티커 조건을 판정할 때 필요한 지금 상태.
 *
 * 게임마다 아는 것이 다르므로 전부 선택값이다. 모르는 값은 0/false 로 둔다.
 */
export type World = {
  dressTotal: number
  hairTotal: number
  /** 지금 입은 칸 수 */
  worn?: number
  wearingWings?: boolean
  wearingWand?: boolean
  snowPieces?: number
  looks?: number
  runwayDone?: number
  runwayThreeStars?: number
  runwayTotal?: number
  crownDesigns?: number
  crownFullGems?: boolean
  crownWorn?: boolean
  roomItems?: number
  roomHasPet?: boolean
  roomHasParty?: boolean
}

type Rule = (a: Album, w: World) => boolean

const RULES: Record<string, Rule> = {
  'first-dress': (a) => seenCount(a, 'dress') >= 1,
  'full-set': (_a, w) => (w.worn ?? 0) >= 10,
  'dress-all': (a, w) => w.dressTotal > 0 && seenCount(a, 'dress') >= w.dressTotal,
  'hair-all': (a, w) => w.hairTotal > 0 && seenCount(a, 'hair') >= w.hairTotal,
  'wings-fly': (_a, w) => w.wearingWings === true,
  'wand-magic': (_a, w) => w.wearingWand === true,
  'snow-queen': (_a, w) => (w.snowPieces ?? 0) >= 3,
  'photo-1': (_a, w) => (w.looks ?? 0) >= 1,
  'photo-9': (_a, w) => (w.looks ?? 0) >= 9,
  'random-fun': (a) => counter(a, 'random') >= 10,
  'all-backdrops': (a) => seenCount(a, 'backdrop') >= 6,
  'show-first': (_a, w) => (w.runwayDone ?? 0) >= 1,
  'show-5': (_a, w) => (w.runwayThreeStars ?? 0) >= 5,
  'show-10': (_a, w) => (w.runwayThreeStars ?? 0) >= 10,
  'show-all': (_a, w) =>
    (w.runwayTotal ?? 0) > 0 && (w.runwayThreeStars ?? 0) >= (w.runwayTotal ?? 0),
  'crown-first': (_a, w) => (w.crownDesigns ?? 0) >= 1,
  'crown-full': (_a, w) => w.crownFullGems === true,
  'crown-3': (_a, w) => (w.crownDesigns ?? 0) >= 3,
  'crown-wear': (_a, w) => w.crownWorn === true,
  'room-first': (_a, w) => (w.roomItems ?? 0) >= 1,
  'room-10': (_a, w) => (w.roomItems ?? 0) >= 10,
  'room-pet': (_a, w) => w.roomHasPet === true,
  'room-party': (_a, w) => w.roomHasParty === true,
  // 마지막 한 장은 자기 자신을 뺀 나머지를 다 모으면 붙는다
  'all-stickers': (a) => ownedCount(a) >= STICKER_TOTAL - 1,
}

/** 새로 받을 스티커들. 앨범은 바꾸지 않는다 */
export function newlyEarned(a: Album, w: World): string[] {
  const out: string[] = []
  for (const s of STICKERS) {
    if (a.owned[s.id]) continue
    const rule = RULES[s.id]
    if (rule && rule(a, w)) out.push(s.id)
  }
  return out
}

/** 조건을 확인하고 새 스티커를 붙인 앨범과 새로 받은 목록을 함께 준다 */
export function grant(a: Album, w: World): { album: Album; gained: string[] } {
  let album = a
  const gained: string[] = []

  // 'all-stickers' 는 다른 스티커가 붙은 뒤라야 조건이 맞는다.
  // 한 번 더 돌려 같은 프레임에 마지막 장까지 붙게 한다.
  for (let pass = 0; pass < 2; pass++) {
    const ids = newlyEarned(album, w)
    if (ids.length === 0) break
    const owned = { ...album.owned }
    for (const id of ids) owned[id] = true
    album = { ...album, owned }
    gained.push(...ids)
  }
  return { album, gained }
}
