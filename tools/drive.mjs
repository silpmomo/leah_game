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
await send('Page.navigate', { url: BASE })
await sleep(1200)
await evaluate('localStorage.clear()')
await send('Page.reload', { ignoreCache: true })
await sleep(1800)

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
}

// ── 시나리오 ───────────────────────────────────────────────────

await capture('허브')

// 공주 옷장
await tap(180, 168) // 첫 카드
await sleep(400)
await capture('옷장')
await tap(63, 459) // 첫 드레스
await tap(207, 459) // 다른 드레스
await tap(105, 375) // 머리 탭
await tap(63, 459)
await tap(177, 375) // 왕관 탭
await tap(135, 459)
await sleep(300)
await capture('옷장-코디')
await tap(178, 581) // 랜덤
await sleep(400)
await capture('옷장-랜덤')
await tap(315, 581) // 배경
await sleep(300)
await capture('배경')
await tap(100, 186) // 성 무도회장 옆 정원
await sleep(300)
await tap(246, 581) // 사진
await sleep(300)
await capture('사진')
await tap(315, 581 + 0) // 룩북 자리(마지막 도구)
await sleep(300)
await capture('룩북')
await tap(39, 23) // 뒤로
await sleep(200)
await tap(39, 23) // 허브로
await sleep(300)
await capture('허브-갱신')

// 패션쇼
await tap(180, 250)
await sleep(400)
await capture('패션쇼-목록')
await tap(54, 132) // 1번 미션
await sleep(300)
await capture('패션쇼-꾸미기')
await tap(63, 459)
await sleep(200)
await tap(300, 581) // 완성
await sleep(600)
await capture('패션쇼-결과')
await tap(180, 580) // 목록
await sleep(300)
await tap(39, 23)
await sleep(300)

// 왕관 공방
await tap(180, 330)
await sleep(400)
await capture('왕관-공방')
await tap(60, 328) // 루비
await tap(120, 150)
await tap(150, 130)
await tap(180, 125)
await tap(210, 130)
await sleep(300)
await capture('왕관-보석')
await tap(285, 490) // 옷장에
await sleep(600)
await capture('왕관-저장')
await tap(39, 23)
await sleep(300)

// 방 꾸미기
await tap(180, 410)
await sleep(400)
await capture('방-처음')
await tap(66, 471) // 침대
await tap(110, 380)
await tap(228, 471) // 큰 거울
await tap(120, 180)
await tap(304, 471) // 샹들리에
await tap(200, 120)
await tap(180, 527) // 다음 줄 가구
await tap(66, 527)
await tap(250, 400)
await sleep(300)
await capture('방-꾸민')
await tap(39, 23)
await sleep(300)

// 스티커 앨범
await tap(180, 490)
await sleep(400)
await capture('앨범')
await tap(55, 131)
await sleep(300)
await capture('앨범-상세')

console.log(errors.length === 0 ? '예외 없음' : `예외 ${errors.length}건:\n${errors.join('\n')}`)
ws.close()
chrome?.kill()
process.exit(errors.length === 0 ? 0 : 1)
