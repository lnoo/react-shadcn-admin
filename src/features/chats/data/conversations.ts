import { fakerZH_CN } from '@faker-js/faker'

/** 当前登录用户在会话中的发送者标识（仅作数据标记，不直接展示） */
export const SELF_SENDER = '__self__'

/** 中文职位/消息词库（fakerZH_CN 的 jobTitle/lorem 为英文或拉丁回退，不适合中文演示） */
const jobTitles = [
  '产品经理',
  '前端工程师',
  '后端工程师',
  'UI 设计师',
  '测试工程师',
  '项目经理',
  '运营专员',
  '数据分析师',
]

const chatSentences = [
  '在吗？帮你看了下这个方案，整体没问题。',
  '今天下午三点对一下需求，记得带上原型稿。',
  '这个 bug 我这边复现了，应该是请求超时导致的。',
  '周报我已经发你了，麻烦今晚之前确认一下。',
  '新版本的视觉稿出来了，你先看看有没有问题。',
  '接口文档更新了，字段名有变动，注意同步。',
  '好的，这个需求我明天上午给你排期。',
  '测试环境已经部署好了，你可以直接验收。',
  '刚才那个问题解决了，是缓存没刷新。',
  '用户反馈的页面加载慢，我压测了下接口，先优化列表查询。',
  '下午的评审会议改到明天了，注意看日历邀请。',
  '这个月的数据报表整理好了，稍后发到群里。',
  '登录态过期的问题已经修复，麻烦再试一次。',
  '设计稿里这个图标缺失了，我先用了占位图。',
  '下周发版前记得把灰度配置加上。',
  '辛苦了，这期需求按时上线，晚上加个鸡腿。',
]

// Set a fixed seed for consistent data generation
fakerZH_CN.seed(987654321)

export const conversations = Array.from({ length: 10 }, () => {
  const fullName = fakerZH_CN.person.fullName()
  const username = fakerZH_CN.internet.username({ firstName: fullName })
  const title = fakerZH_CN.helpers.arrayElement(jobTitles)
  const gender = fakerZH_CN.helpers.arrayElement(['men', 'women'])
  const portraitId = fakerZH_CN.number.int({ min: 1, max: 99 })
  const profile = `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`

  const messageCount = fakerZH_CN.number.int({ min: 2, max: 15 })
  // Messages are stored newest-first (reverse chronological), matching the
  // original fixture so `messages[0]` is always the latest message.
  const messages = Array.from({ length: messageCount }, (_, i) => {
    const sender = i % 2 === 0 ? SELF_SENDER : fullName
    return {
      sender,
      message: fakerZH_CN.helpers.arrayElement(chatSentences),
      timestamp: fakerZH_CN.date.past({ years: 1 }),
    }
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    id: `conv${fakerZH_CN.number.int({ min: 1, max: 999 })}`,
    profile,
    username,
    fullName,
    title,
    messages,
  }
})
