/**
 * Lightweight, dependency-free helpers shared by the extra-registry scripts.
 *
 * Kept intentionally separate from `docs/scripts/registry.ts` so that
 * upstream changes to the official crawler never conflict with this file.
 */

import fs from "node:fs";
import path from "node:path";

import { TAG_RULES } from "./config.js";

// ---------------------------------------------------------------------------
// File-name → metadata helpers
// ---------------------------------------------------------------------------

/** `weekly-fitness-summary` → `Weekly Fitness Summary` */
export function toTitleCase(slug: string): string {
	return slug
		.split("-")
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

/** Derives a sensible category list from the file slug + group. */
export function deriveTags(slug: string, group: string): string[] {
	const tags = new Set<string>(["create", group, "card"]);
	for (const rule of TAG_RULES) if (rule.test.test(slug)) tags.add(rule.tag);
	return [...tags];
}

// ---------------------------------------------------------------------------
// Meta JSON sidecar — `<card>.meta.json`
// ---------------------------------------------------------------------------

export interface CardMeta {
	title?: string;
	description?: string;
	author?: string;
	categories?: string[];
	dependencies?: string[];
	devDependencies?: string[];
	registryDependencies?: string[];
}

export function metaPathFor(svelteFile: string): string {
	return svelteFile.replace(/\.svelte$/, ".meta.json");
}

export function readMeta(svelteFile: string): CardMeta | undefined {
	const p = metaPathFor(svelteFile);
	if (!fs.existsSync(p)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(p, "utf8")) as CardMeta;
	} catch (e) {
		throw new Error(`Failed to parse ${p}: ${(e as Error).message}`);
	}
}

// ---------------------------------------------------------------------------
// Import → registryDependencies extraction
//
// Regex-based on purpose: avoids pulling in `acorn` / `svelte/compiler` and
// keeps this script independent of the official crawler.
// ---------------------------------------------------------------------------

const IMPORT_RE = /from\s+["']([^"']+)["']/g;

export interface ParsedDeps {
	registryDependencies: string[];
	/** Imports referencing docs-site internals that won't exist for consumers. */
	internalWarnings: string[];
}

export function parseDeps(source: string): ParsedDeps {
	const reg = new Set<string>();
	const warn = new Set<string>();
	let m: RegExpExecArray | null;
	while ((m = IMPORT_RE.exec(source)) !== null) {
		const spec = m[1];
		if (!spec.startsWith("$lib/")) continue;
		if (spec === "$lib/utils.js" || spec === "$lib/utils") continue;

		if (spec.startsWith("$lib/registry/ui/")) {
			// $lib/registry/ui/<name>/...
			const name = spec.split("/")[3];
			if (name) reg.add(name);
		} else if (spec.startsWith("$lib/registry/hooks/")) {
			const tail = spec.split("/").slice(3).join("/");
			const name = tail.split("/")[0].replace(/\.svelte\.ts$|\.ts$|\.js$/, "");
			if (name) reg.add(name);
		} else if (spec.startsWith("$lib/registry/lib/")) {
			const tail = spec.split("/").slice(3).join("/");
			const name = tail.split("/")[0].replace(/\.ts$|\.js$/, "");
			if (name) reg.add(name);
		} else {
			// e.g. $lib/components/icon-placeholder — docs-internal, not part of registry.
			warn.add(spec);
		}
	}
	return { registryDependencies: [...reg], internalWarnings: [...warn] };
}

// ---------------------------------------------------------------------------
// Alias rewriting for emitted file `target`
// ---------------------------------------------------------------------------

/**
 * Rewrites `$lib/registry/...` import specifiers to alias placeholders the CLI
 * can resolve. Mirrors what `shadcn-svelte registry build` does internally so
 * we get equivalent output without re-invoking the CLI on every file.
 */
export function rewriteImports(
	source: string,
	aliases: { ui: string; hooks: string; lib: string }
): string {
	return source.replace(
		/(["'])\$lib\/registry\/(ui|hooks|lib)\//g,
		(_full, quote: string, kind: string) => {
			const replacement =
				kind === "ui" ? aliases.ui : kind === "hooks" ? aliases.hooks : aliases.lib;
			return `${quote}${replacement}/`;
		}
	);
}

// ---------------------------------------------------------------------------
// FS helpers
// ---------------------------------------------------------------------------

export function writeJson(file: string, data: unknown): void {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"), "utf8");
}

export function listSvelteCards(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isFile() && d.name.endsWith(".svelte"))
		.map((d) => path.join(dir, d.name))
		.sort();
}
