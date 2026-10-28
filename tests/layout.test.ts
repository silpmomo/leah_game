/**
 * 화면 배치 검사.
 *
 * 세로 한 화면(360 x 640)에 다 들어가야 한다. 버튼이 화면 밖으로 조금만
 * 나가도 아이는 그 기능이 없는 줄 안다. 그림을 그리지 않고 사각형만 본다.
 */
import { describe, expect, it } from 'vitest'
import { VIEW_H, VIEW_W, type Rect } from '../src/engine/view'
import { CATEGORIES } from '../src/doll/kinds'
import { A, DOLL_H, DOLL_W } from '../src/doll/body'
import { SWATCHES, TINTABLE } from '../src/doll/tint'
import { GAMES } from '../src/games/registry'
import { MISSIONS } from '../src/runway/missions'
import { STICKERS } from '../src/stickers/album'
import { FURNITURE } from '../src/room/items'
import { HUB_DOLL_BOX, STICKER_BAR, cardRect, lastCardBottom } from '../src/ui/hub'
import {
  BUBBLE_RECT,
  CLOSET_TOOLS,
  CTA_RECT,
  DOLL_BOX,
  PER_PAGE,
  PREV_RECT,
  NEXT_RECT,
  STAGE,
  backdropRect,
  itemRect,
  lookRect,
  swatchPillRect,
  swatchRect,
  tabRect,
  toolRect,
} from '../src/ui/closetScreen'
import { CONTINUE_RECT, RUNWAY_TOOLS, missionRect } from '../src/ui/runwayScreen'
import { gemRect, baseRect, savedRect, SAVE_RECT, STAGE as CROWN_STAGE } from '../src/ui/crownScreen'
import {
  ROOM_RECT,
  paletteRect,
  TRASH_RECT,
  CLEAR_RECT,
  PREV_RECT as ROOM_PREV,
  NEXT_RECT as ROOM_NEXT,
} from '../src/ui/roomScreen'
import { stickerRect } from '../src/ui/albumScreen'
import { BACKDROPS } from '../src/doll/backdrop'
import { COIN_RECT, MUTE_RECT, BACK_RECT, TOP_H } from '../src/render/ui'

function inScreen(r: Rect): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.w <= VIEW_W && r.y + r.h <= VIEW_H
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/** 손가락으로 누를 만한 크기인가 */
function tappable(r: Rect): boolean {
  return r.w >= 20 && r.h >= 20
}

describe('공통 부품', () => {
  it('스티커·뒤로·소리 버튼이 상단 HUD 안에 있고 서로 안 겹친다', () => {
    for (const r of [COIN_RECT, BACK_RECT, MUTE_RECT]) {
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      expect(r.y + r.h).toBeLessThanOrEqual(TOP_H)
    }
    expect(overlaps(BACK_RECT, MUTE_RECT)).toBe(false)
    expect(overlaps(COIN_RECT, BACK_RECT)).toBe(false)
    expect(overlaps(COIN_RECT, MUTE_RECT)).toBe(false)
  })
})

describe('허브', () => {
  it('카드가 전부 화면 안에 있다', () => {
    for (let i = 0; i < GAMES.length; i++) {
      expect(inScreen(cardRect(i))).toBe(true)
      expect(tappable(cardRect(i))).toBe(true)
    }
  })

  it('카드끼리 겹치지 않는다', () => {
    for (let i = 1; i < GAMES.length; i++) {
      expect(overlaps(cardRect(i - 1), cardRect(i))).toBe(false)
    }
  })

  it('카드가 인형 자리·HUD 와 겹치지 않는다', () => {
    for (let i = 0; i < GAMES.length; i++) {
      expect(overlaps(cardRect(i), HUB_DOLL_BOX)).toBe(false)
      expect(cardRect(i).y).toBeGreaterThanOrEqual(TOP_H)
    }
  })

  it('마지막 카드 아래에 스티커 줄 자리가 남는다', () => {
    expect(lastCardBottom()).toBeLessThan(STICKER_BAR.y)
    expect(inScreen(STICKER_BAR)).toBe(true)
  })
})

