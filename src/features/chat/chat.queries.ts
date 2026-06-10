import { useMutation } from '@tanstack/react-query'

import { cancelChat, submitChat } from './chat.api'

export function useSubmitChatMutation() {
  return useMutation({
    mutationFn: submitChat
  })
}

export function useCancelChatMutation() {
  return useMutation({
    mutationFn: cancelChat
  })
}
