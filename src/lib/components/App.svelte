<script lang="ts">
	import Left from './Left.svelte';
	import Main from './Main.svelte';
	import Right from './Right.svelte';
	import { makeScoreVector } from '$lib/scoring/types';
	import { createGameSessionStore } from '$lib/gameplay/session-store';
	import { setGameSessionContext } from '$lib/gameplay/session-context';
	import { createLocalSemanticScorer } from '$lib/gameplay/semantic/local-semantic-scorer';
	import { demoGreetingScenario } from '$lib/gameplay/scenarios/demo-greeting-scenario';

	const session = createGameSessionStore({
		scoringWeights: {
			...makeScoreVector(0),
			semantic: 0.35,
			rules: 0.2,
			system: 0.2,
			style: 0.1,
			robust: 0.1,
			resilience: 0.05
		},
		semanticScorer: createLocalSemanticScorer()
	});

	session.loadScenario(demoGreetingScenario);
	setGameSessionContext(session);
</script>

<main class="app-shell">
	<div class="layout-grid">
		<aside class="panel panel-left" aria-label="Conversation list">
			<Left />
		</aside>

		<section class="panel panel-middle" aria-label="Chat view">
			<Main />
		</section>

		<aside class="panel panel-right" aria-label="Scenario details">
			<Right />
		</aside>
	</div>
</main>

<style>
	.app-shell {
		--app-padding: 10px;
		padding: var(--app-padding);
		container-type: inline-size;
	}

	.layout-grid {
		inline-size: 100%;
		max-inline-size: 1040px;
		margin-inline: auto;
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr) 220px;
		align-items: start;
	}

	.panel {
		background-color: var(--app-panel-bg-color);
		box-sizing: border-box;
		border: 1px solid var(--app-panel-stroke-color);
		box-shadow: var(--app-panel-drop-shadow);
		margin: 0;
		padding: 0;
	}

	.panel-left {
		border-inline-end: 0;
		max-block-size: calc(100dvh - (var(--app-padding) * 2));
		overflow: auto;
	}

	.panel-right {
		border-inline-start: 0;
		max-block-size: calc(100dvh - (var(--app-padding) * 2));
		overflow: auto;
	}

	@container (max-width: 840px) {
		.layout-grid {
			grid-template-columns: 220px minmax(0, 1fr);
			grid-template-rows: auto auto;
		}

		.panel-left {
			grid-column: 1;
			grid-row: 1;
			max-block-size: calc((100dvh - (var(--app-padding) * 2)) / 2);
		}

		.panel-right {
			display: block;
			grid-column: 1;
			grid-row: 2;
			border-block-start: 0;
			border-inline-end: 0;
			border-inline-start: 1px solid var(--app-panel-stroke-color);
			max-block-size: calc((100dvh - (var(--app-padding) * 2)) / 2);
		}

		.panel-middle {
			grid-column: 2;
			grid-row: 1 / span 2;
			border-inline: 1px solid var(--app-panel-stroke-color);
		}
	}

	@container (max-width: 620px) {
		.layout-grid {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto;
		}

		.panel-left,
		.panel-right {
			display: none;
		}

		.panel-middle {
			grid-column: 1;
			grid-row: 1;
			border: 1px solid var(--app-panel-stroke-color);
		}
	}
</style>
