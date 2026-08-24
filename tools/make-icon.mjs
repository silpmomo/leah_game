/**
 * 앱 아이콘(public/icon-180.png)을 만든다.
 *
 * 그림이 전부 벡터라 아이콘도 코드로 만든다 — 리아의 얼굴이 바뀌면
 * 이 스크립트를 다시 돌리면 된다.
 *
 *   npm run dev
 *   node tools/make-icon.mjs
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const URL_ = process.argv[2] ?? 'http://localhost:5199/leah_game/tools/icon.html'
const OUT = process.argv[3] ?? 'public/icon-180.png'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9334

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function findPage() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
    const list = await res.json()
    return (
      list.find((t) => t.type === 'page' && !String(t.url).startsWith('chrome-extension'))
        ?.webSocketDebuggerUrl ?? null
    )
  } catch {
    return null
  }
}

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-sandbox',
  '--user-data-dir=/tmp/leah-icon-profile',
  'about:blank',
])
chrome.stderr.on('data', () => {})

let wsUrl = null
for (let i = 0; i < 120 && !wsUrl; i++) {
  wsUrl = await findPage()
  if (!wsUrl) await sleep(300)
}
if (!wsUrl) throw new Error('크롬이 뜨지 않았다')

const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))

let nextId = 1
const waiting = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m.result)
    waiting.delete(m.id)
  }
}
const send = (method, params = {}) => {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve) => waiting.set(id, resolve))
}

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 200,
  height: 200,
  deviceScaleFactor: 1,
  mobile: false,
})
await send('Page.navigate', { url: URL_ })
await sleep(2000)

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: 180, height: 180, scale: 1 },
})
writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
console.log('만들었다', OUT)

ws.close()
chrome.kill()
process.exit(0)
