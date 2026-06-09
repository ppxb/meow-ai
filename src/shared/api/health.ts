import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { apiRequest } from '@/shared/api/client'

const healthSchema = z.looseObject({
  status: z.string(),
  version: z.string().optional(),
  timestamp: z.string().optional()
})

export type HealthStatus = z.infer<typeof healthSchema>

export const healthQueryKey = ['health'] as const

export function fetchHealth() {
  return apiRequest('/health', healthSchema)
}

export function useHealthQuery() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: fetchHealth
  })
}
