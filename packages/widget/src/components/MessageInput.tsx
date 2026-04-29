import { useRef, useState, useCallback } from 'react'

interface MessageInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  placeholder: string
  enableFileUpload?: boolean
  enableVoice?: boolean
}

const PaperclipIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
)

const MicIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

export function MessageInput({
  onSend,
  isStreaming,
  placeholder,
  enableFileUpload = false,
  enableVoice = false,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const text = value.trim()
    if (!text || isStreaming) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const hasText = value.trim().length > 0

  return (
    <div className="vo-input-bar">
      <div className="vo-input-inner">
        {enableFileUpload && (
          <button
            className="vo-icon-btn"
            type="button"
            aria-label="Attach file"
            tabIndex={-1}
          >
            <PaperclipIcon />
          </button>
        )}
        <textarea
          ref={textareaRef}
          className="vo-input"
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Type a message"
        />
        {hasText ? (
          <button
            className="vo-send"
            type="button"
            onClick={submit}
            disabled={isStreaming}
            aria-label="Send message"
          >
            <ArrowUpIcon />
          </button>
        ) : enableVoice ? (
          <button
            className="vo-icon-btn"
            type="button"
            aria-label="Voice input"
            tabIndex={-1}
          >
            <MicIcon />
          </button>
        ) : null}
      </div>
    </div>
  )
}