describe('옷장', () => {
  it('무대는 화면 전체이고 인형은 HUD 아래 왼쪽에 선다', () => {
    expect(STAGE).toEqual({ x: 0, y: 0, w: VIEW_W, h: VIEW_H })
    expect(DOLL_BOX.y).toBeGreaterThanOrEqual(TOP_H)
    expect(inScreen(DOLL_BOX)).toBe(true)
    // 인형 좌표계가 배율 1 로 그려진다 — 참고작처럼 크게
    expect(DOLL_BOX.w).toBeGreaterThanOrEqual(DOLL_W)
    expect(DOLL_BOX.h).toBeGreaterThanOrEqual(DOLL_H)
  })

  it('말풍선은 인형 머리 위 빈 공간에 뜬다', () => {
    expect(inScreen(BUBBLE_RECT)).toBe(true)
    expect(BUBBLE_RECT.y).toBeGreaterThanOrEqual(TOP_H)
    // 인형(배율 1)의 머리카락 꼭대기
    const headTop = DOLL_BOX.y + DOLL_BOX.h - DOLL_H + A.hairTop
    expect(BUBBLE_RECT.y + BUBBLE_RECT.h + 9).toBeLessThanOrEqual(headTop)
  })

  it('분류 레일 열 개가 오른쪽 끝에 세로로 서고 누를 만하다', () => {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const r = tabRect(i)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      expect(r.y).toBeGreaterThanOrEqual(TOP_H)
      expect(overlaps(r, DOLL_BOX)).toBe(false)
      if (i > 0) expect(overlaps(tabRect(i - 1), r)).toBe(false)
    }
  })

  it('옷 칸 여섯 개가 세로 한 열이고 서로·레일·인형과 안 겹친다', () => {
    for (let i = 0; i < PER_PAGE; i++) {
      const r = itemRect(i)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      expect(overlaps(r, DOLL_BOX)).toBe(false)
      for (let j = 0; j < CATEGORIES.length; j++) expect(overlaps(r, tabRect(j))).toBe(false)
      for (let j = i + 1; j < PER_PAGE; j++) expect(overlaps(r, itemRect(j))).toBe(false)
    }
  })

  it('페이지 화살표가 옷 칸 위·아래에 있고 가리지 않는다', () => {
    for (let i = 0; i < PER_PAGE; i++) {
      expect(overlaps(PREV_RECT, itemRect(i))).toBe(false)
      expect(overlaps(NEXT_RECT, itemRect(i))).toBe(false)
    }
    expect(inScreen(PREV_RECT)).toBe(true)
    expect(inScreen(NEXT_RECT)).toBe(true)
    expect(PREV_RECT.y + PREV_RECT.h).toBeLessThanOrEqual(itemRect(0).y)
    expect(NEXT_RECT.y).toBeGreaterThanOrEqual(itemRect(PER_PAGE - 1).y + itemRect(PER_PAGE - 1).h)
  })

  it('색 견본이 인형과 옷 칸 사이에 들어가고 옷 칸·레일과 안 겹친다', () => {
    for (const cat of TINTABLE) {
      const n = SWATCHES[cat]!.length
      expect(n).toBe(6)
      expect(inScreen(swatchPillRect(n))).toBe(true)
      for (let i = 0; i <= n; i++) {
        const r = swatchRect(i)
        expect(inScreen(r)).toBe(true)
        expect(tappable(r)).toBe(true)
        for (let j = 0; j < PER_PAGE; j++) expect(overlaps(r, itemRect(j))).toBe(false)
        for (let j = 0; j < CATEGORIES.length; j++) expect(overlaps(r, tabRect(j))).toBe(false)
        if (i > 0) expect(overlaps(swatchRect(i - 1), r)).toBe(false)
      }
    }
  })

  it('도구 다섯 개가 아래 왼쪽에 원형으로 늘어서고 레일과 안 겹친다', () => {
    for (let i = 0; i < CLOSET_TOOLS.length; i++) {
      const r = toolRect(i, CLOSET_TOOLS)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      expect(r.y).toBeGreaterThanOrEqual(DOLL_BOX.y + DOLL_BOX.h)
      if (i > 0) expect(overlaps(toolRect(i - 1, CLOSET_TOOLS), r)).toBe(false)
      for (let j = 0; j < CATEGORIES.length; j++) expect(overlaps(r, tabRect(j))).toBe(false)
    }
  })

  it('배경 카드 일곱 개가 화면 안이고 안 겹친다', () => {
    for (let i = 0; i < BACKDROPS.length; i++) {
      expect(inScreen(backdropRect(i))).toBe(true)
      expect(backdropRect(i).y).toBeGreaterThanOrEqual(TOP_H)
      for (let j = i + 1; j < BACKDROPS.length; j++) {
        expect(overlaps(backdropRect(i), backdropRect(j))).toBe(false)
      }
    }
  })

  it('룩북 아홉 칸이 화면 안이다', () => {
    for (let i = 0; i < 9; i++) {
      expect(inScreen(lookRect(i))).toBe(true)
      expect(lookRect(i).y).toBeGreaterThanOrEqual(TOP_H)
    }
  })
})

