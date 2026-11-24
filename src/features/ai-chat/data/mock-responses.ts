export const mockResponses = [
  `你好！我是这个 starter 里的 AI 助手示例。

目前我运行在**本地 mock** 上 —— 回复由本地预置的流逐字返回，不会真的调用任何模型。等你接上自己的后端，只要改一个文件就能换成真实接口。

## 我能做什么

- 演示流式输出、Markdown 渲染、代码块高亮
- 演示停止生成、重新生成、复制消息
- 同一个会话同时存在于整页和右下角的悬浮窗里

| 能力 | 状态 | 备注 |
| --- | --- | --- |
| 流式回复 | 可用 | 本地模拟 |
| Markdown | 可用 | Streamdown + GFM |
| 代码高亮 | 可用 | shiki，按需加载语言 |
| 真实模型 | 待接入 | 换 transport 即可 |

> 提示：Markdown 由 Streamdown 渲染，围栏代码交给 shadcn 的 Code Block，带语法高亮和复制按钮。

## 快速开始

1. 安装依赖并启动：

\`\`\`bash
bun install
bun run dev
\`\`\`

2. 接真实模型时只改 \`src/features/ai-chat/data/chat-transport.ts\`：

\`\`\`ts
import { DefaultChatTransport, type ChatTransport, type UIMessage } from 'ai'

export function createChatTransport(): ChatTransport<UIMessage> {
  return new DefaultChatTransport<UIMessage>({ api: '/api/chat' })
}
\`\`\`

试试问我「流式输出是怎么实现的」，或者随便聊点别的。`,
  `流式输出可以拆成三步来看：

1. 用户点发送，界面立刻插入一条空的助手消息，状态变成 \`submitted\`。
2. 后端把内容切成小片（SSE），浏览器逐片读、逐片追加到那条消息上。
3. 读完之后状态回到 \`ready\`，整条消息标记为完成。

## 关键点

**为什么不在读完之后一次性渲染？** 因为那样用户要盯着转圈等全部生成完，体验很差。逐字出现能让等待变成可读的进度。

**怎么停下来？** 用 \`AbortController\`。中止后已经收到的片段保留，缺的部分不再补 —— 所以「停止」之后消息是完整的前半段，而不是空的。

\`\`\`ts
const controller = new AbortController()
const res = await fetch('/api/chat', {
  method: 'POST',
  signal: controller.signal,
  body: JSON.stringify({ messages }),
})

const reader = res.body!.getReader()
const decoder = new TextDecoder()
let text = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  text += decoder.decode(value, { stream: true })
  render(text) // 每一小片都更新一次界面
}
\`\`\`

> 滚动行为由 Message Scroller 负责：你往下读时它不会抢走位置，点「跳到最新消息」才回到实时边缘。

需要我展开讲某一段吗？`,
  `接入自己的后端只需要替换 transport，UI 层完全不用动。几种常见选择：

| 场景 | 写法 | 说明 |
| --- | --- | --- |
| 本地演示 | \`createMockChatTransport()\` | 无需网络，逐字模拟 |
| Vercel AI SDK | \`new DefaultChatTransport({ api })\` | 兼容 \`toUIMessageStreamResponse()\` |
| 自定义 SSE | 实现 \`ChatTransport\` | 完全掌控协议 |

## 一个最小接口

后端返回 AI SDK 的 UI Message Stream，前端就能直接消费：

\`\`\`ts
import { streamText, convertToModelMessages } from 'ai'

export async function POST(request: Request) {
  const { messages } = await request.json()
  const result = streamText({
    model: 'your-model',
    messages: await convertToModelMessages(messages),
  })
  return result.toUIMessageStreamResponse()
}
\`\`\`

## 请求体长什么样

\`\`\`json
{
  "id": "chat-1",
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "text": "你好" }] }
  ],
  "trigger": "submit-message"
}
\`\`\`

调试时可以直接打一发请求：

\`\`\`bash
curl -N -X POST http://localhost:3000/api/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"你好"}]}]}'
\`\`\`

注意这是个纯前端 starter：真实后端需要你自己提供，或者用 \`VITE_ENABLE_MOCK=true\` 在生产构建里继续用 mock。`,
  `这个 starter 的样式基于 **Tailwind CSS v4 + shadcn/ui（base-vega）**，主题变量集中在 \`src/styles/index.css\`：

\`\`\`css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
}
\`\`\`

## 改主题的几种姿势

1. **换预设**：\`src/styles/presets/\` 下有多套预设，直接切换 import。
2. **调变量**：改 \`:root\` / \`.dark\` 下的 \`--primary\` 等 CSS 变量。
3. **换风格**：在 \`components.json\` 里改 \`style\`，然后用 shadcn CLI 重新生成组件。

> 不要用内联颜色硬编码。所有颜色走 \`bg-background\` / \`text-muted-foreground\` 这类语义类，暗色模式才能自动生效。

响应式上，页面用 \`sm:\` / \`md:\` 断点；聊天区在窄屏会收起侧栏，输入区始终贴底。悬浮窗在 \`/ai-chat\` 整页会自动隐藏，避免和整页输入框重叠。`,
  `本项目的前端 mock 在 \`src/mocks/\`，用 **Mirage JS + Faker JS**，拦截 \`/api/**\` 的 XHR，不需要任何后端：

\`\`\`text
src/mocks/
├── config.ts          # 开关：开发默认开，生产默认关
├── server.ts          # Mirage server 启动入口
├── factories.ts       # Faker 数据工厂
└── routes/
    ├── users.ts       # 用户 CRUD
    └── dashboard.ts   # 跨模型聚合统计
\`\`\`

## 加一个接口的三步

- [x] 在 \`factories.ts\` 里加 Factory，用 \`fakerZH_CN\` 生成中文数据
- [x] 在 \`routes/\` 加路由处理器，支持路径参数、查询参数和 REST 动词
- [ ] 前端通过 \`@/lib/api\` + TanStack Query 调用

跨模型统计请实现聚合路由，不要在前端拉多次请求再自己拼。

\`\`\`ts
export function dashboardRoutes() {
  return {
    summary: () => ({
      users: 128,
      tasks: 42,
      completionRate: 0.86,
    }),
  }
}
\`\`\`

> 注意 Mirage 只拦截 XHR，原生 \`fetch\` 不会被拦截。mock 代码必须在请求发起前启动（见 \`src/main.tsx\`）。`,
  `验证一条改动通常跑这三步：

\`\`\`bash
bun run lint    # oxlint
bun run build   # vite build + tsc -b
bun run test    # vitest + Playwright 无头浏览器
\`\`\`

UI 改动还要手动过一遍空状态、加载态、成功态和错误态，桌面和移动宽度各看一次。

最近这次把聊天 UI 换成了 shadcn AI Elements，差异大致是：

\`\`\`diff
- <ScrollArea> + 手动 scrollIntoView
+ <MessageScrollerProvider autoScroll> + <MessageScrollerItem>

- 手写气泡 div + bg-muted
+ <Message> + <Bubble> + <BubbleContent>

- react-markdown
+ <Streamdown> + shiki 高亮的 <CodeBlock>
\`\`\`

## 发布前检查清单

- [ ] \`bun run build\` 通过，没有类型错误
- [ ] 所有测试通过，截图已更新
- [ ] 没有引入产品专属的品牌名或业务术语
- [ ] 新依赖确实是 starter 长期需要的

有问题就问我，比如「主题怎么改」或者「mock 怎么加接口」。`,
  `附件是通过 \`sendMessage({ text, files })\` 一起发出去的：

\`\`\`ts
const transfer = new DataTransfer()
files.forEach((file) => transfer.items.add(file))
await sendMessage({ text, files: transfer.files })
\`\`\`

AI SDK 会把每个文件转成一条 \`type: 'file'\` 的消息 part，带上 \`mediaType\`、\`filename\` 和 \`url\`（Data URL）。界面这边用 shadcn 的 Attachment 展示，图片直接预览，其他文件显示图标和大小。

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 选择多个文件 | 可用 | 输入框左侧回形针 |
| 发送前移除 | 可用 | 附件卡片右上角 |
| 图片预览 | 可用 | 内嵌 Data URL |
| 真实上传 | 待接入 | 当前只是本地 mock |

> 当前 mock 只读取附件的元信息，不会把文件内容发给任何模型。接真实后端时，把 \`files\` 透传给自己的接口即可。

试试发一张图片看看气泡里的预览效果。`,
] as const

export function pickMockReply(messages: { role: string; parts: unknown }[]) {
  const userMessageCount = messages.filter((m) => m.role === 'user').length
  return mockResponses[(userMessageCount - 1 + mockResponses.length) % mockResponses.length]
}
