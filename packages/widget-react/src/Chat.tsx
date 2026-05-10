import '@virtuops/widget'

export interface ChatProps {
  token: string
  apiUrl?: string
  /** Overrides the theme returned by the backend config. */
  theme?: 'light' | 'dark' | 'auto'
}

export function Chat({ token, apiUrl, theme }: ChatProps) {
  return <virtuops-chat token={token} api-url={apiUrl} theme={theme} />
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'virtuops-chat': {
        token: string
        'api-url'?: string
        theme?: 'light' | 'dark' | 'auto'
      }
    }
  }
}
