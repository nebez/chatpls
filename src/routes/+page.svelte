<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
</script>

<svelte:head>
	<title>ChatPLS</title>
</svelte:head>

<main class="home-page">
	<header>
		<a href={resolve('/')} class="brand" aria-label="ChatPLS home">
			<Logo />
		</a>
		<nav aria-label="Primary">
			<a href={resolve('/app/help')}>Help</a>
			<a href={resolve('/faq')}>FAQ</a>
			<a href={resolve('/app')} class="play-link">Play</a>
		</nav>
	</header>

	<section class="hero" aria-labelledby="home-title">
		<h1 id="home-title">
			<span>LLMs aren't magic.</span>
			<strong>Humans are.</strong>
		</h1>
		<div class="copy">
			<p>
				We gave machines tools, memory, rule adherence, and intelligence. Then we released them to
				the world and, instead of calling them magical, you say they're "dumb token generators".
			</p>
			<p>
				PLS (Player-as-Language System) brings the model harness to life through an interactive
				experience for human-to-human intelligence.
			</p>
			<p>Your turn.</p>
		</div>
	</section>
</main>

<style>
	.home-page {
		min-block-size: 100dvh;
		background: #fff;
		color: var(--fg-color);
		padding: 36px;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}

	.brand {
		display: inline-flex;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 22px;
		color: #6d7280;
	}

	.play-link {
		background: #3f4bd8;
		color: #fff;
		border-radius: 3px;
		box-shadow: 3px 3px 0 #2a2f7f;
		padding: 10px 18px;
	}

	.hero {
		min-block-size: calc(100dvh - 130px);
		display: grid;
		place-items: center;
		align-content: center;
		gap: 44px;
		text-align: center;
	}

	h1 {
		display: grid;
		gap: 14px;
		margin: 0;
		font-size: clamp(44px, 7vw, 92px);
		line-height: 1.05;
		font-weight: 400;
		letter-spacing: 0;
	}

	h1 strong {
		color: #555fb6;
		font-weight: 400;
	}

	.copy {
		max-inline-size: 900px;
		display: grid;
		gap: 26px;
		color: #626a78;
	}

	.copy p {
		font-size: clamp(18px, 2vw, 26px);
		line-height: 1.35;
	}

	@media (max-width: 680px) {
		.home-page {
			padding: 22px;
		}

		header {
			align-items: start;
		}

		nav {
			gap: 14px;
			flex-wrap: wrap;
			justify-content: end;
		}

		.hero {
			place-items: start;
			text-align: start;
		}
	}
</style>
