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

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");

const log = (m: string) => console.log(`[gen-meta]: ${m}`);

function defaultMeta(slug: string, group: string): CardMeta {
	return {
		title: toTitleCase(slug),
		description: `${toTitleCase(slug)} template card from the "${group}" create preview.`,
		categories: deriveTags(slug, group),
	};
}

let created = 0;
let kept = 0;
let updated = 0;

for (const { group, dir } of TEMPLATE_SOURCES) {
	for (const svelteFile of listSvelteCards(dir)) {
		const slug = path.basename(svelteFile, ".svelte");
		const metaFile = metaPathFor(svelteFile);
		const existing = readMeta(svelteFile);

		if (existing && !FORCE) {
			kept++;
			continue;
		}

		// With --force we regenerate from defaults but preserve any custom
		// `author`, `dependencies`, `devDependencies`, `registryDependencies`.
		const next: CardMeta = FORCE
			? {
					...defaultMeta(slug, group),
					author: existing?.author,
					dependencies: existing?.dependencies,
					devDependencies: existing?.devDependencies,
					registryDependencies: existing?.registryDependencies,
				}
			: defaultMeta(slug, group);

		if (DRY) {
			log(`${existing ? "would update" : "would create"} ${path.relative(process.cwd(), metaFile)}`);
		} else {
			writeJson(metaFile, next);
			if (existing) updated++;
			else created++;
		}
	}
}

if (DRY) log("dry run complete.");
else log(`created=${created} updated=${updated} kept=${kept}`);
