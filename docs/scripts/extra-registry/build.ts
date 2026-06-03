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
import { applyStyleMap, loadStyleMap } from "./style-transform.js";

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

function toRegistryItem(
	rec: TemplateRecord,
	styleMap: Record<string, string>
): { item: RegistryItem; warnings: string[] } {
	const meta = readMeta(rec.filepath);
	const { registryDependencies, internalWarnings } = parseDeps(rec.source);

	// 1) cn-* rewrite (per-style), 2) alias rewrite for end-consumer imports.
	let content = applyStyleMap(rec.source, styleMap);
	content = rewriteImports(content, REGISTRY_ALIASES);

	// Target path: installs as a "block" the consumer can place under their UI tree.
	const target = `components/${rec.group}/${rec.slug}.svelte`;

	const file: RegistryItemFile = {
		content,
		type: "registry:component",
		target,
	};

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
		files: [file],
	});

	const warnings = internalWarnings.map(
		(spec) =>
			`  ⚠ ${rec.name}: import "${spec}" is docs-internal — consumers will need to provide it.`
	);
	return { item, warnings };
}

async function injectStyle(
	style: string,
	templates: TemplateRecord[]
): Promise<{ added: number; warnings: string[] }> {
	const outDir = stylesOutputDir(style);
	const indexPath = path.join(outDir, "index.json");

	if (!fs.existsSync(indexPath)) {
		throw new Error(
			`Official registry index not found at ${indexPath}. Run \`pnpm build:registry\` first.`
		);
	}

	const styleMap = loadStyleMap(styleCssPath(style));
	const existing = registryIndexSchema.parse(JSON.parse(fs.readFileSync(indexPath, "utf8")));
	const existingNames = new Set(existing.map((i) => i.name));

	const allWarnings: string[] = [];
	const newIndexEntries: RegistryIndexItem[] = [];

	for (const rec of templates) {
		if (existingNames.has(rec.name)) {
			throw new Error(
				`Name collision in style "${style}": "${rec.name}" already exists in official index.`
			);
		}
		const { item, warnings } = toRegistryItem(rec, styleMap);
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

	const merged = registryIndexSchema.parse([...existing, ...newIndexEntries]);
	writeJson(indexPath, merged);

	return { added: newIndexEntries.length, warnings: allWarnings };
}

async function main(): Promise<void> {
	log("📦 Starting extra-registry build...");
	const templates = collectTemplates();
	log(`🔍 Found ${templates.length} template card(s) across ${TEMPLATE_SOURCES.length} groups`);

	if (templates.length === 0) {
		log("Nothing to do.");
		return;
	}

	const seenWarnings = new Set<string>();
	let totalAdded = 0;
	for (const style of PRESET_STYLES) {
		const { added, warnings } = await injectStyle(style, templates);
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
