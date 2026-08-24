/**
 * 화면 배치 검사.
 *
 * 세로 한 화면(360 x 640)에 다 들어가야 한다. 버튼이 화면 밖으로 조금만
 * 나가도 아이는 그 기능이 없는 줄 안다. 그림을 그리지 않고 사각형만 본다.
 */
import { describe, expect, it } from 'vitest'
import { VIEW_H, VIEW_W, type Rect } from '../src/engine/view'
import { CATEGORIES } from '../src/doll/kinds'
import { GAMES } from '../src/games/registry'
import { MISSIONS } from '../src/runway/missions'
import { STICKERS } from '../src/stickers/album'
import { FURNITURE } from '../src/room/items'
import { cardRect, lastCardBottom } from '../src/ui/hub'
import {
  CLOSET_TOOLS,
  DOLL_BOX,
  PER_PAGE,
  PREV_RECT,
  NEXT_RECT,
  STAGE,
  backdropRect,
  itemRect,
  lookRect,
  tabRect,
  toolRect,
} from '../src/ui/closetScreen'
import { CONTINUE_RECT, RUNWAY_TOOLS, missionRect } from '../src/ui/runwayScreen'
import { gemRect, baseRect, savedRect, SAVE_RECT, STAGE as CROWN_STAGE } from '../src/ui/crownScreen'
import { ROOM_RECT, paletteRect, TRASH_RECT, CLEAR_RECT } from '../src/ui/roomScreen'
import { stickerRect } from '../src/ui/albumScreen'
import { BACKDROPS } from '../src/doll/backdrop'
import { MUTE_RECT, BACK_RECT, TOP_H } from '../src/render/ui'

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
  it('뒤로·소리 버튼이 상단바 안에 있다', () => {
    expect(inScreen(BACK_RECT)).toBe(true)
    expect(inScreen(MUTE_RECT)).toBe(true)
    expect(BACK_RECT.y + BACK_RECT.h).toBeLessThanOrEqual(TOP_H)
    expect(MUTE_RECT.y + MUTE_RECT.h).toBeLessThanOrEqual(TOP_H)
    expect(overlaps(BACK_RECT, MUTE_RECT)).toBe(false)
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

  it('마지막 카드 아래에 스티커 줄 자리가 남는다', () => {
    expect(lastCardBottom()).toBeLessThan(VIEW_H - 50)
  })
})

describe('옷장', () => {
  it('무대·탭·옷칸·도구가 겹치지 않고 순서대로 쌓인다', () => {
    const tab = tabRect(0)
    const lastTab = tabRect(CATEGORIES.length - 1)
    const cell = itemRect(0)
    const lastCell = itemRect(PER_PAGE - 1)
    const tool = toolRect(0, CLOSET_TOOLS.length)

    expect(STAGE.y).toBeGreaterThanOrEqual(TOP_H)
    expect(STAGE.y + STAGE.h).toBeLessThanOrEqual(tab.y)
    expect(lastTab.y + lastTab.h).toBeLessThanOrEqual(cell.y)
    expect(lastCell.y + lastCell.h).toBeLessThanOrEqual(tool.y)
    expect(tool.y + tool.h).toBeLessThanOrEqual(VIEW_H)
  })

  it('탭 열 개가 모두 화면 안이고 누를 만하다', () => {
    for (let i = 0; i < CATEGORIES.length; i++) {
      expect(inScreen(tabRect(i))).toBe(true)
      expect(tappable(tabRect(i))).toBe(true)
    }
  })

  it('옷 칸 여덟 개가 화면 안이고 서로 안 겹친다', () => {
    for (let i = 0; i < PER_PAGE; i++) {
      expect(inScreen(itemRect(i))).toBe(true)
      expect(tappable(itemRect(i))).toBe(true)
      for (let j = i + 1; j < PER_PAGE; j++) {
        expect(overlaps(itemRect(i), itemRect(j))).toBe(false)
      }
    }
  })

  it('페이지 화살표가 옷 칸을 가리지 않는다', () => {
    for (let i = 0; i < PER_PAGE; i++) {
      expect(overlaps(PREV_RECT, itemRect(i))).toBe(false)
      expect(overlaps(NEXT_RECT, itemRect(i))).toBe(false)
    }
    expect(inScreen(PREV_RECT)).toBe(true)
    expect(inScreen(NEXT_RECT)).toBe(true)
  })

  it('도구 다섯 개가 한 줄에 들어간다', () => {
    for (let i = 0; i < CLOSET_TOOLS.length; i++) {
      const r = toolRect(i, CLOSET_TOOLS.length)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
      if (i > 0) expect(overlaps(toolRect(i - 1, CLOSET_TOOLS.length), r)).toBe(false)
    }
  })

  it('인형 자리는 무대 안이고 말풍선 자리를 비워 둔다', () => {
    expect(DOLL_BOX.y).toBeGreaterThanOrEqual(STAGE.y)
    expect(DOLL_BOX.y + DOLL_BOX.h).toBeLessThan(STAGE.y + STAGE.h - 40)
  })

  it('배경 카드 여섯 개가 화면 안이다', () => {
    for (let i = 0; i < BACKDROPS.length; i++) {
      expect(inScreen(backdropRect(i))).toBe(true)
    }
  })

  it('룩북 아홉 칸이 화면 안이다', () => {
    for (let i = 0; i < 9; i++) {
      expect(inScreen(lookRect(i))).toBe(true)
    }
  })
})

describe('패션쇼', () => {
  it('미션 스무 칸이 화면 안이고 안 겹친다', () => {
    for (let i = 0; i < MISSIONS.length; i++) {
      expect(inScreen(missionRect(i))).toBe(true)
      expect(tappable(missionRect(i))).toBe(true)
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

  it('도구 네 개도 한 줄에 들어간다', () => {
    for (let i = 0; i < RUNWAY_TOOLS.length; i++) {
      const r = toolRect(i, RUNWAY_TOOLS.length)
      expect(inScreen(r)).toBe(true)
      expect(tappable(r)).toBe(true)
    }
  })
})

describe('왕관 공방', () => {
  it('보석·바탕·버튼이 화면 안이고 작업대와 안 겹친다', () => {
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
  it('방과 창고가 겹치지 않는다', () => {
    for (let i = 0; i < 8; i++) {
      expect(inScreen(paletteRect(i))).toBe(true)
      expect(overlaps(ROOM_RECT, paletteRect(i))).toBe(false)
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
    }
  })
})
