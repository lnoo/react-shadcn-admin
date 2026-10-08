import { useState } from 'react'
import { CornerDownLeft, Square } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type AiChatComposerProps = {
  onSubmit: (text: string) => void
  onStop: () => void
  isBusy: boolean
  autoFocus?: boolean
  placeholder?: string
}

export function AiChatComposer({
  onSubmit,
  onStop,
  isBusy,
  autoFocus,
  placeholder = '输入消息…',
}: AiChatComposerProps) {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0 && !isBusy

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    onSubmit(value.trim())
    setValue('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (canSend) {
        onSubmit(value.trim())
        setValue('')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-end gap-2 p-3'>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label='消息输入框'
        className={cn('max-h-40 min-h-10 resize-none py-2 text-sm')}
      />
      {isBusy ? (
        <Button
          type='button'
          size='icon'
          variant='secondary'
          onClick={onStop}
          aria-label='停止生成'
        >
          <Square className='size-4 fill-current' />
        </Button>
      ) : (
        <Button
          type='submit'
          size='icon'
          disabled={!canSend}
          aria-label='发送消息'
        >
          <CornerDownLeft className='size-4' />
        </Button>
      )}
    </form>
  )
}
