<script lang="ts">
	import { route } from "./lib/router";
	import Home from "./lib/Home.svelte";
	import Detail from "./lib/Detail.svelte";

	// Home stays in the normal document flow so its scroll position, filters,
	// and CardThumb layout are all preserved. Detail renders as a full-viewport
	// overlay on top; body scroll is locked while it's open. Only a hard
	// refresh resets state.
	$effect(() => {
		if (typeof document === "undefined") return;
		const overlay = $route.kind !== "home";
		document.body.style.overflow = overlay ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	});
</script>

<Home />

{#if $route.kind !== "home"}
	<div class="overlay">
		{#if $route.kind === "card"}
			<Detail name={$route.name} />
		{:else}
			<main class="mx-auto max-w-2xl p-10">
				<h1 class="text-xl font-semibold">Not found</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					No route matches <code>{$route.raw}</code>.
				</p>
				<a class="mt-4 inline-block underline" href="#/">Back to gallery</a>
			</main>
		{/if}
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		overflow: auto;
		background: var(--background, #000);
	}
</style>
