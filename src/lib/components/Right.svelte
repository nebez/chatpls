<script lang="ts">
	import { getGameSessionContext } from '$lib/gameplay/session-context';

	const session = getGameSessionContext();
	const rightPanel = session.rightPanel;
</script>

<div>
	<div>Stats</div>
	<div>Score: {$rightPanel.latestScore ?? '-'}</div>
	{#if Object.keys($rightPanel.modelStatuses).length > 0}
		<div>Models</div>
		{#each Object.entries($rightPanel.modelStatuses) as [model, status]}
			<div>{model}: {status.state}</div>
		{/each}
	{/if}
</div>
