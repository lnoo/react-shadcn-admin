import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquarePlus, MessagesSquare, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAiChat } from './ai-chat-provider'
import { useConversationStore } from '../data/conversation-store'

type AiChatConversationListProps = {
  className?: string
}

export function AiChatConversationList({ className }: AiChatConversationListProps) {
  const { messages, setMessages } = useAiChat()
  const {
    conversations,
    activeId,
    newConversation,
    selectConversation,
    saveMessages,
    removeConversation,
  } = useConversationStore()

  // Persist the live conversation back into the list as it streams.
  useEffect(() => {
    if (activeId && messages.length > 0) {
      saveMessages(activeId, messages)
    }
  }, [activeId, messages, saveMessages])

  const handleNew = () => {
    newConversation()
    setMessages([])
  }

  const handleSelect = (id: string, storedMessages: typeof messages) => {
    selectConversation(id)
    setMessages(storedMessages)
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-2', className)}>
      <div className='flex items-center justify-between gap-2 py-1'>
        <h2 className='flex items-center gap-2 text-lg font-bold'>
          <MessagesSquare size={20} />
          AI 助手
        </h2>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='rounded-lg'
          onClick={handleNew}
          aria-label='新建对话'
        >
          <MessageSquarePlus size={18} className='text-muted-foreground' />
        </Button>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        {conversations.length === 0 ? (
          <p className='px-2 py-4 text-sm text-muted-foreground'>
            还没有对话记录，点击右上角新建。
          </p>
        ) : (
          <ul className='space-y-1'>
            {conversations.map((conversation) => (
              <li key={conversation.id} className='group/conversation relative'>
                <button
                  type='button'
                  onClick={() =>
                    handleSelect(conversation.id, conversation.messages)
                  }
                  className={cn(
                    'w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground',
                    activeId === conversation.id && 'bg-muted'
                  )}
                >
                  <span className='block truncate font-medium'>
                    {conversation.title}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {formatDistanceToNow(conversation.updatedAt, {
                      addSuffix: true,
                    })}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='absolute end-1 top-1 size-7 opacity-0 transition-opacity group-hover/conversation:opacity-100 focus-visible:opacity-100'
                      aria-label='对话操作'
                    >
                      <Trash2 size={14} className='text-muted-foreground' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      variant='destructive'
                      onSelect={() => {
                        removeConversation(conversation.id)
                        if (activeId === conversation.id) setMessages([])
                      }}
                    >
                      删除对话
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
