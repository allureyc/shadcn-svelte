// Shim for `$lib/features/design-system`. The real module wires a Svelte
// context for live theme switching across the docs site. The gallery
// renders one fixed style at a time, so we only need a tiny stub.

export type Lockable<T> = T;

export interface IDesignSystemState {
	style: string;
	baseColor: string;
	theme: string;
	chartColor: string;
	menuAccent: string;
	menuColor: string;
	radius: string;
	iconLibrary: "lucide" | "tabler" | "phosphor" | "hugeicons" | "remixicon";
	shareUrl: string;
}

const STATE: IDesignSystemState = {
	style: "nova",
	baseColor: "slate",
	theme: "default",
	chartColor: "default",
	menuAccent: "subtle",
	menuColor: "default",
	radius: "default",
	iconLibrary: "lucide",
	shareUrl: "https://example.com/?",
};

export function useDesignSystem(): IDesignSystemState {
	return STATE;
}

export function setupDesignSystem(): IDesignSystemState {
	return STATE;
}

export const DesignSystemProvider = null as unknown;
