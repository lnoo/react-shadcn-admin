import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { fetchTasks } from './data/api'

export function Tasks() {
  const {
    data: tasks = [],
    isPending,
    isError,
    refetch,
  } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })

  return (
    <TasksProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>任务</h2>
            <p className='text-muted-foreground'>
              这是您本月任务的列表！
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>

        {isPending ? (
          <TasksTableSkeleton />
        ) : isError ? (
          <div className='flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center'>
            <p className='text-sm text-muted-foreground'>
              任务数据加载失败，请稍后重试。
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
          <TasksTable data={tasks} />
        )}
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}

function TasksTableSkeleton() {
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
