/**
 * WebAudio 합성 — 음원 파일이 없다.
 *
 * 리온의 대모험에서 쓰던 엔진을 그대로 가져오고, 소리표만 공주 옷장에 맞게
 * 갈았다. 파일이 없으니 번들이 가볍고, 오프라인에서도 소리가 난다.
 */
export type Wave = OscillatorType | 'noise'

export type SfxSpec = {
  wave: Wave
  /** 순서대로 낼 음. 0은 쉼 */
  notes: number[]
  noteMs: number
  gain: number
  /** 비브라토 세기(Hz) */
  vibrato?: number
  /** 음 사이를 끊지 않고 미끄러진다 */
  slide?: boolean
  noise?: 'hat' | 'crash' | 'thud'
}

const N = {
  G2: 98,
  A2: 110,
  C3: 131,
  D3: 147,
  E3: 165,
  F3: 175,
  G3: 196,
  A3: 220,
  B3: 247,
  C4: 262,
  D4: 294,
  E4: 330,
  F4: 349,
  G4: 392,
  A4: 440,
  B4: 494,
  C5: 523,
  D5: 587,
  E5: 659,
  F5: 698,
  G5: 784,
  A5: 880,
  B5: 988,
  C6: 1047,
  D6: 1175,
  E6: 1319,
  G6: 1568,
} as const

export const SFX: Record<string, SfxSpec> = {
  // 버튼 — 짧고 부드럽게. 아이가 수십 번 누른다
  tap: { wave: 'triangle', notes: [N.E5, N.A5], noteMs: 45, gain: 0.16 },

  // 옷 입기 — 위로 오르는 세 음
  wear: { wave: 'triangle', notes: [N.C5, N.E5, N.A5], noteMs: 55, gain: 0.2, vibrato: 5 },

  // 옷 벗기 — 내려가는 두 음
  remove: { wave: 'triangle', notes: [N.A4, N.E4], noteMs: 60, gain: 0.16, slide: true },

  // 반짝임 — 마법가루
  sparkle: { wave: 'sine', notes: [N.E6, N.G6, N.C6], noteMs: 60, gain: 0.16, vibrato: 12 },

  // 보석 붙이기
  gem: { wave: 'sine', notes: [N.G5, N.D6], noteMs: 55, gain: 0.18, slide: true },

  // 사진 찍기
  camera: { wave: 'noise', notes: [1], noteMs: 70, gain: 0.22, noise: 'hat' },

  // 별 하나 획득
  star: { wave: 'square', notes: [N.G5, N.C6], noteMs: 70, gain: 0.18 },

  // 완성 팡파레
  cheer: {
    wave: 'square',
    notes: [N.C5, N.E5, N.G5, N.C6, 0, N.G5, N.C6, N.E6],
    noteMs: 125,
    gain: 0.2,
  },

  // 스티커 획득 — 더 짧은 축하
  sticker: { wave: 'square', notes: [N.E5, N.A5, N.C6, N.E6], noteMs: 85, gain: 0.2 },

  // 가구 놓기
  place: { wave: 'triangle', notes: [N.D4, N.G4], noteMs: 55, gain: 0.18 },

  // 치우기
  poof: { wave: 'noise', notes: [1], noteMs: 130, gain: 0.18, noise: 'thud' },

  // 화면 넘기기
  page: { wave: 'sine', notes: [N.A4, N.D5], noteMs: 40, gain: 0.12, slide: true },

  // 마법 지팡이
  magic: {
    wave: 'sine',
    notes: [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6],
    noteMs: 45,
    gain: 0.16,
    vibrato: 14,
  },
}

// ── BGM ────────────────────────────────────────────────────────
//
// 16분음표 격자 위의 스텝 시퀀서. 4마디(64스텝) 루프. 전부 원곡이다.

const STEPS_PER_BAR = 16
const BARS = 4
const TOTAL_STEPS = STEPS_PER_BAR * BARS

/** [시작 스텝, 주파수, 길이(스텝)] */
type Ev = readonly [number, number, number]

/** 옷장 — 느리고 포근한 장조 */
const CLOSET_MELODY: readonly Ev[] = [
  [0, N.E5, 4], [4, N.G5, 4], [8, N.A5, 6], [14, N.G5, 2],
  [16, N.F5, 4], [20, N.A5, 4], [24, N.C6, 6], [30, N.A5, 2],
  [32, N.G5, 4], [36, N.E5, 4], [40, N.D5, 6], [46, N.E5, 2],
  [48, N.C5, 4], [52, N.E5, 4], [56, N.G5, 8],
]

const CLOSET_BASS: readonly Ev[] = [
  [0, N.C3, 7], [8, N.C3, 7],
  [16, N.F3, 7], [24, N.F3, 7],
  [32, N.G3, 7], [40, N.E3, 7],
  [48, N.C3, 7], [56, N.G2, 7],
]

