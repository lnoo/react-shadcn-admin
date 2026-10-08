import { useState } from 'react'
import { useMatchRoute } from '@tanstack/react-router'
import { Bot, X } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AiChatSurface } from './ai-chat-surface'

/**
 * Global floating launcher. Sits at z-40 on purpose — every sheet, dialog and
 * popover in the app is z-50, so modals cover it without extra coordination.
 */
export function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const matchRoute = useMatchRoute()

  // The /ai-chat page already is the chat, and its composer sits exactly where
  // the launcher would float — hiding it avoids an unusable overlap.
  if (matchRoute({ to: '/ai-chat' })) return null

  return (
    <div className='fixed end-6 bottom-6 z-40'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            size='icon'
            aria-label={open ? '关闭 AI 助手' : '打开 AI 助手'}
            className='size-12 rounded-full shadow-lg'
          >
            {open ? (
              <X className='size-5' />
            ) : (
              <Bot className='size-5' />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align='end'
          side='top'
          sideOffset={12}
          collisionPadding={16}
          className={cn(
            'flex h-[32rem] max-h-[70svh] w-[22rem] max-w-[calc(100vw-2rem)]',
            'flex-col overflow-hidden p-0'
          )}
        >
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <span className='flex items-center gap-2 font-semibold'>
              <Bot className='size-4' />
              AI 助手
            </span>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='size-7'
              onClick={() => setOpen(false)}
              aria-label='关闭'
            >
              <X className='size-4' />
            </Button>
          </div>

          <AiChatSurface
            className='min-h-0 flex-1'
            placeholder='输入消息…'
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
