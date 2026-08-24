/**
 * 놀이 다섯 개를 실제로 눌러 보는 검사.
 *
 * 그리기(ctx)는 브라우저가 필요하지만 **누르기는 아니다.** 화면 좌표를
 * 계산해 pointerDown 을 부르고, 저장값이 바뀌었는지만 본다.
 * 손으로 열어 보지 않고도 "탭이 먹히는지" 를 확인할 수 있는 유일한 방법이다.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// createStore 가 window.localStorage 를 읽으므로 먼저 심어 둔다
const mem = new Map<string, string>()
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v)
    },
  },
})

const { createStore } = await import('../src/apps/store')
const { createClosetApp } = await import('../src/apps/closetApp')
const { createRunwayApp } = await import('../src/apps/runwayApp')
const { createCrownApp } = await import('../src/apps/crownApp')
const { createRoomApp } = await import('../src/apps/roomApp')
const { createAlbumApp } = await import('../src/apps/albumApp')
const closetUi = await import('../src/ui/closetScreen')
const runwayUi = await import('../src/ui/runwayScreen')
const crownUi = await import('../src/ui/crownScreen')
const roomUi = await import('../src/ui/roomScreen')
const albumUi = await import('../src/ui/albumScreen')
const { CATEGORIES } = await import('../src/doll/kinds')
const { BACK_RECT } = await import('../src/render/ui')
const { itemsOf } = await import('../src/doll/wardrobe')
const { SLOTS } = await import('../src/doll/custom')
const { cropFit } = await import('../src/render/paint')
const { FURNITURE } = await import('../src/room/items')
const { MISSIONS } = await import('../src/runway/missions')

/** 소리는 내지 않는다 */
const silentAudio = {
  play: () => {},
  setMuted: () => {},
  muted: () => false,
  unlock: () => {},
  resume: async () => {},
  startBgm: () => {},
  stopBgm: () => {},
  state: () => 'none',
}

function center(r: { x: number; y: number; w: number; h: number }): [number, number] {
  return [r.x + r.w / 2, r.y + r.h / 2]
}

function newStore(): ReturnType<typeof createStore> {
  mem.clear()
  return createStore()
}

