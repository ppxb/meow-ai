import { useQuery } from '@tanstack/react-query'

import { getSession, getSessionEvents, listSessions } from './session.api'
import { normalizeSessionList } from './session.schemas'
import type { ListSessionsParams } from './session.api'

export const sessionsQueryKey = ['sessions'] as const
export const sessionQueryKey = (sessionId: string) => ['sessions', sessionId] as const
export const sessionEventsQueryKey = (sessionId: string) =>
  ['sessions', sessionId, 'events'] as const

export function useSessionsQuery(params?: ListSessionsParams) {
  return useQuery({
    queryKey: [...sessionsQueryKey, params] as const,
    queryFn: async () => normalizeSessionList(await listSessions(params))
  })
}

export function useSessionQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionId ? sessionQueryKey(sessionId) : [...sessionsQueryKey, 'empty'],
    queryFn: () => getSession(sessionId ?? ''),
    enabled: Boolean(sessionId)
  })
}

export function useSessionEventsQuery(sessionId: string | null) {
  return useQuery({
    queryKey: sessionId ? sessionEventsQueryKey(sessionId) : [...sessionsQueryKey, 'empty-events'],
    queryFn: () => getSessionEvents(sessionId ?? ''),
    enabled: Boolean(sessionId)
  })
}
