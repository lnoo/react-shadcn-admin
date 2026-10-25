const DEG2RAD = Math.PI / 180

export interface GlobeOrientation {
  /** 球体绕自身的 Y 轴旋转 */
  spin: number
  /** 球体南北向倾角（弧度） */
  tilt: number
}

/**
 * 计算把指定经纬度转到镜头正前方时，球体自转/倾斜需要达到的角度。
 * Three.js SphereGeometry 的 UV 起点位于 180°W，因此需要额外偏移。
 */
export function globeOrientation(lon: number, lat: number): GlobeOrientation {
  const u = (lon + 180) / 360
  const phi = u * Math.PI * 2
  const x = -Math.cos(phi)
  const z = Math.sin(phi)
  return {
    spin: -Math.atan2(x, z),
    tilt: lat * DEG2RAD,
  }
}

/** 返回与 current 距离最近的等价目标角，避免飞入时绕远路 */
export function nearestAngle(current: number, target: number): number {
  const twoPi = Math.PI * 2
  const delta =
    ((((target - current + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI
  return current + delta
}
