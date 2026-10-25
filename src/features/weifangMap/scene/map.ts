import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import gsap from 'gsap'
import { MAP_FIT_PADDING, MAP_WIDTH, TIMING } from '../config'
import {
  emissionColor,
  formatPercent,
  formatTons,
  formatWanTons,
} from '../lib/format'
import { MAP_HEIGHT, projectToMap, projectUnit } from '../lib/projection'
import type {
  CompanyEmission,
  DistrictEmission,
  DistrictOsmDetail,
  LonLat,
  VisualMode,
  WeifangFeature,
} from '../types'
import {
  createCompanyLayer,
  createOsmDetailLayer,
  type CompanyLayer,
  type DetailLayer,
} from './osm'
import { createWorldMap } from './world'

export interface MapSceneOptions {
  features: WeifangFeature[]
  districts: DistrictEmission[]
  onSelect: (adcode: number) => void
}

export interface MapSceneController {
  host: HTMLElement
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  hasBaseTexture: () => boolean
  hasWorldTexture: () => boolean
  setBaseTexture: (texture: THREE.Texture) => void
  setWorldTexture: (texture: THREE.Texture) => void
  setWorldRegionTextures: (textures: {
    mid?: THREE.Texture
    near?: THREE.Texture
  }) => void
  setActive: (active: boolean) => void
  playIntro: () => void
  resetView: (animate?: boolean) => void
  clearSelection: (animate?: boolean) => void
  setVisualMode: (mode: VisualMode) => void
  setDistrictDetail: (detail: DistrictOsmDetail | null) => void
  resize: () => void
  dispose: () => void
}

const DISTRICT_LIFT = 2.2
const DEG2RAD = Math.PI / 180
const OVERVIEW_MIN_DISTANCE = 26
const OVERVIEW_MAX_DISTANCE = 2200
const DETAIL_MIN_DISTANCE = 2.4
const DETAIL_MAX_DISTANCE = 58
const DETAIL_CAMERA_DISTANCE = 9
/** 拖拽超过该像素距离视为平移，而不是点击 */
const DRAG_CLICK_THRESHOLD = 4
const WHITE_COLOR = new THREE.Color(0xffffff)
/** 底图叠加的暗色科技蓝（与 tintMaterial 保持一致） */
const BASE_TINT_COLOR = new THREE.Color(0x04101f)
const BASE_TINT_OPACITY = 0.12
/** 下钻时略加强压暗，突出 OSM 矢量；回到总览时恢复 BASE_TINT_OPACITY */
const DETAIL_TINT_OPACITY = 0.16
/** 地图外圈冷光，总览与下钻使用不同强度，避免状态切换后亮度跳变 */
const OVERVIEW_GLOW_OPACITY = 0.55
const DETAIL_GLOW_OPACITY = 0.35
/**
 * 抬升顶面位于 tintMesh 之上，不会自动吃到那层暗色叠加。
 * 这里预先折算同样的压暗值，避免区县顶面比周围底图更亮、出现拼贴感。
 */
const TOP_BASE_COLOR = WHITE_COLOR.clone().lerp(
  BASE_TINT_COLOR,
  BASE_TINT_OPACITY
)
/** 侧面统一向冷色岩层靠拢：比纯黑有层次，又不会被误读成蓝色描边 */
const SIDE_CLIFF_COLOR = new THREE.Color(0x1b333f)

/**
 * 自定义挤出 UV：把挤出几何从“世界坐标 UV”改为地图坐标归一化。
 * 顶面因此可以直接贴卫星图，并与底图逐像素对齐；侧壁当前使用纯色渐变材质，
 * 这里仍保留同样的归一化 UV，方便后续替换为贴图侧壁而不用改几何。
 */
const DISTRICT_UV_GENERATOR: THREE.UVGenerator = {
  generateTopUV(_geometry, vertices, indexA, indexB, indexC) {
    return [indexA, indexB, indexC].map((index) => {
      return new THREE.Vector2(
        vertices[index * 3] / MAP_WIDTH + 0.5,
        vertices[index * 3 + 1] / MAP_HEIGHT + 0.5
      )
    })
  },
  generateSideWallUV(_geometry, vertices, indexA, indexB, indexC, indexD) {
    return [indexA, indexB, indexC, indexD].map((index) => {
      return new THREE.Vector2(
        vertices[index * 3] / MAP_WIDTH + 0.5,
        vertices[index * 3 + 1] / MAP_HEIGHT + 0.5
      )
    })
  },
}

/** 中心城区标注较密，手动错开，避免文字相互遮挡 */
const LABEL_OFFSETS: Record<string, [number, number]> = {
  潍城区: [-3, 4],
  寒亭区: [5, 5],
  坊子区: [5, -3],
  奎文区: [11, 2],
  昌乐县: [-4, -3],
  昌邑市: [11, 4],
}

