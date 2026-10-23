import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { AiChatProvider } from './ai-chat-provider'
import { AiChatSurface } from './ai-chat-surface'
import { createMockChatTransport } from '../data/mock-chat-transport'
import type { MockChatTransportOptions } from '../data/mock-chat-transport'
import { mockResponses } from '../data/mock-responses'

// Zero-delay so the stream resolves within a test. The per-test override lets a
// single test widen the streaming window enough to observe the stop control.
let transportOptions: MockChatTransportOptions = {
  initialDelayInMs: 0,
  chunkDelayInMs: null,
}

vi.mock('../data/chat-transport', () => ({
  createChatTransport: () => createMockChatTransport(transportOptions),
}))

function renderSurface() {
  return render(
    <AiChatProvider>
      <AiChatSurface />
    </AiChatProvider>
  )
}

describe('AiChatSurface', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('shows the empty state with suggestions', async () => {
    const { getByText } = await renderSurface()

    await expect.element(getByText('有什么可以帮你的？')).toBeInTheDocument()
  })

  it('sends a message and streams back a reply', async () => {
    const { getByLabelText, getByText } = await renderSurface()

    const input = getByLabelText('消息输入框')
    await userEvent.fill(input, '你好')
    await userEvent.click(getByLabelText('发送消息'))

    // The user bubble and the streamed reply are both present.
    await expect
      .element(getByText('你好', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(getByText(/我是这个 starter 里的 AI 助手示例/))
      .toBeInTheDocument()
  })

  it('renders markdown from the reply', async () => {
    const { getByLabelText, getByRole } = await renderSurface()

    await userEvent.fill(getByLabelText('消息输入框'), '你好')
    await userEvent.click(getByLabelText('发送消息'))

    // The canned reply contains a GFM table and a fenced code block.
    await expect
      .element(getByRole('table', { includeHidden: true }))
      .toBeInTheDocument()
  })

  it('offers a stop control while streaming and a send control when idle', async () => {
    // Space the chunks out so the streaming window is actually observable.
    transportOptions = { initialDelayInMs: 0, chunkDelayInMs: 40 }

    try {
      const { getByLabelText } = await renderSurface()

      await userEvent.fill(getByLabelText('消息输入框'), '你好')

      // Idle: send is available, stop is not.
      await expect.element(getByLabelText('发送消息')).toBeInTheDocument()
      expect(getByLabelText('停止生成').query()).toBeNull()

      await userEvent.click(getByLabelText('发送消息'))

      // Streaming: stop replaces send until the reply finishes.
      await expect.element(getByLabelText('停止生成')).toBeInTheDocument()
    } finally {
      transportOptions = { initialDelayInMs: 0, chunkDelayInMs: null }
    }
  })

  it('copies a message to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const { getByLabelText, getByText } = await renderSurface()

    await userEvent.fill(getByLabelText('消息输入框'), '你好')
    await userEvent.click(getByLabelText('发送消息'))
    await expect
      .element(getByText(/我是这个 starter 里的 AI 助手示例/))
      .toBeInTheDocument()

    await userEvent.click(getByLabelText('复制消息'))

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('AI 助手示例')
    )
  })

  it('regenerates without adding a second assistant message', async () => {
    const { getByLabelText, getByText } = await renderSurface()

    await userEvent.fill(getByLabelText('消息输入框'), '你好')
    await userEvent.click(getByLabelText('发送消息'))
    await expect
      .element(getByText(/我是这个 starter 里的 AI 助手示例/))
      .toBeInTheDocument()

    await userEvent.click(getByLabelText('重新生成'))

    // Reply regenerated, still exactly the first canned response.
    await expect
      .element(getByText(new RegExp(escapeRegExp(mockResponses[0].slice(0, 12)))))
      .toBeInTheDocument()
  })
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
