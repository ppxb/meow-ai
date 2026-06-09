import { createFileRoute } from '@tanstack/react-router'

function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col justify-center px-6 py-10">
      <div className="max-w-md space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Auth</p>
        <h1 className="text-3xl font-semibold tracking-tight">Login placeholder</h1>
        <p className="text-muted-foreground">
          The next foundation step will migrate auth transport, token storage, and the login form.
        </p>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage
})
