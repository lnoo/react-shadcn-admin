import { makeMockServer, type MockServer, type MockServerOptions } from './server'

let mockServer: MockServer | undefined

/**
 * 启动前端 mock 服务器（幂等）。
 *
 * 必须在应用发起第一个 `/api` 请求之前调用——main.tsx 在渲染前完成启动。
 */
export function startMockServer(options?: MockServerOptions): MockServer {
  if (mockServer) return mockServer
  mockServer = makeMockServer(options)
  return mockServer
}
