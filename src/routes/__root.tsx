import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

function RootLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
          >
            Login
          </Link>
          <Link
            to="/chat"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
          >
            Chat
          </Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout
})
