import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Database,
  Earth,
  Flame,
  Gauge,
  Globe,
  Layers,
  LoaderCircle,
  MapPin,
  Move3d,
  Radar,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  formatPercent,
  formatWanTons,
} from '../lib/format'
import { OSM_ATTRIBUTION } from '../lib/osm'
import type {
  DistrictEmission,
  DistrictOsmDetail,
  ViewMode,
  VisualMode,
} from '../types'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function LoadingOverlay({
  visible,
  error,
}: {
  visible: boolean
  error: string | null
}) {
  if (!visible && !error) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#02060f]/95 backdrop-blur-xl'>
      <div className='relative flex w-[min(88vw,420px)] flex-col items-center gap-5 text-center'>
        <div className='relative flex size-20 items-center justify-center'>
          <span className='absolute inset-0 animate-ping rounded-full border border-cyan-400/30' />
          <span className='absolute inset-2 rounded-full border border-cyan-400/20' />
          <span className='flex size-14 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.25)]'>
            {error ? (
              <X className='size-6 text-rose-300' />
            ) : (
              <Radar className='size-7 animate-[spin_6s_linear_infinite] text-cyan-300' />
            )}
          </span>
        </div>
        <div className='space-y-1.5'>
          <p className='text-xs font-medium tracking-[0.35em] text-cyan-300/70'>
            WEIFANG · CARBON OBSERVATORY
          </p>
          <h2 className='text-xl font-semibold text-slate-100'>
            {error ? '卫星影像加载失败' : '正在连接卫星影像'}
          </h2>
          <p className='text-sm text-slate-400'>
            {error ?? '全球卫星底图 · 潍坊区县边界 · 碳排放演示数据'}
          </p>
        </div>
        {!error && (
          <div className='h-0.5 w-56 overflow-hidden rounded-full bg-white/5'>
            <div className='h-full w-1/2 animate-[wf-progress_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent' />
          </div>
        )}
        {error && (
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='rounded-full border border-rose-300/30 bg-rose-400/10 px-5 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20'
          >
            重新加载
          </button>
        )}
      </div>
    </div>
  )
}

interface VisualModeSwitchProps {
  mode: VisualMode
  onChange: (mode: VisualMode) => void
  compact?: boolean
}

export function VisualModeSwitch({
  mode,
  onChange,
  compact,
}: VisualModeSwitchProps) {
  return (
    <div
      className='wf-mode-switch pointer-events-auto'
      role='group'
      aria-label='数据展示方式'
    >
      <button
        type='button'
        aria-pressed={mode === 'bar'}
        onClick={() => onChange('bar')}
        className={cx('wf-mode-switch__item', mode === 'bar' && 'is-active')}
        title='柱状图'
      >
        <BarChart3 className='size-3.5' />
        {!compact && <span>柱状图</span>}
      </button>
      <button
        type='button'
        aria-pressed={mode === 'heat'}
        onClick={() => onChange('heat')}
        className={cx('wf-mode-switch__item', mode === 'heat' && 'is-active')}
        title='热力图'
      >
        <Flame className='size-3.5' />
        {!compact && <span>热力图</span>}
      </button>
    </div>
  )
}

interface TopBarProps {
  view: ViewMode
  selectedName?: string
  transitioning: boolean
  visualMode: VisualMode
  onVisualModeChange: (mode: VisualMode) => void
  onResetMap: () => void
  onBackToGlobe: () => void
}

