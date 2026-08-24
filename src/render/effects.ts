/**
 * 축하 가루 그리기.
 *
 * 조각마다 회전이 달라서 Shape(경로 문자열) 대신 직접 그린다 —
 * 매 프레임 새 경로 문자열을 만들면 캐시가 터진다.
 */
import { fadeOf, type Particle } from '../engine/particles'

function starOutline(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function sparkleOutline(ctx: CanvasRenderingContext2D, r: number): void {
  const t = r * 0.24
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(t, -t, r, 0)
  ctx.quadraticCurveTo(t, t, 0, r)
  ctx.quadraticCurveTo(-t, t, -r, 0)
  ctx.quadraticCurveTo(-t, -t, 0, -r)
  ctx.closePath()
}

function heartOutline(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath()
  ctx.moveTo(0, s * 0.95)
  ctx.bezierCurveTo(-s * 1.5, -s * 0.2, -s * 0.85, -s * 1.1, 0, -s * 0.35)
  ctx.bezierCurveTo(s * 0.85, -s * 1.1, s * 1.5, -s * 0.2, 0, s * 0.95)
  ctx.closePath()
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  ps: readonly Particle[],
): void {
  for (const p of ps) {
    const a = fadeOf(p)
    ctx.save()
    ctx.globalAlpha = a
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.fillStyle = p.color

    switch (p.kind) {
      case 'confetti':
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        break
      case 'petal':
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size * 0.75, p.size * 0.42, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'star':
        starOutline(ctx, p.size)
        ctx.fill()
        break
      case 'sparkle':
        sparkleOutline(ctx, p.size)
        ctx.fill()
        break
      case 'heart':
        heartOutline(ctx, p.size * 0.8)
        ctx.fill()
        break
    }
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
