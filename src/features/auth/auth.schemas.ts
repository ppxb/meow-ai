import { z } from 'zod'

export const loginFormSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number().optional()
})

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  avatar_url: z.string().optional().nullable(),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  is_active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type TokenResponse = z.infer<typeof tokenResponseSchema>
export type CurrentUser = z.infer<typeof userSchema>
