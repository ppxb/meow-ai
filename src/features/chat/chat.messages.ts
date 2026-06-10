import type { SessionEvent } from '@/features/session/session.schemas'

import type { ChatMessage, StreamEvent } from './chat.schemas'

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function upsertAssistantMessage(
  messages: ChatMessage[],
  messageId: string,
  runId?: string
): ChatMessage[] {
  if (messages.some(message => message.id === messageId)) return messages

  return [
    ...messages,
    {
      id: messageId,
      role: 'assistant' as const,
      content: '',
      timestamp: nowIso(),
      isStreaming: true,
      runId
    }
  ]
}

function appendAssistantContent(messages: ChatMessage[], messageId: string, content: string) {
  return messages.map(message =>
    message.id === messageId ? { ...message, content: message.content + content } : message
  )
}

function finishAssistant(messages: ChatMessage[], messageId: string) {
  return messages.map(message =>
    message.id === messageId ? { ...message, isStreaming: false } : message
  )
}

function markAssistantError(messages: ChatMessage[], messageId: string, error: string) {
  return messages.map(message =>
    message.id === messageId
      ? {
          ...message,
          content: error ? `Error: ${error}` : 'Error: request failed',
          isStreaming: false,
          cancelled: error === 'CancelledError'
        }
      : message
  )
}

export function createOptimisticMessages(previousMessages: ChatMessage[], content: string) {
  const timestamp = nowIso()
  const assistantMessageId = createId('assistant')

  return {
    assistantMessageId,
    messages: [
      ...previousMessages,
      {
        id: createId('user'),
        role: 'user' as const,
        content: content.trim(),
        timestamp
      },
      {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: '',
        timestamp,
        isStreaming: true
      }
    ]
  }
}

export function applyStreamEvent(
  messages: ChatMessage[],
  event: StreamEvent,
  assistantMessageId: string
): ChatMessage[] {
  if (event.event === 'metadata') return messages

  if (event.event === 'user:message') {
    const content = readString(event.data.content)
    if (
      !content ||
      messages.some(message => message.role === 'user' && message.content === content)
    ) {
      return messages
    }

    return [
      ...messages,
      {
        id: readString(event.data.message_id) || createId('user'),
        role: 'user' as const,
        content,
        timestamp: readString(event.data._timestamp) || nowIso()
      }
    ]
  }

  if (event.event === 'message:chunk') {
    const content = readString(event.data.content)
    if (!content) return messages
    return appendAssistantContent(
      upsertAssistantMessage(messages, assistantMessageId),
      assistantMessageId,
      content
    )
  }

  if (event.event === 'complete' || event.event === 'done') {
    return finishAssistant(messages, assistantMessageId)
  }

  if (event.event === 'error' || event.event === 'user:cancel') {
    return markAssistantError(
      messages,
      assistantMessageId,
      readString(event.data.error || event.data.type)
    )
  }

  return messages
}

export function sessionEventsToMessages(events: SessionEvent[]) {
  const messages: ChatMessage[] = []
  const assistantByRun = new Map<string, string>()

  for (const event of events) {
    if (event.event_type === 'user:message') {
      const content = readString(event.data.content)
      if (!content) continue
      messages.push({
        id: readString(event.data.message_id) || `${event.run_id ?? event.id}:user`,
        role: 'user',
        content,
        timestamp: event.timestamp,
        runId: event.run_id
      })
    }

    if (event.event_type === 'message:chunk') {
      const runId = event.run_id ?? 'unknown'
      const assistantId = assistantByRun.get(runId) ?? `${runId}:assistant`
      assistantByRun.set(runId, assistantId)
      const content = readString(event.data.content)
      const existing = messages.find(message => message.id === assistantId)
      if (existing) {
        existing.content += content
      } else {
        messages.push({
          id: assistantId,
          role: 'assistant',
          content,
          timestamp: event.timestamp,
          isStreaming: false,
          runId: event.run_id
        })
      }
    }

    if (event.event_type === 'error') {
      const runId = event.run_id ?? 'unknown'
      const assistantId = assistantByRun.get(runId) ?? `${runId}:assistant`
      assistantByRun.set(runId, assistantId)
      const error = readString(event.data.error || event.data.type)
      const existing = messages.find(message => message.id === assistantId)
      if (existing) {
        existing.content = error ? `Error: ${error}` : 'Error: request failed'
        existing.cancelled = error === 'CancelledError'
      } else {
        messages.push({
          id: assistantId,
          role: 'assistant',
          content: error ? `Error: ${error}` : 'Error: request failed',
          timestamp: event.timestamp,
          isStreaming: false,
          runId: event.run_id,
          cancelled: error === 'CancelledError'
        })
      }
    }
  }

  return messages
}
