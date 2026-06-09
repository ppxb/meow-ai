import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { hasAuthTokens, subscribeToAuthChanges } from '@/shared/api/token-storage'
import { getCurrentUser, login, logout } from './auth.api'

export const currentUserQueryKey = ['auth', 'current-user'] as const

function useHasAuthTokens() {
  return useSyncExternalStore(subscribeToAuthChanges, hasAuthTokens, () => false)
}

export function useCurrentUserQuery() {
  const enabled = useHasAuthTokens()

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled
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

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      logout()
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: currentUserQueryKey })
    }
  })
}
