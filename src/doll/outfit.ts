/**
 * 코디(Outfit) — "어느 칸에 어떤 아이템" 만 들고 있는 값.
 *
 * 그림 조각을 들고 다니지 않는다. 저장할 때도 이 값 그대로 JSON 이 된다.
 * 아이템 아이디만 남으므로 나중에 옷 그림을 고쳐도 저장된 코디가 살아 있다.
 */
import type { Shape } from '../engine/shapes'
import type { Rng } from '../engine/rng'
import {
  armShapes,
  baseHairBack,
  baseHairFront,
  baseOutfitShapes,
  baseShoeShapes,
  baseSleeveShapes,
  bodyShapes,
  faceShapes,
  type Expression,
} from './body'
import { CATEGORIES, type Category, type ColorTag, type Item, type ThemeTag } from './kinds'
import { itemById, itemsOf } from './wardrobe'

export type Outfit = Partial<Record<Category, string>>

export const EMPTY_OUTFIT: Outfit = {}

export type Resolve = (id: string | undefined) => Item | undefined

/**
 * 같은 칸을 다시 누르면 벗는다.
 *
 * 아이가 제일 먼저 하는 행동이 "방금 입힌 걸 다시 누르기" 다. 그때 아무
 * 일도 안 일어나면 고장 난 줄 안다.
 */
export function equip(outfit: Outfit, item: Item): Outfit {
  const next = { ...outfit }
  if (next[item.cat] === item.id) delete next[item.cat]
  else next[item.cat] = item.id
  return next
}

export function unequip(outfit: Outfit, cat: Category): Outfit {
  const next = { ...outfit }
  delete next[cat]
  return next
}

export function wornCount(outfit: Outfit): number {
  return Object.values(outfit).filter(Boolean).length
}

export function outfitItems(outfit: Outfit, resolve: Resolve = itemById): Item[] {
  const out: Item[] = []
  for (const c of CATEGORIES) {
    const it = resolve(outfit[c.id])
    if (it) out.push(it)
  }
  return out
}

/** 코디에 들어 있는 색·테마 집합. 패션쇼 채점이 쓴다 */
export function outfitColors(outfit: Outfit, resolve: Resolve = itemById): Set<ColorTag> {
  return new Set(outfitItems(outfit, resolve).map((i) => i.color))
}

export function outfitThemes(outfit: Outfit, resolve: Resolve = itemById): Set<ThemeTag> {
  const s = new Set<ThemeTag>()
  for (const i of outfitItems(outfit, resolve)) if (i.theme) s.add(i.theme)
  return s
}

/**
 * 랜덤 코디.
 *
 * 드레스와 머리는 반드시 넣는다 — 이 둘이 비면 "랜덤"을 눌렀는데 아무것도
 * 안 바뀐 것처럼 보인다. 나머지는 확률로 넣어 매번 다르게 만든다.
 */
export function randomOutfit(rng: Rng, extra: readonly Item[] = []): Outfit {
  const pool = (cat: Category): Item[] => [...itemsOf(cat), ...extra.filter((e) => e.cat === cat)]
  const out: Outfit = {
    dress: rng.pick(pool('dress')).id,
    hair: rng.pick(pool('hair')).id,
  }
  const maybe: [Category, number][] = [
    ['crown', 0.8],
    ['shoes', 0.75],
    ['necklace', 0.6],
    ['earrings', 0.5],
    ['gloves', 0.45],
    ['cape', 0.4],
    ['wings', 0.35],
    ['wand', 0.5],
  ]
  for (const [cat, p] of maybe) {
    if (!rng.chance(p)) continue
    const list = pool(cat)
    if (list.length > 0) out[cat] = rng.pick(list).id
  }
  return out
}

export type ComposeOpts = {
  expr?: Expression
  resolve?: Resolve
  /** 얼굴을 그릴지. 룩북 미니 인형에서도 얼굴은 그린다 */
  face?: boolean
}

/**
 * 인형 한 벌을 그릴 조각 목록.
 *
 * 순서가 곧 앞뒤다. 이 순서를 바꾸면 손이 치마 뒤로 숨거나 왕관이 머리에
 * 파묻힌다. 아래 주석의 층 번호는 문서(docs/DOLL.md)와 같은 번호다.
 */
export function composeDoll(outfit: Outfit, opts: ComposeOpts = {}): Shape[] {
  const resolve = opts.resolve ?? itemById
  const get = (c: Category): Item | undefined => resolve(outfit[c])

  const hair = get('hair')
  const cape = get('cape')
  const wings = get('wings')
  const dress = get('dress')
  const shoes = get('shoes')
  const gloves = get('gloves')

  /**
   * 드레스를 입으면 기본 옷은 감춘다.
   *
   * 겹쳐 두면 인어 드레스·바지옷처럼 폭이 좁은 옷 옆으로 라벤더 치마가
   * 삐져나온다. 기본 옷은 "아무것도 안 입혔을 때의 리아" 이고,
   * 드레스는 그걸 갈아입는 것이다. 악세사리는 전부 그 위에 얹힌다.
   */
  const baseWear = dress ? [] : baseOutfitShapes()
  const sleeves = dress ? (dress.sleeves ?? []) : baseSleeveShapes()

  return [
    ...(wings?.back ?? []), // 10 날개
    ...(cape?.back ?? []), // 20 망토 천
    ...(hair ? (hair.back ?? []) : baseHairBack()), // 25 뒷머리
    ...bodyShapes(), // 30 몸
    ...(opts.face === false ? [] : faceShapes(opts.expr ?? 'smile')), // 34 얼굴
    ...baseWear, // 38 기본 옷 (드레스가 없을 때)
    ...(dress?.front ?? []), // 42 드레스
    ...baseShoeShapes(), // 46 기본 신발
    ...(shoes?.front ?? []),
    ...armShapes(), // 50 팔
    ...sleeves, // 54 소매
    ...(gloves?.sleeves ?? []), // 58 장갑
    ...(hair?.front ?? baseHairFront()), // 62 앞머리
    ...(cape?.front ?? []), // 64 망토 깃
    ...(get('earrings')?.front ?? []), // 66 귀걸이
    ...(get('necklace')?.front ?? []), // 68 목걸이
    ...(get('crown')?.front ?? []), // 72 왕관
    ...(get('wand')?.front ?? []), // 76 소품
  ]
}
