import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useHealthQuery } from '@/shared/api/health'

function App() {
  const healthQuery = useHealthQuery()
  const version = healthQuery.data?.version ?? 'unknown'
  const checkedAt = healthQuery.data?.timestamp
    ? new Date(healthQuery.data.timestamp).toLocaleString()
    : 'not checked yet'

  return (
    <main className="px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Meow AI</p>
          <h1 className="text-3xl font-semibold tracking-tight">LambChat frontend rebuild</h1>
          <p className="max-w-2xl text-muted-foreground">
            Foundation check: this shell verifies that the new frontend can reach the local FastAPI
            backend through the Vite proxy.
          </p>
        </header>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Backend status</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={
                    healthQuery.isError
                      ? 'size-2.5 rounded-full bg-destructive'
                      : healthQuery.isPending
                        ? 'size-2.5 rounded-full bg-muted-foreground'
                        : 'size-2.5 rounded-full bg-emerald-500'
                  }
                />
                <strong className="text-lg">
                  {healthQuery.isError
                    ? 'Connection failed'
                    : healthQuery.isPending
                      ? 'Checking...'
                      : 'Connected'}
                </strong>
              </div>
            </div>

            <Button
              variant="outline"
              disabled={healthQuery.isFetching}
              onClick={() => void healthQuery.refetch()}
            >
              <RefreshCcw className={healthQuery.isFetching ? 'animate-spin' : undefined} />
              Refresh
            </Button>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-muted px-3 py-2">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium">{version}</dd>
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <dt className="text-muted-foreground">Checked at</dt>
              <dd className="font-medium">{checkedAt}</dd>
            </div>
          </dl>

          {healthQuery.error ? (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {healthQuery.error instanceof Error
                ? healthQuery.error.message
                : 'Unable to reach backend'}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default App
