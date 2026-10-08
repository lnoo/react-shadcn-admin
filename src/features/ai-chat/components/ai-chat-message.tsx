import { Check, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { isTextUIPart, type UIMessage } from 'ai'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AiChatMarkdown } from './ai-chat-markdown'

function messageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('')
}

type AiChatMessageProps = {
  message: UIMessage
  onRegenerate?: () => void
}

export function AiChatMessage({ message, onRegenerate }: AiChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const text = messageText(message)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div
      data-slot='chat-message'
      className={cn(
        'group/message flex w-full flex-col gap-1',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-xs sm:max-w-[75%]',
          isUser
            ? 'rounded-ee-sm bg-primary/90 text-primary-foreground'
            : 'rounded-es-sm bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className='whitespace-pre-wrap break-words'>{text}</p>
        ) : (
          <AiChatMarkdown>{text}</AiChatMarkdown>
        )}
      </div>

      {!isUser && (
        <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100'>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            className='size-7 text-muted-foreground'
            onClick={handleCopy}
            aria-label={copied ? '已复制' : '复制消息'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          {onRegenerate && (
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='size-7 text-muted-foreground'
              onClick={onRegenerate}
              aria-label='重新生成'
            >
              <RefreshCw size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
