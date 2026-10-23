import type { Server } from 'miragejs'
import { registerDashboardRoutes } from './dashboard'
import { registerTaskRoutes } from './tasks'
import { registerUserRoutes } from './users'

/** 注册全部 mock 路由（位于 `/api` 命名空间下，见 server.ts） */
export function registerRoutes(server: Server) {
  registerUserRoutes(server)
  registerTaskRoutes(server)
  registerDashboardRoutes(server)
}
