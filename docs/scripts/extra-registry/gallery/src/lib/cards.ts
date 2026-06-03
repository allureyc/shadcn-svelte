/**
 * Card index for the gallery.
 *
 * The actual list of entries is generated at build time into
 * `./.generated/cards.ts` by `docs/scripts/extra-registry/build-gallery.ts`,
 * which keeps card discovery out of Vite's glob layer (Vite root is the
 * gallery folder, the cards live four levels up).
 *
 * This wrapper re-exports the generated array under a stable name so the rest
 * of the app doesn't import from `.generated/` directly. It also computes
 * derived data (tag set, group set) once.
 */

// @ts-expect-error generated at build time by build-gallery.ts; safe to ignore in editor.
import { cards as generated } from "./__generated__/cards";

export interface GalleryCard {
	name: string; // registry item name, e.g. "tpl-preview-visitors"
	slug: string; // file slug, e.g. "visitors"
	group: string; // "preview" | "preview-02"
	title: string;
	description: string;
	categories: string[];
	loader: () => Promise<{ default: import("svelte").Component }>;
}

export const cards: GalleryCard[] = generated as GalleryCard[];

export const cardByName: ReadonlyMap<string, GalleryCard> = new Map(cards.map((c) => [c.name, c]));

export const allTags: readonly string[] = [
	...new Set(cards.flatMap((c) => c.categories)),
].sort();

export const allGroups: readonly string[] = [...new Set(cards.map((c) => c.group))].sort();
