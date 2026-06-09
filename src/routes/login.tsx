import type { FormEvent } from 'react'
import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { loginFormSchema } from '@/features/auth/auth.schemas'
import { useLoginMutation } from '@/features/auth/auth.queries'
import { ApiError } from '@/shared/api/client'
import { getValidAccessToken } from '@/shared/api/token-refresh'
import { clearRedirectPath, getRedirectPath } from '@/shared/api/token-storage'

type LoginErrors = Partial<Record<'username' | 'password' | 'form', string>>

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [values, setValues] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState<LoginErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const parsed = loginFormSchema.safeParse(values)
    if (!parsed.success) {
      const nextErrors: LoginErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'username' || field === 'password') {
          nextErrors[field] = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }

    try {
      await loginMutation.mutateAsync(parsed.data)
      const redirectPath = getRedirectPath()
      clearRedirectPath()
      await navigate({ to: redirectPath || '/chat' })
    } catch (error) {
      setErrors({
        form: error instanceof ApiError || error instanceof Error ? error.message : 'Login failed'
      })
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col justify-center px-6 py-10">
      <div className="max-w-md space-y-6">
        <p className="text-sm font-medium text-muted-foreground">Auth</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="text-muted-foreground">
            Use the same username and password configured in LambChat.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Username</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
              autoComplete="username"
              value={values.username}
              onChange={event =>
                setValues(current => ({
                  ...current,
                  username: event.target.value
                }))
              }
            />
            {errors.username ? (
              <span className="text-sm text-destructive">{errors.username}</span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
              autoComplete="current-password"
              type="password"
              value={values.password}
              onChange={event =>
                setValues(current => ({
                  ...current,
                  password: event.target.value
                }))
              }
            />
            {errors.password ? (
              <span className="text-sm text-destructive">{errors.password}</span>
            ) : null}
          </label>

          {errors.form ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const token = await getValidAccessToken()
    if (token) {
      throw redirect({ to: '/chat' })
    }
  },
  component: LoginPage
})
