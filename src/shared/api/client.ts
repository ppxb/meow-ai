import { z } from 'zod'

import { buildApiUrl } from '@/shared/api/config'

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
  if (!payload || typeof payload !== 'object') return fallback

  const detail = 'detail' in payload ? payload.detail : undefined
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = detail.message
    if (typeof message === 'string') return message
  }

  return fallback
}

export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  init?: RequestInit
): Promise<z.infer<TSchema>> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers
  })

  const text = await response.text()
  const payload: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(
      readErrorMessage(payload, `Request failed with ${response.status}`),
      response.status,
      payload
    )
  }

  return schema.parse(payload)
}
