<script lang="ts">
	import Left from './Left.svelte';
	import Main from './Main.svelte';
	import Right from './Right.svelte';
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
		background-color: #fff;
		box-sizing: border-box;
		border: 1px solid var(--app-container-stroke-color);
		box-shadow: var(--app-container-drop-shadow);
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
			border-inline-start: 1px solid var(--app-container-stroke-color);
			max-block-size: calc((100dvh - (var(--app-padding) * 2)) / 2);
		}

		.panel-middle {
			grid-column: 2;
			grid-row: 1 / span 2;
			border-inline: 1px solid var(--app-container-stroke-color);
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
			border: 1px solid var(--app-container-stroke-color);
		}
	}
</style>