export function TopBar({
  view,
  selectedName,
  transitioning,
  visualMode,
  onVisualModeChange,
  onResetMap,
  onBackToGlobe,
}: TopBarProps) {
  return (
    <header className='pointer-events-none absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-cyan-300/10 bg-[#030914]/55 px-4 backdrop-blur-md sm:px-6'>
      <div className='flex min-w-0 items-center gap-3'>
        <div className='relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.18)]'>
          <Radar className='size-5' />
          <span className='absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]' />
        </div>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <h1 className='truncate text-sm font-semibold tracking-wide text-slate-100 sm:text-base'>
              潍坊市碳排放空间监测
            </h1>
            <span className='hidden rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-cyan-200 sm:inline'>
              卫星实景
            </span>
          </div>
          <p className='mt-0.5 truncate text-[11px] text-slate-400'>
            {view === 'globe'
              ? '全球卫星视角 · Web Mercator'
              : selectedName
                ? `${selectedName} · OSM 矢量下钻`
                : '2.5D 世界地图 · 区县聚合排放'}
          </p>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {view === 'map' ? (
          <>
            <nav
              aria-label='面包屑'
              className='mr-1 hidden items-center gap-1 text-xs text-slate-500 xl:flex'
            >
              <span>全球</span>
              <ChevronRight className='size-3.5' />
              <span className='text-cyan-300'>潍坊市</span>
              {selectedName && (
                <>
                  <ChevronRight className='size-3.5' />
                  <span className='max-w-24 truncate text-slate-200'>
                    {selectedName}
                  </span>
                </>
              )}
            </nav>
            <VisualModeSwitch mode={visualMode} onChange={onVisualModeChange} />
            <button
              type='button'
              onClick={onResetMap}
              disabled={transitioning}
              className='wf-toolbar-button'
            >
              <RotateCcw className='size-3.5' />
              <span className='hidden sm:inline'>潍坊全景</span>
            </button>
            <button
              type='button'
              onClick={onBackToGlobe}
              disabled={transitioning}
              className='wf-toolbar-button'
            >
              <Earth className='size-3.5' />
              <span className='hidden lg:inline'>返回地球</span>
            </button>
          </>
        ) : (
          <>
            <span className='hidden items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] text-emerald-200 sm:flex'>
              <span className='size-1.5 animate-pulse rounded-full bg-emerald-300' />
              模拟数据 · 实时渲染
            </span>
            <span className='flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300'>
              <Globe className='size-3.5 text-cyan-300' />
              3D Earth
            </span>
          </>
        )}
      </div>
    </header>
  )
}

interface GlobeIntroProps {
  totalDistricts: number
  companyCount: number
  canEnter: boolean
  loadingMap: boolean
  onEnter: () => void
}

export function GlobeIntro({
  totalDistricts,
  companyCount,
  canEnter,
  loadingMap,
  onEnter,
}: GlobeIntroProps) {
  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-start p-4 pb-6 sm:p-6 sm:pb-8'>
      <div className='pointer-events-auto w-full max-w-[420px] rounded-2xl border border-cyan-300/15 bg-[#04101d]/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <span className='text-[10px] font-medium tracking-[0.3em] text-cyan-300/70'>
            GLOBAL SATELLITE VIEW
          </span>
          <span className='flex items-center gap-1 text-[10px] text-slate-500'>
            <span className='size-1 rounded-full bg-cyan-300' />
            LIVE RENDER
          </span>
        </div>
        <h2 className='text-2xl font-semibold tracking-tight text-white'>
          从太空俯瞰潍坊
        </h2>
        <p className='mt-2 text-sm leading-relaxed text-slate-400'>
          以真实卫星影像为底图，飞入山东省潍坊市，查看 12
          个区县的碳排放强度与重点排放单位。
        </p>

        <div className='mt-4 grid grid-cols-3 gap-2'>
          <div className='rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5'>
            <p className='text-[10px] text-slate-500'>覆盖区县</p>
            <p className='mt-1 text-lg font-semibold text-slate-100'>
              {totalDistricts}
            </p>
          </div>
          <div className='rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5'>
            <p className='text-[10px] text-slate-500'>重点单位</p>
            <p className='mt-1 text-lg font-semibold text-slate-100'>
              {companyCount}
            </p>
          </div>
          <div className='rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5'>
            <p className='text-[10px] text-slate-500'>数据年度</p>
            <p className='mt-1 text-lg font-semibold text-slate-100'>2025</p>
          </div>
        </div>

        <button
          type='button'
          onClick={onEnter}
          disabled={!canEnter}
          className='group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-200/25 bg-gradient-to-r from-cyan-500/85 to-sky-500/85 text-sm font-medium text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.22)] transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-wait disabled:opacity-55'
        >
          {loadingMap ? (
            <>
              <LoaderCircle className='size-4 animate-spin' />
              世界底图预载中
            </>
          ) : (
            <>
              进入潍坊
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </>
          )}
        </button>
        <p className='mt-2.5 text-center text-[10px] text-slate-500'>
          {loadingMap ? '加载完成后将自动飞入' : '1.5 秒后自动飞入 · 可拖拽旋转地球'}
        </p>
      </div>
    </div>
  )
}

