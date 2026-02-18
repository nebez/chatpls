<main class="page-shell">
	<div class="layout-grid">
		<aside class="panel panel-left" aria-label="Conversation list">
			<h2>Conversations</h2>
		</aside>

		<section class="panel panel-middle" aria-label="Chat view">
			<h1>ChatPLS</h1>
		</section>

		<aside class="panel panel-right" aria-label="Scenario details">
			<h2>Details</h2>
		</aside>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 10px;
	}

	.page-shell {
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
		box-sizing: border-box;
		border: 1px solid currentColor;
	}

	.panel-left {
		border-inline-end: 0;
	}

	.panel-right {
		border-inline-start: 0;
	}

	@container (max-width: 840px) {
		.layout-grid {
			grid-template-columns: 220px minmax(0, 1fr);
			grid-template-rows: auto auto;
		}

		.panel-left {
			grid-column: 1;
			grid-row: 1;
		}

		.panel-right {
			display: block;
			grid-column: 1;
			grid-row: 2;
			/* Left panel owns the shared horizontal seam in stacked mode. */
			border-block-start: 0;
			border-inline-end: 0;
			border-inline-start: 1px solid currentColor;
		}

		.panel-middle {
			grid-column: 2;
			grid-row: 1 / span 2;
			border-inline: 1px solid currentColor;
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
			border: 1px solid currentColor;
		}
	}
</style>
