import { apiRequest } from '@/shared/api/client'

import { cancelChatResponseSchema, submitChatResponseSchema } from './chat.schemas'

export interface RunGoalSpec {
  objective: string
  rubric?: string
  max_iterations?: number
}

export interface SubmitChatInput {
  agentId: string
  message: string
  sessionId?: string
  agentOptions?: Record<string, boolean | string | number>
  disabledSkills?: string[]
  enabledSkills?: string[]
  personaPresetId?: string | null
  disabledMcpTools?: string[]
  teamId?: string | null
  goal?: RunGoalSpec | null
}

function getBrowserTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return typeof timezone === 'string' && timezone.trim() ? timezone : undefined
}

export function buildSubmitChatBody({
  message,
  sessionId,
  agentOptions,
  disabledSkills,
  enabledSkills,
  personaPresetId,
  disabledMcpTools,
  teamId,
  goal
}: Omit<SubmitChatInput, 'agentId'>) {
  const body: Record<string, unknown> = {
    message,
    session_id: sessionId,
    agent_options: agentOptions,
    attachments: undefined,
    disabled_skills: disabledSkills,
    enabled_skills: enabledSkills,
    persona_preset_id: personaPresetId || undefined,
    disabled_mcp_tools: disabledMcpTools
  }

  const timezone = getBrowserTimezone()
  if (timezone) body.user_timezone = timezone
  if (teamId) body.team_id = teamId
  if (goal) body.goal = goal

  return body
}

export function submitChat(input: SubmitChatInput) {
  return apiRequest(
    `/api/chat/stream?agent_id=${encodeURIComponent(input.agentId)}`,
    submitChatResponseSchema,
    {
      method: 'POST',
      auth: true,
      json: buildSubmitChatBody(input)
    }
  )
}

export function cancelChat(sessionId: string) {
  return apiRequest(`/api/chat/sessions/${sessionId}/cancel`, cancelChatResponseSchema, {
    method: 'POST',
    auth: true
  })
}
