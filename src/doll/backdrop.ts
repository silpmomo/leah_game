/**
 * 배경 6종.
 *
 * 무대 상자(w x h)를 받아 그릴 조각을 돌려준다. 상자 크기가 화면마다
 * 달라지므로 비율로 계산한다. 순수 함수라 테스트에서 조각 수를 셀 수 있다.
 */
import {
  circlePath,
  ellipsePath,
  flowerPath,
  linear,
  mergePaths,
  polyPath,
  rectPath,
  rrectPath,
  starPath,
  type Shape,
} from '../engine/shapes'

export type BackdropId = 'ballroom' | 'garden' | 'sea' | 'snow' | 'night' | 'desert'

export type Backdrop = {
  id: BackdropId
  name: string
  icon: string
  /** 카드·미리보기에 쓰는 대표색 */
  swatch: string
  build: (w: number, h: number) => Shape[]
}

/** 흩뿌리기용 고정 좌표 (난수를 쓰면 프레임마다 튄다) */
const DOTS: readonly (readonly [number, number])[] = [
  [0.08, 0.12], [0.22, 0.05], [0.35, 0.18], [0.48, 0.08], [0.61, 0.16],
  [0.74, 0.06], [0.88, 0.14], [0.16, 0.28], [0.42, 0.3], [0.68, 0.26],
  [0.92, 0.32], [0.05, 0.4], [0.3, 0.44], [0.56, 0.38], [0.8, 0.45],
]

