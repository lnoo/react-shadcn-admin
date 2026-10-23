import axios from 'axios'

/**
 * 全局 HTTP 客户端。
 *
 * - 统一 `baseURL: /api`，与 mock 系统（src/mocks，Mirage JS 拦截 XHR）约定一致。
 * - 业务代码一律通过本实例访问接口，便于统一超时、错误处理与切换真实后端。
 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})
