/**
 * Shared configuration for the custom (non-official) registry extension.
 *
 * IMPORTANT: This entire folder is an extension. Nothing here is referenced
 * by the official build pipeline. Upstream syncs should never conflict.
 */

import path from "node:path";

/**
 * Source directories scanned for installable template cards.
 * Each `.svelte` file directly under these roots becomes one registry item.
 */
export const TEMPLATE_SOURCES = [
	{
		// Friendly group identifier, becomes part of the registry item name.
		group: "preview",
		dir: path.resolve("src", "lib", "registry", "examples", "create", "preview", "cards"),
	},
	{
		group: "preview-02",
		dir: path.resolve("src", "lib", "registry", "examples", "create", "preview-02", "cards"),
	},
	{
		// Community / user-contributed cards. Drop `.svelte` files here and
		// (re)run `build-gallery.ts` to see them appear next to the official
		// preview cards. See `cards/README.md` for conventions.
		group: "custom",
		dir: path.resolve("src", "lib", "registry", "examples", "custom", "cards"),
	},
] as const;

/** Prefix used in every generated registry item's `name`. */
export const ITEM_NAME_PREFIX = "tpl";

/**
 * Multi-file example pages (each is a folder under
 * `src/routes/(app)/(layout)/examples/`). Every file inside the folder is
 * shipped verbatim under the consumer's `src/routes/example-<name>/` tree,
 * so a single `add` call installs a working page + its components + data.
 */
export const EXAMPLE_SOURCES = [
	{
		group: "example",
		// Directory containing one subfolder per example (tasks, dashboard, …).
		root: path.resolve("src", "routes", "(app)", "(layout)", "examples"),
		// Categories applied to every produced item.
		categories: ["example", "page"],
	},
] as const;

/** Example folders to skip (e.g. broken / docs-only). */
export const EXCLUDED_EXAMPLES: ReadonlySet<string> = new Set([
	// Only ship `tasks` for now — the others reference docs-internal
	// components (`$lib/components/spinner.svelte`, `metadata.svelte`)
	// that won't resolve on the consumer side.
	"authentication",
	"dashboard",
	"playground",
]);

/** Output base — must match official build output so we extend it. */
export const REGISTRY_OUTPUT_BASE = path.resolve("static", "registry");

/** Where official build wrote per-style index.json + item JSONs. */
export const stylesOutputDir = (style: string) =>
	path.join(REGISTRY_OUTPUT_BASE, "styles", style);

/** Path to the project-internal style CSS used for `cn-*` class rewriting. */
export const styleCssPath = (style: string) =>
	path.resolve("src", "lib", "registry", "styles", `style-${style}.css`);

/**
 * Aliases must mirror what the official build uses, so import paths inside
 * template source files get rewritten to the same alias placeholders the CLI
 * will resolve on a consumer's machine.
 *
 * Keep in sync with the object literal in `docs/scripts/build-registry.ts`
 * (only the values matter, not the schema itself).
 */
export const REGISTRY_ALIASES = {
	lib: "$lib/registry/lib",
	ui: "$lib/registry/ui",
	components: "./components",
	hooks: "$lib/registry/hooks",
	utils: "$lib/utils",
} as const;

/** Tag derivation rules — runs against every card's file name. */
export const TAG_RULES: Array<{ test: RegExp; tag: string }> = [
	{ test: /chart/i, tag: "chart" },
	{ test: /empty-/i, tag: "empty-state" },
	{ test: /sidebar|nav|menu/i, tag: "navigation" },
	{ test: /loading|skeleton/i, tag: "loading" },
	{ test: /form|input|feedback/i, tag: "form" },
	{ test: /payment|invoice|transaction|payout|stock|saving|dividend/i, tag: "finance" },
	{ test: /fitness|sleep|health/i, tag: "health" },
	{ test: /github|contribut/i, tag: "developer" },
	{ test: /notification|settings|preference|shortcut/i, tag: "settings" },
	{ test: /upload|file|cover/i, tag: "media" },
	{ test: /team|invite|member|profile|social/i, tag: "collaboration" },
];

/**
 * Cards whose source depends on docs-only internals we can't auto-inline
 * (e.g. design-system context, font registry). Skipped during build so the
 * published registry never produces broken installs.
 */
export const EXCLUDED_SLUGS: ReadonlySet<string> = new Set([
	"preview/typography-specimen",
	"preview/style-overview",
]);

/** Import specifier of the docs-internal IconPlaceholder component. */
export const ICON_PLACEHOLDER_IMPORT = "$lib/components/icon-placeholder/icon-placeholder.svelte";
