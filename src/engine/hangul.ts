/**
 * 조사 붙이기.
 *
 * "커튼 를 놓았어요" 처럼 나오면 안 된다. 옷·가구 이름이 데이터라서
 * 문장을 만들 때마다 받침을 따져야 한다.
 */

const BASE = 0xac00
const LAST = 0xd7a3

/** 마지막 글자에 받침이 있는가. 한글이 아니면 false */
export function hasFinal(word: string): boolean {
  const ch = word.trim().at(-1)
  if (!ch) return false
  const code = ch.charCodeAt(0)
  if (code < BASE || code > LAST) {
    // 숫자로 끝나면 읽는 소리로 판단한다 (1, 3, 6, 7, 8, 0 은 받침이 있다)
    if (/[0-9]/.test(ch)) return '1360678'.includes(ch)
    return false
  }
  return (code - BASE) % 28 !== 0
}

export type JosaPair = '을/를' | '이/가' | '은/는' | '와/과' | '으로/로'

/**
 * [받침 있을 때, 없을 때].
 *
 * 문자열을 '/' 로 잘라 쓰면 '와/과' 하나가 반대로 붙는다 —
 * 이것만 받침 없는 쪽이 앞에 오는 관습이라서 표로 적는다.
 */
const PAIRS: Record<JosaPair, readonly [string, string]> = {
  '을/를': ['을', '를'],
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '와/과': ['과', '와'],
  '으로/로': ['으로', '로'],
}

/** 낱말 뒤에 알맞은 조사를 붙인다 */
export function josa(word: string, pair: JosaPair): string {
  const [withFinal, without] = PAIRS[pair]
  if (pair === '으로/로') {
    // ㄹ 받침은 '로' 를 쓴다 ("연필로")
    const ch = word.trim().at(-1)
    const code = ch ? ch.charCodeAt(0) : 0
    const rieul = code >= BASE && code <= LAST && (code - BASE) % 28 === 8
    return word + (hasFinal(word) && !rieul ? withFinal : without)
  }
  return word + (hasFinal(word) ? withFinal : without)
}
