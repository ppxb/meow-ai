import { z } from 'zod'

export const submitChatResponseSchema = z.object({
  session_id: z.string(),
  run_id: z.string(),
  trace_id: z.string().optional(),
  status: z.string(),
  queue_position: z.number().optional()
})

export const cancelChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

export const messageRoleSchema = z.enum(['user', 'assistant', 'system'])

export const chatMessageSchema = z.object({
  id: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  timestamp: z.string(),
  isStreaming: z.boolean().optional(),
  runId: z.string().optional(),
  cancelled: z.boolean().optional()
})

export type SubmitChatResponse = z.infer<typeof submitChatResponseSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type MessageRole = z.infer<typeof messageRoleSchema>

export interface StreamEvent {
  id: string
  event: string
  data: Record<string, unknown>
}