interface DistrictEntry {
  feature: WeifangFeature
  district: DistrictEmission
  mesh: THREE.Mesh
  topMaterial: THREE.MeshBasicMaterial
  sideMaterial: THREE.MeshStandardMaterial
  edgeMaterial: THREE.LineBasicMaterial
  heatColor: THREE.Color
  neutralColor: THREE.Color
  labelElement: HTMLButtonElement
  label: CSS2DObject
  center: THREE.Vector3
  radius: number
  height: number
  bar: THREE.Mesh
  barMaterial: THREE.MeshStandardMaterial
  barGlow: THREE.Mesh
}

function ringsToPath(
  target: THREE.Shape | THREE.Path,
  ring: LonLat[]
): void {
  ring.forEach((lonLat, index) => {
    const point = projectToMap(lonLat)
    if (index === 0) target.moveTo(point.x, point.y)
    else target.lineTo(point.x, point.y)
  })
  target.closePath()
}

function createFeatureShapes(feature: WeifangFeature): THREE.Shape[] {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates

  return polygons.map((rings) => {
    const shape = new THREE.Shape()
    ringsToPath(shape, rings[0])
    rings.slice(1).forEach((hole) => {
      const path = new THREE.Path()
      ringsToPath(path, hole)
      shape.holes.push(path)
    })
    return shape
  })
}

/** 只绘制区县顶面轮廓，避免 ExtrudeGeometry 全边线产生的“栅栏”噪点 */
function addTopOutlines(
  mesh: THREE.Mesh,
  shapes: THREE.Shape[],
  height: number,
  material: THREE.LineBasicMaterial
) {
  const group = new THREE.Group()
  shapes.forEach((shape) => {
    const rings = [
      shape.getPoints(1),
      ...shape.holes.map((hole) => hole.getPoints(1)),
    ]
    rings.forEach((points) => {
      if (points.length < 2) return
      const positions = points.map(
        (point) => new THREE.Vector3(point.x, point.y, height + 0.03)
      )
      const geometry = new THREE.BufferGeometry().setFromPoints(positions)
      const line = new THREE.LineLoop(geometry, material)
      line.renderOrder = 3
      group.add(line)
    })
  })
  mesh.add(group)
}

