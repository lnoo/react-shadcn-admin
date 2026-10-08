import { create } from 'zustand'
import { type UIMessage } from 'ai'

type Conversation = {
  id: string
  title: string
  messages: UIMessage[]
  updatedAt: number
}

type ConversationState = {
  conversations: Conversation[]
  activeId: string | undefined
  newConversation: () => string
  selectConversation: (id: string) => void
  saveMessages: (id: string, messages: UIMessage[]) => void
  removeConversation: (id: string) => void
}

const NEW_CONVERSATION_TITLE = '新对话'

function titleFrom(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user')
  if (!firstUserMessage) return undefined

  const text = firstUserMessage.parts
    .map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim()

  if (!text) return undefined
  return text.length > 24 ? `${text.slice(0, 24)}…` : text
}

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: NEW_CONVERSATION_TITLE,
    messages: [],
    updatedAt: Date.now(),
  }
}

// Seeded so the very first message — including one sent from the floating
// widget, where the list is not mounted — has a conversation to land in.
const initialConversation = createConversation()

export const useConversationStore = create<ConversationState>()((set) => ({
  conversations: [initialConversation],
  activeId: initialConversation.id,

  newConversation: () => {
    const conversation = createConversation()
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeId: conversation.id,
    }))
    return conversation.id
  },

  selectConversation: (id) => set({ activeId: id }),

  saveMessages: (id, messages) =>
    set((state) => ({
      // Re-claim the active slot if the list was emptied, so the next message
      // still has somewhere to go.
      activeId: state.activeId ?? id,
      conversations: state.conversations.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              messages,
              title: titleFrom(messages) ?? conversation.title,
              updatedAt: Date.now(),
            }
          : conversation
      ),
    })),

  removeConversation: (id) =>
    set((state) => {
      const remaining = state.conversations.filter(
        (conversation) => conversation.id !== id
      )
      return {
        conversations: remaining,
        activeId: state.activeId === id ? remaining[0]?.id : state.activeId,
      }
    }),
}))
