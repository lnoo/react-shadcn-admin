import { createFileRoute } from '@tanstack/react-router'
import { AiChatPage } from '@/features/ai-chat'

export const Route = createFileRoute('/_authenticated/ai-chat/')({
  component: AiChatPage,
})
