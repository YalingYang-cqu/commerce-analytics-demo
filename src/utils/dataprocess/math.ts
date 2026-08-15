/**
 * 高精度四则运算：基于 decimal.js，规避 JS 浮点误差（如 0.1 + 0.2 !== 0.3）。
 * 统一返回 number；非法/缺失值按 0 处理，除数为 0 时返回 0（对齐页面 `x ? a/x : 0` 的既有兜底）。
 */
import Decimal from 'decimal.js'

type Num = number | string | null | undefined

const toNum = (v: Num): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const D = (v: Num): Decimal => new Decimal(toNum(v))

/** 精确加法：add(a, b, c, ...) = a + b + c + ... */
export function add(...vals: Num[]): number {
  return vals.reduce<Decimal>((acc, v) => acc.plus(D(v)), new Decimal(0)).toNumber()
}

/** 精确减法：sub(a, b, c) = a - b - c */
export function sub(first: Num, ...rest: Num[]): number {
  return rest.reduce<Decimal>((acc, v) => acc.minus(D(v)), D(first)).toNumber()
}

/** 精确乘法：mul(a, b, c) = a * b * c */
export function mul(...vals: Num[]): number {
  if (!vals.length) return 0
  return vals.reduce<Decimal>((acc, v) => acc.times(D(v)), new Decimal(1)).toNumber()
}

/** 精确除法：divide(a, b, c) = a / b / c；任一除数为 0 时返回 0 */
export function divide(first: Num, ...rest: Num[]): number {
  let acc = D(first)
  for (const v of rest) {
    const den = D(v)
    if (den.isZero()) return 0
    acc = acc.div(den)
  }
  return acc.toNumber()
}