interface MapLegendProps {
  min: number
  max: number
  total: number
  companyCount: number
  maxDistrictName: string
  visualMode: VisualMode
  selectedName?: string
}

export function MapLegend({
  min,
  max,
  total,
  companyCount,
  maxDistrictName,
  visualMode,
  selectedName,
}: MapLegendProps) {
  const isBar = visualMode === 'bar'
  return (
    <aside className='pointer-events-none absolute bottom-5 left-4 z-30 w-[262px] rounded-2xl border border-cyan-300/15 bg-[#04101d]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:left-6 sm:bottom-6 max-md:bottom-auto max-md:top-[4.75rem]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-xs font-medium text-slate-200'>
          {isBar ? (
            <BarChart3 className='size-3.5 text-cyan-300' />
          ) : (
            <Layers className='size-3.5 text-cyan-300' />
          )}
          {selectedName ? '企业排放' : '区县排放'}
          {isBar ? '柱状图' : '热力图'}
        </div>
        <span className='text-[10px] text-slate-500'>吨 / 年</span>
      </div>
      <div className='mt-3 h-2 rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#a3e635_34%,#facc15_58%,#fb923c_80%,#ef4444_100%)] shadow-[0_0_18px_rgba(163,230,53,0.12)]' />
      <div className='mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-400'>
        <span>{formatWanTons(min)}</span>
        <span>{formatWanTons(max)}</span>
      </div>
      <p className='mt-2 flex items-center gap-1.5 text-[10px] text-slate-500'>
        <span className='size-1.5 rounded-full bg-cyan-300' />
        {isBar ? '柱高 = 年排放量' : '颜色 = 排放强度'}
      </p>
      <div className='mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3'>
        <div>
          <p className='text-[10px] text-slate-500'>全市年排放</p>
          <p className='mt-0.5 text-sm font-semibold text-slate-100'>
            {formatWanTons(total)}
          </p>
        </div>
        <div>
          <p className='text-[10px] text-slate-500'>重点单位</p>
          <p className='mt-0.5 text-sm font-semibold text-slate-100'>
            {companyCount}
          </p>
        </div>
      </div>
      <p className='mt-2 flex items-center gap-1 truncate text-[10px] text-slate-500'>
        <Gauge className='size-3 text-amber-300' />
        最高：{maxDistrictName}
      </p>
      <p className='mt-2 border-t border-white/5 pt-2 text-[9px] leading-relaxed text-slate-600'>
        {OSM_ATTRIBUTION}
      </p>
    </aside>
  )
}

interface DistrictHudProps {
  district: DistrictEmission
  color: string
  cityTotal: number
  visualMode: VisualMode
  detail: DistrictOsmDetail | null
  loading: boolean
  enhancing: boolean
  onClose: () => void
  onReset: () => void
}

