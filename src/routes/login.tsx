import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginFormSchema } from '@/features/auth/auth.schemas'
import { useLoginMutation } from '@/features/auth/auth.queries'
import { ApiError } from '@/shared/api/client'
import { getValidAccessToken } from '@/shared/api/token-refresh'
import { clearRedirectPath, getRedirectPath } from '@/shared/api/token-storage'

function getFieldError(errors: unknown[]) {
  const error = errors[0]
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message
    if (typeof message === 'string') return message
  }

  return typeof error === 'string' ? error : null
}

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      username: '',
      password: ''
    },
    validators: {
      onSubmit: loginFormSchema
    },
    onSubmit: async ({ value }) => {
      setFormError(null)
      await loginMutation.mutateAsync(value)
      const redirectPath = getRedirectPath()
      clearRedirectPath()
      await navigate({ to: redirectPath || '/chat' })
    }
  })

  const handleSubmitError = (error: unknown) => {
    setFormError(
      error instanceof ApiError || error instanceof Error ? error.message : 'Login failed'
    )
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col justify-center px-6 py-10">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Use the same username and password configured in LambChat.
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={event => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit().catch(handleSubmitError)
          }}
        >
          <CardContent className="space-y-4">
            <form.Field name="username">
              {field => {
                const error = getFieldError(field.state.meta.errors)

                return (
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      aria-describedby={error ? 'login-username-error' : undefined}
                      aria-invalid={Boolean(error)}
                      autoComplete="username"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    {error ? (
                      <p id="login-username-error" className="text-sm text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                )
              }}
            </form.Field>

            <form.Field name="password">
              {field => {
                const error = getFieldError(field.state.meta.errors)

                return (
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      aria-describedby={error ? 'login-password-error' : undefined}
                      aria-invalid={Boolean(error)}
                      autoComplete="current-password"
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    {error ? (
                      <p id="login-password-error" className="text-sm text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                )
              }}
            </form.Field>

            {formError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}
          </CardContent>

          <CardFooter>
            <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  className="w-full"
                  type="submit"
                  disabled={!canSubmit || isSubmitting || loginMutation.isPending}
                >
                  {isSubmitting || loginMutation.isPending ? 'Logging in...' : 'Log in'}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      </Card>
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
