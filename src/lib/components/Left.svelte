<script lang="ts">
	import { resolve } from '$app/paths';
	import { getGameSessionContext } from '$lib/gameplay/session-context';
	import Logo from './Logo.svelte';

	const session = getGameSessionContext();
	const leftPanel = session.leftPanel;
</script>

<div class="nav">
	<a href={resolve('/')} class="logo">
		<Logo />
	</a>
	<div class="section">
		<div class="section-header">Metadata</div>
		<div class="section-content">
			<div>Scenario: {$leftPanel.scenarioId ?? 'none'}</div>
			<div>Phase: {$leftPanel.phase}</div>
			<div>Completed: {$leftPanel.completedCount}</div>
		</div>
	</div>
</div>

<style>
	a.logo {
		line-height: 0;
		height: 100%;
		display: inline-block;
		margin: 10px;
		padding: 5px;
		border-radius: 3px;
	}

	a:hover {
		background-color: var(--bg-color);
	}
</style>
