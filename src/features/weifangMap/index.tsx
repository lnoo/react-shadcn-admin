import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import geojsonRaw from './weifang.geojson?raw'
import weifangTextureUrl from './weifang-texture.jpg'
import worldTextureUrl from './world-texture.jpg'
import worldMidTextureUrl from './world-mid.jpg'
import worldNearTextureUrl from './world-near.jpg'
import {
  DistrictHud,
  GlobeIntro,
  LoadingOverlay,
  MapHint,
  MapLegend,
  TopBar,
} from './components/experience-ui'
import { GLOBE_INITIAL_VIEW, TIMING, WEIFANG_CENTER } from './config'
import { createDistrictData, getEmissionRange } from './data/emissions'
import { emissionColor } from './lib/format'
import {
  globeOrientation,
  nearestAngle,
} from './lib/globe-orientation'
import {
  loadDistrictOsmCore,
  loadDistrictOsmDetail,
  preloadDistrictOsmCore,
} from './lib/osm'
import { loadTexture } from './lib/texture'
import {
  createGlobeScene,
  type GlobeSceneController,
} from './scene/globe'
import {
  createMapScene,
  type MapSceneController,
} from './scene/map'
import type {
  DistrictOsmDetail,
  ViewMode,
  VisualMode,
  WeifangGeoJson,
} from './types'
import './weifang-map.css'

const GEOJSON = JSON.parse(geojsonRaw) as WeifangGeoJson
const DISTRICTS = createDistrictData(GEOJSON.features)
const EMISSION_RANGE = getEmissionRange(DISTRICTS)
const CITY_TOTAL = DISTRICTS.reduce(
  (total, district) => total + district.emissions,
  0
)
const COMPANY_TOTAL = DISTRICTS.reduce(
  (total, district) => total + district.companies.length,
  0
)
const MAX_DISTRICT = DISTRICTS.reduce(
  (max, district) => (district.emissions > max.emissions ? district : max),
  DISTRICTS[0]
)

const INITIAL_GLOBE_ORIENTATION = globeOrientation(
  GLOBE_INITIAL_VIEW.lon,
  GLOBE_INITIAL_VIEW.lat
)
const WEIFANG_GLOBE_ORIENTATION = globeOrientation(
  WEIFANG_CENTER.lon,
  WEIFANG_CENTER.lat
)

