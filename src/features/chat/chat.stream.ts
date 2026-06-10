import { buildApiUrl } from '@/shared/api/config'
import { getRefreshToken } from '@/shared/api/token-storage'
import { clearAuthState, getValidAccessToken, refreshTokens } from '@/shared/api/token-refresh'

import type { StreamEvent } from './chat.schemas'

interface StreamChatEventsOptions {
  sessionId: string
  runId: string
  signal?: AbortSignal
  onEvent: (event: StreamEvent) => void
}

function parseSseEvent(rawEvent: string): StreamEvent | null {
  const lines = rawEvent.split(/\r?\n/)
  let id = ''
  let event = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue
    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trimStart()

    if (field === 'id') id = value
    if (field === 'event') event = value || 'message'
    if (field === 'data') dataLines.push(value)
  }

  if (event === 'ping') return null

  const dataText = dataLines.join('\n')
  let data: Record<string, unknown> = {}
  if (dataText) {
    try {
      const parsed = JSON.parse(dataText)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>
      }
    } catch {
      data = { content: dataText }
    }
  }

  return {
    id: id || createId(),
    event,
    data
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isTerminalStreamEvent(event: StreamEvent) {
  return event.event === 'complete' || event.event === 'done' || event.event === 'error'
}

async function openStream(sessionId: string, runId: string, signal?: AbortSignal) {
  const token = await getValidAccessToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(buildApiUrl(`/api/chat/sessions/${sessionId}/stream?run_id=${runId}`), {
    headers,
    signal
  })
}

export async function streamChatEvents({
  sessionId,
  runId,
  signal,
  onEvent
}: StreamChatEventsOptions) {
  let response = await openStream(sessionId, runId, signal)

  if (response.status === 401) {
    if (!getRefreshToken()) {
      clearAuthState()
      throw new Error('SSE unauthorized: no refresh token')
    }

    await refreshTokens()
    response = await openStream(sessionId, runId, signal)
  }

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedTerminalEvent = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const rawEvents = buffer.split(/\r?\n\r?\n/)
    buffer = rawEvents.pop() ?? ''

    for (const rawEvent of rawEvents) {
      const event = parseSseEvent(rawEvent)
      if (event) {
        if (isTerminalStreamEvent(event)) receivedTerminalEvent = true
        onEvent(event)
      }
    }
  }

  if (buffer.trim()) {
    const event = parseSseEvent(buffer)
    if (event) {
      if (isTerminalStreamEvent(event)) receivedTerminalEvent = true
      onEvent(event)
    }
  }

  if (!signal?.aborted && !receivedTerminalEvent) {
    throw new Error('Stream closed before completion')
  }
}
