/**
 * 스티커 앨범 — 놀이가 아니라 구경하는 화면.
 *
 * 다른 네 놀이에서 받은 스티커가 여기 모인다.
 */
import { STICKER_TOTAL } from '../stickers/album'
import { backHit } from '../render/ui'
import { drawAlbum, stickerHit } from '../ui/albumScreen'
import type { Audio } from '../core/audio'
import type { Store } from './store'
import type { GameApp } from './types'

export function createAlbumApp(store: Store, audio: Audio): GameApp {
  let detail: number | null = null

  return {
    screen: () => (detail === null ? 'album' : 'detail'),

    enter(): void {
      detail = null
      store.recheck()
    },

    update(): void {
      /* 움직이는 것이 없다 */
    },

    render(ctx: CanvasRenderingContext2D): void {
      drawAlbum(ctx, store.album(), audio.muted(), detail, store.stickerCount())
    },

    pointerDown(px: number, py: number): 'hub' | null {
      if (detail !== null) {
        detail = null
        audio.play('tap')
        return null
      }
      if (backHit(px, py)) {
        audio.play('tap')
        return 'hub'
      }
      const i = stickerHit(px, py)
      if (i !== null) {
        detail = i
        audio.play('page')
      }
      return null
    },

    pointerMove(): void {
      /* 없음 */
    },
    pointerUp(): void {
      /* 없음 */
    },

    key(code: string): void {
      if (code === 'Escape') detail = null
    },

    escape(): 'hub' | 'stay' {
      if (detail !== null) {
        detail = null
        return 'stay'
      }
      return 'hub'
    },

    blur(): void {
      /* 없음 */
    },

    label(): string {
      const n = store.stickerCount()
      if (n === 0) return '아직 스티커가 없어요'
      if (n >= STICKER_TOTAL) return '스티커를 모두 모았어요 ★'
      return `${n} / ${STICKER_TOTAL} 장`
    },

    track: () => 'closet',
  }
}
