# AGENTS.md

## Project

This repository is a reusable **Vite + React + TypeScript B2B SPA starter/template**, not a product-specific application.

It provides a production-ready foundation for building client-rendered B2B applications.

### Tech Stack

* Vite + React + TypeScript
* Bun
* Client-side rendering only; no SSR
* shadcn/ui + Radix UI
* TanStack Router
* TanStack Query
* Tailwind CSS
* Vitest
* Playwright

### Project Structure

* `src/routes/` - TanStack Router routes
* `src/features/` - feature modules
* `src/components/ui/` - shared UI primitives
* `src/components/layout/` - shared layout components
* `src/lib/` - shared helpers
* `src/stores/` - app stores
* `src/mocks/` - frontend mock system (Mirage JS + Faker JS)

## Starter / Template Principles

This repository is intended to be **copied, extended, and adapted for different B2B applications**.

* Keep the starter **generic and reusable**.
* Prefer broadly useful B2B application capabilities over product-specific features.
* Avoid introducing business-specific concepts, terminology, APIs, workflows, or assumptions into the core template unless explicitly requested.
* Treat shared infrastructure, layouts, UI primitives, routing conventions, stores, and utilities as part of the starter foundation.
* Keep example/demo features clearly separated from reusable infrastructure.
* Avoid hard-coding product-specific names, branding, business rules, backend endpoints, or customer-specific assumptions.
* Prefer configurable and extensible implementations when a feature requires application-specific behavior.
* Do not add dependencies solely to solve a narrow example or one-off requirement unless explicitly requested.
* Preserve a clean baseline so a newly created project does not require removing unnecessary product-specific code.
* When adding a feature, consider whether it belongs in the reusable starter or should remain application-specific.
* Preserve existing starter capabilities unless intentionally removing or replacing them.
* **Chinese UI text is the default** - this is a Chinese-language project; UI components should display Chinese by default. Exceptions: professional terminology, fixed expressions, technical terms, and proper nouns may remain in English.

## Code Rules

* Keep changes small, focused, and reviewable; match existing style and project structure.
* Prefer existing libraries, components, utilities, and helpers; avoid new dependencies unless the change requires one.
* Keep routes aligned with TanStack Router conventions.
* Build UI using existing shadcn/ui, Radix UI, Lucide, and Tailwind CSS patterns.
* Keep shared components generic and configurable; avoid embedding product-specific business logic into shared infrastructure.
* Follow the existing project architecture instead of introducing alternative patterns without a clear reason.
* Do not edit generated files manually unless that is the repository's normal workflow.
* Do not mix runtime objects with persisted project/data formats unless explicitly designed.
* Avoid unnecessary abstractions for small or isolated changes.
* Preserve unrelated dirty work.
* Do not rewrite history, reset, clean, or discard changes unless explicitly requested.

## Mock Data Rules

本项目使用 **Mirage JS + Faker JS**（`src/mocks/`）作为纯前端 mock 系统：拦截 `/api/**` 的 XHR 请求，无需部署任何后端服务。需要模拟数据/接口时，**优先使用这套 mock 系统**，并遵循以下最佳实践：

* 新增 mock 数据时，在 `src/mocks/factories.ts` 添加/扩展 Factory，在 `src/mocks/routes/` 添加路由处理器；**不要**再新建静态数组 mock 文件或绕过 mock 系统硬编码数据。
* Factory 使用 `fakerZH_CN` 生成中文演示数据；字段必须与对应 feature 的 zod schema 一致（用户名/邮箱等登录标识可用 ASCII）。
* Mirage 路由支持路径参数、查询参数与 REST 动词（`GET/POST/PATCH/DELETE`），参考 `src/mocks/routes/users.ts`；跨模型统计请实现聚合路由（参考 `src/mocks/routes/dashboard.ts`），不要在前端拼接多次请求做聚合。
* 前端通过 `@/lib/api`（axios 实例，`baseURL: /api`）+ TanStack Query 访问接口；组件不得直接 import mock 数据。Mirage 只拦截 XHR，原生 `fetch` 不会被拦截。
* Mock 开关见 `src/mocks/config.ts`：开发环境默认开启（`VITE_ENABLE_MOCK=false` 可关闭）；生产构建默认关闭，设为 `VITE_ENABLE_MOCK=true` 启用"生产环境 mock"。
* mock 代码必须在接口请求发起前启动（见 `src/main.tsx` 的 bootstrap），且保持独立分包（不要在非 mock 模块中静态 import `src/mocks/server.ts`）。

## Verification

Run the narrowest checks appropriate for the change.

For code changes, use:

```bash
bun run lint
bun run build
bun run test
```

For user-facing UI changes:

1. Run `bun run dev`.
2. Manually verify the affected flow.
3. Check relevant empty, loading, success, and error states.
4. Verify both desktop and mobile widths when applicable.

For SPA routing changes:

1. Run `bun run build`.
2. Run `bun run preview`.
3. Verify direct navigation to affected routes.
4. Verify the expected 404/not-found behavior.

For starter/template changes, additionally verify that:

* The starter still builds and runs without product-specific configuration.
* No unintended product-specific branding or business terminology was introduced.
* Shared infrastructure remains reusable.
* Existing starter/demo functionality remains functional unless intentionally changed.
* New dependencies are justified by the starter's long-term needs.

If a verification step cannot be run, report:

* Which command/check could not be run.
* Why it could not be run.
* The remaining risk.

Always record the commands/checks that were actually run and any remaining risks.

## Git Hygiene

* Use a branch per logical change when practical, for example `feature/project-skeleton`.
* Preserve unrelated dirty work.
* Stage only files that belong to the change.
* Do not rewrite history.
* Do not run `git reset`, `git clean`, or otherwise discard existing changes unless explicitly requested.
* Do not modify unrelated files merely to make the current change easier.
