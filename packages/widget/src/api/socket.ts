import { io, Socket } from 'socket.io-client'
import type { WidgetConfig } from '../types'

export interface OperatorMessageEvent {
  messageId?: string
  content: string
  operatorName?: string
  createdAt: string
}

interface ConnectedEvent {
  sessionId: string
}

export class WidgetSocket {
  private socket: Socket | null = null
  private operatorListeners = new Set<(msg: OperatorMessageEvent) => void>()
  private configListeners = new Set<(config: WidgetConfig) => void>()

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly visitorId: string,
  ) {}

  connect() {
    if (this.socket) return
    this.socket = io(`${this.baseUrl}/widget`, {
      auth: { token: this.token, visitorId: this.visitorId },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.on('connected', (_data: ConnectedEvent) => {
      // Handshake confirmed.
    })

    this.socket.on('operator_message', (msg: OperatorMessageEvent) => {
      this.operatorListeners.forEach((fn) => fn(msg))
    })

    this.socket.on('config_updated', (cfg: WidgetConfig) => {
      this.configListeners.forEach((fn) => fn(cfg))
    })
  }

  onOperatorMessage(fn: (msg: OperatorMessageEvent) => void): () => void {
    this.operatorListeners.add(fn)
    return () => {
      this.operatorListeners.delete(fn)
    }
  }

  onConfigUpdated(fn: (config: WidgetConfig) => void): () => void {
    this.configListeners.add(fn)
    return () => {
      this.configListeners.delete(fn)
    }
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.operatorListeners.clear()
    this.configListeners.clear()
  }
}
