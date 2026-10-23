import { afterEach, describe, expect, it } from 'vitest'
import axios from 'axios'
import { makeMockServer, type MockServerOptions } from './server'

// Mirage 只拦截 XHR，这里使用 axios（浏览器端默认 XHR 适配器）验证接口行为
const http = axios.create({ baseURL: '/api' })

describe('mock server', () => {
  const servers: { shutdown(): void }[] = []

  function boot(options?: Omit<MockServerOptions, 'environment'>) {
    // test 环境：不执行 seeds、零延迟，由用例自建确定性数据
    const server = makeMockServer({ environment: 'test', ...options })
    servers.push(server)
    return server
  }

  afterEach(() => {
    while (servers.length) {
      servers.pop()?.shutdown()
    }
  })

  it('提供用户列表接口（工厂生成中文数据）', async () => {
    const server = boot()
    server.create('user', { firstName: '三', lastName: '张', role: 'admin' })

    const { data } = await http.get('/users')

    expect(data.total).toBe(1)
    expect(data.data[0]).toMatchObject({ firstName: '三', role: 'admin' })
    expect(typeof data.data[0].username).toBe('string')
  })

  it('支持查询参数过滤与分页', async () => {
    const server = boot()
    server.create('user', { status: 'active', role: 'admin' })
    server.create('user', { status: 'inactive', role: 'admin' })
    server.create('user', { status: 'active', role: 'manager' })

    const filtered = await http.get('/users', { params: { status: 'active' } })
    expect(filtered.data.total).toBe(2)

    const paged = await http.get('/users', {
      params: { page: 1, pageSize: 2 },
    })
    expect(paged.data.total).toBe(3)
    expect(paged.data.data).toHaveLength(2)
    expect(paged.data.page).toBe(1)
    expect(paged.data.pageSize).toBe(2)
  })

  it('支持用户 CRUD', async () => {
    boot()

    const created = await http.post('/users', {
      firstName: '小雨',
      lastName: '王',
      username: 'wang_xiaoyu',
      email: 'wang.xiaoyu@example.com',
      phoneNumber: '13800138000',
      status: 'active',
      role: 'admin',
    })
    expect(created.data.id).toBeTruthy()

    const updated = await http.patch(`/users/${created.data.id}`, {
      status: 'suspended',
    })
    expect(updated.data.status).toBe('suspended')

    await http.delete(`/users/${created.data.id}`)
    const list = await http.get('/users')
    expect(list.data.total).toBe(0)
  })

  it('任务编号按 TASK-XXXX 生成', async () => {
    const server = boot()
    server.create('task', { title: '编写周报' })

    const created = await http.post('/tasks', {
      title: '修复登录问题',
      status: 'todo',
      label: 'bug',
      priority: 'high',
    })

    expect(created.data.id).toMatch(/^TASK-\d{4}$/)

    const list = await http.get('/tasks', { params: { q: '修复登录问题' } })
    expect(list.data.total).toBe(1)
    expect(list.data.data[0].id).toBe(created.data.id)
  })

  it('提供跨模型数据聚合端点', async () => {
    const server = boot()
    server.create('user', { status: 'active' })
    server.create('user', { status: 'active' })
    server.create('user', { status: 'suspended' })
    server.create('task', { status: 'done', priority: 'high' })
    server.create('task', { status: 'todo', priority: 'low' })

    const { data } = await http.get('/dashboard/overview')

    expect(data.users.total).toBe(3)
    expect(data.users.byStatus).toEqual({ active: 2, suspended: 1 })
    expect(data.tasks.total).toBe(2)
    expect(data.tasks.byStatus).toEqual({ done: 1, todo: 1 })
    expect(data.tasks.byPriority).toEqual({ high: 1, low: 1 })
    expect(typeof data.generatedAt).toBe('string')
  })
})
