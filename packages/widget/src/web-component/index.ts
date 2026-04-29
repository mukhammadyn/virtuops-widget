import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatWidget } from '../components/ChatWidget'
import widgetCss from '../styles/widget.css?inline'

class VirtuOpsChatElement extends HTMLElement {
  static observedAttributes = ['token', 'api-url']

  private root: ReactDOM.Root | null = null
  private shadow: ShadowRoot | null = null

  connectedCallback() {
    this.mount()
  }

  disconnectedCallback() {
    this.unmount()
  }

  attributeChangedCallback() {
    if (this.root) this.remount()
  }

  private mount() {
    if (this.shadow) return

    this.shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = widgetCss
    this.shadow.appendChild(style)

    const mountPoint = document.createElement('div')
    this.shadow.appendChild(mountPoint)

    this.root = ReactDOM.createRoot(mountPoint)
    this.render()
  }

  private unmount() {
    this.root?.unmount()
    this.root = null
    this.shadow = null
  }

  private remount() {
    this.render()
  }

  private render() {
    const token = this.getAttribute('token') ?? ''
    const apiUrl = this.getAttribute('api-url') ?? undefined
    this.root?.render(React.createElement(ChatWidget, { token, apiUrl, shadowRoot: this.shadow }))
  }
}

if (!customElements.get('virtuops-chat')) {
  customElements.define('virtuops-chat', VirtuOpsChatElement)
}
