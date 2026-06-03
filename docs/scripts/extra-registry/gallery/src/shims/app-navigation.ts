// Shim for `$app/navigation` and `$app/forms`. No-op implementations so cards
// that reference these don't break the gallery build.

export async function goto(href: string): Promise<void> {
	if (typeof window !== "undefined") window.location.hash = href;
}

export async function invalidate(_: string | URL): Promise<void> {}
export async function invalidateAll(): Promise<void> {}
export function beforeNavigate(_: unknown): void {}
export function afterNavigate(_: unknown): void {}
export function onNavigate(_: unknown): void {}
export function pushState(_: string, __: unknown): void {}
export function replaceState(_: string, __: unknown): void {}
export function preloadCode(_: string): Promise<void> {
	return Promise.resolve();
}
export function preloadData(_: string): Promise<unknown> {
	return Promise.resolve({});
}
export function disableScrollHandling(): void {}
export const enhance = (() => ({ destroy: () => {} })) as unknown;
export const applyAction = async (_: unknown) => {};
export const deserialize = (_: string) => ({}) as unknown;
