/**
 * 공주 옷장 — 자유 놀이.
 *
 * 목표도 시간도 없다. 누르면 입고, 다시 누르면 벗는다. 사진을 찍어 룩북에
 * 담고, 배경을 바꾸고, 랜덤으로 깜짝 코디를 받는다.
 */
import { josa } from '../engine/hangul'
import { createRng, type Rng } from '../engine/rng'
import { burst, petals, sparkleAt, stepParticles, type Particle } from '../engine/particles'
import type { Expression } from '../doll/body'
import { CATEGORIES, type Category, type Item } from '../doll/kinds'
import { equip, randomOutfit, wornCount } from '../doll/outfit'
import { isTintable, swatchCount } from '../doll/tint'
import { itemsOf } from '../doll/wardrobe'
import { LOOK_MAX, clampPage, pageCount, removeLook, saveLook } from '../closet/state'
import { drawParticles } from '../render/effects'
import { backHit } from '../render/ui'
import {
  CLOSET_TOOLS,
  DOLL_BOX,
  DOLL_CENTER,
  PER_PAGE,
  backdropHit,
  closetHit,
  drawBackdropPicker,
  drawCloset,
  drawLookbook,
  lookHit,
} from '../ui/closetScreen'
import type { Audio } from '../core/audio'
import type { Store } from './store'
import type { GameApp } from './types'

type Screen = 'play' | 'backdrop' | 'lookbook'

const TOAST_MS = 2.2
const EXPR_MS = 1.1
/** 꽃잎이 하나씩 태어나는 간격(초)과 동시에 떠 있는 최대 수 */
const PETAL_EVERY = 0.5
const PETAL_MAX = 22

