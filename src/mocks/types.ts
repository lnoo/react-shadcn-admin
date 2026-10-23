import type { z } from 'zod'
import type { userRoleSchema, userStatusSchema } from '@/features/users/data/schema'

/** mock 数据库中的用户模型字段（与 @/features/users/data/schema 保持一致） */
export interface UserData {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  status: z.infer<typeof userStatusSchema>
  role: z.infer<typeof userRoleSchema>
  createdAt: Date
  updatedAt: Date
}

/** mock 数据库中的任务模型字段（与 @/features/tasks/data/schema 保持一致） */
export interface TaskData {
  id: string
  title: string
  status: string
  label: string
  priority: string
  createdAt: Date
  updatedAt: Date
}
