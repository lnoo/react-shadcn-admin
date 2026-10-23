import { api } from '@/lib/api'
import { userSchema, type User } from './schema'

type UserListResponse = {
  data: unknown[]
  total: number
  page?: number
  pageSize?: number
}

/**
 * 获取用户列表（`GET /api/users`）。
 * 数据来源由后端提供；本地开发/生产 mock 模式下由 Mirage JS 模拟（src/mocks）。
 */
export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<UserListResponse>('/users')
  return data.data.map((item) => userSchema.parse(item))
}
