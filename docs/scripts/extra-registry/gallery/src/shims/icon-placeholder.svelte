<!--
  Gallery-time shim for the docs-site IconPlaceholder.
  Lucide-only: uses the docs `$lib/registry/icons/__lucide__/<Name>.ts`
  re-export files (Vite globs + bundles them). Tabler / Phosphor / Hugeicons
  / Remixicon props are accepted for source compatibility but ignored — the
  consumer's app decides the final icon library at install time.
-->
<script lang="ts">
	import { type Component } from "svelte";
	import SquareIcon from "@lucide/svelte/icons/square";
	import type { SVGAttributes } from "svelte/elements";

	type SvgProps = SVGAttributes<SVGSVGElement>;

	type Props = {
		lucide?: string;
		hugeicons?: string;
		tabler?: string;
		phosphor?: string;
		remixicon?: string;
		class?: string;
	};

	let { lucide, class: className, ...restProps }: Props & Omit<SvgProps, "class"> = $props();

	const cache = new Map<string, Component<SvgProps> | null>();
	let IconComp = $state<Component<SvgProps> | null>(null);

	$effect(() => {
		if (!lucide) {
			IconComp = null;
			return;
		}
		const name = lucide;
		if (cache.has(name)) {
			IconComp = cache.get(name) ?? null;
			return;
		}
		// Dynamic import — Vite globs `$lib/registry/icons/__lucide__/*.ts` at
		// build time. The .ts file is a one-line re-export of the actual
		// `@lucide/svelte/icons/<kebab>` component, so bundles stay tiny per chunk.
		import(`$lib/registry/icons/__lucide__/${name}.ts`)
			.then((mod) => {
				const C = (mod[name] ?? mod.default ?? null) as Component<SvgProps> | null;
				cache.set(name, C);
				IconComp = C;
			})
			.catch(() => {
				cache.set(name, null);
				IconComp = null;
			});
	});
</script>

{#if IconComp}
	<IconComp class={className} {...restProps as unknown as object} />
{:else}
	<SquareIcon class={className} {...restProps as unknown as object} />
{/if}
