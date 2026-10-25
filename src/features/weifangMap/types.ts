export type LonLat = [number, number]

export interface WeifangFeatureProperties {
  adcode: number
  name: string
  center: LonLat
  centroid?: LonLat
  childrenNum?: number
  level?: string
}

export interface WeifangPolygonGeometry {
  type: 'Polygon'
  coordinates: LonLat[][]
}

export interface WeifangMultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: LonLat[][][]
}

export interface WeifangFeature {
  type: 'Feature'
  properties: WeifangFeatureProperties
  geometry: WeifangPolygonGeometry | WeifangMultiPolygonGeometry
}

export interface WeifangGeoJson {
  type: 'FeatureCollection'
  features: WeifangFeature[]
}

export interface CompanyEmission {
  id: string
  name: string
  /** 年碳排放量（吨） */
  emissions: number
  /** 行业 */
  industry: string
  /** 同比变化（%） */
  yoy: number
  /** 企业展示位置（经纬度，演示点位） */
  position: LonLat
}

export interface DistrictEmission {
  adcode: number
  name: string
  center: LonLat
  /** 年碳排放量（吨） */
  emissions: number
  /** 同比变化（%） */
  yoy: number
  companies: CompanyEmission[]
}

export type ViewMode = 'globe' | 'map'

/** 区县/企业数据的两种互斥表达方式 */
export type VisualMode = 'bar' | 'heat'

export interface OsmBuilding {
  /** 建筑轮廓（经纬度） */
  polygon: LonLat[]
  /** 楼层数（未知时为推导值） */
  levels: number
}

export interface OsmLine {
  name?: string
  coords: LonLat[]
}

export interface OsmArea {
  kind: 'water' | 'park' | 'industrial'
  polygon: LonLat[]
}

export interface DistrictOsmDetail {
  adcode: number
  name: string
  /** 城市核心区（用于下钻取景） */
  focus: LonLat
  /** OSM 区县行政边界外环（经纬度） */
  boundary?: LonLat[][]
  buildings: OsmBuilding[]
  rivers: OsmLine[]
  railways: OsmLine[]
  roads: OsmLine[]
  water: OsmArea[]
  landuse: OsmArea[]
  source: string
}
