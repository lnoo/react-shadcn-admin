import { createFileRoute } from '@tanstack/react-router'
import { default as weifangMap } from '@/features/weifangMap/index'

export const Route = createFileRoute('/(public)/weifangMap')({
  component: weifangMap,
})
