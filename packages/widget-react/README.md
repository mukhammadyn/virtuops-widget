# @virtuops/widget-react

React wrapper for [`@virtuops/widget`](https://www.npmjs.com/package/@virtuops/widget) — embed the VirtuOps AI chat widget as a JSX component.

## Install

```bash
npm install @virtuops/widget-react
# or
pnpm add @virtuops/widget-react
```

`react` and `react-dom` (>=18) must be present in your app — they are peer dependencies.

## Usage

```tsx
import { Chat } from "@virtuops/widget-react";

export default function App() {
  return <Chat token="wgt_your_token_here" />;
}
```

That's the whole API surface. Branding, behavior, suggested questions, allowed origins — all configured from your VirtuOps dashboard, fetched at runtime, and updated in real time without a page reload.

## Self-hosted backend

```tsx
<Chat
  token="wgt_your_token_here"
  apiUrl="https://api.your-company.com"
/>
```

## Under the hood

This package registers the `<virtuops-chat>` Web Component (from `@virtuops/widget`) and renders it as a JSX-friendly element. The chat lives in its own Shadow DOM, so no CSS will bleed in or out of your app.

## License

MIT © VirtuOps
