import type { DistrictOsmDetail } from '../types'

/**
 * 区县 OSM 细节数据按需加载，分两级：
 *
 * 1. `core/<adcode>.json`：城市核心区的小体积数据，进入下钻后立即显示；
 * 2. `<adcode>.json`：覆盖整个区县的完整数据，在后台继续加载并平滑替换。
 *
 * 数据由 Geofabrik 的山东省 OSM 提取按区县边界裁剪而来，包含建筑轮廓、
 * 河流、铁路、主要道路、水面与公园/工业用地。首次进入区县时请求，之后缓存。
 * 完整数据加载失败时自动回退到核心区数据，不影响下钻流程。
 */
export const OSM_ATTRIBUTION =
  '边界 / 建筑 / 水系 / 铁路 © OpenStreetMap contributors'

/** 核心区数据体积小，给一个较短的超时 */
const CORE_TIMEOUT = 12_000
/** 全区数据体积较大，超时后保留核心区结果 */
const FULL_TIMEOUT = 30_000

const coreCache = new Map<number, Promise<DistrictOsmDetail | null>>()
const fullCache = new Map<number, Promise<DistrictOsmDetail | null>>()

function isDistrictOsmDetail(value: unknown): value is DistrictOsmDetail {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<DistrictOsmDetail>
  return (
    typeof data.adcode === 'number' &&
    Array.isArray(data.buildings) &&
    Array.isArray(data.roads) &&
    Array.isArray(data.rivers) &&
    Array.isArray(data.railways) &&
    Array.isArray(data.water) &&
    Array.isArray(data.landuse)
  )
}

function fetchDetail(
  url: string,
  timeout: number
): Promise<DistrictOsmDetail | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  return fetch(url, { signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) return null
      const data: unknown = await response.json()
      return isDistrictOsmDetail(data) ? data : null
    })
    .catch(() => null)
    .finally(() => window.clearTimeout(timer))
}

function detailUrl(folder: string, adcode: number) {
  const prefix = folder ? `${folder}/` : ''
  return `${import.meta.env.BASE_URL}weifang-osm/${prefix}${adcode}.json`
}

/** 核心区细节：体积小，用于下钻后的首屏 */
export function loadDistrictOsmCore(
  adcode: number
): Promise<DistrictOsmDetail | null> {
  const cached = coreCache.get(adcode)
  if (cached) return cached

  const request = fetchDetail(detailUrl('core', adcode), CORE_TIMEOUT)
  coreCache.set(adcode, request)
  return request
}

/** 全区细节：失败时回退到核心区数据 */
export function loadDistrictOsmDetail(
  adcode: number
): Promise<DistrictOsmDetail | null> {
  const cached = fullCache.get(adcode)
  if (cached) return cached

  const request = fetchDetail(detailUrl('', adcode), FULL_TIMEOUT).then(
    async (full) => full ?? (await loadDistrictOsmCore(adcode))
  )
  fullCache.set(adcode, request)
  return request
}

/** 悬停区县时预取核心区数据，点击后可以更快进入下钻 */
export function preloadDistrictOsmCore(adcode: number): void {
  void loadDistrictOsmCore(adcode)
}
