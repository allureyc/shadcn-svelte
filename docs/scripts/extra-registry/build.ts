/**
 * Build extra registry items for the "create" preview/preview-02 templates and
 * inject them into the already-built official registry output.
 *
 * Run AFTER the official `pnpm build:registry`:
 *   tsx scripts/extra-registry/build.ts
 *
 * Does NOT modify any official source files.
 * Does NOT overwrite any official item file (collisions throw).
 */

import fs from "node:fs";
import path from "node:path";

import { PRESET_STYLES } from "shadcn-svelte/preset";
import {
	registryIndexSchema,
	registryItemSchema,
	type RegistryIndexItem,
	type RegistryItem,
	type RegistryItemFile,
} from "shadcn-svelte/schema";

import {
	EXAMPLE_SOURCES,
	EXCLUDED_EXAMPLES,
	EXCLUDED_SLUGS,
	ICON_PLACEHOLDER_IMPORT,
	ITEM_NAME_PREFIX,
	REGISTRY_ALIASES,
	TEMPLATE_SOURCES,
	stylesOutputDir,
	styleCssPath,
} from "./config.js";
import {
	deriveTags,
	listSvelteCards,
	parseDeps,
	readMeta,
	rewriteImports,
	toTitleCase,
	writeJson,
} from "./shared.js";
import { ICON_PLACEHOLDER_SHIM } from "./shims.js";
import { applyStyleMap, loadStyleMap } from "./style-transform.js";
import { generateMeta } from "./generate-meta.js";

const log = (m: string) => console.log(`[extra-registry]: ${m}`);

interface TemplateRecord {
	name: string;
	slug: string;
	group: string;
	filepath: string;
	source: string;
}

function collectTemplates(): TemplateRecord[] {
	const out: TemplateRecord[] = [];
	const seen = new Set<string>();
	for (const { group, dir } of TEMPLATE_SOURCES) {
		for (const filepath of listSvelteCards(dir)) {
			const slug = path.basename(filepath, ".svelte");
			const name = `${ITEM_NAME_PREFIX}-${group}-${slug}`;
			if (seen.has(name)) {
				throw new Error(`Duplicate template name produced: ${name}`);
			}
			seen.add(name);
			out.push({
				name,
				slug,
				group,
				filepath,
				source: fs.readFileSync(filepath, "utf8"),
			});
		}
	}
	return out;
}

// ─── Multi-file examples (folders under src/routes/.../examples/<name>) ────

interface ExampleRecord {
	name: string;
	slug: string;
	group: string;
	dir: string;
	files: Array<{ relPath: string; source: string }>;
	categories: readonly string[];
}

const EXAMPLE_FILE_RE = /\.(svelte|ts|js)$/;

function walkFiles(root: string): string[] {
	const out: string[] = [];
	const stack = [root];
	while (stack.length) {
		const cur = stack.pop()!;
		for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
			const full = path.join(cur, ent.name);
			if (ent.isDirectory()) stack.push(full);
			else if (ent.isFile() && EXAMPLE_FILE_RE.test(ent.name)) out.push(full);
		}
	}
	return out.sort();
}

function collectExamples(): ExampleRecord[] {
	const out: ExampleRecord[] = [];
	const seen = new Set<string>();
	for (const { group, root, categories } of EXAMPLE_SOURCES) {
		if (!fs.existsSync(root)) continue;
		for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
			if (!ent.isDirectory()) continue;
			const slug = ent.name;
			if (EXCLUDED_EXAMPLES.has(slug)) continue;
			const dir = path.join(root, ent.name);
			const files = walkFiles(dir).map((fp) => ({
				relPath: path.relative(dir, fp).split(path.sep).join("/"),
				source: fs.readFileSync(fp, "utf8"),
			}));
			if (files.length === 0) continue;
			const name = `${ITEM_NAME_PREFIX}-${group}-${slug}`;
			if (seen.has(name)) throw new Error(`Duplicate example name: ${name}`);
			seen.add(name);
			out.push({ name, slug, group, dir, files, categories });
		}
	}
	return out;
}

