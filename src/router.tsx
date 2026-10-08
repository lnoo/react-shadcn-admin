import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { routeTree } from './routeTree.gen'

function createQueryClient({
  onInternalServerError,
  onSessionExpired,
}: {
  onInternalServerError: () => void
  onSessionExpired: () => void
}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.log({ failureCount, error })

          if (failureCount >= 0 && import.meta.env.DEV) return false
          if (failureCount > 3 && import.meta.env.PROD) return false

          return !(
            error instanceof AxiosError &&
            [401, 403].includes(error.response?.status ?? 0)
          )
        },
        refetchOnWindowFocus: import.meta.env.PROD,
        staleTime: 10 * 1000,
      },
      mutations: {
        onError: (error) => {
          handleServerError(error)

          if (error instanceof AxiosError) {
            if (error.response?.status === 304) {
              toast.error('Content not modified!')
            }
          }
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (error.response?.status === 401) {
            toast.error('Session expired!')
            useAuthStore.getState().auth.reset()
            onSessionExpired()
          }
          if (error.response?.status === 500) {
            toast.error('Internal Server Error!')
            onInternalServerError()
          }
          if (error.response?.status === 403) {
            // router.navigate("/forbidden", { replace: true });
          }
        }
      },
    }),
  })
}

export function getRouter() {
  const routerRef: { current?: ReturnType<typeof createAppRouter> } = {}
  const queryClient = createQueryClient({
    onInternalServerError: () => {
      if (import.meta.env.PROD) routerRef.current?.navigate({ to: '/500' })
    },
    onSessionExpired: () => {
      const router = routerRef.current
      if (!router) return

      const redirect = `${router.history.location.href}`
      router.navigate({ to: '/sign-in', search: { redirect } })
    },
  })

  const router = createAppRouter(queryClient)
  routerRef.current = router

  return router
}

function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
