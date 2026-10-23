import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { fetchUsers } from './data/api'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const {
    data: users = [],
    isPending,
    isError,
    refetch,
  } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  return (
    <UsersProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>用户列表</h2>
            <p className='text-muted-foreground'>
              在这里管理您的用户及其角色。
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>

        {isPending ? (
          <UsersTableSkeleton />
        ) : isError ? (
          <div className='flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center'>
            <p className='text-sm text-muted-foreground'>
              用户数据加载失败，请稍后重试。
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void refetch()}
            >
              重试
            </Button>
          </div>
        ) : (
          <UsersTable data={users} search={search} navigate={navigate} />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}

function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-8 flex-1 lg:w-62.5' />
        <Skeleton className='h-8 w-28' />
        <Skeleton className='h-8 w-28' />
      </div>
      <div className='flex flex-col gap-2 rounded-md border p-4'>
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className='h-8 w-full' />
        ))}
      </div>
    </div>
  )
}
