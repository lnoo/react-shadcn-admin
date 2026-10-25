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
  texture.needsUpdate = true
  return texture
}