describe('패션쇼', () => {
  it('미션 스무 칸이 화면 안이고 안 겹친다', () => {
    for (let i = 0; i < MISSIONS.length; i++) {
      expect(inScreen(missionRect(i))).toBe(true)
      expect(tappable(missionRect(i))).toBe(true)
      expect(missionRect(i).y).toBeGreaterThanOrEqual(TOP_H)
    }
    for (let i = 1; i < MISSIONS.length; i++) {
      expect(overlaps(missionRect(i - 1), missionRect(i))).toBe(false)
    }
  })

  it('이어서 하기 버튼이 미션 칸 아래에 있다', () => {
    const last = missionRect(MISSIONS.length - 1)
    expect(CONTINUE_RECT.y).toBeGreaterThan(last.y + last.h)
    expect(inScreen(CONTINUE_RECT)).toBe(true)
  })

  it('도구 셋은 원형, 완성은 오른쪽 아래 큰 버튼이고 서로 안 겹친다', () => {
    expect(toolRect(RUNWAY_TOOLS.indexOf('done'), RUNWAY_TOOLS)).toEqual(CTA_RECT)
    for (let i = 0; i < RUNWAY_TOOLS.length; i++) {
      const r = toolRect(i, RUNWAY_TOOLS)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      for (let j = i + 1; j < RUNWAY_TOOLS.length; j++) {
        expect(overlaps(r, toolRect(j, RUNWAY_TOOLS))).toBe(false)
      }
      for (let j = 0; j < CATEGORIES.length; j++) expect(overlaps(r, tabRect(j))).toBe(false)
    }
  })
})

describe('왕관 공방', () => {
  it('작업대가 HUD 아래에 있고 보석·바탕·버튼이 화면 안이며 작업대와 안 겹친다', () => {
    expect(CROWN_STAGE.y).toBeGreaterThanOrEqual(TOP_H)
    for (let i = 0; i < 8; i++) {
      expect(inScreen(gemRect(i))).toBe(true)
      expect(tappable(gemRect(i))).toBe(true)
      expect(overlaps(CROWN_STAGE, gemRect(i))).toBe(false)
    }
    for (let i = 0; i < 3; i++) {
      expect(inScreen(baseRect(i))).toBe(true)
      expect(inScreen(savedRect(i))).toBe(true)
    }
    expect(inScreen(SAVE_RECT)).toBe(true)
  })
})

describe('방 꾸미기', () => {
  it('방이 HUD 아래에서 시작하고 창고·버튼과 겹치지 않는다', () => {
    expect(ROOM_RECT.y).toBeGreaterThanOrEqual(TOP_H)
    for (let i = 0; i < 8; i++) {
      expect(inScreen(paletteRect(i))).toBe(true)
      expect(tappable(paletteRect(i))).toBe(true)
      expect(overlaps(ROOM_RECT, paletteRect(i))).toBe(false)
      expect(overlaps(TRASH_RECT, paletteRect(i))).toBe(false)
      expect(overlaps(CLEAR_RECT, paletteRect(i))).toBe(false)
    }
    for (const r of [ROOM_PREV, ROOM_NEXT]) {
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      for (let i = 0; i < 8; i++) expect(overlaps(r, paletteRect(i))).toBe(false)
    }
    expect(inScreen(ROOM_RECT)).toBe(true)
    expect(inScreen(TRASH_RECT)).toBe(true)
    expect(inScreen(CLEAR_RECT)).toBe(true)
    expect(overlaps(TRASH_RECT, CLEAR_RECT)).toBe(false)
  })

  it('가구가 한 페이지를 넘으면 화살표가 필요하다', () => {
    expect(FURNITURE.length).toBeGreaterThan(8)
  })
})

describe('스티커 앨범', () => {
  it('스티커 칸이 전부 화면 안이다', () => {
    for (let i = 0; i < STICKERS.length; i++) {
      expect(inScreen(stickerRect(i))).toBe(true)
      expect(tappable(stickerRect(i))).toBe(true)
      expect(stickerRect(i).y).toBeGreaterThanOrEqual(TOP_H)
    }
  })
})
