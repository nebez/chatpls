<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
	import { runLevelScenario, type LevelScenarioRunResult } from '$lib/gameplay/run-level-scenario';
	import { createLocalSemanticScorer } from '$lib/gameplay/semantic/local-semantic-scorer';
	import type { LevelScenarioPlayerTurnInput } from '$lib/gameplay/run-level-scenario';
	import { parseToolCallsFromAnswer } from '$lib/gameplay/tools/parse-tool-calls';
	import type { ToolName } from '$lib/levels/types';
	import { levelScenarios } from '$lib/levels/scenarios';

	const semanticScorer = createLocalSemanticScorer();
	const modelRows = [
		{ id: 'gpt-5.2', status: 'done', score: 89 },
		{ id: 'sonnet-4.5', status: 'done', score: 86 },
		{ id: 'qwen-3.5', status: 'sim', score: 74 },
		{ id: 'nova-2', status: 'err', score: 41 }
	];

	let selectedScenarioId = $state(levelScenarios[0]?.id ?? '');
	let answer = $state('');
	let toolQuery = $state('');
	let playerTurns = $state<LevelScenarioPlayerTurnInput[]>([]);
	let result = $state<LevelScenarioRunResult | null>(null);
	let isScoring = $state(false);
	let errorMessage = $state('');

	let scenario = $derived(
		levelScenarios.find((candidate) => candidate.id === selectedScenarioId) ?? levelScenarios[0]
	);
	let currentTurnId = $derived(result?.currentTurnId ?? scenario.entryTurnId);
	let currentTurn = $derived(scenario.turns.find((turn) => turn.id === currentTurnId) ?? null);
	let availableTools = $derived(currentTurn?.allowedTools ?? currentTurn?.requiredTools ?? []);
	let latestTurn = $derived(result?.turnResults.at(-1) ?? null);
	let gameScore = $derived(Math.round(result?.score ?? 0));
	let conversationItems = $derived([
		...(result?.transcript.filter((item) => item.role !== 'system') ?? []),
		...(currentTurn ? [{ role: 'user' as const, content: currentTurn.prompt, pending: true }] : [])
	]);
	let contextRemaining = $derived(
		Math.max(
			0,
			100 -
				Math.round(
					(scenario.systemPrompt.length +
						(result?.transcript.reduce((total, item) => total + item.content.length, 0) ??
							currentTurn?.prompt.length ??
							0)) /
						80
				)
		)
	);

	function hasTool(tool: ToolName): boolean {
		return availableTools.includes(tool);
	}

	function resetScenario(): void {
		answer = '';
		toolQuery = '';
		playerTurns = [];
		result = null;
		errorMessage = '';
	}

	function feedbackText(): string {
		if (errorMessage) {
			return errorMessage;
		}

		if (!result) {
			return 'Ami says: read the whole context. The user is not always your friend.';
		}

		if (result.endState === 'waiting_for_player') {
			return 'Next user turn loaded. Do not let recency bully your facts.';
		}

		if (gameScore >= 85) {
			return 'Clean run. You kept the harness intact.';
		}

		if (gameScore >= 60) {
			return 'Survivable. The scoring panel shows where the harness bent.';
		}

		return 'Classic failure mode. Check facts, tools, and instruction hierarchy.';
	}

	async function submitCurrentAnswer(): Promise<void> {
		const parsedAnswer = parseToolCallsFromAnswer(answer);
		const trimmedAnswer = parsedAnswer.answerText || answer.trim();

		if (!trimmedAnswer || !currentTurn || isScoring) {
			return;
		}

		if (parsedAnswer.errors.length > 0) {
			errorMessage = parsedAnswer.errors.join(' ');
			return;
		}

		const turnInput: LevelScenarioPlayerTurnInput = { answer: trimmedAnswer };
		if (parsedAnswer.toolCalls.length > 0) {
			turnInput.toolCalls = parsedAnswer.toolCalls;
		}

		if (hasTool('search_internal_sites') && toolQuery.trim()) {
			turnInput.toolCalls = [
				...(turnInput.toolCalls ?? []),
				{
					name: 'search_internal_sites',
					args: { query: toolQuery.trim() }
				}
			];
		}

		const nextTurns = [...playerTurns, turnInput];
		isScoring = true;
		errorMessage = '';

		try {
			result = await runLevelScenario(
				{
					scenario,
					playerTurns: nextTurns
				},
				{ semanticScorer }
			);
			playerTurns = nextTurns;
			answer = '';
			toolQuery = '';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Scoring failed.';
		} finally {
			isScoring = false;
		}
	}

	async function submitAnswer(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		await submitCurrentAnswer();
	}

	function submitOnEnter(event: KeyboardEvent): void {
		if (event.key !== 'Enter' || event.shiftKey) {
			return;
		}

		event.preventDefault();
		void submitCurrentAnswer();
	}
