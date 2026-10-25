import type { DistrictOsmDetail } from '../types'

/**
 * 区县 OSM 细节数据按需加载。
 *
 * 数据由 Geofabrik 的山东省 OSM 提取裁剪而来，包含建筑轮廓、河流、
 * 铁路、主要道路、水面与公园/工业用地。首次进入区县时请求，之后缓存。
 */
export const OSM_ATTRIBUTION =
  '边界 / 建筑 / 水系 / 铁路 © OpenStreetMap contributors'

const detailCache = new Map<number, Promise<DistrictOsmDetail | null>>()

export function loadDistrictOsmDetail(
  adcode: number
): Promise<DistrictOsmDetail | null> {
  const cached = detailCache.get(adcode)
  if (cached) return cached

  const url = `${import.meta.env.BASE_URL}weifang-osm/${adcode}.json`
  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) return null
      const data = (await response.json()) as DistrictOsmDetail
      if (!Array.isArray(data.buildings)) return null
      return data
    })
    .catch(() => null)

  detailCache.set(adcode, request)
  return request
}