/** 패션쇼 — 경쾌한 왈츠풍. 무대에 나갈 때 쓴다 */
const SHOW_MELODY: readonly Ev[] = [
  [0, N.C5, 2], [2, N.E5, 2], [4, N.G5, 2], [6, N.C6, 2],
  [8, N.B5, 2], [10, N.G5, 2], [12, N.E5, 4],
  [16, N.D5, 2], [18, N.F5, 2], [20, N.A5, 2], [22, N.D6, 2],
  [24, N.C6, 2], [26, N.A5, 2], [28, N.F5, 4],
  [32, N.E5, 2], [34, N.G5, 2], [36, N.C6, 2], [38, N.E6, 2],
  [40, N.D6, 4], [44, N.C6, 4],
  [48, N.G5, 2], [50, N.E5, 2], [52, N.C5, 2], [54, N.E5, 2],
  [56, N.G5, 4], [60, N.C6, 4],
]

const SHOW_BASS: readonly Ev[] = [
  [0, N.C3, 3], [4, N.G3, 3], [8, N.C3, 3], [12, N.G3, 3],
  [16, N.D3, 3], [20, N.A3, 3], [24, N.F3, 3], [28, N.C4, 3],
  [32, N.C3, 3], [36, N.G3, 3], [40, N.A3, 3], [44, N.E3, 3],
  [48, N.F3, 3], [52, N.C4, 3], [56, N.G3, 3], [60, N.C3, 3],
]

const KICK = [0, 8, 16, 24, 32, 40, 48, 56]
const HAT = Array.from({ length: TOTAL_STEPS / 4 }, (_, i) => i * 4 + 2)

const MELODY_GAIN = 0.075
const BASS_GAIN = 0.085
const KICK_GAIN = 0.12
const HAT_GAIN = 0.04

export type TrackName = 'closet' | 'show'

function bucket(events: readonly Ev[]): (readonly Ev[])[] {
  const out: Ev[][] = Array.from({ length: TOTAL_STEPS }, () => [])
  for (const e of events) out[e[0] % TOTAL_STEPS]!.push(e)
  return out
}

type Track = {
  melody: (readonly Ev[])[]
  bass: (readonly Ev[])[]
  kick: readonly number[]
  hat: readonly number[]
  bpm: number
  /** 멜로디 파형 — 옷장은 부드럽게, 무대는 또렷하게 */
  wave: OscillatorType
}

const TRACKS: Record<TrackName, Track> = {
  closet: {
    melody: bucket(CLOSET_MELODY),
    bass: bucket(CLOSET_BASS),
    kick: [0, 16, 32, 48],
    hat: HAT,
    bpm: 104,
    wave: 'triangle',
  },
  show: {
    melody: bucket(SHOW_MELODY),
    bass: bucket(SHOW_BASS),
    kick: KICK,
    hat: Array.from({ length: TOTAL_STEPS / 2 }, (_, i) => i * 2 + 1),
    bpm: 138,
    wave: 'square',
  },
}

const SCHEDULE_AHEAD_S = 0.2
const TICK_MS = 40

export type Audio = {
  play: (name: string) => void
  setMuted: (v: boolean) => void
  muted: () => boolean
  /** 사용자 제스처 안에서 불러야 한다 */
  unlock: () => void
  resume: () => Promise<void>
  startBgm: (track?: TrackName) => void
  stopBgm: () => void
  state: () => string
}

type AudioCtor = new () => AudioContext

