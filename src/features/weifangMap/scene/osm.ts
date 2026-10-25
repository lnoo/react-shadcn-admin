import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { MAP_WIDTH, WEIFANG_BOUNDS } from '../config'
import { emissionColor, formatTons } from '../lib/format'
import { projectToMap } from '../lib/projection'
import type {
  CompanyEmission,
  DistrictOsmDetail,
  LonLat,
  VisualMode,
  WeifangFeature,
} from '../types'

const METERS_PER_MAP_UNIT =
  ((WEIFANG_BOUNDS.east - WEIFANG_BOUNDS.west) * 111_320) / MAP_WIDTH
const BUILDING_EXAGGERATION = 7.2
const BOUNDARY_Z = 0.52

function createAreaGeometry(areas: Array<{ polygon: LonLat[] }>, z: number) {
  const geometries: THREE.BufferGeometry[] = []
  areas.forEach((area) => {
    if (area.polygon.length < 3) return
    const shape = new THREE.Shape()
    area.polygon.forEach((coordinate, index) => {
      const point = projectToMap(coordinate)
      if (index === 0) shape.moveTo(point.x, point.y)
      else shape.lineTo(point.x, point.y)
    })
    shape.closePath()
    const geometry = new THREE.ShapeGeometry(shape)
    geometry.translate(0, 0, z)
    geometries.push(geometry)
  })
  if (geometries.length === 0) return null
  return mergeGeometries(geometries, false)
}

function createRibbonGeometry(
  lines: Array<{ coords: LonLat[] }>,
  width: number,
  z: number
) {
  const positions: number[] = []
  lines.forEach((line) => {
    const points = line.coords.map(projectToMap)
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1]
      const to = points[index]
      const dx = to.x - from.x
      const dy = to.y - from.y
      const length = Math.hypot(dx, dy)
      if (length < 0.0001) continue
      const nx = (-dy / length) * (width / 2)
      const ny = (dx / length) * (width / 2)
      positions.push(
        from.x + nx,
        from.y + ny,
        z,
        from.x - nx,
        from.y - ny,
        z,
        to.x + nx,
        to.y + ny,
        z,
        from.x - nx,
        from.y - ny,
        z,
        to.x - nx,
        to.y - ny,
        z,
        to.x + nx,
        to.y + ny,
        z
      )
    }
  })
  if (positions.length === 0) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.computeVertexNormals()
  return geometry
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建热力画布')
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.86)')
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.32)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createDetailGround(): { mesh: THREE.Mesh; texture: THREE.CanvasTexture } {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建下钻地面')
  context.fillStyle = '#000000'
  context.fillRect(0, 0, size, size)
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5
  )
  // 只做轻微压暗并带一点科技蓝，保留卫星底图作为地面，
  // 避免下钻后变成纯黑背景，与 2.5D 总览风格保持一致
  gradient.addColorStop(0, 'rgba(8,34,58,0.38)')
  gradient.addColorStop(0.55, 'rgba(6,25,44,0.26)')
  gradient.addColorStop(0.82, 'rgba(4,16,30,0.1)')
  gradient.addColorStop(1, 'rgba(4,16,30,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(19, 19),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      toneMapped: false,
    })
  )
  mesh.position.z = 0.03
  return { mesh, texture }
}

function createLocalGrid(): THREE.LineSegments {
  const positions: number[] = []
  const radius = 9
  const step = 0.6
  for (let value = -radius; value <= radius; value += step) {
    positions.push(-radius, value, 0.06, radius, value, 0.06)
    positions.push(value, -radius, 0.06, value, radius, 0.06)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  )
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    })
  )
}

function featureOuterRings(feature: WeifangFeature): LonLat[][] {
  if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates[0]]
  return feature.geometry.coordinates.map((rings) => rings[0])
}

function createBoundary(rings: LonLat[][]): THREE.Group {
  const group = new THREE.Group()
  rings.forEach((ring) => {
    if (ring.length < 3) return
    const positions = ring.map((coordinate) => {
      const point = projectToMap(coordinate)
      return new THREE.Vector3(point.x, point.y, BOUNDARY_Z)
    })
    const material = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(positions),
      material
    )
    line.renderOrder = 9
    group.add(line)
  })
  return group
}

export interface DetailLayer {
  group: THREE.Group
  buildings?: THREE.InstancedMesh
  setVisible: (visible: boolean) => void
  visible: boolean
  dispose: () => void
}

