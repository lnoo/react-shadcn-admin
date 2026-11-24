import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Paperclip,
  Phone,
  ImagePlus,
  Plus,
  Search as SearchIcon,
  Send,
  Video,
  MessagesSquare,
  ArrowDown,
} from 'lucide-react'
import { cn } from 'cn'
import { getDisplayNameInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NewChat } from './components/new-chat'
import { type ChatUser, type Convo } from './data/chat-types'
// Fake Data
import { conversations, SELF_SENDER } from './data/conversations'

export function Chats() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [mobileSelectedUser, setMobileSelectedUser] = useState<ChatUser | null>(
    null
  )
  const [createConversationDialogOpened, setCreateConversationDialog] =
    useState(false)

  // Filtered data based on the search query
  const filteredChatList = conversations.filter(({ fullName }) =>
    fullName.toLowerCase().includes(search.trim().toLowerCase())
  )

  // The fixture stores messages newest-first; the scroller renders
  // chronologically (oldest at top, newest at bottom), so reverse for display.
  const messages = selectedUser ? [...selectedUser.messages].reverse() : []

  const currentMessage = messages.reduce(
    (acc: Record<string, Convo[]>, obj) => {
      const key = format(obj.timestamp, 'yyyy年M月d日')

      // Create an array for the category if it doesn't exist
      if (!acc[key]) {
        acc[key] = []
      }

      // Push the current object to the array
      acc[key].push(obj)

      return acc
    },
    {}
  )

  const users = conversations.map(({ messages: _messages, ...user }) => user)

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left Side */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>收件箱</h1>
                  <MessagesSquare size={20} />
                </div>

                <Button
                  size='icon'
                  variant='ghost'
                  onClick={() => setCreateConversationDialog(true)}
                  className='rounded-lg'
                >
                  <Edit size={24} className='stroke-muted-foreground' />
                </Button>
              </div>

              <div className='relative'>
                <SearchIcon
                  size={15}
                  className='pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 stroke-slate-500'
                />
                <Input
                  type='text'
                  placeholder='搜索聊天...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-8'
                  aria-label='搜索聊天'
                />
              </div>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {filteredChatList.map((chatUsr) => {
                const { id, profile, username, messages, fullName } = chatUsr
                const lastConvo = messages[0]
                const lastMsg =
                  lastConvo.sender === SELF_SENDER
                    ? `我：${lastConvo.message}`
                    : lastConvo.message
                return (
                  <Fragment key={id}>
                    <button
                      type='button'
                      className={cn(
                        'group hover:bg-accent hover:text-accent-foreground',
                        `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                        selectedUser?.id === id && 'sm:bg-muted'
                      )}
                      onClick={() => {
                        setSelectedUser(chatUsr)
                        setMobileSelectedUser(chatUsr)
                      }}
                    >
                      <div className='flex gap-2'>
                        <Avatar>
                          <AvatarImage src={profile} alt={username} />
                          <AvatarFallback>
                            {getDisplayNameInitials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className='col-start-2 row-span-2 font-medium'>
                            {fullName}
                          </span>
                          <span className='col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90'>
                            {lastMsg}
                          </span>
                        </div>
                      </div>
                    </button>
                    <Separator className='my-1' />
                  </Fragment>
                )
              })}
            </ScrollArea>
          </div>

          {/* Right Side */}
          {selectedUser ? (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full min-h-0 flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                mobileSelectedUser && 'inset-s-0 flex'
              )}
            >
              {/* Top Part */}
              <div className='mb-1 flex flex-none justify-between bg-card p-4 shadow-lg sm:rounded-t-md'>
                {/* Left */}
                <div className='flex gap-3'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='-ms-2 h-full sm:hidden'
                    onClick={() => setMobileSelectedUser(null)}
                  >
                    <ArrowLeft className='rtl:rotate-180' />
                  </Button>
                  <div className='flex items-center gap-2 lg:gap-4'>
                    <Avatar className='size-9 lg:size-11'>
                      <AvatarImage
                        src={selectedUser.profile}
                        alt={selectedUser.username}
                      />
                      <AvatarFallback>
                        {getDisplayNameInitials(selectedUser.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                        {selectedUser.fullName}
                      </span>
                      <span className='col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-xs text-nowrap text-ellipsis text-muted-foreground lg:max-w-none lg:text-sm'>
                        {selectedUser.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className='-me-1 flex items-center gap-1 lg:gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Video size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Phone size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6'
                  >
                    <MoreVertical className='stroke-muted-foreground sm:size-5' />
                  </Button>
                </div>
              </div>

              {/* Conversation */}
              <div className='flex min-h-0 flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4'>
                <div className='min-h-0 flex-1'>
                  <MessageScrollerProvider autoScroll>
                    <MessageScroller>
                      <MessageScrollerViewport>
                        <MessageScrollerContent className='gap-6 px-1 py-2 pe-3'>
                          {Object.keys(currentMessage).map((key) => (
                            <Fragment key={key}>
                              {currentMessage[key].map((msg, index) => (
                                <MessageScrollerItem
                                  key={`${msg.sender}-${msg.timestamp}-${index}`}
                                  scrollAnchor={msg.sender === SELF_SENDER}
                                >
                                  <Message
                                    align={
                                      msg.sender === SELF_SENDER ? 'end' : 'start'
                                    }
                                  >
                                    <MessageContent>
                                      <Bubble
                                        align={
                                          msg.sender === SELF_SENDER
                                            ? 'end'
                                            : 'start'
                                        }
                                        variant={
                                          msg.sender === SELF_SENDER
                                            ? 'default'
                                            : 'muted'
                                        }
                                      >
                                        <BubbleContent>
                                          {msg.message}
                                        </BubbleContent>
                                      </Bubble>
                                      <MessageFooter className='px-3'>
                                        <time
                                          dateTime={msg.timestamp.toISOString()}
                                        >
                                          {format(msg.timestamp, 'HH:mm')}
                                        </time>
                                      </MessageFooter>
                                    </MessageContent>
                                  </Message>
                                </MessageScrollerItem>
                              ))}
                              <div className='text-center text-xs text-muted-foreground'>
                                {key}
                              </div>
                            </Fragment>
                          ))}
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton>
                        <ArrowDown className='size-4' />
                        <span className='sr-only'>跳到最新消息</span>
                      </MessageScrollerButton>
                    </MessageScroller>
                  </MessageScrollerProvider>
                </div>

                <form className='flex w-full flex-none gap-2'>
                  <div className='flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden lg:gap-4'>
                    <div className='space-x-1'>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='h-8 rounded-md'
                      >
                        <Plus size={20} className='stroke-muted-foreground' />
                      </Button>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='hidden h-8 rounded-md lg:inline-flex'
                      >
                        <ImagePlus
                          size={20}
                          className='stroke-muted-foreground'
                        />
                      </Button>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='hidden h-8 rounded-md lg:inline-flex'
                      >
                        <Paperclip
                          size={20}
                          className='stroke-muted-foreground'
                        />
                      </Button>
                    </div>
                    <label className='flex-1'>
                      <span className='sr-only'>聊天输入框</span>
                      <input
                        type='text'
                        placeholder='输入消息...'
                        className='h-8 w-full bg-inherit focus-visible:outline-hidden'
                      />
                    </label>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='hidden sm:inline-flex'
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                  <Button className='h-full sm:hidden'>
                    <Send size={18} /> 发送
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <Empty className='h-full'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <MessagesSquare className='size-6' />
                </EmptyMedia>
                <EmptyTitle>您的消息</EmptyTitle>
                <EmptyDescription>发送消息开始聊天。</EmptyDescription>
              </EmptyHeader>
              <Button onClick={() => setCreateConversationDialog(true)}>
                发送消息
              </Button>
            </Empty>
          )}
        </section>
        <NewChat
          users={users}
          onOpenChange={setCreateConversationDialog}
          open={createConversationDialogOpened}
        />
      </Main>
    </>
  )
}