export function createClosetApp(store: Store, audio: Audio): GameApp {
  let screen: Screen = 'play'
  let cat: Category = 'dress'
  const page: Partial<Record<Category, number>> = {}
  let particles: Particle[] = []
  let toast: { msg: string; emoji: string; ms: number } | null = null
  let expr: Expression = 'smile'
  let exprMs = 0
  let seed = 20260824
  const rngNext = (): Rng => createRng((seed = (seed * 1664525 + 1013904223) >>> 0))
  let petalMs = 0

  const [dollCx, dollCy] = DOLL_CENTER

  function pool(c: Category): Item[] {
    return [...itemsOf(c), ...store.extraItems().filter((e) => e.cat === c)]
  }

  function shown(): Item[] {
    const list = pool(cat)
    const p = clampPage(page[cat] ?? 0, list.length, PER_PAGE)
    return list.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE)
  }

  function say(msg: string, emoji = '👑', face: Expression = 'happy'): void {
    toast = { msg, emoji, ms: TOAST_MS }
    expr = face
    exprMs = EXPR_MS
  }

  function sparkle(n = 14): void {
    particles = [...particles, ...sparkleAt(rngNext(), dollCx, dollCy, n)]
  }

  function onItem(index: number): void {
    const item = shown()[index]
    if (!item) return
    const before = store.outfit()
    const next = equip(before, item)
    store.setOutfit(next)

    if (next[item.cat] === item.id) {
      audio.play('wear')
      sparkle()
      say(`${item.name} 예쁘다!`, item.custom ? '✨' : '👗')
    } else {
      audio.play('remove')
      say(`${josa(item.name, '을/를')} 벗었어요`, '🧺', 'smile')
    }
  }

  function tool(name: string): void {
    switch (name) {
      case 'random': {
        store.setOutfit(randomOutfit(rngNext(), store.extraItems()))
        store.bump('random')
        audio.play('sparkle')
        sparkle(22)
        say('짜잔! 어때?', '🎲', 'sparkle')
        break
      }
      case 'strip':
        store.setOutfit({})
        store.setTints({})
        audio.play('remove')
        say('처음부터 다시 꾸며볼까?', '🧺', 'smile')
        break
      case 'backdrop':
        screen = 'backdrop'
        audio.play('page')
        break
      case 'lookbook':
        screen = 'lookbook'
        audio.play('page')
        break
      case 'photo': {
        if (wornCount(store.outfit()) === 0) {
          audio.play('tap')
          say('먼저 옷을 골라주세요', '📷', 'surprise')
          break
        }
        store.setLooks(
          saveLook(store.looks(), {
            outfit: store.outfit(),
            backdrop: store.backdrop(),
            tints: store.tints(),
          }),
        )
        audio.play('camera')
        particles = [...particles, ...burst(rngNext(), dollCx, dollCy - 40, 26)]
        say(`룩북에 담았어요 (${store.looks().length}/${LOOK_MAX})`, '📷', 'sparkle')
        break
      }
    }
  }

  return {
    screen: () => screen,

    enter(): void {
      screen = 'play'
      toast = null
      // 처음부터 꽃잎이 떠 있어야 한다. 빈 하늘에서 하나씩 내려오면 심심하다
      particles = petals(rngNext(), DOLL_BOX.x, DOLL_BOX.x + DOLL_BOX.w, 10).map((p, i) => ({
        ...p,
        y: 40 + i * 52,
      }))
      petalMs = 0
      expr = 'smile'
      exprMs = 0
    },

    update(dt: number): void {
      particles = stepParticles(particles, dt)
      if (screen === 'play') {
        petalMs += dt
        if (petalMs >= PETAL_EVERY) {
          petalMs -= PETAL_EVERY
          if (particles.filter((p) => p.drift).length < PETAL_MAX) {
            particles = [...particles, ...petals(rngNext(), DOLL_BOX.x, DOLL_BOX.x + DOLL_BOX.w, 1)]
          }
        }
      }
      if (toast) {
        toast.ms -= dt
        if (toast.ms <= 0) toast = null
      }
      if (exprMs > 0) {
        exprMs -= dt
        if (exprMs <= 0) expr = 'smile'
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      if (screen === 'backdrop') {
        drawBackdropPicker(ctx, store.backdrop(), audio.muted(), store.stickerCount())
        return
      }
      if (screen === 'lookbook') {
        drawLookbook(ctx, store.looks(), store.resolve, audio.muted(), store.stickerCount())
        return
      }

      const list = pool(cat)
      drawCloset(ctx, {
        outfit: store.outfit(),
        resolve: store.resolve,
        backdrop: store.backdrop(),
        cat,
        shown: shown(),
        page: clampPage(page[cat] ?? 0, list.length, PER_PAGE),
        pages: pageCount(list.length, PER_PAGE),
        muted: audio.muted(),
        toast: toast?.msg ?? null,
        toastEmoji: toast?.emoji ?? '👑',
        expr,
        tints: store.tints(),
        stickers: store.stickerCount(),
      })
      drawParticles(ctx, particles)
    },

    pointerDown(px: number, py: number): 'hub' | null {
      if (backHit(px, py)) {
        audio.play('tap')
        if (screen === 'play') return 'hub'
        screen = 'play'
        return null
      }

      if (screen === 'backdrop') {
        const id = backdropHit(px, py)
        if (id) {
          store.setBackdrop(id)
          audio.play('tap')
          screen = 'play'
          say('여기서 놀자!', '🌈')
        }
        return null
      }

      if (screen === 'lookbook') {
        const act = lookHit(px, py, store.looks().length)
        if (!act) return null
        if (act.kind === 'delete') {
          store.setLooks(removeLook(store.looks(), act.index))
          audio.play('poof')
          return null
        }
        const look = store.looks()[act.index]
        if (look) {
          store.setOutfit(look.outfit)
          store.setBackdrop(look.backdrop)
          store.setTints(look.tints ?? {})
          audio.play('wear')
          screen = 'play'
          sparkle(18)
          say('이 코디로 갈아입었어요', '🖼️', 'sparkle')
        }
        return null
      }

      const act = closetHit(
        px,
        py,
        shown().length,
        CLOSET_TOOLS,
        isTintable(cat) ? swatchCount(cat) : 0,
      )
      if (!act) return null
      switch (act.kind) {
        case 'swatch': {
          const next = { ...store.tints() }
          if (act.index === 0) delete next[cat]
          else next[cat] = act.index
          store.setTints(next)
          audio.play('sparkle')
          sparkle(10)
          say(act.index === 0 ? '원래 색으로!' : '이 색 어때?', '🎨', 'sparkle')
          break
        }
        case 'tab':
          cat = act.cat
          audio.play('tap')
          break
        case 'item':
          onItem(act.index)
          break
        case 'page': {
          const list = pool(cat)
          page[cat] = clampPage((page[cat] ?? 0) + act.dir, list.length, PER_PAGE)
          audio.play('page')
          break
        }
        case 'tool':
          tool(act.name)
          break
      }
      return null
    },

    pointerMove(): void {
      /* 옷장은 끌기가 없다 */
    },
    pointerUp(): void {
      /* 없음 */
    },

    key(code: string): void {
      if (code === 'Space') tool('random')
      if (code === 'ArrowRight' || code === 'ArrowLeft') {
        const list = pool(cat)
        page[cat] = clampPage((page[cat] ?? 0) + (code === 'ArrowRight' ? 1 : -1), list.length, PER_PAGE)
      }
      if (code === 'Tab') {
        const i = CATEGORIES.findIndex((c) => c.id === cat)
        cat = CATEGORIES[(i + 1) % CATEGORIES.length]!.id
      }
    },

    escape(): 'hub' | 'stay' {
      if (screen === 'play') return 'hub'
      screen = 'play'
      return 'stay'
    },

    blur(): void {
      /* 없음 */
    },

    label(): string {
      const worn = wornCount(store.outfit())
      const looks = store.looks().length
      if (looks > 0) return `입은 옷 ${worn}칸 · 룩북 ${looks}장`
      return worn > 0 ? `입은 옷 ${worn}칸` : '옷을 골라주세요'
    },

    track: () => 'closet',
  }
}
