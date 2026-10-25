import { createFileRoute } from '@tanstack/react-router'
import { default as weifangMap } from '@/features/weifangMap/index'

export const Route = createFileRoute('/(public)/weifangMap')({
  head: () => ({
    meta: [{ title: '潍坊市碳排放空间监测' }],
  }),
  component: weifangMap,
})
