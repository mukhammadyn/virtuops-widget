import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { SuggestedQuestions } from './SuggestedQuestions'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  suggestedQuestions?: string[]
  onSuggest?: (q: string) => void
}

function showTypingIndicator(messages: Message[], isStreaming: boolean): boolean {
  if (!isStreaming) return false
  const last = messages[messages.length - 1]
  // Show dots only before the first token arrives (content still empty)
  return last?.role === 'assistant' && last.streaming === true && last.content === ''
}

export function MessageList({ messages, isStreaming, suggestedQuestions, onSuggest }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const showTyping = showTypingIndicator(messages, isStreaming)
  // Hide the empty streaming bubble while dots are shown
  const displayMessages = showTyping ? messages.slice(0, -1) : messages

  const showSuggestions =
    messages.length === 1 &&
    suggestedQuestions &&
    suggestedQuestions.length > 0 &&
    onSuggest != null

  return (
    <div className="vo-messages" role="log" aria-live="polite">
      {displayMessages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {showTyping && <TypingIndicator />}
      {showSuggestions && (
        <SuggestedQuestions questions={suggestedQuestions!} onSelect={onSuggest!} />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
