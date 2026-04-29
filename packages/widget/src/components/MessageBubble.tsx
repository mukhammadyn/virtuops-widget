import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

function renderContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g)
  return parts.map((part, i) => {
    if (part === '\n') return <br key={i} />
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isOperator = message.role === 'operator'

  if (isSystem) {
    return (
      <div className="vo-msg vo-msg--system">
        <span>{message.content}</span>
      </div>
    )
  }

  const variant = isUser ? 'user' : isOperator ? 'operator' : 'bot'

  return (
    <div className={`vo-msg vo-msg--${variant}`}>
      {isOperator && message.operatorName && (
        <span className="vo-msg__author">{message.operatorName}</span>
      )}
      <div className="vo-msg__bubble">
        {renderContent(message.content)}
        {message.streaming && (
          <span className="vo-cursor" aria-hidden="true">
            |
          </span>
        )}
      </div>
    </div>
  )
}
