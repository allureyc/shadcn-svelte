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
] as const;

/** Prefix used in every generated registry item's `name`. */
export const ITEM_NAME_PREFIX = "tpl";

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
