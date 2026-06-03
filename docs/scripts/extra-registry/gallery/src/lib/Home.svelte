<script lang="ts">
	import { cards, allTags, allGroups } from "./cards";
	import CardThumb from "./CardThumb.svelte";

	let query = $state("");
	let activeTag = $state<string | null>(null);
	let activeGroup = $state<string | null>(null);

	const filtered = $derived(
		cards.filter((c) => {
			if (activeGroup && c.group !== activeGroup) return false;
			if (activeTag && !c.categories.includes(activeTag)) return false;
			if (query) {
				const q = query.toLowerCase();
				if (
					!c.title.toLowerCase().includes(q) &&
					!c.name.toLowerCase().includes(q) &&
					!c.categories.some((t) => t.includes(q))
				) {
					return false;
				}
			}
			return true;
		})
	);
</script>

<header class="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
	<div class="mx-auto flex max-w-[1600px] flex-col gap-3 px-6 py-4">
		<div class="flex flex-wrap items-baseline justify-between gap-4">
			<div>
				<h1 class="text-xl font-semibold tracking-tight">Custom Registry Gallery</h1>
				<p class="text-sm text-muted-foreground">
					{cards.length} cards — click any preview for install instructions
				</p>
			</div>
			<input
				type="search"
				bind:value={query}
				placeholder="Search title, name, tag…"
				class="w-72 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs focus:ring-2 focus:ring-ring focus:outline-none"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<span class="text-muted-foreground">Group:</span>
			<button
				type="button"
				class="rounded-full border px-2 py-0.5 transition"
				class:bg-foreground={activeGroup === null}
				class:text-background={activeGroup === null}
				onclick={() => (activeGroup = null)}>All</button
			>
			{#each allGroups as g (g)}
				<button
					type="button"
					class="rounded-full border px-2 py-0.5 transition"
					class:bg-foreground={activeGroup === g}
					class:text-background={activeGroup === g}
					onclick={() => (activeGroup = g)}>{g}</button
				>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<span class="text-muted-foreground">Tag:</span>
			<button
				type="button"
				class="rounded-full border px-2 py-0.5"
				class:bg-foreground={activeTag === null}
				class:text-background={activeTag === null}
				onclick={() => (activeTag = null)}>All</button
			>
			{#each allTags as t (t)}
				<button
					type="button"
					class="rounded-full border px-2 py-0.5"
					class:bg-foreground={activeTag === t}
					class:text-background={activeTag === t}
					onclick={() => (activeTag = t)}>{t}</button
				>
			{/each}
		</div>
	</div>
</header>

<main class="mx-auto max-w-[1600px] px-6 py-6">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
		{#each filtered as card (card.name)}
			<CardThumb {card} />
		{/each}
	</div>
	{#if filtered.length === 0}
		<p class="py-12 text-center text-sm text-muted-foreground">No cards match this filter.</p>
	{/if}
</main>
