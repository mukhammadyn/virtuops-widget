import { useRef } from 'react'
import { WidgetApiClient } from '../api/client'
import { WidgetSocket } from '../api/socket'
import { useConfig } from '../hooks/useConfig'
import { useChat } from '../hooks/useChat'
import { LauncherButton } from './LauncherButton'
import { ChatWindow } from './ChatWindow'
import type { ChatProps } from '../types'

interface ChatWidgetProps extends ChatProps {
  shadowRoot: ShadowRoot | null
}

export function ChatWidget({ token, apiUrl, shadowRoot }: ChatWidgetProps) {
  const baseUrl = apiUrl ?? 'https://api.virtuops.io'
  const clientRef = useRef<WidgetApiClient | null>(null)
  if (!clientRef.current) {
    clientRef.current = new WidgetApiClient(baseUrl, token)
  }
  const client = clientRef.current

  const socketRef = useRef<WidgetSocket | null>(null)
  if (!socketRef.current) {
    socketRef.current = new WidgetSocket(baseUrl, token, client.visitorId)
  }
  const socket = socketRef.current

  const { config, loading } = useConfig(client, shadowRoot, socket)
  const { messages, isStreaming, sendMessage, isOpen, setIsOpen } = useChat(
    client,
    config,
    socket,
  )

  if (loading || !config) return null

  const position = config.position ?? 'bottom-right'

  return (
    <>
      <ChatWindow
        config={config}
        messages={messages}
        isStreaming={isStreaming}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSend={sendMessage}
      />
      <LauncherButton
        isOpen={isOpen}
        position={position}
        iconUrl={config.launcherIcon}
        onClick={() => setIsOpen((prev) => !prev)}
      />
    </>
  )
}
