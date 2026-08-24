// vitest/config 에서 defineConfig 를 가져온다.
// vite 의 defineConfig 에는 test 키 타입이 없어 `tsc --noEmit` 이 실패한다.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/leah_game/',
  build: {
    // 이 게임은 스프라이트 시트가 없다. 캐릭터·옷·소품을 전부 벡터(Path2D)로
    // 그리므로 번들에 이미지가 들어가지 않는다. 아이콘만 public/ 에 있다.
    assetsInlineLimit: 8_192,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
})
