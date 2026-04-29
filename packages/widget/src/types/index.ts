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

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'operator'
  content: string
  /** Display name shown above operator bubbles. */
  operatorName?: string
  streaming?: boolean
  timestamp: Date
}

export interface ChatProps {
  token: string
  apiUrl?: string
}
