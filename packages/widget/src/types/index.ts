export type WidgetTheme = 'light' | 'dark' | 'auto'
export type WidgetPosition = 'bottom-right' | 'bottom-left'
export type WidgetBubbleSize = 'sm' | 'md' | 'lg'

export interface WidgetConfig {
  botName?: string
  primaryColor?: string
  position?: WidgetPosition
  welcomeMessage?: string
  placeholderText?: string
  autoOpen?: boolean
  autoOpenDelay?: number
  allowedOrigins?: string[]
  theme?: WidgetTheme
  headerTitle?: string
  headerSubtitle?: string
  avatarUrl?: string
  launcherIcon?: string
  hidePoweredBy?: boolean
  bubbleSize?: WidgetBubbleSize
  suggestedQuestions?: string[]
  language?: string
  offlineMessage?: string
  enableFileUpload?: boolean
  enableVoice?: boolean
}

export interface MediaItem {
  url: string
  caption: string
}

export type MessageSegment =
  | { type: 'text'; text: string }
  | { type: 'photo'; url: string; caption: string }

export type AttachmentType = 'image' | 'audio' | 'video'

/** Visitor-uploaded file attached to a user message. */
export interface MessageAttachment {
  type: AttachmentType
  url: string
  mimeType?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'operator'
  content: string
  /** Display name shown above operator bubbles. */
  operatorName?: string
  streaming?: boolean
  timestamp: Date
  /** Photo segments resolved by the backend after the stream finishes.
   *  Present only on assistant messages that contain images. */
  segments?: MessageSegment[]
  /** Flat list of media items — same content as segments' photo entries. */
  media?: MediaItem[]
  /** Files/voice the visitor uploaded for this turn. */
  attachments?: MessageAttachment[]
}

export interface ChatProps {
  token: string
  apiUrl?: string
  /** When set, overrides the theme returned by the backend config. */
  theme?: WidgetTheme
}
