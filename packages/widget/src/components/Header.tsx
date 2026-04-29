interface HeaderProps {
  title: string
  subtitle?: string
  avatarUrl?: string
  onClose: () => void
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M14 4L4 14M4 4L14 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export function Header({ title, subtitle, avatarUrl, onClose }: HeaderProps) {
  return (
    <div className="vo-header">
      <div className="vo-header__avatar">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="vo-header__avatar-img"
            referrerPolicy="no-referrer"
          />
        ) : (
          getInitial(title)
        )}
      </div>
      <div className="vo-header__title-block">
        <span className="vo-header__name">{title}</span>
        {subtitle && <span className="vo-header__subtitle">{subtitle}</span>}
      </div>
      <div className="vo-header__actions">
        <button className="vo-header__btn" type="button" aria-label="More options">
          <DotsIcon />
        </button>
        <button className="vo-header__btn" type="button" onClick={onClose} aria-label="Close chat">
          <XIcon />
        </button>
      </div>
    </div>
  )
}
