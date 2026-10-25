import { EMISSION_COLOR_STOPS } from '../config'

const compactFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
})
const decimalFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function mix(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ]
}

export function normalizeEmission(
  value: number,
  min: number,
  max: number
): number {
  if (max <= min) return 0.5
  return clamp((value - min) / (max - min), 0, 1)
}

/** 碳排放量 → 绿-黄-红插值颜色 */
export function emissionColor(
  value: number,
  min: number,
  max: number
): { hex: string; rgb: [number, number, number]; t: number } {
  const t = normalizeEmission(value, min, max)
  for (let index = 1; index < EMISSION_COLOR_STOPS.length; index += 1) {
    const [prevT, prevColor] = EMISSION_COLOR_STOPS[index - 1]
    const [nextT, nextColor] = EMISSION_COLOR_STOPS[index]
    if (t <= nextT) {
      const localT = (t - prevT) / Math.max(nextT - prevT, 0.0001)
      const rgb = mix(prevColor, nextColor, localT)
      return {
        t,
        rgb,
        hex: `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`,
      }
    }
  }
  const rgb = EMISSION_COLOR_STOPS[EMISSION_COLOR_STOPS.length - 1][1]
  return {
    t,
    rgb,
    hex: `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`,
  }
}

export function formatTons(value: number): string {
  return `${compactFormatter.format(Math.round(value))} 吨`
}

export function formatWanTons(value: number): string {
  if (value >= 10_000) return `${decimalFormatter.format(value / 10_000)} 万吨`
  return `${compactFormatter.format(Math.round(value))} 吨`
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
