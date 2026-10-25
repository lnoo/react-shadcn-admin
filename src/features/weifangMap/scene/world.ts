import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { MAP_WIDTH, WEIFANG_BOUNDS, WEIFANG_CENTER } from '../config'
import type { LonLat } from '../types'

const DEG2RAD = Math.PI / 180
const WORLD_WRAP_LAT = 85.05112878

/** 全球 Web Mercator 平面上的归一化坐标（v 向上为北） */
export function projectWorldUnit([lon, lat]: LonLat): {
  u: number
  v: number
} {
  const clamped = Math.max(-WORLD_WRAP_LAT, Math.min(WORLD_WRAP_LAT, lat))
  return {
    u: (lon + 180) / 360,
    v:
      0.5 +
      Math.log(Math.tan(Math.PI / 4 + (clamped * DEG2RAD) / 2)) /
        (2 * Math.PI),
  }
}

/**
 * 区域层叠底图半径（相对全幅 u/v，即 0.5 半宽）：
 * 近景 ±8.1°（z8 纹理 2949px ≈ 3.3 px/单位），中景 ±16.2°（z7 ≈ 1.7 px/单位），
 * 更远处退化为全球低清纹理（≈ 0.2 px/单位）。各层边缘用径向 alpha 羽化衔接。
 */
const NEAR_PLATE_HALF = 0.0225
const MID_PLATE_HALF = 0.045

/** 径向羽化 alphaMap（green 通道控制不透明度）：inner 段全实，向外平滑衰减到 0 */
function createFeatherTexture(innerFraction: number): THREE.Texture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  // 多级渐变中点，避免 256px 低分辨率时的条带感
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    (innerFraction * size) / 2,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.34, '#f0f0f0')
  gradient.addColorStop(0.62, '#c8c8c8')
  gradient.addColorStop(0.84, '#6e6e6e')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  return texture
}

interface PlateLayer {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  texture: THREE.Texture
  feather: THREE.Texture
}

