/**
 * localStorage 얇은 껍데기.
 *
 * 시크릿 모드·차단 설정에서는 접근 자체가 throw 한다. 저장에 실패해도
 * 놀이는 계속돼야 하므로 전부 삼킨다.
 */

const NS = 'leah_game'

export function storageKey(gameId: string, name: string): string {
  return `${NS}.${gameId}.${name}`
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 기록만 포기하고 놀이는 계속한다
  }
}

/**
 * JSON 을 읽어 정제한다.
 *
 * 저장된 값이 깨졌거나(수동 편집·구버전) 타입이 달라도 게임이 죽으면 안 된다.
 * sanitize 가 항상 쓸 수 있는 값을 돌려줄 책임을 진다.
 */
export function loadJson<T>(key: string, sanitize: (v: unknown) => T): T {
  const raw = read(key)
  if (!raw) return sanitize(undefined)
  try {
    return sanitize(JSON.parse(raw))
  } catch {
    return sanitize(undefined)
  }
}

export function saveJson(key: string, value: unknown): void {
  write(key, JSON.stringify(value))
}

const MUTE_KEY = `${NS}.muted`

export function loadMuted(): boolean {
  return read(MUTE_KEY) === '1'
}

export function saveMuted(v: boolean): void {
  write(MUTE_KEY, v ? '1' : '0')
}