export function createAudio(): Audio {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let noiseBuf: AudioBuffer | null = null
  let isMuted = false

  let bgmTimer: number | null = null
  let current: TrackName = 'closet'
  let step = 0
  let nextStepTime = 0

  function ensure(): AudioContext | null {
    if (ctx) return ctx
    const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }
    const Ctor = w.AudioContext ?? w.webkitAudioContext
    if (!Ctor) return null // 오디오를 못 쓰는 환경에서도 놀이는 된다
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = isMuted ? 0 : 0.5
    master.connect(ctx.destination)
    return ctx
  }

  function noise(c: AudioContext): AudioBuffer | null {
    if (noiseBuf) return noiseBuf
    if (typeof c.createBuffer !== 'function') return null
    const len = Math.floor(c.sampleRate * 0.4)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const data = buf.getChannelData(0)
    // 결정적 의사난수 — 빌드마다 같은 소리가 난다
    let seed = 91217
    for (let i = 0; i < len; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      data[i] = seed / 0x3fffffff - 1
    }
    noiseBuf = buf
    return buf
  }

  function envelope(startAt: number, ms: number, gain: number): GainNode | null {
    if (!ctx || !master) return null
    const g = ctx.createGain()
    const dur = ms / 1000
    g.gain.setValueAtTime(0, startAt)
    g.gain.linearRampToValueAtTime(gain, startAt + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
    g.connect(master)
    return g
  }

  function tone(
    wave: OscillatorType,
    freq: number,
    startAt: number,
    ms: number,
    gain: number,
    opts: { vibrato?: number; slideTo?: number } = {},
  ): void {
    if (!ctx) return
    const g = envelope(startAt, ms, gain)
    if (!g) return
    const osc = ctx.createOscillator()
    osc.type = wave
    osc.frequency.setValueAtTime(freq, startAt)
    if (opts.slideTo && typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), startAt + ms / 1000)
    }
    if (opts.vibrato && typeof ctx.createOscillator === 'function') {
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = opts.vibrato
      depth.gain.value = freq * 0.02
      lfo.connect(depth)
      depth.connect(osc.frequency)
      lfo.start(startAt)
      lfo.stop(startAt + ms / 1000 + 0.02)
    }
    osc.connect(g)
    osc.start(startAt)
    osc.stop(startAt + ms / 1000 + 0.02)
  }

  function noiseBurst(
    startAt: number,
    ms: number,
    gain: number,
    kind: 'hat' | 'crash' | 'thud',
  ): void {
    if (!ctx) return
    const buf = noise(ctx)
    if (!buf || typeof ctx.createBufferSource !== 'function') {
      tone('triangle', kind === 'hat' ? 6000 : kind === 'crash' ? 900 : 160, startAt, ms, gain * 0.6)
      return
    }
    const g = envelope(startAt, ms, gain)
    if (!g) return
    const src = ctx.createBufferSource()
    src.buffer = buf

    if (typeof ctx.createBiquadFilter === 'function') {
      const f = ctx.createBiquadFilter()
      if (kind === 'hat') {
        f.type = 'highpass'
        f.frequency.value = 7000
      } else if (kind === 'crash') {
        f.type = 'bandpass'
        f.frequency.value = 1800
      } else {
        f.type = 'lowpass'
        f.frequency.value = 400
      }
      src.connect(f)
      f.connect(g)
    } else {
      src.connect(g)
    }

    src.start(startAt)
    src.stop(startAt + ms / 1000 + 0.02)
  }

  function emit(spec: SfxSpec, at: number): void {
    const stepS = spec.noteMs / 1000
    spec.notes.forEach((f, i) => {
      if (f === 0) return
      const t = at + i * stepS
      if (spec.wave === 'noise') {
        noiseBurst(t, spec.noteMs, spec.gain, spec.noise ?? 'crash')
        return
      }
      const next = spec.slide ? spec.notes[i + 1] : undefined
      tone(spec.wave, f, t, spec.noteMs, spec.gain, {
        vibrato: spec.vibrato,
        slideTo: next && next !== 0 ? next : undefined,
      })
    })
  }

  function scheduleStep(i: number, at: number, tr: Track, stepS: number): void {
    for (const [, freq, len] of tr.melody[i] ?? []) {
      tone(tr.wave, freq, at, len * stepS * 1000 * 0.92, MELODY_GAIN)
    }
    for (const [, freq, len] of tr.bass[i] ?? []) {
      tone('triangle', freq, at, len * stepS * 1000 * 0.95, BASS_GAIN)
    }
    if (tr.kick.includes(i)) noiseBurst(at, 70, KICK_GAIN, 'thud')
    if (tr.hat.includes(i)) noiseBurst(at, 30, HAT_GAIN, 'hat')
  }

  return {
    play(name: string): void {
      if (isMuted) return
      const spec = SFX[name]
      if (!spec) return
      const c = ensure()
      if (!c) return
      if (c.state === 'suspended') {
        void c.resume().then(() => {
          if (!isMuted) emit(spec, c.currentTime + 0.01)
        })
        return
      }
      emit(spec, c.currentTime + 0.01)
    },

    setMuted(v: boolean): void {
      isMuted = v
      if (master) master.gain.value = v ? 0 : 0.5
    },

    muted(): boolean {
      return isMuted
    },

    /** iOS 는 제스처 안에서 컨텍스트를 만들고 소리를 한 번 내야 허용한다 */
    unlock(): void {
      const c = ensure()
      if (!c) return
      void c.resume()
      if (typeof c.createBuffer !== 'function' || typeof c.createBufferSource !== 'function') return
      const buf = c.createBuffer(1, 1, c.sampleRate)
      const src = c.createBufferSource()
      src.buffer = buf
      src.connect(c.destination)
      src.start(0)
    },

    async resume(): Promise<void> {
      const c = ensure()
      if (c && c.state === 'suspended') await c.resume()
    },

    startBgm(track: TrackName = 'closet'): void {
      if (bgmTimer !== null) {
        if (track === current) return
        window.clearInterval(bgmTimer)
        bgmTimer = null
      }
      const c = ensure()
      if (!c) return
      current = track
      const tr = TRACKS[track]
      const stepS = 60 / tr.bpm / 4
      step = 0
      nextStepTime = c.currentTime + 0.06

      // 룩어헤드 스케줄러. setInterval 로 한 스텝씩 즉시 재생하면
      // 타이머 지터가 그대로 리듬에 실려 흔들린다.
      const tick = (): void => {
        if (!ctx || ctx.state !== 'running' || isMuted) return
        while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
          scheduleStep(step, nextStepTime, tr, stepS)
          nextStepTime += stepS
          step = (step + 1) % TOTAL_STEPS
        }
      }
      tick()
      bgmTimer = window.setInterval(tick, TICK_MS)
    },

    stopBgm(): void {
      if (bgmTimer === null) return
      window.clearInterval(bgmTimer)
      bgmTimer = null
    },

    state(): string {
      return ctx ? ctx.state : 'none'
    },
  }
}