describe('공주 옷장 조작', () => {
  let store: ReturnType<typeof createStore>
  let app: ReturnType<typeof createClosetApp>

  beforeEach(() => {
    store = newStore()
    app = createClosetApp(store, silentAudio)
    app.enter()
  })

  it('옷 칸을 누르면 입고, 다시 누르면 벗는다', () => {
    const [x, y] = center(closetUi.itemRect(0))
    app.pointerDown(x, y)
    expect(store.outfit().dress).toBe(itemsOf('dress')[0]!.id)
    app.pointerDown(x, y)
    expect(store.outfit().dress).toBeUndefined()
  })

  it('분류 탭을 누르면 그 분류의 옷이 나온다', () => {
    const crownTab = CATEGORIES.findIndex((c) => c.id === 'crown')
    app.pointerDown(...center(closetUi.tabRect(crownTab)))
    app.pointerDown(...center(closetUi.itemRect(0)))
    expect(store.outfit().crown).toBe(itemsOf('crown')[0]!.id)
  })

  it('랜덤 버튼은 드레스와 머리를 채운다', () => {
    app.pointerDown(...center(closetUi.toolRect(0, closetUi.CLOSET_TOOLS.length)))
    expect(store.outfit().dress).toBeTruthy()
    expect(store.outfit().hair).toBeTruthy()
  })

  it('다벗기는 기본 옷만 남긴다', () => {
    app.pointerDown(...center(closetUi.toolRect(0, closetUi.CLOSET_TOOLS.length)))
    app.pointerDown(...center(closetUi.toolRect(1, closetUi.CLOSET_TOOLS.length)))
    expect(Object.keys(store.outfit()).length).toBe(0)
  })

  it('배경을 바꾼다', () => {
    app.pointerDown(...center(closetUi.toolRect(2, closetUi.CLOSET_TOOLS.length)))
    expect(app.screen()).toBe('backdrop')
    app.pointerDown(...center(closetUi.backdropRect(3)))
    expect(store.backdrop()).toBe('snow')
    expect(app.screen()).toBe('play')
  })

  it('사진은 옷을 입어야 찍힌다', () => {
    const photo = center(closetUi.toolRect(3, closetUi.CLOSET_TOOLS.length))
    app.pointerDown(...photo)
    expect(store.looks().length).toBe(0)

    app.pointerDown(...center(closetUi.itemRect(0)))
    app.pointerDown(...photo)
    expect(store.looks().length).toBe(1)
  })

  it('룩북에서 코디를 되살린다', () => {
    app.pointerDown(...center(closetUi.itemRect(1)))
    const worn = store.outfit().dress
    app.pointerDown(...center(closetUi.toolRect(3, closetUi.CLOSET_TOOLS.length)))
    app.pointerDown(...center(closetUi.toolRect(1, closetUi.CLOSET_TOOLS.length)))
    expect(store.outfit().dress).toBeUndefined()

    app.pointerDown(...center(closetUi.toolRect(4, closetUi.CLOSET_TOOLS.length)))
    expect(app.screen()).toBe('lookbook')
    app.pointerDown(...center(closetUi.lookRect(0)))
    expect(store.outfit().dress).toBe(worn)
    expect(app.screen()).toBe('play')
  })

  it('룩북에서 사진을 지운다', () => {
    app.pointerDown(...center(closetUi.itemRect(0)))
    app.pointerDown(...center(closetUi.toolRect(3, closetUi.CLOSET_TOOLS.length)))
    app.pointerDown(...center(closetUi.toolRect(4, closetUi.CLOSET_TOOLS.length)))
    app.pointerDown(...center(closetUi.lookDeleteRect(0)))
    expect(store.looks().length).toBe(0)
  })

  it('페이지를 넘기면 다음 옷이 나온다', () => {
    app.pointerDown(...center(closetUi.NEXT_RECT))
    app.pointerDown(...center(closetUi.itemRect(0)))
    expect(store.outfit().dress).toBe(itemsOf('dress')[8]!.id)
  })

  it('뒤로 버튼은 하위 화면에서 옷장으로, 옷장에서 허브로', () => {
    app.pointerDown(...center(closetUi.toolRect(4, closetUi.CLOSET_TOOLS.length)))
    expect(app.pointerDown(...center(BACK_RECT))).toBeNull()
    expect(app.screen()).toBe('play')
    expect(app.pointerDown(...center(BACK_RECT))).toBe('hub')
  })

  it('첫 드레스를 입으면 스티커가 나온다', () => {
    app.pointerDown(...center(closetUi.itemRect(0)))
    expect(store.takeSticker()).toBe('first-dress')
  })
})

describe('패션쇼 조작', () => {
  let store: ReturnType<typeof createStore>
  let app: ReturnType<typeof createRunwayApp>

  beforeEach(() => {
    store = newStore()
    app = createRunwayApp(store, silentAudio)
    app.enter()
  })

  it('미션을 고르면 꾸미기로 들어간다', () => {
    expect(app.screen()).toBe('list')
    app.pointerDown(...center(runwayUi.missionRect(0)))
    expect(app.screen()).toBe('dress')
  })

  it('조건을 맞추고 완성하면 별 셋', () => {
    app.pointerDown(...center(runwayUi.missionRect(0))) // 드레스 입히기
    app.pointerDown(...center(closetUi.itemRect(0)))
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length))) // 완성!
    expect(app.screen()).toBe('result')
    expect(store.runway()[MISSIONS[0]!.id]).toBe(3)
  })

  it('아무것도 안 입고 완성하면 별이 없지만 막지 않는다', () => {
    app.pointerDown(...center(runwayUi.missionRect(1)))
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length)))
    expect(app.screen()).toBe('result')
    expect(store.runway()[MISSIONS[1]!.id]).toBeUndefined()
  })

  it('결과에서 다음 미션으로 넘어간다', () => {
    app.pointerDown(...center(runwayUi.missionRect(0)))
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length)))
    app.pointerDown(...center(runwayUi.RESULT_NEXT))
    expect(app.screen()).toBe('dress')
  })

  it('결과에서 목록으로 돌아간다', () => {
    app.pointerDown(...center(runwayUi.missionRect(0)))
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length)))
    app.pointerDown(...center(runwayUi.RESULT_LIST))
    expect(app.screen()).toBe('list')
  })

  it('최고 기록은 깎이지 않는다', () => {
    app.pointerDown(...center(runwayUi.missionRect(0)))
    app.pointerDown(...center(closetUi.itemRect(0)))
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length)))
    app.pointerDown(...center(runwayUi.RESULT_AGAIN))
    app.pointerDown(...center(closetUi.toolRect(1, runwayUi.RUNWAY_TOOLS.length))) // 다벗기
    app.pointerDown(...center(closetUi.toolRect(3, runwayUi.RUNWAY_TOOLS.length)))
    expect(store.runway()[MISSIONS[0]!.id]).toBe(3)
  })

  it('이어서 하기는 아직 못 깬 미션을 연다', () => {
    store.setRunway({ [MISSIONS[0]!.id]: 3 })
    app.enter()
    app.pointerDown(...center(runwayUi.CONTINUE_RECT))
    expect(app.screen()).toBe('dress')
  })
})

