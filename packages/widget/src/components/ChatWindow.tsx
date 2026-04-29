import { Header } from './Header'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import type { Message, WidgetConfig } from '../types'

interface ChatWindowProps {
  config: WidgetConfig
  messages: Message[]
  isStreaming: boolean
  isOpen: boolean
  onClose: () => void
  onSend: (text: string) => void
}

const VirtuOpsLogo = () => (
  <svg
    width="20"
    height="16"
    viewBox="0 0 96 76"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.16426 0.436751C1.15688 1.62095 -1.62089 6.67061 0.970528 11.6963C1.49369 12.7114 4.46149 16.2363 7.56549 19.5295C19.8637 32.5778 22.5623 36.7925 29.8617 54.3458C34.1575 64.676 36.4047 69.076 38.8277 71.9001C43.0535 76.8244 48.9868 77.3626 53.669 73.2451C55.8196 71.3545 57.5272 68.7336 62.9313 59.0283C70.6223 45.216 74.29 39.6369 80.8159 31.824C82.5759 29.7168 83.9369 27.9143 83.8403 27.818C83.4381 27.4148 79.3246 28.6723 76.3283 30.114C71.9304 32.2304 68.0912 35.2402 60.7301 42.3412C52.7594 50.0311 50.8328 50.9002 46.8886 48.5852C43.2288 46.4375 42.0164 43.9295 35.813 25.6754C33.3844 18.5296 30.7857 11.4696 30.038 9.98636C28.3847 6.70701 25.9695 3.95386 23.4462 2.47293C19.7316 0.292988 12.4884 -0.6129 7.16426 0.436751ZM79.6688 0.636268C72.4241 2.46509 68.6994 5.91217 64.1967 14.9558C62.2108 18.9448 51.2515 44.6442 51.2515 45.3123C51.2515 46.5647 54.1043 44.206 61.9982 36.4281C73.5215 25.0736 78.1564 21.8431 86.5863 19.2899C89.9043 18.285 89.9682 18.2352 92.1552 14.9835C95.3029 10.3038 95.9646 8.851 95.9991 6.54389C96.0368 4.05247 94.9228 2.37109 92.4027 1.11502C90.0506 -0.057663 83.4078 -0.307404 79.6688 0.636268Z"
      fill="url(#vo-logo-gradient)"
    />
    <defs>
      <linearGradient
        id="vo-logo-gradient"
        x1="4.83131"
        y1="1.84311"
        x2="52.5482"
        y2="73.8925"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#4F46E5" />
        <stop offset="0.5" stopColor="#6366F1" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
  </svg>
)

export function ChatWindow({
  config,
  messages,
  isStreaming,
  isOpen,
  onClose,
  onSend,
}: ChatWindowProps) {
  const position = config.position ?? 'bottom-right'
  const side = position === 'bottom-left' ? 'left: 24px' : 'right: 24px'
  const botName = config.botName ?? 'Assistant'
  const headerTitle = config.headerTitle?.trim() || botName

  return (
    <>
      <style>{`.vo-window { ${side}; }`}</style>
      <div
        className={`vo-window ${isOpen ? 'vo-window--open' : ''}`}
        role="dialog"
        aria-label={`Chat with ${headerTitle}`}
        aria-hidden={!isOpen}
      >
        <Header
          title={headerTitle}
          subtitle={config.headerSubtitle}
          avatarUrl={config.avatarUrl}
          onClose={onClose}
        />
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          suggestedQuestions={config.suggestedQuestions}
          onSuggest={onSend}
        />
        {!config.hidePoweredBy && (
          <div className="vo-powered">
            <VirtuOpsLogo />
            Powered by{' '}
            <a href="https://virtuops.io" target="_blank" rel="noopener noreferrer">
              VirtuOps
            </a>
          </div>
        )}
        <MessageInput
          onSend={onSend}
          isStreaming={isStreaming}
          placeholder={config.placeholderText ?? 'Ask me anything...'}
          enableFileUpload={config.enableFileUpload}
          enableVoice={config.enableVoice}
        />
      </div>
    </>
  )
}
