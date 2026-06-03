<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";

	type Props = { text: string; label?: string };
	let { text, label = "Copy" }: Props = $props();

	let copied = $state(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			copied = false;
		}
	}
</script>

<button
	type="button"
	onclick={handleCopy}
	class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
>
	{#if copied}
		<CheckIcon class="size-4" />
		Copied
	{:else}
		<CopyIcon class="size-4" />
		{label}
	{/if}
</button>