function toExampleItem(
	rec: ExampleRecord,
	styleMap: Record<string, string>
): { item: RegistryItem; warnings: string[] } {
	const allReg = new Set<string>();
	const allWarn = new Set<string>();
	const installDir = `${rec.group}-${rec.slug}`;
	const outFiles: RegistryItemFile[] = [];

	for (const f of rec.files) {
		const { registryDependencies, internalWarnings } = parseDeps(f.source);
		registryDependencies.forEach((d) => allReg.add(d));
		internalWarnings.forEach((w) => allWarn.add(w));

		let content = applyStyleMap(f.source, styleMap);
		content = rewriteImports(content, REGISTRY_ALIASES);

		// File type: .svelte/.ts under a route folder install as registry:page
		// so the CLI places them under `src/routes/...`. Sibling .ts / data
		// files come along with their relative paths intact.
		outFiles.push({
			content,
			type: "registry:page",
			target: `${installDir}/${f.relPath}`,
		});
	}

	const item: RegistryItem = registryItemSchema.parse({
		name: rec.name,
		type: "registry:block",
		title: toTitleCase(rec.slug),
		description: `"${rec.slug}" example page from the shadcn-svelte docs site, installable as a self-contained SvelteKit route.`,
		categories: [...rec.categories, rec.slug],
		registryDependencies: [...allReg],
		files: outFiles,
	});

	const warnings = [...allWarn].map(
		(spec) => `  ⚠ ${rec.name}: import "${spec}" is docs-internal — consumers will need to provide it.`
	);
	return { item, warnings };
}

