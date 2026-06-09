import { createFileRoute } from '@tanstack/react-router'

function ChatPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col justify-center px-6 py-10">
      <div className="max-w-xl space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Chat placeholder</h1>
        <p className="text-muted-foreground">
          Chat streaming, session history, tool rendering, and project reveal will stay out of this
          route until the auth and API layers are stable.
        </p>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/chat')({
  component: ChatPage
})
