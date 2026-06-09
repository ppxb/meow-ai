import { z } from 'zod'

import { buildApiUrl } from '@/shared/api/config'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  setTokens
} from '@/shared/api/token-storage'

const refreshedTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional()
})

let refreshPromise: Promise<string> | null = null

export function clearAuthState() {
  clearTokens()
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

export async function refreshTokens() {
  if (refreshPromise) {
    const accessToken = await refreshPromise
    return {
      access_token: accessToken,
      refresh_token: getRefreshToken() ?? undefined
    }
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const tokens = refreshedTokensSchema.parse(await response.json())
    setTokens(tokens.access_token, tokens.refresh_token)
    return tokens.access_token
  })()

  try {
    const accessToken = await refreshPromise
    return {
      access_token: accessToken,
      refresh_token: getRefreshToken() ?? undefined
    }
  } finally {
    queueMicrotask(() => {
      refreshPromise = null
    })
  }
}

export async function getValidAccessToken() {
  const accessToken = getAccessToken()
  if (!accessToken) return null
  if (!isTokenExpired(accessToken)) return accessToken

  const refreshToken = getRefreshToken()
  if (!refreshToken || isTokenExpired(refreshToken)) {
    return null
  }

  try {
    const tokens = await refreshTokens()
    return tokens.access_token
  } catch {
    return null
  }
}
