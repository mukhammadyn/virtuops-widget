import type { WidgetConfig } from '../types'

export interface HistoryResponseItem {
  id: string
  role: 'user' | 'assistant' | 'operator'
  content: string
  operatorName?: string
  createdAt: string
}

export interface HistoryResponse {
  items: HistoryResponseItem[]
  hasMore: boolean
}

const configCache = new Map<string, WidgetConfig>()

function getOrCreateVisitorId(token: string): string {
  const key = `vo_visitor_${token}`
  const stored = localStorage.getItem(key)
  if (stored) return stored

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(key, id)
  return id
}

export class WidgetApiClient {
  readonly visitorId: string

  constructor(
    private baseUrl: string,
    private token: string,
  ) {
    this.visitorId = getOrCreateVisitorId(token)
  }

  async getConfig(): Promise<WidgetConfig> {
    const cached = configCache.get(this.token)
    if (cached) return cached

    const res = await fetch(`${this.baseUrl}/widget/config/${this.token}`)
    if (!res.ok) throw new Error(`Failed to load config: ${res.status}`)
    const config: WidgetConfig = await res.json()
    configCache.set(this.token, config)
    return config
  }

  /** Replaces the cached config so subsequent reads see the fresh value.
   *  Used when the gateway pushes a `config_updated` event. */
  primeConfigCache(config: WidgetConfig) {
    configCache.set(this.token, config)
  }

  async getHistory(limit = 50, offset = 0): Promise<HistoryResponse> {
    const params = new URLSearchParams({
      token: this.token,
      visitorId: this.visitorId,
      limit: String(limit),
      offset: String(offset),
    })
    const res = await fetch(`${this.baseUrl}/widget/messages?${params}`)
    if (!res.ok) throw new Error(`Failed to load history: ${res.status}`)
    return res.json()
  }

  async createSession(): Promise<{ sessionId: string }> {
    const res = await fetch(`${this.baseUrl}/widget/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token, visitorId: this.visitorId }),
    })
    if (!res.ok) throw new Error(`Failed to create session: ${res.status}`)
    return res.json()
  }

  streamMessage(
    message: string,
    onToken: (token: string) => void,
    onDone: () => void,
    onHandoff: () => void,
    onError: (err: Error) => void,
  ): () => void {
    const params = new URLSearchParams({
      token: this.token,
      visitorId: this.visitorId,
      message: encodeURIComponent(message),
    })
    const url = `${this.baseUrl}/widget/message/stream?${params}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.token !== undefined) onToken(data.token)
        else if (data.done) {
          onDone()
          es.close()
        } else if (data.handoff) {
          onHandoff()
          es.close()
        }
      } catch {
        onError(new Error('Failed to parse SSE data'))
        es.close()
      }
    }

    es.onerror = () => {
      onError(new Error('SSE connection error'))
      es.close()
    }

    return () => es.close()
  }
}
