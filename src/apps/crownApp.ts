/**
 * 보석 왕관 공방.
 *
 * 만든 왕관은 옷장에 아이템으로 들어간다. 세 자리까지 저장되고, 자리가
 * 다 차면 가장 오래된 것이 밀린다 — "자리가 없어요" 로 막지 않는다.
 */
import { josa } from '../engine/hangul'
import { createRng, type Rng } from '../engine/rng'
import { burst, sparkleAt, stepParticles, type Particle } from '../engine/particles'
import {
  GEMS,
  SLOT_COUNT,
  customCrownId,
  emptyDesign,
  filledSlots,
  type CrownDesign,
} from '../doll/custom'
import { drawParticles } from '../render/effects'
import { backHit } from '../render/ui'
import { STAGE, crownHit, drawCrownScreen } from '../ui/crownScreen'
import type { Audio } from '../core/audio'
import type { Store } from './store'
import type { GameApp } from './types'

export function createCrownApp(store: Store, audio: Audio): GameApp {
  let design: CrownDesign = emptyDesign('silver')
  let gem = 0
  let eraser = false
  let particles: Particle[] = []
  let message = '보석을 고르고 왕관을 두드려요'
  let messageMs = 0
  let seed = 5150
  const rngNext = (): Rng => createRng((seed = (seed * 1664525 + 1013904223) >>> 0))

  function say(msg: string, ms = 2.6): void {
    message = msg
    messageMs = ms
  }

  function slotPos(): [number, number] {
    return [STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h * 0.35]
  }

  function save(): void {
    if (filledSlots(design) === 0) {
      audio.play('tap')
      say('보석을 먼저 붙여주세요')
      return
    }
    const next = [...store.crowns(), { base: design.base, gems: [...design.gems] }]
    // 세 자리까지. 넘치면 가장 오래된 것을 민다
    const kept = next.slice(Math.max(0, next.length - 3))
    store.setCrowns(kept)

    // 방금 만든 왕관을 바로 씌워 준다 — 만든 보람이 즉시 보여야 한다
    const index = kept.length - 1
    store.setOutfit({ ...store.outfit(), crown: customCrownId(index) })

    audio.play('cheer')
    const [x, y] = slotPos()
    particles = [...particles, ...burst(rngNext(), x, y, 30)]
    say('옷장에 넣었어요! 리아가 쓰고 있어요')
  }

  return {
    screen: () => 'workshop',

    enter(): void {
      particles = []
      gem = 0
      eraser = false
      say('보석을 고르고 왕관을 두드려요')
    },

    update(dt: number): void {
      particles = stepParticles(particles, dt)
      if (messageMs > 0) {
        messageMs -= dt
        if (messageMs <= 0) message = '보석을 고르고 왕관을 두드려요'
      }
    },

    render(ctx: CanvasRenderingContext2D): void {
      drawCrownScreen(ctx, {
        design,
        outfit: store.outfit(),
        resolve: store.resolve,
        gem,
        eraser,
        saved: store.crowns(),
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
      const act = crownHit(px, py, store.crowns().length)
      if (!act) return null

      switch (act.kind) {
        case 'slot': {
          const gems = [...design.gems]
          if (eraser) {
            if (!gems[act.index]) {
              audio.play('tap')
              break
            }
            gems[act.index] = null
            audio.play('poof')
          } else {
            gems[act.index] = GEMS[gem]!.id
            audio.play('gem')
            particles = [
              ...particles,
              ...sparkleAt(rngNext(), STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h * 0.3, 6),
            ]
          }
          design = { ...design, gems }
          if (filledSlots(design) === SLOT_COUNT) say('보석을 다 채웠어요! 반짝반짝')
          break
        }
        case 'gem':
          gem = act.index
          eraser = false
          audio.play('tap')
          say(`${josa(GEMS[act.index]!.name, '을/를')} 골랐어요`)
          break
        case 'base':
          design = { ...design, base: act.base }
          audio.play('tap')
          break
        case 'eraser':
          eraser = !eraser
          audio.play('tap')
          say(eraser ? '두드리면 보석이 빠져요' : '보석을 붙여요')
          break
        case 'clear':
          design = emptyDesign(design.base)
          audio.play('poof')
          say('처음부터 다시 만들어요')
          break
        case 'save':
          save()
          break
        case 'saved': {
          const d = store.crowns()[act.index]
          if (!d) break
          design = { base: d.base, gems: [...d.gems] }
          store.setOutfit({ ...store.outfit(), crown: customCrownId(act.index) })
          audio.play('wear')
          say(`${josa(`내 왕관 ${act.index + 1}`, '을/를')} 다시 꾸며요`)
          break
        }
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
      if (code === 'Enter') save()
      if (code === 'Backspace') eraser = !eraser
    },

    escape(): 'hub' | 'stay' {
      return 'hub'
    },

    blur(): void {
      /* 없음 */
    },

    label(): string {
      const n = store.crowns().length
      return n === 0 ? '아직 만든 왕관이 없어요' : `내 왕관 ${n} / 3`
    },

    track: () => 'closet',
  }
}
