/**
 * 일러스트 조각 불러오기와 색 견본 캐시.
 *
 * 그림 파일은 저장소에 없다 (라이선스상 원본을 다시 퍼뜨리면 안 된다).
 * 배포할 때 비공개 에셋 저장소에서 public/assets/doll/ 로 들어온다.
 * 파일이 없으면 그 조각만 비어 보이고 게임은 계속 돈다.
 *
 * 화면은 매 프레임 다시 그리므로, 아직 안 온 그림은 다음 프레임에 저절로
 * 나타난다. 그래서 여기에는 "기다리기" 가 없다.
 */
import { retintPixels } from '../engine/color'

const BASE = `${import.meta.env.BASE_URL}assets/doll/`

type Entry = { img: HTMLImageElement; ok: boolean; failed: boolean }

const IMAGES = new Map<string, Entry>()
const TINTED = new Map<string, HTMLCanvasElement>()
const TINT_CAP = 120

function entry(name: string): Entry {
  let e = IMAGES.get(name)
  if (e) return e
  const img = new Image()
  img.decoding = 'async'
  e = { img, ok: false, failed: false }
  const self = e
  img.onload = () => {
    self.ok = true
  }
  img.onerror = () => {
    self.failed = true
  }
  img.src = `${BASE}${name}.webp`
  IMAGES.set(name, e)
  return e
}

/** 미리 불러 둔다. 옷장 첫 화면에서 조각이 하나씩 튀어나오지 않게 */
export function preloadArt(names: Iterable<string>): void {
  for (const n of names) entry(n)
}

/** 그릴 수 있는 그림. 아직이면 null (불러오기는 시작해 둔다) */
export function artImage(name: string, tint?: string): CanvasImageSource | null {
  const e = entry(name)
  if (!e.ok) return null
  if (!tint) return e.img
  const key = `${name}|${tint}`
  const hit = TINTED.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = e.img.naturalWidth
  c.height = e.img.naturalHeight
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return e.img
  g.drawImage(e.img, 0, 0)
  const data = g.getImageData(0, 0, c.width, c.height)
  retintPixels(data.data, tint)
  g.putImageData(data, 0, 0)
  if (TINTED.size > TINT_CAP) TINTED.clear()
  TINTED.set(key, c)
  return c
}

/** 불러오기 상황 — 시작 화면의 진행 막대가 쓴다 */
export function artProgress(): { done: number; total: number; failed: number } {
  let done = 0
  let failed = 0
  for (const e of IMAGES.values()) {
    if (e.ok) done++
    if (e.failed) failed++
  }
  return { done, total: IMAGES.size, failed }
}

/**
 * 지금까지 요청한 그림이 다 오거나 실패할 때까지 기다린다.
 * 게임은 쓰지 않는다 (매 프레임 다시 그린다). 한 번만 그리는 개발용
 * 미리보기 페이지(tools/*.html)가 "그리기 → 기다리기 → 다시 그리기" 에 쓴다.
 */
export function whenArtSettled(): Promise<void> {
  return new Promise((resolve) => {
    const check = (): void => {
      const p = artProgress()
      if (p.done + p.failed >= p.total) resolve()
      else setTimeout(check, 50)
    }
    check()
  })
}
