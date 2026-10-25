/**
 * 潍坊 2.5D 碳排放地图配置。
 *
 * 地图底图来自 Web Mercator 卫星拼接图（weifang.png），其像素范围与
 * weifang.geojson 的外接矩形一致。调整以下 bounds 即可微调底图与边界对齐。
 */
export const WEIFANG_BOUNDS = {
  west: 118.176321,
  south: 35.709455,
  east: 120.014823,
  north: 37.304466,
} as const

/** 潍坊市中心（初始飞入目标） */
export const WEIFANG_CENTER = {
  lon: 119.15,
  lat: 36.71,
} as const

/** 地球初始视角中心（亚洲 / 中国东部） */
export const GLOBE_INITIAL_VIEW = {
  lon: 105,
  lat: 24,
} as const

/** 平面地图宽度（Three.js 世界单位），高度按 Mercator 比例自动计算 */
export const MAP_WIDTH = 100

/** 地图整体构图的留白系数 */
export const MAP_FIT_PADDING = 1.12

/** 自定义事件 / 动画时长（秒） */
export const TIMING = {
  autoEnterDelay: 1.5,
  flyIn: 2,
  transition: 1,
  focus: 1.15,
} as const

/** 区县碳排放色带：绿 → 黄 → 红 */
export const EMISSION_COLOR_STOPS: Array<[number, [number, number, number]]> = [
  [0, [34, 197, 94]],
  [0.34, [163, 230, 53]],
  [0.58, [250, 204, 21]],
  [0.8, [251, 146, 60]],
  [1, [239, 68, 68]],
]