export const BACKDROPS: readonly Backdrop[] = [
  {
    id: 'ballroom',
    name: '성 무도회장',
    icon: '🏰',
    swatch: '#6b4a9e',
    build: (w, h) => {
      const floorY = h * 0.72
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#4b2a75'],
            [0.6, '#7a4fa8'],
            [1, '#c79ad6'],
          ]),
        },
      ]
      // 아치 창 3개
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.2 + i * 0.3)
        const ww = w * 0.15
        out.push({
          d:
            `M${cx - ww / 2},${floorY - 10}L${cx - ww / 2},${h * 0.26}` +
            `A${ww / 2},${ww / 2} 0 0 1 ${cx + ww / 2},${h * 0.26}L${cx + ww / 2},${floorY - 10}Z`,
          fill: 'rgba(255,240,200,.28)',
          stroke: 'rgba(255,235,180,.55)',
          lw: 2,
        })
      }
      // 샹들리에
      out.push(
        { d: `M${w / 2},0L${w / 2},${h * 0.1}`, stroke: 'rgba(255,220,150,.7)', lw: 2 },
        { d: ellipsePath(w / 2, h * 0.13, w * 0.1, h * 0.045), fill: 'rgba(255,225,150,.55)' },
        { d: circlePath(w / 2, h * 0.13, 6), fill: '#ffe9a8' },
      )
      // 바닥
      out.push({
        d: rectPath(0, floorY, w, h - floorY),
        fill: linear(0, floorY, 0, h, [
          [0, '#e6d3f2'],
          [1, '#b894d4'],
        ]),
      })
      for (let i = -3; i <= 9; i++) {
        out.push({
          d: `M${(i * w) / 6},${floorY}L${(i * w) / 6 - w * 0.18},${h}`,
          stroke: 'rgba(255,255,255,.35)',
          lw: 1.2,
        })
      }
      return out
    },
  },
  {
    id: 'garden',
    name: '꽃 정원',
    icon: '🌸',
    swatch: '#7ec9a0',
    build: (w, h) => {
      const grassY = h * 0.68
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#a8dcff'],
            [1, '#e6f6ff'],
          ]),
        },
        { d: circlePath(w * 0.82, h * 0.16, h * 0.07), fill: '#fff0a8' },
        { d: ellipsePath(w * 0.2, h * 0.2, w * 0.16, h * 0.05), fill: 'rgba(255,255,255,.85)' },
        { d: ellipsePath(w * 0.32, h * 0.16, w * 0.11, h * 0.04), fill: 'rgba(255,255,255,.85)' },
        { d: ellipsePath(w * 0.62, h * 0.28, w * 0.13, h * 0.04), fill: 'rgba(255,255,255,.7)' },
        {
          d: rectPath(0, grassY, w, h - grassY),
          fill: linear(0, grassY, 0, h, [
            [0, '#8fd48f'],
            [1, '#5aa96a'],
          ]),
        },
      ]
      // 나무 두 그루
      for (const tx of [w * 0.1, w * 0.9]) {
        out.push(
          { d: rrectPath(tx - 6, grassY - 40, 12, 46, 4), fill: '#8a5a3c' },
          { d: circlePath(tx, grassY - 54, 30), fill: '#6cbf72' },
          { d: circlePath(tx - 18, grassY - 42, 20), fill: '#7fce85' },
          { d: circlePath(tx + 18, grassY - 44, 18), fill: '#5fae67' },
        )
      }
      // 꽃
      const colors = ['#ff9ec4', '#ffd76a', '#c9a8f0', '#fff0f5']
      DOTS.forEach(([rx], i) => {
        const x = ((rx * 1.6 + i * 0.11) % 1) * w
        const y = grassY + 8 + ((i * 37) % Math.max(1, h - grassY - 14))
        out.push({ d: flowerPath(x, y, 7, 5), fill: colors[i % colors.length]! })
        out.push({ d: circlePath(x, y, 2.4), fill: '#ffe9a8' })
      })
      return out
    },
  },
  {
    id: 'sea',
    name: '바닷속 궁전',
    icon: '🐚',
    swatch: '#3fa9c9',
    build: (w, h) => {
      const sandY = h * 0.78
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#7fd4ea'],
            [0.55, '#2f9fc4'],
            [1, '#1d6f96'],
          ]),
        },
      ]
      // 물빛 기둥
      for (let i = 0; i < 4; i++) {
        const x = w * (0.15 + i * 0.24)
        out.push({
          d: polyPath([x - 14, 0, x + 14, 0, x + 34, h * 0.7, x + 6, h * 0.7]),
          fill: 'rgba(255,255,255,.12)',
        })
      }
      // 물방울
      DOTS.forEach(([rx, ry], i) => {
        out.push({
          d: circlePath(rx * w, ry * h, 3 + (i % 3) * 1.6),
          stroke: 'rgba(255,255,255,.5)',
          lw: 1.2,
        })
      })
      // 해초
      for (const bx of [w * 0.08, w * 0.16, w * 0.86, w * 0.94]) {
        out.push({
          d: `M${bx},${sandY}C${bx - 16},${sandY - 40} ${bx + 16},${sandY - 70} ${bx},${sandY - 100}`,
          stroke: '#3fae7a',
          lw: 7,
          cap: 'round',
        })
      }
      out.push({
        d: rectPath(0, sandY, w, h - sandY),
        fill: linear(0, sandY, 0, h, [
          [0, '#f4e3c0'],
          [1, '#d9c090'],
        ]),
      })
      // 조개
      out.push(
        { d: `M${w * 0.24},${sandY + 12}Q${w * 0.3},${sandY - 8} ${w * 0.36},${sandY + 12}Z`, fill: '#ffd3e2' },
        { d: `M${w * 0.7},${sandY + 14}Q${w * 0.76},${sandY - 4} ${w * 0.82},${sandY + 14}Z`, fill: '#ffe9a8' },
      )
      return out
    },
  },
  {
    id: 'snow',
    name: '눈나라',
    icon: '❄️',
    swatch: '#9fd8ff',
    build: (w, h) => {
      const snowY = h * 0.74
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#5f86c9'],
            [0.5, '#a8cdf0'],
            [1, '#e8f4ff'],
          ]),
        },
      ]
      // 얼음산
      out.push(
        { d: polyPath([0, snowY, w * 0.24, h * 0.3, w * 0.5, snowY]), fill: 'rgba(255,255,255,.75)' },
        { d: polyPath([w * 0.4, snowY, w * 0.7, h * 0.24, w, snowY]), fill: 'rgba(255,255,255,.6)' },
      )
      // 눈송이
      DOTS.forEach(([rx, ry], i) => {
        const x = rx * w
        const y = ry * h * 0.95
        const r = 4 + (i % 3) * 2
        out.push({
          d: mergePaths(
            `M${x - r},${y}L${x + r},${y}`,
            `M${x},${y - r}L${x},${y + r}`,
            `M${x - r * 0.7},${y - r * 0.7}L${x + r * 0.7},${y + r * 0.7}`,
            `M${x - r * 0.7},${y + r * 0.7}L${x + r * 0.7},${y - r * 0.7}`,
          ),
          stroke: 'rgba(255,255,255,.85)',
          lw: 1.4,
          cap: 'round',
        })
      })
      out.push({
        d: rectPath(0, snowY, w, h - snowY),
        fill: linear(0, snowY, 0, h, [
          [0, '#ffffff'],
          [1, '#d6e8f7'],
        ]),
      })
      return out
    },
  },
  {
    id: 'night',
    name: '별밤 발코니',
    icon: '🌙',
    swatch: '#3b3f8f',
    build: (w, h) => {
      const railY = h * 0.76
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#1b1b4d'],
            [0.6, '#3d357f'],
            [1, '#6f5aa8'],
          ]),
        },
        { d: circlePath(w * 0.78, h * 0.16, h * 0.06), fill: '#fff4c4' },
        { d: circlePath(w * 0.74, h * 0.14, h * 0.055), fill: '#3d357f' },
      ]
      DOTS.forEach(([rx, ry], i) => {
        out.push({
          d: starPath(rx * w, ry * h * 0.9, 3 + (i % 3) * 1.4, 1.3),
          fill: 'rgba(255,255,255,.9)',
        })
      })
      // 난간
      out.push({ d: rrectPath(0, railY, w, 8, 4), fill: '#d9c9ec' })
      for (let i = 0; i <= 8; i++) {
        out.push({ d: rrectPath((i * w) / 8 - 3, railY + 8, 6, h * 0.1, 3), fill: '#c0abdd' })
      }
      out.push({ d: rectPath(0, railY + h * 0.1 + 8, w, h), fill: '#5c4784' })
      return out
    },
  },
  {
    id: 'desert',
    name: '사막 궁전',
    icon: '🕌',
    swatch: '#e8a45c',
    build: (w, h) => {
      const sandY = h * 0.7
      const out: Shape[] = [
        {
          d: rectPath(0, 0, w, h),
          fill: linear(0, 0, 0, h, [
            [0, '#f7c06a'],
            [0.5, '#f09a63'],
            [1, '#e07a6a'],
          ]),
        },
        { d: circlePath(w * 0.5, h * 0.34, h * 0.1), fill: 'rgba(255,240,180,.85)' },
      ]
      // 궁전 실루엣
      const domeY = sandY - h * 0.12
      for (const [cx, s] of [[w * 0.22, 1], [w * 0.5, 1.4], [w * 0.8, 1]] as const) {
        out.push(
          { d: rrectPath(cx - 22 * s, domeY, 44 * s, h * 0.14, 4), fill: 'rgba(120,60,90,.55)' },
          { d: ellipsePath(cx, domeY, 24 * s, 20 * s), fill: 'rgba(120,60,90,.55)' },
          { d: `M${cx},${domeY - 20 * s}L${cx},${domeY - 30 * s}`, stroke: 'rgba(120,60,90,.55)', lw: 3 },
        )
      }
      out.push({
        d: rectPath(0, sandY, w, h - sandY),
        fill: linear(0, sandY, 0, h, [
          [0, '#f2d09a'],
          [1, '#d9a86a'],
        ]),
      })
      out.push({
        d: `M0,${sandY + 14}Q${w * 0.3},${sandY - 4} ${w * 0.6},${sandY + 18}T${w},${sandY + 10}L${w},${h}L0,${h}Z`,
        fill: 'rgba(255,255,255,.16)',
      })
      return out
    },
  },
]

export function backdropById(id: string | undefined): Backdrop {
  return BACKDROPS.find((b) => b.id === id) ?? BACKDROPS[0]!
}
