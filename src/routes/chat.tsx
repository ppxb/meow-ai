import { createFileRoute, redirect } from '@tanstack/react-router'

import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { getValidAccessToken } from '@/shared/api/token-refresh'
import { saveRedirectPath } from '@/shared/api/token-storage'

function ChatPage() {
  const currentUserQuery = useCurrentUserQuery()
  const username = currentUserQuery.data?.username
  const authStatus = currentUserQuery.isPending
    ? 'Loading account...'
    : currentUserQuery.isError
      ? currentUserQuery.error.message
      : username
        ? `Signed in as ${username}.`
        : 'Signed in.'

  return (
    <main className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col justify-center px-6 py-10">
      <div className="max-w-xl space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Chat placeholder</h1>
        <p className="text-muted-foreground">
          Chat streaming, session history, tool rendering, and project reveal will stay out of this
          route until the auth and API layers are stable.
        </p>
        <p className="text-sm text-muted-foreground">{authStatus}</p>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/chat')({
  beforeLoad: async ({ location }) => {
    const token = await getValidAccessToken()
    if (!token) {
      saveRedirectPath(location.href)
      throw redirect({ to: '/login' })
    }
  },
  component: ChatPage
})
