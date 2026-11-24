import { AlertCircle } from 'lucide-react'
import { cn } from 'cn'
import { useAiChat } from './ai-chat-provider'
import { AiChatComposer } from './ai-chat-composer'
import { AiChatThread } from './ai-chat-thread'

type AiChatSurfaceProps = {
  className?: string
  autoFocus?: boolean
  placeholder?: string
}

/**
 * The chat itself — no surrounding page chrome. Both the /ai-chat page and the
 * floating widget render this, so streaming and input behaviour are defined
 * once and read from the shared provider.
 */
export function AiChatSurface({
  className,
  autoFocus,
  placeholder,
}: AiChatSurfaceProps) {
  const { messages, sendMessage, stop, regenerate, status, error } = useAiChat()

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className='min-h-0 flex-1'>
        <AiChatThread
          messages={messages}
          isStreaming={status === 'streaming'}
          isEmpty={messages.length === 0}
          onRegenerate={() => regenerate()}
          onPromptClick={(text) => sendMessage({ text })}
        />
      </div>

      {error && (
        <div
          role='alert'
          className='flex items-center gap-2 border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
        >
          <AlertCircle className='size-4 shrink-0' />
          <span className='truncate'>{error.message}</span>
        </div>
      )}

      <div>
        <AiChatComposer
          onSubmit={(text, files, { model, effort }) => {
            const options = { body: { model, effort } }
            if (files.length > 0) {
              const transfer = new DataTransfer()
              files.forEach((file) => transfer.items.add(file))
              void sendMessage({ text, files: transfer.files }, options)
            } else {
              void sendMessage({ text }, options)
            }
          }}
          onStop={() => void stop()}
          status={status}
          autoFocus={autoFocus}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