/** 用区县 GeoJSON 生成底图透明遮罩，去掉卫星影像外的空白区域 */
function createMaskTexture(features: WeifangFeature[]): THREE.CanvasTexture {
  const width = 1536
  const height = Math.round(width * (MAP_HEIGHT / MAP_WIDTH))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建地图遮罩画布')

  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.strokeStyle = '#ffffff'
  context.lineWidth = 3
  context.lineJoin = 'round'

  features.forEach((feature) => {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates

    polygons.forEach((rings) => {
      context.beginPath()
      rings[0].forEach((lonLat, index) => {
        const { u, v } = projectUnit(lonLat)
        const x = u * width
        const y = (1 - v) * height
        if (index === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      })
      context.closePath()
      context.fill()
      context.stroke()
    })
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/** 白色径向渐变，用作柱体底部的柔和光晕（材质 color 负责染色） */
function createSoftDiscTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建柱体光晕画布')
  const center = size / 2
  const gradient = context.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    center
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(0.62, 'rgba(255, 255, 255, 0.14)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建地图辉光画布')
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.5
  )
  gradient.addColorStop(0, 'rgba(34, 211, 238, 0.34)')
  gradient.addColorStop(0.45, 'rgba(14, 116, 144, 0.16)')
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createTooltipElement() {
  const element = document.createElement('div')
  element.className = 'wf-company-tooltip'
  element.style.display = 'none'
  return element
}

function fillTooltip(
  element: HTMLElement,
  company: CompanyEmission
): void {
  element.replaceChildren()
  const name = document.createElement('strong')
  name.textContent = company.name
  const meta = document.createElement('span')
  meta.className = 'wf-company-tooltip__meta'
  meta.textContent = `${company.industry} · ${formatPercent(company.yoy)}`
  const value = document.createElement('b')
  value.textContent = formatTons(company.emissions)
  element.append(name, meta, value)
}

export function createMapScene(
  host: HTMLElement,
  options: MapSceneOptions
): MapSceneController {
  const scene = new THREE.Scene()
  // 近裁剪面不要贴得太近：地图尺度跨度很大（近景 2.4 ~ 远景 2200），
  // 过小的 near 会让远景深度精度跌到数米，导致贴图层与挤出体闪烁。
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 30_000)
  const mapRoot = new THREE.Group()
  mapRoot.rotation.x = -Math.PI / 2
  scene.add(mapRoot)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.domElement.className = 'wf-canvas'
  renderer.domElement.style.touchAction = 'none'
  host.appendChild(renderer.domElement)

  const labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = 'wf-css2d'
  host.appendChild(labelRenderer.domElement)

  scene.add(new THREE.AmbientLight(0x94b8dc, 1.7))
  scene.add(new THREE.HemisphereLight(0x9bd8ff, 0x020617, 1.1))

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.8)
  sunLight.position.set(-70, 120, 85)
  scene.add(sunLight)

  const cyanLight = new THREE.DirectionalLight(0x22d3ee, 1.4)
  cyanLight.position.set(80, 45, -60)
  scene.add(cyanLight)

  const worldMap = createWorldMap({ renderer })
  mapRoot.add(worldMap.group)

  const maskTexture = createMaskTexture(options.features)

  const baseMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    alphaMap: maskTexture,
    alphaTest: 0.08,
    // 底图与下方世界地图/高清层几乎共面，写入深度会在缩放时产生
    // z-fighting（贴图忽隐忽现）。背景层统一按 renderOrder 叠加。
    depthWrite: false,
    toneMapped: false,
  })
  const baseMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT),
    baseMaterial
  )
  baseMesh.position.z = -0.06
  baseMesh.renderOrder = 0
  mapRoot.add(baseMesh)

  // 轻微压暗卫星底图，提升暗色大屏的可读性
  const tintMaterial = new THREE.MeshBasicMaterial({
    color: BASE_TINT_COLOR,
    transparent: true,
    opacity: BASE_TINT_OPACITY,
    alphaMap: maskTexture,
    alphaTest: 0.08,
    depthWrite: false,
    toneMapped: false,
  })
  const tintMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT),
    tintMaterial
  )
  tintMesh.position.z = -0.02
  tintMesh.renderOrder = 1
  mapRoot.add(tintMesh)

  const barGlowTexture = createSoftDiscTexture()
  const glowTexture = createGlowTexture()
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const glowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDTH * 1.2, MAP_HEIGHT * 1.16),
    glowMaterial
  )
  glowMesh.position.z = -0.8
  glowMesh.renderOrder = -1
  mapRoot.add(glowMesh)

  const values = options.districts.map((district) => district.emissions)
  const minEmission = Math.min(...values)
  const maxEmission = Math.max(...values)

  const entries: DistrictEntry[] = []

  options.features.forEach((feature) => {
    const district = options.districts.find(
      (item) => item.adcode === feature.properties.adcode
    )
    if (!district) return

    const { hex } = emissionColor(
      district.emissions,
      minEmission,
      maxEmission
    )
    const heatColor = new THREE.Color(hex)
    const neutralColor = new THREE.Color('#0e7490')
    const t =
      maxEmission > minEmission
        ? (district.emissions - minEmission) / (maxEmission - minEmission)
        : 0.5
    // 抬升高度同时承担“数据分层”的作用，但对 100 单位宽的地图来说过高
    // 会让侧面变成一圈厚重色带，压住顶面的卫星贴图，因此整体收敛一些。
    const height = 1.05 + t * 3.2

    const shapes = createFeatureShapes(feature)
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: height,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1,
      UVGenerator: DISTRICT_UV_GENERATOR,
    })
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()

    // 侧面按高度做明暗渐变，底部更暗、顶部接近受光面，增强 2.5D 体积感
    const positionAttribute = geometry.getAttribute('position')
    const sideColors = new Float32Array(positionAttribute.count * 3)
    for (let index = 0; index < positionAttribute.count; index += 1) {
      const ratio = THREE.MathUtils.clamp(
        positionAttribute.getZ(index) / height,
        0,
        1
      )
      const shade = 0.5 + ratio * 0.55
      sideColors[index * 3] = shade
      sideColors[index * 3 + 1] = shade
      sideColors[index * 3 + 2] = shade
    }
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(sideColors, 3)
    )

    const topMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: true,
      toneMapped: false,
    })
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: neutralColor,
      emissive: neutralColor,
      emissiveIntensity: 0.16,
      roughness: 0.62,
      metalness: 0.06,
      side: THREE.FrontSide,
      vertexColors: true,
      depthWrite: true,
    })
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial])
    mesh.renderOrder = 2
    addTopOutlines(mesh, shapes, height, edgeMaterial)
    mapRoot.add(mesh)

    const center = projectToMap(district.center)
    const [offsetX, offsetY] = LABEL_OFFSETS[district.name] ?? [0, 0]
    const labelElement = document.createElement('button')
    labelElement.type = 'button'
    labelElement.className = 'wf-district-label'
    labelElement.dataset.adcode = String(district.adcode)
    labelElement.setAttribute(
      'aria-label',
      `${district.name}，碳排放 ${formatWanTons(district.emissions)}`
    )

    const dot = document.createElement('span')
    dot.className = 'wf-district-label__dot'
    dot.style.background = hex
    const name = document.createElement('span')
    name.className = 'wf-district-label__name'
    name.textContent = district.name
    const value = document.createElement('span')
    value.className = 'wf-district-label__value'
    value.textContent = formatWanTons(district.emissions)
    labelElement.append(dot, name, value)

    labelElement.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      selectDistrictByUser(district.adcode)
    })
    labelElement.addEventListener('pointerenter', () => {
      hoveredAdcode = district.adcode
      paintDistricts()
    })
    labelElement.addEventListener('pointerleave', () => {
      if (hoveredAdcode === district.adcode) hoveredAdcode = null
      paintDistricts()
    })

    const label = new CSS2DObject(labelElement)
    label.position.set(
      center.x + offsetX,
      center.y + offsetY,
      height + 2.6
    )
    label.center.set(0.5, 1)
    mesh.add(label)

    const barHeight = 1.1 + t * 3.9
    const barMaterial = new THREE.MeshStandardMaterial({
      color: heatColor,
      emissive: heatColor,
      emissiveIntensity: 0.95,
      roughness: 0.3,
      metalness: 0.2,
    })
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.52, barHeight),
      barMaterial
    )
    bar.position.set(center.x, center.y, height + barHeight / 2 + 0.08)
    bar.renderOrder = 5
    bar.visible = false
    mesh.add(bar)

    // 柱体底部的一圈柔光，让柱子和区县顶面有“落地”关系，而不是浮在空中
    const barGlowMaterial = new THREE.MeshBasicMaterial({
      map: barGlowTexture,
      color: heatColor,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const barGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      barGlowMaterial
    )
    barGlow.position.set(center.x, center.y, height + 0.04)
    barGlow.renderOrder = 4
    barGlow.visible = false
    mesh.add(barGlow)
    label.position.z = height + barHeight + 0.45

    entries.push({
      feature,
      district,
      mesh,
      topMaterial,
      sideMaterial,
      edgeMaterial,
      heatColor,
      neutralColor,
      labelElement,
      label,
      center: new THREE.Vector3(center.x, center.y, 0.4),
      radius: geometry.boundingSphere?.radius ?? 2,
      height,
      bar,
      barMaterial,
      barGlow,
    })
  })

  const districtMeshes = entries.map((entry) => entry.mesh)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.075
  controls.rotateSpeed = 0.5
  controls.zoomSpeed = 0.75
  controls.panSpeed = 0.6
  controls.screenSpacePanning = false
  controls.enablePan = true
  // 左键 / 单指拖拽平移（支持水平拖动），右键拖拽旋转，滚轮 / 双指缩放
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  }
  controls.touches = {
    ONE: THREE.TOUCH.PAN,
    TWO: THREE.TOUCH.DOLLY_PAN,
  }
  controls.minDistance = OVERVIEW_MIN_DISTANCE
  controls.maxDistance = OVERVIEW_MAX_DISTANCE
  controls.minPolarAngle = 0.5
  controls.maxPolarAngle = 1.15
  controls.target.set(0, 1.4, 0)

  let selectedAdcode: number | null = null
  let hoveredAdcode: number | null = null
  let hasTexture = false
  let hasWorldMapTexture = false
  let animationFrame = 0
  let active = false
  let resizeWidth = 0
  let visualMode: VisualMode = 'bar'
  let detailMode = false
  let introActive = false
  let detailLayer: DetailLayer | null = null
  let companyLayer: CompanyLayer | null = null
  let pointerDownX = 0
  let pointerDownY = 0
  let pointerPressed = false
  let pointerDragged = false

  const tooltipElement = createTooltipElement()
  const tooltip = new CSS2DObject(tooltipElement)
  tooltip.visible = false
  mapRoot.add(tooltip)

  function paintDistricts() {
    entries.forEach((entry) => {
      const selected = entry.district.adcode === selectedAdcode
      const hovered = entry.district.adcode === hoveredAdcode
      const heat = visualMode === 'heat'
      const baseColor = heat ? entry.heatColor : entry.neutralColor

      // 顶面保留卫星贴图，只用不同强度的色调叠加表达热力 / 悬停 / 选中，
      // 避免半透明色块把卫星纹理盖住。
      const topTint = heat ? entry.heatColor : entry.neutralColor
      const topTintStrength = detailMode
        ? 0
        : heat
          ? selected
            ? 0.7
            : hovered
              ? 0.58
              : 0.46
          : selected
            ? 0.2
            : hovered
              ? 0.12
              : 0
      entry.topMaterial.color
        .copy(TOP_BASE_COLOR)
        .lerp(topTint, topTintStrength)

      // 侧壁用冷色岩层渐变，数据色只作为自发光染色，
      // 避免侧壁采样卫星暗部后变成一圈黑边。
      entry.sideMaterial.color
        .copy(baseColor)
        .multiplyScalar(0.35)
        .lerp(SIDE_CLIFF_COLOR, 0.8)
      entry.sideMaterial.emissive
        .copy(baseColor)
        .lerp(SIDE_CLIFF_COLOR, 0.35)
      entry.sideMaterial.emissiveIntensity = selected
        ? 0.36
        : hovered
          ? 0.24
          : heat
            ? 0.18
            : 0.1
      entry.edgeMaterial.opacity = detailMode
        ? 0
        : selected
          ? 1
          : hovered
            ? 0.96
            : 0.74
      entry.edgeMaterial.color.set(
        selected ? 0xcffafe : hovered ? 0x67e8f9 : 0x38bdf8
      )

      entry.mesh.visible = !detailMode
      const showBar = !detailMode && !introActive && visualMode === 'bar'
      entry.bar.visible = showBar
      entry.barGlow.visible = showBar
      entry.labelElement.classList.toggle('is-selected', selected)
      entry.labelElement.classList.toggle('is-hovered', hovered)
      entry.labelElement.classList.toggle(
        'is-muted',
        selectedAdcode !== null && !selected
      )
      entry.labelElement.classList.toggle(
        'is-hidden',
        detailMode || introActive
      )
    })
  }

  function wholeView() {
    const verticalFov = camera.fov * DEG2RAD
    const aspect = Math.max(camera.aspect, 0.35)
    const fitHeight =
      (MAP_HEIGHT * MAP_FIT_PADDING) / (2 * Math.tan(verticalFov / 2))
    const fitWidth =
      (MAP_WIDTH * MAP_FIT_PADDING) /
      (2 * Math.tan(verticalFov / 2) * aspect)
    const distance = Math.max(fitHeight, fitWidth) * 0.92
    // 略低一点的俯角能同时看到顶面贴图和侧壁，2.5D 体积感比正俯视更强
    const polar = 0.92
    const target = new THREE.Vector3(0, 1.4, 0)
    const position = target
      .clone()
      .add(
        new THREE.Vector3(
          0,
          Math.cos(polar) * distance,
          Math.sin(polar) * distance
        )
      )
    return { position, target }
  }

  function worldView() {
    const distance = 1750
    const polar = 0.74
    const target = new THREE.Vector3(0, 0, 0)
    const position = target
      .clone()
      .add(
        new THREE.Vector3(
          0,
          Math.cos(polar) * distance,
          Math.sin(polar) * distance
        )
      )
    return { position, target }
  }

  function animateCamera(
    position: THREE.Vector3,
    target: THREE.Vector3,
    duration: number
  ) {
    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)
    controls.enabled = false
    gsap.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
    gsap.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
      onComplete: () => {
        controls.enabled = true
        controls.update()
      },
    })
  }

  function applyWholeView(animate: boolean) {
    const view = wholeView()
    if (!animate) {
      camera.position.copy(view.position)
      controls.target.copy(view.target)
      controls.update()
      return
    }
    animateCamera(view.position, view.target, 0.95)
  }

  function setOverviewLimits() {
    controls.minDistance = OVERVIEW_MIN_DISTANCE
    controls.maxDistance = OVERVIEW_MAX_DISTANCE
    controls.minPolarAngle = 0.5
    controls.maxPolarAngle = 1.15
  }

  function setDetailLimits() {
    controls.minDistance = DETAIL_MIN_DISTANCE
    controls.maxDistance = DETAIL_MAX_DISTANCE
    controls.minPolarAngle = 0.42
    controls.maxPolarAngle = 1.28
  }

  function setDetailVisualState(enabled: boolean) {
    detailMode = enabled
    // 下钻时仍以卫星影像为底，只轻微压暗以突出 OSM 矢量，
    // 避免整屏变成纯黑，与 2.5D 总览风格保持一致。
    const overviewOpacity = enabled ? 0.98 : 1
    const tintOpacity = enabled ? DETAIL_TINT_OPACITY : BASE_TINT_OPACITY
    const glowOpacity = enabled ? DETAIL_GLOW_OPACITY : OVERVIEW_GLOW_OPACITY
    gsap.to(baseMaterial, { opacity: overviewOpacity, duration: 0.65 })
    gsap.to(tintMaterial, { opacity: tintOpacity, duration: 0.65 })
    gsap.to(glowMaterial, { opacity: glowOpacity, duration: 0.65 })
    const worldOpacity = { value: worldMap.getOpacity() }
    gsap.to(worldOpacity, {
      value: enabled ? 0.22 : 0.55,
      duration: 0.65,
      onUpdate: () => worldMap.setOpacity(worldOpacity.value),
    })
    if (enabled) worldMap.setMarkerVisible(false)
    if (detailLayer) detailLayer.setVisible(enabled)
    if (companyLayer) companyLayer.group.visible = enabled
    paintDistricts()
  }

  function disposeDetailLayers() {
    if (detailLayer) {
      mapRoot.remove(detailLayer.group)
      detailLayer.dispose()
      detailLayer = null
    }
    if (companyLayer) {
      mapRoot.remove(companyLayer.group)
      companyLayer.dispose()
      companyLayer = null
    }
    tooltip.visible = false
    tooltipElement.style.display = 'none'
  }

  function hideTooltip() {
    tooltip.visible = false
    tooltipElement.style.display = 'none'
    companyLayer?.setHovered(null)
  }

  function showTooltip(company: CompanyEmission) {
    const point = projectToMap(company.position)
    fillTooltip(tooltipElement, company)
    tooltipElement.style.display = 'flex'
    tooltip.position.set(point.x, point.y, 2.05)
    tooltip.visible = true
    companyLayer?.setHovered(company.id)
  }

  function clearSelection(animate = true) {
    const hadSelection = selectedAdcode !== null
    selectedAdcode = null
    hideTooltip()
    disposeDetailLayers()
    detailMode = false
    entries.forEach((entry) => {
      gsap.killTweensOf(entry.mesh.position)
      gsap.to(entry.mesh.position, {
        z: 0,
        duration: 0.55,
        ease: 'power2.out',
      })
    })
    gsap.to(baseMaterial, { opacity: 1, duration: 0.7 })
    gsap.to(tintMaterial, { opacity: 0.18, duration: 0.7 })
    gsap.to(glowMaterial, { opacity: 0.45, duration: 0.7 })
    const worldOpacity = { value: worldMap.getOpacity() }
    gsap.to(worldOpacity, {
      value: 0.55,
      duration: 0.7,
      onUpdate: () => worldMap.setOpacity(worldOpacity.value),
    })
    setOverviewLimits()
    paintDistricts()
    if (animate && hadSelection) applyWholeView(true)
  }

  function resetView(animate = true) {
    clearSelection(false)
    applyWholeView(animate)
  }

  function focusEntry(entry: DistrictEntry) {
    selectedAdcode = entry.district.adcode
    hideTooltip()
    entries.forEach((item) => {
      gsap.killTweensOf(item.mesh.position)
      gsap.to(item.mesh.position, {
        z: item === entry ? DISTRICT_LIFT : 0,
        duration: 0.6,
        ease: 'power2.out',
      })
    })
    setDetailLimits()
    paintDistricts()

    const target = mapRoot.localToWorld(entry.center.clone())
    const direction = new THREE.Vector3(0.04, 0.96, 1.16).normalize()
    const position = target
      .clone()
      .add(direction.multiplyScalar(DETAIL_CAMERA_DISTANCE))
    animateCamera(position, target, TIMING.focus)
  }

  function selectDistrictByUser(adcode: number) {
    const entry = entries.find((item) => item.district.adcode === adcode)
    if (!entry || introActive) return
    if (selectedAdcode === adcode) return
    focusEntry(entry)
    options.onSelect(adcode)
  }

  function setVisualMode(mode: VisualMode) {
    if (visualMode === mode) return
    visualMode = mode
    paintDistricts()
    companyLayer?.setMode(mode)
  }

  function setDistrictDetail(detail: DistrictOsmDetail | null) {
    const entry = entries.find(
      (item) => item.district.adcode === selectedAdcode
    )
    if (!entry) return

    disposeDetailLayers()
    setDetailLimits()
    if (detail) {
      detailLayer = createOsmDetailLayer(detail, entry.feature, {
        x: entry.center.x,
        y: entry.center.y,
      })
      mapRoot.add(detailLayer.group)
    }
    companyLayer = createCompanyLayer(
      entry.district.companies,
      Math.max(...entry.district.companies.map((company) => company.emissions))
    )
    companyLayer.setMode(visualMode)
    mapRoot.add(companyLayer.group)
    setDetailVisualState(true)
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) return
    pointerPressed = true
    pointerDragged = false
    pointerDownX = event.clientX
    pointerDownY = event.clientY
    renderer.domElement.style.cursor = 'grabbing'
  }

  function pickDistrict(event: PointerEvent): DistrictEntry | null {
    if (detailMode) return null
    const rect = renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(
      districtMeshes.filter((mesh) => mesh.visible),
      false
    )[0]
    if (!hit) return null
    return entries.find((entry) => entry.mesh === hit.object) ?? null
  }

  function pickCompany(event: PointerEvent): CompanyEmission | null {
    if (!detailMode || !companyLayer || visualMode !== 'bar') return null
    const targets = companyLayer.bars.filter((bar) => bar.visible)
    if (targets.length === 0) return null
    const rect = renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(targets, false)[0]
    return (hit?.object.userData.company as CompanyEmission | undefined) ?? null
  }

  function handlePointerUp(event: PointerEvent) {
    if (event.button !== 0) return
    const dragged = pointerDragged
    pointerPressed = false
    pointerDragged = false
    renderer.domElement.style.cursor = 'grab'
    if (dragged || controls.enabled === false || introActive) return
    if (detailMode) {
      // 下钻后点击空白保持当前区县视图，只处理企业点位，避免误退出
      const company = pickCompany(event)
      if (company) showTooltip(company)
      else hideTooltip()
      return
    }
    const entry = pickDistrict(event)
    if (entry) selectDistrictByUser(entry.district.adcode)
  }

  function handlePointerMove(event: PointerEvent) {
    if (pointerPressed && event.buttons !== 0) {
      const distance = Math.hypot(
        event.clientX - pointerDownX,
        event.clientY - pointerDownY
      )
      if (distance > DRAG_CLICK_THRESHOLD) pointerDragged = true
    }
    if (event.buttons !== 0 || introActive) return
    if (detailMode) {
      const company = pickCompany(event)
      renderer.domElement.style.cursor = company ? 'pointer' : 'grab'
      if (company) showTooltip(company)
      else hideTooltip()
      return
    }
    const entry = pickDistrict(event)
    const nextHovered = entry?.district.adcode ?? null
    renderer.domElement.style.cursor = entry ? 'pointer' : 'grab'
    if (nextHovered !== hoveredAdcode) {
      hoveredAdcode = nextHovered
      paintDistricts()
    }
  }

  function handlePointerLeave() {
    renderer.domElement.style.cursor = 'grab'
    if (hoveredAdcode !== null) {
      hoveredAdcode = null
      paintDistricts()
    }
    hideTooltip()
  }

  renderer.domElement.addEventListener('pointerdown', handlePointerDown)
  renderer.domElement.addEventListener('pointerup', handlePointerUp)
  renderer.domElement.addEventListener('pointermove', handlePointerMove)
  renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
  renderer.domElement.style.cursor = 'grab'

  const resize = () => {
    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || window.innerHeight
    const aspectChanged =
      resizeWidth === 0 ||
      Math.abs(width / Math.max(height, 1) - camera.aspect) > 0.001
    resizeWidth = width
    renderer.setSize(width, height, false)
    labelRenderer.setSize(width, height)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    if (aspectChanged && selectedAdcode === null && !introActive) {
      applyWholeView(false)
    }
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()
  applyWholeView(false)
  paintDistricts()

  /** 限制平移范围，避免把地图拖出视野 */
  function clampPanTarget() {
    if (!controls.enabled) return
    let centerX = 0
    let centerZ = 0
    let limitX = MAP_WIDTH * 0.55
    let limitZ = MAP_HEIGHT * 0.55
    if (detailMode) {
      const entry = entries.find(
        (item) => item.district.adcode === selectedAdcode
      )
      if (entry) {
        const radius = Math.min(Math.max(entry.radius * 1.1, 2.5), 8)
        centerX = entry.center.x
        centerZ = -entry.center.y
        limitX = radius
        limitZ = radius
      }
    }
    const target = controls.target
    const nextX = THREE.MathUtils.clamp(
      target.x,
      centerX - limitX,
      centerX + limitX
    )
    const nextZ = THREE.MathUtils.clamp(
      target.z,
      centerZ - limitZ,
      centerZ + limitZ
    )
    const deltaX = nextX - target.x
    const deltaZ = nextZ - target.z
    if (deltaX === 0 && deltaZ === 0) return
    target.x = nextX
    target.z = nextZ
    camera.position.x += deltaX
    camera.position.z += deltaZ
  }

  const clock = new THREE.Clock()
  const renderFrame = () => {
    animationFrame = requestAnimationFrame(renderFrame)
    const delta = Math.min(clock.getDelta(), 0.05)
    controls.update()
    clampPanTarget()
    worldMap.update(delta, camera.position.distanceTo(controls.target))
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  const start = () => {
    if (animationFrame) return
    clock.getDelta()
    animationFrame = requestAnimationFrame(renderFrame)
  }

  const stop = () => {
    if (!animationFrame) return
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }

  const setActive = (nextActive: boolean) => {
    active = nextActive
    if (active) start()
    else stop()
  }

  const playIntro = () => {
    if (!active) return
    introActive = true
    disposeDetailLayers()
    detailMode = false
    selectedAdcode = null
    hideTooltip()
    entries.forEach((entry) => {
      gsap.killTweensOf(entry.mesh.position)
      entry.mesh.position.z = 0
    })
    entries.forEach((entry) => {
      entry.bar.visible = false
      entry.labelElement.classList.add('is-hidden')
    })
    paintDistricts()

    const startView = worldView()
    const endView = wholeView()
    camera.position.copy(startView.position)
    controls.target.copy(startView.target)
    camera.lookAt(controls.target)
    controls.enabled = false
    setOverviewLimits()

    baseMaterial.opacity = 0.04
    tintMaterial.opacity = 0.72
    glowMaterial.opacity = 0.1
    worldMap.setOpacity(0.95)
    worldMap.setMarkerVisible(true)

    const worldOpacity = { value: 0.95 }
    const timeline = gsap.timeline({
      onComplete: () => {
        introActive = false
        controls.enabled = true
        controls.update()
        worldMap.setMarkerVisible(false)
        worldMap.setOpacity(0.55)
        paintDistricts()
      },
    })

    timeline
      .to(
        camera.position,
        {
          x: endView.position.x,
          y: endView.position.y,
          z: endView.position.z,
          duration: 3.4,
          ease: 'power3.inOut',
          onUpdate: () => {
            controls.update()
            worldMap.setMarkerVisible(
              camera.position.distanceTo(controls.target) > 560
            )
          },
        },
        0
      )
      .to(
        controls.target,
        {
          x: endView.target.x,
          y: endView.target.y,
          z: endView.target.z,
          duration: 3.4,
          ease: 'power3.inOut',
        },
        0
      )
      .to(
        baseMaterial,
        { opacity: 1, duration: 1.1, ease: 'power2.out' },
        2.15
      )
      .to(
        tintMaterial,
        { opacity: BASE_TINT_OPACITY, duration: 1.1, ease: 'power2.out' },
        2.15
      )
      .to(
        glowMaterial,
        { opacity: OVERVIEW_GLOW_OPACITY, duration: 1.1, ease: 'power2.out' },
        2.15
      )
      .to(
        worldOpacity,
        {
          value: 0.55,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => worldMap.setOpacity(worldOpacity.value),
        },
        2.05
      )
  }

  const setBaseTexture = (texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy())
    texture.needsUpdate = true
    baseMaterial.map = texture
    baseMaterial.needsUpdate = true
    // 区县抬升后的顶面直接使用同一张卫星图，纹理与底图按地图坐标对齐
    entries.forEach((entry) => {
      entry.topMaterial.map = texture
      entry.topMaterial.needsUpdate = true
    })
    hasTexture = true
  }

  const setWorldTexture = (texture: THREE.Texture) => {
    worldMap.setTexture(texture)
    hasWorldMapTexture = true
  }

  /** 区域高清底图层（中景 / 近景），可选，加载后叠加到全球纹理上 */
  const setWorldRegionTextures = (textures: {
    mid?: THREE.Texture
    near?: THREE.Texture
  }) => {
    if (textures.mid) worldMap.setMidTexture(textures.mid)
    if (textures.near) worldMap.setNearTexture(textures.near)
  }

  const dispose = () => {
    stop()
    resizeObserver.disconnect()
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
    renderer.domElement.removeEventListener('pointerup', handlePointerUp)
    renderer.domElement.removeEventListener('pointermove', handlePointerMove)
    renderer.domElement.removeEventListener(
      'pointerleave',
      handlePointerLeave
    )
    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)
    entries.forEach((entry) => {
      gsap.killTweensOf(entry.mesh.position)
    })
    disposeDetailLayers()
    controls.dispose()
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
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
    baseMaterial.map?.dispose()
    maskTexture.dispose()
    glowTexture.dispose()
    barGlowTexture.dispose()
    worldMap.dispose()
    labelRenderer.domElement.remove()
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__wfMapDebug = {
      renderer,
      scene,
      camera,
    }
  }

  return {
    host,
    camera,
    controls,
    hasBaseTexture: () => hasTexture,
    hasWorldTexture: () => hasWorldMapTexture,
    setBaseTexture,
    setWorldTexture,
    setWorldRegionTextures,
    setActive,
    playIntro,
    resetView,
    clearSelection,
    setVisualMode,
    setDistrictDetail,
    resize,
    dispose,
  }
}
