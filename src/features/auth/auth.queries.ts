import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getAccessToken, getRefreshToken } from '@/shared/api/token-storage'
import { getCurrentUser, login } from './auth.api'

export const currentUserQueryKey = ['auth', 'current-user'] as const

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: Boolean(getAccessToken() || getRefreshToken())
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
    }
  })
}
