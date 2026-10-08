/* eslint-disable react-refresh/only-export-components */
import { type QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'
import '@/styles/index.css'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/images/favicon.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/images/favicon_light.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/images/favicon.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/images/favicon_light.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Manrope:wght@200..800&display=swap',
      },
    ],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Shadcn Admin' },
      { name: 'title', content: 'Shadcn Admin' },
      {
        name: 'description',
        content: 'Admin Dashboard UI built with Shadcn and TanStack Router.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://shadcn-admin.netlify.app' },
      { property: 'og:title', content: 'Shadcn Admin' },
      {
        property: 'og:description',
        content: 'Admin Dashboard UI built with Shadcn and TanStack Router.',
      },
      {
        property: 'og:image',
        content: 'https://shadcn-admin.netlify.app/images/shadcn-admin.png',
      },
      { property: 'twitter:card', content: 'summary_large_image' },
      {
        property: 'twitter:url',
        content: 'https://shadcn-admin.netlify.app',
      },
      { property: 'twitter:title', content: 'Shadcn Admin' },
      {
        property: 'twitter:description',
        content: 'Admin Dashboard UI built with Shadcn and TanStack Router.',
      },
      {
        property: 'twitter:image',
        content: 'https://shadcn-admin.netlify.app/images/shadcn-admin.png',
      },
      { name: 'theme-color', content: '#fff' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider>
        <FontProvider>
          <NavigationProgress />
          <Outlet />
          <Toaster duration={5000} />
          {import.meta.env.VITE_DEBUG && (
            <>
              <ReactQueryDevtools buttonPosition='bottom-left' />
              <TanStackRouterDevtools position='bottom-right' />
            </>
          )}
        </FontProvider>
      </ThemeProvider>
    </>
  )
}
