<script lang="ts">
	import { Button } from "$lib/registry/ui/button/index.js";
	import * as Card from "$lib/registry/ui/card/index.js";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
</script>

<Card.Root class="mx-auto w-full max-w-md">
	<Card.Header>
		<div class="flex items-center gap-2">
			<SparklesIcon class="size-5 text-primary" />
			<Card.Title>Hello, Custom Gallery</Card.Title>
		</div>
		<Card.Description>
			This card lives under <code>examples/custom/cards/</code>. Edit or delete it freely —
			your changes never touch upstream files.
		</Card.Description>
	</Card.Header>
	<Card.Content class="text-sm text-muted-foreground">
		Re-run the build script and refresh the Gallery to see your edits.
	</Card.Content>
	<Card.Footer class="flex justify-end gap-2">
		<Button variant="outline" size="sm">Docs</Button>
		<Button size="sm">Get started</Button>
	</Card.Footer>
</Card.Root>
