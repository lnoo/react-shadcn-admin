import { faker, fakerZH_CN } from '@faker-js/faker'
import { Factory } from 'miragejs'
import { userRoleSchema, userStatusSchema } from '@/features/users/data/schema'
import { labels, priorities, statuses } from '@/features/tasks/data/data'
import type { TaskData, UserData } from './types'

/**
 * Mirage 数据工厂（使用 Faker 生成中文演示数据）。
 *
 * 字段与对应 feature 的 zod schema 保持一致（见 src/mocks/types.ts）。
 */

export const userFactory = Factory.extend<Omit<UserData, 'id'>>({
  firstName: () => fakerZH_CN.person.firstName(),
  lastName: () => fakerZH_CN.person.lastName(),
  // 用户名/邮箱保持 ASCII，便于筛选与登录场景演示
  username: () => faker.internet.username().toLocaleLowerCase(),
  email: () => faker.internet.email().toLocaleLowerCase(),
  // 中国大陆手机号格式（1 开头共 11 位）
  phoneNumber: () => `1${fakerZH_CN.string.numeric(10)}`,
  status: () => faker.helpers.arrayElement(userStatusSchema.options).value,
  role: () => faker.helpers.arrayElement(userRoleSchema.options).value,
  createdAt: () => fakerZH_CN.date.past({ years: 2 }),
  updatedAt: () => fakerZH_CN.date.recent({ days: 30 }),
})

// fakerZH_CN 的 lorem 为拉丁回退，这里用中文词库组合自然的任务标题
const taskTitleVerbs = ['修复', '优化', '重构', '新增', '排查', '验收', '迁移', '上线']
const taskTitleSubjects = [
  '登录页',
  '用户列表',
  '数据导出',
  '权限校验',
  '通知中心',
  '搜索联想',
  '文件上传',
  '移动端适配',
  '鉴权流程',
  '性能监控',
]

export const taskFactory = Factory.extend<Omit<TaskData, 'id'>>({
  title: () =>
    `${fakerZH_CN.helpers.arrayElement(taskTitleVerbs)}${fakerZH_CN.helpers.arrayElement(taskTitleSubjects)}`,
  status: () => faker.helpers.arrayElement(statuses).value,
  label: () => faker.helpers.arrayElement(labels).value,
  priority: () => faker.helpers.arrayElement(priorities).value,
  createdAt: () => fakerZH_CN.date.past({ years: 1 }),
  updatedAt: () => fakerZH_CN.date.recent({ days: 14 }),
})
