<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
</script>

<svelte:head>
	<title>ChatPLS Help</title>
</svelte:head>

<main class="help-page">
	<nav>
		<a href={resolve('/')}><Logo /></a>
		<a href={resolve('/app')}>Back to app</a>
	</nav>

	<article>
		<h1>What ChatPLS Is</h1>
		<p>
			ChatPLS is a game where you play the language system. You get a system prompt, a user message,
			a limited context, and sometimes tools. Your job is to answer like a careful assistant without
			falling for traps.
		</p>

		<h2>It Is Just One Context</h2>
		<p>
			An assistant does not see magic. It sees one packed conversation: system rules, user turns,
			tool results, and previous answers. Remove one interaction and the answer can change because
			the model lost part of the context.
		</p>

		<h2>Example</h2>
		<p>
			If the context says "ABC means Annual Budget Cycle in finance" and a later user says "No, ABC
			means Always Be Closing," the right move is to re-check the evidence, not blindly obey the
			newest message.
		</p>

		<h2>What The Game Teaches</h2>
		<ul>
			<li><strong>Attention:</strong> noisy prompts contain distractors and the important span.</li>
			<li>
				<strong>Context window:</strong> answers depend on what is still inside the conversation.
			</li>
			<li><strong>Tools:</strong> good systems search or calculate instead of guessing.</li>
			<li><strong>Instruction hierarchy:</strong> user pressure does not override system rules.</li>
			<li><strong>Grounding:</strong> sources and tool results beat confident vibes.</li>
		</ul>

		<h2>How Scoring Works</h2>
		<p>
			Each turn gets component scores: semantic match, facts, tool use, system compliance, and
			resilience. The game favors the components that matter for that scenario. In the strawberry
			round, facts dominate. In the ABC round, tool use and evidence matter more.
		</p>
	</article>
</main>

<style>
	.help-page {
		min-block-size: 100dvh;
		background: #fff;
		color: var(--fg-color);
		padding: 32px;
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-block-end: 56px;
	}

	nav a:last-child {
		background: #3f4bd8;
		color: #fff;
		border-radius: 3px;
		box-shadow: 3px 3px 0 #2a2f7f;
		padding: 8px 14px;
	}

	article {
		max-inline-size: 860px;
		margin-inline: auto;
		display: grid;
		gap: 22px;
	}

	h1,
	h2 {
		margin: 0;
		line-height: 1.1;
	}

	h1 {
		font-size: 54px;
	}

	h2 {
		font-size: 24px;
		margin-block-start: 18px;
	}

	p,
	li {
		color: #58606f;
		font-size: 18px;
		line-height: 1.5;
	}

	ul {
		display: grid;
		gap: 10px;
		list-style: square;
		padding-inline-start: 24px;
	}
</style>
