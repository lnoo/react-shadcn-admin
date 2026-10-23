/**
 * Available UI font options (theme settings drawer → 字体).
 *
 * Selecting a font sets `--font-sans` on `<html>` (Tailwind default font).
 * Keep `family` in sync with any web-font `<link>` in `src/routes/__root.tsx`.
 *
 * 📝 How to Add a New Font:
 * 1. Add an entry here with a stable `id`, display `label`, and CSS `family` stack.
 * 2. If it is a web font, add a `<link>` in `src/routes/__root.tsx` (or index.html).
 *    System fonts (e.g. 宋体, mono) need no extra link.
 */
export const fonts = [
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: 'manrope',
    label: 'Manrope',
    family: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: 'system',
    label: '系统默认',
    family:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  {
    id: 'song',
    label: '宋体',
    family: "'Songti SC', 'SimSun', 'STSong', 'Noto Serif SC', serif",
  },
  {
    id: 'hei',
    label: '黑体',
    family:
      "'PingFang SC', 'Microsoft YaHei', 'Heiti SC', 'Noto Sans SC', sans-serif",
  },
  {
    id: 'mono',
    label: '等宽 Mono',
    family:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
] as const

export type FontId = (typeof fonts)[number]['id']

export const DEFAULT_FONT: FontId = fonts[0].id

export function isFontId(value: unknown): value is FontId {
  return fonts.some((font) => font.id === value)
}

export function getFontFamily(id: FontId): string {
  return fonts.find((font) => font.id === id)?.family ?? fonts[0].family
}
