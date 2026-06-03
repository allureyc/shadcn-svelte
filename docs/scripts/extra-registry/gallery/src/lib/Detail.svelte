<script lang="ts">
	import type { Component } from "svelte";
	import { cardByName } from "./cards";
	import { go } from "./router";
	import InstallTabs from "./InstallTabs.svelte";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";

	type Props = { name: string };
	let { name }: Props = $props();

	const card = $derived(cardByName.get(name));

	let CompPromise = $state<Promise<{ default: Component }> | null>(null);

	$effect(() => {
		if (card) CompPromise = card.loader();
	});

	// Example pages are designed at 1280px. We render them at full design
	// width inside the *same* preview container as everything else, then
	// uniformly scale down so they fit. The container size never changes.
	const isExample = $derived(card?.group === "example");
	const EXAMPLE_DESIGN_WIDTH = 1280;
	let exampleHostEl = $state<HTMLDivElement | null>(null);
	let exampleCanvasEl = $state<HTMLDivElement | null>(null);
	let exampleScale = $state(1);
	let exampleHeight = $state(0);

	$effect(() => {
		if (!isExample || !exampleHostEl || !exampleCanvasEl) return;
		const host = exampleHostEl;
		const canvas = exampleCanvasEl;
		const recompute = () => {
			const availW = host.clientWidth;
			if (!availW) return;
			// Allow scaling UP a bit so wide viewports don't leave huge whitespace
			// around the 1280px design, but cap to keep typography reasonable.
			const s = Math.min(availW / EXAMPLE_DESIGN_WIDTH, 1.25);
			exampleScale = s;
			exampleHeight = canvas.scrollHeight * s;
		};
		const ro = new ResizeObserver(recompute);
		ro.observe(host);
		ro.observe(canvas);
		recompute();
		return () => ro.disconnect();
	});
</script>

<header class="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
	<div class="mx-auto flex max-w-400 items-center gap-3 px-6 py-3">
		<button
			type="button"
			onclick={() => go("/")}
			class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent"
		>
			<ArrowLeftIcon class="size-4" /> Back
		</button>
		{#if card}
			<div class="flex flex-col">
				<span class="text-sm font-semibold">{card.title}</span>
				<span class="text-[10px] text-muted-foreground">{card.name}</span>
			</div>
		{/if}
	</div>
</header>

<main
	class={[
		"mx-auto px-6 py-8",
			isExample ? "max-w-7xl" : "max-w-400",
	]}
>
	{#if !card}
		<p class="text-sm text-destructive">Card not found: {name}</p>
	{:else}
		<div
			class={[
				"grid grid-cols-1 gap-6",
				!isExample && "lg:grid-cols-[1fr_360px]",
			]}
		>
			<div class="flex flex-col gap-4">
				<InstallTabs name={card.name} />
				<div
					class="flex min-h-[60vh] items-center justify-center overflow-auto rounded-xl border border-border bg-card p-6"
				>
					{#if CompPromise}
						{#await CompPromise}
							<span class="text-sm text-muted-foreground">Loading preview…</span>
						{:then { default: Comp }}
							{#if isExample}
								<div
									bind:this={exampleHostEl}
									class="example-host"
									style="height: {exampleHeight}px;"
								>
									<div
										bind:this={exampleCanvasEl}
										class="example-canvas"
										style="width: {EXAMPLE_DESIGN_WIDTH}px; transform: scale({exampleScale});"
									>
										<Tooltip.Provider>
											<Comp />
										</Tooltip.Provider>
									</div>
								</div>
							{:else}
								<div class="preview-canvas">
									<Tooltip.Provider>
										<Comp />
									</Tooltip.Provider>
								</div>
							{/if}
						{:catch err}
							<pre class="overflow-auto p-3 text-xs text-destructive">{String(
									err?.message ?? err
								)}</pre>
						{/await}
					{/if}
				</div>
			</div>
			<aside class="flex flex-col gap-4">
				<section class="rounded-xl border border-border bg-card p-4">
					<h2 class="text-sm font-semibold">Tags</h2>
					<div class="mt-2 flex flex-wrap gap-1">
						{#each card.categories as t (t)}
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
								>{t}</span
							>
						{:else}
							<span class="text-xs text-muted-foreground">No tags</span>
						{/each}
					</div>
				</section>
				{#if card.description}
					<section class="rounded-xl border border-border bg-card p-4">
						<h2 class="text-sm font-semibold">Description</h2>
						<p class="mt-1 text-sm text-muted-foreground">{card.description}</p>
					</section>
				{/if}
				<section class="rounded-xl border border-border bg-card p-4">
					<h2 class="text-sm font-semibold">Source</h2>
					<p class="mt-1 text-xs text-muted-foreground">
						Group <code>{card.group}</code>, file <code>{card.slug}.svelte</code>
					</p>
				</section>
			</aside>
		</div>
	{/if}
</main>

<style>
	/* Cards are authored against a fixed ~560px design canvas (see CardThumb).
	   Give the detail preview a comfortable, fixed-width canvas so layouts
	   relying on width:100% / container queries render at their intended size. */
	/* Fixed-width design canvas (mirrors CardThumb's 560px convention).
	   Cards lay themselves out inside this width; use `mx-auto` / `max-w-*`
	   on the card if you want it centered or narrower. */
	.preview-canvas {
		width: 720px;
		max-width: 100%;
		flex: none;
	}
	/* Examples render at 1280px design width inside the same .preview-canvas,
	   then scale uniformly down so they fit. `.example-host` reserves the
	   scaled-down height so surrounding layout stays stable. */
	.example-host {
		width: 100%;
		overflow: hidden;
		position: relative;
	}
	.example-canvas {
		transform-origin: top left;
		will-change: transform;
	}
</style>
