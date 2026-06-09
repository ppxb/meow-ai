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
import { LightRays } from '@/components/ui/light-rays'
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
    <main className="relative flex min-h-[calc(100svh-57px)] items-center justify-center overflow-hidden px-6 py-10">
      <LightRays />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <h1 className="text-4xl font-bold">Meow</h1>

        <Card className="w-full rounded-lg">
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>Enter your account to access your Meow AI workspace.</CardDescription>
          </CardHeader>

          <form
            onSubmit={event => {
              event.preventDefault()
              void form.handleSubmit().catch(handleSubmitError)
            }}
          >
            <CardContent className="space-y-5">
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

            <CardFooter className="pt-8">
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

        <p className="text-center text-xs text-muted-foreground">
          Copyright 2026 Meow AI. All rights reserved.
        </p>
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
