import { VIEW_H, VIEW_W } from './engine/view'

/**
 * 화면에 맞는 배율.
 *
 * 도트 게임이 아니라 정수 배율에 맞출 필요가 없다. 세로 화면 비율이
 * 기기마다 제각각이라 짧은 쪽에 맞춰 꽉 채운다.
 */
export function pickScale(w: number, h: number): number {
  return Math.max(0.1, Math.min(w / VIEW_W, h / VIEW_H))
}

/**
 * 캔버스 픽셀 밀도.
 *
 * 벡터라서 DPR 을 올리면 그만큼 선명해진다. 다만 저가 기기에서 3배까지
 * 올리면 채우기 면적이 9배가 되어 프레임이 무너진다. 2 로 자른다.
 */
export function pickDpr(raw: number, downgrade: boolean): number {
  const base = Math.min(2, Math.max(1, raw || 1))
  return downgrade ? 1 : base
}

export type PerfWatch = { sample: (dtMs: number) => boolean }

const SLOW_MS = 26 // 약 38fps 아래
const WINDOW = 120
const SLOW_RATIO = 0.5

/** 프레임이 계속 느리면 한 번만 하향을 요청한다 */
export function createPerfWatch(): PerfWatch {
  const recent: boolean[] = []
  let asked = false

  return {
    sample(dtMs: number): boolean {
      recent.push(dtMs > SLOW_MS)
      if (recent.length > WINDOW) recent.shift()
      if (asked || recent.length < WINDOW) return false

      const slow = recent.reduce((n, s) => n + (s ? 1 : 0), 0)
      if (slow / WINDOW >= SLOW_RATIO) {
        asked = true
        return true
      }
      return false
    },
  }
}
