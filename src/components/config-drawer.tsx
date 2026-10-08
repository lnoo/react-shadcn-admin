import { type SVGProps } from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { CircleCheck, RotateCcw, Settings } from 'lucide-react'
import { IconLayoutCompact } from '@/assets/custom/icon-layout-compact'
import { IconLayoutDefault } from '@/assets/custom/icon-layout-default'
import { IconLayoutFull } from '@/assets/custom/icon-layout-full'
import { IconNavbarScroll } from '@/assets/custom/icon-navbar-scroll'
import { IconNavbarSticky } from '@/assets/custom/icon-navbar-sticky'
import { IconPageCentered } from '@/assets/custom/icon-page-centered'
import { IconPageFull } from '@/assets/custom/icon-page-full'
import { IconSidebarFloating } from '@/assets/custom/icon-sidebar-floating'
import { IconSidebarInset } from '@/assets/custom/icon-sidebar-inset'
import { IconSidebarSidebar } from '@/assets/custom/icon-sidebar-sidebar'
import { IconThemeDark } from '@/assets/custom/icon-theme-dark'
import { IconThemeLight } from '@/assets/custom/icon-theme-light'
import { IconThemeSystem } from '@/assets/custom/icon-theme-system'
import { cn } from 'cn'
import { DEFAULT_FONT, fonts, type FontId } from '@/config/fonts'
import { DEFAULT_THEME_PRESET, parsePresetColors, presetCssByName, presetNames, presetDisplayNames } from '@/lib/theme-presets'
import { type Collapsible, useLayout } from '@/context/layout-provider'
import { useFont } from '@/context/font-provider'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSidebar } from './ui/sidebar'

const { Root: Radio, Item } = RadioGroupPrimitive

export function ConfigDrawer() {
  const { setOpen } = useSidebar()
  const { resetTheme, resetPreset } = useTheme()
  const { resetFont } = useFont()
  const { resetLayout } = useLayout()

  const handleReset = () => {
    setOpen(true)
    resetTheme()
    resetPreset()
    resetFont()
    resetLayout()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          aria-label='打开主题设置'
          className='rounded-full'
        >
          <Settings aria-hidden='true' />
        </Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='pb-0 text-start'>
          <SheetTitle>主题设置</SheetTitle>
          <SheetDescription>
            调整外观和布局以适应您的偏好。
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-6 overflow-y-auto px-4'>
          <ThemeConfig />
          <ThemePresetConfig />
          <FontConfig />
          <NavbarConfig />
          <SidebarConfig />
          <LayoutConfig />
          <PageLayoutConfig />
        </div>
        <SheetFooter className='gap-2'>
          <Button
            variant='destructive'
            onClick={handleReset}
            aria-label='将所有设置重置为默认值'
          >
            重置
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({
  title,
  showReset = false,
  onReset,
  resetAriaLabel,
  className,
}: {
  title: string
  showReset?: boolean
  onReset?: () => void
  /** Shown on the small per-section reset (RotateCcw) for accessibility and tests. */
  resetAriaLabel?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground',
        className
      )}
    >
      {title}
      {showReset && onReset && (
        <Button
          type='button'
          size='icon'
          variant='secondary'
          className='size-4 rounded-full'
          onClick={onReset}
          aria-label={resetAriaLabel}
        >
          <RotateCcw className='size-3' />
        </Button>
      )}
    </div>
  )
}

function RadioGroupItem({
  item,
  isTheme = false,
}: {
  item: {
    value: string
    label: string
    icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement
  }
  isTheme?: boolean
}) {
  return (
    <Item
      value={item.value}
      className={cn('group outline-none', 'transition duration-200 ease-in')}
      aria-label={`Select ${item.label.toLowerCase()}`}
      aria-describedby={`${item.value}-description`}
    >
      <div
        className={cn(
          'relative rounded-[6px] ring-[1px] ring-border',
          'group-data-[state=checked]:shadow-2xl group-data-[state=checked]:ring-primary',
          'group-focus-visible:ring-2'
        )}
        role='img'
        aria-hidden='false'
        aria-label={`${item.label} option preview`}
      >
        <CircleCheck
          className={cn(
            'size-6 fill-primary stroke-white',
            'group-data-[state=unchecked]:hidden',
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2'
          )}
          aria-hidden='true'
        />
        <item.icon
          className={cn(
            !isTheme &&
            'fill-primary stroke-primary group-data-[state=unchecked]:fill-muted-foreground group-data-[state=unchecked]:stroke-muted-foreground'
          )}
          aria-hidden='true'
        />
      </div>
      <div
        className='mt-1 text-xs'
        id={`${item.value}-description`}
        aria-live='polite'
      >
        {item.label}
      </div>
    </Item>
  )
}

function ThemeConfig() {
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <div>
      <SectionTitle
        title='主题'
        showReset={theme !== defaultTheme}
        onReset={() => setTheme(defaultTheme)}
        resetAriaLabel='将主题偏好重置为默认值'
      />
      <Radio
        value={theme}
        onValueChange={setTheme}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label='选择主题偏好'
        aria-describedby='theme-description'
      >
        {[
          {
            value: 'system',
            label: '跟随系统',
            icon: IconThemeSystem,
          },
          {
            value: 'light',
            label: '浅色',
            icon: IconThemeLight,
          },
          {
            value: 'dark',
            label: '深色',
            icon: IconThemeDark,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} isTheme />
        ))}
      </Radio>
      <div id='theme-description' className='sr-only'>
        在跟随系统、浅色模式或深色模式之间选择
      </div>
    </div>
  )
}

