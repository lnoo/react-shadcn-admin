import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, FileText, Loader2, Paperclip, Square, X } from 'lucide-react'
import { type ChatStatus } from 'ai'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type AiChatComposerProps = {
  onSubmit: (
    text: string,
    files: File[],
    options: { model: string; effort: string }
  ) => void
  onStop: () => void
  status: ChatStatus
  autoFocus?: boolean
  placeholder?: string
}

const models = [
  { id: 'default', name: '默认模型', short: '默认' },
  { id: 'fast', name: '快速模型', short: '快速' },
  { id: 'reasoning', name: '推理模型', short: '推理' },
] as const

const efforts = [
  { id: 'low', name: '低' },
  { id: 'medium', name: '中' },
  { id: 'high', name: '高' },
] as const

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AiChatComposer({
  onSubmit,
  onStop,
  status,
  autoFocus,
  placeholder = '输入消息…',
}: AiChatComposerProps) {
  const [value, setValue] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [model, setModel] = useState<string>(models[0].id)
  const [effort, setEffort] = useState<string>(efforts[1].id)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBusy = status === 'submitted' || status === 'streaming'
  const canSend = (value.trim().length > 0 || files.length > 0) && !isBusy
  const currentModel = models.find((item) => item.id === model) ?? models[0]
  const currentEffort = efforts.find((item) => item.id === effort) ?? efforts[1]

  // Grow with the draft up to the textarea cap, then scroll internally.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [value])

  const submit = () => {
    if (!canSend) return
    onSubmit(value.trim(), files, { model, effort })
    setValue('')
    setFiles([])
    textareaRef.current?.focus()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Copy before resetting the input: a FileList is emptied by value = ''.
    const selected = Array.from(event.target.files ?? [])
    if (selected.length) {
      setFiles((current) => [...current, ...selected])
    }
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
    textareaRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className='p-2 sm:p-4'>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='sr-only'
        tabIndex={-1}
        aria-label='附件文件'
        onChange={addFiles}
      />

      <InputGroup>
        {files.length > 0 && (
          <InputGroupAddon align='block-start' className='px-2 pt-2'>
            <AttachmentGroup className='w-full'>
              {files.map((file, index) => (
                <Attachment key={`${file.name}-${index}`} size='sm'>
                  <AttachmentMedia>
                    <FileText className='size-4' />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {file.type || '文件'} · {formatSize(file.size)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      type='button'
                      aria-label={`移除 ${file.name}`}
                      onClick={() => removeFile(index)}
                    >
                      <X className='size-3.5' />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          </InputGroupAddon>
        )}

        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label='消息输入框'
          className='max-h-40 min-h-14 resize-none px-3 py-2.5 text-sm'
        />

        <InputGroupAddon align='block-end' className='pt-1'>
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton
                  type='button'
                  size='icon-sm'
                  variant='outline'
                  className='rounded-full'
                  disabled={isBusy}
                  aria-label='添加附件'
                  onClick={() => fileInputRef.current?.click()}
                />
              }
            >
              <Paperclip className='size-4' />
            </TooltipTrigger>
            <TooltipContent>
              <p>添加附件</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <InputGroupButton
                  size='sm'
                  variant='outline'
                  disabled={isBusy}
                  aria-label={`模型：${currentModel.name}`}
                />
              }
            >
              <span className='hidden sm:inline'>{currentModel.name}</span>
              <span className='sm:hidden'>{currentModel.short}</span>
              <ChevronDown className='size-3.5' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-40'>
              <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>模型</DropdownMenuLabel>
                  {models.map((item) => (
                    <DropdownMenuRadioItem
                      key={item.id}
                      value={item.id}
                      closeOnClick
                    >
                      {item.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <InputGroupButton
                  size='sm'
                  variant='outline'
                  disabled={isBusy}
                  aria-label={`思考强度：${currentEffort.name}`}
                />
              }
            >
              <span className='hidden text-muted-foreground sm:inline'>思考</span>
              {currentEffort.name}
              <ChevronDown className='size-3.5' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-32'>
              <DropdownMenuRadioGroup value={effort} onValueChange={setEffort}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>思考强度</DropdownMenuLabel>
                  {efforts.map((item) => (
                    <DropdownMenuRadioItem
                      key={item.id}
                      value={item.id}
                      closeOnClick
                    >
                      {item.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isBusy ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    type='button'
                    size='icon-sm'
                    variant='secondary'
                    className='ml-auto rounded-full'
                    aria-label='停止生成'
                    onClick={onStop}
                  />
                }
              >
                {status === 'submitted' ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Square className='size-4 fill-current' />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>停止生成</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    type='submit'
                    variant='default'
                    size='icon-sm'
                    className='ml-auto rounded-full'
                    disabled={!canSend}
                    aria-label='发送消息'
                  />
                }
              >
                <ArrowUp className='size-4' />
              </TooltipTrigger>
              <TooltipContent>
                <p>发送 (Enter)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
