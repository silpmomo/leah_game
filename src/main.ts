/**
 * 부팅과 라우팅.
 *
 * 화면은 둘 중 하나다: 허브(놀이 고르기) 또는 놀이 하나. 놀이들은 전부
 * GameApp 모양을 지키므로 여기서는 어느 앱을 부를지만 고른다.
 */
import { VIEW_H, VIEW_W } from './engine/view'
import { ITEMS } from './doll/wardrobe'
import { assertValidWardrobe } from './doll/schema'
import { createAudio } from './core/audio'
import { createLoop } from './core/loop'
import { GAMES, firstReadyGame } from './games/registry'
import { createStore } from './apps/store'
import { createClosetApp } from './apps/closetApp'
import { createRunwayApp } from './apps/runwayApp'
import { createCrownApp } from './apps/crownApp'
import { createRoomApp } from './apps/roomApp'
import { createAlbumApp } from './apps/albumApp'
import type { GameApp } from './apps/types'
import { drawHub, hubHitTest } from './ui/hub'
import { drawRotateOverlay, isLandscape } from './ui/orientation'
import { TOAST_TOTAL, drawStickerToast } from './render/stickerToast'
import { muteHit } from './render/ui'
import { loadMuted, saveMuted } from './storage'
import { createPerfWatch, pickDpr, pickScale } from './perf'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// 잘못된 옷장 데이터로는 부팅하지 않는다. 검은 화면 대신 원인을 보여준다.
try {
  assertValidWardrobe(ITEMS)
} catch (e) {
  document.body.style.cssText =
    'background:#2a1338;color:#ffd7e6;font:12px/1.7 monospace;padding:20px;white-space:pre-wrap'
  document.body.textContent = e instanceof Error ? e.message : String(e)
  throw e
}

const store = createStore()
const audio = createAudio()
audio.setMuted(loadMuted())

const APPS: Record<string, GameApp> = {
  closet: createClosetApp(store, audio),
  runway: createRunwayApp(store, audio),
  crown: createCrownApp(store, audio),
  room: createRoomApp(store, audio),
  album: createAlbumApp(store, audio),
}

/** 'hub' 또는 놀이 id */
let route = 'hub'
let tick = 0

/** 지금 떠 있는 스티커 알림 */
let toastId: string | null = null
let toastMs = 0

function app(): GameApp | null {
  return route === 'hub' ? null : (APPS[route] ?? null)
}

function hubLabels(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const g of GAMES) out[g.id] = APPS[g.id]?.label() ?? ''
  return out
}

function goHub(): void {
  route = 'hub'
  audio.stopBgm()
  store.recheck()
}

function enter(id: string): void {
  const next = APPS[id]
  if (!next) return
  route = id
  next.enter()
  if (!audio.muted()) audio.startBgm(next.track())
}

// ── 화면 크기 ──────────────────────────────────────────────────

let scale = 1
let downgraded = false
const perf = createPerfWatch()
let lastFrameAt = 0

function resize(): void {
  scale = pickScale(window.innerWidth, window.innerHeight)
  const dpr = pickDpr(window.devicePixelRatio, downgraded)
  canvas.width = Math.round(VIEW_W * scale * dpr)
  canvas.height = Math.round(VIEW_H * scale * dpr)
  canvas.style.width = `${VIEW_W * scale}px`
  canvas.style.height = `${VIEW_H * scale}px`
  // 논리 좌표(360 x 640)로 그리면 되도록 변환을 고정한다
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
}

/** 화면 좌표 → 논리 좌표 */
function toLogical(clientX: number, clientY: number): [number, number] {
  const r = canvas.getBoundingClientRect()
  return [(clientX - r.left) / scale, (clientY - r.top) / scale]
}

// ── 소리 잠금 해제 ─────────────────────────────────────────────

let audioUnlocked = false
function unlockAudio(): void {
  if (audioUnlocked) return
  audioUnlocked = true
  audio.unlock()
  void audio.resume().then(() => {
    const a = app()
    if (a && !audio.muted()) audio.startBgm(a.track())
  })
}

function toggleMute(): void {
  const next = !audio.muted()
  audio.setMuted(next)
  saveMuted(next)
  if (next) {
    audio.stopBgm()
    return
  }
  const a = app()
  if (a) audio.startBgm(a.track())
}

// ── 입력 ───────────────────────────────────────────────────────

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  canvas.setPointerCapture(e.pointerId)
  unlockAudio()
  const [px, py] = toLogical(e.clientX, e.clientY)

  // 소리 버튼은 어느 화면에서나 같은 자리다
  if (muteHit(px, py)) {
    toggleMute()
    return
  }

  if (route === 'hub') {
    const picked = hubHitTest(px, py)
    if (picked) {
      audio.play('tap')
      enter(picked)
    }
    return
  }

  const a = app()
  if (!a) return
  if (a.pointerDown(px, py) === 'hub') goHub()
})

canvas.addEventListener('pointermove', (e) => {
  const [px, py] = toLogical(e.clientX, e.clientY)
  app()?.pointerMove(px, py)
})

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
  canvas.addEventListener(type, (e) => {
    const [px, py] = toLogical(e.clientX, e.clientY)
    app()?.pointerUp(px, py)
  })
}

window.addEventListener('keydown', (e) => {
  unlockAudio()
  if (e.code === 'KeyM') {
    toggleMute()
    return
  }
  if (route === 'hub') {
    if (e.code === 'Space' || e.code === 'Enter') {
      const first = firstReadyGame()
      if (first) enter(first)
    }
    return
  }
  const a = app()
  if (!a) return
  if (e.code === 'Escape') {
    if (a.escape() === 'hub') goHub()
    return
  }
  a.key(e.code)
})

window.addEventListener('blur', () => {
  app()?.blur()
})

window.addEventListener('resize', resize)

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    app()?.blur()
    audio.stopBgm()
  } else {
    loop.reset()
    const a = app()
    if (a && !audio.muted()) audio.startBgm(a.track())
  }
})

window.addEventListener('error', (e) => {
  console.error('놀이 루프 예외', e.error)
})

// ── 루프 ───────────────────────────────────────────────────────

const loop = createLoop({
  update: (dt) => {
    if (isLandscape()) return
    tick += 1

    if (toastId) {
      toastMs += dt
      if (toastMs >= TOAST_TOTAL) {
        toastId = null
        toastMs = 0
      }
    } else {
      const next = store.takeSticker()
      if (next) {
        toastId = next
        toastMs = 0
        audio.play('sticker')
      }
    }

    app()?.update(dt)
  },

  render: () => {
    const now = performance.now()
    if (lastFrameAt > 0 && perf.sample(now - lastFrameAt)) {
      downgraded = true
      resize()
      console.warn('프레임이 계속 느려서 화질을 한 단계 낮췄다')
    }
    lastFrameAt = now

    if (isLandscape()) {
      audio.stopBgm()
      drawRotateOverlay(ctx)
      return
    }

    if (route === 'hub') {
      drawHub(ctx, {
        outfit: store.outfit(),
        resolve: store.resolve,
        labels: hubLabels(),
        stickers: store.stickerCount(),
        muted: audio.muted(),
      })
    } else {
      app()?.render(ctx, tick)
    }

    if (toastId) drawStickerToast(ctx, toastId, toastMs)
  },
})

resize()
store.recheck()
loop.start()
