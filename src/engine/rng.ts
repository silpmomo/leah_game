/**
 * 결정적 난수.
 *
 * Math.random() 을 쓰면 같은 씨앗으로 같은 그림이 나오지 않아 테스트가
 * 불가능해진다. 랜덤 코디·색종이 위치·반짝임 배치가 전부 이걸 쓴다.
 */
export type Rng = {
  /** [0,1) */
  next: () => number
  /** [0,n) 정수 */
  int: (n: number) => number
  /** 배열에서 하나 */
  pick: <T>(arr: readonly T[]) => T
  /** 확률 p 로 참 */
  chance: (p: number) => boolean
}

export function createRng(seed: number): Rng {
  let s = (seed >>> 0) || 1

  function next(): number {
    // xorshift32 — 짧고 빠르고 주기가 충분하다
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 0x100000000
  }

  function int(n: number): number {
    return n <= 0 ? 0 : Math.floor(next() * n) % n
  }

  return {
    next,
    int,
    pick<T>(arr: readonly T[]): T {
      // 빈 배열을 넘기는 건 호출자 잘못이지만, 여기서 터지면 화면이 멈춘다.
      // 아이 손에 들려 있는 게임이라 죽는 것보다 아무거나 주는 게 낫다.
      return arr[int(arr.length)] as T
    },
    chance(p: number): boolean {
      return next() < p
    },
  }
}
