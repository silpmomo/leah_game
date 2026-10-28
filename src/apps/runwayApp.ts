/**
 * 패션쇼 — 부탁을 듣고 코디를 맞추는 놀이.
 *
 * 실패가 없다. "완성!" 을 누르면 맞춘 만큼 별을 주고, 하나도 못 맞춰도
 * 야단치지 않는다. 미션은 잠기지 않아 아무 번호나 골라 할 수 있다.
 */
import { createRng, type Rng } from '../engine/rng'
import { burst, rain, stepParticles, type Particle } from '../engine/particles'
import { VIEW_W } from '../engine/view'
import type { Category, Item } from '../doll/kinds'
import { equip, randomOutfit } from '../doll/outfit'
import { itemsOf } from '../doll/wardrobe'
import { clampPage, pageCount } from '../closet/state'
import { MISSIONS } from '../runway/missions'
import {
  hintFor,
  metFlags,
  praise,
  record,
  scoreStars,
  starsOf,
  suggestIndex,
  threeStarCount,
} from '../runway/rules'
import { drawParticles } from '../render/effects'
import { backHit } from '../render/ui'
import { DOLL_CENTER, PER_PAGE, closetHit } from '../ui/closetScreen'
import {
  CONTINUE_RECT,
  RUNWAY_TOOLS,
  drawDressScreen,
  drawMissionList,
  drawResult,
  missionHit,
  resultHit,
} from '../ui/runwayScreen'
import type { Audio } from '../core/audio'
import type { Store } from './store'
import type { GameApp } from './types'

type Screen = 'list' | 'dress' | 'result'

