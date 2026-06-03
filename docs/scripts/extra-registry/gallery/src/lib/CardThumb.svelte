<script lang="ts">
	import type { Component } from "svelte";
	import type { GalleryCard } from "./cards";
	import { go } from "./router";
	import * as Tooltip from "$lib/registry/ui/tooltip/index.js";

	type Props = { card: GalleryCard };
	let { card }: Props = $props();

	let CompPromise = $state<Promise<{ default: Component }> | null>(null);
	let stageEl = $state<HTMLDivElement | null>(null);
	let contentEl = $state<HTMLDivElement | null>(null);
	let scale = $state(1);
	let tx = $state(0);
	let ty = $state(0);

	const PADDING = 16; // breathing room around the scaled preview
	// Thumb container is the same size for every card (see .card-thumb CSS).
	// But examples are full-page layouts that need a desktop-width design
	// canvas to render correctly — the fit-scale logic below then shrinks
	// the WHOLE thing uniformly so it fits the same thumb as other cards.
	const canvasWidth = $derived(card.group === "example" ? 1280 : 560);

	$effect(() => {
		CompPromise = card.loader();
	});

	/**
	 * Layout strategy
	 * ───────────────
	 * 1. The card renders inside a fixed 560px "design canvas" so styles
	 *    that rely on a real width (`width: 100%`, percentage padding, etc.)
	 *    resolve sensibly. The canvas itself is `transform-origin: 0 0` and
	 *    pinned to (0,0) of the thumb so all math is in pixel space.
	 *
	 * 2. We measure the *first child* of the canvas (the actual rendered
	 *    card) to find its intrinsic size + offset within the canvas. Both
	 *    are read off `getBoundingClientRect`, with the previous `scale`
	 *    factored back out.
	 *
	 * 3. Compute the fit-scale and then translate the canvas so that the
	 *    card's center lands on the thumb's center.
	 */
	$effect(() => {
		if (!stageEl || !contentEl) return;
		const isExample = card.group === "example";

		const recompute = () => {
			if (!stageEl || !contentEl) return;
			let cw: number;
			let ch: number;
			let childDx: number;
			let childDy: number;

			if (isExample) {
				// Full-page examples: measure the canvas itself. Its `offsetWidth`
				// is the fixed design width (1280) and `scrollHeight` is the
				// natural rendered height — both ignore CSS transforms, so this
				// works while the canvas is already scaled.
				cw = contentEl.offsetWidth;
				ch = contentEl.scrollHeight;
				childDx = 0;
				childDy = 0;
			} else {
				// Single-file cards: measure the actual rendered card so narrow
				// (max-w-md) cards center properly inside the 560 canvas.
				const child = contentEl.firstElementChild as HTMLElement | null;
				if (!child) return;
				const canvasRect = contentEl.getBoundingClientRect();
				const childRect = child.getBoundingClientRect();
				const s = scale || 1;
				cw = childRect.width / s;
				ch = childRect.height / s;
				childDx = (childRect.left - canvasRect.left) / s;
				childDy = (childRect.top - canvasRect.top) / s;
			}
			if (!cw || !ch) return;

			const availW = stageEl.clientWidth - PADDING * 2;
			const availH = stageEl.clientHeight - PADDING * 2;
			const next = Math.min(availW / cw, availH / ch, 1);
			if (!Number.isFinite(next) || next <= 0) return;

			const thumbW = stageEl.clientWidth;
			const thumbH = stageEl.clientHeight;
			tx = (thumbW - cw * next) / 2 - childDx * next;
			ty = (thumbH - ch * next) / 2 - childDy * next;
			scale = next;
		};

		const ro = new ResizeObserver(recompute);
		ro.observe(stageEl);
		ro.observe(contentEl);
		recompute();
		return () => ro.disconnect();
	});
</script>

<button
	type="button"
	class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition hover:border-foreground/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
	onclick={() => go(`/card/${encodeURIComponent(card.name)}`)}
>
	<div
		bind:this={stageEl}
		class="card-thumb relative isolate h-[var(--preview-height)] w-full overflow-hidden bg-muted/30"
	>
		{#if CompPromise}
			{#await CompPromise}
				<span class="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
					>Loading…</span
				>
			{:then { default: Comp }}
				<!--
					The card renders at its natural size inside `.content`. We measure
					that size + the available stage box, then apply a uniform
					`scale()` so the card always fits entirely, centered both axes,
					preserving aspect ratio.
				-->
				<div
					bind:this={contentEl}
					class="content"
					style="width: {canvasWidth}px; transform: translate({tx}px, {ty}px) scale({scale});"
				>
					<Tooltip.Provider>
						<Comp />
					</Tooltip.Provider>
				</div>
			{:catch err}
				<pre
					class="absolute inset-0 m-auto max-w-full self-center overflow-auto p-3 text-xs text-destructive">{String(err?.message ?? err)}</pre>
			{/await}
		{/if}
	</div>
	<div class="flex flex-col gap-1 border-t border-border p-3">
		<div class="flex items-center justify-between gap-2">
			<span class="text-sm font-medium">{card.title}</span>
			<span class="text-[10px] uppercase tracking-wide text-muted-foreground">{card.group}</span>
		</div>
		{#if card.categories.length}
			<div class="flex flex-wrap gap-1">
				{#each card.categories.slice(0, 5) as tag (tag)}
					<span
						class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
						>{tag}</span
					>
				{/each}
			</div>
		{/if}
	</div>
</button>

<style>
	.card-thumb {
		container-type: inline-size;
	}
	.content {
		position: absolute;
		top: 0;
		left: 0;
		width: 560px;
		max-width: none;
		transform-origin: 0 0;
		will-change: transform;
	}
</style>
