/**
 * 옷장의 순수 상태.
 *
 * 화면·저장·소리는 apps/closetApp.ts 가 맡고, 여기서는 값만 다룬다.
 */
import type { BackdropId } from '../doll/backdrop'
import { BACKDROPS } from '../doll/backdrop'
import type { Category } from '../doll/kinds'
import type { Outfit } from '../doll/outfit'
import { sanitizeTints, type Tints } from '../doll/tint'
import { itemById } from '../doll/wardrobe'

/** 룩북 한 칸 */
export type Look = {
  outfit: Outfit
  backdrop: BackdropId
  /** 색 견본. 옛 저장값엔 없을 수 있다 */
  tints?: Tints
}

/** 룩북 최대 칸 수. 3 x 3 격자에 딱 맞춘다 */
export const LOOK_MAX = 9

export function sanitizeOutfit(v: unknown): Outfit {
  const o = (v ?? {}) as Record<string, unknown>
  const out: Outfit = {}
  for (const [k, id] of Object.entries(o)) {
    if (typeof id !== 'string') continue
    const item = itemById(id)
    // 저장 시점에는 있었지만 지금은 없는 옷(직접 만든 왕관 등)은
    // 여기서 걸러지지 않는다. 호출부가 extra 로 넘겨 되살린다.
    if (item && item.cat === k) out[item.cat] = id
    else if (id.startsWith('custom-')) out[k as Category] = id
  }
  return out
}

export function sanitizeBackdrop(v: unknown): BackdropId {
  const id = typeof v === 'string' ? v : ''
  return (BACKDROPS.find((b) => b.id === id)?.id ?? BACKDROPS[0]!.id) as BackdropId
}

export function sanitizeLooks(v: unknown): Look[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, LOOK_MAX).map((raw) => {
    const o = (raw ?? {}) as Record<string, unknown>
    const tints = sanitizeTints(o.tints)
    return {
      outfit: sanitizeOutfit(o.outfit),
      backdrop: sanitizeBackdrop(o.backdrop),
      ...(Object.keys(tints).length > 0 ? { tints } : {}),
    }
  })
}

/**
 * 룩북에 담기.
 *
 * 가득 차면 가장 오래된 것을 밀어낸다. "자리가 없어요" 라고 막으면
 * 아이는 왜 안 되는지 모른다. 대신 새 사진이 항상 맨 앞에 온다.
 */
export function saveLook(looks: readonly Look[], look: Look): Look[] {
  return [look, ...looks].slice(0, LOOK_MAX)
}

export function removeLook(looks: readonly Look[], index: number): Look[] {
  return looks.filter((_, i) => i !== index)
}

/** 카테고리별 페이지 수 */
export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage))
}

export function clampPage(page: number, total: number, perPage: number): number {
  const n = pageCount(total, perPage)
  return ((page % n) + n) % n
}
