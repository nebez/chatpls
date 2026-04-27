<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
	import {
		progressionVariants,
		progressionVariantsById,
		type ProgressionStep,
		type ProgressionVariantId
	} from '$lib/progression/variants';

	type ContextSnippet = NonNullable<ProgressionStep['contextSnippets']>[number];

	let props = $props<{ modeId: ProgressionVariantId }>();

	let variant = $derived(progressionVariantsById[props.modeId as ProgressionVariantId]);
	let stepIndex = $state(0);
	let answer = $state('');
	let keptSnippetIds = $state<string[]>([]);
	let submissions = $state<Array<{ prompt: string; answer: string; score: number; note: string }>>(
		[]
	);

	let step = $derived(variant.steps[Math.min(stepIndex, variant.steps.length - 1)]);
	let totalScore = $derived(
		submissions.length === 0
			? 0
			: Math.round(
					submissions.reduce((sum, submission) => sum + submission.score, 0) / submissions.length
				)
	);
	let levelName = $derived(
		variant.levelNames[
			Math.min(
				variant.levelNames.length - 1,
				Math.floor((totalScore / 100) * variant.levelNames.length)
			)
		] ?? variant.levelNames[0]
	);
	let completed = $derived(stepIndex >= variant.steps.length);
	let currentQueue = $derived(variant.steps.slice(stepIndex));

	function includesTerm(value: string, term: string): boolean {
		return value.toLowerCase().includes(term.toLowerCase());
	}

	function toggleSnippet(id: string): void {
		keptSnippetIds = keptSnippetIds.includes(id)
			? keptSnippetIds.filter((candidate) => candidate !== id)
			: [...keptSnippetIds, id];
	}

	function scoreCurrentAnswer(): { score: number; note: string } {
		const expectedScore =
			step.expectedTerms.length === 0
				? 1
				: step.expectedTerms.filter((term: string) => includesTerm(answer, term)).length /
					step.expectedTerms.length;
		const forbiddenScore =
			!step.forbiddenTerms || step.forbiddenTerms.length === 0
				? 1
				: step.forbiddenTerms.filter((term: string) => !includesTerm(answer, term)).length /
					step.forbiddenTerms.length;
		const snippets = step.contextSnippets ?? [];
		const relevantSnippets = snippets.filter((snippet: ContextSnippet) => snippet.relevant);
		const distractorSnippets = snippets.filter((snippet: ContextSnippet) => !snippet.relevant);
		const relevantSnippetScore =
			relevantSnippets.length === 0
				? 1
				: relevantSnippets.filter((snippet: ContextSnippet) => keptSnippetIds.includes(snippet.id))
						.length / relevantSnippets.length;
		const distractorSnippetScore =
			distractorSnippets.length === 0
				? 1
				: distractorSnippets.filter(
						(snippet: ContextSnippet) => !keptSnippetIds.includes(snippet.id)
					).length / distractorSnippets.length;
		const snippetScore =
			snippets.length === 0 ? 1 : relevantSnippetScore * 0.65 + distractorSnippetScore * 0.35;
		const toolScore =
			step.prompt.toLowerCase().includes('tool') || step.prompt.toLowerCase().includes('wikipedia')
				? answer.includes('/tool') || answer.toLowerCase().includes('wikipedia')
					? 1
					: 0.45
				: 1;
		const score = Math.round(
			100 * (expectedScore * 0.42 + forbiddenScore * 0.24 + snippetScore * 0.2 + toolScore * 0.14)
		);

		if (expectedScore < 1) {
			return { score, note: 'You missed the key fact the harness wanted.' };
		}
		if (forbiddenScore < 1) {
			return { score, note: 'You repeated a forbidden distractor or leaked protected context.' };
		}
		if (snippetScore < 1) {
			return { score, note: 'The compaction pass kept or dropped the wrong context.' };
		}
		if (toolScore < 1) {
			return { score, note: 'The round expected tool-shaped behavior.' };
		}

		return { score, note: 'Clean turn. You kept the harness under control.' };
	}

	function submitCurrentAnswer(): void {
		if (!answer.trim() || completed) {
			return;
		}

		const result = scoreCurrentAnswer();
		submissions = [
			...submissions,
			{
				prompt: step.prompt,
				answer: answer.trim(),
				score: result.score,
				note: result.note
			}
		];
		answer = '';
		keptSnippetIds = [];
		stepIndex += 1;
	}

	function submitAnswer(event: SubmitEvent): void {
		event.preventDefault();
		submitCurrentAnswer();
	}

	function submitOnEnter(event: KeyboardEvent): void {
		if (event.key !== 'Enter' || event.shiftKey) {
			return;
		}

		event.preventDefault();
		submitCurrentAnswer();
	}
