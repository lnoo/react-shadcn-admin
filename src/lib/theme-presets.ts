const presetCssRaw = import.meta.glob('../styles/presets/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function presetNameFromPath(path: string) {
  return path.split('/').pop()?.replace('.css', '')
}

export const presetCssByName = Object.fromEntries(
  Object.entries(presetCssRaw).flatMap(([path, css]) => {
    const name = presetNameFromPath(path)
    return name !== undefined && name !== 'index' ? [[name, css]] : []
  })
) as Record<string, string>

// Internal preset keys (lowercase, for cookies & type safety)
const presetKeys = Object.keys(presetCssByName)

// Display names with first letter capitalized
export const presetDisplayNames: Record<string, string> = Object.fromEntries(
  presetKeys.map((key) => [key, key.charAt(0).toUpperCase() + key.slice(1)])
)

// Ordered with 'default' first, then alphabetically
export const presetNames = ['default', ...presetKeys.filter((k) => k !== 'default').sort()]

export type ThemePreset = (typeof presetNames)[number]

export const DEFAULT_THEME_PRESET: ThemePreset = 'default'

export function isThemePreset(value: unknown): value is ThemePreset {
  return presetNames.includes(value as ThemePreset)
}

export function parsePresetColors(css: string) {
  const block = css.match(/\{([^}]*)\}/)
  if (!block) return []
  return ['--primary', '--secondary', '--accent']
    .map((property) => {
      const match = block[1].match(new RegExp(`${property}:\\s*([^;]+);`))
      return match?.[1].trim()
    })
    .filter((value): value is string => Boolean(value))
}