/** 生成 OSM 建筑 / 水系 / 铁路 / 道路等矢量细节 */
export function createOsmDetailLayer(
  detail: DistrictOsmDetail,
  feature: WeifangFeature,
  center: { x: number; y: number }
): DetailLayer {
  const group = new THREE.Group()
  group.visible = false

  const ground = createDetailGround()
  const localGrid = createLocalGrid()
  // 地面与网格跟随当前下钻区县，而不是固定在世界地图原点
  ground.mesh.position.set(center.x, center.y, 0.03)
  localGrid.position.set(center.x, center.y, 0)
  ground.mesh.renderOrder = 1
  localGrid.renderOrder = 2
  group.add(ground.mesh, localGrid)

  const waterGeometry = createAreaGeometry(detail.water, 0.12)
  if (waterGeometry) {
    const mesh = new THREE.Mesh(
      waterGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        toneMapped: false,
      })
    )
    mesh.renderOrder = 3
    group.add(mesh)
  }

  const parkGeometry = createAreaGeometry(
    detail.landuse.filter((area) => area.kind === 'park'),
    0.1
  )
  if (parkGeometry) {
    const parkMesh = new THREE.Mesh(
      parkGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        toneMapped: false,
      })
    )
    parkMesh.renderOrder = 3
    group.add(parkMesh)
  }

  const industrialGeometry = createAreaGeometry(
    detail.landuse.filter((area) => area.kind === 'industrial'),
    0.1
  )
  if (industrialGeometry) {
    const industrialMesh = new THREE.Mesh(
      industrialGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        toneMapped: false,
      })
    )
    industrialMesh.renderOrder = 3
    group.add(industrialMesh)
  }

  const roadsGeometry = createRibbonGeometry(detail.roads, 0.018, 0.16)
  if (roadsGeometry) {
    const roadsMesh = new THREE.Mesh(
      roadsGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        toneMapped: false,
      })
    )
    roadsMesh.renderOrder = 4
    group.add(roadsMesh)
  }

  const riverGeometry = createRibbonGeometry(detail.rivers, 0.034, 0.19)
  if (riverGeometry) {
    const riverMesh = new THREE.Mesh(
      riverGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.66,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    )
    riverMesh.renderOrder = 5
    group.add(riverMesh)
  }

  const railwayGeometry = createRibbonGeometry(detail.railways, 0.016, 0.21)
  if (railwayGeometry) {
    const railwayMesh = new THREE.Mesh(
      railwayGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    )
    railwayMesh.renderOrder = 6
    group.add(railwayMesh)
  }

  let buildings: THREE.InstancedMesh | undefined
  if (detail.buildings.length > 0) {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.3,
      emissive: 0x0e7490,
      emissiveIntensity: 0.18,
    })
    const buildingMesh = new THREE.InstancedMesh(
      boxGeometry,
      material,
      detail.buildings.length
    )
    buildings = buildingMesh
    buildingMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(detail.buildings.length * 3),
      3
    )

    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    detail.buildings.forEach((building, index) => {
      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY
      building.polygon.forEach((coordinate) => {
        const point = projectToMap(coordinate)
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      })

      const width = Math.max(maxX - minX, 0.007)
      const depth = Math.max(maxY - minY, 0.007)
      const meters = Math.max(6, building.levels * 3.1)
      const height = Math.max(
        0.035,
        (meters / METERS_PER_MAP_UNIT) * BUILDING_EXAGGERATION
      )
      matrix.compose(
        new THREE.Vector3(
          (minX + maxX) / 2,
          (minY + maxY) / 2,
          0.2 + height / 2
        ),
        new THREE.Quaternion(),
        new THREE.Vector3(width, depth, height)
      )
      buildingMesh.setMatrixAt(index, matrix)

      const normalized = Math.min(1, height / 0.42)
      color
        .set('#12324a')
        .lerp(new THREE.Color('#67e8f9'), 0.28 + normalized * 0.55)
      buildingMesh.setColorAt(index, color)
    })
    buildingMesh.instanceMatrix.needsUpdate = true
    buildingMesh.instanceColor.needsUpdate = true
    buildingMesh.renderOrder = 3
    group.add(buildingMesh)
  }

  const boundary = createBoundary(
    detail.boundary?.length ? detail.boundary : featureOuterRings(feature)
  )
  group.add(boundary)

  return {
    group,
    buildings,
    visible: false,
    setVisible: (visible: boolean) => {
      group.visible = visible
    },
    dispose: () => {
      group.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      ground.texture.dispose()
    },
  }
}

