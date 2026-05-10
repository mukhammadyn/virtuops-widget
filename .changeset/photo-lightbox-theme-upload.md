---
"@virtuops/widget": minor
"@virtuops/widget-react": minor
---

Added photo lightbox: clicking any image in the chat opens a full-screen preview with navigation arrows, counter, caption, and Esc/click-outside to close.

Added `theme` prop override: passing `theme="light"`, `theme="dark"`, or `theme="auto"` via `window.VirtuOps`, `VirtuOpsWidget.init()`, web-component attribute, or React `<Chat theme="..." />` now takes priority over the backend config theme.

Added file/voice attachment support: visitors can upload images, audio, and video directly in the chat; attachments are previewed in the message bubble and forwarded to the AI stream.

Fixed photos disappearing after page refresh: the history endpoint now restores `segments`, `media`, and `attachments` on reload so previously sent images remain visible.
