import { Response } from 'miragejs'
import type { MockServer } from '../server'

/**
 * 任务接口路由（/api/tasks）。
 *
 * - `GET /tasks`：全量或分页列表，支持 `q`（任务编号/标题）、`status`、`priority` 过滤
 * - `GET /tasks/:id`：详情
 * - `POST /tasks`：创建（未指定 id 时按 TASK-XXXX 序号生成）
 * - `PATCH /tasks/:id`：更新
 * - `DELETE /tasks/:id`：删除
 */

type QueryValue = string | string[] | undefined

function toArray(value: QueryValue): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function registerTaskRoutes(server: MockServer) {
  server.get('/tasks', (schema, request) => {
    const { q, status, priority, page, pageSize } =
      request.queryParams as Record<string, QueryValue>

    let models = schema.all('task').models

    const statuses = toArray(status)
    if (statuses.length) {
      models = models.filter((model) => statuses.includes(model.status))
    }

    const priorities = toArray(priority)
    if (priorities.length) {
      models = models.filter((model) => priorities.includes(model.priority))
    }

    const keyword = toArray(q)[0]?.toLowerCase()
    if (keyword) {
      models = models.filter(
        (model) =>
          String(model.id).toLowerCase().includes(keyword) ||
          model.title.toLowerCase().includes(keyword)
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

  server.get('/tasks/:id', (schema, request) => {
    const task = schema.find('task', request.params.id)
    if (!task) {
      return new Response(404, {}, { message: '任务不存在' })
    }
    return task.attrs
  })

  server.post('/tasks', (schema, request) => {
    const attrs = JSON.parse(request.requestBody)
    return schema.create('task', attrs).attrs
  })

  server.patch('/tasks/:id', (schema, request) => {
    const task = schema.find('task', request.params.id)
    if (!task) {
      return new Response(404, {}, { message: '任务不存在' })
    }
    const { id: _ignored, ...attrs } = JSON.parse(request.requestBody)
    task.update(attrs)
    return task.attrs
  })

  server.del('/tasks/:id', (schema, request) => {
    const task = schema.find('task', request.params.id)
    if (!task) {
      return new Response(404, {}, { message: '任务不存在' })
    }
    task.destroy()
    return new Response(204)
  })
}
