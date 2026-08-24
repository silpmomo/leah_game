# 리아의 공주 놀이

네 살~일곱 살이 혼자 켜서 혼자 놀 수 있는 **세로 화면 공주 옷입히기** 모음.
리온의 대모험(`leon_game`)과 같은 뼈대(Vite + TypeScript + vitest + GitHub Pages)를
쓰되, 게임 성격이 달라 도트 대신 **벡터**로 그린다.

## 놀이 다섯 가지

| id | 이름 | 무엇을 하나 |
|---|---|---|
| `closet` | 공주 옷장 | 드레스·악세사리 58종으로 자유롭게 꾸미기, 배경 6곳, 룩북 9장 |
| `runway` | 패션쇼 | 부탁(미션) 20개를 듣고 코디 맞추기, 별 1~3개 |
| `crown` | 보석 왕관 공방 | 보석 8종을 왕관에 붙여 내 왕관 만들기 → 옷장에 추가 |
| `room` | 공주 방 꾸미기 | 가구 16종을 놓고 옮기고 치우기 |
| `album` | 스티커 앨범 | 네 놀이에서 모은 스티커 24장 구경 |

## 규칙

- **실패가 없다.** 시간 제한도, 잠긴 단계도, 지는 화면도 없다.
- **한 번에 한 손가락.** 모든 조작은 "누르기" 하나다(방 꾸미기의 옮기기만 끌기).
- **되돌릴 수 있다.** 같은 옷을 다시 누르면 벗고, 방 비우기는 두 번 눌러야 한다.
- **세로 전용.** 가로로 눕히면 "폰을 세워주세요" 가 뜬다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173/leah_game/
npm test         # vitest
npm run lint
npm run build    # tsc --noEmit + vite build
```

`main` 에 push 하면 GitHub Actions 가 lint → test → build → Pages 배포까지 한다.

## 문서

- [docs/DOLL.md](docs/DOLL.md) — 인형 좌표계와 옷 추가하는 법
- [docs/GAMES.md](docs/GAMES.md) — 놀이별 규칙과 참고한 요소
- [docs/ADD-GAME.md](docs/ADD-GAME.md) — 여섯 번째 놀이를 붙이는 절차

## 개발 도구

```bash
npm run dev
node tools/drive.mjs                  # 헤드리스 크롬으로 실제 화면을 눌러 보며 사진 찍기
open http://localhost:5173/leah_game/tools/wardrobe.html   # 옷 58종 한눈에 보기
open http://localhost:5173/leah_game/tools/screens.html    # 화면 전체 한눈에 보기
```
