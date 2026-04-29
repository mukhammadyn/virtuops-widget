interface LauncherButtonProps {
  isOpen: boolean
  position: 'bottom-right' | 'bottom-left'
  iconUrl?: string
  onClick: () => void
}

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export function LauncherButton({ isOpen, position, iconUrl, onClick }: LauncherButtonProps) {
  return (
    <button
      className="vo-launcher"
      style={{ [position === 'bottom-left' ? 'left' : 'right']: '24px' } as React.CSSProperties}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <CloseIcon />
      ) : iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          className="vo-launcher__icon"
          referrerPolicy="no-referrer"
        />
      ) : (
        <ChatIcon />
      )}
    </button>
  )
}
