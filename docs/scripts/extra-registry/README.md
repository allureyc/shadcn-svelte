# Extra Registry — Create Preview Templates

**Goal:** Make the `create/preview` and `create/preview-02` template cards
installable via `shadcn-svelte add`, without modifying any official source
file. Every artefact in this folder is additive so upstream syncs from
`shadcn-svelte/shadcn-svelte` never conflict.

## What this adds

| File | Purpose |
| --- | --- |
| `config.ts` | Where the template sources live + tag derivation rules. |
| `shared.ts` | Pure helpers (meta IO, import → deps, `cn-*` rewrite, alias rewrite). |
| `generate-meta.ts` | Creates / refreshes `<card>.meta.json` sidecars. |
| `build.ts` | Emits one `tpl-<group>-<slug>.json` per style and merges into the official `index.json`. |

## How it slots into the pipeline

```text
pnpm build:registry               # ← official (writes static/registry/styles/<style>/*)
tsx scripts/extra-registry/build  # ← THIS (appends extra items into the same dir)
pnpm build                        # ← official (svelte-kit / vite)
```

The extra build only **appends** to existing per-style `index.json` files and
writes new `tpl-*.json` items. It throws on any name / file collision so we
never silently shadow an official component.

## Local usage

```powershell
# from repo root
pnpm install

# (optional) generate meta.json sidecars for cards that don't have one yet
pnpm --filter docs exec tsx scripts/extra-registry/generate-meta.ts

# (optional) refresh derivable fields, preserving custom dependency lists
pnpm --filter docs exec tsx scripts/extra-registry/generate-meta.ts --force

# build official + extras
pnpm --filter docs build:registry
pnpm --filter docs exec tsx scripts/extra-registry/build.ts
```

After running you'll see new entries in
`docs/static/registry/styles/<style>/index.json` named
`tpl-preview-<slug>` and `tpl-preview-02-<slug>`.

## Consumer install

Once `xxx.io` serves `docs/static` (same layout as the official site), users
can do either:

```bash
# Set their components.json registry → your site, then:
pnpm dlx shadcn-svelte add tpl-preview-visitors
pnpm dlx shadcn-svelte add tpl-preview-02-cover-art

# Or one-shot via URL (no registry change required):
pnpm dlx shadcn-svelte add https://xxx.io/registry/styles/nova/tpl-preview-visitors.json
```

Installed files land at `<components alias>/<group>/<slug>.svelte`, e.g.
`$lib/components/preview/visitors.svelte`.

## Customising a card

Edit / commit a `<card>.meta.json` next to the `.svelte` file:

```jsonc
{
  "title": "Visitors Card",
  "description": "Active visitors area chart with trend indicator.",
  "author": "you <https://xxx.io>",
  "categories": ["analytics", "chart", "preview"],
  "dependencies": ["layerchart", "d3-shape", "d3-scale"]
}
```

Any field omitted falls back to a value derived from the file name + group.

## Caveats

* Some cards import docs-site internals such as `$lib/components/icon-placeholder/...`.
  These are reported as warnings during build; consumers will need to provide
  equivalents themselves, or you can inline replacements before tagging.
* The `cn-*` class rewriting mirrors the official transformer but is an
  independent copy. If upstream meaningfully changes the algorithm, refresh
  `loadStyleMap` / `applyStyleMap` in `shared.ts`.

## CI

Two workflows back this up — both are net-new files, so no upstream conflicts:

* `.github/workflows/registry-extra-tag.yml` — on pushes/PRs that touch the
  card sources or this folder: auto-generates missing `meta.json`s, runs the
  full build, and (on `main`) commits the generated meta files back.
* `.github/workflows/deploy-custom-registry.yml` — full build + deploy of your
  forked site, mirroring `deploy-prod.yml` but with the extra build step
  wedged in. Edit the deploy step to match your hosting provider.
