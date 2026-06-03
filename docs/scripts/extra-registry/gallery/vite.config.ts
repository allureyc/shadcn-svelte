/**
 * Gallery Vite config. Independent of the official `docs/vite.config.ts`
 * (which is SvelteKit-flavoured). Builds a plain Svelte SPA into
 * `docs/static/gallery/` so it gets served alongside the JSON registry.
 *
 * Aliases shim out docs-only internals so the original card sources
 * (with their existing `IconPlaceholder`, `$app/*`, design-system imports)
 * compile cleanly in this standalone bundle.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const docsRoot = path.resolve(__dirname, "..", "..", "..");
const docsLib = path.resolve(docsRoot, "src", "lib");
const shimsDir = path.resolve(__dirname, "src", "shims");

export default defineConfig({
	root: __dirname,
	base: "./",
	// Serve docs/static/* during `vite dev` so the gallery SPA can resolve
	// `/registry/styles/<style>/<item>.json` against the real registry output
	// (same path layout as production, where docs and gallery share an origin).
	// `build` outputs into `docs/static/gallery/`, so production never sees this.
	publicDir: path.resolve(docsRoot, "static"),
	plugins: [
		tailwindcss(),
		svelte({
			// Don't force runes globally — third-party packages like
			// `@tabler/icons-svelte` still ship legacy-mode components.
			// Svelte 5 auto-detects runes per file from rune usage.
		}),
	],
	resolve: {
		alias: [
			// ---- docs-internal shims (highest priority) ----
			{
				find: "$lib/components/icon-placeholder/icon-placeholder.svelte",
				replacement: path.join(shimsDir, "icon-placeholder.svelte"),
			},
			{
				find: "$lib/features/design-system/index.js",
				replacement: path.join(shimsDir, "design-system.ts"),
			},
			{
				find: "$lib/features/design-system",
				replacement: path.join(shimsDir, "design-system.ts"),
			},
			{
				find: "$lib/registry/config.js",
				replacement: path.join(shimsDir, "registry-config.ts"),
			},
			{
				find: "$lib/fonts.js",
				replacement: path.join(shimsDir, "fonts.ts"),
			},
			// SvelteKit special imports
			{ find: "$app/environment", replacement: path.join(shimsDir, "app-environment.ts") },
			{ find: "$app/state", replacement: path.join(shimsDir, "app-state.ts") },
			{ find: "$app/stores", replacement: path.join(shimsDir, "app-state.ts") },
			{ find: "$app/navigation", replacement: path.join(shimsDir, "app-navigation.ts") },
			{ find: "$app/forms", replacement: path.join(shimsDir, "app-navigation.ts") },
			// ---- generic $lib fallthrough → docs/src/lib ----
			{ find: /^\$lib$/, replacement: docsLib },
			{ find: /^\$lib\//, replacement: docsLib + "/" },
		],
	},
	build: {
		outDir: path.resolve(docsRoot, "static", "gallery"),
		emptyOutDir: true,
		// SPA — single chunk strategy keeps DX simple, lazy chunks for cards.
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("/cards/") && id.endsWith(".svelte")) return;
				},
			},
		},
	},
});