export interface CompanyLayer {
  group: THREE.Group
  companies: CompanyEmission[]
  bars: THREE.Mesh[]
  labels: CSS2DObject[]
  raycastTargets: THREE.Object3D[]
  setMode: (mode: VisualMode) => void
  setHovered: (companyId: string | null) => void
  dispose: () => void
}

/** 企业单位定位柱 / 热力点（二者互斥） */
export function createCompanyLayer(
  companies: CompanyEmission[],
  maxEmission: number
): CompanyLayer {
  const group = new THREE.Group()
  const bars: THREE.Mesh[] = []
  const labels: CSS2DObject[] = []
  const heatGroup = new THREE.Group()
  const labelGroup = new THREE.Group()
  group.add(heatGroup, labelGroup)

  const heatTexture = createGlowTexture()
  const max = Math.max(1, maxEmission)
  const topIds = new Set(
    [...companies]
      .sort((left, right) => right.emissions - left.emissions)
      .slice(0, 5)
      .map((company) => company.id)
  )

  const barMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const rings: THREE.Mesh[] = []
  const heatPlanes: THREE.Mesh[] = []

  companies.forEach((company) => {
    const point = projectToMap(company.position)
    const normalized = company.emissions / max
    const height = 0.22 + normalized * 0.95
    const { hex } = emissionColor(company.emissions, 0, max)
    const color = new THREE.Color(hex)

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.94,
    })
    barMaterials.set(company.id, material)
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.075, height),
      material
    )
    bar.position.set(point.x, point.y, 0.2 + height / 2)
    bar.userData.companyId = company.id
    bar.userData.company = company
    bar.renderOrder = 4
    bars.push(bar)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.085, 0.12, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    )
    ring.position.set(point.x, point.y, 0.205)
    rings.push(ring)

    const heat = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: heatTexture,
        color,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    )
    const heatSize = 1.1 + normalized * 3.1
    heat.scale.set(heatSize, heatSize, 1)
    heat.position.set(point.x, point.y, 0.18)
    heat.userData.companyId = company.id
    heatPlanes.push(heat)
    heatGroup.add(heat)

    const labelElement = document.createElement('div')
    labelElement.className = 'wf-company-label'
    labelElement.dataset.companyId = company.id
    if (!topIds.has(company.id)) labelElement.classList.add('is-minor')
    const name = document.createElement('strong')
    name.textContent = company.name
    const value = document.createElement('span')
    value.textContent = formatTons(company.emissions)
    labelElement.append(name, value)
    const label = new CSS2DObject(labelElement)
    label.position.set(point.x, point.y, 0.28 + height + 0.06)
    label.center.set(0.5, 1)
    labels.push(label)
    labelGroup.add(label)

    group.add(bar, ring)
  })

  heatGroup.visible = false
  let mode: VisualMode = 'bar'

  const setMode = (nextMode: VisualMode) => {
    mode = nextMode
    bars.forEach((bar) => {
      bar.visible = mode === 'bar'
    })
    rings.forEach((ring) => {
      ring.visible = mode === 'bar'
    })
    heatGroup.visible = mode === 'heat'
    labelGroup.visible = true
    labelGroup.children.forEach((child) => {
      const element = (child as CSS2DObject).element as HTMLElement
      element.style.opacity = mode === 'heat' ? '0.82' : '1'
    })
  }

  const setHovered = (companyId: string | null) => {
    barMaterials.forEach((material, id) => {
      material.emissiveIntensity = id === companyId ? 1.6 : 0.55
    })
    labelGroup.children.forEach((child) => {
      const label = child as CSS2DObject
      const element = label.element as HTMLElement
      const companyIdFromElement = element.dataset.companyId
      element.classList.toggle(
        'is-hovered',
        companyIdFromElement === companyId
      )
    })
  }

  return {
    group,
    companies,
    bars,
    labels,
    raycastTargets: bars,
    setMode,
    setHovered,
    dispose: () => {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      // CSS2DRenderer 不会自动移除已脱离场景的标签 DOM，需要手动清理
      labels.forEach((label) => label.element.remove())
      heatTexture.dispose()
    },
  }
}
