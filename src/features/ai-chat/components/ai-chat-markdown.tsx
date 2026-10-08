import { memo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'cn'

const components: Partial<Components> = {
  p: ({ className, ...props }) => (
    <p className={cn('my-2 first:mt-0 last:mb-0', className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn('mt-4 mb-2 text-xl font-semibold first:mt-0', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn('mt-4 mb-2 text-lg font-semibold first:mt-0', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn('mt-3 mb-2 text-base font-semibold first:mt-0', className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn('my-2 list-disc space-y-1 ps-5', className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn('my-2 list-decimal space-y-1 ps-5', className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn('font-medium underline underline-offset-4', className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('my-2 border-s-2 border-border ps-4 text-muted-foreground italic', className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('my-4 border-border', className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className='my-3 overflow-x-auto'>
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'border border-border bg-muted px-3 py-2 text-start font-semibold',
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn('border border-border px-3 py-2 align-top', className)}
      {...props}
    />
  ),
  code: ({ className, ...props }) => {
    // A `language-*` class means this is a fenced block; the `pre` wrapper
    // already provides the chrome, so it should not be styled again here.
    const isFenced = className?.startsWith('language-')

    return (
      <code
        className={cn(
          'font-mono text-[0.85em]',
          !isFenced && 'rounded-sm bg-muted px-1 py-0.5',
          className
        )}
        {...props}
      />
    )
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'my-3 overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-[0.85em] leading-relaxed',
        className
      )}
      {...props}
    />
  ),
}

type AiChatMarkdownProps = {
  children: string
  className?: string
}

export const AiChatMarkdown = memo(function AiChatMarkdown({
  children,
  className,
}: AiChatMarkdownProps) {
  return (
    <div className={cn('text-sm break-words', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  )
})
