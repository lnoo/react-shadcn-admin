import '@/styles/index.css'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ThemeProvider } from '@/context/theme-provider'
import { SearchProvider } from '@/context/search-provider'
import { Search } from './search'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

function renderSearch() {
  return render(
    <ThemeProvider>
      <SearchProvider>
        <Search />
      </SearchProvider>
    </ThemeProvider>
  )
}

describe('Search / CommandMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the command menu with rendered nav items', async () => {
    const screen = await renderSearch()

    await userEvent.click(screen.getByRole('button', { name: /搜索/ }))

    const dialog = screen.getByRole('dialog', { name: /command palette/i })
    await expect.element(dialog).toBeInTheDocument()
    await expect.element(dialog.getByText(/^仪表盘$/)).toBeInTheDocument()
  })

  it('closes the command menu on Escape', async () => {
    const screen = await renderSearch()

    await userEvent.click(screen.getByRole('button', { name: /搜索/ }))
    await expect
      .element(screen.getByRole('dialog', { name: /command palette/i }))
      .toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    await expect
      .element(screen.getByRole('dialog', { name: /command palette/i }))
      .not.toBeInTheDocument()
  })
})
