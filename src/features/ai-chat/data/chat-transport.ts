import { type ChatTransport, type UIMessage } from 'ai'
import { createMockChatTransport } from './mock-chat-transport'

/**
 * The seam between the UI and whatever answers the chat.
 *
 * To run against a real streaming endpoint, replace the body with:
 *
 *   return new DefaultChatTransport<UIMessage>({ api: '/api/chat' })
 *
 * Nothing else in the feature needs to change.
 */
export function createChatTransport(): ChatTransport<UIMessage> {
  return createMockChatTransport()
}
