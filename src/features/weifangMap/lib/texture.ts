import * as THREE from 'three'

/** 加载卫星纹理并应用正确的色彩空间与各向异性过滤 */
export async function loadTexture(
  url: string,
  anisotropy = 8
): Promise<THREE.Texture> {
  const texture = await new THREE.TextureLoader().loadAsync(url)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  // 明确使用三线性 mipmap：远景缩小时由低级别 mip 平滑过渡，
  // 避免高分辨率卫星纹理在缩放过程中出现摩尔纹闪烁。
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}
