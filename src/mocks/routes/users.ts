import { Response } from 'miragejs'
import type { MockServer } from '../server'

/**
 * 用户接口路由（/api/users）。
 *
 * - `GET /users`：全量或分页列表，支持 `q`（用户名/邮箱）、`status`、`role` 过滤
 * - `GET /users/:id`：详情
 * - `POST /users`：创建
 * - `PATCH /users/:id`：更新
 * - `DELETE /users/:id`：删除
 */

type QueryValue = string | string[] | undefined

function toArray(value: QueryValue): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function registerUserRoutes(server: MockServer) {
  server.get('/users', (schema, request) => {
    const { q, status, role, page, pageSize } = request.queryParams as Record<
      string,
      QueryValue
    >

    let models = schema.all('user').models

    const statuses = toArray(status)
    if (statuses.length) {
      models = models.filter((model) => statuses.includes(model.status))
    }

    const roles = toArray(role)
    if (roles.length) {
      models = models.filter((model) => roles.includes(model.role))
    }

    const keyword = toArray(q)[0]?.toLowerCase()
    if (keyword) {
      models = models.filter(
        (model) =>
          model.username.toLowerCase().includes(keyword) ||
          model.email.toLowerCase().includes(keyword)
      )
    }

    const total = models.length
    const data = models.map((model) => model.attrs)

    // 未带分页参数时返回全量列表
    if (page === undefined && pageSize === undefined) {
      return { data, total }
    }

    const currentPage = Math.max(1, Number(page ?? 1))
    const size = Math.min(100, Math.max(1, Number(pageSize ?? 20)))
    const start = (currentPage - 1) * size

    return {
      data: data.slice(start, start + size),
      total,
      page: currentPage,
      pageSize: size,
    }
  })

  server.get('/users/:id', (schema, request) => {
    const user = schema.find('user', request.params.id)
    if (!user) {
      return new Response(404, {}, { message: '用户不存在' })
    }
    return user.attrs
  })

  server.post('/users', (schema, request) => {
    const attrs = JSON.parse(request.requestBody)
    return schema.create('user', attrs).attrs
  })

  server.patch('/users/:id', (schema, request) => {
    const user = schema.find('user', request.params.id)
    if (!user) {
      return new Response(404, {}, { message: '用户不存在' })
    }
    const { id: _ignored, ...attrs } = JSON.parse(request.requestBody)
    user.update(attrs)
    return user.attrs
  })

  server.del('/users/:id', (schema, request) => {
    const user = schema.find('user', request.params.id)
    if (!user) {
      return new Response(404, {}, { message: '用户不存在' })
    }
    user.destroy()
    return new Response(204)
  })
}
