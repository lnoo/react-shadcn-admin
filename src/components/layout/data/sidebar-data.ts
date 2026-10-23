import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: '企业版',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: '创业版',
    },
  ],
  navGroups: [
    {
      title: '常规',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '任务',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: '应用',
          url: '/apps',
          icon: Package,
        },
        {
          title: '聊天',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'AI 聊天',
          url: '/ai-chat',
          icon: Sparkles,
        },
        {
          title: '用户',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: '页面',
      items: [
        {
          title: '认证',
          icon: ShieldCheck,
          items: [
            {
              title: '登录',
              url: '/sign-in',
            },
            {
              title: '登录 (双栏)',
              url: '/sign-in-2',
            },
            {
              title: '注册',
              url: '/sign-up',
            },
            {
              title: '忘记密码',
              url: '/forgot-password',
            },
            {
              title: 'OTP 验证',
              url: '/otp',
            },
          ],
        },
        {
          title: '错误',
          icon: Bug,
          items: [
            {
              title: '未授权',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: '禁止访问',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: '未找到',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: '服务器内部错误',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: '维护错误',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          title: '设置',
          icon: Settings,
          items: [
            {
              title: '个人资料',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: '账户',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: '通知',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: '显示',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
