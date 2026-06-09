import { apiRequest } from '@/shared/api/client'
import { clearAuthState } from '@/shared/api/token-refresh'
import { dispatchAuthLogin, setTokens } from '@/shared/api/token-storage'
import {
  type LoginFormValues,
  type TokenResponse,
  type CurrentUser,
  tokenResponseSchema,
  userSchema
} from './auth.schemas'

export async function login(credentials: LoginFormValues): Promise<TokenResponse> {
  const tokens = await apiRequest('/api/auth/login', tokenResponseSchema, {
    method: 'POST',
    json: credentials
  })

  setTokens(tokens.access_token, tokens.refresh_token)
  dispatchAuthLogin()

  return tokens
}

export function logout() {
  clearAuthState()
}

export function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest('/api/auth/me', userSchema, {
    auth: true
  })
}
