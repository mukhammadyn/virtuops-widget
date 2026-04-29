# @virtuops/widget

Embeddable AI chat widget for [VirtuOps](https://virtuops.io). Drop one snippet into any HTML page and your visitors get a fully-styled chat with AI responses, live operator handoff, and real-time config updates from your dashboard.

- **Framework-agnostic** — ships as a native Web Component (`<virtuops-chat>`)
- **Shadow DOM isolated** — no CSS leaks in or out
- **Real-time** — operator replies stream in via WebSocket; config changes apply live
- **Customizable** — theme, colors, position, suggested questions, allowed origins, file upload, voice, and more

## Install

### CDN (recommended)

```html
<script>
  window.VirtuOps = { token: "wgt_your_token_here" };
</script>
<script src="https://unpkg.com/@virtuops/widget"></script>
```

That's it. The widget mounts itself before `</body>` with sensible defaults; everything else is configured from your VirtuOps dashboard.

### npm

```bash
npm install @virtuops/widget
# or
pnpm add @virtuops/widget
```

```ts
import "@virtuops/widget";

// Either declarative — same as the CDN form:
window.VirtuOps = { token: "wgt_your_token_here" };

// Or imperative:
window.VirtuOpsWidget.init({ token: "wgt_your_token_here" });
```

The package registers a `<virtuops-chat>` custom element. You can also drop it directly:

```html
<virtuops-chat token="wgt_your_token_here"></virtuops-chat>
```

## React

If you're in a React app, prefer [`@virtuops/widget-react`](https://www.npmjs.com/package/@virtuops/widget-react):

```bash
npm install @virtuops/widget-react
```

```tsx
import { Chat } from "@virtuops/widget-react";

export default function App() {
  return <Chat token="wgt_your_token_here" />;
}
```

## Configuration

You **don't configure the widget from code** — all branding and behavior lives on your bot in the VirtuOps dashboard. The widget fetches the live config on every page load and re-applies updates in real time when you save changes.

Available knobs (set them in the dashboard):

| | |
|---|---|
| **Branding** | bot name, primary color, theme (light / dark / auto), position, bubble size, header title & subtitle, avatar, launcher icon, hide "powered by" |
| **Behavior** | welcome message, input placeholder, suggested questions, language lock, offline message, auto-open + delay |
| **Features** | enable file upload, enable voice |
| **Security** | allowed origins (domain whitelist) |

## Self-hosted backend

By default the widget talks to `https://api.virtuops.io`. Self-hosted deployments override the API URL:

```html
<script>
  window.VirtuOps = {
    token: "wgt_your_token_here",
    apiUrl: "https://api.your-company.com"
  };
</script>
<script src="https://unpkg.com/@virtuops/widget"></script>
```

## Browser support

Modern evergreen browsers with native Custom Elements support — Chrome, Firefox, Safari, Edge. No IE.

## License

MIT © VirtuOps
