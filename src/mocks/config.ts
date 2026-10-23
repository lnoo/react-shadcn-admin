/**
 * Mock 系统开关。
 *
 * - 开发环境（dev server）：默认开启，设置 `VITE_ENABLE_MOCK=false` 关闭。
 * - 生产构建：默认关闭，构建时设置 `VITE_ENABLE_MOCK=true` 开启，
 *   以支持“生产环境 mock”（纯前端运行，无需任何后端服务）。
 *
 * 注意：本模块必须保持零依赖，避免把 miragejs 打进主包
 * （miragejs 通过 main.tsx 的动态 import 单独分包，按需加载）。
 */
export function isMockEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_MOCK

  if (import.meta.env.DEV) return flag !== 'false'

  return flag === 'true'
}
