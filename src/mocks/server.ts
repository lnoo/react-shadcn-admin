import {
  createServer,
  IdentityManager,
  Model,
  type Registry,
  type Server,
} from 'miragejs'
import { taskFactory, userFactory } from './factories'
import { registerRoutes } from './routes'

const MOCK_USER_COUNT = 500
const MOCK_TASK_COUNT = 100

/** 任务主键生成器：TASK-XXXX 自增编号（与任务列表展示约定一致） */
class TaskIdentityManager extends IdentityManager {
  private sequence = 2000

  override fetch(): string {
    return `TASK-${this.sequence++}`
  }
}

const AppModels = {
  // 模型字段类型由对应 Factory 提供（见 src/mocks/factories.ts）
  user: Model.extend({}),
  task: Model.extend({}),
}

const AppFactories = {
  user: userFactory,
  task: taskFactory,
}

type AppModels = typeof AppModels
type AppFactories = typeof AppFactories

type AppRegistry = Registry<AppModels, AppFactories>
export type MockServer = Server<AppRegistry>

export type MockServerOptions = {
  /**
   * Mirage 运行环境：
   * - `development`（默认）：执行 seeds，输出请求日志
   * - `test`：不执行 seeds、零延迟，由测试用例自建数据
   */
  environment?: 'development' | 'test'
  /** 模拟接口延迟（毫秒）；`test` 环境强制为 0 */
  timing?: number
}

/**
 * 创建 Mirage mock 服务器。
 *
 * - 拦截 `/api/**` 的 XHR 请求（前端统一通过 axios 访问，见 `@/lib/api`）。
 * - 数据保存在内存中，页面刷新后重置；生产构建同样可用（纯前端）。
 * - 命名空间之外的请求（静态资源、HMR 等）直接放行，不影响应用其余部分。
 */
export function makeMockServer(options: MockServerOptions = {}): MockServer {
  const { environment = 'development' } = options
  const timing = environment === 'test' ? 0 : (options.timing ?? 250)

  return createServer<AppModels, AppFactories>({
    environment,
    timing,
    logging: environment === 'development',
    namespace: '/api',
    models: AppModels,
    factories: AppFactories,
    identityManagers: { task: TaskIdentityManager },
    seeds(server) {
      server.createList('user', MOCK_USER_COUNT)
      server.createList('task', MOCK_TASK_COUNT)
    },
    routes() {
      // 未匹配的请求放行到真实网络（注意：需在设置 namespace 之前调用）
      this.passthrough()
      this.namespace = '/api'
      registerRoutes(this)
    },
  })
}
