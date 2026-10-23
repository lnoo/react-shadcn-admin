import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { AiChatProvider } from './ai-chat-provider'
import { AiChatWidget } from './ai-chat-widget'
import { createMockChatTransport } from '../data/mock-chat-transport'

vi.mock('../data/chat-transport', () => ({
  createChatTransport: () =>
    createMockChatTransport({ initialDelayInMs: 0, chunkDelayInMs: null }),
}))

// The widget reads the route to hide itself on /ai-chat, so it needs a router.
const rootRoute = createRootRoute()
const testRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <AiChatProvider>
      <AiChatWidget />
    </AiChatProvider>
  ),
})
const aiChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-chat',
  component: () => <div>ai chat page</div>,
})
const router = createRouter({
  routeTree: rootRoute.addChildren([testRoute, aiChatRoute]),
  history: createMemoryHistory({ initialEntries: ['/'] }),
})

function renderWidget() {
  return render(<RouterProvider router={router} />)
}

describe('AiChatWidget', () => {
  it('opens and closes the popup panel', async () => {
    const { getByLabelText, getByText } = await renderWidget()

    await userEvent.click(getByLabelText('打开 AI 助手'))
    await expect.element(getByText('AI 助手')).toBeInTheDocument()
    await expect
      .element(getByLabelText('消息输入框'))
      .toBeInTheDocument()

    // The header button closes it; the trigger flips back to its open label.
    await userEvent.click(getByLabelText('关闭', { exact: true }))
    await expect
      .element(getByLabelText('打开 AI 助手'))
      .toBeInTheDocument()
  })

  it('keeps messages after the panel is closed and reopened', async () => {
    const { getByLabelText, getByText } = await renderWidget()

    await userEvent.click(getByLabelText('打开 AI 助手'))
    await userEvent.fill(getByLabelText('消息输入框'), '你好')
    await userEvent.click(getByLabelText('发送消息'))

    await expect
      .element(getByText(/我是这个 starter 里的 AI 助手示例/))
      .toBeInTheDocument()

    // Closing unmounts the panel but must not drop the conversation.
    await userEvent.click(getByLabelText('关闭', { exact: true }))
    await userEvent.click(getByLabelText('打开 AI 助手'))

    await expect
      .element(getByText(/我是这个 starter 里的 AI 助手示例/))
      .toBeInTheDocument()
  })

  it('hides itself on the /ai-chat page, where it would overlap the composer', async () => {
    const { getByText, getByLabelText } = await renderWidget()

    // Render at "/" first so the router has mounted, then navigate.
    await expect.element(getByLabelText('打开 AI 助手')).toBeInTheDocument()

    await router.navigate({ to: '/ai-chat' })

    await expect.element(getByText('ai chat page')).toBeInTheDocument()
    expect(getByLabelText('打开 AI 助手').query()).toBeNull()

    await router.navigate({ to: '/' })
  })
})
