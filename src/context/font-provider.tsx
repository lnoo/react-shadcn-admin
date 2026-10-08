import { createContext, useContext, useEffect, useState } from 'react'
import {
  DEFAULT_FONT,
  getFontFamily,
  isFontId,
  type FontId,
} from '@/config/fonts'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const FONT_COOKIE_NAME = 'font'
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type FontContextType = {
  font: FontId
  setFont: (font: FontId) => void
  resetFont: () => void
}

const FontContext = createContext<FontContextType | null>(null)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, _setFont] = useState<FontId>(() => {
    const savedFont = getCookie(FONT_COOKIE_NAME)
    return isFontId(savedFont) ? savedFont : DEFAULT_FONT
  })

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-sans',
      getFontFamily(font)
    )
  }, [font])

  const setFont = (next: FontId) => {
    setCookie(FONT_COOKIE_NAME, next, FONT_COOKIE_MAX_AGE)
    _setFont(next)
  }

  const resetFont = () => {
    removeCookie(FONT_COOKIE_NAME)
    _setFont(DEFAULT_FONT)
  }

  return (
    <FontContext value={{ font, setFont, resetFont }}>{children}</FontContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFont = () => {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}
