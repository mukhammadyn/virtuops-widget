import '@virtuops/widget'

export interface ChatProps {
  token: string
  apiUrl?: string
}

export function Chat({ token, apiUrl }: ChatProps) {
  return <virtuops-chat token={token} api-url={apiUrl} />
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'virtuops-chat': { token: string; 'api-url'?: string }
    }
  }
}
