import { useEffect, useRef, useState, useCallback } from 'react'
import type { MessageAttachment } from '../types'

export interface UploadHandler {
  (file: File | Blob): Promise<MessageAttachment>
}

interface MessageInputProps {
  onSend: (text: string, attachments?: MessageAttachment[]) => void
  /** Returns the resolved attachment after upload completes. */
  onUpload?: UploadHandler
  isStreaming: boolean
  placeholder: string
  enableFileUpload?: boolean
  enableVoice?: boolean
}

interface PendingAttachment {
  id: string
  status: 'uploading' | 'ready' | 'error'
  /** Local preview only — set for image/* picks before upload completes. */
  previewUrl?: string
  /** Filled when upload succeeds. */
  resolved?: MessageAttachment
  error?: string
  /** UI hint: voice attachments render as a mic chip even before upload. */
  kind: 'image' | 'audio' | 'video' | 'file'
  name: string
}

const MAX_ATTACHMENTS = 5

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

const StopIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const CrossIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
)

function makeId() {
  return Math.random().toString(36).slice(2)
}

function topLevel(mime: string): 'image' | 'audio' | 'video' | 'file' {
  const t = mime.split('/')[0]?.toLowerCase()
  if (t === 'image' || t === 'audio' || t === 'video') return t
  return 'file'
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4']
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return undefined
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function MessageInput({
  onSend,
  onUpload,
  isStreaming,
  placeholder,
  enableFileUpload = false,
  enableVoice = false,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<number | null>(null)
  const recCancelledRef = useRef(false)

  const ready = pending.filter((p) => p.status === 'ready')
  const hasUploading = pending.some((p) => p.status === 'uploading')
  const canSend =
    !isStreaming &&
    !hasUploading &&
    (value.trim().length > 0 || ready.length > 0)

  const submit = useCallback(() => {
    if (!canSend) return
    const text = value.trim()
    const attachments = ready
      .map((p) => p.resolved)
      .filter((a): a is MessageAttachment => !!a)
    onSend(text, attachments.length ? attachments : undefined)
    setValue('')
    // Revoke object URLs we created so they don't leak.
    for (const p of pending) {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    }
    setPending([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, value, ready, pending, onSend])

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

  const startUpload = useCallback(
    async (file: File | Blob, displayName: string, kind: PendingAttachment['kind']) => {
      if (!onUpload) return
      if (pending.length >= MAX_ATTACHMENTS) return
      const id = makeId()
      const previewUrl =
        kind === 'image' && file instanceof Blob
          ? URL.createObjectURL(file)
          : undefined
      setPending((prev) => [
        ...prev,
        { id, status: 'uploading', previewUrl, kind, name: displayName },
      ])
      try {
        const resolved = await onUpload(file)
        setPending((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: 'ready', resolved } : p,
          ),
        )
      } catch (err: any) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'error', error: err?.message ?? 'Upload failed' }
              : p,
          ),
        )
      }
    },
    [onUpload, pending.length],
  )

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    startUpload(file, file.name, topLevel(file.type))
  }

  const stopRecording = useCallback(async (cancel = false) => {
    const rec = recorderRef.current
    if (!rec) return
    recCancelledRef.current = cancel
    return new Promise<void>((resolve) => {
      rec.addEventListener(
        'stop',
        async () => {
          if (recTimerRef.current !== null) {
            window.clearInterval(recTimerRef.current)
            recTimerRef.current = null
          }
          setIsRecording(false)
          setRecSeconds(0)
          rec.stream.getTracks().forEach((t) => t.stop())
          recorderRef.current = null

          if (recCancelledRef.current) {
            recChunksRef.current = []
            return resolve()
          }

          const mime = rec.mimeType || 'audio/webm'
          const blob = new Blob(recChunksRef.current, { type: mime })
          recChunksRef.current = []
          if (blob.size === 0) return resolve()

          const ext = mime.includes('mp4')
            ? 'm4a'
            : mime.includes('ogg')
              ? 'ogg'
              : 'webm'
          const file = new File([blob], `voice-${Date.now()}.${ext}`, {
            type: mime,
          })
          const id = makeId()
          setPending((prev) => [
            ...prev,
            { id, status: 'uploading', kind: 'audio', name: 'Voice message' },
          ])
          try {
            const resolved = onUpload ? await onUpload(file) : null
            if (!resolved) throw new Error('No upload handler configured')
            setPending((prev) => prev.filter((p) => p.id !== id))
            onSend(value.trim(), [resolved])
            setValue('')
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
          } catch (err: any) {
            setPending((prev) =>
              prev.map((p) =>
                p.id === id
                  ? { ...p, status: 'error', error: err?.message ?? 'Upload failed' }
                  : p,
              ),
            )
          }
          resolve()
        },
        { once: true },
      )
      try {
        rec.stop()
      } catch {
        resolve()
      }
    })
  }, [onSend, onUpload, value])

  const startRecording = useCallback(async () => {
    if (!onUpload) return
    if (typeof MediaRecorder === 'undefined') {
      // Browser cannot record audio — silently no-op rather than crashing.
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = pickRecorderMime()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recChunksRef.current = []
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recChunksRef.current.push(ev.data)
      }
      rec.start()
      recorderRef.current = rec
      setIsRecording(true)
      setRecSeconds(0)
      recTimerRef.current = window.setInterval(() => {
        setRecSeconds((s) => s + 1)
      }, 1000)
    } catch {
      // Permission denied or no mic — leave the input untouched.
    }
  }, [onUpload])

  // Cleanup any active recording / preview URLs on unmount.
  useEffect(() => {
    return () => {
      if (recTimerRef.current !== null) window.clearInterval(recTimerRef.current)
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recCancelledRef.current = true
        try {
          recorderRef.current.stop()
        } catch {
          /* ignore */
        }
        recorderRef.current.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const removeAttachment = (id: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const hasText = value.trim().length > 0
  const canShowMic = enableVoice && !!onUpload
  const canShowAttach = enableFileUpload && !!onUpload

  return (
    <div className="vo-input-bar">
      {pending.length > 0 && (
        <div className="vo-attachments">
          {pending.map((p) => (
            <div
              key={p.id}
              className={`vo-attachment vo-attachment--${p.kind} vo-attachment--${p.status}`}
              title={p.error ?? p.name}
            >
              {p.previewUrl ? (
                <img src={p.previewUrl} alt={p.name} />
              ) : p.kind === 'audio' ? (
                <span className="vo-attachment-ic" aria-hidden="true">
                  <MicIcon />
                </span>
              ) : (
                <span className="vo-attachment-ic" aria-hidden="true">
                  <PaperclipIcon />
                </span>
              )}
              {p.status === 'uploading' && (
                <span className="vo-attachment-spinner" aria-hidden="true" />
              )}
              <button
                className="vo-attachment-x"
                type="button"
                aria-label="Remove attachment"
                onClick={() => removeAttachment(p.id)}
              >
                <CrossIcon />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={`vo-input-inner${isRecording ? ' vo-input-inner--recording' : ''}`}>
        {canShowAttach && !isRecording && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFilePick}
            />
            <button
              className="vo-icon-btn"
              type="button"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || pending.length >= MAX_ATTACHMENTS}
            >
              <PaperclipIcon />
            </button>
          </>
        )}
        {isRecording ? (
          <div className="vo-rec-row">
            <div className="vo-rec-status">
              <span className="vo-rec-dot" aria-hidden="true" />
              <span className="vo-rec-time">Recording {formatTime(recSeconds)}</span>
            </div>
            <div className="vo-rec-actions">
              <button
                className="vo-rec-cancel"
                type="button"
                onClick={() => stopRecording(true)}
              >
                Cancel
              </button>
              <button
                className="vo-rec-stop"
                type="button"
                aria-label="Stop recording"
                onClick={() => stopRecording(false)}
              >
                <StopIcon />
              </button>
            </div>
          </div>
        ) : (
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
        )}
        {!isRecording && (hasText || ready.length > 0) ? (
          <button
            className="vo-send"
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
          >
            <ArrowUpIcon />
          </button>
        ) : !isRecording && canShowMic ? (
          <button
            className="vo-icon-btn"
            type="button"
            aria-label="Voice input"
            onClick={startRecording}
            disabled={isStreaming}
          >
            <MicIcon />
          </button>
        ) : null}
      </div>
    </div>
  )
}
