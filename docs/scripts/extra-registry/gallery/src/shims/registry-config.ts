// Minimal shim for `$lib/registry/config` — only the symbols actually
// referenced by the cards we render in the gallery. Expand if you start
// previewing cards that need more of the real config surface.

export const DEFAULT_CONFIG = {
	style: "nova",
	baseColor: "slate",
	theme: "default",
	chartColor: "default",
	menuAccent: "subtle",
	radius: "default",
} as const;

export type DesignSystemConfig = typeof DEFAULT_CONFIG;

export const RADII = [
	{ name: "none", value: "0rem" },
	{ name: "default", value: "0.5rem" },
	{ name: "large", value: "1rem" },
];

export const fonts: Array<{ name: string; font: { family: string } }> = [];

export function buildRegistryTheme(_config: DesignSystemConfig): null {
	return null;
}
