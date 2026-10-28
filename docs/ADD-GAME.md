# 놀이 추가하기

첫 화면은 **허브**다. `src/games/registry.ts` 의 `GAMES` 배열을 그대로 그린다.
놀이를 늘리려면 이 파일에 항목을 넣고, `main.ts` 의 `APPS` 에 한 줄 더하면 된다.

## 화면 흐름

```
hub (놀이 고르기)
 └─ closet | runway | crown | room | album
      각 놀이가 화면을 통째로 가지고, 안에서 하위 화면을 관리한다
      좌상단 분홍 뒤로 버튼이 한 단계씩 위로, Esc 도 같다
```

## 1. 레지스트리에 항목 추가

```ts
// src/games/registry.ts
{
  id: 'puzzle',          // 영문 소문자. localStorage 이름공간이 된다
  title: '리아의 퍼즐',
  subtitle: '조각을 맞춰요',   // 개수를 여기 적지 않는다 (진행도 줄이 만든다)
  status: 'ready',       // 만들기 전에는 'soon'
  accent: '#ffd76a',
  emoji: '🧩',
}
```

카드는 오른쪽에 세로로 쌓이고 자리는 자동으로 잡힌다. `tests/layout.test.ts` 가
카드가 화면 안에 들어가는지, 인형 자리·스티커 줄과 겹치지 않는지 검사한다.
여섯 개째부터는 `ui/hub.ts` 의 `CARD_H` 를 줄여야 한다.

## 2. GameApp 만들기

`src/apps/<이름>App.ts` 에 `GameApp` 모양을 지키는 객체를 만든다.

```ts
export function createPuzzleApp(store: Store, audio: Audio): GameApp {
  return {
    screen: () => 'play',
    enter() {},                    // 허브에서 들어올 때
    update(dt) {},
    render(ctx, tick) {},
    pointerDown(px, py) {          // 'hub' 를 돌려주면 허브로 나간다
      if (backHit(px, py)) return 'hub'
      return null
    },
    pointerMove(px, py) {},
    pointerUp(px, py) {},
    key(code) {},
    escape: () => 'hub',
    blur() {},
    label: () => '아직 시작 전',    // 허브 카드에 뜨는 진행도 한 줄
    track: () => 'closet',         // 배경음
  }
}
```

`main.ts` 는 `APPS` 표에 한 줄 넣는 것으로 끝난다. **기존 놀이 코드는 건드리지
않는다** — 이게 규칙이다. 돌아가는 놀이를 고쳐 가며 새 놀이를 붙이면 둘 다 망가진다.

## 3. 저장은 store 를 통한다

새 저장값이 필요하면 `src/apps/store.ts` 에 넣는다. 키·정제·스티커 판정이
한 곳에 모여 있어야 한다.

```ts
const K = { puzzle: storageKey('puzzle', 'progress') }   // leah_game.puzzle.progress
```

- 정제 함수(`sanitizeXxx`)를 반드시 만든다. 저장값이 깨져도 놀이가 죽으면 안 된다.
- 스티커 조건을 늘리려면 `src/stickers/album.ts` 의 `STICKERS` 와 `RULES` 에
  같은 아이디로 한 줄씩 넣고, `store.world()` 가 판정에 필요한 값을 채워 준다.

## 4. 공유되는 것

| 모듈 | 쓰임 |
|---|---|
| `core/loop.ts` | 고정 timestep 루프 |
| `core/audio.ts` | WebAudio 합성 (SFX 표에 항목 추가) |
| `engine/view.ts` | 화면 규격(360x640)·사각형 유틸 |
| `engine/shapes.ts` | 경로 생성기 (원·별·하트·치마…) |
| `engine/particles.ts` | 색종이·반짝이 |
| `engine/rng.ts` | 결정적 난수 |
| `engine/hangul.ts` | 조사 붙이기 (`커튼을`, `침대를`) |
| `render/paint.ts` | Shape → 캔버스 |
| `render/ui.ts` | 버튼·패널·상단 HUD·별점. 색은 전부 `UI` 에 있다 — 화면이 색을 직접 적지 않는다 |
| `doll/` | 리아 인형과 옷 (`composeDoll`) |
| `apps/store.ts` | 저장값 전부 |

## 5. 체크리스트

- [ ] `GAMES` 에 항목 추가
- [ ] 순수 계층 디렉터리를 `eslint.config.js` 의 `PURE` 에 추가
- [ ] `src/apps/` 에 GameApp, `main.ts` 의 `APPS` 에 한 줄
- [ ] 저장 키가 다른 놀이와 겹치지 않는지 (`storageKey`)
- [ ] `tests/layout.test.ts` — 새 화면의 사각형이 360x640 안에 들어가는지
- [ ] `tests/apps.test.ts` — 실제로 눌러 보는 검사 (그리기 없이 좌표만)
- [ ] `npm test && npm run lint && npm run build`
- [ ] `node tools/drive.mjs` 로 눈으로 한 번 확인
