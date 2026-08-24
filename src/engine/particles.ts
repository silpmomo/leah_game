/**
 * 축하 가루.
 *
 * 페파피그류 게임은 "잘했어!" 를 말로만 하지 않는다. 색종이가 터지고
 * 반짝이가 날아야 아이가 해냈다는 걸 안다. 순수 계산이라 테스트된다.
 */
import type { Rng } from './rng'

export type ParticleKind = 'confetti' | 'sparkle' | 'heart' | 'star' | 'petal'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  /** 남은 수명(초) */
  life: number
  total: number
  size: number
  rot: number
  spin: number
  kind: ParticleKind
  color: string
  /** 중력을 받는가 */
  heavy: boolean
}

const CONFETTI_COLORS = [
  '#ff8fc0',
  '#ffd76a',
  '#7fe3d4',
  '#b48ae0',
  '#ffffff',
  '#ff7a8a',
  '#9fd8ff',
]

export const GRAVITY = 420

/** 한 점에서 사방으로 터진다 */
export function burst(
  rng: Rng,
  x: number,
  y: number,
  count: number,
  kinds: readonly ParticleKind[] = ['confetti', 'star'],
): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    const a = rng.next() * Math.PI * 2
    const sp = 60 + rng.next() * 190
    const kind = rng.pick(kinds)
    const life = 0.9 + rng.next() * 0.9
    out.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 90,
      life,
      total: life,
      size: 4 + rng.next() * 6,
      rot: rng.next() * Math.PI,
      spin: (rng.next() - 0.5) * 9,
      kind,
      color: rng.pick(CONFETTI_COLORS),
      heavy: kind === 'confetti' || kind === 'petal',
    })
  }
  return out
}

/** 위쪽에서 천천히 떨어지는 색종이 비 */
export function rain(rng: Rng, w: number, count: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    const life = 2.2 + rng.next() * 1.6
    out.push({
      x: rng.next() * w,
      y: -10 - rng.next() * 60,
      vx: (rng.next() - 0.5) * 40,
      vy: 60 + rng.next() * 70,
      life,
      total: life,
      size: 4 + rng.next() * 5,
      rot: rng.next() * Math.PI,
      spin: (rng.next() - 0.5) * 7,
      kind: 'confetti',
      color: rng.pick(CONFETTI_COLORS),
      heavy: false,
    })
  }
  return out
}

/** 인형 주변에서 위로 떠오르는 반짝이 */
export function sparkleAt(rng: Rng, x: number, y: number, count: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    const life = 0.6 + rng.next() * 0.6
    out.push({
      x: x + (rng.next() - 0.5) * 40,
      y: y + (rng.next() - 0.5) * 40,
      vx: (rng.next() - 0.5) * 30,
      vy: -30 - rng.next() * 50,
      life,
      total: life,
      size: 4 + rng.next() * 5,
      rot: 0,
      spin: 2,
      kind: 'sparkle',
      color: rng.chance(0.5) ? '#ffffff' : '#ffe37a',
      heavy: false,
    })
  }
  return out
}

/**
 * 한 프레임 진행. 수명이 다한 것은 빠진 새 배열을 돌려준다.
 *
 * 배열을 갈아 끼우는 이유는 호출부가 상태를 통째로 들고 있게 하려는 것이다.
 * 제자리 splice 는 반복문 인덱스를 흔들어 버그를 부른다.
 */
export function stepParticles(ps: readonly Particle[], dt: number): Particle[] {
  const out: Particle[] = []
  for (const p of ps) {
    const life = p.life - dt
    if (life <= 0) continue
    out.push({
      ...p,
      life,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.heavy ? p.vy + GRAVITY * dt : p.vy * (1 - 0.9 * dt),
      vx: p.vx * (1 - 0.6 * dt),
      rot: p.rot + p.spin * dt,
    })
  }
  return out
}

/** 0(사라짐) ~ 1(갓 태어남) */
export function fadeOf(p: Particle): number {
  return Math.max(0, Math.min(1, p.life / p.total))
}
