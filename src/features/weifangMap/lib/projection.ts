import { geoMercator } from 'd3-geo'
import { MAP_WIDTH, WEIFANG_BOUNDS } from '../config'
import type { LonLat } from '../types'

/**
 * 使用 d3-geo 的 Mercator 原始投影（scale=1）计算经纬度到归一化平面的映射。
 * 底图同样是 Web Mercator 拼接图，因此几何与卫星影像在纵向严格一致。
 */
const rawProjection = geoMercator().scale(1).translate([0, 0])

const westX = rawProjection([WEIFANG_BOUNDS.west, 0])?.[0] ?? 0
const eastX = rawProjection([WEIFANG_BOUNDS.east, 0])?.[0] ?? 1
const northY = rawProjection([0, WEIFANG_BOUNDS.north])?.[1] ?? 0
const southY = rawProjection([0, WEIFANG_BOUNDS.south])?.[1] ?? 1

const unitWidth = eastX - westX
const unitHeight = southY - northY

/** 平面地图高度，保持与卫星底图一致的 Mercator 宽高比 */
export const MAP_HEIGHT = MAP_WIDTH * (unitHeight / unitWidth)

export interface UnitPoint {
  /** 0 = 西边界，1 = 东边界 */
  u: number
  /** 0 = 南边界，1 = 北边界 */
  v: number
}

export interface MapPoint {
  x: number
  y: number
}

/** 经纬度 → 0..1 归一化坐标（v 向上为北） */
export function projectUnit([lon, lat]: LonLat): UnitPoint {
  const point = rawProjection([lon, lat])
  if (!point) return { u: 0.5, v: 0.5 }
  return {
    u: (point[0] - westX) / unitWidth,
    v: 1 - (point[1] - northY) / unitHeight,
  }
}

/** 经纬度 → 以地图中心为原点的平面坐标（x 向东，y 向北） */
export function projectToMap(lonLat: LonLat): MapPoint {
  const { u, v } = projectUnit(lonLat)
  return {
    x: (u - 0.5) * MAP_WIDTH,
    y: (v - 0.5) * MAP_HEIGHT,
  }
}
