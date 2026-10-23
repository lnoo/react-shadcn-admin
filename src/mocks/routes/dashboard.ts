import type { MockServer } from '../server'

/**
 * 数据聚合接口（/api/dashboard/overview）。
 *
 * 基于当前 mock 数据库实时聚合跨模型统计（用户按状态、任务按状态/优先级），
 * 供仪表盘等页面一次请求获取汇总数据。
 */
export function registerDashboardRoutes(server: MockServer) {
  server.get('/dashboard/overview', (schema) => {
    const countBy = (
      items: Record<string, unknown>[],
      key: string
    ): Record<string, number> =>
      items.reduce<Record<string, number>>((acc, item) => {
        const value = String(item[key] ?? 'unknown')
        acc[value] = (acc[value] ?? 0) + 1
        return acc
      }, {})

    const users = schema.all('user').models
    const tasks = schema.all('task').models

    return {
      users: {
        total: users.length,
        byStatus: countBy(users, 'status'),
      },
      tasks: {
        total: tasks.length,
        byStatus: countBy(tasks, 'status'),
        byPriority: countBy(tasks, 'priority'),
      },
      generatedAt: new Date().toISOString(),
    }
  })
}