export default function WeifangMap() {
  const globeHostRef = useRef<HTMLDivElement | null>(null)
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeSceneController | null>(null)
  const mapRef = useRef<MapSceneController | null>(null)
  const viewRef = useRef<ViewMode>('globe')
  const transitioningRef = useRef(false)
  const autoEnteredRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const [view, setView] = useState<ViewMode>('globe')
  const [selectedCode, setSelectedCode] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visualMode, setVisualMode] = useState<VisualMode>('bar')
  const [selectedDetail, setSelectedDetail] =
    useState<DistrictOsmDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailEnhancing, setDetailEnhancing] = useState(false)
  const selectedCodeRef = useRef<number | null>(null)
  const detailRequestRef = useRef(0)

  const handleSelectDistrict = useCallback((adcode: number) => {
    const requestId = detailRequestRef.current + 1
    detailRequestRef.current = requestId
    selectedCodeRef.current = adcode
    setSelectedCode(adcode)
    setSelectedDetail(null)
    setDetailLoading(true)
    setDetailEnhancing(false)

    // 先用核心区数据把下钻画面立起来，再在后台换成覆盖全区的数据。
    loadDistrictOsmCore(adcode).then((core) => {
      if (
        selectedCodeRef.current !== adcode ||
        detailRequestRef.current !== requestId
      ) {
        return
      }
      setDetailLoading(false)
      if (core) {
        setSelectedDetail(core)
        mapRef.current?.setDistrictDetail(core)
      }
      setDetailEnhancing(true)

      loadDistrictOsmDetail(adcode).then((full) => {
        if (
          selectedCodeRef.current !== adcode ||
          detailRequestRef.current !== requestId
        ) {
          return
        }
        setDetailEnhancing(false)
        if (!full) return
        setSelectedDetail(full)
        if (full !== core) mapRef.current?.setDistrictDetail(full)
      })
    })
  }, [])

  const handleDistrictHover = useCallback((adcode: number) => {
    preloadDistrictOsmCore(adcode)
  }, [])

  // 3D 地球场景
  useEffect(() => {
    const host = globeHostRef.current
    if (!host) return
    let disposed = false
    const controller = createGlobeScene(host)
    globeRef.current = controller

    loadTexture(worldTextureUrl)
      .then((texture) => {
        if (disposed) {
          texture.dispose()
          return
        }
        controller.setWorldTexture(texture)
        setGlobeReady(true)
      })
      .catch((reason: unknown) => {
        if (disposed) return
        setError(
          reason instanceof Error
            ? `全球卫星影像加载失败：${reason.message}`
            : '全球卫星影像加载失败'
        )
      })

    return () => {
      disposed = true
      controller.dispose()
      if (globeRef.current === controller) globeRef.current = null
    }
  }, [])

  // 2.5D 世界 + 潍坊场景
  useEffect(() => {
    const host = mapHostRef.current
    if (!host) return
    let disposed = false
    const controller = createMapScene(host, {
      features: GEOJSON.features,
      districts: DISTRICTS,
      onSelect: handleSelectDistrict,
      onDistrictHover: handleDistrictHover,
    })
    mapRef.current = controller

    Promise.all([
      loadTexture(weifangTextureUrl),
      loadTexture(worldTextureUrl),
      loadTexture(worldMidTextureUrl).catch(() => null),
      loadTexture(worldNearTextureUrl).catch(() => null),
    ])
      .then(([weifangTexture, worldMapTexture, midTexture, nearTexture]) => {
        if (disposed) {
          weifangTexture.dispose()
          worldMapTexture.dispose()
          midTexture?.dispose()
          nearTexture?.dispose()
          return
        }
        controller.setBaseTexture(weifangTexture)
        controller.setWorldTexture(worldMapTexture)
        controller.setWorldRegionTextures({
          mid: midTexture ?? undefined,
          near: nearTexture ?? undefined,
        })
        setMapReady(true)
      })
      .catch((reason: unknown) => {
        if (disposed) return
        setError(
          reason instanceof Error
            ? `世界 / 潍坊卫星影像加载失败：${reason.message}`
            : '世界 / 潍坊卫星影像加载失败'
        )
      })

    return () => {
      disposed = true
      controller.dispose()
      if (mapRef.current === controller) mapRef.current = null
    }
  }, [handleSelectDistrict, handleDistrictHover])

  useEffect(() => {
    mapRef.current?.setVisualMode(visualMode)
  }, [visualMode])

  const enterWeifang = useCallback(() => {
    const globe = globeRef.current
    const map = mapRef.current
    if (
      !globe ||
      !map ||
      !map.hasBaseTexture() ||
      !map.hasWorldTexture() ||
      transitioningRef.current ||
      viewRef.current !== 'globe'
    ) {
      return
    }

    autoEnteredRef.current = true
    transitioningRef.current = true
    setTransitioning(true)
    setSelectedCode(null)
    selectedCodeRef.current = null
    setSelectedDetail(null)
    setDetailLoading(false)
    setDetailEnhancing(false)

    const globeHost = globe.host
    const mapHost = map.host
    globeHost.style.pointerEvents = 'none'
    mapHost.style.pointerEvents = 'none'
    globe.controls.enabled = false
    map.controls.enabled = false

    mapHost.style.visibility = 'visible'
    map.setActive(true)
    map.resetView(false)

    const spinTarget = nearestAngle(
      globe.spinGroup.rotation.y,
      WEIFANG_GLOBE_ORIENTATION.spin
    )

    timelineRef.current?.kill()
    const timeline = gsap.timeline({
      onComplete: () => {
        globe.setActive(false)
        globeHost.style.visibility = 'hidden'
        globeHost.style.opacity = '0'
        mapHost.style.pointerEvents = 'auto'
        viewRef.current = 'map'
        transitioningRef.current = false
        setView('map')
        setTransitioning(false)
      },
    })
    timelineRef.current = timeline

    timeline
      .to(
        globe.spinGroup.rotation,
        {
          y: spinTarget,
          duration: TIMING.flyIn,
          ease: 'power2.inOut',
        },
        0
      )
      .to(
        globe.tiltGroup.rotation,
        {
          x: WEIFANG_GLOBE_ORIENTATION.tilt,
          duration: TIMING.flyIn,
          ease: 'power2.inOut',
        },
        0
      )
      .to(
        globe.camera.position,
        {
          x: 0,
          y: 0.08,
          z: 1.78,
          duration: TIMING.flyIn,
          ease: 'power2.inOut',
        },
        0
      )
      .to(
        globe.controls.target,
        { x: 0, y: 0, z: 0, duration: TIMING.flyIn },
        0
      )
      .call(() => map.playIntro(), undefined, 1.02)
      .to(
        globeHost,
        {
          opacity: 0,
          scale: 1.16,
          duration: TIMING.transition,
          ease: 'power2.in',
        },
        1.05
      )
      .fromTo(
        mapHost,
        { opacity: 0, scale: 1.055 },
        {
          opacity: 1,
          scale: 1,
          duration: TIMING.transition,
          ease: 'power2.out',
        },
        1.05
      )
  }, [])

  const backToGlobe = useCallback(() => {
    const globe = globeRef.current
    const map = mapRef.current
    if (
      !globe ||
      !map ||
      transitioningRef.current ||
      viewRef.current !== 'map'
    ) {
      return
    }

    transitioningRef.current = true
    setTransitioning(true)
    setSelectedCode(null)
    selectedCodeRef.current = null
    setSelectedDetail(null)
    setDetailLoading(false)
    setDetailEnhancing(false)
    map.clearSelection(false)

    const globeHost = globe.host
    const mapHost = map.host
    globeHost.style.visibility = 'visible'
    globeHost.style.pointerEvents = 'none'
    mapHost.style.pointerEvents = 'none'
    map.controls.enabled = false
    globe.controls.enabled = false
    globe.setActive(true)

    gsap.set(globeHost, { opacity: 0, scale: 1.14 })
    gsap.set(mapHost, { opacity: 1, scale: 1 })

    const spinTarget = nearestAngle(
      globe.spinGroup.rotation.y,
      INITIAL_GLOBE_ORIENTATION.spin
    )

    timelineRef.current?.kill()
    const timeline = gsap.timeline({
      onComplete: () => {
        map.setActive(false)
        mapHost.style.visibility = 'hidden'
        mapHost.style.opacity = '0'
        globeHost.style.pointerEvents = 'auto'
        globe.controls.enabled = true
        globe.controls.update()
        viewRef.current = 'globe'
        transitioningRef.current = false
        setView('globe')
        setTransitioning(false)
      },
    })
    timelineRef.current = timeline

    timeline
      .to(
        mapHost,
        {
          opacity: 0,
          scale: 0.94,
          duration: 0.8,
          ease: 'power2.in',
        },
        0
      )
      .to(
        globeHost,
        {
          opacity: 1,
          scale: 1,
          duration: 0.95,
          ease: 'power2.out',
        },
        0.05
      )
      .to(
        globe.camera.position,
        {
          x: 0,
          y: 0.32,
          z: 3.08,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
      .to(
        globe.controls.target,
        { x: 0, y: 0, z: 0, duration: 1, ease: 'power2.inOut' },
        0
      )
      .to(
        globe.spinGroup.rotation,
        { y: spinTarget, duration: 1, ease: 'power2.inOut' },
        0
      )
      .to(
        globe.tiltGroup.rotation,
        {
          x: INITIAL_GLOBE_ORIENTATION.tilt,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
  }, [])

  const closeDistrict = useCallback(() => {
    selectedCodeRef.current = null
    setSelectedCode(null)
    setSelectedDetail(null)
    setDetailLoading(false)
    setDetailEnhancing(false)
    mapRef.current?.clearSelection(true)
  }, [])

  const resetMapView = useCallback(() => {
    selectedCodeRef.current = null
    setSelectedCode(null)
    setSelectedDetail(null)
    setDetailLoading(false)
    setDetailEnhancing(false)
    mapRef.current?.resetView(true)
  }, [])

  const handleVisualModeChange = useCallback((mode: VisualMode) => {
    setVisualMode(mode)
  }, [])

  // 首次加载后延迟自动飞入
  useEffect(() => {
    if (!globeReady || !mapReady || view !== 'globe') return
    if (autoEnteredRef.current) return

    const timer = window.setTimeout(() => {
      if (
        viewRef.current === 'globe' &&
        !transitioningRef.current &&
        !autoEnteredRef.current
      ) {
        enterWeifang()
      }
    }, TIMING.autoEnterDelay * 1000)

    return () => window.clearTimeout(timer)
  }, [globeReady, mapReady, view, enterWeifang])

  // Esc 返回潍坊全景
  useEffect(() => {
    if (view !== 'map' || selectedCode === null) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !transitioningRef.current) {
        closeDistrict()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, selectedCode, closeDistrict])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
    }
  }, [])

  const selectedDistrict =
    selectedCode === null
      ? null
      : (DISTRICTS.find((district) => district.adcode === selectedCode) ??
        null)

  const selectedColor = selectedDistrict
    ? emissionColor(
        selectedDistrict.emissions,
        EMISSION_RANGE.min,
        EMISSION_RANGE.max
      ).hex
    : '#22d3ee'

  const legendRange = selectedDistrict
    ? {
        min: Math.min(
          ...selectedDistrict.companies.map((company) => company.emissions)
        ),
        max: Math.max(
          ...selectedDistrict.companies.map((company) => company.emissions)
        ),
      }
    : EMISSION_RANGE

  return (
    <div className='wf-root fixed inset-0 overflow-hidden bg-[#02060f] text-slate-100'>
      <div className='wf-backdrop' />
      <div className='wf-grid-overlay' />

      <div
        ref={globeHostRef}
        className='wf-stage wf-stage--globe'
        aria-hidden={view !== 'globe'}
      />
      <div
        ref={mapHostRef}
        className='wf-stage wf-stage--map'
        style={{ opacity: 0, visibility: 'hidden' }}
        aria-hidden={view !== 'map'}
      />

      <div className='wf-vignette pointer-events-none' />

      <TopBar
        view={view}
        selectedName={selectedDistrict?.name}
        transitioning={transitioning}
        visualMode={visualMode}
        onVisualModeChange={handleVisualModeChange}
        onResetMap={resetMapView}
        onBackToGlobe={backToGlobe}
      />

      {view === 'globe' && !transitioning && (
        <GlobeIntro
          totalDistricts={DISTRICTS.length}
          companyCount={COMPANY_TOTAL}
          canEnter={mapReady}
          loadingMap={!mapReady}
          onEnter={enterWeifang}
        />
      )}

      {view === 'map' && !transitioning && (
        <>
          <MapLegend
            min={legendRange.min}
            max={legendRange.max}
            total={CITY_TOTAL}
            companyCount={COMPANY_TOTAL}
            maxDistrictName={MAX_DISTRICT.name}
            visualMode={visualMode}
            selectedName={selectedDistrict?.name}
          />
          {!selectedDistrict && <MapHint />}
          {selectedDistrict && (
            <DistrictHud
              district={selectedDistrict}
              color={selectedColor}
              cityTotal={CITY_TOTAL}
              visualMode={visualMode}
              detail={selectedDetail}
              loading={detailLoading}
              enhancing={detailEnhancing}
              onClose={closeDistrict}
              onReset={resetMapView}
            />
          )}
        </>
      )}

      <LoadingOverlay
        visible={!globeReady || error !== null}
        error={error}
      />
    </div>
  )
}