/** 在全球底图上叠加一块按 u/v 坐标对齐的区域纹理（z 逐层抬高避免 z-fighting） */
function createPlateLayer(options: {
  planeGroup: THREE.Group
  width: number
  height: number
  center: { u: number; v: number }
  half: number
  zOffset: number
  renderOrder: number
  tint: number
  featherInner: number
}): PlateLayer {
  const spanU = options.half * 2 * options.width
  const spanV = options.half * 2 * options.height
  const geometry = new THREE.PlaneGeometry(spanU, spanV)
  const feather = createFeatherTexture(options.featherInner)
  const material = new THREE.MeshBasicMaterial({
    color: options.tint,
    transparent: true,
    opacity: 1,
    alphaMap: feather,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(
    (options.center.u - 0.5) * options.width,
    (options.center.v - 0.5) * options.height,
    options.zOffset
  )
  mesh.renderOrder = options.renderOrder
  options.planeGroup.add(mesh)
  return { mesh, material, texture: feather, feather }
}

/**
 * 2.5D 世界底图。
 *
 * 使用与地球相同的 Web Mercator 卫星纹理，按真实经纬比例铺在潍坊地图下方：
 * 潍坊细节图只是这张世界地图上的一小块，因此飞出地球时不会悬空在粒子背景里。
 *
 * 清晰度采用三层 LOD：
 *  - 全球低清纹理（world-texture.jpg，4096px 全球）
 *  - 中国东部中景层（world-mid.jpg，z7 拼片）+ 羽化边缘
 *  - 山东半岛近景层（world-near.jpg，z8 拼片）+ 羽化边缘
 */
export function createWorldMap(options: {
  texture?: THREE.Texture
  midTexture?: THREE.Texture
  nearTexture?: THREE.Texture
  renderer: THREE.WebGLRenderer
}) {
  const group = new THREE.Group()
  group.position.z = -2.4

  const lonSpan = WEIFANG_BOUNDS.east - WEIFANG_BOUNDS.west
  const width = (MAP_WIDTH * 360) / lonSpan
  const height = width

  const center = projectWorldUnit([WEIFANG_CENTER.lon, WEIFANG_CENTER.lat])
  const offsetX = -(center.u - 0.5) * width
  const offsetY = -(center.v - 0.5) * height

  const planeGroup = new THREE.Group()
  planeGroup.position.set(offsetX, offsetY, 0)
  group.add(planeGroup)

  const material = new THREE.MeshBasicMaterial({
    color: 0x8da0b3,
    transparent: true,
    opacity: 0.92,
    // 底图与区域高清层仅相差 0.04~2.4 个世界单位，在远景（相机距离
    // 1000+）时深度缓冲精度不足以区分，若写入深度会让高清层在缩放时
    // 被底层反复遮挡而闪烁。这里统一关闭背景平面深度写入，由 renderOrder
    // 固定绘制顺序；前景挤出体仍通过深度测试正常遮挡底图。
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
  plane.renderOrder = -4
  planeGroup.add(plane)

  // 区域高清层：中景在下，近景在上（潍坊周边）
  const plateLayers: PlateLayer[] = []
  const configurePlateTexture = (
    layer: PlateLayer,
    texture: THREE.Texture
  ) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(
      16,
      options.renderer.capabilities.getMaxAnisotropy()
    )
    texture.needsUpdate = true
    layer.material.map = texture
    layer.material.needsUpdate = true
  }
  const registerPlate = (layer: PlateLayer, texture?: THREE.Texture) => {
    if (texture) configurePlateTexture(layer, texture)
    plateLayers.push(layer)
  }
  registerPlate(
    createPlateLayer({
      planeGroup,
      width,
      height,
      center,
      half: MID_PLATE_HALF,
      zOffset: 0.04,
      renderOrder: -3.8,
      tint: 0xaab6c4,
      featherInner: 0.52,
    }),
    options.midTexture
  )
  registerPlate(
    createPlateLayer({
      planeGroup,
      width,
      height,
      center,
      half: NEAR_PLATE_HALF,
      zOffset: 0.08,
      renderOrder: -3.7,
      tint: 0xbac6d2,
      featherInner: 0.46,
    }),
    options.nearTexture
  )
  // 2° 经纬网：远看是世界地图，近看提供空间坐标参照
  const gridPositions: number[] = []
  const pushPoint = (u: number, v: number) => {
    gridPositions.push((u - 0.5) * width, (v - 0.5) * height, 0.15)
  }

  for (let lon = -178; lon <= 180; lon += 2) {
    const u = (lon + 180) / 360
    pushPoint(u, 0.02)
    pushPoint(u, 0.98)
  }
  for (let lat = -82; lat <= 82; lat += 2) {
    const v = projectWorldUnit([0, lat]).v
    pushPoint(0.001, v)
    pushPoint(0.999, v)
  }

  const gridGeometry = new THREE.BufferGeometry()
  gridGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(gridPositions, 3)
  )
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial)
  grid.renderOrder = -3
  planeGroup.add(grid)

  // 潍坊在世界地图上的光标记号
  const marker = new THREE.Group()
  marker.position.set(0, 0, 1.2)

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const ring = new THREE.Mesh(new THREE.RingGeometry(7.5, 8.4, 72), ringMaterial)
  ring.renderOrder = 2
  marker.add(ring)

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xe0faff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const core = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), coreMaterial)
  core.position.z = 0.1
  marker.add(core)

  const beamMaterial = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const beamGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 48),
  ])
  const beam = new THREE.Line(beamGeometry, beamMaterial)
  marker.add(beam)

  const labelElement = document.createElement('div')
  labelElement.className = 'wf-world-marker'
  const labelName = document.createElement('strong')
  labelName.textContent = '潍坊'
  const labelEn = document.createElement('span')
  labelEn.textContent = 'WEIFANG · 36.71°N 119.15°E'
  labelElement.append(labelName, labelEn)
  const label = new CSS2DObject(labelElement)
  label.position.set(0, 0, 58)
  label.center.set(0.5, 1)
  marker.add(label)

  group.add(marker)

  const setTexture = (texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(
      16,
      options.renderer.capabilities.getMaxAnisotropy()
    )
    texture.needsUpdate = true
    material.map = texture
    material.needsUpdate = true
  }

  if (options.texture) setTexture(options.texture)

  let markerVisible = true
  let pulse = 0
  let currentDistance = 0

  /** 经纬网仅在近距（概览）可见，拉远后淡出避免摩尔纹条纹 */
  const gridFalloff = (distance: number) => {
    if (distance <= 0) return 1
    const fadeEnd = 900
    const fadeStart = 260
    if (distance >= fadeEnd) return 0
    if (distance <= fadeStart) return 1
    return 1 - (distance - fadeStart) / (fadeEnd - fadeStart)
  }

  return {
    group,
    width,
    height,
    center,
    setTexture,
    setMidTexture: (texture: THREE.Texture) => {
      configurePlateTexture(plateLayers[0], texture)
    },
    setNearTexture: (texture: THREE.Texture) => {
      configurePlateTexture(plateLayers[1], texture)
    },
    getOpacity: () => material.opacity,
    setOpacity: (opacity: number) => {
      material.opacity = opacity
      // 区域层随世界地图同步淡入淡出，但在全景亮度下保持清晰
      const plateOpacity = Math.min(0.97, opacity * 1.8)
      plateLayers.forEach((layer) => {
        layer.material.opacity = plateOpacity
      })
      gridMaterial.opacity = opacity * 0.1 * gridFalloff(currentDistance)
    },
    setMarkerVisible: (visible: boolean) => {
      markerVisible = visible
      marker.visible = visible
      labelElement.style.opacity = visible ? '1' : '0'
    },
    update: (delta: number, distance?: number) => {
      pulse += delta
      if (typeof distance === 'number' && distance !== currentDistance) {
        currentDistance = distance
        gridMaterial.opacity = material.opacity * 0.1 * gridFalloff(distance)
      }
      if (markerVisible) {
        const scale = 1 + Math.sin(pulse * 2.4) * 0.18
        ring.scale.setScalar(scale)
        ringMaterial.opacity = 0.55 + Math.sin(pulse * 2.4) * 0.22
        coreMaterial.opacity = 0.72 + Math.sin(pulse * 3.1) * 0.2
      }
    },
    dispose: () => {
      material.map?.dispose()
      plane.geometry.dispose()
      material.dispose()
      plateLayers.forEach((layer) => {
        layer.mesh.geometry.dispose()
        layer.material.map?.dispose()
        layer.material.dispose()
        layer.feather.dispose()
      })
      gridGeometry.dispose()
      gridMaterial.dispose()
      ring.geometry.dispose()
      ringMaterial.dispose()
      core.geometry.dispose()
      coreMaterial.dispose()
      beamGeometry.dispose()
      beamMaterial.dispose()
      labelElement.remove()
    },
  }
}
