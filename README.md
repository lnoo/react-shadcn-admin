# Shadcn Admin Dashboard

Client-rendered admin SPA crafted with Shadcn, Vite, and TanStack Router. No SSR or server runtime is required. Built with responsiveness and accessibility in mind.

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**App Architecture:** React SPA (client rendering only)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Mock Data:** [Mirage JS](https://miragejs.com) + [Faker JS](https://fakerjs.dev)

## Run Locally

Clone the project

```bash
  git clone https://github.com/lnoo/react-shadcn-admin.git
```

Go to the project directory

```bash
  cd react-shadcn-admin
```

Install dependencies

```bash
  bun install
```

Start the server

```bash
  bun run dev
```

## Mock 数据

项目内置**纯前端 mock 系统**（`src/mocks/`，基于 [Mirage JS](https://miragejs.com) + [Faker JS](https://fakerjs.dev)）：拦截 `/api/**` 请求并在浏览器内返回数据，无需部署任何后端服务，生产构建同样可用。

- **开发环境**：默认开启，设置 `VITE_ENABLE_MOCK=false` 可关闭。
- **生产构建**：默认关闭，构建前设置 `VITE_ENABLE_MOCK=true` 即可启用“生产环境 mock”。

```bash
# 生产环境启用 mock
VITE_ENABLE_MOCK=true bun run build
```

内置接口（详见 `src/mocks/routes/`）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/users` | 用户列表，支持 `q`/`status`/`role` 过滤与 `page`/`pageSize` 分页 |
| `GET/POST` | `/api/users/:id` | 用户详情 / 创建 |
| `PATCH/DELETE` | `/api/users/:id` | 用户更新 / 删除 |
| `GET` | `/api/tasks` | 任务列表，支持 `q`/`status`/`priority` 过滤与分页 |
| `GET/POST/PATCH/DELETE` | `/api/tasks/:id` | 任务详情 / 创建 / 更新 / 删除 |
| `GET` | `/api/dashboard/overview` | 跨模型数据聚合（用户/任务状态与优先级统计） |

前端统一通过 `src/lib/api`（axios 实例，`baseURL: /api`）+ TanStack Query 访问接口；
新增 mock 数据的最佳实践见 `AGENTS.md` 的「Mock Data Rules」。

## Static Deployment

Run `bun run build` and publish `dist/`. No Node.js server is required in production.
Use `bun run preview` to check the production build locally.
Configure the static host to rewrite application routes to `/index.html` so nested
routes and authentication callbacks work on direct navigation and refresh.

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
