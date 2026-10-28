/**
 * 실제 화면을 눌러 보며 사진을 찍는 개발 도구.
 *
 * 헤드리스 크롬을 CDP 로 붙잡아 진짜 폰 크기(390x844)를 흉내내고,
 * 논리 좌표(360x640)를 캔버스 위치로 바꿔 클릭한다. 사람이 폰을 들고
 * 눌러 보는 것과 같은 경로를 지난다.
 *
 *   node tools/drive.mjs <서버주소> <저장폴더>
 *
 * 서버는 미리 띄워 둔다 (npm run dev). 사진은 저장폴더에 순서대로 쌓인다.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.argv[2] ?? 'http://localhost:5199/leah_game/'
const OUT = process.argv[3] ?? '/tmp/leah-shots'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333

mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 이미 떠 있는 크롬이 있으면 그걸 쓴다 */
async function findPage() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
    const list = await res.json()
    const page = list.find(
      (t) => t.type === 'page' && !String(t.url).startsWith('chrome-extension'),
    )
    return page?.webSocketDebuggerUrl ?? null
  } catch {
    return null
  }
}

let chrome = null
if (!(await findPage())) {
  chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--user-data-dir=/tmp/leah-chrome-profile',
    'about:blank',
  ])
  chrome.stderr.on('data', () => {})
}

async function targetUrl() {
  for (let i = 0; i < 120; i++) {
    const url = await findPage()
    if (url) return url
    await sleep(300)
  }
  throw new Error('크롬이 뜨지 않았다')
}

const ws = new WebSocket(await targetUrl())
await new Promise((r) => (ws.onopen = r))

let nextId = 1
const waiting = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && waiting.has(msg.id)) {
    const { resolve, reject } = waiting.get(msg.id)
    waiting.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
}

function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => waiting.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})

const errors = []
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(msg.params.exceptionDetails.exception?.description ?? '알 수 없는 예외')
  }
})

// 지난 시나리오의 저장값이 남아 있으면 같은 좌표를 눌러도 다른 곳이 열린다.
// 늘 새 아이가 처음 켠 상태에서 시작한다.
/** main.ts 가 다 실려 입력을 듣기 시작할 때까지 기다린다 */
async function waitReady() {
  for (let i = 0; i < 100; i++) {
    if (await evaluate("document.documentElement.dataset.ready === '1'")) return
    await sleep(100)
  }
  throw new Error('앱이 뜨지 않았다')
}

await send('Page.navigate', { url: BASE })
await waitReady()
await evaluate('localStorage.clear()')
await send('Page.reload', { ignoreCache: true })
await waitReady()
await sleep(400)

/** 논리 좌표(360x640) → 화면 좌표 */
async function canvasBox() {
  return evaluate(`(() => {
    const r = document.getElementById('game').getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  })()`)
}

const box = await canvasBox()
if (!box) throw new Error('캔버스를 찾지 못했다')
const sx = box.w / 360
const sy = box.h / 640
console.log('캔버스', box, '배율', sx.toFixed(3))

async function tap(lx, ly) {
  const x = box.x + lx * sx
  const y = box.y + ly * sy
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: 'left',
      clickCount: 1,
      pointerType: 'mouse',
    })
  }
  await sleep(160)
}

let shot = 0
async function capture(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  const file = join(OUT, `${String(++shot).padStart(2, '0')}-${name}.png`)
  writeFileSync(file, Buffer.from(r.data, 'base64'))
  console.log('찍음', file)
  // 찍은 직후의 탭이 간혹 빠진다 — 한 박자 쉰다
  await sleep(200)
}

// ── 시나리오 ───────────────────────────────────────────────────
//
// 좌표는 src/ui/*Screen.ts 의 사각형 가운데다 (docs/DESIGN.md 배치 표).
//   허브 카드 i      → (275, 136 + 88 i)
//   옷장 옷 칸 i     → (262, 135 + 66 i)      분류 레일 i → (328, 113 + 46 i)
//   도구 i           → (30 + 54 i, 606)       색 견본 i  → (208, 153 + 28 i)
//   뒤로             → (37, 59)

const BACK = [37, 59]
const card = (i) => [275, 136 + 88 * i]
const cell = (i) => [262, 135 + 66 * i]
const rail = (i) => [328, 113 + 46 * i]
const tool = (i) => [30 + 54 * i, 606]
const swatch = (i) => [208, 153 + 28 * i]

await capture('허브')

// 공주 옷장
await tap(...card(0))
await sleep(400)
await capture('옷장')
await tap(...cell(0)) // 첫 드레스
await tap(...cell(1)) // 다른 드레스
await tap(...rail(1)) // 머리
await tap(...cell(0))
await tap(...rail(2)) // 왕관
await tap(...cell(1))
await sleep(300)
await capture('옷장-코디')
await tap(...rail(0)) // 드레스로 돌아와 색 견본
await tap(...swatch(3))
await sleep(300)
await capture('옷장-색견본')
await tap(...tool(0)) // 랜덤
await sleep(400)
await capture('옷장-랜덤')
await tap(...tool(2)) // 배경
await sleep(300)
await capture('배경')
await tap(98, 258) // 꽃 정원 (둘째 줄 왼쪽)
await sleep(300)
await tap(...tool(3)) // 사진
await sleep(300)
await capture('사진')
await tap(...tool(4)) // 룩북
await sleep(300)
await capture('룩북')
await tap(...BACK)
await sleep(200)
await tap(...BACK) // 허브로
await sleep(300)
await capture('허브-갱신')

// 패션쇼
await tap(...card(1))
await sleep(400)
await capture('패션쇼-목록')
await tap(54, 132) // 1번 미션
await sleep(300)
await capture('패션쇼-꾸미기')
await tap(...cell(0))
await sleep(200)
await tap(289, 606) // 완성 (초록 버튼)
await sleep(600)
await capture('패션쇼-결과')
await tap(180, 580) // 목록
await sleep(300)
await tap(...BACK)
await sleep(300)

// 왕관 공방 — 보석 칸은 cropFit(STAGE, HEAD_VIEW) 로 환산한 머리 호 위치
await tap(...card(2))
await sleep(400)
await capture('왕관-공방')
await tap(60, 328) // 루비
await tap(147, 147)
await tap(160, 139)
await tap(173, 136)
await tap(200, 139)
await sleep(300)
await capture('왕관-보석')
await tap(285, 490) // 옷장에
await sleep(600)
await capture('왕관-저장')
await tap(...BACK)
await sleep(300)

// 방 꾸미기 — 방은 y 80~472, 창고는 (66 + 76 c, 505 / 557)
await tap(...card(3))
await sleep(400)
await capture('방-처음')
await tap(66, 505) // 침대
await tap(110, 400)
await tap(218, 505) // 큰 거울
await tap(120, 200)
await tap(294, 505) // 샹들리에
await tap(200, 150)
await tap(180, 557) // 다음 줄 가구
await tap(66, 557)
await tap(250, 420)
await sleep(300)
await capture('방-꾸민')
await tap(...BACK)
await sleep(300)

// 스티커 앨범
await tap(...card(4))
await sleep(400)
await capture('앨범')
await tap(55, 131)
await sleep(300)
await capture('앨범-상세')

console.log(errors.length === 0 ? '예외 없음' : `예외 ${errors.length}건:\n${errors.join('\n')}`)
ws.close()
chrome?.kill()
process.exit(errors.length === 0 ? 0 : 1)
