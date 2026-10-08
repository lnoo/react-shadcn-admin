import { createContext, use, useState } from 'react'
import { Chat, useChat } from '@ai-sdk/react'
import { type UIMessage } from 'ai'
import { createChatTransport } from '../data/chat-transport'

type AiChatContextValue = ReturnType<typeof useAiChatHelpers>

const AiChatContext = createContext<AiChatContextValue | null>(null)

function useAiChatHelpers(chat: Chat<UIMessage>) {
  return useChat({ chat, throttle: 50 })
}

type AiChatProviderProps = {
  children: React.ReactNode
}

/**
 * Owns the one Chat instance shared by the /ai-chat page and the floating
 * widget. Mounted in the authenticated layout so a conversation survives
 * navigation between them.
 */
export function AiChatProvider({ children }: AiChatProviderProps) {
  const [chat] = useState(
    () => new Chat<UIMessage>({ id: 'ai-chat', transport: createChatTransport() })
  )
  const value = useAiChatHelpers(chat)

  return <AiChatContext value={value}>{children}</AiChatContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAiChat() {
  const context = use(AiChatContext)
  if (!context) {
    throw new Error('useAiChat must be used within an AiChatProvider')
  }
  return context
}
