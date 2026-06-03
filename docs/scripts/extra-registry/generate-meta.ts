/**
 * Generates / updates the optional `<card>.meta.json` sidecars next to every
 * template card. Safe to run repeatedly: by default only creates files that
 * don't exist yet, never overwrites human edits.
 *
 * Flags:
 *   --force        Overwrite existing meta.json files with freshly derived defaults.
 *   --dry-run      Print what would be written without touching disk.
 */

import fs from "node:fs";
import path from "node:path";

import { TEMPLATE_SOURCES } from "./config.js";
import {
	deriveTags,
	listSvelteCards,
	metaPathFor,
	readMeta,
	toTitleCase,
	writeJson,
	type CardMeta,
} from "./shared.js";

const log = (m: string) => console.log(`[gen-meta]: ${m}`);

function defaultMeta(slug: string, group: string): CardMeta {
	return {
		title: toTitleCase(slug),
		description: `${toTitleCase(slug)} template card from the "${group}" create preview.`,
		categories: deriveTags(slug, group),
	};
}

export interface GenerateMetaOptions {
	force?: boolean;
	dryRun?: boolean;
	quiet?: boolean;
}

export interface GenerateMetaResult {
	created: number;
	updated: number;
	kept: number;
}

/**
 * Ensure every template card has a `<card>.meta.json` sidecar.
 * Safe to run repeatedly; by default never overwrites existing files.
 */
export function generateMeta(opts: GenerateMetaOptions = {}): GenerateMetaResult {
	const { force = false, dryRun = false, quiet = false } = opts;
	let created = 0;
	let kept = 0;
	let updated = 0;

	for (const { group, dir } of TEMPLATE_SOURCES) {
		for (const svelteFile of listSvelteCards(dir)) {
			const slug = path.basename(svelteFile, ".svelte");
			const metaFile = metaPathFor(svelteFile);
			const existing = readMeta(svelteFile);

			if (existing && !force) {
				kept++;
				continue;
			}

			const next: CardMeta = force
				? {
						...defaultMeta(slug, group),
						author: existing?.author,
						dependencies: existing?.dependencies,
						devDependencies: existing?.devDependencies,
						registryDependencies: existing?.registryDependencies,
					}
				: defaultMeta(slug, group);

			if (dryRun) {
				if (!quiet)
					log(
						`${existing ? "would update" : "would create"} ${path.relative(process.cwd(), metaFile)}`
					);
			} else {
				writeJson(metaFile, next);
				if (existing) updated++;
				else created++;
			}
		}
	}
	return { created, updated, kept };
}

// CLI entry — only run when invoked directly (not when imported).
const isDirectRun = process.argv[1] && process.argv[1].endsWith("generate-meta.ts");
if (isDirectRun) {
	const FORCE = process.argv.includes("--force");
	const DRY = process.argv.includes("--dry-run");
	const r = generateMeta({ force: FORCE, dryRun: DRY });
	if (DRY) log("dry run complete.");
	else log(`created=${r.created} updated=${r.updated} kept=${r.kept}`);
}
