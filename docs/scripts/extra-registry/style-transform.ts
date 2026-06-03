/**
 * `cn-*` class transformation — mirrors the official `parseStyleCss` /
 * `transformContentWithStyle` behaviour in `docs/scripts/build-registry.ts`,
 * kept as an independent copy so this extension never imports from official
 * files (which keeps upstream syncs conflict-free).
 *
 * Requires `postcss` (already a workspace dep via the docs package).
 */

import fs from "node:fs";
import postcss from "postcss";

const CN_CLASS_SELECTOR = /^\.(cn-[\w-]+)$/;

export function loadStyleMap(cssPath: string): Record<string, string> {
	if (!fs.existsSync(cssPath)) return {};
	const css = fs.readFileSync(cssPath, "utf8");
	const root = postcss.parse(css);
	const map: Record<string, string> = {};
	root.walkRules((rule) => {
		for (const sel of rule.selectors) {
			const match = sel.trim().match(CN_CLASS_SELECTOR);
			if (!match) continue;
			const className = match[1];
			const applied: string[] = [];
			rule.walkAtRules("apply", (a) => {
				applied.push(a.params.trim());
			});
			if (applied.length) map[className] = applied.join(" ");
		}
	});
	return map;
}

export function applyStyleMap(source: string, styleMap: Record<string, string>): string {
	const entries = Object.entries(styleMap).sort(([a], [b]) => b.length - a.length);
	for (const [cls, replacement] of entries) {
		if (cls === "cn-menu-translucent" || cls === "cn-menu-target") continue;
		const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		source = source.replace(new RegExp(escaped + "(?![\\w-])", "g"), replacement);
	}
	return source;
}
