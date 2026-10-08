import {
  simulateReadableStream,
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
} from 'ai'
import { pickMockReply } from './mock-responses'

const TEXT_PART_ID = 'mock-text-0'

/**
 * Splits on whitespace boundaries but keeps it, so a streamed reply still
 * reassembles into the exact original text.
 */
function tokenize(text: string) {
  return text.match(/\s+|[^\s]+/g) ?? []
}

export type MockChatTransportOptions = {
  initialDelayInMs?: number
  chunkDelayInMs?: number | null
}

/**
 * A ChatTransport that answers from local canned data, with no network call.
 * Swap `createChatTransport` over to DefaultChatTransport to go live.
 */
export function createMockChatTransport({
  initialDelayInMs = 400,
  chunkDelayInMs = 25,
}: MockChatTransportOptions = {}): ChatTransport<UIMessage> {
  return {
    async sendMessages({ messages }) {
      return simulateReadableStream<UIMessageChunk>({
        chunks: [
          { type: 'start' },
          { type: 'start-step' },
          { type: 'text-start', id: TEXT_PART_ID },
          ...tokenize(pickMockReply(messages)).map(
            (delta): UIMessageChunk => ({
              type: 'text-delta',
              id: TEXT_PART_ID,
              delta,
            })
          ),
          { type: 'text-end', id: TEXT_PART_ID },
          { type: 'finish-step' },
          { type: 'finish', finishReason: 'stop' },
        ],
        initialDelayInMs,
        chunkDelayInMs,
      })
    },
    async reconnectToStream() {
      return null
    },
  }
}