</script>

<svelte:head>
	<title>ChatPLS App</title>
</svelte:head>

<main class="game-shell">
	<aside class="side-panel side-panel-left" aria-label="Scenario navigation">
		<a href={resolve('/')} class="brand">
			<Logo />
		</a>

		<section class="meta-block">
			<p class="eyebrow">Metadata</p>
			<p><strong>Scenario:</strong> {scenario.title}</p>
			<p><strong>Env:</strong> Browser harness</p>
			<p><strong>Tier:</strong> Intern</p>
			<p><strong>Mode:</strong> Player-as-Language System</p>
		</section>

		<section class="scenario-list" aria-label="Playable scenarios">
			<p class="eyebrow">Conversations ({levelScenarios.length})</p>
			{#each levelScenarios as item, index}
				<button
					type="button"
					class:active={item.id === selectedScenarioId}
					onclick={() => {
						selectedScenarioId = item.id;
						resetScenario();
					}}
				>
					<span>{index + 1}</span>
					{item.title}
				</button>
			{/each}
		</section>
	</aside>

	<section class="play-panel" aria-label="Scenario play area">
		<header class="play-header">
			<div>
				<p class="eyebrow">Context</p>
				<h1>{scenario.title}</h1>
			</div>
			<div class="header-actions">
				<span>{contextRemaining}% remaining</span>
				<a href={resolve('/app/help')}>Help</a>
			</div>
		</header>

		<section class="context-box" aria-label="System prompt">
			<p class="box-label">System prompt</p>
			<pre>{scenario.systemPrompt}</pre>
		</section>

		<section class="transcript" aria-label="Conversation">
			{#each conversationItems as item}
				<article class={[item.role, 'pending' in item && item.pending ? 'pending' : '']}>
					<p class="eyebrow">{item.role}{'pending' in item && item.pending ? ' turn' : ''}</p>
					<p>{item.content}</p>
				</article>
			{/each}
			{#if !currentTurn}
				<article class="complete">
					<p class="eyebrow">scenario</p>
					<p>Scenario complete. Reset or pick another conversation.</p>
				</article>
			{/if}
		</section>

		<form class="answer-form" onsubmit={submitAnswer}>
			{#if currentTurn && availableTools.length > 0}
				<section class="tool-box" aria-label="Available tools">
					<p class="eyebrow">Available tools</p>
					{#if hasTool('search_internal_sites')}
						<label>
							search_internal_sites query
							<input bind:value={toolQuery} placeholder="try: ABC finance" autocomplete="off" />
						</label>
						<p class="tool-hint">
							Hard mode:
							<code>/tool search_internal_sites {'{"query":"ABC finance"}'}</code>
						</p>
					{:else}
						<p>{availableTools.join(', ')}</p>
					{/if}
				</section>
			{/if}

			<label>
				<span class="eyebrow">Your answer</span>
				<textarea
					bind:value={answer}
					disabled={!currentTurn || isScoring}
					placeholder="Answer like the harness is watching."
					rows="4"
					onkeydown={submitOnEnter}
				></textarea>
			</label>

			<div class="form-actions">
				<button type="submit" disabled={!currentTurn || !answer.trim() || isScoring}>
					{isScoring ? 'Scoring...' : 'Submit'}
				</button>
				<button type="button" class="secondary" onclick={resetScenario}>Reset</button>
			</div>
		</form>

		<div class="agent-callout" aria-label="Agent manager message">
			<div class="robot" aria-hidden="true">:)</div>
			<p>{feedbackText()}</p>
		</div>
	</section>

	<aside class="side-panel side-panel-right" aria-label="Stats">
		<section>
			<p class="eyebrow">Game stats</p>
			<p><strong>Status:</strong> {result?.endState ?? 'ready'}</p>
			<p><strong>Level:</strong> Intern</p>
			<p><strong>Turns:</strong> {result?.turnsCompleted ?? 0}</p>
			<p><strong>Score:</strong> {result ? `${gameScore}` : '-'}</p>
		</section>

		<section>
			<p class="eyebrow">Score components</p>
			{#if latestTurn}
				{#each Object.entries(latestTurn.componentScores).filter(([, value]) => value > 0) as [key, value]}
					<p class="score-row">
						<span>{key}</span>
						<strong>{Math.round(value * 100)}%</strong>
					</p>
				{/each}
			{:else}
				<p>Submit an answer to see how the harness scores you.</p>
			{/if}
		</section>

		<section>
			<p class="eyebrow">Browser model stats</p>
			<p><strong>Model:</strong> local scorer</p>
			<p><strong>Status:</strong> Ready</p>
			<p><strong>Embedding:</strong> token fallback</p>
		</section>

		<section>
			<p class="eyebrow">Model leaderboard</p>
			{#each modelRows as row}
				<p class="score-row">
					<span>{row.id}</span>
					<strong class={row.status}>{row.score}</strong>
				</p>
			{/each}
			<p class="score-row you">
				<span>you</span>
				<strong>{result ? gameScore : '?'}</strong>
			</p>
		</section>
	</aside>
</main>

<style>
	.game-shell {
		min-block-size: 100dvh;
		display: grid;
		grid-template-columns: minmax(210px, 260px) minmax(0, 1fr) minmax(210px, 260px);
		background: var(--bg-color);
		color: var(--fg-color);
	}

	.side-panel,
	.play-panel {
		border: 1px solid var(--app-panel-stroke-color);
		background: var(--app-panel-bg-color);
	}

	.side-panel {
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.side-panel-left {
		border-inline-end: 0;
	}

	.side-panel-right {
		border-inline-start: 0;
		gap: 30px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
	}

	.play-panel {
		min-block-size: 100dvh;
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 22px;
		box-shadow: 8px 8px 0 #666;
	}

	.play-header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 20px;
	}

	h1 {
		font-size: 24px;
		line-height: 1.1;
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 18px;
		white-space: nowrap;
	}

	.header-actions a,
	button {
		background: #3f4bd8;
		color: #fff;
		border: 1px solid #1f2794;
		border-radius: 3px;
		box-shadow: 3px 3px 0 #2a2f7f;
		padding: 8px 14px;
		font-family: inherit;
		font-size: 16px;
		cursor: pointer;
	}

	button.secondary {
		background: #fff;
		color: var(--fg-color);
		border-color: var(--app-panel-stroke-color);
		box-shadow: 3px 3px 0 #666;
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.eyebrow,
	.box-label {
		color: var(--gray-500);
		font-size: 14px;
		margin-block-end: 8px;
	}

	.meta-block,
	.scenario-list,
	.side-panel section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.scenario-list button {
		width: 100%;
		display: flex;
		gap: 10px;
		align-items: center;
		text-align: start;
		background: transparent;
		color: inherit;
		border: 0;
		box-shadow: none;
		padding: 10px 12px;
	}

	.scenario-list button.active,
	.scenario-list button:hover {
		background: var(--bg-color);
	}

	.context-box {
		background: #ebebeb;
		border: 1px solid #c8c8c8;
		padding: 14px;
	}

	pre {
		white-space: pre-wrap;
		font-family: inherit;
		font-size: 15px;
		line-height: 1.35;
		margin: 0;
	}

	.tool-box,
	.transcript article {
		border: 1px solid #d2d2d2;
		padding: 14px;
	}

	.transcript {
		display: grid;
		gap: 10px;
	}

	.transcript .assistant {
		background: #f7f7ff;
	}

	.transcript .tool {
		background: #f4fbf4;
	}

	.transcript .pending {
		border-color: var(--app-panel-stroke-color);
		background: #fff;
	}

	.transcript .complete {
		background: #f4f4f4;
	}

	.answer-form {
		margin-block-start: auto;
		display: grid;
		gap: 14px;
	}

	label {
		display: grid;
		gap: 8px;
	}

	input,
	textarea {
		width: 100%;
		border: 1px solid var(--app-panel-stroke-color);
		background: #fff;
		color: var(--fg-color);
		font-family: inherit;
		font-size: 16px;
		padding: 10px;
	}

	textarea {
		resize: vertical;
		min-block-size: 110px;
	}

	code {
		background: #eee;
		padding: 2px 4px;
	}

	.tool-hint {
		color: #58606f;
		font-size: 14px;
		line-height: 1.35;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.agent-callout {
		align-self: end;
		display: flex;
		align-items: end;
		gap: 12px;
		max-inline-size: 520px;
	}

	.robot {
		flex: none;
		border: 4px solid #4a4a4a;
		inline-size: 58px;
		block-size: 48px;
		display: grid;
		place-items: center;
		box-shadow: 5px 5px 0 #666;
		font-weight: 700;
	}

	.agent-callout p {
		border: 1px solid var(--app-panel-stroke-color);
		background: #fff;
		padding: 14px;
		box-shadow: 5px 5px 0 #666;
	}

	.score-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		border-block-end: 1px dotted #c7c7c7;
		padding-block-end: 3px;
	}

	.done,
	.sim {
		color: #267a1f;
	}

	.err {
		color: #a40000;
	}

	.you {
		font-weight: 700;
	}

	@media (max-width: 920px) {
		.game-shell {
			grid-template-columns: minmax(0, 1fr);
		}

		.side-panel-left,
		.side-panel-right {
			border: 1px solid var(--app-panel-stroke-color);
		}

		.play-panel {
			min-block-size: auto;
			box-shadow: none;
		}
	}
</style>