</script>

<svelte:head>
	<title>ChatPLS - {variant.title}</title>
</svelte:head>

<main class="progression-shell">
	<aside class="rail">
		<a href={resolve('/')} class="brand"><Logo /></a>
		<section>
			<p class="eyebrow">Progression labs</p>
			{#each progressionVariants as item (item.id)}
				<a class:active={item.id === variant.id} href={resolve(item.path)}>{item.title}</a>
			{/each}
		</section>
		<section>
			<p class="eyebrow">Mechanic</p>
			<p>{variant.mechanic}</p>
		</section>
	</aside>

	<section class="stage">
		<header>
			<div>
				<p class="eyebrow">Context</p>
				<h1>{variant.title}</h1>
				<p>{variant.tagline}</p>
			</div>
			<div class="context-meter">{Math.max(8, 97 - submissions.length * 12)}% remaining</div>
		</header>

		<section class="system-box">
			<p class="eyebrow">System prompt</p>
			<p>You are ChatPLS. Serve many users inside one context. Be accurate, grounded, and calm.</p>
			<p>Current rule: {completed ? 'Scenario complete.' : step.systemRule}</p>
		</section>

		{#if variant.id === 'ladder'}
			<section class="ladder" aria-label="Skill ladder">
				{#each variant.levelNames as level, index (level)}
					<div class:unlocked={index <= submissions.length}>{level}</div>
				{/each}
			</section>
		{/if}

		{#if variant.id === 'context' && !completed && step.contextSnippets}
			<section class="snippets" aria-label="Context snippets">
				<p class="eyebrow">Choose context to keep</p>
				{#each step.contextSnippets as snippet (snippet.id)}
					<button
						type="button"
						class:kept={keptSnippetIds.includes(snippet.id)}
						onclick={() => toggleSnippet(snippet.id)}
					>
						<strong>{snippet.label}</strong>
						<span>{snippet.body}</span>
					</button>
				{/each}
			</section>
		{/if}

		<section class="conversation" aria-label="Conversation">
			{#each submissions as submission, index (`${index}-${submission.prompt}`)}
				<article class="user">
					<p class="eyebrow">user</p>
					<p>{submission.prompt}</p>
				</article>
				<article class="assistant">
					<p class="eyebrow">assistant</p>
					<p>{submission.answer}</p>
				</article>
			{/each}

			{#if !completed}
				<article class="user pending">
					<p class="eyebrow">{step.user} - {step.userRole}</p>
					<p>{step.prompt}</p>
				</article>
			{:else}
				<article class="complete">
					<p class="eyebrow">run complete</p>
					<p>You survived this progression experiment. Try another lab from the left rail.</p>
				</article>
			{/if}
		</section>

		<form class="reply-box" onsubmit={submitAnswer}>
			<label>
				<span class="eyebrow">Your answer</span>
				<textarea
					bind:value={answer}
					disabled={completed}
					onkeydown={submitOnEnter}
					placeholder="Reply as the language system. Enter submits, Shift+Enter adds a line."
					rows="4"
				></textarea>
			</label>
			<div>
				<button type="submit" disabled={completed || !answer.trim()}>Submit</button>
				<a href={resolve('/app')}>Back to main app</a>
			</div>
		</form>
	</section>

	<aside class="stats">
		<section>
			<p class="eyebrow">Game stats</p>
			<p><strong>Level:</strong> {levelName}</p>
			<p><strong>Turns:</strong> {submissions.length}/{variant.steps.length}</p>
			<p><strong>Score:</strong> {submissions.length ? totalScore : '-'}</p>
			<p><strong>Rating:</strong> {variant.rating}/10 concept fit</p>
		</section>

		<section>
			<p class="eyebrow">Latest feedback</p>
			<p>{submissions.at(-1)?.note ?? 'No answer scored yet.'}</p>
			<p class="coach">{completed ? 'Try the next progression lab.' : step.coach}</p>
		</section>

		<section>
			<p class="eyebrow">Model leaderboard</p>
			{#each variant.modelScores as row (row.id)}
				<p class="score-row">
					<span>{row.id}</span>
					<strong>{row.score}</strong>
				</p>
			{/each}
			<p class="score-row you">
				<span>you</span>
				<strong>{submissions.length ? totalScore : '?'}</strong>
			</p>
		</section>

		{#if variant.id === 'queue'}
			<section>
				<p class="eyebrow">User queue</p>
				{#each currentQueue as queued (queued.id)}
					<p>{queued.user}: {queued.userRole}</p>
				{/each}
			</section>
		{/if}

		<section>
			<p class="eyebrow">Design note</p>
			<p><strong>Best for:</strong> {variant.bestFor}</p>
			<p><strong>Risk:</strong> {variant.risk}</p>
		</section>
	</aside>
</main>

<style>
	.progression-shell {
		min-block-size: 100dvh;
		display: grid;
		grid-template-columns: 250px minmax(0, 1fr) 270px;
		background: var(--bg-color);
		color: var(--fg-color);
	}

	.rail,
	.stage,
	.stats {
		background: #fff;
		border: 1px solid var(--app-panel-stroke-color);
	}

	.rail,
	.stats {
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.rail {
		border-inline-end: 0;
	}

	.stats {
		border-inline-start: 0;
	}

	.stage {
		min-block-size: 100dvh;
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		box-shadow: 8px 8px 0 #666;
	}

	.brand {
		display: inline-flex;
	}

	.rail section,
	.stats section {
		display: grid;
		gap: 10px;
	}

	.rail a:not(.brand) {
		padding: 10px 12px;
	}

	.rail a.active,
	.rail a:hover {
		background: var(--bg-color);
	}

	header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
	}

	h1 {
		font-size: 34px;
		margin: 0 0 8px;
		line-height: 1.1;
	}

	.eyebrow {
		color: var(--gray-500);
		font-size: 14px;
		margin-block-end: 6px;
	}

	.context-meter {
		white-space: nowrap;
	}

	.system-box,
	.conversation article,
	.snippets button {
		border: 1px solid #d2d2d2;
		padding: 14px;
	}

	.system-box {
		background: #ebebeb;
	}

	.ladder {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}

	.ladder div {
		border: 1px solid #c8c8c8;
		padding: 10px;
		color: #9b9b9b;
	}

	.ladder .unlocked {
		color: var(--fg-color);
		background: #f4f7ff;
		box-shadow: 3px 3px 0 #666;
	}

	.snippets {
		display: grid;
		gap: 10px;
	}

	.snippets button {
		background: #fff;
		color: inherit;
		text-align: start;
		font-family: inherit;
		cursor: pointer;
	}

	.snippets button.kept {
		background: #f4f7ff;
		box-shadow: 4px 4px 0 #666;
	}

	.snippets span {
		display: block;
		margin-block-start: 6px;
		color: #58606f;
	}

	.conversation {
		display: grid;
		gap: 10px;
	}

	.assistant {
		background: #f7f7ff;
	}

	.pending {
		border-color: var(--app-panel-stroke-color);
	}

	.complete {
		background: #f4f4f4;
	}

	.reply-box {
		margin-block-start: auto;
		display: grid;
		gap: 12px;
	}

	label {
		display: grid;
		gap: 8px;
	}

	textarea {
		width: 100%;
		min-block-size: 120px;
		border: 1px solid var(--app-panel-stroke-color);
		padding: 10px;
		font: inherit;
	}

	button,
	.reply-box a {
		display: inline-flex;
		align-items: center;
		background: #3f4bd8;
		color: #fff;
		border: 1px solid #1f2794;
		border-radius: 3px;
		box-shadow: 3px 3px 0 #2a2f7f;
		padding: 8px 14px;
		font: inherit;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.reply-box div {
		display: flex;
		gap: 12px;
	}

	.score-row {
		display: flex;
		justify-content: space-between;
		border-block-end: 1px dotted #c7c7c7;
	}

	.you {
		font-weight: 700;
	}

	.coach {
		color: #58606f;
	}

	@media (max-width: 980px) {
		.progression-shell {
			grid-template-columns: minmax(0, 1fr);
		}

		.rail,
		.stats {
			border: 1px solid var(--app-panel-stroke-color);
		}

		.stage {
			min-block-size: auto;
			box-shadow: none;
		}
	}
</style>
