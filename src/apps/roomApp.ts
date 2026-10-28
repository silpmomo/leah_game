/**
 * 공주 방 꾸미기 — 자유 놀이.
 *
 * 창고에서 가구를 고르고 방을 두드리면 놓인다. 놓인 가구는 끌어서 옮기고,
 * 고른 뒤 "치우기" 로 없앤다. 되돌릴 수 없는 건 "다치우기" 뿐이라
 * 그건 두 번 눌러야 지워지게 했다.
 */
import { josa } from '../engine/hangul'
import { createRng, type Rng } from '../engine/rng'
import { burst, stepParticles, type Particle } from '../engine/particles'
import { FURNITURE, furnitureOf, type FurnitureKind } from '../room/items'
import {
  MAX_ITEMS,
  moveTo,
  pickAt,
  place,
  removeAt,
  type Placed,
} from '../room/rules'
import { drawParticles } from '../render/effects'
import { backHit } from '../render/ui'
import {
  PER_PAGE,
  ROOM_RECT,
  drawRoomScreen,
  pageCountOf,
  roomHit,
} from '../ui/roomScreen'
import type { Audio } from '../core/audio'
import type { Store } from './store'
import type { GameApp } from './types'

export function createRoomApp(store: Store, audio: Audio): GameApp {
  let picked: FurnitureKind | null = null
  let selected: number | null = null
  let page = 0
  let dragging = false
  let particles: Particle[] = []
  let message = '가구를 고르고 방을 두드려요'
  let messageMs = 0
  /** "다치우기" 를 한 번 눌렀는가 */
  let clearArmed = false
  let seed = 31337
  const rngNext = (): Rng => createRng((seed = (seed * 1664525 + 1013904223) >>> 0))

  function say(msg: string, ms = 2.6): void {
    message = msg
    messageMs = ms
  }

  function put(x: number, y: number): void {
    if (!picked) {
      say('먼저 아래에서 가구를 골라주세요')
      audio.play('tap')
      return
    }
    const before = store.room().length
    store.setRoom(place(store.room(), picked, x, y))
    selected = store.room().length - 1
    audio.play('place')
    const f = furnitureOf(picked)
    if (before >= MAX_ITEMS) say('자리가 없어 가장 먼저 놓은 걸 치웠어요')
    else say(`${josa(f?.name ?? '가구', '을/를')} 놓았어요`)
  }

  return {
    screen: () => 'room',

    enter(): void {
      particles = []
      selected = null
      clearArmed = false
      say('가구를 고르고 방을 두드려요')
    },

    update(dt: number): void {
      particles = stepParticles(particles, dt)
      if (messageMs > 0) {
        messageMs -= dt
        if (messageMs <= 0) {
          message = '가구를 고르고 방을 두드려요'
          clearArmed = false
        }
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      drawRoomScreen(ctx, {
        layout: store.room(),
        picked,
        selected,
        page,
        outfit: store.outfit(),
        resolve: store.resolve,
        muted: audio.muted(),
        stickers: store.stickerCount(),
        message,
      })
      drawParticles(ctx, particles)
    },

    pointerDown(px: number, py: number): 'hub' | null {
      if (backHit(px, py)) {
        audio.play('tap')
        return 'hub'
      }
      const act = roomHit(px, py)
      if (!act) return null

      switch (act.kind) {
        case 'room': {
          const hit = pickAt(store.room(), act.x, act.y)
          if (hit !== null) {
            selected = hit
            dragging = true
            audio.play('tap')
            const f = furnitureOf(store.room()[hit]!.kind)
            say(`${f?.name ?? '가구'} — 끌어서 옮겨요`)
            break
          }
          put(act.x, act.y)
          break
        }
        case 'palette': {
          const f = FURNITURE[page * PER_PAGE + act.index]
          if (!f) break
          picked = picked === f.kind ? null : f.kind
          selected = null
          audio.play('tap')
          say(picked ? `${f.name} — 방을 두드려 놓아요` : '가구 고르기를 그만뒀어요')
          break
        }
        case 'page':
          page = (page + act.dir + pageCountOf()) % pageCountOf()
          audio.play('page')
          break
        case 'trash': {
          if (selected === null) {
            audio.play('tap')
            say('치울 가구를 방에서 골라주세요')
            break
          }
          const p: Placed | undefined = store.room()[selected]
          store.setRoom(removeAt(store.room(), selected))
          if (p) {
            particles = [
              ...particles,
              ...burst(rngNext(), ROOM_RECT.x + p.x, ROOM_RECT.y + p.y - 16, 12, ['sparkle']),
            ]
          }
          selected = null
          audio.play('poof')
          say('치웠어요')
          break
        }
        case 'clear':
          if (store.room().length === 0) {
            audio.play('tap')
            break
          }
          if (!clearArmed) {
            clearArmed = true
            audio.play('tap')
            say('정말 다 치울까요? 한 번 더 누르세요')
            break
          }
          store.setRoom([])
          selected = null
          clearArmed = false
          audio.play('poof')
          say('방을 비웠어요')
          break
      }
      return null
    },

    pointerMove(px: number, py: number): void {
      if (!dragging || selected === null) return
      store.setRoom(moveTo(store.room(), selected, px - ROOM_RECT.x, py - ROOM_RECT.y))
    },

    pointerUp(): void {
      dragging = false
    },

    key(code: string): void {
      if (code === 'Backspace' && selected !== null) {
        store.setRoom(removeAt(store.room(), selected))
        selected = null
      }
    },

    escape(): 'hub' | 'stay' {
      return 'hub'
    },

    blur(): void {
      dragging = false
    },

    label(): string {
      const n = store.room().length
      return n === 0 ? '아직 빈 방이에요' : `놓은 가구 ${n} / ${MAX_ITEMS}`
    },

    track: () => 'closet',
  }
}
