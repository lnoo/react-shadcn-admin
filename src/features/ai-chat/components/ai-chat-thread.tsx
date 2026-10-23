import { useEffect, useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { isTextUIPart, type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessage = messages[messages.length - 1]
  const lastTextLength = lastMessage?.parts
    .filter(isTextUIPart)
    .reduce((total, part) => total + part.text.length, 0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastTextLength])

  if (isEmpty) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 p-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-full border border-border'>
          <Sparkles className='size-6 text-muted-foreground' />
        </div>
        <div className='space-y-1'>
          <p className='font-medium'>有什么可以帮你的？</p>
          <p className='text-sm text-muted-foreground'>
            当前为本地模拟回复，不会调用真实模型。
          </p>
        </div>
        <div className='flex flex-wrap justify-center gap-2'>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type='button'
              size='sm'
              variant='outline'
              onClick={() => onPromptClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className='h-full'>
      <div className='flex flex-col gap-4 p-4'>
        {messages.map((message, index) => (
          <AiChatMessage
            key={message.id}
            message={message}
            onRegenerate={
              message.role === 'assistant' && index === messages.length - 1
                ? onRegenerate
                : undefined
            }
          />
        ))}

        {isStreaming && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Loader2 className='size-4 animate-spin' />
            <span>正在思考…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
