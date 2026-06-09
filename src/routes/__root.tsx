import { Link, Outlet, createRootRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogoutMutation } from '@/features/auth/auth.queries'

function RootLayout() {
  const navigate = useNavigate()
  const currentUserQuery = useCurrentUserQuery()
  const logoutMutation = useLogoutMutation()
  const username = currentUserQuery.data?.username

  async function handleLogout() {
    await logoutMutation.mutateAsync()
    await navigate({ to: '/login' })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/chat"
              className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              Chat
            </Link>
          </div>

          {username ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="max-w-40 truncate text-muted-foreground">{username}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={() => {
                  void handleLogout()
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              Login
            </Link>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout
})