function toRegistryItem(
	rec: TemplateRecord,
	styleMap: Record<string, string>
): { item: RegistryItem; warnings: string[] } {
	const meta = readMeta(rec.filepath);
	const { registryDependencies, internalWarnings } = parseDeps(rec.source);

	// 1) cn-* rewrite (per-style), 2) alias rewrite for end-consumer imports.
	let content = applyStyleMap(rec.source, styleMap);
	content = rewriteImports(content, REGISTRY_ALIASES);

	const kind = meta?.kind ?? "page";
	const pageTarget = `${rec.group}-${rec.slug}/+page.svelte`;
	const blockDir = `blocks/${rec.group}-${rec.slug}`;
	const blockTarget = `${blockDir}/${rec.slug}.svelte`;

	const files: RegistryItemFile[] = [];

	// Auto-shim docs-internal IconPlaceholder so installed templates are
	// self-contained (lucide-only, matches CLI's default `iconLibrary`).
	const usesIconPlaceholder = content.includes(ICON_PLACEHOLDER_IMPORT);
	if (usesIconPlaceholder) {
		const shimRel =
			kind === "page"
				? `${rec.group}-${rec.slug}/_internal/icon-placeholder.svelte`
				: `${blockDir}/_internal/icon-placeholder.svelte`;
		content = content.replace(
			/(["'])\$lib\/components\/icon-placeholder\/icon-placeholder\.svelte\1/g,
			`"./_internal/icon-placeholder.svelte"`
		);
		files.push({
			content: ICON_PLACEHOLDER_SHIM,
			type: kind === "page" ? "registry:page" : "registry:component",
			target: shimRel,
		});
	}

	// `kind: "page"` installs to `src/routes/...`; `kind: "block"` installs
	// to `$lib/components/blocks/...` so it can be imported into any route.
	files.push(
		kind === "page"
			? { content, type: "registry:page", target: pageTarget }
			: { content, type: "registry:component", target: blockTarget }
	);

	const item: RegistryItem = registryItemSchema.parse({
		name: rec.name,
		type: "registry:block",
		title: meta?.title ?? toTitleCase(rec.slug),
		description:
			meta?.description ??
			`${toTitleCase(rec.slug)} template card from the "${rec.group}" create preview.`,
		author: meta?.author,
		categories: meta?.categories ?? deriveTags(rec.slug, rec.group),
		dependencies: meta?.dependencies,
		devDependencies: meta?.devDependencies,
		registryDependencies: [
			...new Set([...(meta?.registryDependencies ?? []), ...registryDependencies]),
		],
		files,
	});

	// Drop warnings we've now auto-shimmed away.
	const warnings = internalWarnings
		.filter((spec) => !(usesIconPlaceholder && spec === ICON_PLACEHOLDER_IMPORT))
		.map(
			(spec) =>
				`  ⚠ ${rec.name}: import "${spec}" is docs-internal — consumers will need to provide it.`
		);
	return { item, warnings };
}

async function injectStyle(
	style: string,
	templates: TemplateRecord[],
	examples: ExampleRecord[]
): Promise<{ added: number; warnings: string[] }> {
	const outDir = stylesOutputDir(style);
	const indexPath = path.join(outDir, "index.json");

	if (!fs.existsSync(indexPath)) {
		throw new Error(
			`Official registry index not found at ${indexPath}. Run \`pnpm build:registry\` first.`
		);
	}

	const styleMap = loadStyleMap(styleCssPath(style));

	// Read the official index just for collision detection — we no longer write back to it.
	const officialIndex = registryIndexSchema.parse(JSON.parse(fs.readFileSync(indexPath, "utf8")));
	const existingNames = new Set(officialIndex.map((i) => i.name));

	const allWarnings: string[] = [];
	const newIndexEntries: RegistryIndexItem[] = [];

	const built: Array<{ item: RegistryItem; warnings: string[] }> = [
		...templates.map((rec) => toRegistryItem(rec, styleMap)),
		...examples.map((rec) => toExampleItem(rec, styleMap)),
	];

	for (const { item, warnings } of built) {
		if (existingNames.has(item.name)) {
			throw new Error(
				`Name collision in style "${style}": "${item.name}" already exists in official index.`
			);
		}
		allWarnings.push(...warnings);

		const itemFile = path.join(outDir, `${item.name}.json`);
		if (fs.existsSync(itemFile)) {
			throw new Error(`Output collision: ${itemFile} already exists.`);
		}
		writeJson(itemFile, item);

		newIndexEntries.push({
			name: item.name,
			type: item.type,
			title: item.title,
			description: item.description,
			author: item.author,
			dependencies: item.dependencies,
			devDependencies: item.devDependencies,
			registryDependencies: item.registryDependencies,
			meta: item.meta,
			relativeUrl: `${item.name}.json`,
		});
	}

	// Write our own overlay index rather than mutating the official index.json.
	// This keeps `git status` clean on the upstream file.
	const tplIndexPath = path.join(outDir, "tpl-index.json");
	writeJson(tplIndexPath, registryIndexSchema.parse(newIndexEntries));

	return { added: newIndexEntries.length, warnings: allWarnings };
}

async function main(): Promise<void> {
	log("📦 Starting extra-registry build...");
	// Ensure every card has a meta.json sidecar (these are .gitignored and
	// regenerated on every build from defaults derived from filename + group).
	const m = generateMeta({ quiet: true });
	if (m.created) log(`📝 Generated ${m.created} missing meta.json sidecar(s)`);
	const templates = collectTemplates();
	const examples = collectExamples();
	log(
		`🔍 Found ${templates.length} card(s) across ${TEMPLATE_SOURCES.length} groups + ${examples.length} example folder(s)`
	);

	if (templates.length === 0 && examples.length === 0) {
		log("Nothing to do.");
		return;
	}

	const seenWarnings = new Set<string>();
	let totalAdded = 0;
	for (const style of PRESET_STYLES) {
		const { added, warnings } = await injectStyle(style, templates, examples);
		totalAdded += added;
		warnings.forEach((w) => seenWarnings.add(w));
		log(`✅ style "${style}": +${added} item(s)`);
	}

	if (seenWarnings.size) {
		log("⚠ Warnings:");
		for (const w of seenWarnings) console.log(w);
	}

	log(`🎉 Done — injected ${totalAdded} item(s) across ${PRESET_STYLES.length} styles.`);
}

main().catch((e) => {
	console.error(`[extra-registry] FAILED: ${e instanceof Error ? e.message : e}`);
	process.exit(1);
});
