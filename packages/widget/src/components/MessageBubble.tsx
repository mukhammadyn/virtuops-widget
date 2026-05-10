import { useEffect, useState } from 'react'
import type { Message, MessageAttachment, MessageSegment } from '../types'

interface MessageBubbleProps {
  message: Message
}

/**
 * Strip [photo:N] tokens from streamed text. The LLM emits them inline so
 * the backend can map them to real URLs after the stream finishes — for the
 * visitor they're internal markers and must not be shown.
 */
function stripPhotoTokens(text: string): string {
  return text.replace(/\[photo:\d+\]\s*/g, '').replace(/\n{3,}/g, '\n\n').trim()
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

  // Once the backend resolved [photo:N] into real URLs (post-stream "media"
  // event), prefer the structured segments layout. Until then we render the
  // plain text bubble — with tokens hidden so they never flash to the user.
  const hasSegments = !!message.segments?.length

  if (hasSegments) {
    return (
      <div className={`vo-msg vo-msg--${variant}`}>
        {isOperator && message.operatorName && (
          <span className="vo-msg__author">{message.operatorName}</span>
        )}
        <SegmentedAnswer segments={message.segments!} />
      </div>
    )
  }

  const visibleText = stripPhotoTokens(message.content)
  const hasAttachments = !!message.attachments?.length

  return (
    <div className={`vo-msg vo-msg--${variant}`}>
      {isOperator && message.operatorName && (
        <span className="vo-msg__author">{message.operatorName}</span>
      )}
      {hasAttachments && (
        <UserAttachments attachments={message.attachments!} />
      )}
      {(visibleText || message.streaming) && (
        <div className="vo-msg__bubble">
          {renderContent(visibleText)}
          {message.streaming && (
            <span className="vo-cursor" aria-hidden="true">
              |
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function UserAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  const [openImage, setOpenImage] = useState<string | null>(null)
  return (
    <div className="vo-user-attachments">
      {attachments.map((a, i) => {
        if (a.type === 'image') {
          return (
            <button
              key={i}
              type="button"
              className="vo-user-attachment vo-user-attachment--image"
              onClick={() => setOpenImage(a.url)}
              aria-label="Open image"
            >
              <img src={a.url} alt="attachment" loading="lazy" />
            </button>
          )
        }
        if (a.type === 'audio') {
          return (
            <audio
              key={i}
              src={a.url}
              controls
              preload="metadata"
              className="vo-user-attachment vo-user-attachment--audio"
            />
          )
        }
        if (a.type === 'video') {
          return (
            <video
              key={i}
              src={a.url}
              controls
              preload="metadata"
              className="vo-user-attachment vo-user-attachment--video"
            />
          )
        }
        return null
      })}
      {openImage && (
        <PhotoLightbox
          photos={[{ url: openImage, caption: '' }]}
          index={0}
          onClose={() => setOpenImage(null)}
          onNavigate={() => {}}
        />
      )}
    </div>
  )
}

type Group =
  | { type: 'text'; text: string }
  | { type: 'album'; photos: Array<{ url: string; caption: string }> }

function groupSegments(segments: MessageSegment[]): Group[] {
  const groups: Group[] = []
  for (const seg of segments) {
    if (seg.type === 'text') {
      const t = seg.text?.trim()
      if (t) groups.push({ type: 'text', text: t })
      continue
    }
    const last = groups[groups.length - 1]
    if (last && last.type === 'album') {
      last.photos.push({ url: seg.url, caption: seg.caption })
    } else {
      groups.push({
        type: 'album',
        photos: [{ url: seg.url, caption: seg.caption }],
      })
    }
  }
  return groups
}

function SegmentedAnswer({ segments }: { segments: MessageSegment[] }) {
  const groups = groupSegments(segments)
  return (
    <div className="vo-msg__segments">
      {groups.map((g, i) =>
        g.type === 'text' ? (
          <div key={i} className="vo-msg__bubble">
            {renderContent(g.text)}
          </div>
        ) : (
          <PhotoAlbum key={i} photos={g.photos} />
        ),
      )}
    </div>
  )
}

function PhotoAlbum({
  photos,
}: {
  photos: Array<{ url: string; caption: string }>
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  // First non-empty caption — Telegram surfaces it under the album, mirror that.
  const caption = photos.map((p) => p.caption).find((c) => c?.trim()) ?? ''
  const albumClass =
    photos.length === 1 ? 'vo-album vo-album--single' : 'vo-album vo-album--grid'
  return (
    <>
      <div className="vo-album-wrap">
        <div className={albumClass}>
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              className="vo-album__cell"
              onClick={() => setOpenIndex(i)}
              aria-label={p.caption || `Open photo ${i + 1}`}
            >
              <img
                src={p.url}
                alt={p.caption || `photo-${i + 1}`}
                className="vo-album__img"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {caption && (
          <div className="vo-msg__bubble">{renderContent(caption)}</div>
        )}
      </div>
      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={(delta) =>
            setOpenIndex((i) =>
              i === null ? null : (i + delta + photos.length) % photos.length,
            )
          }
        />
      )}
    </>
  )
}

function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Array<{ url: string; caption: string }>
  index: number
  onClose: () => void
  onNavigate: (delta: number) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onNavigate(-1)
      else if (e.key === 'ArrowRight') onNavigate(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onNavigate])

  const photo = photos[index]
  const hasMultiple = photos.length > 1

  return (
    <div
      className="vo-lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      <button
        type="button"
        className="vo-lightbox__close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close preview"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {hasMultiple && (
        <button
          type="button"
          className="vo-lightbox__nav vo-lightbox__nav--prev"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(-1)
          }}
          aria-label="Previous photo"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <img
        src={photo.url}
        alt={photo.caption || `photo-${index + 1}`}
        className="vo-lightbox__img"
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && (
        <button
          type="button"
          className="vo-lightbox__nav vo-lightbox__nav--next"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(1)
          }}
          aria-label="Next photo"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {photo.caption?.trim() && (
        <div className="vo-lightbox__caption" onClick={(e) => e.stopPropagation()}>
          {photo.caption}
        </div>
      )}

      {hasMultiple && (
        <div className="vo-lightbox__counter" onClick={(e) => e.stopPropagation()}>
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  )
}
