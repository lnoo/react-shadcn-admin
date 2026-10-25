import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLOBE_INITIAL_VIEW } from '../config'
import { globeOrientation } from '../lib/globe-orientation'

export interface GlobeSceneController {
  host: HTMLElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  tiltGroup: THREE.Group
  spinGroup: THREE.Group
  setWorldTexture: (texture: THREE.Texture) => void
  setActive: (active: boolean) => void
  resize: () => void
  dispose: () => void
}

const GLOBE_RADIUS = 1

/**
 * 3D 地球场景：Web Mercator 全球卫星图 + 星空 + 大气辉光。
 *
 * 说明：全球底图是等距圆柱贴图形式的 Mercator 卫星图。为了在球面上保持
 * 正确的纬度关系，这里通过 onBeforeCompile 将球面 UV 的 v 分量转换为
 * Mercator 的 v 分量，避免高纬度区域被过度拉伸。
 */
export function createGlobeScene(host: HTMLElement): GlobeSceneController {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 200)
  camera.position.set(0, 0.32, 3.08)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.className = 'wf-canvas'
  renderer.domElement.style.touchAction = 'none'
  host.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0x9db9dd, 1.15))

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.6)
  sunLight.position.set(-2.6, 2.4, 3.2)
  scene.add(sunLight)

  const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.25)
  rimLight.position.set(2.8, -1.6, -2.4)
  scene.add(rimLight)

  const tiltGroup = new THREE.Group()
  const spinGroup = new THREE.Group()
  tiltGroup.add(spinGroup)
  scene.add(tiltGroup)

  const initialOrientation = globeOrientation(
    GLOBE_INITIAL_VIEW.lon,
    GLOBE_INITIAL_VIEW.lat
  )
  tiltGroup.rotation.x = initialOrientation.tilt
  spinGroup.rotation.y = initialOrientation.spin

  const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 64)
  const globeMaterial = new THREE.MeshStandardMaterial({
    color: 0x102838,
    roughness: 0.92,
    metalness: 0.02,
  })
  globeMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      /* glsl */ `
        #ifdef USE_MAP
          vec2 globeUv = vMapUv;
          float globeLatitude = (globeUv.y - 0.5) * PI;
          float globeMercator = log(tan(PI * 0.25 + globeLatitude * 0.5));
          globeUv.y = clamp(0.5 + globeMercator / (2.0 * PI), 0.0015, 0.9985);
          diffuseColor *= texture2D(map, globeUv);
        #endif
      `
    )
  }
  globeMaterial.customProgramCacheKey = () => 'weifang-globe-mercator'

  const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial)
  spinGroup.add(globeMesh)

  const atmosphereGeometry = new THREE.SphereGeometry(
    GLOBE_RADIUS * 1.035,
    96,
    64
  )
  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float rim = 1.0 - abs(dot(normalize(vNormal), normalize(-vViewPosition)));
        vec3 glow = vec3(0.16, 0.68, 1.0);
        gl_FragColor = vec4(glow, pow(rim, 2.8) * 0.95);
      }
    `,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  atmosphere.renderOrder = 2
  spinGroup.add(atmosphere)

  // 星空背景（两层不同亮度与尺寸）
  const starLayers = [
    { count: 2200, radiusMin: 6, radiusMax: 14, size: 0.035, opacity: 0.8 },
    { count: 320, radiusMin: 5, radiusMax: 11, size: 0.07, opacity: 0.55 },
  ]
  starLayers.forEach((layer) => {
    const positions = new Float32Array(layer.count * 3)
    for (let index = 0; index < layer.count; index += 1) {
      const theta = Math.random() * Math.PI * 2
      const cosPhi = Math.random() * 2 - 1
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
      const radius =
        layer.radiusMin + Math.random() * (layer.radiusMax - layer.radiusMin)
      positions[index * 3] = Math.cos(theta) * sinPhi * radius
      positions[index * 3 + 1] = cosPhi * radius
      positions[index * 3 + 2] = Math.sin(theta) * sinPhi * radius
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xa9d7ff,
      size: layer.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: layer.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const stars = new THREE.Points(geometry, material)
    stars.renderOrder = -1
    scene.add(stars)
  })

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.065
  controls.enablePan = false
  controls.rotateSpeed = 0.55
  controls.zoomSpeed = 0.65
  controls.minDistance = 1.4
  controls.maxDistance = 4.6
  controls.target.set(0, 0, 0)
  controls.update()

  let animationFrame = 0
  let active = true

  const renderFrame = () => {
    animationFrame = requestAnimationFrame(renderFrame)
    controls.update()
    renderer.render(scene, camera)
  }

  const start = () => {
    if (animationFrame) return
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

  const resize = () => {
    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()
  start()

  const setWorldTexture = (texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(
      16,
      renderer.capabilities.getMaxAnisotropy()
    )
    texture.needsUpdate = true
    globeMaterial.map = texture
    globeMaterial.color.set(0xffffff)
    globeMaterial.needsUpdate = true
  }

  const dispose = () => {
    stop()
    resizeObserver.disconnect()
    controls.dispose()
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.map?.dispose()
          }
          material.dispose()
        })
      }
    })
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  return {
    host,
    scene,
    camera,
    renderer,
    controls,
    tiltGroup,
    spinGroup,
    setWorldTexture,
    setActive,
    resize,
    dispose,
  }
}
