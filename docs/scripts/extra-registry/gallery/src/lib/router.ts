/**
 * Tiny hash-based router. Keeps the gallery a pure static SPA (no server
 * needed) and works on any host including raw GitHub Pages / Cloudflare
 * Pages without rewrite rules.
 */

import { writable } from "svelte/store";

export type Route =
	| { kind: "home" }
	| { kind: "card"; name: string }
	| { kind: "not-found"; raw: string };

function parse(): Route {
	const raw = (typeof window === "undefined" ? "" : window.location.hash || "#/").slice(1);
	if (raw === "/" || raw === "") return { kind: "home" };
	const cardMatch = raw.match(/^\/card\/([^/?]+)/);
	if (cardMatch) return { kind: "card", name: decodeURIComponent(cardMatch[1]) };
	return { kind: "not-found", raw };
}

export const route = writable<Route>(parse());

if (typeof window !== "undefined") {
	window.addEventListener("hashchange", () => route.set(parse()));
}

export function go(href: string): void {
	if (typeof window !== "undefined") window.location.hash = href;
}
