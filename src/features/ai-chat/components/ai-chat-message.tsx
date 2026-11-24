import { Check, Copy, FileText, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { type FileUIPart, type UIMessage } from 'ai'
import { toast } from 'sonner'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AiChatMarkdown } from './ai-chat-markdown'

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function messageFiles(message: UIMessage) {
  return message.parts.filter((part): part is FileUIPart => part.type === 'file')
}

function MessageAction({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant='ghost' size='icon-sm' aria-label={label} {...props} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

type AiChatMessageProps = {
  message: UIMessage
  onRegenerate?: () => void
  isAnimating?: boolean
}

export function AiChatMessage({
  message,
  onRegenerate,
  isAnimating,
}: AiChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const text = messageText(message)
  const files = messageFiles(message)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  if (isUser) {
    return (
      <Message align='end'>
        <MessageContent>
          {files.length > 0 && (
            <div className='flex flex-wrap justify-end gap-2'>
              {files.map((file, index) => {
                const isImage = file.mediaType.startsWith('image/')
                return (
                  <Attachment key={`${file.url}-${index}`} size='sm'>
                    <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
                      {isImage ? (
                        <img src={file.url} alt={file.filename ?? '图片附件'} />
                      ) : (
                        <FileText className='size-4' />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{file.filename ?? '附件'}</AttachmentTitle>
                      <AttachmentDescription>{file.mediaType}</AttachmentDescription>
                    </AttachmentContent>
                  </Attachment>
                )
              })}
            </div>
          )}
          {text && (
            <Bubble align='end' variant='muted'>
              <BubbleContent className='whitespace-pre-wrap'>{text}</BubbleContent>
            </Bubble>
          )}
        </MessageContent>
      </Message>
    )
  }

  return (
    <Message>
      <MessageContent className='gap-2'>
        <AiChatMarkdown isAnimating={isAnimating}>{text}</AiChatMarkdown>

        <MessageFooter className='px-0'>
          <MessageAction
            label={copied ? '已复制' : '复制消息'}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </MessageAction>
          {onRegenerate && (
            <MessageAction label='重新生成' onClick={onRegenerate}>
              <RefreshCw size={14} />
            </MessageAction>
          )}
        </MessageFooter>
      </MessageContent>
    </Message>
  )
}
