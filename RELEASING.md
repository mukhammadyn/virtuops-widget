# Releasing

This monorepo uses [changesets](https://github.com/changesets/changesets) to version and publish packages. Read this before opening a PR or cutting a release.

## TL;DR

```bash
# After making changes that affect a package
pnpm changeset           # describe what changed; commit the generated file alongside your code
git push                 # PR as usual

# When the maintainer is ready to publish
pnpm version-packages    # bumps versions + writes CHANGELOGs from open changesets
git commit -am "chore: release"
git push
pnpm release             # builds + publishes to npm
git push --follow-tags
```

## Package layout

The two packages are **fixed in lockstep** — they always share the same version number. When one bumps, the other bumps too. This is configured in [`.changeset/config.json`](.changeset/config.json):

```json
"fixed": [["@virtuops/widget", "@virtuops/widget-react"]]
```

Why: `@virtuops/widget-react` is a thin React wrapper around `@virtuops/widget`'s web component. Pairing the versions gives users a single number to reason about — `0.4.2` of one is guaranteed to work with `0.4.2` of the other.

## When to add a changeset

**Add one** for any user-visible change to a published package:

- New feature or new prop / config field
- Bug fix that affects runtime behavior
- Breaking change to the public API or to dashboard config schema
- Performance improvement worth telling users about
- Dependency bump that changes browser/Node support

**Don't add one** for:

- Changes only to dev tooling, CI, repo READMEs, or `test.html`
- Changes to internal types that aren't re-exported
- Refactors with no behavior change
- Changes only to the `apps/backend` or `apps/dashboard` of the consumer monorepo (different repo, anyway)

If a PR touches both shipped code and tooling, add a changeset only for the shipped change.

## How to write a changeset

Run `pnpm changeset` and walk the prompt:

1. **Pick the packages affected.** Because `widget` and `widget-react` are fixed-linked, picking one auto-bumps the other — but still tick both if both actually changed in code, so the CHANGELOG entry lands in the right file.
2. **Pick the bump type.** See "Picking a bump" below.
3. **Write the summary.** Past-tense, user-facing. Examples:

   ```
   Added `bubbleSize` config (sm / md / lg) — sets window dimensions, launcher size, and bubble padding.
   ```

   ```
   Fixed empty assistant bubble lingering when the AI handed off mid-stream.
   ```

   ```
   BREAKING: Removed the `apiUrl` prop default. Callers must now pass it explicitly.
   ```

   The summary becomes the bullet point in CHANGELOG.md, so write it for the npm reader, not for the reviewer.

4. **Commit** the generated file in `.changeset/<random-slug>.md` along with your code changes. Reviewers should sanity-check this file the same way they review code.

## Picking a bump

We're pre-1.0 (`0.x.y`). Until we cut `1.0.0`:

- **patch** (`0.1.0` → `0.1.1`) — bug fixes, internal refactors with behavior preserved, doc-only changes that don't affect API
- **minor** (`0.1.0` → `0.2.0`) — new features, new props/config fields, **and any breaking change** (semver convention for 0.x)
- **major** — reserved for the `1.0.0` release; don't use it before then

**After 1.0.0** we follow regular semver:

- **patch** — bug fixes only, no new behavior
- **minor** — new features that are backwards-compatible
- **major** — breaking changes (removed/renamed props, changed defaults, dropped browser support, etc.)

When in doubt, **bump higher.** A wrong patch on a breaking change creates silent breakage for users; a wrong minor on a bug fix is harmless.

## First release (one-time bootstrap)

The very first `0.1.0` release is published **without** changesets — there's no prior version to bump from. After that, every release goes through the changesets flow below.

```bash
# From repo root:
pnpm install
pnpm build
pnpm -r publish --access public --no-git-checks   # only after npm login + virtuops org created
git tag v0.1.0 && git push --tags
```

If `pnpm changeset status` complains that "packages changed but no changesets found" right after this, that's expected — the diff against `main` includes the `package.json` updates that enabled publishing. Either commit them with an empty changeset (`pnpm changeset --empty`) or just merge to `main` and start the regular flow on the next change.

## Release flow (maintainer)

1. **Merge PRs** with their changesets to `main`. Changeset files accumulate in `.changeset/`.

2. **Bump + write CHANGELOGs:**

   ```bash
   pnpm version-packages
   ```

   This consumes all `.changeset/*.md` files, bumps `package.json` versions in both packages (in lockstep), and writes / updates `CHANGELOG.md` per package. The changeset files are deleted.

3. **Review the diff.** Open `packages/*/CHANGELOG.md` and the version bumps. Edit the changelog if a summary is unclear.

4. **Commit:**

   ```bash
   git add -A
   git commit -m "chore: release v$(cat packages/widget/package.json | jq -r .version)"
   ```

5. **Publish:**

   ```bash
   pnpm release
   ```

   This runs `pnpm build` and then `changeset publish`, which:
   - Publishes only packages whose version bumped (no-op for unchanged ones; with `fixed` linkage both always bump together)
   - Auto-rewrites `workspace:*` deps to the real published version in the tarball
   - Creates git tags for each published package
   - Respects `publishConfig.access: "public"` from `package.json`

6. **Push tags:**

   ```bash
   git push --follow-tags
   ```

7. **Smoke-test the published package:**

   ```bash
   mkdir /tmp/widget-test && cd /tmp/widget-test
   npm init -y
   npm install @virtuops/widget@latest
   node -e "import('@virtuops/widget').then(m => console.log(Object.keys(m)))"
   ```

   And via CDN (~5 min after publish):

   ```bash
   curl -I https://unpkg.com/@virtuops/widget@latest
   ```

## Pre-releases (alpha / beta / rc)

For risky changes you want to ship to a small audience before everyone:

```bash
pnpm changeset pre enter beta        # enter pre-release mode
pnpm changeset                       # describe the change as usual
pnpm version-packages                # produces 0.2.0-beta.0
pnpm release                         # publishes to npm with `beta` tag
# … iterate, gather feedback …
pnpm changeset pre exit              # leave pre-release mode
pnpm version-packages                # 0.2.0-beta.0 → 0.2.0
pnpm release                         # promotes beta → latest
```

Users opt in with `npm install @virtuops/widget@beta`. Don't enter `pre` mode unless you're prepared to ship multiple beta releases — entering and immediately exiting just adds noise.

## What can go wrong

- **`workspace:*` ended up in the published tarball.** It shouldn't — `pnpm publish` rewrites it. If you see it in `npm view @virtuops/widget-react@<v> dependencies`, the publish was wrong. Yank the version (`npm unpublish` within 72h) and re-cut.

- **Forgot to add a changeset.** No version bump, no CHANGELOG entry. To fix in a follow-up PR: add an empty changeset (`pnpm changeset --empty`) that explains what was missed. Or for the next real changeset, mention the prior change in the summary.

- **Published with broken build.** `prepublishOnly` runs `pnpm build` automatically before each publish, so this is unlikely — but if it happens, bump patch and re-publish. Don't try to overwrite a published version (npm forbids it).

- **Breaking change shipped as patch.** Apologize, follow up with a re-introduction of the old API as deprecated, and bump minor (or major after 1.0). Communicate via release notes.

- **`pnpm publish` says "must be logged in".** Run `npm login` (changesets uses npm credentials).

- **`pnpm publish` says 403 / 404 for scoped package.** The `virtuops` npm Org must exist and your user must be a member with publish rights. Check `npm org ls virtuops`.

## CI publishing (future)

Manual publishing is fine while the package is small. When release cadence picks up, switch to [changesets/action](https://github.com/changesets/action) — it auto-opens a "Version Packages" PR whenever changesets accumulate on `main`, and publishes to npm when that PR is merged. Two pieces are needed:

- `NPM_TOKEN` secret in the repo (an automation token with publish rights to `@virtuops`)
- `.github/workflows/release.yml` running `changesets/action@v1` with `publish: pnpm release`

That's a separate task — don't set it up until manual cadence has settled into a rhythm.

## Quick reference

| Task | Command |
|---|---|
| Add a changeset | `pnpm changeset` |
| See pending changesets | `pnpm changeset status` |
| Bump versions + write changelogs | `pnpm version-packages` |
| Build + publish to npm | `pnpm release` |
| Enter pre-release mode | `pnpm changeset pre enter <tag>` |
| Exit pre-release mode | `pnpm changeset pre exit` |
| Empty changeset (no version bump) | `pnpm changeset --empty` |
