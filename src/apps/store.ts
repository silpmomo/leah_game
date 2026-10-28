/**
 * 저장되는 모든 것을 한 곳에서 들고 있다.
 *
 * 다섯 놀이가 서로의 기록을 본다 — 공방에서 만든 왕관이 옷장에 나타나고,
 * 어느 놀이에서든 스티커가 붙는다. 그 연결을 각 앱이 알아서 하게 두면
 * 저장 키가 흩어지고 스티커 판정이 세 군데로 갈라진다.
 */
import type { Item } from '../doll/kinds'
import type { Outfit, Resolve } from '../doll/outfit'
import { outfitItems, wornCount } from '../doll/outfit'
import { itemById, itemsOf } from '../doll/wardrobe'
import {
  customCrownItem,
  isCustomCrownId,
  sanitizeDesigns,
  filledSlots,
  type CrownDesign,
} from '../doll/custom'
import type { BackdropId } from '../doll/backdrop'
import { sanitizeTints, type Tints } from '../doll/tint'
import {
  LOOK_MAX,
  sanitizeBackdrop,
  sanitizeLooks,
  sanitizeOutfit,
  type Look,
} from '../closet/state'
import { MISSIONS } from '../runway/missions'
import { clearedCount, sanitizeProgress, threeStarCount, type Progress } from '../runway/rules'
import { sanitizeLayout, type Placed } from '../room/rules'
import {
  emptyAlbum,
  grant as grantStickers,
  sanitizeAlbum,
  ownedCount,
  type Album,
  type World,
} from '../stickers/album'
import { loadJson, saveJson, storageKey } from '../storage'

const K = {
  outfit: storageKey('closet', 'outfit'),
  backdrop: storageKey('closet', 'backdrop'),
  looks: storageKey('closet', 'looks'),
  tints: storageKey('closet', 'tints'),
  runway: storageKey('runway', 'progress'),
  crowns: storageKey('crown', 'designs'),
  room: storageKey('room', 'layout'),
  album: storageKey('album', 'book'),
}

export type Store = ReturnType<typeof createStore>

export function createStore() {
  let outfit: Outfit = loadJson(K.outfit, sanitizeOutfit)
  let backdrop: BackdropId = loadJson(K.backdrop, sanitizeBackdrop)
  let looks: Look[] = loadJson(K.looks, sanitizeLooks)
  let tints: Tints = loadJson(K.tints, sanitizeTints)
  let runway: Progress = loadJson(K.runway, sanitizeProgress)
  let crowns: CrownDesign[] = loadJson(K.crowns, sanitizeDesigns)
  let room: Placed[] = loadJson(K.room, sanitizeLayout)
  let album: Album = loadJson(K.album, sanitizeAlbum)

  /** 새로 받은 스티커 — 화면이 하나씩 꺼내 보여준다 */
  const stickerQueue: string[] = []

  let customItems: Item[] = []
  function rebuildCustom(): void {
    customItems = crowns.map((d, i) => customCrownItem(d, i))
  }
  rebuildCustom()

  /** 기본 옷장 + 내가 만든 것 */
  const resolve: Resolve = (id) => {
    if (!id) return undefined
    if (isCustomCrownId(id)) return customItems.find((c) => c.id === id)
    return itemById(id)
  }

  function world(): World {
    const worn = outfitItems(outfit, resolve)
    return {
      dressTotal: itemsOf('dress').length,
      hairTotal: itemsOf('hair').length,
      worn: wornCount(outfit),
      wearingWings: Boolean(outfit.wings),
      wearingWand: Boolean(outfit.wand),
      snowPieces: worn.filter((i) => i.theme === 'snow').length,
      looks: looks.length,
      runwayDone: clearedCount(runway),
      runwayThreeStars: threeStarCount(runway),
      runwayTotal: MISSIONS.length,
      crownDesigns: crowns.length,
      crownFullGems: crowns.some((d) => filledSlots(d) >= 8),
      crownWorn: isCustomCrownId(outfit.crown),
      roomItems: room.length,
      roomHasPet: room.some((p) => p.kind === 'puppy'),
      roomHasParty: room.some((p) => p.kind === 'cake') && room.some((p) => p.kind === 'balloon'),
    }
  }

  /** 조건을 다시 보고 새 스티커를 줄에 세운다 */
  function check(): void {
    const { album: next, gained } = grantStickers(album, world())
    if (gained.length === 0) return
    album = next
    saveJson(K.album, album)
    stickerQueue.push(...gained)
  }

  return {
    resolve,
    extraItems: (): readonly Item[] => customItems,

    outfit: (): Outfit => outfit,
    setOutfit(next: Outfit): void {
      outfit = next
      saveJson(K.outfit, outfit)
      // 입어 본 옷을 기록해 둔다 (옷장 정복·머리 박사 스티커)
      for (const [cat, id] of Object.entries(next)) {
        if (!id) continue
        if (cat === 'dress' || cat === 'hair') see(cat, id)
      }
      check()
    },

    backdrop: (): BackdropId => backdrop,
    setBackdrop(id: BackdropId): void {
      backdrop = id
      saveJson(K.backdrop, backdrop)
      see('backdrop', id)
      check()
    },

    /** 색 견본 — 옷장에서만 쓴다. 패션쇼는 원래 색으로 그린다 */
    tints: (): Tints => tints,
    setTints(next: Tints): void {
      tints = sanitizeTints(next)
      saveJson(K.tints, tints)
    },

    looks: (): readonly Look[] => looks,
    setLooks(next: Look[]): void {
      looks = next.slice(0, LOOK_MAX)
      saveJson(K.looks, looks)
      check()
    },

    runway: (): Progress => runway,
    setRunway(next: Progress): void {
      runway = next
      saveJson(K.runway, runway)
      check()
    },

    crowns: (): readonly CrownDesign[] => crowns,
    setCrowns(next: CrownDesign[]): void {
      crowns = next.slice(0, 3)
      saveJson(K.crowns, crowns)
      rebuildCustom()
      check()
    },

    room: (): readonly Placed[] => room,
    setRoom(next: Placed[]): void {
      room = next
      saveJson(K.room, room)
      check()
    },

    album: (): Album => album,
    stickerCount: (): number => ownedCount(album),

    /** 누적 카운터 (랜덤 누른 횟수 등) */
    bump(name: string): void {
      album = { ...album, counters: { ...album.counters, [name]: (album.counters[name] ?? 0) + 1 } }
      saveJson(K.album, album)
      check()
    },

    /** 화면에 띄울 새 스티커 하나 꺼내기 */
    takeSticker(): string | null {
      return stickerQueue.shift() ?? null
    },

    /** 지금 상태로 스티커 조건을 다시 본다 */
    recheck: check,

    world,
  }

  function see(group: string, value: string): void {
    const list = album.seen[group] ?? []
    if (list.includes(value)) return
    album = { ...album, seen: { ...album.seen, [group]: [...list, value] } }
    saveJson(K.album, album)
  }
}

/** 새 앨범 (테스트·초기화용) */
export const EMPTY_ALBUM = emptyAlbum
