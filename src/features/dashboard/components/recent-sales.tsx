import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function RecentSales() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/avatars/01.png' alt='头像' />
          <AvatarFallback>王</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>王小雨</p>
            <p className='text-sm text-muted-foreground'>
              wangxiaoyu@email.com
            </p>
          </div>
          <div className='font-medium'>+¥1,999.00</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='flex h-9 w-9 items-center justify-center space-y-0 border'>
          <AvatarImage src='/avatars/02.png' alt='头像' />
          <AvatarFallback>李</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>李俊杰</p>
            <p className='text-sm text-muted-foreground'>
              lijunjie@email.com
            </p>
          </div>
          <div className='font-medium'>+¥39.00</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/avatars/03.png' alt='头像' />
          <AvatarFallback>张</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>张雅婷</p>
            <p className='text-sm text-muted-foreground'>
              zhangyating@email.com
            </p>
          </div>
          <div className='font-medium'>+¥299.00</div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/avatars/04.png' alt='头像' />
          <AvatarFallback>陈</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>陈思远</p>
            <p className='text-sm text-muted-foreground'>
              chensiyuan@email.com
            </p>
          </div>
          <div className='font-medium'>+¥99.00</div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/avatars/05.png' alt='头像' />
          <AvatarFallback>刘</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>刘美玲</p>
            <p className='text-sm text-muted-foreground'>
              liumeiling@email.com
            </p>
          </div>
          <div className='font-medium'>+¥39.00</div>
        </div>
      </div>
    </div>
  )
}
