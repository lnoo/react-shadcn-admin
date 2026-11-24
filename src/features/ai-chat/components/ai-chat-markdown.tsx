import { memo } from 'react'
import {
  Streamdown,
  useIsCodeFenceIncomplete,
  type ExtraProps,
} from 'streamdown'
import { cn } from 'cn'
import { useHighlightedCode } from '@/hooks/use-highlighted-code'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '@/components/ui/code-block'

function MarkdownCodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  // True until the closing fence has streamed in.
  const incomplete = useIsCodeFenceIncomplete()
  const lines = useHighlightedCode(code, language)

  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>{language || 'text'}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} disabled={incomplete} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

function MarkdownCode({
  node: _node,
  className,
  children,
  ...props
}: React.ComponentProps<'code'> & ExtraProps) {
  // Streamdown only sets `data-block` on fenced code; inline code stays inline.
  if (!('data-block' in props)) {
    return (
      <code
        className={cn(
          'rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]',
          className
        )}
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <MarkdownCodeBlock
      code={typeof children === 'string' ? children : ''}
      language={/language-(\S+)/.exec(className ?? '')?.[1] ?? ''}
    />
  )
}

const components = { code: MarkdownCode }

type AiChatMarkdownProps = {
  children: string
  className?: string
  isAnimating?: boolean
}

export const AiChatMarkdown = memo(function AiChatMarkdown({
  children,
  className,
  isAnimating,
}: AiChatMarkdownProps) {
  return (
    <div className={cn('text-sm break-words', className)}>
      <Streamdown
        controls={false}
        components={components}
        isAnimating={isAnimating}
        animated={
          isAnimating
            ? { animation: 'blurIn', duration: 200, easing: 'ease-out' }
            : undefined
        }
      >
        {children}
      </Streamdown>
    </div>
  )
})
