// Register web component
import './web-component/index'

// Public types
export type { WidgetConfig, Message, ChatProps } from './types'
export { ChatWidget } from './components/ChatWidget'

// IIFE global API — auto-init from declarative config and expose window.VirtuOpsWidget
declare global {
  interface Window {
    VirtuOps?: { token: string; apiUrl?: string }
    VirtuOpsWidget?: {
      init(opts: { token: string; apiUrl?: string }): void
    }
  }
}

function initWidget(token: string, apiUrl?: string) {
  const el = document.createElement('virtuops-chat')
  el.setAttribute('token', token)
  if (apiUrl) el.setAttribute('api-url', apiUrl)
  document.body.appendChild(el)
}

window.VirtuOpsWidget = { init: ({ token, apiUrl }) => initWidget(token, apiUrl) }

// Declarative: <script>window.VirtuOps = { token: "wgt_xxx" }</script>
function tryAutoInit() {
  if (window.VirtuOps?.token) {
    initWidget(window.VirtuOps.token, window.VirtuOps.apiUrl)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryAutoInit)
} else {
  tryAutoInit()
}