describe('왕관 공방 조작', () => {
  let store: ReturnType<typeof createStore>
  let app: ReturnType<typeof createCrownApp>

  const slotPoint = (i: number): [number, number] => {
    const fit = cropFit(crownUi.STAGE, crownUi.HEAD_VIEW)
    const [sx, sy] = SLOTS[i]!
    return [fit.dx + sx * fit.k, fit.dy + (sy - 5) * fit.k]
  }

  beforeEach(() => {
    store = newStore()
    app = createCrownApp(store, silentAudio)
    app.enter()
  })

  it('보석을 고르고 칸을 두드리면 붙는다', () => {
    app.pointerDown(...center(crownUi.gemRect(2)))
    app.pointerDown(...slotPoint(0))
    app.pointerDown(...center(crownUi.SAVE_RECT))
    expect(store.crowns().length).toBe(1)
    expect(store.crowns()[0]!.gems[0]).toBe('emerald')
  })

  it('만든 왕관을 바로 쓰고 있다', () => {
    app.pointerDown(...center(crownUi.gemRect(0)))
    app.pointerDown(...slotPoint(3))
    app.pointerDown(...center(crownUi.SAVE_RECT))
    expect(store.outfit().crown).toBe('custom-crown-0')
    // 옷장에도 아이템으로 들어가 있다
    expect(store.extraItems().some((i) => i.id === 'custom-crown-0')).toBe(true)
  })

  it('빈 왕관은 저장하지 않는다', () => {
    app.pointerDown(...center(crownUi.SAVE_RECT))
    expect(store.crowns().length).toBe(0)
  })

  it('지우개로 보석을 뺀다', () => {
    app.pointerDown(...center(crownUi.gemRect(1)))
    app.pointerDown(...slotPoint(2))
    app.pointerDown(...center(crownUi.ERASER_RECT))
    app.pointerDown(...slotPoint(2))
    app.pointerDown(...center(crownUi.SAVE_RECT))
    expect(store.crowns().length).toBe(0)
  })

  it('네 개째를 만들면 가장 오래된 것이 밀린다', () => {
    for (let n = 0; n < 4; n++) {
      app.pointerDown(...center(crownUi.gemRect(n)))
      app.pointerDown(...slotPoint(n))
      app.pointerDown(...center(crownUi.SAVE_RECT))
    }
    expect(store.crowns().length).toBe(3)
  })

  it('바탕 금속을 바꾼다', () => {
    app.pointerDown(...center(crownUi.baseRect(1)))
    app.pointerDown(...center(crownUi.gemRect(0)))
    app.pointerDown(...slotPoint(0))
    app.pointerDown(...center(crownUi.SAVE_RECT))
    expect(store.crowns()[0]!.base).toBe('gold')
  })
})

