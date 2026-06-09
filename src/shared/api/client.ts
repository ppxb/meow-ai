import { z } from 'zod'

import { buildApiUrl } from '@/shared/api/config'
import { clearAuthState, getValidAccessToken, refreshTokens } from '@/shared/api/token-refresh'

export class ApiError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (!payload || typeof payload !== 'object') return fallback

  const detail = 'detail' in payload ? payload.detail : undefined
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = detail.message
    if (typeof message === 'string') return message
  }

  return fallback
}

function parseResponsePayload(text: string): unknown {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  init?: RequestInit & {
    auth?: boolean
    json?: unknown
    retryOnUnauthorized?: boolean
  }
): Promise<z.infer<TSchema>> {
  const { auth = false, json, retryOnUnauthorized = true, ...requestInit } = init ?? {}
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = await getValidAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const request = () =>
    fetch(buildApiUrl(path), {
      ...requestInit,
      body: json === undefined ? requestInit.body : JSON.stringify(json),
      headers
    })

  let response = await request()

  if (response.status === 401 && auth && retryOnUnauthorized) {
    try {
      const tokens = await refreshTokens()
      headers.set('Authorization', `Bearer ${tokens.access_token}`)
      response = await request()
    } catch {
      clearAuthState()
    }
  }

  if (response.headers.get('X-Force-Relogin') === 'true') {
    clearAuthState()
    throw new ApiError('User permissions changed, please log in again', response.status)
  }

  const text = await response.text()
  const payload = parseResponsePayload(text)

  if (!response.ok) {
    throw new ApiError(
      readErrorMessage(payload, `Request failed with ${response.status}`),
      response.status,
      payload
    )
  }

  return schema.parse(payload)
}
