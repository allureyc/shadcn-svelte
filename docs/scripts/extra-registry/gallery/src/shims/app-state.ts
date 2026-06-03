// Shim for `$app/state` / `$app/stores`. Returns a minimal placeholder so
// cards that read `page.url` etc. don't crash.

function makeFakePage() {
	const url =
		typeof window !== "undefined"
			? new URL(window.location.href)
			: new URL("http://localhost/");
	return {
		url,
		params: {} as Record<string, string>,
		route: { id: null as string | null },
		status: 200,
		error: null as Error | null,
		data: {} as Record<string, unknown>,
		state: {} as Record<string, unknown>,
		form: null as unknown,
	};
}

export const page = makeFakePage();

// Legacy store-shape export (`$app/stores`)
export const navigating = { subscribe: (_: unknown) => () => {} };
export const updated = { subscribe: (_: unknown) => () => {}, check: async () => false };
