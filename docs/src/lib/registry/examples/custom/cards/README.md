# Custom Cards

Drop `.svelte` files here. Each file becomes:

- a **registry item** named `tpl-custom-<filename>` (installable via the CLI), and
- a **Gallery preview card** at `/gallery/#/card/tpl-custom-<filename>`.

This folder is part of the **extra-registry extension**: nothing here is touched
by upstream `shadcn-svelte` syncs, so contributions stay conflict-free.

## File conventions

| Filename | Becomes |
|---|---|
| `pricing-table.svelte` | `tpl-custom-pricing-table` |
| `hero-section.svelte` | `tpl-custom-hero-section` |

Use kebab-case. The slug = filename minus `.svelte`.

## Layout conventions

The Gallery renders your card inside a fixed-width design canvas:

- **Thumbnail** (`CardThumb.svelte`): 560 px canvas, auto-scaled + centered.
- **Detail page** (`Detail.svelte`): 720 px canvas (block), no auto-centering.

So if your card uses `max-w-*` and you want it horizontally centered on the
detail page, add `mx-auto` yourself:

```svelte
<Card.Root class="mx-auto w-full max-w-md"> … </Card.Root>
```

Full-width cards (`w-full` without `max-w-*`) need no extra alignment.

## Allowed imports

| Import | OK? | Notes |
|---|---|---|
| `$lib/registry/ui/<name>/index.js` | ✅ | Auto-added as `registryDependencies` |
| `$lib/registry/lib/*` / `$lib/registry/hooks/*` | ✅ | Same |
| `$lib/utils` | ✅ | Shadcn `cn()` helper |
| `@lucide/svelte/icons/*` | ✅ | Auto-added as npm `dependencies` |
| Plain npm packages | ⚠️ | Declare in sidecar `.meta.json` (`dependencies`) so CLI installs them |
| `$lib/components/...`, `$app/*` | ❌ | Docs-internal — won't exist on consumer machines |

## Sidecar metadata (optional)

Place a `<slug>.meta.json` next to your `.svelte`:

```json
{
  "title": "Pricing Table",
  "description": "Three-tier SaaS pricing with feature comparison.",
  "author": "@your-handle",
  "categories": ["custom", "marketing", "pricing"],
  "kind": "page",
  "dependencies": ["clsx"],
  "devDependencies": [],
  "registryDependencies": []
}
```

### `kind` — install target

| Value | Installs to | Use when |
|---|---|---|
| `"page"` *(default)* | `src/routes/<group>-<slug>/+page.svelte` | The card IS a complete page (full-bleed, owns its own layout). |
| `"block"` | `$lib/components/blocks/<group>-<slug>/<slug>.svelte` | The card is a reusable composition you want to import into your own routes. |

> Auto-scanning can't tell a "page" from a "composition" — set this
> explicitly when in doubt.

Without `meta.json`, the build derives a Title-Case title from the filename
and tags via [`docs/scripts/extra-registry/config.ts`](../../../../../../scripts/extra-registry/config.ts) `TAG_RULES`.

## Local workflow

```bash
# 1) Add / edit a .svelte here
# 2) Rebuild registry JSON + gallery
pnpm --filter docs exec tsx scripts/extra-registry/build.ts
pnpm --filter docs exec tsx scripts/extra-registry/build-gallery.ts

# 3) Preview locally
pnpm --filter docs dev
#    → http://localhost:5173/gallery/
```

After merge + deploy, the card's install URL on production becomes:

```
https://<your-deploy-domain>/registry/styles/nova/tpl-custom-<slug>.json
```

## Exclude a card

Edit [`docs/scripts/extra-registry/config.ts`](../../../../../../scripts/extra-registry/config.ts):

```ts
export const EXCLUDED_SLUGS: ReadonlySet<string> = new Set([
  "custom/work-in-progress",
]);
```
