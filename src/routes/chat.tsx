import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Loader2, MessageSquarePlus, RefreshCcw, Send, Square } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useAgentsQuery, resolveAvailableAgentId } from '@/features/agent/agent.queries'
import { useSubmitChatMutation, useCancelChatMutation } from '@/features/chat/chat.queries'
import {
  applyStreamEvent,
  createOptimisticMessages,
  sessionEventsToMessages
} from '@/features/chat/chat.messages'
import { streamChatEvents } from '@/features/chat/chat.stream'
import type { ChatMessage } from '@/features/chat/chat.schemas'
import {
  sessionEventsQueryKey,
  sessionsQueryKey,
  useSessionEventsQuery,
  useSessionsQuery
} from '@/features/session/session.queries'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { getValidAccessToken } from '@/shared/api/token-refresh'
import { saveRedirectPath } from '@/shared/api/token-storage'

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <article
        className={
          isUser
            ? 'max-w-[78%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
            : 'max-w-[78%] rounded-lg border bg-card px-3 py-2 text-sm shadow-xs'
        }
      >
        <p className="leading-6 whitespace-pre-wrap">
          {message.content || (message.isStreaming ? '...' : '')}
        </p>
      </article>
    </div>
  )
}

function ChatPage() {
  const queryClient = useQueryClient()
  const currentUserQuery = useCurrentUserQuery()
  const sessionsQuery = useSessionsQuery({ limit: 30 })
  const agentsQuery = useAgentsQuery()
  const submitChatMutation = useSubmitChatMutation()
  const cancelChatMutation = useCancelChatMutation()
  const abortControllerRef = useRef<AbortController | null>(null)

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [historyHydrationSessionId, setHistoryHydrationSessionId] = useState<string | null>(null)

  const sessionEventsQuery = useSessionEventsQuery(activeSessionId)
  const sessions = sessionsQuery.data?.sessions ?? []
  const activeSession = sessions.find(session => session.id === activeSessionId)
  const defaultAgentId = useMemo(
    () =>
      resolveAvailableAgentId('', agentsQuery.data?.default_agent, agentsQuery.data?.agents ?? []),
    [agentsQuery.data]
  )

  useEffect(() => {
    if (isStreaming) return
    if (!activeSessionId || historyHydrationSessionId !== activeSessionId) return
    if (!sessionEventsQuery.isSuccess) return

    setMessages(sessionEventsToMessages(sessionEventsQuery.data.events))
    setHistoryHydrationSessionId(null)
  }, [
    activeSessionId,
    historyHydrationSessionId,
    isStreaming,
    sessionEventsQuery.data,
    sessionEventsQuery.isSuccess
  ])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  async function handleSubmit() {
    const content = draft.trim()
    if (!content || !defaultAgentId || isStreaming) return

    setDraft('')
    setStreamError(null)
    setIsStreaming(true)

    const optimistic = createOptimisticMessages(messages, content)
    setMessages(optimistic.messages)
    let finalAssistantMessageId = optimistic.assistantMessageId

    try {
      const submitResult = await submitChatMutation.mutateAsync({
        agentId: defaultAgentId,
        message: content,
        sessionId: activeSessionId ?? undefined
      })

      const nextSessionId = submitResult.session_id
      const assistantMessageId = submitResult.run_id || optimistic.assistantMessageId
      finalAssistantMessageId = assistantMessageId
      setActiveSessionId(nextSessionId)
      setMessages(previous =>
        previous.map(message =>
          message.id === optimistic.assistantMessageId
            ? {
                ...message,
                id: assistantMessageId,
                runId: submitResult.run_id
              }
            : message
        )
      )

      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey })

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      await streamChatEvents({
        sessionId: nextSessionId,
        runId: submitResult.run_id,
        signal: abortController.signal,
        onEvent: event => {
          setMessages(previous => applyStreamEvent(previous, event, assistantMessageId))
        }
      })

      void queryClient.invalidateQueries({ queryKey: sessionEventsQueryKey(nextSessionId) })
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setStreamError(error instanceof Error ? error.message : 'Request failed')
      setMessages(previous =>
        previous.map(message =>
          message.id === optimistic.assistantMessageId || message.id === finalAssistantMessageId
            ? {
                ...message,
                content:
                  error instanceof Error ? `Error: ${error.message}` : 'Error: request failed',
                isStreaming: false
              }
            : message
        )
      )
    } finally {
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  async function handleStop() {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    setMessages(previous =>
      previous.map(message =>
        message.isStreaming ? { ...message, isStreaming: false, cancelled: true } : message
      )
    )

    if (activeSessionId) {
      await cancelChatMutation.mutateAsync(activeSessionId)
    }
  }

  function handleSelectSession(sessionId: string | null) {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    setStreamError(null)
    setActiveSessionId(sessionId)
    setMessages([])
    setHistoryHydrationSessionId(sessionId)
  }

  return (
    <main className="grid min-h-[calc(100svh-57px)] grid-cols-1 bg-background text-foreground lg:grid-cols-[280px_1fr]">
      <aside className="border-b bg-muted/30 lg:border-r lg:border-b-0">
        <div className="flex h-full min-h-64 flex-col">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {currentUserQuery.data?.username ?? 'Workspace'}
              </p>
              <p className="text-xs text-muted-foreground">{defaultAgentId || 'No agent'}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="New chat"
              onClick={() => handleSelectSession(null)}
            >
              <MessageSquarePlus />
            </Button>
          </div>

          <ScrollArea className="h-[280px] lg:h-[calc(100svh-114px)]">
            <div className="space-y-1 p-2">
              {sessionsQuery.isPending ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading
                </div>
              ) : null}

              {sessions.map(session => (
                <button
                  key={session.id}
                  type="button"
                  className={
                    activeSessionId === session.id
                      ? 'flex w-full flex-col gap-1 rounded-md bg-background px-3 py-2 text-left text-sm shadow-xs'
                      : 'flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground'
                  }
                  onClick={() => handleSelectSession(session.id)}
                >
                  <span className="line-clamp-1 font-medium">
                    {session.name || 'Untitled chat'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatSessionTime(session.updated_at)}
                  </span>
                </button>
              ))}

              {!sessionsQuery.isPending && sessions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No sessions</p>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <section className="flex min-h-[calc(100svh-57px)] flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">
              {activeSession?.name || 'New chat'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isStreaming ? 'Streaming' : activeSessionId ? 'Ready' : 'Draft'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            disabled={!activeSessionId || sessionEventsQuery.isFetching}
            onClick={() => {
              if (activeSessionId) {
                setHistoryHydrationSessionId(activeSessionId)
                void queryClient.invalidateQueries({
                  queryKey: sessionEventsQueryKey(activeSessionId)
                })
              }
            }}
          >
            <RefreshCcw className={sessionEventsQuery.isFetching ? 'animate-spin' : undefined} />
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-5 py-6">
            {messages.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No messages
              </div>
            ) : (
              messages.map(message => <MessageBubble key={message.id} message={message} />)
            )}
          </div>
        </ScrollArea>

        <footer className="border-t bg-background px-5 py-4">
          <form
            className="mx-auto flex max-w-4xl gap-2"
            onSubmit={event => {
              event.preventDefault()
              void handleSubmit()
            }}
          >
            <Textarea
              className="max-h-40 min-h-12 resize-none"
              placeholder={defaultAgentId ? 'Message Meow' : 'No available agent'}
              disabled={!defaultAgentId || isStreaming}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleSubmit()
                }
              }}
            />
            {isStreaming ? (
              <Button
                type="button"
                variant="outline"
                aria-label="Stop"
                onClick={() => void handleStop()}
              >
                <Square />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!draft.trim() || !defaultAgentId || submitChatMutation.isPending}
              >
                <Send />
                Send
              </Button>
            )}
          </form>
          {streamError ? (
            <p className="mx-auto mt-2 max-w-4xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {streamError}
            </p>
          ) : null}
        </footer>
      </section>
    </main>
  )
}

export const Route = createFileRoute('/chat')({
  beforeLoad: async ({ location }) => {
    const token = await getValidAccessToken()
    if (!token) {
      saveRedirectPath(location.href)
      throw redirect({ to: '/login' })
    }
  },
  component: ChatPage
})