function ThemePresetConfig() {
  const { preset, setPreset, resetPreset } = useTheme()

  return (
    <div>
      <SectionTitle
        title='主题预设'
        showReset={preset !== DEFAULT_THEME_PRESET}
        onReset={resetPreset}
        resetAriaLabel='将主题预设重置为默认值'
      />
      <Radio
        value={preset}
        onValueChange={setPreset}
        className='grid grid-cols-2 gap-2'
        aria-label='选择主题预设'
      >
        {presetNames.map((name) => (
          <Item
            key={name}
            value={name}
            aria-label={`使用 ${name} 预设`}
            className='group flex min-h-20 flex-col gap-2 rounded-md border border-border p-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:border-primary'
          >
            <span className='flex w-full items-center gap-1.5' aria-hidden='true'>
              {parsePresetColors(presetCssByName[name]).map(
                (color, i) => (
                  <span
                    key={i}
                    className='size-4 rounded-full border border-foreground/15'
                    style={{ backgroundColor: color }}
                  />
                )
              )}
              <CircleCheck className='ms-auto size-4 text-primary group-data-[state=unchecked]:invisible' />
            </span>
            <span className='text-xs font-medium'>{presetDisplayNames[name]}</span>
          </Item>
        ))}
      </Radio>
    </div>
  )
}

function FontConfig() {
  const { font, setFont, resetFont } = useFont()

  return (
    <div>
      <SectionTitle
        title='字体'
        showReset={font !== DEFAULT_FONT}
        onReset={resetFont}
        resetAriaLabel='将字体重置为默认值'
      />
      <Select value={font} onValueChange={(value) => setFont(value as FontId)}>
        <SelectTrigger className='w-full max-w-md' aria-label='选择字体'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fonts.map(({ id, label }) => (
            <SelectItem key={id} value={id}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div id='font-description' className='sr-only'>
        设置界面使用的字体
      </div>
    </div>
  )
}

function NavbarConfig() {
  const {
    defaultNavbarBehavior,
    navbarBehavior,
    setNavbarBehavior,
  } = useLayout()
  return (
    <div>
      <SectionTitle
        title='导航栏'
        showReset={navbarBehavior !== defaultNavbarBehavior}
        onReset={() => setNavbarBehavior(defaultNavbarBehavior)}
        resetAriaLabel='将导航栏行为重置为默认值'
      />
      <Radio
        value={navbarBehavior}
        onValueChange={setNavbarBehavior}
        className='grid w-full max-w-md grid-cols-2 gap-4'
        aria-label='选择导航栏行为'
        aria-describedby='navbar-description'
      >
        {[
          {
            value: 'scroll',
            label: '滚动隐藏',
            icon: IconNavbarScroll,
          },
          {
            value: 'sticky',
            label: '固定',
            icon: IconNavbarSticky,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='navbar-description' className='sr-only'>
        在滚动隐藏或固定导航栏行为之间选择
      </div>
    </div>
  )
}

function SidebarConfig() {
  const { defaultVariant, variant, setVariant } = useLayout()
  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title='侧边栏'
        showReset={defaultVariant !== variant}
        onReset={() => setVariant(defaultVariant)}
        resetAriaLabel='将侧边栏样式重置为默认值'
      />
      <Radio
        value={variant}
        onValueChange={setVariant}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label='选择侧边栏样式'
        aria-describedby='sidebar-description'
      >
        {[
          {
            value: 'inset',
            label: '内嵌',
            icon: IconSidebarInset,
          },
          {
            value: 'floating',
            label: '悬浮',
            icon: IconSidebarFloating,
          },
          {
            value: 'sidebar',
            label: '侧边栏',
            icon: IconSidebarSidebar,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='sidebar-description' className='sr-only'>
        在内嵌、悬浮或标准侧边栏布局之间选择
      </div>
    </div>
  )
}

function LayoutConfig() {
  const { open, setOpen } = useSidebar()
  const { defaultCollapsible, collapsible, setCollapsible } = useLayout()

  const radioState = open ? 'default' : collapsible

  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title='布局'
        showReset={radioState !== 'default'}
        onReset={() => {
          setOpen(true)
          setCollapsible(defaultCollapsible)
        }}
        resetAriaLabel='将布局选项重置为默认值'
      />
      <Radio
        value={radioState}
        onValueChange={(v) => {
          if (v === 'default') {
            setOpen(true)
            return
          }
          setOpen(false)
          setCollapsible(v as Collapsible)
        }}
        className='grid w-full max-w-md grid-cols-3 gap-4'
        aria-label='选择布局样式'
        aria-describedby='layout-description'
      >
        {[
          {
            value: 'default',
            label: '默认',
            icon: IconLayoutDefault,
          },
          {
            value: 'icon',
            label: '紧凑',
            icon: IconLayoutCompact,
          },
          {
            value: 'offcanvas',
            label: '全屏布局',
            icon: IconLayoutFull,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='layout-description' className='sr-only'>
        在默认展开、紧凑仅图标或全屏布局模式之间选择
      </div>
    </div>
  )
}

function PageLayoutConfig() {
  const { defaultFluid, fluid, setFluid } = useLayout()
  return (
    <div className='max-md:hidden'>
      <SectionTitle
        title='页面布局'
        showReset={fluid !== defaultFluid}
        onReset={() => setFluid(defaultFluid)}
        resetAriaLabel='将页面布局重置为默认值'
      />
      <Radio
        value={String(fluid)}
        onValueChange={(v) => setFluid(v === 'true')}
        className='grid w-full max-w-md grid-cols-2 gap-4'
        aria-label='选择页面布局宽度'
        aria-describedby='page-layout-description'
      >
        {[
          {
            value: 'false',
            label: '居中',
            icon: IconPageCentered,
          },
          {
            value: 'true',
            label: '全宽',
            icon: IconPageFull,
          },
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id='page-layout-description' className='sr-only'>
        在居中或全宽页面内容之间选择
      </div>
    </div>
  )
}


