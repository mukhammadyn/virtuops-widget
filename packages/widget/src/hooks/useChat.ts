import { useState, useEffect, useRef, useCallback } from 'react'
import type { Message, WidgetConfig } from '../types'
import type { WidgetApiClient, HistoryResponseItem } from '../api/client'
import type { WidgetSocket } from '../api/socket'

function makeId() {
  return Math.random().toString(36).slice(2)
}

function historyToMessage(item: HistoryResponseItem): Message {
  return {
    id: item.id,
    role: item.role,
    content: item.content,
    operatorName: item.operatorName,
    timestamp: new Date(item.createdAt),
  }
}

export function useChat(
  client: WidgetApiClient,
  config: WidgetConfig | null,
  socket: WidgetSocket,
) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  const sessionReady = useRef(false)

  // Create session, restore prior thread (if any), seed welcome, connect socket.
  useEffect(() => {
    if (!config || sessionReady.current) return
    sessionReady.current = true

    client.createSession().catch(() => {
      // Non-fatal — session creation may fail; SSE will still attempt
    })

    // Load persisted history first; fall back to welcomeMessage when the
    // visitor has no prior conversation. We treat the request as best-effort:
    // a network failure or 404 just means the visitor sees an empty thread,
    // which is fine.
    client
      .getHistory()
      .then((res) => {
        if (res.items.length > 0) {
          setMessages(res.items.map(historyToMessage))
          return
        }
        if (config.welcomeMessage) {
          setMessages([
            {
              id: makeId(),
              role: 'assistant',
              content: config.welcomeMessage,
              timestamp: new Date(),
            },
          ])
        }
      })
      .catch(() => {
        if (config.welcomeMessage) {
          setMessages([
            {
              id: makeId(),
              role: 'assistant',
              content: config.welcomeMessage,
              timestamp: new Date(),
            },
          ])
        }
      })

    socket.connect()
  }, [client, config, socket])

  // Operator messages arriving via WebSocket — appended in real time when an
  // operator replies via the dashboard. Deduped against the existing thread:
  // when history loads concurrently with the socket reconnect, the same row
  // can arrive twice — the messageId guards against the dupe.
  useEffect(() => {
    const off = socket.onOperatorMessage((msg) => {
      const id = msg.messageId ?? makeId()
      setMessages((prev) => {
        if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
          return prev
        }
        return [
          ...prev,
          {
            id,
            role: 'operator',
            content: msg.content,
            operatorName: msg.operatorName,
            timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          },
        ]
      })
    })
    return off
  }, [socket])

  // Disconnect socket on unmount.
  useEffect(() => {
    return () => {
      socket.disconnect()
    }
  }, [socket])

  // Auto-open. Backend stores autoOpenDelay in milliseconds (max 60_000).
  useEffect(() => {
    if (!config?.autoOpen) return
    const delay = Math.max(0, config.autoOpenDelay ?? 0)
    const timer = setTimeout(() => setIsOpen(true), delay)
    return () => clearTimeout(timer)
  }, [config])

  // Cleanup in-flight stream on unmount.
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      // Cancel any in-flight stream
      cleanupRef.current?.()
      cleanupRef.current = null

      const userMsg: Message = {
        id: makeId(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }
      const assistantId = makeId()
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      cleanupRef.current = client.streamMessage(
        text.trim(),
        (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m)),
          )
        },
        () => {
          // When AI yields no tokens (operator-mode short-circuit, error, or
          // any silent path) the placeholder bubble is meaningless — drop it
          // entirely instead of leaving an empty bot bubble in the thread.
          setMessages((prev) => {
            const target = prev.find((m) => m.id === assistantId)
            if (target && target.content.length === 0) {
              return prev.filter((m) => m.id !== assistantId)
            }
            return prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            )
          })
          setIsStreaming(false)
          cleanupRef.current = null
        },
        () => {
          const handoffText =
            config?.offlineMessage?.trim() ||
            'You have been connected to a human agent.'
          setMessages((prev) => [
            ...prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
            {
              id: makeId(),
              role: 'system',
              content: handoffText,
              timestamp: new Date(),
            },
          ])
          setIsStreaming(false)
          cleanupRef.current = null
        },
        () => {
          setMessages((prev) => {
            const target = prev.find((m) => m.id === assistantId)
            if (target && target.content.length === 0) {
              return prev.filter((m) => m.id !== assistantId)
            }
            return prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            )
          })
          setIsStreaming(false)
          cleanupRef.current = null
        },
      )
    },
    [client, isStreaming, config?.offlineMessage],
  )

  return { messages, isStreaming, sendMessage, isOpen, setIsOpen }
}