export function DistrictHud({
  district,
  color,
  cityTotal,
  visualMode,
  detail,
  loading,
  enhancing,
  onClose,
  onReset,
}: DistrictHudProps) {
  const share = cityTotal > 0 ? (district.emissions / cityTotal) * 100 : 0
  const decreased = district.yoy < 0
  const topCompany = district.companies[0]

  return (
    <section className='wf-district-hud'>
      <div
        className='h-1 w-full shrink-0'
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div className='flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3'>
        <div className='min-w-[128px]'>
          <p className='flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300/70'>
            <MapPin className='size-3' />
            DISTRICT DRILLDOWN
          </p>
          <div className='mt-1 flex items-center gap-2'>
            <span
              className='size-2.5 rounded-full'
              style={{ background: color, boxShadow: `0 0 14px ${color}` }}
            />
            <h2 className='text-lg font-semibold tracking-tight text-white'>
              {district.name}
            </h2>
          </div>
        </div>

        <div className='flex flex-1 flex-wrap items-end gap-x-5 gap-y-1.5'>
          <div>
            <p className='text-[10px] text-slate-500'>年排放量</p>
            <p className='text-xl font-semibold tabular-nums text-white'>
              {formatWanTons(district.emissions)}
            </p>
          </div>
          <div>
            <p className='text-[10px] text-slate-500'>重点单位</p>
            <p className='text-sm font-semibold tabular-nums text-slate-100'>
              {district.companies.length} 家
            </p>
          </div>
          <div className='hidden sm:block'>
            <p className='text-[10px] text-slate-500'>全市占比</p>
            <p className='text-sm font-semibold tabular-nums text-slate-100'>
              {share.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className='text-[10px] text-slate-500'>同比</p>
            <p
              className={cx(
                'flex items-center gap-1 text-sm font-semibold tabular-nums',
                decreased ? 'text-emerald-300' : 'text-rose-300'
              )}
            >
              {decreased ? (
                <TrendingDown className='size-3.5' />
              ) : (
                <TrendingUp className='size-3.5' />
              )}
              {formatPercent(district.yoy)}
            </p>
          </div>
          <div className='hidden max-w-[200px] lg:block'>
            <p className='text-[10px] text-slate-500'>最高排放单位</p>
            <p className='truncate text-xs text-slate-200'>
              {topCompany?.name ?? '—'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onReset}
            className='flex h-8 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/[0.06] px-3 text-xs text-cyan-100 transition hover:bg-cyan-400/12'
          >
            <RotateCcw className='size-3.5' />
            返回全景
          </button>
          <button
            type='button'
            onClick={onClose}
            aria-label='关闭区县下钻'
            className='flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white'
          >
            <X className='size-4' />
          </button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 px-4 py-2 text-[10px] text-slate-500'>
        <span className='flex items-center gap-1.5 text-slate-400'>
          {visualMode === 'bar' ? (
            <BarChart3 className='size-3 text-cyan-300' />
          ) : (
            <Flame className='size-3 text-amber-300' />
          )}
          {visualMode === 'bar'
            ? '三维柱高代表企业年排放量'
            : '热力颜色代表企业排放强度'}
        </span>
        {loading ? (
          <span className='flex items-center gap-1.5 text-cyan-300/80'>
            <LoaderCircle className='size-3 animate-spin' />
            正在加载 OpenStreetMap 建筑 / 水系 / 铁路
          </span>
        ) : detail ? (
          <span className='flex items-center gap-1.5'>
            <Database className='size-3 text-emerald-300/80' />
            OSM 建筑 {detail.buildings.length.toLocaleString('zh-CN')} · 水系{' '}
            {detail.water.length + detail.rivers.length} · 铁路{' '}
            {detail.railways.length}
            {enhancing && (
              <span className='flex items-center gap-1 text-cyan-300/70'>
                <LoaderCircle className='size-3 animate-spin' />
                加载全区细节…
              </span>
            )}
          </span>
        ) : (
          <span>OSM 细节暂不可用，已使用企业点位</span>
        )}
        <span className='ml-auto hidden text-slate-600 md:inline'>
          拖拽平移 · 右键旋转 · Esc 返回全景
        </span>
      </div>
    </section>
  )
}

export function MapHint({ detailMode }: { detailMode?: boolean }) {
  return (
    <div className='pointer-events-none absolute bottom-5 left-[54%] z-30 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/8 bg-[#030913]/70 px-4 py-2 text-[11px] text-slate-400 backdrop-blur-md md:flex'>
      <Move3d className='size-3.5 text-cyan-300' />
      {detailMode
        ? '拖拽平移 · 右键旋转 · 滚轮缩放 · 悬停柱体查看企业 · Esc 返回全景'
        : '拖拽平移 · 右键旋转 · 滚轮缩放 · 点击区县下钻 OSM 城市细节'}
    </div>
  )
}