describe('방 꾸미기 조작', () => {
  let store: ReturnType<typeof createStore>
  let app: ReturnType<typeof createRoomApp>

  beforeEach(() => {
    store = newStore()
    app = createRoomApp(store, silentAudio)
    app.enter()
  })

  it('가구를 고르고 방을 두드리면 놓인다', () => {
    app.pointerDown(...center(roomUi.paletteRect(0)))
    app.pointerDown(180, roomUi.ROOM_RECT.y + 340)
    expect(store.room().length).toBe(1)
    expect(store.room()[0]!.kind).toBe(FURNITURE[0]!.kind)
  })

  it('고르지 않고 두드리면 아무 일도 없다', () => {
    app.pointerDown(180, roomUi.ROOM_RECT.y + 340)
    expect(store.room().length).toBe(0)
  })

  it('놓인 가구를 끌어서 옮긴다', () => {
    app.pointerDown(...center(roomUi.paletteRect(0)))
    app.pointerDown(120, roomUi.ROOM_RECT.y + 340)
    const before = store.room()[0]!.x
    app.pointerDown(120, roomUi.ROOM_RECT.y + 330) // 잡기
    app.pointerMove(220, roomUi.ROOM_RECT.y + 340)
    app.pointerUp(220, roomUi.ROOM_RECT.y + 340)
    expect(store.room()[0]!.x).not.toBe(before)
  })

  it('고른 가구를 치운다', () => {
    app.pointerDown(...center(roomUi.paletteRect(0)))
    app.pointerDown(120, roomUi.ROOM_RECT.y + 340)
    app.pointerDown(...center(roomUi.TRASH_RECT))
    expect(store.room().length).toBe(0)
  })

  it('다치우기는 두 번 눌러야 한다', () => {
    app.pointerDown(...center(roomUi.paletteRect(0)))
    app.pointerDown(120, roomUi.ROOM_RECT.y + 340)
    app.pointerDown(...center(roomUi.CLEAR_RECT))
    expect(store.room().length).toBe(1)
    app.pointerDown(...center(roomUi.CLEAR_RECT))
    expect(store.room().length).toBe(0)
  })

  it('창고 페이지를 넘기면 다른 가구가 나온다', () => {
    app.pointerDown(...center(roomUi.NEXT_RECT))
    app.pointerDown(...center(roomUi.paletteRect(0)))
    app.pointerDown(180, roomUi.ROOM_RECT.y + 340)
    expect(store.room()[0]!.kind).toBe(FURNITURE[roomUi.PER_PAGE]!.kind)
  })
})

describe('스티커 앨범 조작', () => {
  it('스티커를 누르면 설명이 열리고 다시 누르면 닫힌다', () => {
    const store = newStore()
    const app = createAlbumApp(store, silentAudio)
    app.enter()
    expect(app.screen()).toBe('album')
    app.pointerDown(...center(albumUi.stickerRect(0)))
    expect(app.screen()).toBe('detail')
    app.pointerDown(180, 320)
    expect(app.screen()).toBe('album')
    expect(app.pointerDown(...center(BACK_RECT))).toBe('hub')
  })
})

describe('놀이 사이 연결', () => {
  it('공방에서 만든 왕관이 옷장 왕관 칸에 나타난다', () => {
    const store = newStore()
    const crown = createCrownApp(store, silentAudio)
    crown.enter()
    const fit = cropFit(crownUi.STAGE, crownUi.HEAD_VIEW)
    const [sx, sy] = SLOTS[0]!
    crown.pointerDown(...center(crownUi.gemRect(0)))
    crown.pointerDown(fit.dx + sx * fit.k, fit.dy + (sy - 5) * fit.k)
    crown.pointerDown(...center(crownUi.SAVE_RECT))

    const closet = createClosetApp(store, silentAudio)
    closet.enter()
    const crownTab = CATEGORIES.findIndex((c) => c.id === 'crown')
    closet.pointerDown(...center(closetUi.tabRect(crownTab)))
    // 공방이 이미 씌워 놨으므로 한 번 누르면 벗고, 다시 누르면 쓴다.
    // 기본 왕관 6개 뒤 일곱 번째 칸이 내가 만든 왕관이다.
    expect(store.outfit().crown).toBe('custom-crown-0')
    closet.pointerDown(...center(closetUi.itemRect(6)))
    expect(store.outfit().crown).toBeUndefined()
    closet.pointerDown(...center(closetUi.itemRect(6)))
    expect(store.outfit().crown).toBe('custom-crown-0')
  })

  it('허브 진행도 문구가 상태에 따라 바뀐다', () => {
    const store = newStore()
    const closet = createClosetApp(store, silentAudio)
    expect(closet.label()).toContain('옷을 골라주세요')
    store.setOutfit({ dress: itemsOf('dress')[0]!.id })
    expect(closet.label()).toContain('1칸')
  })
})
