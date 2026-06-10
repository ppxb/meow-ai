import { z } from 'zod'

const metadataSchema = z.record(z.string(), z.unknown())

export const backendSessionSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  agent_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  is_active: z.boolean(),
  name: z.string().optional().nullable(),
  metadata: metadataSchema.default({}),
  unread_count: z.number().optional()
})

export const sessionListObjectSchema = z.object({
  sessions: z.array(backendSessionSchema),
  total: z.number(),
  skip: z.number().default(0),
  limit: z.number().default(0),
  has_more: z.boolean().default(false)
})

export const sessionListResponseSchema = z.union([
  sessionListObjectSchema,
  z.array(backendSessionSchema)
])

export const sessionEventSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  data: metadataSchema.default({}),
  timestamp: z.string(),
  run_id: z.string().optional()
})

export const sessionEventsResponseSchema = z.object({
  events: z.array(sessionEventSchema).default([]),
  run_id: z.string().optional()
})

export const sessionStatusSchema = z.object({
  session_id: z.string(),
  run_id: z.string().optional(),
  status: z.string(),
  error: z.string().optional()
})

export type BackendSession = z.infer<typeof backendSessionSchema>
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>
export type SessionEvent = z.infer<typeof sessionEventSchema>
export type SessionEventsResponse = z.infer<typeof sessionEventsResponseSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>

export function normalizeSessionList(response: SessionListResponse) {
  if (Array.isArray(response)) {
    return {
      sessions: response,
      total: response.length,
      skip: 0,
      limit: response.length,
      has_more: false
    }
  }

  return response
}
