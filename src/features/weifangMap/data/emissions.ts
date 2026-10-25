import type {
  CompanyEmission,
  DistrictEmission,
  LonLat,
  WeifangFeature,
} from '../types'

/**
 * 前端演示数据（mock）。
 *
 * 排放量、企业、同比均为确定性生成的演示数据，不依赖网络请求；
 * 接入真实接口时，只需将 createDistrictData 的返回值替换为接口结果。
 */

interface DistrictSeed {
  emissions: number
  yoy: number
}

const DISTRICT_SEEDS: Record<string, DistrictSeed> = {
  寿光市: { emissions: 78_600, yoy: 4.6 },
  青州市: { emissions: 64_100, yoy: -2.8 },
  昌邑市: { emissions: 58_900, yoy: 6.1 },
  诸城市: { emissions: 54_300, yoy: -1.7 },
  高密市: { emissions: 49_700, yoy: 3.2 },
  寒亭区: { emissions: 44_300, yoy: 8.4 },
  安丘市: { emissions: 39_700, yoy: -4.5 },
  昌乐县: { emissions: 35_200, yoy: 1.9 },
  潍城区: { emissions: 31_800, yoy: -3.6 },
  临朐县: { emissions: 28_400, yoy: -6.2 },
  坊子区: { emissions: 24_300, yoy: 2.4 },
  奎文区: { emissions: 18_900, yoy: -1.1 },
}

const COMPANY_CORES = [
  '恒信',
  '鲁清',
  '晨鸣',
  '海化',
  '潍柴',
  '鲁丽',
  '得利斯',
  '惠发',
  '金锣',
  '华建',
  '世纪',
  '阳光',
  '中盛',
  '汇源',
  '万豪',
  '新龙',
  '博润',
  '瑞丰',
  '金诚',
  '鲁中',
]

const COMPANY_SUFFIXES = [
  '化工有限公司',
  '钢铁有限公司',
  '热电有限公司',
  '机械制造有限公司',
  '纺织有限公司',
  '食品有限公司',
  '建材有限公司',
  '纸业有限公司',
  '轮胎有限公司',
  '药业有限公司',
  '物流有限公司',
  '新能源有限公司',
]

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pointInRing(point: [number, number], ring: LonLat[]): boolean {
  const [x, y] = point
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [xi, yi] = ring[index]
    const [xj, yj] = ring[previous]
    if (
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

function pointInFeature(point: [number, number], feature: WeifangFeature): boolean {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates

  return polygons.some((rings) => {
    if (!pointInRing(point, rings[0])) return false
    return !rings.slice(1).some((hole) => pointInRing(point, hole))
  })
}

/** 在区县内部生成确定性的企业展示点位，供地图柱状图/热力点使用 */
function createCompanyPosition(
  feature: WeifangFeature,
  random: () => number
): LonLat {
  const [lon, lat] = feature.properties.center
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const angle = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * 0.045
    const candidate: LonLat = [
      lon + Math.cos(angle) * radius,
      lat + Math.sin(angle) * radius * 0.82,
    ]
    if (pointInFeature(candidate, feature)) return candidate
  }
  return [lon, lat]
}

function createCompanies(
  feature: WeifangFeature,
  districtTotal: number,
  random: () => number
): CompanyEmission[] {
  const prefix = feature.properties.name.replace(/(市|区|县)$/, '')
  const count = 5 + Math.floor(random() * 11)
  const weights = Array.from({ length: count }, () => 0.5 + random() * 1.7)
  const weightSum = weights.reduce((total, weight) => total + weight, 0)

  const raw = weights.map((weight, index) => {
    const core = COMPANY_CORES[Math.floor(random() * COMPANY_CORES.length)]
    const suffix =
      COMPANY_SUFFIXES[Math.floor(random() * COMPANY_SUFFIXES.length)]
    return {
      id: `${feature.properties.adcode}-${index + 1}`,
      name: `${prefix}${core}${suffix}`,
      industry: suffix.replace('有限公司', ''),
      emissions: Math.max(
        100,
        Math.round(((weight / weightSum) * districtTotal) / 10) * 10
      ),
      yoy: Math.round((random() * 26 - 12) * 10) / 10,
      position: createCompanyPosition(feature, random),
    } satisfies CompanyEmission
  })

  // 保证企业列表合计与区县聚合值一致
  const generatedTotal = raw.reduce((total, company) => total + company.emissions, 0)
  const diff = districtTotal - generatedTotal
  if (raw.length > 0) {
    raw[0].emissions = Math.max(100, raw[0].emissions + diff)
  }

  return raw.sort((left, right) => right.emissions - left.emissions)
}

export function createDistrictData(
  features: WeifangFeature[]
): DistrictEmission[] {
  return features.map((feature) => {
    const random = createRandom(
      hashSeed(`${feature.properties.adcode}-${feature.properties.name}`)
    )
    const seed = DISTRICT_SEEDS[feature.properties.name]
    const emissions = seed?.emissions ?? 20_000 + Math.floor(random() * 40_000)
    const yoy = seed?.yoy ?? Math.round((random() * 16 - 8) * 10) / 10

    return {
      adcode: feature.properties.adcode,
      name: feature.properties.name,
      center: feature.properties.center,
      emissions,
      yoy,
      companies: createCompanies(feature, emissions, random),
    }
  })
}

export function getEmissionRange(districts: DistrictEmission[]) {
  const values = districts.map((district) => district.emissions)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}
