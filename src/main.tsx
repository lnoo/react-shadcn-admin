import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import { isMockEnabled } from './mocks/config'

async function bootstrap() {
  // Mock 模式必须在应用发起第一个 /api 请求前完成 XHR 拦截注册，
  // 因此在渲染前同步启动（miragejs 通过动态 import 单独分包、按需加载）。
  if (isMockEnabled()) {
    const { startMockServer } = await import('./mocks')
    startMockServer()
  }

  const root = document.getElementById('root')

  if (!root) throw new Error('Root element not found')

  const router = getRouter()

  createRoot(root).render(<RouterProvider router={router} />)
}

void bootstrap()
