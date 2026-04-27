<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
	import { progressionVariants } from '$lib/progression/variants';
</script>

<svelte:head>
	<title>ChatPLS Progression Labs</title>
</svelte:head>

<main class="hub">
	<nav>
		<a href={resolve('/')}><Logo /></a>
		<a href={resolve('/app')}>Back to app</a>
	</nav>

	<header>
		<p class="eyebrow">Progression labs</p>
		<h1>Four ways to make the player feel like the model.</h1>
		<p>
			Each lab is playable and tests a different progression mechanic: clearing user queues,
			unlocking skills, climbing benchmarks, or managing context.
		</p>
	</header>

	<section class="cards">
		{#each progressionVariants as variant}
			<a href={variant.path}>
				<p class="eyebrow">{variant.rating}/10 concept fit</p>
				<h2>{variant.title}</h2>
				<p>{variant.tagline}</p>
				<strong>{variant.mechanic}</strong>
			</a>
		{/each}
	</section>
</main>

<style>
	.hub {
		min-block-size: 100dvh;
		background: #fff;
		color: var(--fg-color);
		padding: 32px;
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-block-end: 70px;
	}

	nav a:last-child,
	.cards a {
		border: 1px solid var(--app-panel-stroke-color);
		box-shadow: 5px 5px 0 #666;
	}

	nav a:last-child {
		padding: 8px 14px;
		background: #3f4bd8;
		color: #fff;
	}

	header {
		max-inline-size: 900px;
		margin-inline: auto;
		text-align: center;
		display: grid;
		gap: 18px;
	}

	h1 {
		margin: 0;
		font-size: clamp(38px, 6vw, 78px);
		line-height: 1.05;
		font-weight: 400;
	}

	.eyebrow {
		color: var(--gray-500);
	}

	.cards {
		max-inline-size: 1120px;
		margin: 54px auto 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 20px;
	}

	.cards a {
		padding: 18px;
		display: grid;
		gap: 14px;
		background: #fff;
	}

	h2 {
		margin: 0;
	}

	@media (max-width: 980px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.cards {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
