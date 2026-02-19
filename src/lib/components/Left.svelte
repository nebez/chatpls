<script lang="ts">
	import { resolve } from '$app/paths';
	import { getGameSessionContext } from '$lib/gameplay/session-context';
	import Logo from './Logo.svelte';
	import DashboardIcon from './icons/Dashboard.svelte';

	const session = getGameSessionContext();
	const leftPanel = session.leftPanel;
</script>

<div class="nav">
	<a href={resolve('/chat')} class="logo">
		<Logo />
	</a>

	<a href={resolve('/chat')} class="link"><DashboardIcon width={14} /> Dashboard</a>

	<div class="section">
		<div class="dim">Metadata</div>
		<div><strong>Scenario</strong>: {$leftPanel.scenarioId ?? 'none'}</div>
		<div><strong>Phase</strong>: {$leftPanel.phase}</div>
		<div><strong>Completed</strong>: {$leftPanel.completedCount}</div>
	</div>

	<div class="section">
		<div class="dim">Conversations (97)</div>
		<div><strong>Scenario</strong>: {$leftPanel.scenarioId ?? 'none'}</div>
		<div><strong>Phase</strong>: {$leftPanel.phase}</div>
		<div><strong>Completed</strong>: {$leftPanel.completedCount}</div>
	</div>
</div>

<style>
	.nav {
		display: flex;
		flex-direction: column;
		gap: 25px;
		font-size: 14px;
	}

	a {
    	border-radius: 3px;
	}

	a:hover {
		background-color: var(--bg-color);
	}

	a.logo {
		line-height: 0;
		height: 100%;
		margin: 10px;
		margin-bottom: 0;
		padding: 5px;
	}

	a.link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin: 0 10px;
		padding: 5px;
	}

	.section {
    	margin-left: 15px;
    	margin-right: 15px;
    	display: flex;
    	flex-direction: column;
    	gap: 10px;
	}

	.dim {
	    color: var(--gray-500);
	}
</style>
