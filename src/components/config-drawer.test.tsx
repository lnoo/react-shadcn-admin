import '@/styles/index.css'
import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { getCookie, setCookie } from '@/lib/cookies'
import { FontProvider } from '@/context/font-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ConfigDrawer } from './config-drawer'

async function renderConfigDrawer({
  sidebarDefaultOpen = true,
}: {
  sidebarDefaultOpen?: boolean
} = {}) {
  return await render(
    <ThemeProvider>
      <FontProvider>
        <LayoutProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>
            <ConfigDrawer />
          </SidebarProvider>
        </LayoutProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

async function openDrawer(screen: RenderResult) {
  await userEvent.click(
    screen.getByRole('button', { name: /^打开主题设置$/i })
  )
  await expect
    .element(screen.getByText(/^主题设置$/i))
    .toBeInTheDocument()
}

describe('ConfigDrawer (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    clearCookies()

    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.removeAttribute('data-theme-preset')
    document.documentElement.style.removeProperty('--font-sans')
  })

  it('opens the drawer and renders the sections', async () => {
    const screen = await renderConfigDrawer()

    await openDrawer(screen)

    const drawer = screen.getByRole('dialog', { name: /主题设置/i })

    await expect.element(drawer).toBeInTheDocument()

    await expect.element(drawer.getByText(/^主题$/i)).toBeInTheDocument()
    await expect
      .element(drawer.getByText(/^主题预设$/i))
      .toBeInTheDocument()
    await expect.element(drawer.getByText(/^字体$/i)).toBeInTheDocument()
    await expect
      .element(drawer.getByText(/^导航栏$/i))
      .toBeInTheDocument()
    await expect.element(drawer.getByText(/^布局$/i)).toBeInTheDocument()
    await expect
      .element(drawer.getByText(/^侧边栏$/i).first())
      .toBeInTheDocument()
    await expect
      .element(drawer.getByText(/^页面布局$/i))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole('button', {
          name: /将所有设置重置为默认值/i,
        })
      )
      .toBeInTheDocument()
  })

  describe('theme preference', () => {
    it('applies light theme to <html> and cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)
      await userEvent.click(
        screen.getByRole('radio', { name: /Select 浅色/i })
      )
      await vi.waitFor(() =>
        expect(document.documentElement.classList.contains('light')).toBe(true)
      )
      expect(getCookie('vite-ui-theme')).toBe('light')
    })

    it('applies dark theme to <html> and cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)
      await userEvent.click(screen.getByRole('radio', { name: /Select 深色/i }))
      await vi.waitFor(() =>
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      )
      expect(getCookie('vite-ui-theme')).toBe('dark')
    })

    it('applies system theme: stores cookie and applies a resolved light or dark class', async () => {
      // Pre-seed light so mounted theme is not system; re-selecting System alone would not fire setTheme.
      setCookie('vite-ui-theme', 'light')

      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 跟随系统/i })
      )
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('system'))
      await vi.waitFor(() => {
        const root = document.documentElement
        const hasLight = root.classList.contains('light')
        const hasDark = root.classList.contains('dark')
        expect(hasLight !== hasDark).toBe(true)
      })
    })
  })

  describe('font preference', () => {
    it('selecting manrope updates font cookie and --font-sans', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(screen.getByRole('combobox', { name: /选择字体/i }))
      await userEvent.click(screen.getByRole('option', { name: /manrope/i }))

      await vi.waitFor(() => expect(getCookie('font')).toBe('manrope'))
      await vi.waitFor(() =>
        expect(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--font-sans'
          )
        ).toContain('Manrope')
      )
    })

    it('resets font via section control and global reset', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(screen.getByRole('combobox', { name: /选择字体/i }))
      await userEvent.click(screen.getByRole('option', { name: /manrope/i }))
      await vi.waitFor(() => expect(getCookie('font')).toBe('manrope'))

      await userEvent.click(
        screen.getByRole('button', { name: /将字体重置为默认值/i })
      )
      await vi.waitFor(() => expect(getCookie('font')).toBeUndefined())
      await vi.waitFor(() =>
        expect(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--font-sans'
          )
        ).toContain('Inter')
      )

      await userEvent.click(screen.getByRole('combobox', { name: /选择字体/i }))
      await userEvent.click(screen.getByRole('option', { name: /系统默认/i }))
      await vi.waitFor(() => expect(getCookie('font')).toBe('system'))
      await vi.waitFor(() =>
        expect(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--font-sans'
          )
        ).toContain('system-ui')
      )

      await userEvent.click(
        screen.getByRole('button', { name: /将所有设置重置为默认值/i })
      )
      await vi.waitFor(() => expect(getCookie('font')).toBeUndefined())
      await vi.waitFor(() =>
        expect(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--font-sans'
          )
        ).toContain('Inter')
      )
    })
  })

  describe('sidebar variant', () => {
    it('selecting floating updates layout_variant cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 悬浮/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )
    })

    it('selecting sidebar updates layout_variant cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /^Select 侧边栏$/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('sidebar')
      )
    })

    it('selecting inset updates layout_variant cookie after another variant', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 悬浮/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 内嵌/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('inset'))
    })
  })

  describe('navbar behavior', () => {
    it('selecting scroll updates layout_navbar_behavior cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 滚动隐藏/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_navbar_behavior')).toBe('scroll')
      )
    })

    it('selecting sticky after scroll updates layout_navbar_behavior cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 滚动隐藏/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_navbar_behavior')).toBe('scroll')
      )

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 固定/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_navbar_behavior')).toBe('sticky')
      )
    })
  })

  it('selecting full layout sets collapsible to offcanvas and closes sidebar', async () => {
    const screen = await renderConfigDrawer({ sidebarDefaultOpen: true })
    await openDrawer(screen)

    await userEvent.click(
      screen.getByRole('radio', { name: /Select 全屏布局/i })
    )
    await vi.waitFor(() =>
      expect(getCookie('layout_collapsible')).toBe('offcanvas')
    )
    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('false'))
  })

  describe('page layout', () => {
    it('selecting centered updates layout_fluid cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 居中/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('false'))
    })

    it('selecting full width after centered updates layout_fluid cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 居中/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('false'))

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 全宽/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('true'))
    })
  })

  describe('section reset buttons', () => {
    it('resets theme via section control after choosing dark', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(screen.getByRole('radio', { name: /Select 深色/i }))
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('dark'))

      await userEvent.click(
        screen.getByRole('button', {
          name: /将主题偏好重置为默认值/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('system'))
    })

    it('resets sidebar style via section control after choosing floating', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 悬浮/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )

      await userEvent.click(
        screen.getByRole('button', {
          name: /将侧边栏样式重置为默认值/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('inset'))
    })

    it('resets navbar behavior via section control after choosing scroll', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 滚动隐藏/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_navbar_behavior')).toBe('scroll')
      )

      await userEvent.click(
        screen.getByRole('button', {
          name: /将导航栏行为重置为默认值/i,
        })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_navbar_behavior')).toBe('sticky')
      )
    })

    it('resets layout via section control after choosing compact', async () => {
      const screen = await renderConfigDrawer({ sidebarDefaultOpen: true })
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 紧凑/i })
      )
      await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('false'))

      await userEvent.click(
        screen.getByRole('button', {
          name: /将布局选项重置为默认值/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('true'))
      await vi.waitFor(() =>
        expect(getCookie('layout_collapsible')).toBe('icon')
      )
    })

    it('resets page layout via section control after choosing centered', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /Select 居中/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('false'))

      await userEvent.click(
        screen.getByRole('button', {
          name: /将页面布局重置为默认值/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('true'))
    })
  })

  it('updates layout: selecting non-default closes sidebar and changes layout cookie', async () => {
    const screen = await renderConfigDrawer({ sidebarDefaultOpen: true })

    await openDrawer(screen)

    await expect
      .element(screen.getByRole('radio', { name: /Select 默认/i }))
      .toHaveAttribute('data-state', 'checked')

    await userEvent.click(
      screen.getByRole('radio', { name: /Select 紧凑/i })
    )

    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('false'))
    await vi.waitFor(() => expect(getCookie('layout_collapsible')).toBe('icon'))
  })

  it('reset restores defaults across sidebar/theme/layout/page-layout', async () => {
    const screen = await renderConfigDrawer({ sidebarDefaultOpen: true })

    await openDrawer(screen)

    await userEvent.click(screen.getByRole('radio', { name: /Select 深色/i }))
    await userEvent.click(
      screen.getByRole('radio', { name: /Select 悬浮/i })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: /Select 全屏布局/i })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: /Select 居中/i })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: /Select 滚动隐藏/i })
    )

    await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('dark'))
    await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('floating'))
    await vi.waitFor(() =>
      expect(getCookie('layout_collapsible')).toBe('offcanvas')
    )
    await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('false'))
    await vi.waitFor(() =>
      expect(getCookie('layout_navbar_behavior')).toBe('scroll')
    )

    await userEvent.click(
      screen.getByRole('button', {
        name: /将所有设置重置为默认值/i,
      })
    )

    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('true'))
    await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBeUndefined())
    await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('inset'))
    await vi.waitFor(() => expect(getCookie('layout_collapsible')).toBe('icon'))
    await vi.waitFor(() => expect(getCookie('layout_fluid')).toBe('true'))
    await vi.waitFor(() =>
      expect(getCookie('layout_navbar_behavior')).toBe('sticky')
    )
  })

  describe('theme preset', () => {
    async function readPresetState() {
      return {
        attribute: document.documentElement.getAttribute('data-theme-preset'),
        cookie: getCookie('vite-ui-theme-preset'),
        primary: getComputedStyle(document.documentElement)
          .getPropertyValue('--primary')
          .trim(),
      }
    }

    it('renders a preset section with all presets', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await expect
        .element(screen.getByRole('radio', { name: /使用 default 预设/i }))
        .toHaveAttribute('data-state', 'checked')
      await expect
        .element(screen.getByRole('radio', { name: /使用 brutalist 预设/i }))
        .toBeInTheDocument()
      await expect
        .element(screen.getByRole('radio', { name: /使用 soft-pop 预设/i }))
        .toBeInTheDocument()
      await expect
        .element(screen.getByRole('radio', { name: /使用 tangerine 预设/i }))
        .toBeInTheDocument()
    })

    it('renders color swatches parsed from each preset css', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      for (const name of ['default', 'brutalist', 'soft-pop', 'tangerine']) {
        const radio = screen
          .getByRole('radio', {
            name: new RegExp(`使用 ${name} 预设`, 'i'),
          })
          .element()
        const dots = radio.querySelectorAll('[style*="background-color"]')
        expect(dots.length).toBe(3)
        for (const dot of dots) {
          expect((dot as HTMLElement).style.backgroundColor).toBeTruthy()
        }
      }
    })

    it('applies brutalist preset variables and cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 brutalist 预设/i })
      )

      await vi.waitFor(async () => {
        const state = await readPresetState()
        expect(state.attribute).toBe('brutalist')
        expect(state.cookie).toBe('brutalist')
        expect(state.primary).not.toBe('oklch(0.205 0 0)')
      })
      expect(await readPresetState()).toEqual({
        attribute: 'brutalist',
        cookie: 'brutalist',
        primary: 'oklch(0.6489 0.237 26.9728)',
      })
    })

    it('applies soft pop preset variables and cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 soft-pop 预设/i })
      )

      await vi.waitFor(async () => {
        const state = await readPresetState()
        expect(state.cookie).toBe('soft-pop')
        expect(state.primary).toBe('oklch(0.5106 0.2301 276.9656)')
      })
    })

    it('applies tangerine preset variables and cookie', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 tangerine 预设/i })
      )

      await vi.waitFor(async () => {
        const state = await readPresetState()
        expect(state.cookie).toBe('tangerine')
        expect(state.primary).toBe('oklch(0.64 0.17 36.44)')
      })
    })

    it('keeps preset when switching theme mode', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 brutalist 预设/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('vite-ui-theme-preset')).toBe('brutalist')
      )

      await userEvent.click(screen.getByRole('radio', { name: /Select 深色/i }))
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('dark'))

      expect(getCookie('vite-ui-theme-preset')).toBe('brutalist')
      expect(
        document.documentElement.getAttribute('data-theme-preset')
      ).toBe('brutalist')
    })

    it('resets preset via section control and global reset', async () => {
      const screen = await renderConfigDrawer()
      await openDrawer(screen)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 soft-pop 预设/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('vite-ui-theme-preset')).toBe('soft-pop')
      )

      await userEvent.click(
        screen.getByRole('button', {
          name: /将主题预设重置为默认值/i,
        })
      )
      await vi.waitFor(() =>
        expect(getCookie('vite-ui-theme-preset')).toBeUndefined()
      )
      expect(
        document.documentElement.hasAttribute('data-theme-preset')
      ).toBe(false)

      await userEvent.click(
        screen.getByRole('radio', { name: /使用 tangerine 预设/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('vite-ui-theme-preset')).toBe('tangerine')
      )

      await userEvent.click(
        screen.getByRole('button', {
          name: /将所有设置重置为默认值/i,
        })
      )
      await vi.waitFor(() =>
        expect(getCookie('vite-ui-theme-preset')).toBeUndefined()
      )
      expect(
        document.documentElement.hasAttribute('data-theme-preset')
      ).toBe(false)
    })
  })
})
