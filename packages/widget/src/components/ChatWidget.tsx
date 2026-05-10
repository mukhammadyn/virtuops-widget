import { useCallback, useRef } from 'react'
import { WidgetApiClient } from '../api/client'
import { WidgetSocket } from '../api/socket'
import { useConfig } from '../hooks/useConfig'
import { useChat } from '../hooks/useChat'
import { LauncherButton } from './LauncherButton'
import { ChatWindow } from './ChatWindow'
import type { ChatProps, MessageAttachment } from '../types'

interface ChatWidgetProps extends ChatProps {
  shadowRoot: ShadowRoot | null
}

export function ChatWidget({ token, apiUrl, theme, shadowRoot }: ChatWidgetProps) {
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

  const { config, loading } = useConfig(client, shadowRoot, socket, theme)
  const { messages, isStreaming, sendMessage, isOpen, setIsOpen } = useChat(
    client,
    config,
    socket,
  )

  const handleUpload = useCallback(
    async (file: File | Blob): Promise<MessageAttachment> => {
      const res = await client.uploadAttachment(file)
      return { type: res.type, url: res.url, mimeType: res.mimeType }
    },
    [client],
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
        onUpload={handleUpload}
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
