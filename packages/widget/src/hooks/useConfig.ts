import { useState, useEffect } from 'react'
import type { WidgetConfig } from '../types'
import type { WidgetApiClient } from '../api/client'
import type { WidgetSocket } from '../api/socket'

export function useConfig(
  client: WidgetApiClient,
  shadowRoot: ShadowRoot | null,
  socket: WidgetSocket,
) {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .getConfig()
      .then((cfg) => {
        if (cancelled) return
        setConfig(cfg)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client])

  // Subscribe to live config updates pushed by the gateway whenever an
  // operator saves changes in the dashboard. The payload carries the full
  // merged config — no refetch needed.
  useEffect(() => {
    const off = socket.onConfigUpdated((cfg) => {
      client.primeConfigCache(cfg)
      setConfig(cfg)
    })
    return off
  }, [client, socket])

  // Apply visual config to the shadow host as CSS custom properties + data
  // attributes. Reactive — re-runs whenever the config object changes, so
  // operator dashboard saves take effect without a page reload.
  useEffect(() => {
    if (!config || !shadowRoot) return
    const host = shadowRoot.host as HTMLElement

    if (config.primaryColor) {
      host.style.setProperty('--vo-primary', config.primaryColor)
    } else {
      host.style.removeProperty('--vo-primary')
    }

    setOrRemoveAttr(host, 'data-theme', config.theme)
    setOrRemoveAttr(host, 'data-bubble-size', config.bubbleSize)
    setOrRemoveAttr(host, 'data-position', config.position)
    setOrRemoveAttr(host, 'lang', config.language)
  }, [config, shadowRoot])

  return { config, loading, error }
}

function setOrRemoveAttr(el: HTMLElement, name: string, value: string | undefined) {
  if (value && value.length > 0) el.setAttribute(name, value)
  else el.removeAttribute(name)
}
