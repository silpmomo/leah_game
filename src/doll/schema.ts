/**
 * 옷장 데이터 검사.
 *
 * 옷은 데이터로 찍어내므로 오타 하나가 조용히 통과해 "안 보이는 옷" 이 된다.
 * 부팅할 때 한 번 검사해서, 검은 화면 대신 무엇이 잘못됐는지 보여 준다.
 * (리온의 대모험에서 레벨을 이렇게 검사했더니 도움이 컸다)
 */
import { COLOR_NAME, THEME_NAME, CATEGORIES, type Item } from './kinds'
import { DOLL_H, DOLL_W } from './body'

function fail(msg: string): never {
  throw new Error(`옷장 데이터 오류: ${msg}`)
}

export function assertValidWardrobe(items: readonly Item[]): void {
  const cats = new Set(CATEGORIES.map((c) => c.id))
  const seen = new Set<string>()

  for (const it of items) {
    if (!it.id) fail('아이디가 없는 아이템이 있다')
    if (seen.has(it.id)) fail(`아이디가 겹친다: ${it.id}`)
    seen.add(it.id)

    if (!cats.has(it.cat)) fail(`${it.id}: 모르는 분류 ${it.cat}`)
    if (!it.name) fail(`${it.id}: 이름이 없다`)
    if (!(it.color in COLOR_NAME)) fail(`${it.id}: 모르는 색 ${it.color}`)
    if (it.theme && !(it.theme in THEME_NAME)) fail(`${it.id}: 모르는 테마 ${it.theme}`)

    const pieces = [...(it.back ?? []), ...it.front, ...(it.sleeves ?? [])]
    if (pieces.length === 0) fail(`${it.id}: 그릴 조각이 하나도 없다`)
    for (const s of pieces) {
      if (!s.d) fail(`${it.id}: 경로가 빈 조각이 있다`)
      if (!s.fill && !s.stroke) fail(`${it.id}: 칠도 선도 없는 조각이 있다`)
      if (s.stroke && !s.lw) fail(`${it.id}: 선 두께가 없는 조각이 있다`)
    }

    const t = it.thumb
    if (t.w <= 0 || t.h <= 0) fail(`${it.id}: 썸네일 영역이 비었다`)
    if (t.x < -20 || t.y < -20 || t.x + t.w > DOLL_W + 20 || t.y + t.h > DOLL_H + 20) {
      fail(`${it.id}: 썸네일 영역이 인형 밖이다`)
    }
  }

  // 분류마다 최소 하나는 있어야 탭을 눌렀을 때 빈 화면이 안 뜬다
  for (const c of CATEGORIES) {
    if (!items.some((i) => i.cat === c.id)) fail(`${c.name} 분류에 아이템이 없다`)
  }
}