export function createRunwayApp(store: Store, audio: Audio): GameApp {
  let screen: Screen = 'list'
  let index = 0
  let cat: Category = 'dress'
  const page: Partial<Record<Category, number>> = {}
  let particles: Particle[] = []
  let hint: number | null = null
  let hintMs = 0
  let lastStars = 0
  let seed = 777
  const rngNext = (): Rng => createRng((seed = (seed * 1664525 + 1013904223) >>> 0))

  const mission = () => MISSIONS[index]!

  function pool(c: Category): Item[] {
    return [...itemsOf(c), ...store.extraItems().filter((e) => e.cat === c)]
  }

  function shown(): Item[] {
    const list = pool(cat)
    const p = clampPage(page[cat] ?? 0, list.length, PER_PAGE)
    return list.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE)
  }

  function met(): boolean[] {
    return metFlags(mission(), store.outfit(), store.resolve)
  }

  function start(i: number): void {
    index = Math.max(0, Math.min(MISSIONS.length - 1, i))
    screen = 'dress'
    hint = null
    hintMs = 0
    audio.play('tap')
  }

  function finish(): void {
    const flags = met()
    const stars = scoreStars(flags)
    lastStars = stars
    store.setRunway(record(store.runway(), mission().id, stars))
    screen = 'result'
    if (stars >= 3) {
      audio.play('cheer')
      particles = [...particles, ...rain(rngNext(), VIEW_W, 60)]
    } else if (stars > 0) {
      audio.play('star')
      particles = [...particles, ...burst(rngNext(), VIEW_W / 2, 200, 24)]
    } else {
      audio.play('tap')
    }
  }

  function tool(name: string): void {
    switch (name) {
      case 'random':
        store.setOutfit(randomOutfit(rngNext(), store.extraItems()))
        store.bump('random')
        audio.play('sparkle')
        break
      case 'strip':
        store.setOutfit({})
        audio.play('remove')
        break
      case 'hint': {
        const i = hintFor(mission(), met())
        hint = i
        hintMs = 3
        audio.play('page')
        break
      }
      case 'done':
        finish()
        break
    }
  }

  return {
    screen: () => screen,

    enter(): void {
      screen = 'list'
      index = suggestIndex(store.runway())
      particles = []
      hint = null
    },

    update(dt: number): void {
      particles = stepParticles(particles, dt)
      if (hintMs > 0) {
        hintMs -= dt
        if (hintMs <= 0) hint = null
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      if (screen === 'list') {
        drawMissionList(ctx, store.runway(), audio.muted(), store.stickerCount())
        return
      }
      if (screen === 'result') {
        const p = praise(lastStars)
        drawResult(ctx, {
          mission: mission(),
          stars: lastStars,
          best: starsOf(store.runway(), mission().id),
          msg: p.msg,
          emoji: p.emoji,
          outfit: store.outfit(),
          resolve: store.resolve,
          backdrop: store.backdrop(),
          muted: audio.muted(),
          hasNext: index + 1 < MISSIONS.length,
          stickers: store.stickerCount(),
        })
        drawParticles(ctx, particles)
        return
      }

      const list = pool(cat)
      drawDressScreen(ctx, {
        mission: mission(),
        met: met(),
        outfit: store.outfit(),
        resolve: store.resolve,
        backdrop: store.backdrop(),
        cat,
        shown: shown(),
        page: clampPage(page[cat] ?? 0, list.length, PER_PAGE),
        pages: pageCount(list.length, PER_PAGE),
        muted: audio.muted(),
        hint,
        stickers: store.stickerCount(),
      })
      drawParticles(ctx, particles)
    },

    pointerDown(px: number, py: number): 'hub' | null {
      if (backHit(px, py)) {
        audio.play('tap')
        if (screen === 'list') return 'hub'
        screen = 'list'
        return null
      }

      if (screen === 'list') {
        const i = missionHit(px, py)
        if (i !== null) {
          start(i)
          return null
        }
        if (
          px >= CONTINUE_RECT.x &&
          px <= CONTINUE_RECT.x + CONTINUE_RECT.w &&
          py >= CONTINUE_RECT.y &&
          py <= CONTINUE_RECT.y + CONTINUE_RECT.h
        ) {
          start(suggestIndex(store.runway()))
        }
        return null
      }

      if (screen === 'result') {
        const act = resultHit(px, py, index + 1 < MISSIONS.length)
        if (act === 'again') start(index)
        else if (act === 'list') {
          screen = 'list'
          audio.play('page')
        } else if (act === 'next') start(index + 1)
        return null
      }

      const act = closetHit(px, py, shown().length, RUNWAY_TOOLS)
      if (!act) return null
      switch (act.kind) {
        case 'tab':
          cat = act.cat
          audio.play('tap')
          break
        case 'item': {
          const item = shown()[act.index]
          if (!item) break
          const before = store.outfit()
          const next = equip(before, item)
          store.setOutfit(next)
          audio.play(next[item.cat] === item.id ? 'wear' : 'remove')
          // 방금 맞춘 조건이 있으면 반짝 — 아이가 "맞았다" 를 바로 안다
          const was = metFlags(mission(), before, store.resolve).filter(Boolean).length
          const now = metFlags(mission(), next, store.resolve).filter(Boolean).length
          if (now > was) {
            audio.play('star')
            particles = [
              ...particles,
              ...burst(rngNext(), DOLL_CENTER[0], DOLL_CENTER[1], 12, ['star', 'sparkle']),
            ]
          }
          break
        }
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
      /* 끌기 없음 */
    },
    pointerUp(): void {
      /* 없음 */
    },

    key(code: string): void {
      if (screen === 'dress' && code === 'Enter') finish()
      if (screen === 'result' && code === 'Space' && index + 1 < MISSIONS.length) start(index + 1)
    },

    escape(): 'hub' | 'stay' {
      if (screen === 'list') return 'hub'
      screen = 'list'
      return 'stay'
    },

    blur(): void {
      /* 없음 */
    },

    label(): string {
      const three = threeStarCount(store.runway())
      if (three >= MISSIONS.length) return '모든 미션 별 셋 ★'
      if (three === 0) return `미션 ${MISSIONS.length}개 · 아직 시작 전`
      return `⭐⭐⭐ ${three} / ${MISSIONS.length}`
    },

    track: () => 'show',
  }
}
