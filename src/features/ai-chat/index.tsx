import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AiChatConversationList } from './components/ai-chat-conversation-list'
import { AiChatSurface } from './components/ai-chat-surface'

export function AiChatPage() {
  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <div className='flex h-full gap-6'>
          <AiChatConversationList className='hidden w-full flex-col sm:flex sm:w-64 lg:w-72 2xl:w-80' />

          <section className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border bg-background shadow-xs'>
            <AiChatSurface placeholder='给 AI 助手发送消息…' />
          </section>
        </div>
      </Main>
    </>
  )
}
