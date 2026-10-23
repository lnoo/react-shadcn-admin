import { api } from '@/lib/api'
import { taskSchema, type Task } from './schema'

type TaskListResponse = {
  data: unknown[]
  total: number
  page?: number
  pageSize?: number
}

/**
 * 获取任务列表（`GET /api/tasks`）。
 * 数据来源由后端提供；本地开发/生产 mock 模式下由 Mirage JS 模拟（src/mocks）。
 */
export async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<TaskListResponse>('/tasks')
  return data.data.map((item) => taskSchema.parse(item))
}
