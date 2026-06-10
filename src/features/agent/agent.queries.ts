import { useQuery } from '@tanstack/react-query'

import { listAgents } from './agent.api'
import type { Agent } from './agent.schemas'

export const agentsQueryKey = ['agents'] as const

export function resolveAvailableAgentId(
  currentAgentId: string,
  preferredDefaultAgentId: string | undefined,
  agents: Agent[]
) {
  const availableIds = new Set(agents.map(agent => agent.id))

  if (currentAgentId && availableIds.has(currentAgentId)) {
    return currentAgentId
  }

  if (preferredDefaultAgentId && availableIds.has(preferredDefaultAgentId)) {
    return preferredDefaultAgentId
  }

  return agents[0]?.id ?? ''
}

export function useAgentsQuery() {
  return useQuery({
    queryKey: agentsQueryKey,
    queryFn: listAgents
  })
}
