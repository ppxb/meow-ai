import { apiRequest } from '@/shared/api/client'
import { agentListSchema } from './agent.schemas'

export function listAgents() {
  return apiRequest('/api/agents', agentListSchema, {
    auth: true
  })
}
