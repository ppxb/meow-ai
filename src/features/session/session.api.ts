import { apiRequest } from '@/shared/api/client'

import {
  backendSessionSchema,
  sessionEventsResponseSchema,
  sessionListResponseSchema,
  sessionStatusSchema
} from './session.schemas'

export interface ListSessionsParams {
  status?: string
  limit?: number
  skip?: number
  project_id?: string
  search?: string
  favorites_only?: boolean
}

function appendSearchParams(path: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export function listSessions(params?: ListSessionsParams) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.skip) searchParams.set('skip', String(params.skip))
  if (params?.project_id) searchParams.set('project_id', params.project_id)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.favorites_only) searchParams.set('favorites_only', 'true')

  return apiRequest(appendSearchParams('/api/sessions', searchParams), sessionListResponseSchema, {
    auth: true
  })
}

export function getSession(sessionId: string) {
  return apiRequest(`/api/sessions/${sessionId}`, backendSessionSchema, {
    auth: true
  })
}

export function getSessionEvents(sessionId: string) {
  return apiRequest(`/api/sessions/${sessionId}/events`, sessionEventsResponseSchema, {
    auth: true
  })
}

export function getSessionStatus(sessionId: string, runId?: string) {
  const params = runId ? `?run_id=${encodeURIComponent(runId)}` : ''
  return apiRequest(`/api/chat/sessions/${sessionId}/status${params}`, sessionStatusSchema, {
    auth: true
  })
}
