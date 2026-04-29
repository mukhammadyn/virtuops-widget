# VirtuOps Widget

Embeddable AI chat widget for [VirtuOps](https://virtuops.io) — drop one snippet into any website to give visitors a fully-styled chat with AI responses, live operator handoff, and dashboard-driven branding.

This is a pnpm monorepo with two packages:

| Package | Purpose |
|---|---|
| [`@virtuops/widget`](./packages/widget) | Framework-agnostic Web Component (`<virtuops-chat>`). Use this from plain HTML, Vue, Svelte, or any non-React app. |
| [`@virtuops/widget-react`](./packages/widget-react) | Thin React wrapper — exposes `<Chat token="…" />`. |

## Quick start (HTML)

```html
<script>
  window.VirtuOps = { token: "wgt_your_token_here" };
</script>
<script src="https://unpkg.com/@virtuops/widget"></script>
```

Get your token from the VirtuOps dashboard → Bot → Deploy → Web Widget → Generate token.

## Local development

```bash
pnpm install
pnpm --filter @virtuops/widget dev    # local dev server with hot reload
pnpm -r build                          # build all packages
pnpm -r type-check                     # type-check all packages
```

The dev server picks up `packages/widget/src/dev.ts` for a standalone test page; `test.html` at the repo root is a static smoke-test you can open in a browser after `pnpm build`.

## Project structure

```
packages/
  widget/                 — core Web Component, all UI + transport
    src/
      api/                — REST client (config, history, session, messages) + Socket.IO client
      components/         — ChatWidget, ChatWindow, Header, MessageList, MessageInput, …
      hooks/              — useConfig, useChat
      web-component/      — <virtuops-chat> custom element + Shadow DOM mount
      styles/widget.css   — scoped CSS (theme + bubble-size variants)
  widget-react/           — React JSX wrapper around <virtuops-chat>
```

## Releasing

Both packages share a major/minor cadence. To publish:

```bash
# 1. core widget (widget-react depends on it)
cd packages/widget
pnpm publish --access public

# 2. React wrapper — pnpm rewrites workspace:* into the published version
cd ../widget-react
pnpm publish --access public
```

`prepublishOnly` runs the build automatically before publish.

## License

MIT
