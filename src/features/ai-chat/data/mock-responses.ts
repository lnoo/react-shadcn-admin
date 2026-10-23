export const mockResponses = [
  `你好！我是这个 starter 里的 AI 助手示例。

目前我运行在**本地 mock** 上 —— 回复由本地预置的流逐字返回，不会真的调用任何模型。等你接上自己的后端，只要改一个文件就能换成真实接口。

## 我能做什么

- 演示流式输出、Markdown 渲染、代码块
- 演示停止生成、重新生成、复制消息
- 同一个会话同时存在于整页和右下角的悬浮窗里

| 能力 | 状态 | 备注 |
| --- | --- | --- |
| 流式回复 | 可用 | 本地模拟 |
| Markdown | 可用 | GFM 扩展 |
| 代码高亮 | 暂缺 | 需要时接入 |
| 真实模型 | 待接入 | 换 transport 即可 |

## 例子

\`\`\`ts
// 接上真实后端只需要改这一个文件
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

需要我展开讲某一段吗？`,
] as const

export function pickMockReply(messages: { role: string; parts: unknown }[]) {
  const userMessageCount = messages.filter((m) => m.role === 'user').length
  return mockResponses[(userMessageCount - 1 + mockResponses.length) % mockResponses.length]
}
