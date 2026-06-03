<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import TerminalIcon from "@lucide/svelte/icons/terminal";

	interface Props {
		name: string;
	}
	let { name }: Props = $props();

	const PMS = ["pnpm", "npm", "yarn", "bun"] as const;
	type PM = (typeof PMS)[number];

	const PM_CMD: Record<PM, string> = {
		pnpm: "pnpm dlx shadcn-svelte@latest add",
		npm: "npx shadcn-svelte@latest add",
		yarn: "yarn dlx shadcn-svelte@latest add",
		bun: "bunx shadcn-svelte@latest add",
	};

	const LS_PM = "gallery.installPM";

	let pm = $state<PM>(
		((typeof localStorage !== "undefined" && localStorage.getItem(LS_PM)) || "pnpm") as PM
	);

	$effect(() => {
		try {
			localStorage.setItem(LS_PM, pm);
		} catch {}
	});

	const origin = $derived(typeof window === "undefined" ? "" : window.location.origin);
	const installUrl = $derived(`${origin}/registry/styles/nova/${name}.json`);
	const installCmd = $derived(`${PM_CMD[pm]} ${installUrl}`);

	let copied = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(installCmd);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {}
	}
</script>

<div class="overflow-hidden rounded-lg border border-border bg-[#0a0a0a]">
	<!-- Tab bar -->
	<div class="flex items-center justify-between border-b border-border/60 bg-[#111] px-2 py-1">
		<div class="flex items-center gap-1">
			<TerminalIcon class="mx-2 size-3.5 text-muted-foreground" />
			{#each PMS as p (p)}
				<button
					type="button"
					onclick={() => (pm = p)}
					class="rounded px-2.5 py-1 text-xs font-medium transition-colors {pm === p
						? 'bg-background text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{p}
				</button>
			{/each}
		</div>
		<button
			type="button"
			onclick={copy}
			title="Copy command"
			class="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
		>
			{#if copied}
				<CheckIcon class="size-4 text-emerald-400" />
			{:else}
				<CopyIcon class="size-4" />
			{/if}
		</button>
	</div>

	<!-- Command -->
	<pre
		class="overflow-x-auto px-4 py-3 text-[12px] leading-relaxed text-foreground"><code
			>{installCmd}</code
		></pre>
</div>
