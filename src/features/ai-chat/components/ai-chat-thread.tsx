import { ArrowDown, MessageCircleDashed } from 'lucide-react'
import { type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { AiChatMessage } from './ai-chat-message'

type AiChatThreadProps = {
  messages: UIMessage[]
  isStreaming: boolean
  isEmpty: boolean
  onRegenerate: () => void
  onPromptClick: (text: string) => void
}

const suggestions = [
  '介绍一下这个 starter',
  '流式输出是怎么实现的？',
  '怎么接入我自己的后端？',
]

export function AiChatThread({
  messages,
  isStreaming,
  isEmpty,
  onRegenerate,
  onPromptClick,
}: AiChatThreadProps) {
  if (isEmpty) {
    return (
      <Empty className='h-full p-4'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <MessageCircleDashed className='size-6' />
          </EmptyMedia>
          <EmptyTitle>有什么可以帮你的？</EmptyTitle>
          <EmptyDescription>
            当前为本地模拟回复，不会调用真实模型。
          </EmptyDescription>
        </EmptyHeader>
        <div className='flex flex-wrap justify-center gap-2'>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type='button'
              size='sm'
              variant='outline'
              className='shrink-0'
              onClick={() => onPromptClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </Empty>
    )
  }

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className='h-full'>
        <MessageScrollerViewport>
          <MessageScrollerContent
            aria-busy={isStreaming}
            className='gap-5 px-4 py-2 sm:gap-6 sm:px-8'
          >
            {messages.map((message, index) => (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === 'user'}
                className='animate-in fade-in slide-in-from-bottom-2 duration-300'
              >
                <AiChatMessage
                  message={message}
                  isAnimating={isStreaming && index === messages.length - 1}
                  onRegenerate={
                    message.role === 'assistant' && index === messages.length - 1
                      ? onRegenerate
                      : undefined
                  }
                />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton>
          <ArrowDown className='size-4' />
          <span className='sr-only'>跳到最新消息</span>
        </MessageScrollerButton>
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
